import mongoose from "mongoose";
import BODY_ZONES from "../constants/bodyZones.js";

const SeguimientoSchema = new mongoose.Schema(
  {
    // Enlace opcional al paciente o nombre libre
    paciente: { type: mongoose.Schema.Types.ObjectId, ref: "Paciente", required: false },
    pacienteNombre: { type: String, trim: true, required: false },

    // Fisio (modelo Fisio)
    fisio: { type: mongoose.Schema.Types.ObjectId, ref: "Fisio", required: true },

    // Fecha
    fecha: { type: Date, required: true },

    // Nuevo
    primeraConsulta: { type: Boolean, default: false },
    bodyZones: [{ type: String, enum: BODY_ZONES, default: undefined }],

    comentario: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Seguimiento", SeguimientoSchema);
