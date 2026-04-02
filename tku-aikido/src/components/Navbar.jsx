import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const nav = [
    ["/", "首頁"],
    ["/about", "關於"],
    ["/coaches", "教練"],
    ["/classes", "社課"],
    ["/achievements", "成果"],
    ["/videos", "影片"],
    ["/contact", "聯絡"],
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link to="/" className="group">
          <div className="text-xs tracking-[0.25em] text-slate-500">
            TAMKANG UNIVERSITY
          </div>
          <div className="mt-1 text-2xl font-black tracking-tight text-slate-900 group-hover:text-slate-700">
            淡江合氣道社
          </div>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {nav.map(([to, label]) => (
            <Link
              key={to}
              to={to}
              className="text-sm font-medium text-slate-700 transition hover:text-slate-900"
            >
              {label}
            </Link>
          ))}

          <Link
            to="/admin/login"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            幹部登入
          </Link>

          <Link
            to="/contact"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            加入我們
          </Link>
        </nav>

        <button
          className="rounded-xl border border-slate-200 p-2 lg:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col px-6 py-3 lg:px-10">
            {nav.map(([to, label]) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className="border-b border-slate-100 py-3 text-sm text-slate-700 last:border-0"
              >
                {label}
              </Link>
            ))}

            <Link
              to="/admin/login"
              onClick={() => setOpen(false)}
              className="border-b border-slate-100 py-3 text-sm text-slate-700"
            >
              幹部登入
            </Link>

            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="py-3 text-sm font-semibold text-slate-900"
            >
              加入我們
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}