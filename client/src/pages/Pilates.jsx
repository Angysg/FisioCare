export default function Pilates() {
  return (
    <main
      className="container"
      style={{
        padding: 24,
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      {/* Título */}
      <h1
        style={{
          color: "#0a1f44",          
          fontWeight: "900",          
          fontSize: "2rem",           
          textTransform: "uppercase", 
          marginBottom: "1rem",
          letterSpacing: "0.5px",
        }}
      >
        Grupo Pilates
      </h1>

      {/* Subtítulo temporal */}
      <p style={{ fontSize: "1.5rem", opacity: 0.8 }}>
        🏗️ Esta sección está en construcción.
        <br />
        Próximamente se añadirá la información y el seguimiento del grupo de Pilates.
      </p>
    </main>
  );
}
