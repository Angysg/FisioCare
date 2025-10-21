// server/src/models/Fisio.js
import mongoose from 'mongoose';

const FisioSchema = new mongoose.Schema({
  nombre:    { type: String, required: true, trim: true },
  apellidos: { type: String, required: true, trim: true },
  email:     { type: String, required: true, trim: true, lowercase: true, unique: true },
  telefono:  { type: String, trim: true },
  // “especialidades”: se guarda como array aunque te lleguen comas desde el front
  especialidades: [{ type: String, trim: true }],
  activo:    { type: Boolean, default: true },
}, { timestamps: true });

export const Fisio = mongoose.model('Fisio', FisioSchema);
