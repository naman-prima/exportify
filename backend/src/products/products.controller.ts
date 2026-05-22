import { Controller, Get, Query, Param, Post, Body, Put, Delete } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('api/v1/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /** List products with pagination and filtering */
  @Get('/')
  async getProducts(@Query() query: Record<string, unknown>) {
    return this.productsService.getProducts(query);
  }

  /** Get a single product by ID */
  @Get('/:id')
  async getProductById(@Param('id') id: string, @Query() query: Record<string, unknown>) {
    return this.productsService.getProductById(id, query);
  }

  /** Create a product */
  @Post('/')
  async createProduct(@Body() body: Record<string, unknown>) {
    return this.productsService.createProduct(body);
  }

  /** Update a product */
  @Put('/:id')
  async updateProduct(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.productsService.updateProduct(id, body);
  }

  /** Delete a product */
  @Delete('/:id')
  async deleteProduct(@Param('id') id: string) {
    return this.productsService.deleteProduct(id);
  }
}