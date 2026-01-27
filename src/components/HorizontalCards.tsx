"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

const lives = [
  { title: "Live #1", meta: "Twitch • 2.1k viewers", status: "LIVE" },
  { title: "Live #2", meta: "YouTube • 900 viewers", status: "LIVE" },
  { title: "Live #3", meta: "Twitch • 340 viewers", status: "LIVE" },
  { title: "Live #4", meta: "Kick • 120 viewers", status: "LIVE" },
  { title: "Live #5", meta: "Twitch • 88 viewers", status: "LIVE" },
];

export default function HorizontalCards() {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const cards = scroller.querySelectorAll<HTMLElement>("[data-card]");
    gsap.fromTo(
      cards,
      { y: 22, opacity: 0, filter: "blur(8px)" },
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.8,
        stagger: 0.08,
        scrollTrigger: { trigger: scroller, start: "top 80%" },
      }
    );
  }, []);

  return (
    <section id="live" className="relative bg-black">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[.35em] text-white/60">LIVE NOW</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-semibold tracking-[-.06em]">
              Des petites cases horizontales.
            </h2>
            <p className="mt-3 text-white/70 max-w-2xl">
              Une rangée de lives “cards”, clean et lisible.
            </p>
          </div>
        </div>

        <div ref={scrollerRef} className="mt-8 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
          {lives.map((l) => (
            <article
              key={l.title}
              data-card
              className="min-w-[260px] md:min-w-[320px] snap-start rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,.55)]"
            >
              <div className="relative h-44 bg-[radial-gradient(60%_60%_at_50%_35%,rgba(255,255,255,.14),transparent_55%),linear-gradient(120deg,rgba(255,80,170,.22),rgba(80,200,255,.16),rgba(0,0,0,.85))]">
                <div className="absolute top-3 left-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/55 border border-white/10 text-xs">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                  {l.status}
                </div>
              </div>
              <div className="p-5">
                <div className="text-lg font-semibold">{l.title}</div>
                <div className="mt-1 text-sm text-white/60">{l.meta}</div>

                <div className="mt-4 flex items-center gap-2">
                  <button className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition">
                    Watch
                  </button>
                  <button className="px-4 py-2 rounded-full border border-white/15 text-sm hover:border-white/30 hover:bg-white/5 transition">
                    Follow
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 text-xs text-white/50">
          (Démo) Tu brancheras tes vraies données plus tard.
        </div>
      </div>
    </section>
  );
}
