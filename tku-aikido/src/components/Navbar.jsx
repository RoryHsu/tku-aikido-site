import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";

const navItems = [
  {
    label: "首頁",
    path: "/",
  },
  {
    label: "關於",
    path: "/about",
  },
  {
    label: "教練",
    path: "/coaches",
  },
  {
    label: "社課",
    path: "/classes",
  },
  {
    label: "成果",
    path: "/achievements",
  },
  {
    label: "影片",
    path: "/videos",
  },
  {
    label: "聯絡",
    path: "/contact",
  },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    [
      "rounded-full px-3 py-2 text-sm font-semibold transition",
      isActive
        ? "bg-slate-950 text-white"
        : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
    ].join(" ");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-[76px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          onClick={closeMobileMenu}
          className="min-w-0 shrink-0"
          aria-label="回到淡江合氣道社首頁"
        >
          <div className="text-xs font-bold tracking-[0.35em] text-slate-400">
            TAMKANG UNIVERSITY
          </div>
          <div className="mt-1 text-2xl font-black leading-none text-slate-950">
            淡江合氣道社
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}

          <NavLink
            to="/admin/login"
            className={({ isActive }) =>
              [
                "ml-2 rounded-full border px-4 py-2 text-sm font-bold transition",
                isActive
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-950 hover:text-slate-950",
              ].join(" ")
            }
          >
            幹部登入
          </NavLink>

          <Link
            to="/contact"
            className="ml-2 rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            加入我們
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-sm lg:hidden"
          aria-label={mobileOpen ? "關閉選單" : "開啟選單"}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">
            <nav className="grid gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    [
                      "rounded-2xl px-4 py-3 text-base font-bold transition",
                      isActive
                        ? "bg-slate-950 text-white"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-950",
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              <NavLink
                to="/admin/login"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  [
                    "rounded-2xl px-4 py-3 text-base font-bold transition",
                    isActive
                      ? "bg-slate-950 text-white"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-950",
                  ].join(" ")
                }
              >
                幹部登入
              </NavLink>

              <Link
                to="/contact"
                onClick={closeMobileMenu}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-base font-black text-white hover:bg-slate-800"
              >
                加入我們
              </Link>
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}