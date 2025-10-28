// Punto de entrada que renderiza <App/>
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./app.css";
import { ThemeProvider } from "./ThemeContext.jsx";

// misma función que usamos en ThemeContext para elegir el tema inicial
function getInitialTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return "dark";
}

// AÑADIMOS ESTO ANTES DE RENDERIZAR REACT
const initialTheme = getInitialTheme();
document.body.classList.remove("light", "dark");
document.body.classList.add(initialTheme);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
