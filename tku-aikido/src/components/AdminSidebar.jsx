import { Link, NavLink } from "react-router-dom";
import {
  CalendarDays,
  FileText,
  Home,
  Image,
  LogOut,
  ShieldCheck,
  Stamp,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const roleLabelMap = {
  president: "社長",
  vice: "副社長",
  finance: "財務長",
  activity: "活動長",
  pr: "公關",
};

const allMenuItems = [
  {
    label: "後台首頁",
    path: "/admin/dashboard",
    icon: Home,
    roles: ["president", "vice", "finance", "activity", "pr"],
  },
  {
    label: "職位授權管理",
    path: "/admin/roles",
    icon: ShieldCheck,
    roles: ["president"],
  },
  {
    label: "社員資料管理",
    path: "/admin/members",
    icon: Users,
    roles: ["president", "vice"],
  },
  {
    label: "活動公告管理",
    path: "/admin/events",
    icon: CalendarDays,
    roles: ["president", "vice", "finance", "activity", "pr"],
  },
  {
    label: "照片 / 影片管理",
    path: "/admin/media",
    icon: Image,
    roles: ["president", "vice", "finance", "activity", "pr"],
  },
  {
    label: "領款收據管理",
    path: "/admin/finance",
    icon: FileText,
    roles: ["president", "finance"],
  },
  {
    label: "社章設定",
    path: "/admin/seal",
    icon: Stamp,
    roles: ["president"],
  },
];

export default function AdminSidebar({ open = false, onClose }) {
  const { profile, logout } = useAuth();

  const role = profile?.role || "";
  const roleLabel = roleLabelMap[role] || role || "未設定";

  const visibleMenuItems = allMenuItems.filter((item) =>
    item.roles.includes(role)
  );

  const navClass = ({ isActive }) =>
    [
      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition",
      isActive
        ? "bg-white text-slate-950 shadow-sm"
        : "text-slate-300 hover:bg-white/10 hover:text-white",
    ].join(" ");

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-[320px] flex-col bg-slate-950 px-5 py-6 text-white shadow-2xl transition-transform duration-300 sm:w-80 lg:w-72 lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold tracking-[0.28em] text-slate-400">
            TKU AIKIDO ADMIN
          </div>

          <div className="mt-4 text-3xl font-black leading-tight">
            後台系統
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-300 hover:bg-white/10 lg:hidden"
          aria-label="關閉後台選單"
        >
          <X size={22} />
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <div className="text-xs text-slate-400">目前職位：</div>
        <div className="mt-1 text-base font-black text-white">{roleLabel}</div>

        {profile?.email ? (
          <div className="mt-1 break-all text-xs leading-5 text-slate-400">
            {profile.email}
          </div>
        ) : null}
      </div>

      <nav className="mt-7 flex-1 space-y-2 overflow-y-auto pr-1">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={navClass}
            >
              <Icon size={20} className="shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-white/10 pt-5">
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center justify-center rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-white/10"
        >
          回到主頁
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 hover:bg-slate-200"
        >
          <LogOut size={18} />
          登出
        </button>
      </div>
    </aside>
  );
}