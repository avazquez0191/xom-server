import { OrderRepository } from '@repositories/order.repository';

export class BatchService {
  static async listBatches(filters: { startDate?: string, endDate?: string, platform?: string }) {
    // Add any business logic or validation here
    return OrderRepository.listBatches(filters);
  }
}
