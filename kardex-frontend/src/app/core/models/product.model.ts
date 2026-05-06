export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  categoryId: string;
  unitId: string;
  costPrice: number;
  salePrice: number;
  minStock: number;
  valuationMethod: 'FIFO' | 'LIFO' | 'AVERAGE';
  barcode?: string;
  imageUrl?: string;
  isActive: boolean;
  category?: Category;
  unit?: Unit;
  inventory?: Inventory[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Unit {
  id: string;
  name: string;
  abbreviation: string;
  isActive: boolean;
}

export interface Inventory {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  avgCost: number;
  warehouse?: Warehouse;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location?: string;
  isMain: boolean;
  isActive: boolean;
}