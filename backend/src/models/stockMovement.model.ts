import mongoose, { Document, Schema, Types } from 'mongoose';

export const MOVEMENT_TYPE = ['restock', 'usage', 'return', 'adjust'] as const;
export type MovementType = (typeof MOVEMENT_TYPE)[number];

export interface IStockMovement extends Document{
    partId: Types.ObjectId;
    type: MovementType;
    quantity: number;
    stockAfter: number;
    bookingId?: Types.ObjectId;
    userId: Types.ObjectId;
    note?: string;
    createdAt: Date;
}

const stockMovementSchema = new Schema<IStockMovement>({
    partId: { type: Schema.Types.ObjectId, ref: 'Part', required: true },
    type: { type: String, enum: MOVEMENT_TYPE, required: true},
    quantity: { type: Number, required: true, validate: {validator: (v: number) => Number.isSafeInteger(v) && v!== 0, message: 'Quantity harus bilangan bulat dan tidak boleh nol'}},
    stockAfter: { type: Number, required: true, min: 0, validate: {validator: (v: number) => Number.isSafeInteger(v), message: 'StockAfter harus bilangan bulat'}},
    bookingId: {type: Schema.Types.ObjectId, ref : 'Booking'},
    userId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    note: {type :String, trim: true, maxLength: 200},
}, {
    timestamps: {createdAt: true, updatedAt: false}
})

stockMovementSchema.index({partId: 1, createdAt: -1});

export const StockMovement = mongoose.model<IStockMovement>('StockMovement', stockMovementSchema);