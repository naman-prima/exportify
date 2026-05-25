import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { SupabaseService } from '../supabase/supabase.service';
import {
  ExportFormat,
  ExportSheetConfig,
  CreateExportJobDto,
  ColumnDef,
  getColumnDefs,
  getColumnGroups,
  getDefaultColumns,
  PRODUCT_COLUMNS,
  ORDER_COLUMNS,
  ExportEntityType,
  MONEY_COLUMN_KEYS,
  TIMESTAMP_COLUMN_KEYS,
} from './export.types';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);
  private readonly apiBaseUrl: string;
  private readonly exportsDir: string;

  constructor(
    private configService: ConfigService,
    private supabase: SupabaseService,
  ) {
    this.apiBaseUrl = this.configService.get<string>('RATIO_API_BASE_URL');
    this.exportsDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(this.exportsDir)) {
      fs.mkdirSync(this.exportsDir, { recursive: true });
    }
  }

  private getHeaders(accessToken: string) {
    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  // ─── Column metadata ───

  getAvailableColumns(entity: ExportEntityType) {
    return {
      entity,
      groups: getColumnGroups(entity),
      defaultColumns: getDefaultColumns(entity),
      allColumns: entity === 'products' ? PRODUCT_COLUMNS : ORDER_COLUMNS,
    };
  }

  // ─── Job management ───

  async getJobs(merchantId: string) {
    return this.supabase.getJobsByMerchant(merchantId);
  }

  async getJob(jobId: string) {
    return this.supabase.getJobWithSheets(jobId);
  }

  async cancelJob(jobId: string) {
    await this.supabase.updateJobStatus(jobId, { status: 'cancelled' });
    return this.supabase.getJobWithSheets(jobId);
  }

  async getDownloadUrl(jobId: string) {
    const job = await this.supabase.getJobWithSheets(jobId);
    if (!job || job.status !== 'completed' || !job.file_url) return null;
    return this.supabase.getSignedUrl(job.file_url, 3600);
  }

  // ─── Create and run export ───

  async createExportJob(merchantId: string, dto: CreateExportJobDto) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = dto.fileName || `exportify-${timestamp}`;

    const job = await this.supabase.createExportJob({
      merchant_id: merchantId,
      format: dto.format || 'xlsx',
      file_name: fileName,
      sheets: dto.sheets.map((s) => ({
        entity: s.entity,
        columns: s.columns || getDefaultColumns(s.entity),
        filters: s.filters,
      })),
    });

    if (!job) throw new Error('Failed to create export job');

    // Run async — don't block the response
    this.runExport(job.id, merchantId, dto.format || 'xlsx', fileName).catch((err) => {
      this.logger.error(`Export job ${job.id} failed: ${err.message}`);
      this.supabase.updateJobStatus(job.id, {
        status: 'failed',
        error_message: err.message,
      });
    });

    return this.supabase.getJobWithSheets(job.id);
  }

  private async runExport(
    jobId: string,
    merchantId: string,
    format: ExportFormat,
    fileName: string,
  ) {
    await this.supabase.updateJobStatus(jobId, {
      status: 'running',
      started_at: new Date().toISOString(),
    });

    const merchant = await this.supabase.getMerchant(merchantId);
    if (!merchant) throw new Error('Merchant not found');

    const job = await this.supabase.getJobWithSheets(jobId);
    const sheets = job.export_job_sheets || [];

    const sheetDataMap: Map<string, { columns: ColumnDef[]; rows: any[][] }> = new Map();

    for (const sheet of sheets) {
      // Check if job was cancelled
      const currentJob = await this.supabase.getJobWithSheets(jobId);
      if (currentJob?.status === 'cancelled') return;

      const columns = getColumnDefs(sheet.entity, sheet.columns);
      const needsVariants =
        sheet.entity === 'products' && columns.some((c) => c.path.startsWith('variants[]'));

      const queryParams = this.buildQueryParams(sheet.filters || []);
      if (needsVariants) queryParams.show_variants = 'true';

      // Fetch all pages (100 at a time)
      const allItems = await this.fetchAllPages(
        sheet.entity,
        queryParams,
        merchant.access_token,
        sheet.id,
        jobId,
      );

      // Apply client-side date filters (API doesn't support date filtering)
      const filteredItems = this.applyDateFilters(allItems, sheet.filters || []);

      const rows = this.flattenToRows(filteredItems, columns, sheet.entity);

      await this.supabase.updateSheetProgress(sheet.id, { exported_rows: rows.length });

      sheetDataMap.set(sheet.entity, { columns, rows });
    }

    // Generate file
    const filePath = await this.generateFile(jobId, format, fileName, sheetDataMap, sheets);
    const fileSize = fs.statSync(filePath).size;

    // Upload to Supabase Storage
    const ext = format === 'xlsx' ? '.xlsx' : '.csv';
    const contentType =
      format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv';
    const storagePath = `${merchantId}/${jobId}/${fileName}${ext}`;

    await this.supabase.uploadExportFile(filePath, storagePath, contentType);

    await this.supabase.updateJobStatus(jobId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      file_url: storagePath,
      file_size_bytes: fileSize,
    });

    // Clean up local file
    fs.unlinkSync(filePath);

    this.logger.log(`Export job ${jobId} completed, uploaded to ${storagePath}`);
  }

  // ─── Fetch all pages (100 at a time) ───

  private async fetchAllPages(
    entity: ExportEntityType,
    queryParams: Record<string, string>,
    accessToken: string,
    sheetId: string,
    jobId: string,
  ): Promise<any[]> {
    const allItems: any[] = [];
    let page = 1;
    const limit = 100;

    const firstResponse = await this.fetchPage(entity, { ...queryParams, page: '1', limit: String(limit) }, accessToken);
    const items = this.extractItems(firstResponse, entity);
    allItems.push(...items);

    const pagination = firstResponse?.pagination || firstResponse?.meta;
    const total = pagination?.total || pagination?.totalCount || items.length;

    await this.supabase.updateSheetProgress(sheetId, {
      total_items: total,
      processed_items: items.length,
    });

    this.logger.log(`${entity}: page 1, ${items.length} items, total: ${total}`);

    if (total > limit) {
      const totalPages = Math.ceil(total / limit);
      for (page = 2; page <= totalPages; page++) {
        // Check cancellation every 5 pages
        if (page % 5 === 0) {
          const currentJob = await this.supabase.getJobWithSheets(jobId);
          if (currentJob?.status === 'cancelled') break;
        }

        const response = await this.fetchPage(
          entity,
          { ...queryParams, page: String(page), limit: String(limit) },
          accessToken,
        );
        const pageItems = this.extractItems(response, entity);
        allItems.push(...pageItems);

        await this.supabase.updateSheetProgress(sheetId, {
          processed_items: allItems.length,
        });

        this.logger.log(`${entity}: page ${page}/${totalPages}, ${pageItems.length} items`);
      }
    }

    return allItems;
  }

  private async fetchPage(
    entity: ExportEntityType,
    params: Record<string, string>,
    accessToken: string,
  ): Promise<any> {
    const endpoint = entity === 'products' ? '/api/v1/products' : '/api/v1/orders';
    const response = await axios.get(`${this.apiBaseUrl}${endpoint}`, {
      headers: this.getHeaders(accessToken),
      params,
    });
    return response.data;
  }

  private extractItems(response: any, entity: ExportEntityType): any[] {
    if (Array.isArray(response)) return response;
    if (response?.data && Array.isArray(response.data)) return response.data;
    if (response?.products && Array.isArray(response.products)) return response.products;
    if (response?.orders && Array.isArray(response.orders)) return response.orders;
    if (response?.items && Array.isArray(response.items)) return response.items;
    return [];
  }

  // ─── Build query params from filters (exclude date filters — handled client-side) ───

  private static DATE_FILTER_FIELDS = new Set(['created_at_min', 'created_at_max', 'updated_at_min', 'updated_at_max']);

  private buildQueryParams(filters: any[]): Record<string, string> {
    const params: Record<string, string> = {};
    if (!filters) return params;
    for (const filter of filters) {
      if (!ExportService.DATE_FILTER_FIELDS.has(filter.field)) {
        params[filter.field] = filter.value;
      }
    }
    return params;
  }

  // ─── Client-side date filtering ───

  private applyDateFilters(items: any[], filters: any[]): any[] {
    if (!filters || filters.length === 0) return items;

    const createdMin = filters.find((f) => f.field === 'created_at_min')?.value;
    const createdMax = filters.find((f) => f.field === 'created_at_max')?.value;
    const updatedMin = filters.find((f) => f.field === 'updated_at_min')?.value;
    const updatedMax = filters.find((f) => f.field === 'updated_at_max')?.value;

    if (!createdMin && !createdMax && !updatedMin && !updatedMax) return items;

    const minDate = createdMin ? new Date(createdMin).getTime() : null;
    const maxDate = createdMax ? new Date(createdMax + 'T23:59:59.999Z').getTime() : null;
    const uMinDate = updatedMin ? new Date(updatedMin).getTime() : null;
    const uMaxDate = updatedMax ? new Date(updatedMax + 'T23:59:59.999Z').getTime() : null;

    const filtered = items.filter((item) => {
      const created = item.created_at ? new Date(item.created_at).getTime() : null;
      const updated = item.updated_at ? new Date(item.updated_at).getTime() : null;

      if (minDate && created && created < minDate) return false;
      if (maxDate && created && created > maxDate) return false;
      if (uMinDate && updated && updated < uMinDate) return false;
      if (uMaxDate && updated && updated > uMaxDate) return false;
      return true;
    });

    this.logger.log(`Date filter: ${items.length} → ${filtered.length} items`);
    return filtered;
  }

  // ─── Flatten items to rows (Matrixify multi-row style) ───

  private flattenToRows(items: any[], columns: ColumnDef[], entity: ExportEntityType): any[][] {
    const rows: any[][] = [];

    for (const item of items) {
      const arrayFields = this.detectArrayFields(columns);

      if (arrayFields.length === 0) {
        rows.push(this.extractRow(item, columns, null, null));
      } else {
        const primaryArrayField = arrayFields[0];
        const arrayData: any[] = this.getNestedValue(item, primaryArrayField) || [];

        if (arrayData.length === 0) {
          rows.push(this.extractRow(item, columns, null, null));
        } else {
          for (let i = 0; i < arrayData.length; i++) {
            rows.push(this.extractRow(item, columns, arrayData[i], i === 0 ? null : primaryArrayField));
          }
        }
      }
    }

    return rows;
  }

  private detectArrayFields(columns: ColumnDef[]): string[] {
    const arrayPaths = new Set<string>();
    for (const col of columns) {
      const match = col.path.match(/^(\w+)\[\]/);
      if (match) arrayPaths.add(match[1]);
    }
    return Array.from(arrayPaths);
  }

  private extractRow(
    item: any,
    columns: ColumnDef[],
    arrayItem: any | null,
    skipParentIfArrayField: string | null,
  ): any[] {
    return columns.map((col) => {
      const isMoney = MONEY_COLUMN_KEYS.has(col.key);
      const isTimestamp = TIMESTAMP_COLUMN_KEYS.has(col.key);
      const arrayMatch = col.path.match(/^(\w+)\[\]\.(.+)$/);

      if (arrayMatch) {
        if (arrayItem) {
          const val = this.getNestedValue(arrayItem, arrayMatch[2]) ?? '';
          if (isMoney) return this.paisaToRupees(val);
          if (isTimestamp) return this.utcToIst(val);
          return val;
        }
        return '';
      }

      if (skipParentIfArrayField) {
        if (col.key === 'id' || col.key === 'order_number') {
          return this.getNestedValue(item, col.path) ?? '';
        }
        return '';
      }

      const raw = this.getNestedValue(item, col.path);
      if (Array.isArray(raw)) {
        return raw.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(', ');
      }
      if (isMoney) return this.paisaToRupees(raw);
      if (isTimestamp) return this.utcToIst(raw);
      return raw ?? '';
    });
  }

  private utcToIst(val: any): string {
    if (val == null || val === '') return '';
    try {
      const date = new Date(val);
      if (isNaN(date.getTime())) return String(val);
      return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch {
      return String(val);
    }
  }

  private paisaToRupees(val: any): number | string {
    if (val == null || val === '') return '';
    const num = typeof val === 'string' ? parseFloat(val) : Number(val);
    if (isNaN(num)) return val;
    return parseFloat((num / 100).toFixed(2));
  }

  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current == null) return undefined;
      current = current[part];
    }
    return current;
  }

  // ─── File generation ───

  private async generateFile(
    jobId: string,
    format: ExportFormat,
    fileName: string,
    sheetDataMap: Map<string, { columns: ColumnDef[]; rows: any[][] }>,
    sheets: any[],
  ): Promise<string> {
    if (format === 'xlsx') {
      return this.generateXlsx(jobId, fileName, sheetDataMap, sheets);
    }
    return this.generateCsv(jobId, fileName, sheetDataMap, sheets);
  }

  private async generateXlsx(
    jobId: string,
    fileName: string,
    sheetDataMap: Map<string, { columns: ColumnDef[]; rows: any[][] }>,
    sheets: any[],
  ): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Exportify';
    workbook.created = new Date();

    // Export Summary sheet
    const summarySheet = workbook.addWorksheet('Export Summary');
    summarySheet.columns = [
      { header: 'Property', key: 'property', width: 25 },
      { header: 'Value', key: 'value', width: 50 },
    ];
    summarySheet.addRows([
      { property: 'Job ID', value: jobId },
      { property: 'Created At', value: new Date().toISOString() },
      { property: 'Format', value: 'XLSX' },
      { property: 'Sheets', value: sheets.map((s) => s.entity).join(', ') },
    ]);
    for (const sheet of sheets) {
      const data = sheetDataMap.get(sheet.entity);
      if (data) {
        summarySheet.addRow({ property: `${sheet.entity} — Rows`, value: String(data.rows.length) });
      }
    }
    const summaryHeaderRow = summarySheet.getRow(1);
    summaryHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summaryHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D5F8A' } };

    // Data sheets
    for (const [entity, { columns, rows }] of sheetDataMap) {
      const sheetName = entity.charAt(0).toUpperCase() + entity.slice(1);
      const worksheet = workbook.addWorksheet(sheetName);

      worksheet.columns = columns.map((col) => ({
        header: col.label,
        key: col.key,
        width: Math.max(col.label.length + 4, 15),
      }));

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      const groupColors: Record<string, string> = {
        Basic: 'FF2D5F8A',
        Status: 'FF8B4513',
        Pricing: 'FF228B22',
        SEO: 'FF6A5ACD',
        Variants: 'FFFF8C00',
        Images: 'FF8B008B',
        Customer: 'FF4682B4',
        Payment: 'FF9932CC',
        'Source & Tracking': 'FF20B2AA',
        External: 'FF708090',
        'Shipping Address': 'FF2E8B57',
        'Billing Address': 'FFCD5C5C',
        'Line Items': 'FFDA70D6',
        Discounts: 'FFFF6347',
      };

      columns.forEach((col, idx) => {
        const cell = headerRow.getCell(idx + 1);
        const color = groupColors[col.group] || 'FF2D5F8A';
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      worksheet.views = [{ state: 'frozen', ySplit: 1 }];

      for (const row of rows) {
        worksheet.addRow(row);
      }

      if (rows.length > 0) {
        worksheet.autoFilter = {
          from: { row: 1, column: 1 },
          to: { row: rows.length + 1, column: columns.length },
        };
      }
    }

    const filePath = path.join(this.exportsDir, `${fileName}.xlsx`);
    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  private async generateCsv(
    jobId: string,
    fileName: string,
    sheetDataMap: Map<string, { columns: ColumnDef[]; rows: any[][] }>,
    sheets: any[],
  ): Promise<string> {
    if (sheetDataMap.size === 1) {
      const [, { columns, rows }] = sheetDataMap.entries().next().value;
      const filePath = path.join(this.exportsDir, `${fileName}.csv`);
      const csvContent = this.buildCsvContent(columns, rows);
      fs.writeFileSync(filePath, '\ufeff' + csvContent, 'utf-8');
      return filePath;
    }

    // Multiple sheets — single CSV with first entity
    const [, { columns, rows }] = sheetDataMap.entries().next().value;
    const filePath = path.join(this.exportsDir, `${fileName}.csv`);
    const csvContent = this.buildCsvContent(columns, rows);
    fs.writeFileSync(filePath, '\ufeff' + csvContent, 'utf-8');
    return filePath;
  }

  private buildCsvContent(columns: ColumnDef[], rows: any[][]): string {
    const header = columns.map((c) => this.csvEscape(c.label)).join(',');
    const dataLines = rows.map((row) =>
      row.map((val) => this.csvEscape(String(val ?? ''))).join(','),
    );
    return [header, ...dataLines].join('\n');
  }

  private csvEscape(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
  }
}
