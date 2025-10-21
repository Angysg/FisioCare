import mongoose from 'mongoose';

const VacationSchema = new mongoose.Schema({
  fisio:      { type: mongoose.Schema.Types.ObjectId, ref: 'Fisio', required: true, index: true },
  title:      { type: String, trim: true, default: 'Vacaciones' }, // aparecerá en el calendario
  startDate:  { type: Date, required: true },
  endDate:    { type: Date, required: true }, // inclusive para el front
  color:      { type: String, trim: true, default: '' }, // opcional: color de evento
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // opcional
}, { timestamps: true });

export const Vacation = mongoose.model('Vacation', VacationSchema);
