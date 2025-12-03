// client/src/components/ThemeToggle.jsx
/**
 * ThemeToggle es el botón que permite cambiar entre modo claro y modo oscuro usando el contexto global de tema.
 */

// Usamos el contexto global del tema (light/dark)
import { useTheme } from "../ThemeContext.jsx";

export default function ThemeToggle() {
  // Extraemos el tema actual y la función que lo cambia
  const { theme, toggleTheme } = useTheme();

  return (
    // Al pulsar el botón, alterna entre claro/oscuro
    <button onClick={toggleTheme}>
      {/* Texto e icono cambian según el tema actual */}
      {theme === "light" ? "🌞 Claro" : "🌙 Oscuro"}
    </button>
  );
}
