export interface Batch {
  name: string;
  createdAt: Date;
  platforms: string[];
  labelFile?: string;
  orders: string[];
}