import { Request, Response } from 'express';
import { OrderService } from '@services/order.service';
import { ShippingLabelService } from '@services/shippingLabel.service';

export class OrderController {
    static async create(req: Request, res: Response) {
        try {
            const { name, line1: address1, line2: address2, line3: address3, city, state, zip } = req.body;
            
            const filename = await ShippingLabelService.generate({
                name, address1, address2, address3, city, state, zip
            });
            
            ShippingLabelService.serveSavedLabel(filename, res);
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }
}