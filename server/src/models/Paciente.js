// Pacientes
import mongoose from 'mongoose';

const pacienteSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    apellidos: { type: String, required: true },
    email: { type: String },
    telefono: { type: String },
    fecha_nacimiento: { type: Date },
    antecedentes_medicos: { type: String }
  },
  { timestamps: true }
);

export const Paciente = mongoose.model('Paciente', pacienteSchema);
