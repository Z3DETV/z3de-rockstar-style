"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function Marquee() {
  const rowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const items = row.querySelectorAll("[data-marquee-item]");
    const totalWidth = Array.from(items).reduce((acc, el) => acc + (el as HTMLElement).offsetWidth, 0);

    const clone = row.cloneNode(true) as HTMLDivElement;
    row.parentElement?.appendChild(clone);

    gsap.set([row, clone], { x: 0 });
    gsap.set(clone, { x: totalWidth });

    const tl = gsap.timeline({ repeat: -1, defaults: { ease: "none" } });
    tl.to([row, clone], { x: `-=${totalWidth}`, duration: 18 });

    return () => {
  tl.kill();
};

  }, []);

  const pills = ["LIVE", "COMMUNITY", "REWARDS", "NO ADS", "DUAL-STREAM", "CLIPS", "EVENTS"];

  return (
    <section className="relative border-y border-white/10 bg-black">
      <div className="mx-auto max-w-6xl px-4 py-4 overflow-hidden">
        <div className="flex gap-3 whitespace-nowrap" ref={rowRef}>
          {Array.from({ length: 2 }).flatMap((_, blockIdx) =>
            pills.map((p, idx) => (
              <span
                data-marquee-item
                key={`${blockIdx}-${idx}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs tracking-[.28em] text-white/70"
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/50" />
                {p}
              </span>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
