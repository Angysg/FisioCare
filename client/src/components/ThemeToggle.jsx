import { useEffect, useState } from "react";

function getInitialTheme() {
  // 1) si hay preferencia guardada, úsala
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  // 2) si no, respeta el SO (prefers-color-scheme)
  const mql = window.matchMedia("(prefers-color-scheme: light)");
  return mql.matches ? "light" : "dark";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    // aplica la clase al <html> y guarda preferencia
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      {theme === "light" ? "🌞 Claro" : "🌙 Oscuro"}
    </button>
  );
}
