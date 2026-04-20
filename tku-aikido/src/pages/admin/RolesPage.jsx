import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import AdminLayout from "../../components/AdminLayout";

const roleOptions = [
  { value: "president", label: "社長" },
  { value: "vice", label: "副社長" },
  { value: "finance", label: "財務長" },
  { value: "activity", label: "活動長" },
  { value: "pr", label: "公關" },
];

const roleLabelMap = {
  president: "社長",
  vice: "副社長",
  finance: "財務長",
  activity: "活動長",
  pr: "公關",
};

export default function RolesPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("vice");

  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [message, setMessage] = useState("");

  const fetchUsers = async () => {
    setFetching(true);

    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "asc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));
      setUserList(data);
    } catch (err) {
      console.error("fetch users error:", err);
      setMessage("讀取幹部資料失敗");
    }

    setFetching(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await addDoc(collection(db, "users"), {
        name: name.trim(),
        email: email.trim(),
        role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setName("");
      setEmail("");
      setRole("vice");
      setMessage("幹部資料新增成功");
      fetchUsers();
    } catch (err) {
      console.error("add user role error:", err);
      setMessage("新增失敗，請稍後再試");
    }

    setLoading(false);
  };

  const handleDelete = async (id, targetName) => {
    const confirmed = window.confirm(`確定要刪除「${targetName}」這筆幹部資料嗎？`);
    if (!confirmed) return;

    setDeletingId(id);
    setMessage("");

    try {
      await deleteDoc(doc(db, "users", id));
      setMessage("幹部資料刪除成功");
      fetchUsers();
    } catch (err) {
      console.error("delete user role error:", err);
      setMessage("刪除失敗，請稍後再試");
    }

    setDeletingId("");
  };

  return (
    <AdminLayout>
      <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold tracking-[0.2em] text-amber-700">
            ROLE MANAGEMENT
          </div>

          <h1 className="mt-3 text-3xl font-black text-slate-900">
            職位授權管理
          </h1>

          <p className="mt-4 leading-8 text-slate-600">
            社長可在此新增幹部資料與設定職位。登入後系統會依照 Firestore 中的 role 欄位控制後台權限。
          </p>

          <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-800">
            目前系統角色對應如下：
            <br />
            president＝社長
            <br />
            vice＝副社長
            <br />
            finance＝財務長
            <br />
            activity＝活動長
            <br />
            pr＝公關
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                姓名
              </label>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="請輸入幹部姓名"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="請輸入登入用 Email"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                職位
              </label>
              <select
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {roleOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {message ? (
              <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {loading ? "儲存中..." : "新增幹部資料"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold tracking-[0.2em] text-amber-700">
            OFFICER LIST
          </div>

          <h2 className="mt-3 text-3xl font-black text-slate-900">
            已建立幹部列表
          </h2>

          {fetching ? (
            <div className="mt-6 text-slate-500">載入中...</div>
          ) : userList.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-slate-500">
              目前尚未建立任何幹部資料。
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {userList.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xl font-black text-slate-900">
                        {item.name || "未命名"}
                      </div>

                      <div className="mt-2 text-sm text-slate-500">
                        Email：{item.email || "未填寫"}
                      </div>

                      <div className="mt-2 text-sm text-slate-500">
                        職位代碼：{item.role || "未設定"}
                      </div>

                      <div className="mt-2 text-sm font-semibold text-slate-700">
                        顯示名稱：{roleLabelMap[item.role] || "未知職位"}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      disabled={deletingId === item.id}
                      className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                    >
                      {deletingId === item.id ? "刪除中..." : "刪除"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}