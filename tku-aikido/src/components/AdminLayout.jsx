import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "./AdminSidebar";

const roleLabelMap = {
  president: "社長",
  vice: "副社長",
  finance: "財務長",
  activity: "活動長",
  pr: "公關",
};

export default function AdminLayout({ children }) {
  const { profile, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const roleLabel = roleLabelMap[profile?.role] || profile?.role || "未設定";

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Mobile / Tablet overlay */}
      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      {/* Sidebar */}
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main area */}
      <div className="min-h-screen lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm lg:hidden"
                aria-label="開啟後台選單"
              >
                <Menu size={22} />
              </button>

              <div className="min-w-0">
                <div className="text-xs font-bold tracking-[0.25em] text-slate-400 sm:text-sm">
                  TKU AIKIDO ADMIN
                </div>

                <h1 className="mt-1 truncate text-2xl font-black text-slate-900 sm:text-3xl">
                  後台管理系統
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="hidden text-right sm:block">
                <div className="text-sm font-bold text-slate-900">
                  {profile?.name || "幹部"}
                </div>
                <div className="max-w-[220px] truncate text-xs text-slate-500">
                  {roleLabel} / {profile?.email || ""}
                </div>
              </div>

              <Link
                to="/"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 sm:px-4"
              >
                回到主頁
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800 sm:px-4"
              >
                登出
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10 xl:px-14">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}