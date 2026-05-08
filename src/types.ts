export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface UserProfile {
  uid: string;
  name: string;
  phoneNumber: string;
  photoURL?: string;
  businessName?: string;
  businessCategory?: 'Poultry' | 'Agro' | 'Dairy' | 'Other';
  location?: string;
  nidNumber?: string;
  trustScore: number;
  isVerified: boolean;
  createdAt: string;
}

export interface Ledger {
  id: string;
  ownerId: string;
  buyerName: string;
  buyerPhone?: string;
  totalDue: number;
  totalPaid: number;
  lastPaymentDate?: string;
  updatedAt: string;
  history?: {
    amount: number;
    description: string;
    timestamp: string;
    type: 'BAKI' | 'PAYMENT';
    attachment?: string;
  }[];
  attachments?: string[];
}

export interface Vendor {
  id: string;
  ownerId: string;
  name: string;
  phone: string;
  category: string;
  address?: string;
  email?: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  ownerId: string;
  name: string;
  category: 'FEED' | 'MEDICINE' | 'CHICKS' | 'EQUIPMENT' | 'OTHER';
  quantity: number;
  unit: string;
  minStock: number;
  vendorId?: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: string;
  ownerId: string;
  supplierName: string;
  vendorId?: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  orderDate: string;
  expectedDelivery?: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  ledgerId?: string;
  type: 'SALE' | 'EXPENSE';
  category?: string;
  amount: number;
  description: string;
  isBaki: boolean;
  dueDate?: string;
  recurrence?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  lastRecurringGeneration?: string;
  receiptUrl?: string;
  metadata?: any;
  timestamp: string;
  attachments?: string[];
}

export interface Challan {
  id: string;
  userId: string;
  buyerId: string;
  buyerName: string;
  truckNumber: string;
  driverName: string;
  itemWeight: number;
  unit: string;
  challanNumber: string;
  timestamp: string;
}

export interface ProductionLog {
  id: string;
  ownerId: string;
  date: string;
  type: 'EGGS' | 'FEED_CONSUMED' | 'WEIGHT' | 'MORTALITY' | 'OTHER';
  value: number;
  unit: string;
  notes?: string;
  updatedAt: string;
}

export interface StockAudit {
  id: string;
  ownerId: string;
  date: string;
  items: {
    itemId: string;
    itemName: string;
    systemQty: number;
    physicalQty: number;
    difference: number;
  }[];
  status: 'DRAFT' | 'COMPLETED';
  notes?: string;
  updatedAt: string;
}

export type Language = 'en' | 'bn';
