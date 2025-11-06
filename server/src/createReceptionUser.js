import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function createReception() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = 'citas@gmail.com';
    const password = '123';
    const name = 'Recepción';

    const exists = await User.findOne({ email });
    if (exists) {
      console.log('Ya existe el usuario de recepción');
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email,
      passwordHash,
      role: 'recepcion',
    });

    console.log('🎉 Usuario de recepción creado con éxito:');
    console.log(`Email: ${email}`);
    console.log(`Contraseña: ${password}`);
  } catch (err) {
    console.error('Error al crear el usuario:', err);
  } finally {
    await mongoose.disconnect();
  }
}

createReception();
