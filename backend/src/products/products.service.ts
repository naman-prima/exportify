import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ProductsService {
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

  /** List products with pagination and filtering */
  async getProducts(query?: Record<string, unknown>): Promise<any> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/api/v1/products`, {
        headers: this.getHeaders(),
        params: query,
      });
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data?.message || 'getProducts failed',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** Get a single product by ID */
  async getProductById(id: string, query?: Record<string, unknown>): Promise<any> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/api/v1/products/${id}`, {
        headers: this.getHeaders(),
        params: query,
      });
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data?.message || 'getProductById failed',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** Create a product */
  async createProduct(body?: Record<string, unknown>): Promise<any> {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/api/v1/products`, body, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data?.message || 'createProduct failed',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** Update a product */
  async updateProduct(id: string, body?: Record<string, unknown>): Promise<any> {
    try {
      const response = await axios.put(`${this.apiBaseUrl}/api/v1/products/${id}`, body, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data?.message || 'updateProduct failed',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** Delete a product */
  async deleteProduct(id: string): Promise<any> {
    try {
      const response = await axios.delete(`${this.apiBaseUrl}/api/v1/products/${id}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data?.message || 'deleteProduct failed',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}