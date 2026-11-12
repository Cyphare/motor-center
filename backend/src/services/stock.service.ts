import { ClientSession, Types} from 'mongoose'
import { Part } from '../models/part.model'
import { StockMovement, MovementType } from '../models/stockMovement.model'

interface ChangeStockInput{
    partId: Types.ObjectId | string;
    delta: number;
    type: MovementType;
    userId: Types.ObjectId | string;
    bookingId?: Types.ObjectId | string;
    note?: string;
    session: ClientSession;
    requireActive?: boolean;
}

export async function changeStock(input: ChangeStockInput){
    const filter: Record<string, unknown> = {_id: input.partId}
    if (input.requireActive) filter.isActive = true;
    if (input.delta < 0) filter.stock = {$gte: Math.abs(input.delta)};

    const part = await Part.findOneAndUpdate(filter,
        {$inc: {stock: input.delta}},
        {new: true, session: input.session}
    )
    if(!part) return null

    const stockMovement = new StockMovement({
        partId: part._id,
        type: input.type,
        quantity: input.delta,
        stockAfter: part.stock,
        bookingId: input.bookingId,
        userId: input.userId,
        note: input.note,
    })
    await stockMovement.save({session: input.session})
    return part
}