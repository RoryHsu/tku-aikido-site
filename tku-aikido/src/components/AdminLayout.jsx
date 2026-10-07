import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "./AdminSidebar";
import { adminMenuItems, roleLabelOf } from "./adminMenu";
import DeveloperRoleSwitcher from "./DeveloperRoleSwitcher";

export default function AdminLayout({ children }) {
  const { profile } = useAuth();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const roleLabel = roleLabelOf(profile);
  const currentPage =
    adminMenuItems.find((item) => pathname.startsWith(item.path))?.label ||
    "後台管理";

  return (
    <div className="min-h-screen bg-slate-100">
      {/* 手機 / 平板：側邊欄打開時的遮罩 */}
      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen lg:pl-64">
        {/* 頂部欄：顯示目前頁面名稱；回到主頁、登出統一放在側邊欄 */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 lg:hidden"
                aria-label="開啟後台選單"
              >
                <Menu size={20} />
              </button>

              <div className="truncate text-lg font-black text-slate-900 sm:text-xl">
                {currentPage}
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-2">
            {profile?.isDeveloper ? <DeveloperRoleSwitcher /> : null}
            <div className="flex min-w-0 items-center gap-2 rounded-full bg-slate-100 py-1 pl-1 pr-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-700 text-sm font-black text-white">
                {(profile?.name || "幹")[0]}
              </span>
              <span className="hidden truncate text-sm font-bold text-slate-700 sm:inline">
                {profile?.name || "幹部"}
              </span>
              <span className="shrink-0 text-xs font-bold text-amber-700">
                {roleLabel}
              </span>
            </div>
            </div>
          </div>

          {profile?.isDeveloper && profile.previewRole ? (
            <div className="border-t border-yellow-200 bg-yellow-50 px-4 py-2 text-xs font-semibold leading-5 text-yellow-800 sm:px-6 lg:px-8">
              開發者預覽中：目前以「{roleLabel.replace("預覽：", "")}」的權限使用後台，
              所有新增、修改、刪除都會寫入真實資料（以社長預覽時請不要按「確認交接」）。
            </div>
          ) : null}
        </header>

        <main className="w-full px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
