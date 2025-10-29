import mongoose from 'mongoose';

const VacationRequestSchema = new mongoose.Schema(
  {
    fisio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fisio',
      required: true,
      index: true,
    },

    startDate: { type: Date, required: true },
    endDate:   { type: Date, required: true },

    message:   { type: String, trim: true, maxlength: 300, default: '' },

    // pending = solicitada por el fisio, sin revisar
    // approved = aceptada y ya metida en Vacation real
    // rejected = denegada
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

export const VacationRequest = mongoose.model('VacationRequest', VacationRequestSchema);
