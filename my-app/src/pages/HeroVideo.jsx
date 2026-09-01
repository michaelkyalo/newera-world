import React, { useEffect, useRef, useState } from "react";

/* =========================================================
   HERO — VIDEO BACKGROUND + GLASSMORPHISM
   =========================================================
   Drop-in replacement for the <section className="hero-section">
   block in StoreFront.jsx. Uses Tailwind utilities against the
   @theme tokens defined in index.css (bg-ink, text-brass, etc.)
   so it lives independently of StoreFront.css.

   BEFORE USING:
   1. Put your loop video at:  public/videos/hero-loop.mp4
      (optionally an .webm too — see <source> tags below)
   2. Put a poster frame at:   public/videos/hero-poster.jpg
      (a still frame shown before the video loads, and on
      mobile / reduced-motion / slow connections instead of
      the video — keeps the hero fast and battery-friendly)
   3. Swap heroProduct / addToCart props for whatever
      StoreFront.jsx already passes to the current hero.
   ========================================================= */

export default function HeroVideo({ heroProduct, onShopClick }) {
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reducedMotion && videoRef.current) {
      videoRef.current.pause();
    }
  }, [reducedMotion]);

  return (
    <section className="relative isolate overflow-hidden bg-ink min-h-[92vh] flex items-center">
      {/* ---------------------------------------------------
          VIDEO BACKGROUND
          --------------------------------------------------- */}
      {!reducedMotion && (
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
          autoPlay
          muted
          loop
          playsInline
          poster="/videos/hero-poster.jpg"
          onCanPlay={() => setVideoReady(true)}
        >
          <source src="/videos/hero-loop.webm" type="video/webm" />
          <source src="/videos/hero-loop.mp4" type="video/mp4" />
        </video>
      )}

      {/* Static fallback for reduced-motion users, or while video loads */}
      <img
        src="/videos/hero-poster.jpg"
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full object-cover ${
          !reducedMotion && videoReady ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Darken + grade the footage so text stays legible and
          the palette reads as ours, not the raw clip's colors */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink/55 to-ink/90" />
      <div className="absolute inset-0 bg-ink/20 mix-blend-multiply" />

      {/* ---------------------------------------------------
          CONTENT
          --------------------------------------------------- */}
      <div className="relative z-10 mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-12 px-6 py-24 md:grid-cols-2 md:px-16">
        {/* ---- Glass card: copy + CTA ---- */}
        <div
          className="
            flex flex-col items-start gap-6 rounded-md
            border border-bone/10 bg-bone/[0.06]
            p-8 backdrop-blur-2xl backdrop-saturate-150
            shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]
            md:p-10
          "
        >
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-brass-light">
            <span className="h-px w-8 bg-brass" />
            Premium Headwear
          </div>

          <h1 className="font-display text-[clamp(38px,5.5vw,64px)] font-semibold leading-[0.98] text-bone">
            Wear your
            <br />
            <span className="font-normal italic text-crimson-light">
              style.
            </span>
          </h1>

          <p className="max-w-[380px] text-[15px] leading-relaxed text-bone/75">
            Find premium fitted, snapback and classic caps that match your
            personality — built for everyday wear, delivered across Kenya.
          </p>

          <button
            onClick={onShopClick}
            className="
              group inline-flex items-center gap-2.5 rounded-sm
              bg-brass px-7 py-4 text-[13.5px] font-semibold
              tracking-wide text-ink transition-colors
              hover:bg-brass-light
            "
          >
            Shop The Collection
            <span className="transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </button>
        </div>

        {/* ---- SVG cap illustration, floating over the video ---- */}
        <div className="relative hidden items-center justify-center md:flex">
          <div className="absolute h-[280px] w-[280px] rounded-full bg-crimson/20 blur-3xl" />
          <CapIllustration className="relative w-[320px] max-w-full drop-shadow-[0_25px_35px_rgba(0,0,0,0.55)] animate-[float_6s_ease-in-out_infinite]" />

          {heroProduct && (
            <div
              className="
                absolute bottom-2 left-1/2 -translate-x-1/2
                rounded-sm border border-bone/10 bg-ink/70
                px-5 py-2.5 text-center backdrop-blur-md
              "
            >
              <strong className="block font-display text-sm text-bone">
                {heroProduct.name}
              </strong>
              <small className="font-mono text-[9.5px] tracking-[0.15em] text-brass-light">
                {heroProduct.category}
              </small>
            </div>
          )}
        </div>
      </div>

      {/* Keyframes for the gentle float — Tailwind v4 lets you
          reference this directly via animate-[float_...] above */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
      `}</style>
    </section>
  );
}

/* =========================================================
   ORIGINAL SVG CAP ILLUSTRATION
   =========================================================
   A flat, line-art snapback in brand colors — a placeholder
   for your real illustration. Swap this component out for an
   <img src="/assets/cap-illustration.svg" /> once you have one,
   the layout around it won't need to change.
   ========================================================= */

function CapIllustration({ className }) {
  return (
    <svg
      viewBox="0 0 320 260"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* brim */}
      <path
        d="M40 165 Q160 210 300 150 Q290 190 220 205 Q120 222 55 195 Q35 183 40 165Z"
        fill="#0c0c0d"
        stroke="#c19a4f"
        strokeWidth="2"
      />
      {/* crown */}
      <path
        d="M55 170 C55 90 105 40 165 40 C222 40 262 88 262 155 C262 165 255 170 245 170 L70 170 C62 170 55 170 55 170Z"
        fill="#18181b"
        stroke="#c19a4f"
        strokeWidth="2.5"
      />
      {/* crown panel seams */}
      <path
        d="M165 40 C170 80 172 130 168 170"
        fill="none"
        stroke="#e3c68455"
        strokeWidth="1.5"
      />
      <path
        d="M110 48 C95 85 88 130 92 168"
        fill="none"
        stroke="#e3c68455"
        strokeWidth="1.5"
      />
      <path
        d="M220 48 C235 85 242 130 238 168"
        fill="none"
        stroke="#e3c68455"
        strokeWidth="1.5"
      />
      {/* stitched brim topstitch — signature motif */}
      <path
        d="M50 168 Q160 208 292 152"
        fill="none"
        stroke="#c19a4f"
        strokeWidth="1.5"
        strokeDasharray="4 5"
      />
      {/* front badge */}
      <circle cx="165" cy="105" r="26" fill="#a3323c" stroke="#e3c684" strokeWidth="2" />
      <path
        d="M155 105 l7 7 15 -17"
        fill="none"
        stroke="#f5f1e8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* button on top */}
      <circle cx="165" cy="40" r="5" fill="#c19a4f" />
    </svg>
  );
}