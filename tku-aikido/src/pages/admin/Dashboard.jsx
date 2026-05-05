import { Link } from "react-router-dom";
import {
  CalendarDays,
  FileText,
  Home,
  Image,
  ShieldCheck,
  Stamp,
  Users,
} from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../context/AuthContext";

const roleLabelMap = {
  president: "社長",
  vice: "副社長",
  finance: "財務長",
  activity: "活動長",
  pr: "公關",
};

const cardsByRole = {
  president: [
    {
      label: "職位授權管理",
      description: "新增幹部帳號、調整社長、副社長、財務長、活動長與公關權限。",
      path: "/admin/roles",
      icon: ShieldCheck,
    },
    {
      label: "活動公告管理",
      description: "新增、修改與刪除網站前台顯示的活動公告。",
      path: "/admin/events",
      icon: CalendarDays,
    },
    {
      label: "照片 / 影片管理",
      description: "管理社團活動照片、影片與 Google Drive 媒體連結。",
      path: "/admin/media",
      icon: Image,
    },
    {
      label: "領款收據管理",
      description: "審核財務長送出的財務證明，完成社長簽名與社章確認。",
      path: "/admin/finance",
      icon: FileText,
    },
    {
      label: "社章設定",
      description: "上傳或更新社團印章，供正式財務 PDF 自動套用。",
      path: "/admin/seal",
      icon: Stamp,
    },
    {
      label: "社員資料管理",
      description: "查看社員資料與年資紀錄，協助副社長進行資料管理。",
      path: "/admin/members",
      icon: Users,
    },
  ],

  vice: [
    {
      label: "社員資料管理",
      description: "手動新增社員資料、管理社員年資與基本資料紀錄。",
      path: "/admin/members",
      icon: Users,
    },
    {
      label: "活動公告管理",
      description: "協助新增與修改網站前台的活動公告。",
      path: "/admin/events",
      icon: CalendarDays,
    },
    {
      label: "照片 / 影片管理",
      description: "協助管理活動照片、影片與社團媒體資料。",
      path: "/admin/media",
      icon: Image,
    },
  ],

  finance: [
    {
      label: "領款收據管理",
      description: "建立領款收據、上傳發票收據、建立簽名流程並產生正式 PDF。",
      path: "/admin/finance",
      icon: FileText,
    },
    {
      label: "活動公告管理",
      description: "協助新增與修改網站前台的活動公告。",
      path: "/admin/events",
      icon: CalendarDays,
    },
    {
      label: "照片 / 影片管理",
      description: "協助管理活動照片、影片與社團媒體資料。",
      path: "/admin/media",
      icon: Image,
    },
  ],

  activity: [
    {
      label: "活動公告管理",
      description: "新增與修改活動資訊，協助整理活動日期、地點與內容。",
      path: "/admin/events",
      icon: CalendarDays,
    },
    {
      label: "照片 / 影片管理",
      description: "上傳與整理活動照片、影片與活動紀錄。",
      path: "/admin/media",
      icon: Image,
    },
  ],

  pr: [
    {
      label: "活動公告管理",
      description: "發佈活動資訊、整理對外公告與社團宣傳內容。",
      path: "/admin/events",
      icon: CalendarDays,
    },
    {
      label: "照片 / 影片管理",
      description: "管理社團照片、影片、宣傳素材與活動紀錄。",
      path: "/admin/media",
      icon: Image,
    },
  ],
};

export default function Dashboard() {
  const { profile } = useAuth();

  const role = profile?.role || "";
  const roleLabel = roleLabelMap[role] || role || "未設定";
  const cards = cardsByRole[role] || [];

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8">
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Home size={22} />
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-bold tracking-[0.25em] text-amber-700 sm:text-sm">
                    DASHBOARD
                  </div>

                  <h1 className="mt-1 break-words text-2xl font-black leading-tight text-slate-900 sm:text-3xl lg:text-4xl">
                    淡江合氣道社後台首頁
                  </h1>
                </div>
              </div>

              <p className="mt-6 max-w-3xl text-sm leading-8 text-slate-600 sm:text-base">
                歡迎回來。你可以依照目前職位權限，管理活動公告、照片影片、社員資料、
                財務證明與幹部授權項目。
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="text-xs font-bold tracking-[0.18em] text-slate-400">
                    CURRENT ROLE
                  </div>
                  <div className="mt-2 text-xl font-black text-slate-900">
                    {roleLabel}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="text-xs font-bold tracking-[0.18em] text-slate-400">
                    LOGIN EMAIL
                  </div>
                  <div className="mt-2 break-all text-sm font-bold leading-6 text-slate-900 sm:text-base">
                    {profile?.email || "未讀取"}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-950 p-6 text-white sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <div className="text-xs font-bold tracking-[0.25em] text-slate-400">
                QUICK GUIDE
              </div>

              <h2 className="mt-3 text-2xl font-black leading-tight">
                權限說明
              </h2>

              <p className="mt-5 text-sm leading-8 text-slate-300">
                每位幹部只會看到自己可使用的功能入口。若看不到某個功能，代表目前帳號沒有該項權限。
              </p>

              <div className="mt-6 space-y-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  社長：授權、審核、社章、活動、媒體、社員資料。
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  財務長：財務證明、活動公告、照片影片。
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  公關 / 活動長：活動公告與照片影片管理。
                </div>
              </div>
            </div>
          </div>
        </section>

        {cards.length > 0 ? (
          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-xs font-bold tracking-[0.25em] text-amber-700">
                  MANAGEMENT ENTRIES
                </div>
                <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                  管理入口
                </h2>
              </div>

              <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-500 shadow-sm">
                共 {cards.length} 個功能
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="group min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white transition group-hover:bg-amber-700">
                      <Icon size={22} />
                    </div>

                    <div className="mt-5 break-words text-xl font-black leading-tight text-slate-900">
                      {item.label}
                    </div>

                    <p className="mt-3 break-words text-sm leading-7 text-slate-600">
                      {item.description}
                    </p>

                    <div className="mt-5 text-sm font-bold text-slate-400 transition group-hover:text-amber-700">
                      進入管理 →
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <ShieldCheck size={26} />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-900">
              尚未設定職位權限
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-8 text-slate-600">
              目前帳號尚未被授權任何後台職位。請聯絡社長到「職位授權管理」中設定你的角色。
            </p>
          </section>
        )}
      </div>
    </AdminLayout>
  );
}