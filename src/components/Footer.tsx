export default function Footer() {
  return (
    <footer id="community" className="border-t border-white/10 bg-black">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="tracking-[.22em] font-semibold">Z3DE.GG</div>
            <p className="mt-3 text-sm text-white/60">
              Template cinématique prêt à recevoir tes vidéos & ton backend.
            </p>
          </div>
          <div className="text-sm text-white/60">
            <div className="text-white/80 mb-2">Sections</div>
            <ul className="space-y-2">
              <li><a className="hover:text-white transition" href="#showcase">Showcase</a></li>
              <li><a className="hover:text-white transition" href="#live">Lives</a></li>
              <li><a className="hover:text-white transition" href="#top">Top</a></li>
            </ul>
          </div>
          <div className="text-sm text-white/60">
            <div className="text-white/80 mb-2">Next</div>
            <p>On ajoute ta vidéo 30s + un bouton “Join beta”.</p>
          </div>
        </div>

        <div className="mt-10 text-xs text-white/40">
          © {new Date().getFullYear()} Z3DE.GG — demo build
        </div>
      </div>
    </footer>
  );
}
