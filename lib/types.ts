export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Pure DB Row types (no relation fields) ──────────────────────────────────

export interface BusinessRow {
  id: string; name: string; slug: string; logo_url: string | null;
  plan: 'free' | 'pro' | 'enterprise'; owner_id: string; created_at: string;
}
export interface BusinessUserRow {
  id: string; business_id: string; user_id: string;
  role: 'owner' | 'admin' | 'viewer'; created_at: string;
}
export interface ProductRow {
  id: string; business_id: string; name: string; sku: string | null;
  description: string | null; price: number; cost: number; stock: number;
  min_stock: number; category: string | null; channels: string[];
  image_url: string | null; active: boolean; created_at: string; updated_at: string;
}
export interface OrderRow {
  id: string; business_id: string; client_id: string | null;
  order_number: string; status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  total: number; channel: string; courier: string | null;
  tracking_number: string | null; city: string | null; eta: string | null;
  notes: string | null; created_at: string; updated_at: string;
}
export interface OrderItemRow {
  id: string; order_id: string; product_id: string;
  quantity: number; unit_price: number;
}
export interface ClientRow {
  id: string; business_id: string; name: string; email: string | null;
  phone: string | null; city: string | null; total_orders: number;
  total_spent: number; last_order_at: string | null; notes: string | null;
  created_at: string; updated_at: string;
}
export interface ExpenseRow {
  id: string; business_id: string;
  category: 'Envíos' | 'Comisiones ML' | 'Comisiones TN' | 'Publicidad' | 'Packaging' | 'Sueldos' | 'Impuestos' | 'Otros';
  amount: number; description: string | null; date: string;
  created_by: string; created_at: string;
}
export interface SupplierRow {
  id: string; business_id: string; name: string; contact: string | null;
  email: string | null; phone: string | null; category: string | null;
  balance: number; created_at: string; updated_at: string;
}
export interface SupplierNoteRow {
  id: string; supplier_id: string; business_id: string;
  text: string; type: 'info' | 'warning' | 'success'; created_at: string;
}
export interface AdCampaignRow {
  id: string; business_id: string; name: string;
  status: 'active' | 'paused' | 'ended'; platform: string;
  budget: number; spent: number; roas: number | null; cpc: number | null;
  ctr: string | null; conversions: number; start_date: string;
  end_date: string | null; created_at: string; updated_at: string;
}
export interface SalesChannelRow {
  id: string; business_id: string; name: string; platform: string;
  color: string; icon: string; sales: number; orders: number;
  active: boolean; created_at: string;
}

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: BusinessRow;
        Insert: Omit<BusinessRow, 'id' | 'created_at'>;
        Update: Partial<Omit<BusinessRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      business_users: {
        Row: BusinessUserRow;
        Insert: Omit<BusinessUserRow, 'id' | 'created_at'>;
        Update: Partial<Omit<BusinessUserRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      products: {
        Row: ProductRow;
        Insert: Omit<ProductRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ProductRow, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      orders: {
        Row: OrderRow;
        Insert: Omit<OrderRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<OrderRow, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      order_items: {
        Row: OrderItemRow;
        Insert: Omit<OrderItemRow, 'id'>;
        Update: Partial<Omit<OrderItemRow, 'id'>>;
        Relationships: [];
      };
      clients: {
        Row: ClientRow;
        Insert: Omit<ClientRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ClientRow, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      expenses: {
        Row: ExpenseRow;
        Insert: Omit<ExpenseRow, 'id' | 'created_at'>;
        Update: Partial<Omit<ExpenseRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      suppliers: {
        Row: SupplierRow;
        Insert: Omit<SupplierRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SupplierRow, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      supplier_notes: {
        Row: SupplierNoteRow;
        Insert: Omit<SupplierNoteRow, 'id' | 'created_at'>;
        Update: Partial<Omit<SupplierNoteRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      ad_campaigns: {
        Row: AdCampaignRow;
        Insert: Omit<AdCampaignRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AdCampaignRow, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      sales_channels: {
        Row: SalesChannelRow;
        Insert: Omit<SalesChannelRow, 'id' | 'created_at'>;
        Update: Partial<Omit<SalesChannelRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      order_status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
      expense_category:
        | 'Envíos' | 'Comisiones ML' | 'Comisiones TN' | 'Publicidad'
        | 'Packaging' | 'Sueldos' | 'Impuestos' | 'Otros';
      user_role: 'owner' | 'admin' | 'viewer';
      note_type: 'info' | 'warning' | 'success';
    };
  };
}

// ─── Application types (with optional relation fields for joined queries) ──────

export type Business = BusinessRow;
export type BusinessUser = BusinessUserRow;
export type Product = ProductRow;
export type Client = ClientRow;
export type Expense = ExpenseRow;
export type SupplierNote = SupplierNoteRow;
export type AdCampaign = AdCampaignRow;
export type SalesChannel = SalesChannelRow;

export type OrderItem = OrderItemRow & {
  products?: Pick<ProductRow, 'name' | 'sku'> | null;
};

export type Order = OrderRow & {
  clients?: Pick<ClientRow, 'name' | 'email'> | null;
  order_items?: OrderItem[];
};

export type Supplier = SupplierRow & {
  supplier_notes?: SupplierNote[];
};

// ─── Utility types ────────────────────────────────────────────────────────────

export type OrderStatus = Database['public']['Enums']['order_status'];
export type ExpenseCategory = Database['public']['Enums']['expense_category'];

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Envíos',
  'Comisiones ML',
  'Comisiones TN',
  'Publicidad',
  'Packaging',
  'Sueldos',
  'Impuestos',
  'Otros',
];

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string }
> = {
  pending:   { label: 'Pendiente',  color: '#f59e0b', bg: '#451a03' },
  shipped:   { label: 'En camino',  color: '#3b82f6', bg: '#1e3a5f' },
  delivered: { label: 'Entregado',  color: '#22c55e', bg: '#14532d' },
  cancelled: { label: 'Cancelado',  color: '#ef4444', bg: '#450a0a' },
};

export const formatARS = (n: number) =>
  `$${Math.round(n || 0).toLocaleString('es-AR')}`;
