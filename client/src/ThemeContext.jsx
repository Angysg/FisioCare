import { createContext, useContext, useEffect, useState } from "react";

// Lee el tema inicial para arrancar la app
function getInitialTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return "dark"; // tu preferido por defecto
}

// Creamos el contexto
const ThemeContext = createContext({
  theme: "dark",
  toggleTheme: () => {},
});

// Provider global
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  // Cada vez que cambie theme:
  // - actualizamos <body>
  // - guardamos preferencia
  useEffect(() => {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook para consumir el tema
export function useTheme() {
  return useContext(ThemeContext);
}
