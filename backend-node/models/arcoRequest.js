import mongoose from 'mongoose';

const arcoRequestSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  companyName: { type: String, required: true },
  solicitante: {
    nombre: { type: String, required: true },
    rut: { type: String, required: true },
    email: { type: String, required: true },
    telefono: { type: String, default: '' },
  },
  tipo: {
    type: String,
    enum: ['acceso', 'rectificacion', 'cancelacion', 'oposicion', 'portabilidad', 'bloqueo'],
    required: true,
  },
  descripcion: { type: String, default: '' },
  datosAEliminar: { type: String, default: '' },
  eliminacionTotal: { type: Boolean, default: false },
  estado: {
    type: String,
    enum: ['pendiente', 'en_proceso', 'completado', 'rechazado'],
    default: 'pendiente',
  },
  respuesta: { type: String, default: '' },
  atendidoPor: { type: String, default: '' },
  dueDate: { type: Date },
}, { timestamps: true });

arcoRequestSchema.index({ companyId: 1, createdAt: -1 });

const ArcoRequest = mongoose.model('ArcoRequest', arcoRequestSchema);

export default ArcoRequest;
