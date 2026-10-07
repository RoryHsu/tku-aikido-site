import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileText,
  Image,
  ShieldCheck,
  Stamp,
  Users,
} from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { roleLabelMap } from "../../components/adminMenu";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebase";

const cardsByRole = {
  president: [
    {
      label: "職位授權管理",
      description: "管理幹部職位、歷任幹部，以及社長交接。",
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

  alumni: [
    {
      label: "照片 / 影片管理",
      description: "協助上傳社團照片與影片，可以修改自己上傳的項目。",
      path: "/admin/media",
      icon: Image,
    },
  ],
};

const todayString = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

async function readCollection(name) {
  const snapshot = await getDocs(collection(db, name));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

// 依職位整理首頁要顯示的待辦事項與近期活動
async function loadTodos(role, email) {
  const todos = [];
  let upcoming = [];

  const canFinance = role === "president" || role === "finance";
  const canEvents = ["president", "vice", "finance", "activity", "pr"].includes(role);

  if (canFinance) {
    const records = await readCollection("financeRecords");
    const count = (status) => records.filter((r) => r.status === status).length;

    if (role === "president") {
      todos.push({
        label: "筆單據等你簽名審核",
        count: count("pending_president_review"),
        path: "/admin/finance",
        tone: "urgent",
      });
    } else {
      todos.push(
        {
          label: "筆單據等你簽名",
          count: count("pending_treasurer_signature"),
          path: "/admin/finance",
          tone: "urgent",
        },
        {
          label: "筆單據被退回，需要修改",
          count: count("returned"),
          path: "/admin/finance",
          tone: "urgent",
        },
        {
          label: "筆單據等待領款人簽名",
          count: count("pending_receiver_signature"),
          path: "/admin/finance",
          tone: "info",
        }
      );
    }
  }

  if (canEvents) {
    const events = await readCollection("events");
    const today = todayString();

    todos.push({
      label: "個活動尚未公開到前台",
      count: events.filter((e) => !e.published).length,
      path: "/admin/events",
      tone: "info",
    });

    upcoming = events
      .filter((e) => e.date && e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);
  }

  if (role === "alumni") {
    const media = await readCollection("media");
    todos.push({
      label: "個照片 / 影片是你上傳的",
      count: media.filter((m) => m.createdBy === email).length,
      path: "/admin/media",
      tone: "info",
    });
  }

  return { todos, upcoming };
}

export default function Dashboard() {
  const { profile, currentUser } = useAuth();

  const role = profile?.role || "";
  const roleLabel = roleLabelMap[role] || role || "未設定";
  const cards = cardsByRole[role] || [];

  const [summary, setSummary] = useState({ todos: [], upcoming: [], ready: false });

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const result = await loadTodos(role, currentUser?.email || "");
        if (active) setSummary({ ...result, ready: true });
      } catch (err) {
        console.error("load dashboard todos error:", err);
        if (active) setSummary({ todos: [], upcoming: [], ready: true });
      }
    };
    if (role) run();
    return () => {
      active = false;
    };
  }, [role, currentUser?.email]);

  const urgentTodos = summary.todos.filter((t) => t.tone === "urgent" && t.count > 0);
  const otherTodos = summary.todos.filter((t) => t.tone !== "urgent" || t.count === 0);

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* 歡迎列：精簡成一列，功能入口直接出現在第一個畫面 */}
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm sm:px-6">
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-900 sm:text-2xl">
              {profile?.name || "幹部"}，歡迎回來
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              以下是你目前可以使用的功能。
            </p>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">
            {roleLabel}
          </span>
        </section>

        {role && summary.ready && (summary.todos.length > 0 || summary.upcoming.length > 0) ? (
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              <h2 className="flex items-center gap-2 text-base font-black text-slate-900">
                <ClipboardList size={18} className="text-amber-700" />
                待辦事項
              </h2>
              {summary.todos.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">目前沒有待辦事項。</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {[...urgentTodos, ...otherTodos].map((todo) => (
                    <li key={todo.label}>
                      <Link
                        to={todo.path}
                        className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm transition ${
                          todo.tone === "urgent" && todo.count > 0
                            ? "bg-amber-50 font-bold text-amber-800 hover:bg-amber-100"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span>
                          <span className="mr-1 text-lg font-black">{todo.count}</span>
                          {todo.label}
                        </span>
                        <ChevronRight size={16} className="shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {["president", "vice", "finance", "activity", "pr"].includes(role) ? (
              <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
                <h2 className="flex items-center gap-2 text-base font-black text-slate-900">
                  <CalendarDays size={18} className="text-amber-700" />
                  近期活動
                </h2>
                {summary.upcoming.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">接下來沒有已排定的活動。</p>
                ) : (
                  <ul className="mt-3 divide-y divide-slate-100">
                    {summary.upcoming.map((event) => (
                      <li key={event.id} className="flex items-center gap-3 py-2.5">
                        <span className="w-24 shrink-0 text-sm font-bold text-amber-700">
                          {event.date}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm text-slate-800">
                          {event.title}
                        </span>
                        {!event.published ? (
                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                            未公開
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </section>
        ) : null}

        {cards.length > 0 ? (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="group flex min-w-0 items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-amber-700 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white transition group-hover:bg-amber-700">
                    <Icon size={20} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1 text-base font-black text-slate-900">
                      {item.label}
                      <ChevronRight
                        size={16}
                        className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-amber-700"
                      />
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <ShieldCheck size={24} />
            </div>

            <h2 className="mt-4 text-xl font-black text-slate-900">
              尚未設定職位權限
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
              目前帳號尚未被授權任何後台職位。請聯絡社長到「職位授權管理」中設定你的角色。
            </p>
          </section>
        )}

        {/* 權限說明：預設收合，需要時再點開 */}
        <details className="group rounded-2xl bg-white px-5 py-4 shadow-sm sm:px-6">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-slate-700">
            各職位可使用的功能
            <ChevronRight
              size={16}
              className="text-slate-400 transition group-open:rotate-90"
            />
          </summary>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            <li>社長：全部功能，並負責職位管理、交接、社章與財務最終審核。</li>
            <li>副社長：社員資料、活動公告、照片影片。</li>
            <li>財務長：領款收據、活動公告、照片影片。</li>
            <li>活動長 / 公關：活動公告、照片影片。</li>
            <li>歷任幹部：協助上傳照片影片（只能修改自己上傳的）。</li>
          </ul>
          <p className="mt-3 text-xs text-slate-400">
            看不到某個功能，代表目前帳號沒有該項權限。
          </p>
        </details>
      </div>
    </AdminLayout>
  );
}
