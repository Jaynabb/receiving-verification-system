export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  price?: number;
  sku?: string;
  category?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Invoice {
  id: string;
  vendorName?: string;
  invoiceNumber?: string;
  date?: string;
  items: InvoiceItem[];
  total?: number;
  createdAt: any;
}

export interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice?: number;
  total?: number;
  matchedInventoryId?: string;
  matchConfidence?: number;
}

export interface User {
  id: string;
  email: string;
  companyName?: string;
  createdAt: any;
}

export interface ReceivingReportItem {
  name: string;
  expectedQty: number;
  actualQty: number;
  unitPrice?: number;
  status: 'match' | 'shortage' | 'overage' | 'missing' | 'damaged' | 'pending';
  notes: string;
}

export interface ReceivingReport {
  id: string;
  vendorName?: string;
  invoiceNumber?: string;
  items: ReceivingReportItem[];
  totalItems: number;
  matchedItems: number;
  issueItems: number;
  createdAt: any;
}
