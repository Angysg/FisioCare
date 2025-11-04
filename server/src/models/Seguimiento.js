import mongoose from "mongoose";

const SeguimientoSchema = new mongoose.Schema(
  {
    // Enlace opcional al paciente (si lo resolvemos por nombre/email)
    paciente: { type: mongoose.Schema.Types.ObjectId, ref: "Paciente", required: false },

    // Nombre libre escrito a mano
    pacienteNombre: { type: String, trim: true, required: false },

    //Fisio: debe referenciar la colección "fisios" (modelo "Fisio"), NO "User"
    fisio: { type: mongoose.Schema.Types.ObjectId, ref: "Fisio", required: true },

    // Fecha obligatoria
    fecha: { type: Date, required: true },

    comentario: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Seguimiento", SeguimientoSchema);
