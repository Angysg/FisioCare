// Controlador de citas (appointments)
// Gestiona: listar, crear, actualizar, eliminar citas y generar eventos para el calendario

import Appointment from '../models/Appointment.js';
import { Vacation } from '../models/Vacation.js';
import * as PacienteMod from '../models/Paciente.js';

// Compatibilidad: Paciente puede exportar por defecto o por nombre
const Paciente = PacienteMod.default || PacienteMod.Paciente;

/* ==============================
   HELPER: convertir fechas de query (?start=...&end=...)
   Corrige espacios transformándolos en "+"
   ============================== */
const parseQDate = (v) => {
  if (!v) return null;
  const s = String(v).replace(' ', '+');
  const d = new Date(s);
  return isNaN(d) ? null : d;
};

/* =====================================================
   HELPERS PARA TRABAJAR CON TRAMOS DE 30 MINUTOS
   ===================================================== */

// Redondea una fecha al tramo de media hora más cercano (:00 o :30)
const roundToHalfHour = (date) => {
  const d = new Date(date);
  if (!(d instanceof Date) || isNaN(d)) return d;

  d.setSeconds(0, 0);
  const m = d.getMinutes();

  if (m < 15) {
    d.setMinutes(0);
  } else if (m < 45) {
    d.setMinutes(30);
  } else {
    d.setMinutes(0);
    d.setHours(d.getHours() + 1);
  }
  return d;
};

// Ajusta el rango (start/end) para garantizar que sea múltiplo de 30 minutos
const ensureHalfHourRange = (start, end) => {
  let s = roundToHalfHour(start);
  let e = new Date(end);

  if (!(e instanceof Date) || isNaN(e)) {
    e = new Date(s.getTime() + 30 * 60000);
  }

  let diffMin = Math.round((e - s) / 60000);
  if (diffMin < 30) diffMin = 30;

  // Redondeo a múltiplos de 30 min
  const steps = Math.max(1, Math.round(diffMin / 30));
  e = new Date(s.getTime() + steps * 30 * 60000);

  return [s, e];
};

/* =====================================================
   LISTAR CITAS
   GET /appointments?physio=...&from=...&to=...
   ===================================================== */
export async function list(req, res) {
  try {
    const { physio, from, to } = req.query;
    const q = {};

    // Filtrar por fisioterapeuta
    if (physio) q.physio = physio;

    // Filtrar por rango de fechas
    if (from || to) {
      q.start = {};
      if (from) q.start.$gte = parseQDate(from) ?? new Date(from);
      if (to)   q.start.$lte = parseQDate(to)   ?? new Date(to);
    }

    // Obtener citas y rellenar paciente y fisio
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

/* =====================================================
   EVENTOS PARA FULLCALENDAR
   GET /appointments/events?start=...&end=...
   Devuelve eventos ya formateados para el calendario
   ===================================================== */
   /**
    * FullCalendar necesita un formato específico, así que este endpoint transforma las citas en ese formato. 
    * Además, acorta automáticamente el nombre del paciente mostrando solo iniciales
    */
export async function events(req, res) {
  try {
    const startD = parseQDate(req.query.start);
    const endD   = parseQDate(req.query.end);
    const { physio } = req.query;

    if (!startD || !endD) {
      return res.status(400).json({ message: 'start y end inválidos' });
    }

    // Buscar citas que solapen cualquier parte del rango solicitado
    const q = { start: { $lt: endD }, end: { $gt: startD } };
    if (physio) q.physio = physio;

    const apps = await Appointment.find(q)
      .populate('patient','nombre apellidos')
      .populate('physio','nombre apellidos color')
      .lean();

    // Transformar los resultados a formato FullCalendar
    const events = apps.map(a => {
      // Nombre completo del paciente
      const pName = a.patient
        ? `${a.patient?.nombre ?? ''} ${a.patient?.apellidos ?? ''}`.trim()
        : (a.patientName || '');

      const safeTitle = (pName || a.title || 'Sesión').trim();

      // Crear título abreviado para el calendario (nombre + iniciales)
      let shortTitle = safeTitle;
      if (safeTitle) {
        const parts = safeTitle.split(/\s+/).filter(Boolean);
        if (parts.length) {
          const nombre = parts.shift();
          const iniciales = parts.map(w => (w[0] || '').toUpperCase()).join('');
          shortTitle = iniciales ? `${nombre} ${iniciales}.` : nombre;
        }
      }

      return {
        id: String(a._id),
        title: shortTitle,
        start: a.start,
        end: a.end,
        extendedProps: {
          fullTitle: safeTitle,
          physioId: a.physio?._id || a.physio,
          physioName: `${a.physio?.nombre ?? ''} ${a.physio?.apellidos ?? ''}`.trim(),
          patientId: a.patient?._id || null,
          patientName: pName || null,
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

/* =====================================================
   CREAR CITA
   POST /appointments
   Validación: vacaciones, solapamiento, franjas de 30 min
   ===================================================== */
export async function create(req, res) {
  try {
    const {
      title = 'Sesión',
      patient: patientId,   // puede venir ID de paciente
      patientName,          // o sólo nombre + alta rápida
      createPatientIfMissing = false,
      physio, start, end, duration,
      notes = '',
      createdBy
    } = req.body;

    if (!patientName || !physio || !start || (!end && !duration)) {
      return res.status(400).json({
        message: 'patientName, physio, start y end|duration son obligatorios'
      });
    }

    // Calcular fechas
    let startDate = new Date(start);
    let endDate = end
      ? new Date(end)
      : new Date(startDate.getTime() + (Number(duration) || 30) * 60000);

    // Forzar franjas de 30 minutos
    [startDate, endDate] = ensureHalfHourRange(startDate, endDate);

    // Validación del rango horario
    if (!(startDate instanceof Date) || isNaN(startDate)
      || !(endDate instanceof Date) || isNaN(endDate)
      || endDate <= startDate) {
      return res.status(400).json({
        message: 'La hora de fin debe ser posterior a la de inicio.'
      });
    }

    // Rechazar cita si el fisioterapeuta está de vacaciones
    //Antes de crear una cita, el sistema busca en la colección Vacation si el fisioterapeuta tiene vacaciones que se solapen con ese rango horario.
    //Si detecta que está de vacaciones, bloquea la creación automáticamente.
    const inVacation = await Vacation.exists({
      fisio: physio,
      startDate: { $lt: endDate },
      endDate:   { $gt: startDate },
    });
    if (inVacation) {
      return res.status(400).json({
        message: 'El fisioterapeuta está de vacaciones en ese rango.'
      });
    }

    // Bloquear solapamientos
    //Si existe una cita que empieza antes de que termine la nueva, y termina después de que empiece, significa que hay un solapamiento y se bloquea.
    const overlapping = await Appointment.exists({
      physio,
      start: { $lt: endDate },
      end:   { $gt: startDate },
    });
    if (overlapping) {
      return res.status(400).json({
        message: 'Ya existe otra cita para ese fisioterapeuta en ese horario.'
      });
    }

    // Crear paciente (ID directo o alta rápida)
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

    // Crear cita
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

    // Devolver cita con populate (como el JOIN)
    const populated = await Appointment.findById(app._id)
      .populate('patient','nombre apellidos')
      .populate('physio','nombre apellidos color');

    res.status(201).json(populated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error creando cita' });
  }
}

/* =====================================================
   ACTUALIZAR CITA
   PUT /appointments/:id
   Revalida vacaciones, solapamientos y horario
   ===================================================== */
   /**
    * Similar al de creación, pero si cambian las fechas o el fisioterapeuta, se vuelven a ejecutar todas las validaciones 
    * de vacaciones y solapamientos. 
    * */
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

    // Recalcular fechas
    let startDate = start ? new Date(start) : current.start;
    let endDate   = end ? new Date(end) : current.end;
    const physioId  = physio || current.physio;

    // Forzar franjas de 30 min
    [startDate, endDate] = ensureHalfHourRange(startDate, endDate);

    // Validación rango
    if (!(startDate instanceof Date) || isNaN(startDate)
      || !(endDate instanceof Date) || isNaN(endDate)
      || endDate <= startDate) {
      return res.status(400).json({
        message: 'La hora de fin debe ser posterior a la de inicio.'
      });
    }

    // Si cambia hora o fisio, volver a comprobar vacaciones y solape
    if (start || end || physio) {
      const inVacation = await Vacation.exists({
        fisio: physioId,
        startDate: { $lt: endDate },
        endDate:   { $gt: startDate },
      });
      if (inVacation) {
        return res.status(400).json({
          message: 'El fisioterapeuta está de vacaciones en ese rango.'
        });
      }

      const overlapping = await Appointment.exists({
        _id: { $ne: id }, // excluir la misma cita
        physio: physioId,
        start: { $lt: endDate },
        end:   { $gt: startDate },
      });
      if (overlapping) {
        return res.status(400).json({
          message: 'Ya existe otra cita para ese fisioterapeuta en ese horario.'
        });
      }
    }

    // Crear paciente
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

    // Datos a actualizar
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

/* =====================================================
   ELIMINAR CITA
   DELETE /appointments/:id
   ===================================================== */
export async function remove(req, res) {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error eliminando cita' });
  }
}

/* =====================================================
   ENDPOINT LEGACY — ya no se usa
   Se mantiene por compatibilidad con versiones antiguas
   ===================================================== */
export async function zonesStats(_req, res) {
  res.json([]);
}
