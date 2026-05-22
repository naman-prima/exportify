import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class OrdersService {
  private readonly apiBaseUrl: string;

  constructor(private configService: ConfigService) {
    this.apiBaseUrl = this.configService.get<string>('RATIO_API_BASE_URL');
  }

  private getHeaders(extra?: Record<string, string>) {
    // Read token from process.env on each request — updated live by /callback handler
    const accessToken = process.env.RATIO_ACCESS_TOKEN || '';
    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...extra,
    };
  }

  /** List orders with pagination and filtering */
  async getOrders(query?: Record<string, unknown>): Promise<any> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/api/v1/orders`, {
        headers: this.getHeaders(),
        params: query,
      });
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data?.message || 'getOrders failed',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** Get a single order by ID */
  async getOrderById(id: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/api/v1/orders/${id}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data?.message || 'getOrderById failed',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** Create a new order */
  async createOrder(body?: Record<string, unknown>): Promise<any> {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/api/v1/orders`, body, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data?.message || 'createOrder failed',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** Update an existing order */
  async updateOrder(id: string, body?: Record<string, unknown>): Promise<any> {
    try {
      const response = await axios.patch(`${this.apiBaseUrl}/api/v1/orders/${id}`, body, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data?.message || 'updateOrder failed',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** Cancel an existing order */
  async cancelOrder(id: string, body?: Record<string, unknown>): Promise<any> {
    try {
      const response = await axios.patch(`${this.apiBaseUrl}/api/v1/orders/${id}/cancel`, body, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data?.message || 'cancelOrder failed',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** Update external ID for an order */
  async updateOrderExternalId(id: string, body?: Record<string, unknown>): Promise<any> {
    try {
      const response = await axios.patch(`${this.apiBaseUrl}/api/v1/orders/${id}/external-id`, body, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data?.message || 'updateOrderExternalId failed',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}