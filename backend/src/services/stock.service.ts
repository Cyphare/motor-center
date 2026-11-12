import { ClientSession, Types} from 'mongoose'
import { Part } from '../models/part.model'
import { StockMovement, MovementType } from '../models/stockMovement.model'
import { User } from '../models/user.model'
import { USER_ROLES } from '../constants'
import { LowStockItem, sendLowStockEmail } from './mail.service'

interface ChangeStockInput{
    partId: Types.ObjectId | string;
    delta: number;
    type: MovementType;
    userId: Types.ObjectId | string;
    bookingId?: Types.ObjectId | string;
    note?: string;
    session: ClientSession;
    requireActive?: boolean;
    /**
     * FR-OWN-04: when given, a part whose stock drops from above minStock to minStock or below
     * is pushed here. The caller sends the alert with notifyLowStock() after the transaction commits.
     */
    lowStockAlerts?: LowStockItem[];
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

    const stockBefore = part.stock - input.delta
    if (input.lowStockAlerts && part.isActive && stockBefore > part.minStock && part.stock <= part.minStock) {
        input.lowStockAlerts.push({
            code: part.code,
            name: part.name,
            stock: part.stock,
            minStock: part.minStock,
            unit: part.unit,
        })
    }
    return part
}

/**
 * Emails every active pemilik and admin about parts that just crossed their minimum stock.
 * Failures are only logged so they never undo the stock change that triggered them.
 */
export async function notifyLowStock(alerts: LowStockItem[]): Promise<void> {
    if (alerts.length === 0) return
    try {
        const recipients = await User.find({
            role: { $in: [USER_ROLES.PEMILIK, USER_ROLES.ADMIN] },
            isActive: true,
        }).select('email').lean()
        if (recipients.length === 0) return
        await sendLowStockEmail(recipients.map((user) => user.email), alerts)
    } catch (error) {
        console.error('[Email] Peringatan stok menipis gagal dikirim:', error)
    }
}