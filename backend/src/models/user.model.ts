import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES, UserRole } from '../constants';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  isActive: boolean;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUser> {}

const userSchema = new Schema<IUser, IUserModel>(
  {
    name: {
      type: String,
      required: [true, 'Nama lengkap wajib diisi'],
      trim: true,
      maxlength: [100, 'Nama lengkap maksimal 100 karakter'],
    },
    email: {
      type: String,
      required: [true, 'Alamat email wajib diisi'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Format email tidak valid'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Kata sandi wajib diisi'],
      minlength: [6, 'Kata sandi minimal 6 karakter'],
      select: true,
    },
    role: {
      type: String,
      enum: {
        values: Object.values(USER_ROLES),
        message: 'Peran {VALUE} tidak valid dalam sistem',
      },
      default: USER_ROLES.PELANGGAN,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Nomor telepon wajib diisi'],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete (ret as any).password;
        delete (ret as any).tokenVersion;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser, IUserModel>('User', userSchema);
