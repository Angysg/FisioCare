// client/src/ThemeContext.jsx

/**
 * ThemeContext es el sistema global de la aplicación para gestionar el modo claro/oscuro: guarda la preferencia, 
 * la aplica al <body> y permite que cualquier componente cambie o lea el tema.
 */

import { createContext, useContext, useEffect, useState } from "react";

// Devuelve el tema inicial: lee localStorage o usa "dark" por defecto
function getInitialTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return "dark"; // tema por defecto
}

// Creamos el contexto con un valor inicial
const ThemeContext = createContext({
  theme: "dark",
  toggleTheme: () => {},
});

// Provider: envuelve toda la app y expone "theme" y "toggleTheme"
export function ThemeProvider({ children }) {
  // Estado global del tema
  const [theme, setTheme] = useState(getInitialTheme);

  // Cuando el tema cambia:
  // - actualizamos la clase del body (light/dark)
  // - guardamos la preferencia en localStorage
  useEffect(() => {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Alterna entre modo claro y oscuro
  function toggleTheme() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }

  // Exponemos los valores al resto de componentes
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook para consumir el tema fácilmente desde cualquier componente
export function useTheme() {
  return useContext(ThemeContext);
}
