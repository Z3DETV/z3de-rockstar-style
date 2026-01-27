"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

const slides = [
  { title: "Immersion", desc: "Sections pleine largeur au rendu “film”.", tag: "CINEMATIC UI" },
  { title: "Lives en cases", desc: "Découverte rapide sans player géant.", tag: "DISCOVERY" },
  { title: "Mini-jeu viewer", desc: "XP, drops, missions — fun, sans charge streamer.", tag: "RETENTION" },
];

export default function PinnedShowcase() {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const panels = wrap.querySelectorAll<HTMLElement>("[data-panel]");
    const images = wrap.querySelectorAll<HTMLElement>("[data-image]");

    gsap.set(panels, { opacity: 0.25 });
    gsap.set(panels[0], { opacity: 1 });
    gsap.set(images, { opacity: 0, scale: 1.04, filter: "blur(8px)" });
    gsap.set(images[0], { opacity: 1, scale: 1, filter: "blur(0px)" });

    const st = ScrollTrigger.create({
      trigger: wrap,
      start: "top top",
      end: `+=${slides.length * 100}%`,
      pin: true,
      scrub: 1,
      onUpdate: (self) => {
        const idx = Math.min(slides.length - 1, Math.floor(self.progress * slides.length));
        panels.forEach((p, i) => gsap.to(p, { opacity: i === idx ? 1 : 0.25, duration: 0.2 }));
        images.forEach((img, i) =>
          gsap.to(img, {
            opacity: i === idx ? 1 : 0,
            scale: i === idx ? 1 : 1.04,
            filter: i === idx ? "blur(0px)" : "blur(8px)",
            duration: 0.35,
          })
        );
      },
    });

    return () => st.kill();
  }, []);

  return (
    <section id="showcase" className="relative bg-black">
      <div ref={wrapRef} className="relative min-h-[100svh]">
        <div className="absolute inset-0">
          {slides.map((s, i) => (
            <div
              key={s.title}
              data-image
              className="absolute inset-0"
              style={{
                background:
                  i === 0
                    ? "radial-gradient(60% 60% at 40% 35%, rgba(255,255,255,.10), rgba(0,0,0,0) 55%), linear-gradient(120deg, rgba(255,80,170,.25), rgba(80,200,255,.12), rgba(0,0,0,.9))"
                    : i === 1
                    ? "radial-gradient(60% 60% at 55% 40%, rgba(255,255,255,.09), rgba(0,0,0,0) 55%), linear-gradient(120deg, rgba(0,0,0,.9), rgba(120,255,180,.16), rgba(0,0,0,.92))"
                    : "radial-gradient(60% 60% at 45% 30%, rgba(255,255,255,.08), rgba(0,0,0,0) 55%), linear-gradient(120deg, rgba(255,200,120,.16), rgba(180,80,255,.16), rgba(0,0,0,.92))",
              }}
            />
          ))}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.55),rgba(0,0,0,.9)_70%,#000)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 pt-24 md:pt-28">
          <div className="max-w-2xl">
            <p className="text-xs tracking-[.35em] text-white/60">FEATURES</p>
            <h2 className="mt-3 text-4xl md:text-6xl font-semibold leading-[0.95] tracking-[-.06em]">
              Un scroll qui raconte une histoire.
            </h2>
            <p className="mt-4 text-white/70">
              Section “pinnée” : l’ambiance change comme une bande-annonce.
            </p>
          </div>

          <div className="mt-10 grid md:grid-cols-3 gap-4 pb-16">
            {slides.map((s) => (
              <article key={s.title} data-panel className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 md:p-6 shadow-[0_20px_60px_rgba(0,0,0,.55)]">
                <div className="text-[10px] tracking-[.35em] text-white/60">{s.tag}</div>
                <h3 className="mt-3 text-2xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-white/70">{s.desc}</p>
              </article>
            ))}
          </div>

          <div className="pb-10 text-xs text-white/50">
            Tu pourras remplacer ces fonds par tes vidéos (MP4/WebM).
          </div>
        </div>
      </div>
    </section>
  );
}
