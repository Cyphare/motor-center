import mongoose, { Model, Schema } from 'mongoose';

export interface ICounter {
  _id: string;
  seq: number;
}

export interface ICounterModel extends Model<ICounter> {}

const counterSchema = new Schema<ICounter, ICounterModel>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { versionKey: false }
);

export const Counter = mongoose.model<ICounter, ICounterModel>('Counter', counterSchema);
