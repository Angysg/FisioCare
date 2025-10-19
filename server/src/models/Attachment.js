// Adjuntos (PDF/imagen) ligados a un paciente
import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    ownerType: { type: String, enum: ['paciente'], required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    storage: { type: String, enum: ['local'], default: 'local' },
    pathOrUrl: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

export const Attachment = mongoose.model('Attachment', attachmentSchema);
