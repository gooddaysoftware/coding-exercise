export interface Item {
  id: number;
  parent_item_id: number;
  name: string;
  sku: string;
  price: string;
  quantity: number;
}

export interface ParentItem {
  id: number;
  name: string;
  items: Item[];
}

export interface LineItemForm {
  item_id: string;
  quantity: string;
  unit_cost: string;
}

export interface PurchaseOrderLineItem {
  id: number;
  purchase_order_id: number;
  item_id: number;
  quantity: number;
  unit_cost: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface PurchaseOrder {
  id: number;
  vendor_name: string;
  order_date: string;
  expected_delivery_date: string;
  incoterms?: string;
  purchase_order_line_items: PurchaseOrderLineItem[];
}

export interface PurchaseOrderFormData {
  vendor_name: string;
  order_date: string;
  expected_delivery_date: string;
  incoterms: string;
  line_items: LineItemForm[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
