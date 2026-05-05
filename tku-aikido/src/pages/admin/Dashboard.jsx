import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import {
  CalendarDays,
  Clock3,
  FileText,
  Image,
  PenLine,
  Settings,
  ShieldCheck,
  Stamp,
  Users,
} from "lucide-react";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/AdminLayout";

const roleLabelMap = {
  president: "社長",
  vice: "副社長",
  finance: "財務長",
  activity: "活動長",
  pr: "公關",
};

function StatCard({ icon: Icon, title, value, desc, to, color = "slate" }) {
  const colorMap = {
    slate: "bg-slate-900 text-white",
    amber: "bg-amber-600 text-white",
    blue: "bg-blue-600 text-white",
    purple: "bg-purple-600 text-white",
    green: "bg-green-600 text-white",
    red: "bg-red-600 text-white",
  };

  const content = (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
          colorMap[color] || colorMap.slate
        }`}
      >
        <Icon className="h-6 w-6" />
      </div>

      <div className="mt-5 text-sm font-semibold tracking-[0.18em] text-slate-500">
        {title}
      </div>

      <div className="mt-3 text-4xl font-black text-slate-900">{value}</div>

      {desc ? <p className="mt-3 leading-7 text-slate-600">{desc}</p> : null}
    </div>
  );

  if (!to) return content;

  return (
    <Link to={to} className="block">
      {content}
    </Link>
  );
}

function ActionCard({ icon: Icon, title, subtitle, desc, to }) {
  return (
    <Link
      to={to}
      className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
        <Icon className="h-6 w-6" />
      </div>

      <div className="mt-5 text-sm font-semibold tracking-[0.18em] text-slate-500">
        {subtitle}
      </div>

      <div className="mt-3 text-3xl font-black text-slate-900 group-hover:text-blue-700">
        {title}
      </div>

      <p className="mt-3 leading-7 text-slate-600">{desc}</p>
    </Link>
  );
}

function FinanceRecordCard({ item }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-lg font-black text-slate-900">
        {item.activityName || "未命名財務證明"}
      </div>

      <div className="mt-2 text-sm text-slate-500">
        費用類別：{item.expenseType || "未填寫"} ｜ 金額：NT$ {item.amount || 0}
      </div>

      <div className="mt-2 text-sm text-slate-500">
        領款人：{item.receiverName || "未填寫"}
      </div>

      <div className="mt-2 text-sm text-slate-500">
        簽章進度：領款人 {item.hasReceiverSignature ? "✅" : "未簽"} ／ 財務長{" "}
        {item.hasTreasurerSignature ? "✅" : "未簽"} ／ 社長{" "}
        {item.hasPresidentSignature ? "✅" : "未簽"}
      </div>

      <Link
        to="/admin/finance"
        className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        前往處理
      </Link>
    </div>
  );
}

export default function Dashboard() {
  const { currentUser, profile } = useAuth();
  const [financeRecords, setFinanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const role = profile?.role || "";
  const roleLabel = roleLabelMap[role] || "未設定職位";

  const isPresident = role === "president";
  const isFinance = role === "finance";
  const canReadFinance = role === "president" || role === "finance";

  useEffect(() => {
    const fetchFinanceRecords = async () => {
      if (!canReadFinance) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const snapshot = await getDocs(collection(db, "financeRecords"));
        const data = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        const sorted = data.sort((a, b) => {
          const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return bTime - aTime;
        });

        setFinanceRecords(sorted);
      } catch (error) {
        console.error("fetch finance records error:", error);
      }

      setLoading(false);
    };

    fetchFinanceRecords();
  }, [canReadFinance]);

  const pendingReceiverSignature = useMemo(() => {
    return financeRecords.filter(
      (item) => item.status === "pending_receiver_signature"
    );
  }, [financeRecords]);

  const pendingTreasurerSignature = useMemo(() => {
    return financeRecords.filter(
      (item) => item.status === "pending_treasurer_signature"
    );
  }, [financeRecords]);

  const pendingPresidentReview = useMemo(() => {
    return financeRecords.filter(
      (item) => item.status === "pending_president_review"
    );
  }, [financeRecords]);

  const actionCardsByRole = {
    president: [
      {
        icon: Users,
        title: "Roles",
        subtitle: "職位授權管理",
        desc: "新增與管理社長、副社長、財務長、活動長、公關角色。",
        to: "/admin/roles",
      },
      {
        icon: Users,
        title: "Members",
        subtitle: "社員資料管理",
        desc: "管理社員資料、年資表與社團成員紀錄。",
        to: "/admin/members",
      },
      {
        icon: CalendarDays,
        title: "Event",
        subtitle: "活動公告管理",
        desc: "新增、刪除與公開活動公告。",
        to: "/admin/events",
      },
      {
        icon: Image,
        title: "Media",
        subtitle: "照片 / 影片管理",
        desc: "管理 Google Drive 照片、影片與前台顯示。",
        to: "/admin/media",
      },
      {
        icon: Stamp,
        title: "Club Seal",
        subtitle: "社章設定",
        desc: "上傳社團社章，之後財務證明 PDF 會自動套用。",
        to: "/admin/club-seal",
      },
      {
        icon: FileText,
        title: "Finance",
        subtitle: "財務審核中心",
        desc: "查看待社長簽名審核的財務證明與收據。",
        to: "/admin/finance",
      },
    ],

    vice: [
      {
        icon: Users,
        title: "Members",
        subtitle: "社員資料管理",
        desc: "管理社員資料、年資表與社團成員紀錄。",
        to: "/admin/members",
      },
      {
        icon: CalendarDays,
        title: "Event",
        subtitle: "活動公告管理",
        desc: "協助新增、編輯與整理活動公告。",
        to: "/admin/events",
      },
      {
        icon: Image,
        title: "Media",
        subtitle: "照片 / 影片管理",
        desc: "協助整理社團照片、影片與前台顯示。",
        to: "/admin/media",
      },
    ],

    finance: [
      {
        icon: CalendarDays,
        title: "Event",
        subtitle: "活動公告管理",
        desc: "可同步管理活動公告內容。",
        to: "/admin/events",
      },
      {
        icon: Image,
        title: "Media",
        subtitle: "照片 / 影片管理",
        desc: "可協助管理 Google Drive 媒體素材。",
        to: "/admin/media",
      },
      {
        icon: FileText,
        title: "Finance",
        subtitle: "領款收據管理",
        desc: "建立財務證明、簽名流程與 PDF 輸出。",
        to: "/admin/finance",
      },
    ],

    activity: [
      {
        icon: CalendarDays,
        title: "Event",
        subtitle: "活動公告管理",
        desc: "新增、刪除與公開活動公告。",
        to: "/admin/events",
      },
      {
        icon: Image,
        title: "Media",
        subtitle: "照片 / 影片管理",
        desc: "管理活動照片、影片與前台顯示。",
        to: "/admin/media",
      },
      {
        icon: Settings,
        title: "Check-in",
        subtitle: "簽到管理",
        desc: "管理活動簽到資料與現場流程。",
        to: "/admin/events",
      },
    ],

    pr: [
      {
        icon: CalendarDays,
        title: "Event",
        subtitle: "活動公告管理",
        desc: "負責宣傳用活動內容編輯與發佈。",
        to: "/admin/events",
      },
      {
        icon: Image,
        title: "Media",
        subtitle: "照片 / 影片管理",
        desc: "整理對外展示的照片、影片與成果素材。",
        to: "/admin/media",
      },
    ],
  };

  const actionCards = actionCardsByRole[role] || [];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold tracking-[0.2em] text-amber-700">
            DASHBOARD
          </div>

          <h1 className="mt-3 text-3xl font-black text-slate-900">
            淡江合氣道社後台首頁
          </h1>

          <p className="mt-4 leading-8 text-slate-600">
            歡迎回來，{profile?.name || currentUser?.email || "幹部"}。目前登入職位為：
            <span className="font-bold text-slate-900"> {roleLabel}</span>
          </p>
        </div>

        {isPresident ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={ShieldCheck}
              title="待社長簽名審核"
              value={loading ? "..." : pendingPresidentReview.length}
              desc="財務長已完成經手人簽章，等待社長簽名、蓋章與核准。"
              to="/admin/finance"
              color="amber"
            />
          </div>
        ) : null}

        {isFinance ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Clock3}
              title="待領款人簽名"
              value={loading ? "..." : pendingReceiverSignature.length}
              desc="已建立簽名連結，等待領款人線上簽名。"
              to="/admin/finance"
              color="blue"
            />

            <StatCard
              icon={PenLine}
              title="待財務長 / 經手人簽名"
              value={loading ? "..." : pendingTreasurerSignature.length}
              desc="領款人已簽名，等待財務長或經手人簽章。"
              to="/admin/finance"
              color="purple"
            />
          </div>
        ) : null}

        {actionCards.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {actionCards.map((item) => (
              <ActionCard
                key={item.title + item.to}
                icon={item.icon}
                title={item.title}
                subtitle={item.subtitle}
                desc={item.desc}
                to={item.to}
              />
            ))}
          </div>
        ) : null}

        {isPresident ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-sm font-semibold tracking-[0.2em] text-amber-700">
                  PRESIDENT REVIEW TASKS
                </div>

                <h2 className="mt-3 text-3xl font-black text-slate-900">
                  待社長簽名審核的財務證明
                </h2>

                <p className="mt-4 leading-8 text-slate-600">
                  以下是領款人與財務長已完成簽章，等待社長最後簽名、蓋章與核准的財務證明。
                </p>
              </div>

              <Link
                to="/admin/finance"
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                前往財務管理
              </Link>
            </div>

            {loading ? (
              <div className="mt-6 text-slate-500">載入中...</div>
            ) : pendingPresidentReview.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
                目前沒有待社長簽名審核的財務證明。
              </div>
            ) : (
              <div className="mt-6 grid gap-5 xl:grid-cols-2">
                {pendingPresidentReview.slice(0, 6).map((item) => (
                  <FinanceRecordCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        ) : null}

        {isFinance ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-sm font-semibold tracking-[0.2em] text-amber-700">
                  FINANCE SIGNATURE TASKS
                </div>

                <h2 className="mt-3 text-3xl font-black text-slate-900">
                  財務長待處理的財務證明
                </h2>

                <p className="mt-4 leading-8 text-slate-600">
                  這裡只顯示與財務長相關的單據：等待領款人簽名，或等待財務長 / 經手人簽名。
                </p>
              </div>

              <Link
                to="/admin/finance"
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                前往財務管理
              </Link>
            </div>

            {loading ? (
              <div className="mt-6 text-slate-500">載入中...</div>
            ) : pendingReceiverSignature.length === 0 &&
              pendingTreasurerSignature.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
                目前沒有財務長需要處理的財務證明。
              </div>
            ) : (
              <div className="mt-6 grid gap-5 xl:grid-cols-2">
                {[...pendingReceiverSignature, ...pendingTreasurerSignature]
                  .slice(0, 6)
                  .map((item) => (
                    <FinanceRecordCard key={item.id} item={item} />
                  ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}