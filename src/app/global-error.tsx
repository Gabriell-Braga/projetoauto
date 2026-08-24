"use client";

/**
 * Última linha de defesa: substitui o próprio <html>, então não herda nada
 * do layout raiz — as cores vão inline, sem depender do CSS carregar.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0a0b0d",
          color: "#e8eaed",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          padding: "1rem",
        }}
      >
        <div
          style={{
            maxWidth: "28rem",
            width: "100%",
            border: "1px solid #26292e",
            borderRadius: 6,
            background: "#121417",
            padding: "2rem",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "#f0564a",
            }}
          >
            Falha crítica
          </p>
          <h1 style={{ margin: "0.5rem 0 0", fontSize: 20, fontWeight: 600 }}>
            A aplicação não conseguiu carregar
          </h1>
          <p style={{ margin: "0.75rem 0 0", fontSize: 13, lineHeight: 1.6, color: "#8b9096" }}>
            Recarregue a página. Se o problema continuar, avise o suporte
            {error.digest ? ` com o código ${error.digest}` : ""}.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              height: 36,
              padding: "0 14px",
              border: 0,
              borderRadius: 6,
              background: "#f5a623",
              color: "#0a0b0d",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Recarregar
          </button>
        </div>
      </body>
    </html>
  );
}
