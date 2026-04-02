import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children }) {
  const { profile, currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <main className="flex-1">
        <div className="border-b bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div>
              <div className="text-xs tracking-[0.24em] text-slate-500">
                TKU AIKIDO ADMIN
              </div>
              <div className="text-2xl font-black text-slate-900">
                後台管理系統
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-900">
                  {profile?.name || "未命名使用者"}
                </div>
                <div className="text-xs text-slate-500">
                  {profile?.role || "無角色"} / {currentUser?.email}
                </div>
              </div>

              <Link
                to="/"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                回到主頁
              </Link>

              <button
                onClick={handleLogout}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                登出
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}