import AdminSidebar from "./AdminSidebar";
import { useAuth } from "../context/AuthContext";

const roleLabelMap = {
  president: "社長",
  vice: "副社長",
  finance: "財務長",
  activity: "活動長",
  pr: "公關",
};

export default function AdminLayout({ children }) {
  const { currentUser, profile } = useAuth();

  const role = profile?.role || "";
  const roleLabel = roleLabelMap[role] || role || "未設定";
  const name = profile?.name || "幹部";
  const email = currentUser?.email || "";

  return (
    <div className="min-h-screen bg-slate-100">
      <AdminSidebar />

      <div className="min-h-screen pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-24 items-center justify-between px-10">
            <div>
              <div className="text-xs font-semibold tracking-[0.28em] text-slate-400">
                TKU AIKIDO ADMIN
              </div>

              <div className="mt-2 text-3xl font-black text-slate-950">
                後台管理系統
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-bold text-slate-900">{name}</div>
                <div className="text-sm text-slate-500">
                  {roleLabel} / {email}
                </div>
              </div>

              <a
                href="/"
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                回到主頁
              </a>
            </div>
          </div>
        </header>

        <main className="px-10 py-10">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}