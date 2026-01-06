import { ImageResponse } from "next/og"

export const runtime = "edge"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(135deg, #0b1220 0%, #111827 50%, #0b1220 100%)",
          color: "#ffffff",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.35) 0%, rgba(99,102,241,0) 40%), radial-gradient(circle at 80% 30%, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0) 45%), radial-gradient(circle at 60% 80%, rgba(244,63,94,0.20) 0%, rgba(244,63,94,0) 45%)",
          }}
        />

        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 28,
              letterSpacing: 0.5,
              opacity: 0.9,
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: "#22c55e",
                boxShadow: "0 0 0 6px rgba(34,197,94,0.15)",
              }}
            />
            <span>blama.shop</span>
          </div>

          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05 }}>
            Tienda Online
            <br />
            Premium
          </div>

          <div style={{ fontSize: 28, maxWidth: 900, lineHeight: 1.35, color: "rgba(255,255,255,0.85)" }}>
            Productos seleccionados, ofertas y atención rápida por WhatsApp.
            <br />
            Envíos a domicilio en Perú.
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            {[
              "Compra simple",
              "Atención rápida",
              "Envíos a domicilio",
              "Ofertas",
            ].map((t) => (
              <div
                key={t}
                style={{
                  fontSize: 22,
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.18)",
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: 72,
            bottom: 60,
            fontSize: 22,
            color: "rgba(255,255,255,0.70)",
          }}
        >
          blama.shop
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
