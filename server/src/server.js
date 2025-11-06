// Punto de entrada del servidor
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import pacientesRoutes from './routes/pacientes.routes.js';
import fisiosRouter from './routes/fisios.js';
import vacationsRouter from './routes/vacations.js';
import fisioAccessRoutes from './routes/fisio.access.routes.js';
import vacationRequestsRoutes from './routes/vacationRequests.js';
import seguimientosRouter from "./routes/seguimientos.js";
import appointmentsRoutes from './routes/appointments.js';
import analyticsRouter from './routes/analytics.js';


dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/fisios', fisiosRouter);
app.use('/api/vacations', vacationsRouter);
app.use("/api/fisio-access", fisioAccessRoutes);
app.use('/api/vacation-requests', vacationRequestsRoutes);
app.use('/api/seguimientos', seguimientosRouter); // CRUD de seguimientos
app.use('/api/appointments', appointmentsRoutes); //Citas
app.use('/api/analytics', analyticsRouter);


const PORT = process.env.PORT || 4000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`API en http://localhost:${PORT}`));
});
