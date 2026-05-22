import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Headers,
  HttpException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import { CreateExportJobDto, ExportEntityType } from './export.types';

@Controller('api/v1/export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  private getMerchantId(headers: Record<string, string>): string {
    const merchantId = headers['x-merchant-id'];
    if (!merchantId) {
      throw new HttpException('x-merchant-id header is required', HttpStatus.BAD_REQUEST);
    }
    return merchantId;
  }

  /** Get available columns for an entity */
  @Get('/columns/:entity')
  getColumns(@Param('entity') entity: ExportEntityType) {
    if (entity !== 'products' && entity !== 'orders') {
      throw new HttpException('Entity must be "products" or "orders"', HttpStatus.BAD_REQUEST);
    }
    return this.exportService.getAvailableColumns(entity);
  }

  /** Create a new export job */
  @Post('/')
  async createExport(
    @Headers() headers: Record<string, string>,
    @Body() body: CreateExportJobDto,
  ) {
    const merchantId = this.getMerchantId(headers);
    if (!body.sheets || body.sheets.length === 0) {
      throw new HttpException('At least one sheet is required', HttpStatus.BAD_REQUEST);
    }
    for (const sheet of body.sheets) {
      if (sheet.entity !== 'products' && sheet.entity !== 'orders') {
        throw new HttpException(
          `Invalid entity "${sheet.entity}". Must be "products" or "orders"`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    return this.exportService.createExportJob(merchantId, body);
  }

  /** List all export jobs for a merchant */
  @Get('/jobs')
  async getJobs(@Headers() headers: Record<string, string>) {
    const merchantId = this.getMerchantId(headers);
    return this.exportService.getJobs(merchantId);
  }

  /** Get a specific job's status and progress */
  @Get('/jobs/:id')
  async getJob(@Param('id') id: string) {
    const job = await this.exportService.getJob(id);
    if (!job) throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
    return job;
  }

  /** Cancel a job */
  @Patch('/jobs/:id/cancel')
  async cancelJob(@Param('id') id: string) {
    return this.exportService.cancelJob(id);
  }

  /** Get a signed download URL for a completed job */
  @Get('/jobs/:id/download')
  async downloadExport(@Param('id') id: string, @Res() res: Response) {
    const url = await this.exportService.getDownloadUrl(id);
    if (!url) {
      throw new HttpException('Export not ready or not found', HttpStatus.BAD_REQUEST);
    }
    res.json({ downloadUrl: url });
  }
}
