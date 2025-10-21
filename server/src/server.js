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

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacientesRoutes);

app.use('/api/fisios', fisiosRouter);
app.use('/api/vacations', vacationsRouter);

const PORT = process.env.PORT || 4000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 API en http://localhost:${PORT}`));
});
