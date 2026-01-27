"use client";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-all",
        scrolled
          ? "backdrop-blur-md bg-black/35 border-b border-white/10"
          : "bg-transparent",
      ].join(" ")}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="h-16 flex items-center justify-between gap-3">
          <a href="#top" className="tracking-[.22em] font-semibold text-sm md:text-base select-none">
            Z3DE<span className="opacity-60">.GG</span>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm text-white/80">
            <a className="hover:text-white transition" href="#showcase">SHOWCASE</a>
            <a className="hover:text-white transition" href="#live">LIVE</a>
            <a className="hover:text-white transition" href="#community">COMMUNITY</a>
          </nav>

          <div className="flex items-center gap-2">
            <a className="px-3 py-2 rounded-full text-xs md:text-sm border border-white/15 hover:border-white/30 hover:bg-white/5 transition" href="#">
              Login
            </a>
            <a className="px-3 py-2 rounded-full text-xs md:text-sm bg-white text-black hover:bg-white/90 transition" href="#">
              Register
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
