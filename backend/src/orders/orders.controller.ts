import { Controller, Get, Query, Param, Post, Body, Patch } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('api/v1/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /** List orders with pagination and filtering */
  @Get('/')
  async getOrders(@Query() query: Record<string, unknown>) {
    return this.ordersService.getOrders(query);
  }

  /** Get a single order by ID */
  @Get('/:id')
  async getOrderById(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  /** Create a new order */
  @Post('/')
  async createOrder(@Body() body: Record<string, unknown>) {
    return this.ordersService.createOrder(body);
  }

  /** Update an existing order */
  @Patch('/:id')
  async updateOrder(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.ordersService.updateOrder(id, body);
  }

  /** Cancel an existing order */
  @Patch('/:id/cancel')
  async cancelOrder(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.ordersService.cancelOrder(id, body);
  }

  /** Update external ID for an order */
  @Patch('/:id/external-id')
  async updateOrderExternalId(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.ordersService.updateOrderExternalId(id, body);
  }
}