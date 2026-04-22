import { useEffect, useMemo, useRef, useState } from "react";

/* ───────────────────────────────────────────── */
/*  Pixel Grid Background                        */
/* ───────────────────────────────────────────── */

function PixelGrid() {
  const cols = 28;
  const rows = 10;

  const pixels = useMemo(() => {
    const green = ["#00C896", "#00A87A", "#006B4F", "#B8F5E0", "#00E8A8"];
    return Array.from({ length: cols * rows }, (_, i) => ({
      id: i,
      shade: Math.random() > 0.4,
      delay: Math.random() * 1.77,
      color: green[Math.floor(Math.random() * green.length)],
    }));
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        opacity: 0.15,
        pointerEvents: "none",
      }}
    >
      {pixels.map((pixel) => (
        <div
          key={pixel.id}
          style={{
            background: pixel.shade ? pixel.color : "transparent",
            margin: "1px",
            animation: `pixelBlink ${1.5 + pixel.delay}s ease-in-out infinite`,
            animationDelay: `${pixel.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ───────────────────────────────────────────── */
/*  Main Component                               */
/* ───────────────────────────────────────────── */

export default function DevWrapLanding() {
  const [phase, setPhase] = useState("black");
  const timers = useRef([]);

  const addTimer = (fn, delay) => {
    const t = setTimeout(fn, delay);
    timers.current.push(t);
  };

  useEffect(() => {
    addTimer(() => setPhase("sc-ece-reveal"), 400);
    addTimer(() => setPhase("sc-ece-hold"), 2500);
    addTimer(() => setPhase("transition"), 4200);
    addTimer(() => setPhase("devwrap-reveal"), 5200);
    addTimer(() => setPhase("welcome"), 6500);
    addTimer(() => setPhase("complete"), 8500);

    return () => timers.current.forEach(clearTimeout);
  }, []);

  const showDevWrap =
    phase === "devwrap-reveal" || phase === "welcome" || phase === "complete";

  const showLoader = !showDevWrap;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes pixelBlink {
          0%,100% { opacity:.3; transform:scale(.85); }
          50% { opacity:1; transform:scale(1); }
        }

        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes fadeUp {
          from{opacity:0; transform:translateY(30px)}
          to{opacity:1; transform:translateY(0)}
        }

        @keyframes marqueeScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        @keyframes scEceReveal {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes glowPulse {
          0%, 100% { text-shadow: 0 0 15px rgba(0, 232, 168, 0.3), 0 0 25px rgba(0, 200, 150, 0.15); }
          50% { text-shadow: 0 0 20px rgba(0, 232, 168, 0.5), 0 0 35px rgba(0, 200, 150, 0.25); }
        }

        @keyframes devwrapGlow {
          0%, 100% { text-shadow: 0 0 20px rgba(0, 200, 150, 0.3); }
          50% { text-shadow: 0 0 40px rgba(0, 232, 168, 0.6), 0 0 60px rgba(0, 200, 150, 0.4); }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          overflow: "hidden",
          background: showDevWrap ? "#0A0A0A" : "#000",
          transition: "background 0.8s ease",
          fontFamily: "'Space Mono', monospace",
        }}
      >
        {/* ───────────── LOADER TEXT ───────────── */}
        {showLoader && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#00C896",
              fontFamily: "'Syne', sans-serif",
              textAlign: "center",
              animation: "scEceReveal 0.8s ease forwards",
            }}
          >
            {/* Main Text */}
            <div
              style={{
                fontSize: "clamp(50px, 9vw, 100px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                marginBottom: 30,
                animation:
                  "scEceReveal 1s ease forwards, glowPulse 3s ease-in-out infinite",
                textShadow:
                  "0 0 15px rgba(0, 232, 168, 0.3), 0 0 25px rgba(0, 200, 150, 0.15)",
              }}
            >
              SC-ECE
              <br />
              PRESENTS
            </div>

            {/* Decorative Line */}
            <div
              style={{
                width: "clamp(100px, 20vw, 300px)",
                height: 3,
                background:
                  "linear-gradient(90deg, #00C896 0%, #00E8A8 50%, #00C896 100%)",
                marginBottom: 40,
                borderRadius: 2,
                animation: "slideIn 0.8s ease 0.3s forwards",
                opacity: 0,
              }}
            />

            {/* Subtitle */}
            <div
              style={{
                fontSize: 14,
                letterSpacing: "0.2em",
                color: "#999",
                fontFamily: "'Space Mono', monospace",
                textTransform: "uppercase",
                animation: "slideIn 1s ease 0.4s forwards",
                opacity: 0,
              }}
            >
              INNOVATION × DESIGN × ENGINEERING
            </div>

            {/* Hackathon Participant Guide */}
            <div
              style={{
                marginTop: 80,
                padding: "20px 30px",
                background: "rgba(0, 200, 150, 0.1)",
                border: "1px solid rgba(0, 232, 168, 0.3)",
                borderRadius: 8,
                fontSize: 12,
                letterSpacing: "0.1em",
                color: "#00E8A8",
                fontFamily: "'Space Mono', monospace",
                textAlign: "center",
                animation: "slideIn 1.2s ease 0.6s forwards",
                opacity: 0,
                maxWidth: "90%",
              }}
            >
              💡 <strong>Ready to build?</strong>
              <br />
              Start editing{" "}
              <code style={{ color: "#00F5BB" }}>src/App.jsx</code> to
              customize this page
            </div>
          </div>
        )}

        {/* ───────────── DEVWRAP SECTION ───────────── */}
        {showDevWrap && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#F5F5F0",
              animation: "fadeIn .8s ease forwards",
            }}
          >
            {/* TOP MARQUEE BAR */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 36,
                background: "#00C896",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  whiteSpace: "nowrap",
                  animation: "marqueeScroll 12s linear infinite",
                }}
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#000",
                      letterSpacing: "0.2em",
                      padding: "0 32px",
                    }}
                  >
                    SC-ECE PRESENTS · DEVWRAP · FROM SKETCH TO SOLUTION ·
                  </span>
                ))}
              </div>
            </div>

            <PixelGrid />

            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(60px, 10vw, 130px)",
                letterSpacing: "-0.04em",
                lineHeight: 0.9,
                animation: "devwrapGlow 3s ease-in-out infinite",
                textShadow: "0 0 20px rgba(0, 200, 150, 0.3)",
              }}
            >
              devwrap
            </div>

            <div
              style={{
                marginTop: 18,
                fontSize: 12,
                letterSpacing: "0.4em",
                color: "#00C896",
                textTransform: "uppercase",
                animation: "fadeUp .8s ease forwards",
              }}
            >
              From Sketch to Solution
            </div>

            {(phase === "welcome" || phase === "complete") && (
              <div
                style={{
                  marginTop: 40,
                  textAlign: "center",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 20,
                  opacity: 0.75,
                  animation: "fadeUp 1s ease forwards",
                }}
              >
                Welcome, Builders. 🚀
                <br />
                <span style={{ opacity: 0.6, fontSize: 16 }}>
                  Turn your ideas into interfaces.
                </span>
              </div>
            )}

            {/* Hackathon Participant Guide */}
            <div
              style={{
                position: "absolute",
                bottom: 40,
                padding: "16px 28px",
                background: "rgba(0, 200, 150, 0.08)",
                border: "1px solid rgba(0, 232, 168, 0.25)",
                borderRadius: 8,
                fontSize: 12,
                letterSpacing: "0.1em",
                color: "#00E8A8",
                fontFamily: "'Space Mono', monospace",
                textAlign: "center",
                animation: "slideIn 1.2s ease 0.6s forwards",
                opacity: 0,
              }}
            >
              💡 <strong>Ready to customize?</strong>
              <br />
              Start editing{" "}
              <code style={{ color: "#00F5BB" }}>src/App.jsx</code> to make
              changes
            </div>
          </div>
        )}
      </div>
    </>
  );
}
