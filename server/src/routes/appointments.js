import { Router } from 'express';
import {
  list, create, update, remove, zonesStats, events
} from '../controllers/appointments.controller.js';
// import { requireAuth, requireRole } from '../middleware/auth.js';

const r = Router();
// r.use(requireAuth);

r.get('/', list);
r.get('/events', events);   // <<< feed para FullCalendar

r.post('/', /*requireRole(['admin','recepcion','fisioterapeuta']),*/ create);
r.put('/:id', /*requireRole(['admin','recepcion','fisioterapeuta']),*/ update);
r.delete('/:id', /*requireRole(['admin']),*/ remove);

r.get('/stats/zones', zonesStats);

export default r;
