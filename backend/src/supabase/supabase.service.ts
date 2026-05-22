import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  readonly client: SupabaseClient;

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_SERVICE_KEY');
    this.client = createClient(url, key);
  }

  // ─── Merchants ───

  async upsertMerchant(data: {
    merchant_id: string;
    access_token: string;
    refresh_token?: string;
    scopes?: string;
    merchant_name?: string;
  }) {
    const { error } = await this.client
      .from('merchants')
      .upsert(
        {
          merchant_id: data.merchant_id,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          scopes: data.scopes,
          merchant_name: data.merchant_name,
          is_active: true,
          installed_at: new Date().toISOString(),
        },
        { onConflict: 'merchant_id' },
      );
    if (error) this.logger.error('upsertMerchant failed', error);
    return !error;
  }

  async getMerchant(merchantId: string) {
    const { data, error } = await this.client
      .from('merchants')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('is_active', true)
      .single();
    if (error) return null;
    return data;
  }

  async getMerchantToken(merchantId: string): Promise<string | null> {
    const merchant = await this.getMerchant(merchantId);
    return merchant?.access_token || null;
  }

  // ─── Export Jobs ───

  async createExportJob(data: {
    merchant_id: string;
    format: string;
    file_name: string;
    sheets: { entity: string; columns: string[]; filters?: any[] }[];
  }) {
    const { data: job, error: jobError } = await this.client
      .from('export_jobs')
      .insert({
        merchant_id: data.merchant_id,
        format: data.format,
        file_name: data.file_name,
        status: 'pending',
      })
      .select()
      .single();

    if (jobError || !job) {
      this.logger.error('createExportJob failed', jobError);
      return null;
    }

    // Insert sheets
    const sheetsToInsert = data.sheets.map((s) => ({
      job_id: job.id,
      entity: s.entity,
      columns: s.columns,
      filters: s.filters || [],
    }));

    const { error: sheetsError } = await this.client
      .from('export_job_sheets')
      .insert(sheetsToInsert);

    if (sheetsError) this.logger.error('insert sheets failed', sheetsError);

    return job;
  }

  async updateJobStatus(
    jobId: string,
    update: {
      status?: string;
      started_at?: string;
      completed_at?: string;
      file_url?: string;
      file_size_bytes?: number;
      error_message?: string;
    },
  ) {
    const { error } = await this.client
      .from('export_jobs')
      .update(update)
      .eq('id', jobId);
    if (error) this.logger.error('updateJobStatus failed', error);
  }

  async updateSheetProgress(
    sheetId: string,
    update: { total_items?: number; processed_items?: number; exported_rows?: number },
  ) {
    const { error } = await this.client
      .from('export_job_sheets')
      .update(update)
      .eq('id', sheetId);
    if (error) this.logger.error('updateSheetProgress failed', error);
  }

  async getJobWithSheets(jobId: string) {
    const { data: job } = await this.client
      .from('export_jobs')
      .select('*, export_job_sheets(*)')
      .eq('id', jobId)
      .single();
    return job;
  }

  async getJobsByMerchant(merchantId: string, limit = 20) {
    const { data } = await this.client
      .from('export_jobs')
      .select('*, export_job_sheets(*)')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  }

  // ─── Storage ───

  async uploadExportFile(filePath: string, storagePath: string, contentType: string) {
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(filePath);
    const { data, error } = await this.client.storage
      .from('exports')
      .upload(storagePath, fileBuffer, { contentType, upsert: true });
    if (error) {
      this.logger.error('uploadExportFile failed', error);
      return null;
    }
    return data?.path;
  }

  async getSignedUrl(storagePath: string, expiresIn = 3600) {
    const { data, error } = await this.client.storage
      .from('exports')
      .createSignedUrl(storagePath, expiresIn);
    if (error) return null;
    return data?.signedUrl;
  }
}
