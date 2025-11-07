import { useState } from "react";

export default function PacienteRow({ paciente, onDescargarAdjunto /*, onVerAdjunto, onEliminarAdjunto*/ }) {
    const [open, setOpen] = useState(false);

    return (
        <li
            className="pac-item"
            style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                borderRadius: 12,
                background: "var(--panel)",
                border: `1px solid ${isOpen
                    ? "color-mix(in srgb, var(--link) 28%, var(--border))"
                    : "var(--border)"}`,
                transition: "box-shadow 200ms, border-color 200ms",
                boxShadow: isOpen
                    ? "0 0 0 1.5px color-mix(in srgb, var(--link) 24%, transparent)"
                    : "0 1px 8px rgba(0,0,0,0.06)",
            }}
        >
            {/* Cabecera clicable */}
            <button
                type="button"
                onClick={onToggle}
                style={{
                    width: "100%",
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    borderRadius: 12,
                }}
            >
                <div>
                    <div className="title" style={{ fontWeight: 600, fontSize: "var(--list-title-size)" }}>
                        {paciente.nombre} {paciente.apellidos}
                    </div>
                    <div className="meta" style={{ color: "var(--muted)",fontSize: "calc(var(--list-font-size) * 0.95)" }}>
                        {paciente.email} · {paciente.telefono || "—"}
                    </div>
                </div>

                <span
                    style={{
                        fontSize: "calc(var(--list-font-size) * 0.95)",
                        fontWeight: 500,
                        color: "var(--link)",
                        userSelect: "none",
                    }}
                >
                    {isOpen ? "Ocultar" : "Ver detalle"}
                </span>
            </button>

            {/* Cuerpo */}
            <div
                style={{
                    height: h,
                    overflow: "hidden",
                    transition: "height 300ms",
                }}
            >
                <div ref={wrapRef}>
                    <div
                        className="detalle"
                        style={{ padding: "0 14px 14px 14px", fontSize: "calc(var(--list-font-size) * 0.90)"  }}
                    >
                        {/* Antecedentes */}
                        <div style={{ marginTop: 6, marginBottom: 12 }}>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>
                                Antecedentes médicos
                            </div>
                            <div style={{ whiteSpace: "pre-wrap" }}>
                                {paciente.antecedentes_medicos?.trim() ? (
                                    paciente.antecedentes_medicos
                                ) : (
                                    <i style={{ color: "var(--muted)" }}>Sin antecedentes</i>
                                )}
                            </div>
                        </div>

                        {/* Adjuntos */}
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>Adjuntos</div>
                            {attachments.length === 0 ? (
                                <i style={{ color: "var(--muted)" }}>No hay adjuntos</i>
                            ) : (
                                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                    {attachments.map((a) => (
                                        <li
                                            key={a._id}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                padding: "6px 0",
                                                borderBottom: "1px solid var(--border)",
                                                gap: 8,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                    maxWidth: "60%",
                                                }}
                                                title={a.originalName}
                                            >
                                                {a.originalName}{" "}
                                                <small style={{ color: "var(--muted)" }}>
                                                    ({a.mimeType})
                                                </small>
                                            </span>

                                            {/* === BOTONES refinados === */}
                                            <div style={{ display: "flex", gap: 8 }}>
                                                <button className="btn-reset btn-adj" onClick={() => onVerAdjunto(a)}>
                                                    Ver
                                                </button>
                                                <button className="btn-reset btn-adj" onClick={() => onDescargarAdjunto(a)}>
                                                    Descargar
                                                </button>
                                                {canDelete && (
                                                    <button
                                                        className="btn-reset btn-adj delete"
                                                        onClick={() => onEliminarAdjunto(a)}
                                                    >
                                                        Eliminar
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );
}
