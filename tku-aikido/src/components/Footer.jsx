export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1fr_1fr_1.15fr] lg:px-10">
        
        {/* 左邊：社團名稱 */}
        <div>
          <div className="text-xs tracking-[0.25em] text-slate-400">
            TAMKANG UNIVERSITY AIKIDO CLUB
          </div>

          <div className="mt-3 text-3xl font-black">
            淡江合氣道社
          </div>

        </div>

        {/* 中間：聯絡資訊 */}
        <div className="space-y-3 text-sm text-slate-400">

          <a
            href="https://www.instagram.com/tku.aikido?igsh=MWFpNzZzemNwcmE2ag=="
            target="_blank"
            rel="noreferrer"
            className="block transition hover:text-white"
          >
            Instagram：tku.aikido
          </a>

          <a
            href="https://www.facebook.com/share/1FwxQNkGYD/"
            target="_blank"
            rel="noreferrer"
            className="block transition hover:text-white"
          >
            Facebook：淡江大學合氣道社
          </a>

          <a
            href="mailto:30190@tkueca.org"
            className="block transition hover:text-white"
          >
            Email：30190@tkueca.org
          </a>

        </div>

        {/* 右邊：版權 */}
        <div className="text-sm text-slate-500 lg:text-right">
          © {new Date().getFullYear()} TKU Aikido Club  
          <br />
          All rights reserved.
        </div>

      </div>
    </footer>
  );
}