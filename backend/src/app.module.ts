import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { ExportModule } from './export/export.module';
import { SupabaseModule } from './supabase/supabase.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OAuthCallbackModule } from './oauth/oauth-callback.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    ProductsModule,
    OrdersModule,
    ExportModule,
    OAuthCallbackModule,
  ],
})
export class AppModule {}
