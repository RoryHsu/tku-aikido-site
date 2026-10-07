import { Link, NavLink } from "react-router-dom";
import { ExternalLink, LogOut, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { adminMenuItems, roleLabelMap } from "./adminMenu";
import logo from "../assets/brand/logo.webp";

export default function AdminSidebar({ open = false, onClose }) {
  const { profile, logout } = useAuth();

  const role = profile?.role || "";
  const roleLabel = roleLabelMap[role] || role || "未設定";

  const visibleMenuItems = adminMenuItems.filter((item) =>
    item.roles.includes(role)
  );

  const navClass = ({ isActive }) =>
    [
      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition",
      isActive
        ? "bg-amber-700 text-white"
        : "text-slate-300 hover:bg-white/10 hover:text-white",
    ].join(" ");

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-slate-950 px-4 py-5 text-white shadow-2xl transition-transform duration-300 lg:w-64 lg:translate-x-0 lg:shadow-none",
        open ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}
    >
      {/* 社徽與標題 */}
      <div className="flex items-center justify-between gap-3 px-1">
        <Link to="/admin/dashboard" onClick={onClose} className="flex min-w-0 items-center gap-3">
          <img src={logo} alt="" className="h-10 w-10 shrink-0 rounded-full bg-white" />
          <div className="min-w-0">
            <div className="truncate font-serif text-lg font-black leading-tight">
              淡江合氣道社
            </div>
            <div className="text-xs font-bold tracking-[0.2em] text-slate-400">
              後台管理
            </div>
          </div>
        </Link>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 lg:hidden"
          aria-label="關閉後台選單"
        >
          <X size={20} />
        </button>
      </div>

      {/* 目前登入者 */}
      <div className="mt-5 rounded-xl bg-white/5 px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-bold">{profile?.name || "幹部"}</span>
          <span className="shrink-0 rounded-full bg-amber-700 px-2 py-0.5 text-xs font-bold">
            {roleLabel}
          </span>
        </div>
        {profile?.email ? (
          <div className="mt-1 truncate text-xs text-slate-400">{profile.email}</div>
        ) : null}
      </div>

      <nav className="mt-5 flex-1 space-y-1 overflow-y-auto">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink key={item.path} to={item.path} onClick={onClose} className={navClass}>
              <Icon size={18} className="shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-4 space-y-1 border-t border-white/10 pt-4">
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <ExternalLink size={18} />
          回到網站首頁
        </Link>

        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <LogOut size={18} />
          登出
        </button>
      </div>
    </aside>
  );
}
