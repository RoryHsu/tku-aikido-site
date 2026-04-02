import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../context/AuthContext";

export default function Dashboard() {
  const { profile } = useAuth();

  const role = profile?.role;

  const cardsByRole = {
    president: [
      "職位授權管理",
      "活動公告管理",
      "照片 / 影片管理",
    ],
    vice: [
      "社員資料收取",
    ],
    finance: [
      "財務管理",
    ],
    activity: [
      "簽到管理",
    ],
  };

  const cards = cardsByRole[role] || [];

  return (
    <AdminLayout>
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">
          歡迎進入後台
        </h1>

        <p className="mt-4 text-slate-600">
          目前登入角色：
          <span className="ml-2 font-semibold text-slate-900">
            {profile?.role || "未設定"}
          </span>
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((item) => (
          <div
            key={item}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="text-2xl font-black text-slate-900">
              {item}
            </div>
            <p className="mt-3 text-slate-600">
              這是 {item} 的管理入口。
            </p>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}