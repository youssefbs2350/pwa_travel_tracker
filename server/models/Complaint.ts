import mongoose, { Schema, Document } from 'mongoose';

export interface IComplaint extends Document {
  tripId: string;
  userId: string;
  userName: string;
  title: string;
  category: 'Transport / Vol' | 'Hôtel / Logement' | 'Activité / Guide' | 'Frais imprévu' | 'Bagage' | 'Autre';
  priority: 'Basse' | 'Moyenne' | 'Haute' | 'Urgente';
  status: 'Soumis' | 'En cours d\'analyse' | 'Résolu' | 'Rejeté';
  description: string;
  requestedCompensation?: string;
  awardedCompensation?: string;
  resolutionNotes?: string;
  incidentDate: string;
  createdAt: Date;
  updatedAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>({
  tripId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  userName: { type: String, default: 'Voyageur' },
  title: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Transport / Vol', 'Hôtel / Logement', 'Activité / Guide', 'Frais imprévu', 'Bagage', 'Autre'],
    default: 'Transport / Vol' 
  },
  priority: { 
    type: String, 
    enum: ['Basse', 'Moyenne', 'Haute', 'Urgente'], 
    default: 'Moyenne' 
  },
  status: { 
    type: String, 
    enum: ['Soumis', 'En cours d\'analyse', 'Résolu', 'Rejeté'], 
    default: 'Soumis' 
  },
  description: { type: String, required: true },
  requestedCompensation: { type: String, default: '' },
  awardedCompensation: { type: String, default: '' },
  resolutionNotes: { type: String, default: '' },
  incidentDate: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const ComplaintModel = mongoose.model<IComplaint>('Complaint', ComplaintSchema);
