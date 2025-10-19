# 🏥 FisioCare

Aplicación full-stack para la gestión de pacientes, adjuntos y citas en una clínica de fisioterapia.  
Desarrollada con **Node.js + Express + MongoDB** en el backend y **React (Vite)** en el frontend.

---

## 🚀 Stack Tecnológico
- **Backend:** Node.js, Express, JWT, Multer, Mongoose  
- **Frontend:** React, Vite, TailwindCSS  
- **Base de datos:** MongoDB  
- **Autenticación:** JWT con roles (usuario / admin)  
- **Subidas:** PDFs, JPG, PNG con almacenamiento local (`/uploads`)  

---

## ⚙️ Configuración

### Variables de entorno
Ver ejemplos en:
- [`server/.env.example`](server/.env.example)
- [`client/.env.example`](client/.env.example)

### Requisitos
- Node.js v20.x
- MongoDB en local o Atlas

---

## 💻 Desarrollo

```bash
# Backend
cd server
npm install
npm run dev

# Frontend
cd ../client
npm install
npm run dev
