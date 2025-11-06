import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

export default function AppointmentForm({ physios = [], initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => ({
    physio: initial?.physio || '',
    // entrada manual del paciente para permitir cita sin registro
    patientName: initial?.patientName || '',
    // si al guardar quieres crear el paciente automáticamente
    createPatientIfMissing: false,

    start: initial?.start || dayjs().minute(0).second(0).toISOString(),
    durationMin: initial ? dayjs(initial.end).diff(dayjs(initial.start), 'minute') : 30,
    notes: initial?.notes || '',
  }));

  useEffect(() => {
    if (initial) {
      setForm(f => ({
        ...f,
        ...initial,
        patientName: initial.patientName || f.patientName || '',
        durationMin: dayjs(initial.end).diff(dayjs(initial.start), 'minute')
      }));
    }
  }, [initial]);

  const change = (k,v) => setForm(s => ({ ...s, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    const start = dayjs(form.start);
    const end = start.add(form.durationMin || 30, 'minute');
    onSubmit({
      id: initial?.id,
      physio: form.physio,
      patientName: form.patientName.trim(),
      createPatientIfMissing: !!form.createPatientIfMissing,
      start: start.toISOString(),
      end: end.toISOString(),
      notes: form.notes || '',
    });
  };

  return (
   <form id="appointment-form" onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-sm mb-1">Fisioterapeuta</label>
        <select className="w-full" value={form.physio} onChange={e=>change('physio', e.target.value)} required>
          <option value="">— Selecciona —</option>
          {physios.map(p => <option key={p._id} value={p._id}>{p.nombre} {p.apellidos}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm mb-1">Paciente</label>
        <input
          className="w-full"
          placeholder="Nombre y apellidos…"
          value={form.patientName}
          onChange={e=>change('patientName', e.target.value)}
          required
        />
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <input
            type="checkbox"
            checked={form.createPatientIfMissing}
            onChange={e=>change('createPatientIfMissing', e.target.checked)}
          />
          Crear paciente automáticamente si no existe
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm mb-1">Día</label>
          <input className="w-full" value={dayjs(form.start).format('DD/MM/YYYY')} readOnly />
        </div>
        <div>
          <label className="block text-sm mb-1">Hora</label>
          <input className="w-full" value={dayjs(form.start).format('HH:mm')} readOnly />
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Duración (min)</label>
        <input
          type="number" min={15} step={15} className="w-full"
          value={form.durationMin}
          onChange={e=>change('durationMin', parseInt(e.target.value||'30',10))}
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Observaciones</label>
        <textarea className="w-full" rows={3} value={form.notes} onChange={e=>change('notes', e.target.value)} />
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-3 py-2">Cancelar</button>
        <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">Guardar</button>
      </div>
    </form>
  );
}
