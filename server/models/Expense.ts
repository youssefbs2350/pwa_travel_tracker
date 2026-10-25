import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  id?: string;
  tripId: string;
  title: string;
  category: 'Hébergement' | 'Transport' | 'Nourriture' | 'Activités' | 'Shopping' | 'Santé' | 'Autre';
  amount: number;
  currency: string;
  date: string;
  paidBy: string;
  splitWith: string[];
  receiptImage?: string;
  notes?: string;
  createdAt: Date;
}

const ExpenseSchema = new Schema<IExpense>({
  id: { type: String, index: true },
  tripId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Hébergement', 'Transport', 'Nourriture', 'Activités', 'Shopping', 'Santé', 'Autre'],
    default: 'Nourriture' 
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'EUR' },
  date: { type: String, required: true },
  paidBy: { type: String, required: true },
  splitWith: { type: [String], default: [] },
  receiptImage: { type: String, default: '' },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export const ExpenseModel = mongoose.model<IExpense>('Expense', ExpenseSchema);
