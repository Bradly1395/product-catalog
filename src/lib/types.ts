export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: number;
  slug: string;
  title: string;
  category: string;
  priceText: string;
  description: string;
  specifications: ProductSpec[];
  imagePath: string | null;
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
}
