import { OrderProduct, ShippingPackage } from '@models/order.model';

export function validatePackageAllocation(products: OrderProduct[], packages: ShippingPackage[]) {
    const productTotals: Record<string, number> = {};
    for (const p of products) {
        productTotals[p.sku] = (productTotals[p.sku] || 0) + p.quantityPurchased;
    }

    const allocatedTotals: Record<string, number> = {};
    for (const pkg of packages) {
        for (const alloc of pkg.products) {
            allocatedTotals[alloc.sku] = (allocatedTotals[alloc.sku] || 0) + alloc.quantity;
        }
    }

    for (const sku in productTotals) {
        if (allocatedTotals[sku] !== productTotals[sku]) {
            throw new Error(
                `Allocation mismatch for SKU ${sku}: expected ${productTotals[sku]}, got ${allocatedTotals[sku] || 0}`
            );
        }
    }

    return true;
}
