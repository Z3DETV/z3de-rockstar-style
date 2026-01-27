"use client";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative h-[100svh] w-full overflow-hidden snap-start"
    >
      {/* Video background */}
      <video
        className="absolute inset-0 h-full w-full object-cover scale-105"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/trailer.mp4" type="video/mp4" />
      </video>

      {/* Fallback (si vidéo lente) */}
      <div className="absolute inset-0 bg-black -z-10" />

      {/* Overlays */}
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_20%,rgba(255,255,255,.12),transparent_60%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-16 pt-28">
        <p className="text-xs md:text-sm tracking-[.35em] text-white/75">
          CINEMATIC PLATFORM • WATCH • PLAY • EARN
        </p>

        <h1 className="mt-4 text-5xl md:text-7xl font-semibold leading-[0.95] tracking-[-.06em]">
          Z3DE<span className="text-white/70">.</span>GG
        </h1>

        <p className="mt-5 max-w-2xl text-base md:text-lg text-white/80">
          Une nouvelle expérience streaming : lives en cases, communauté active,
          mini-jeu viewer.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="#showcase"
            className="rounded-full bg-white px-6 py-3 font-medium text-black hover:bg-white/90 transition"
          >
            Découvrir
          </a>

          <a
            href="#live"
            className="rounded-full border border-white/30 px-6 py-3 text-white hover:bg-white/10 transition"
          >
            Voir les lives
          </a>
        </div>
      </div>
    </section>
  );
}
