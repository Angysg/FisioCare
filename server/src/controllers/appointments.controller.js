import Appointment from '../models/Appointment.js';
import { Vacation } from '../models/Vacation.js';
import * as PacienteMod from '../models/Paciente.js';
// Paciente exporta default o { Paciente }; compat:
const Paciente = PacienteMod.default || PacienteMod.Paciente;

// helper robusto para fechas de query (?start=...&end=...) corrigiendo espacios
const parseQDate = (v) => {
  if (!v) return null;
  const s = String(v).replace(' ', '+');
  const d = new Date(s);
  return isNaN(d) ? null : d;
};

// LIST
export async function list(req, res) {
  try {
    const { physio, from, to } = req.query;
    const q = {};
    if (physio) q.physio = physio;
    if (from || to) {
      q.start = {};
      if (from) q.start.$gte = parseQDate(from) ?? new Date(from);
      if (to)   q.start.$lte = parseQDate(to)   ?? new Date(to);
    }
    const items = await Appointment.find(q)
      .populate('patient','nombre apellidos')
      .populate('physio','nombre apellidos color')
      .sort({ start: 1 });

    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error listando citas' });
  }
}

// FEED PARA FULLCALENDAR
export async function events(req, res) {
  try {
    const startD = parseQDate(req.query.start);
    const endD   = parseQDate(req.query.end);
    const { physio } = req.query;

    if (!startD || !endD) return res.status(400).json({ message: 'start y end inválidos' });

    const q = { start: { $lt: endD }, end: { $gt: startD } };
    if (physio) q.physio = physio;

    const apps = await Appointment.find(q)
      .populate('patient','nombre apellidos')
      .populate('physio','nombre apellidos color')
      .lean();

    const events = apps.map(a => {
      const pName = a.patient
        ? `${a.patient?.nombre ?? ''} ${a.patient?.apellidos ?? ''}`.trim()
        : (a.patientName || '');
      return {
        id: String(a._id),
        title: pName || a.title || 'Cita',
        start: a.start,
        end: a.end,
        extendedProps: {
          physioId: a.physio?._id,
          physioName:  `${a.physio?.nombre ?? ''} ${a.physio?.apellidos ?? ''}`.trim(),
          patientId: a.patient?._id || null,
          patientName: pName,
          notes: a.notes || '',
        }
      };
    });

    res.json(events);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error generando eventos' });
  }
}

// CREATE (con bloqueo por vacaciones)
export async function create(req, res) {
  try {
    const {
      title = 'Sesión',
      // ahora aceptamos patientId (opcional), patientName (obligatorio) y alta rápida
      patient: patientId,
      patientName,
      createPatientIfMissing = false,
      physio, start, end, duration,
      notes = '',
      createdBy
    } = req.body;

    if (!patientName || !physio || !start || (!end && !duration))
      return res.status(400).json({ message: 'patientName, physio, start y end|duration son obligatorios' });

    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date(startDate.getTime() + (Number(duration) || 30) * 60000);

    // NO permitir cita si el fisio está de vacaciones
    const inVacation = await Vacation.exists({
      fisio: physio,
      startDate: { $lt: endDate },
      endDate:   { $gt: startDate },
    });
    if (inVacation) return res.status(400).json({ message: 'El fisioterapeuta está de vacaciones en ese rango.' });

    // Resolver/enlazar paciente si viene o si hay alta rápida
    let patientRef = null;
    if (patientId) {
      patientRef = patientId;
    } else if (createPatientIfMissing) {
      const parts = String(patientName).trim().split(/\s+/);
      const nombre = parts.shift() || patientName;
      const apellidos = parts.join(' ');
      const p = await Paciente.create({ nombre, apellidos });
      patientRef = p._id;
    }

    const app = await Appointment.create({
      title,
      patient: patientRef || undefined,
      patientName: String(patientName).trim(),
      physio,
      start: startDate,
      end: endDate,
      notes,
      createdBy
    });

    const populated = await Appointment.findById(app._id)
      .populate('patient','nombre apellidos')
      .populate('physio','nombre apellidos color');

    res.status(201).json(populated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error creando cita' });
  }
}

export async function update(req, res) {
  try {
    const id = req.params.id;
    const {
      patient: patientId,
      patientName,
      createPatientIfMissing = false,
      physio, start, end,
      notes
    } = req.body;

    const current = await Appointment.findById(id);
    if (!current) return res.status(404).json({ message: 'No encontrada' });

    // si cambian fechas o fisio, vuelve a comprobar vacaciones
    const startDate = start ? new Date(start) : current.start;
    const endDate   = end ? new Date(end) : current.end;
    const physioId  = physio || current.physio;

    if (start || end || physio) {
      const inVacation = await Vacation.exists({
        fisio: physioId,
        startDate: { $lt: endDate },
        endDate:   { $gt: startDate },
      });
      if (inVacation) return res.status(400).json({ message: 'El fisioterapeuta está de vacaciones en ese rango.' });
    }

    // resolver paciente
    let patientRef = current.patient || null;
    if (patientId) {
      patientRef = patientId;
    } else if (!patientRef && createPatientIfMissing && patientName) {
      const parts = String(patientName).trim().split(/\s+/);
      const nombre = parts.shift() || patientName;
      const apellidos = parts.join(' ');
      const p = await Paciente.create({ nombre, apellidos });
      patientRef = p._id;
    }

    const payload = {
      physio: physioId,
      start: startDate,
      end: endDate,
      notes: notes ?? current.notes,
      patient: patientRef || undefined,
      patientName: typeof patientName === 'string'
        ? String(patientName).trim()
        : current.patientName
    };

    const app = await Appointment.findByIdAndUpdate(id, payload, { new: true })
      .populate('patient','nombre apellidos')
      .populate('physio','nombre apellidos color');

    res.json(app);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error actualizando cita' });
  }
}

export async function remove(req, res) {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error eliminando cita' });
  }
}

// (Antiguo) zonas en citas -> ya no aplica; dejamos endpoint por compat retornando vacío
export async function zonesStats(_req, res) {
  res.json([]);
}
