// server/src/models/Appointment.js
import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
  title: { type: String, default: 'Sesión' },

  // Paciente referenciado (opcional)
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente', required: false },

  // Nombre libre del paciente (obligatorio para permitir cita sin registro)
  patientName: { type: String, required: true, trim: true },

  physio: { type: mongoose.Schema.Types.ObjectId, ref: 'Fisio', required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  notes: { type: String, default: '' },

  // bodyZones se ha movido a Seguimiento
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

AppointmentSchema.index({ start: 1, physio: 1 });

export default mongoose.model('Appointment', AppointmentSchema);
