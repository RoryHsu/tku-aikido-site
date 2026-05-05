import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import {
  CalendarDays,
  FileText,
  Home,
  Image,
  LogOut,
  ShieldCheck,
  Stamp,
  Users,
} from "lucide-react";
import { auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

const roleLabelMap = {
  president: "社長",
  vice: "副社長",
  finance: "財務長",
  activity: "活動長",
  pr: "公關",
};

export default function AdminSidebar() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const role = profile?.role || "";
  const roleLabel = roleLabelMap[role] || "未設定";

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
      isActive
        ? "bg-white text-slate-950 shadow-sm"
        : "text-slate-300 hover:bg-white/10 hover:text-white"
    }`;

  const canManageRoles = role === "president";
  const canManageMembers = role === "president" || role === "vice";
  const canManageFinance = role === "president" || role === "finance";
  const canManageClubSeal = role === "president";

  const canManageEvents = [
    "president",
    "vice",
    "finance",
    "activity",
    "pr",
  ].includes(role);

  const canManageMedia = [
    "president",
    "vice",
    "finance",
    "activity",
    "pr",
  ].includes(role);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/admin/login");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-slate-950 px-5 py-6 text-white">
      <div>
        <div className="text-xs font-semibold tracking-[0.28em] text-slate-400">
          TKU AIKIDO ADMIN
        </div>

        <div className="mt-4 text-3xl font-black">後台系統</div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          目前職位：
          <span className="ml-1 font-bold text-white">{roleLabel}</span>
        </div>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-2">
        <NavLink to="/admin/dashboard" className={navClass}>
          <Home className="h-4 w-4" />
          後台首頁
        </NavLink>

        {canManageRoles ? (
          <NavLink to="/admin/roles" className={navClass}>
            <ShieldCheck className="h-4 w-4" />
            職位授權管理
          </NavLink>
        ) : null}

        {canManageMembers ? (
          <NavLink to="/admin/members" className={navClass}>
            <Users className="h-4 w-4" />
            社員資料管理
          </NavLink>
        ) : null}

        {canManageEvents ? (
          <NavLink to="/admin/events" className={navClass}>
            <CalendarDays className="h-4 w-4" />
            活動公告管理
          </NavLink>
        ) : null}

        {canManageMedia ? (
          <NavLink to="/admin/media" className={navClass}>
            <Image className="h-4 w-4" />
            照片 / 影片管理
          </NavLink>
        ) : null}

        {canManageFinance ? (
          <NavLink to="/admin/finance" className={navClass}>
            <FileText className="h-4 w-4" />
            領款收據管理
          </NavLink>
        ) : null}

        {canManageClubSeal ? (
          <NavLink to="/admin/club-seal" className={navClass}>
            <Stamp className="h-4 w-4" />
            社章設定
          </NavLink>
        ) : null}
      </nav>

      <div className="border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-3 w-full rounded-2xl border border-white/10 px-4 py-3 text-left text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          回到主頁
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
        >
          <LogOut className="h-4 w-4" />
          登出
        </button>
      </div>
    </aside>
  );
}