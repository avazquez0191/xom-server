import OrderBase from '@models/Order';

/*
    all TEMU-specific columns, right now TEMU is the only platform
    and it match the same columns as the OrderBase
*/
export interface TemuOrder extends OrderBase { }