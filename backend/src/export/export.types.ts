export type ExportEntityType = 'products' | 'orders';
export type ExportFormat = 'xlsx' | 'csv';
export type ExportJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ExportFilter {
  field: string;
  value: string;
}

export interface ExportSheetConfig {
  entity: ExportEntityType;
  columns?: string[];       // specific columns to include; null = all
  filters?: ExportFilter[];
}

export interface CreateExportJobDto {
  sheets: ExportSheetConfig[];
  format: ExportFormat;
  fileName?: string;
}

export interface ExportJobProgress {
  entity: ExportEntityType;
  processed: number;
  exported: number;
  total: number;
}

export interface ExportJob {
  id: string;
  status: ExportJobStatus;
  format: ExportFormat;
  fileName: string;
  sheets: ExportSheetConfig[];
  progress: ExportJobProgress[];
  filePath?: string;
  fileSize?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

// Column definitions for each entity, mirroring Matrixify's structure
export interface ColumnDef {
  key: string;
  label: string;
  group: string;
  path: string;       // dot-notation path into the API response object
  slow?: boolean;      // requires extra API calls
}

export const PRODUCT_COLUMNS: ColumnDef[] = [
  // Basic Columns
  { key: 'id', label: 'ID', group: 'Basic', path: 'id' },
  { key: 'title', label: 'Title', group: 'Basic', path: 'title' },
  { key: 'handle', label: 'Handle', group: 'Basic', path: 'handle' },
  { key: 'body_html', label: 'Body HTML', group: 'Basic', path: 'body_html' },
  { key: 'vendor', label: 'Vendor', group: 'Basic', path: 'vendor' },
  { key: 'product_type', label: 'Type', group: 'Basic', path: 'product_type' },
  { key: 'tags', label: 'Tags', group: 'Basic', path: 'tags' },
  { key: 'status', label: 'Status', group: 'Basic', path: 'status' },
  { key: 'published_at', label: 'Published At', group: 'Basic', path: 'published_at' },
  { key: 'created_at', label: 'Created At', group: 'Basic', path: 'created_at' },
  { key: 'updated_at', label: 'Updated At', group: 'Basic', path: 'updated_at' },

  // Pricing & Inventory
  { key: 'price', label: 'Price', group: 'Pricing', path: 'price' },
  { key: 'compare_at_price', label: 'Compare At Price', group: 'Pricing', path: 'compare_at_price' },
  { key: 'sku', label: 'SKU', group: 'Pricing', path: 'sku' },
  { key: 'barcode', label: 'Barcode', group: 'Pricing', path: 'barcode' },
  { key: 'weight', label: 'Weight', group: 'Pricing', path: 'weight' },
  { key: 'weight_unit', label: 'Weight Unit', group: 'Pricing', path: 'weight_unit' },
  { key: 'charge_tax', label: 'Charge Tax', group: 'Pricing', path: 'charge_tax' },
  { key: 'track_inventory', label: 'Track Inventory', group: 'Pricing', path: 'track_inventory' },
  { key: 'is_physical_product', label: 'Is Physical Product', group: 'Pricing', path: 'is_physical_product' },

  // SEO
  { key: 'seo_title', label: 'SEO Title', group: 'SEO', path: 'seo_title' },
  { key: 'seo_description', label: 'SEO Description', group: 'SEO', path: 'seo_description' },

  // Variants (slow - requires show_variants=true)
  { key: 'variant_id', label: 'Variant ID', group: 'Variants', path: 'variants[].id', slow: true },
  { key: 'variant_title', label: 'Variant Title', group: 'Variants', path: 'variants[].title', slow: true },
  { key: 'variant_sku', label: 'Variant SKU', group: 'Variants', path: 'variants[].sku', slow: true },
  { key: 'variant_price', label: 'Variant Price', group: 'Variants', path: 'variants[].price', slow: true },
  { key: 'variant_compare_at_price', label: 'Variant Compare At Price', group: 'Variants', path: 'variants[].compare_at_price', slow: true },
  { key: 'variant_barcode', label: 'Variant Barcode', group: 'Variants', path: 'variants[].barcode', slow: true },
  { key: 'variant_weight', label: 'Variant Weight', group: 'Variants', path: 'variants[].weight', slow: true },
  { key: 'variant_weight_unit', label: 'Variant Weight Unit', group: 'Variants', path: 'variants[].weight_unit', slow: true },
  { key: 'variant_position', label: 'Variant Position', group: 'Variants', path: 'variants[].position', slow: true },
  { key: 'variant_inventory_quantity', label: 'Variant Inventory Qty', group: 'Variants', path: 'variants[].inventory_quantity', slow: true },

  // Images
  { key: 'image_src', label: 'Image Src', group: 'Images', path: 'images[].src' },
  { key: 'image_alt', label: 'Image Alt', group: 'Images', path: 'images[].alt' },
  { key: 'image_position', label: 'Image Position', group: 'Images', path: 'images[].position' },
];

export const ORDER_COLUMNS: ColumnDef[] = [
  // Basic Columns
  { key: 'id', label: 'ID', group: 'Basic', path: 'id' },
  { key: 'name', label: 'Name', group: 'Basic', path: 'name' },
  { key: 'order_number', label: 'Order Number', group: 'Basic', path: 'order_number' },
  { key: 'email', label: 'Email', group: 'Basic', path: 'email' },
  { key: 'phone', label: 'Phone', group: 'Basic', path: 'phone' },
  { key: 'note', label: 'Note', group: 'Basic', path: 'note' },
  { key: 'tags', label: 'Tags', group: 'Basic', path: 'tags' },
  { key: 'confirmed', label: 'Confirmed', group: 'Basic', path: 'confirmed' },
  { key: 'test', label: 'Test Order', group: 'Basic', path: 'test' },
  { key: 'created_at', label: 'Created At', group: 'Basic', path: 'created_at' },
  { key: 'updated_at', label: 'Updated At', group: 'Basic', path: 'updated_at' },
  { key: 'processed_at', label: 'Processed At', group: 'Basic', path: 'processed_at' },
  { key: 'closed_at', label: 'Closed At', group: 'Basic', path: 'closed_at' },
  { key: 'cancelled_at', label: 'Cancelled At', group: 'Basic', path: 'cancelled_at' },
  { key: 'cancel_reason', label: 'Cancel Reason', group: 'Basic', path: 'cancel_reason' },

  // Status
  { key: 'status', label: 'Status', group: 'Status', path: 'status' },
  { key: 'financial_status', label: 'Financial Status', group: 'Status', path: 'financial_status' },
  { key: 'fulfillment_status', label: 'Fulfillment Status', group: 'Status', path: 'fulfillment_status' },

  // Pricing
  { key: 'currency', label: 'Currency', group: 'Pricing', path: 'currency' },
  { key: 'total_price', label: 'Total Price', group: 'Pricing', path: 'total_price' },
  { key: 'subtotal_price', label: 'Subtotal Price', group: 'Pricing', path: 'subtotal_price' },
  { key: 'current_total_price', label: 'Current Total Price', group: 'Pricing', path: 'current_total_price' },
  { key: 'current_subtotal_price', label: 'Current Subtotal Price', group: 'Pricing', path: 'current_subtotal_price' },
  { key: 'total_tax', label: 'Total Tax', group: 'Pricing', path: 'total_tax' },
  { key: 'current_total_tax', label: 'Current Total Tax', group: 'Pricing', path: 'current_total_tax' },
  { key: 'total_discounts', label: 'Total Discounts', group: 'Pricing', path: 'total_discounts' },
  { key: 'current_total_discounts', label: 'Current Total Discounts', group: 'Pricing', path: 'current_total_discounts' },
  { key: 'total_line_items_price', label: 'Total Line Items Price', group: 'Pricing', path: 'total_line_items_price' },
  { key: 'total_outstanding', label: 'Total Outstanding', group: 'Pricing', path: 'total_outstanding' },
  { key: 'total_tip_received', label: 'Total Tip Received', group: 'Pricing', path: 'total_tip_received' },
  { key: 'total_weight', label: 'Total Weight', group: 'Pricing', path: 'total_weight' },
  { key: 'taxes_included', label: 'Taxes Included', group: 'Pricing', path: 'taxes_included' },
  { key: 'tax_exempt', label: 'Tax Exempt', group: 'Pricing', path: 'tax_exempt' },

  // Payment
  { key: 'payment_gateway_names', label: 'Payment Gateway', group: 'Payment', path: 'payment_gateway_names' },
  { key: 'payment_method', label: 'Payment Method', group: 'Payment', path: 'payment_details.paymentMethod' },
  { key: 'payment_amount', label: 'Payment Amount', group: 'Payment', path: 'payment_details.paymentAmount' },

  // Customer
  { key: 'customer_id', label: 'Customer ID', group: 'Customer', path: 'customer.id' },
  { key: 'customer_email', label: 'Customer Email', group: 'Customer', path: 'customer.email' },
  { key: 'customer_first_name', label: 'Customer First Name', group: 'Customer', path: 'customer.first_name' },
  { key: 'customer_last_name', label: 'Customer Last Name', group: 'Customer', path: 'customer.last_name' },
  { key: 'customer_phone', label: 'Customer Phone', group: 'Customer', path: 'customer.phone' },
  { key: 'customer_external_id', label: 'Customer External ID', group: 'Customer', path: 'customer.external_customer_id' },

  // Source & Tracking (UTM / Referral)
  { key: 'source_name', label: 'Source Name', group: 'Source & Tracking', path: 'source_name' },
  { key: 'source_identifier', label: 'Source Identifier', group: 'Source & Tracking', path: 'source_identifier' },
  { key: 'source_url', label: 'Source URL', group: 'Source & Tracking', path: 'source_url' },
  { key: 'landing_site', label: 'Landing Site', group: 'Source & Tracking', path: 'landing_site' },
  { key: 'landing_site_ref', label: 'Landing Site Ref', group: 'Source & Tracking', path: 'landing_site_ref' },
  { key: 'referring_site', label: 'Referring Site', group: 'Source & Tracking', path: 'referring_site' },
  { key: 'cart_token', label: 'Cart Token', group: 'Source & Tracking', path: 'cart_token' },
  { key: 'checkout_token', label: 'Checkout Token', group: 'Source & Tracking', path: 'checkout_token' },
  { key: 'customer_locale', label: 'Customer Locale', group: 'Source & Tracking', path: 'customer_locale' },

  // External References
  { key: 'external_order_id', label: 'External Order ID', group: 'External', path: 'external_order_id' },
  { key: 'external_order_number', label: 'External Order Number', group: 'External', path: 'external_order_number' },
  { key: 'external_order_name', label: 'External Order Name', group: 'External', path: 'external_order_name' },
  { key: 'order_status_url', label: 'Order Status URL', group: 'External', path: 'order_status_url' },
  { key: 'confirmation_number', label: 'Confirmation Number', group: 'External', path: 'confirmation_number' },

  // Shipping Address
  { key: 'shipping_first_name', label: 'Shipping First Name', group: 'Shipping Address', path: 'shipping_address.first_name' },
  { key: 'shipping_last_name', label: 'Shipping Last Name', group: 'Shipping Address', path: 'shipping_address.last_name' },
  { key: 'shipping_company', label: 'Shipping Company', group: 'Shipping Address', path: 'shipping_address.company' },
  { key: 'shipping_address1', label: 'Shipping Address 1', group: 'Shipping Address', path: 'shipping_address.address1' },
  { key: 'shipping_address2', label: 'Shipping Address 2', group: 'Shipping Address', path: 'shipping_address.address2' },
  { key: 'shipping_city', label: 'Shipping City', group: 'Shipping Address', path: 'shipping_address.city' },
  { key: 'shipping_province', label: 'Shipping Province', group: 'Shipping Address', path: 'shipping_address.province' },
  { key: 'shipping_province_code', label: 'Shipping Province Code', group: 'Shipping Address', path: 'shipping_address.province_code' },
  { key: 'shipping_zip', label: 'Shipping Zip', group: 'Shipping Address', path: 'shipping_address.zip' },
  { key: 'shipping_country', label: 'Shipping Country', group: 'Shipping Address', path: 'shipping_address.country' },
  { key: 'shipping_country_code', label: 'Shipping Country Code', group: 'Shipping Address', path: 'shipping_address.country_code' },
  { key: 'shipping_phone', label: 'Shipping Phone', group: 'Shipping Address', path: 'shipping_address.phone' },

  // Billing Address
  { key: 'billing_first_name', label: 'Billing First Name', group: 'Billing Address', path: 'billing_address.first_name' },
  { key: 'billing_last_name', label: 'Billing Last Name', group: 'Billing Address', path: 'billing_address.last_name' },
  { key: 'billing_company', label: 'Billing Company', group: 'Billing Address', path: 'billing_address.company' },
  { key: 'billing_address1', label: 'Billing Address 1', group: 'Billing Address', path: 'billing_address.address1' },
  { key: 'billing_address2', label: 'Billing Address 2', group: 'Billing Address', path: 'billing_address.address2' },
  { key: 'billing_city', label: 'Billing City', group: 'Billing Address', path: 'billing_address.city' },
  { key: 'billing_province', label: 'Billing Province', group: 'Billing Address', path: 'billing_address.province' },
  { key: 'billing_province_code', label: 'Billing Province Code', group: 'Billing Address', path: 'billing_address.province_code' },
  { key: 'billing_zip', label: 'Billing Zip', group: 'Billing Address', path: 'billing_address.zip' },
  { key: 'billing_country', label: 'Billing Country', group: 'Billing Address', path: 'billing_address.country' },
  { key: 'billing_country_code', label: 'Billing Country Code', group: 'Billing Address', path: 'billing_address.country_code' },
  { key: 'billing_phone', label: 'Billing Phone', group: 'Billing Address', path: 'billing_address.phone' },

  // Line Items (multi-row like Matrixify)
  { key: 'line_id', label: 'Line: ID', group: 'Line Items', path: 'line_items[].id' },
  { key: 'line_title', label: 'Line: Title', group: 'Line Items', path: 'line_items[].title' },
  { key: 'line_variant_title', label: 'Line: Variant Title', group: 'Line Items', path: 'line_items[].variant_title' },
  { key: 'line_sku', label: 'Line: SKU', group: 'Line Items', path: 'line_items[].sku' },
  { key: 'line_quantity', label: 'Line: Quantity', group: 'Line Items', path: 'line_items[].quantity' },
  { key: 'line_price', label: 'Line: Price', group: 'Line Items', path: 'line_items[].price' },
  { key: 'line_total_discount', label: 'Line: Total Discount', group: 'Line Items', path: 'line_items[].total_discount' },
  { key: 'line_variant_id', label: 'Line: Variant ID', group: 'Line Items', path: 'line_items[].variant_id' },
  { key: 'line_product_id', label: 'Line: Product ID', group: 'Line Items', path: 'line_items[].product_id' },
  { key: 'line_product_handle', label: 'Line: Product Handle', group: 'Line Items', path: 'line_items[].product_handle' },
  { key: 'line_vendor', label: 'Line: Vendor', group: 'Line Items', path: 'line_items[].vendor' },
  { key: 'line_taxable', label: 'Line: Taxable', group: 'Line Items', path: 'line_items[].taxable' },
  { key: 'line_requires_shipping', label: 'Line: Requires Shipping', group: 'Line Items', path: 'line_items[].requires_shipping' },
  { key: 'line_gift_card', label: 'Line: Gift Card', group: 'Line Items', path: 'line_items[].gift_card' },
  { key: 'line_fulfillment_service', label: 'Line: Fulfillment Service', group: 'Line Items', path: 'line_items[].fulfillment_service' },
  { key: 'line_fulfillment_status', label: 'Line: Fulfillment Status', group: 'Line Items', path: 'line_items[].fulfillment_status' },
  { key: 'line_fulfillable_quantity', label: 'Line: Fulfillable Qty', group: 'Line Items', path: 'line_items[].fulfillable_quantity' },
  { key: 'line_current_quantity', label: 'Line: Current Qty', group: 'Line Items', path: 'line_items[].current_quantity' },
  { key: 'line_grams', label: 'Line: Grams', group: 'Line Items', path: 'line_items[].grams' },
  { key: 'line_image', label: 'Line: Image', group: 'Line Items', path: 'line_items[].image' },
  { key: 'line_external_id', label: 'Line: External ID', group: 'Line Items', path: 'line_items[].external_line_item_id' },

  // Discount Codes
  { key: 'discount_codes', label: 'Discount Codes', group: 'Discounts', path: 'discount_codes' },
];

// Keys of columns with timestamp values — convert UTC to IST
export const TIMESTAMP_COLUMN_KEYS = new Set([
  'created_at', 'updated_at', 'processed_at', 'closed_at', 'cancelled_at',
  'published_at',
]);

// Keys of columns whose values are in paisa and need dividing by 100
export const MONEY_COLUMN_KEYS = new Set([
  // Product pricing
  'price', 'compare_at_price',
  'variant_price', 'variant_compare_at_price',
  // Order pricing
  'total_price', 'subtotal_price',
  'current_total_price', 'current_subtotal_price',
  'total_tax', 'current_total_tax',
  'total_discounts', 'current_total_discounts',
  'total_line_items_price', 'total_outstanding', 'total_tip_received',
  'payment_amount',
  // Line item pricing
  'line_price', 'line_total_discount',
]);

// Group columns by group name for the column selection UI
export function getColumnGroups(entity: ExportEntityType): Record<string, ColumnDef[]> {
  const columns = entity === 'products' ? PRODUCT_COLUMNS : ORDER_COLUMNS;
  const groups: Record<string, ColumnDef[]> = {};
  for (const col of columns) {
    if (!groups[col.group]) groups[col.group] = [];
    groups[col.group].push(col);
  }
  return groups;
}

export function getDefaultColumns(entity: ExportEntityType): string[] {
  const columns = entity === 'products' ? PRODUCT_COLUMNS : ORDER_COLUMNS;
  return columns.filter(c => !c.slow).map(c => c.key);
}

export function getColumnDefs(entity: ExportEntityType, selectedKeys?: string[]): ColumnDef[] {
  const allColumns = entity === 'products' ? PRODUCT_COLUMNS : ORDER_COLUMNS;
  if (!selectedKeys || selectedKeys.length === 0) {
    return allColumns.filter(c => !c.slow);
  }
  return allColumns.filter(c => selectedKeys.includes(c.key));
}
