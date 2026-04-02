import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminSidebar() {
  const { profile } = useAuth();
  const role = profile?.role || "";

  const canManageRoles = role === "president";
  const canManageMembers = role === "president" || role === "vice";
  const canManageEvents =
    role === "president" ||
    role === "vice" ||
    role === "finance" ||
    role === "activity";
  const canManageMedia =
    role === "president" ||
    role === "vice" ||
    role === "finance" ||
    role === "activity";

  const navClass = ({ isActive }) =>
    `block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
      isActive
        ? "bg-white text-slate-900 shadow-sm"
        : "text-white/80 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <aside className="min-h-screen w-[240px] bg-slate-950 px-5 py-8">
      <div className="text-xs tracking-[0.24em] text-slate-400">
        TKU AIKIDO ADMIN
      </div>

      <div className="mt-3 text-4xl font-black text-white">後台系統</div>

      <nav className="mt-10 space-y-3">
        <NavLink to="/admin/dashboard" className={navClass}>
          後台首頁
        </NavLink>

        {canManageRoles ? (
          <NavLink to="/admin/roles" className={navClass}>
            職位授權管理
          </NavLink>
        ) : null}

        {canManageMembers ? (
          <NavLink to="/admin/members" className={navClass}>
            社員資料管理
          </NavLink>
        ) : null}

        {canManageEvents ? (
          <NavLink to="/admin/events" className={navClass}>
            活動公告管理
          </NavLink>
        ) : null}

        {canManageMedia ? (
          <NavLink to="/admin/media" className={navClass}>
            照片 / 影片管理
          </NavLink>
        ) : null}
      </nav>
    </aside>
  );
}