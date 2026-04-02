import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import AdminLayout from "../../components/AdminLayout";

const roleOptions = [
  { value: "president", label: "社長" },
  { value: "vice", label: "副社長" },
  { value: "finance", label: "財務長" },
  { value: "activity", label: "活動長" },
];

export default function RolesPage() {
  const [users, setUsers] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("vice");
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    setFetching(true);

    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      setUsers(data);
    } catch (err) {
      console.error("fetch users error:", err);
      setMessage("讀取幹部資料失敗");
      setMessageType("error");
    }

    setFetching(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = (id, newRoleValue) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, role: newRoleValue } : user
      )
    );
  };

  const handleSave = async (id, role) => {
    setSavingId(id);
    setMessage("");

    try {
      const userRef = doc(db, "users", id);

      await updateDoc(userRef, {
        role,
        updatedAt: serverTimestamp(),
      });

      setMessage("角色更新成功");
      setMessageType("success");
    } catch (err) {
      console.error("update role error:", err);
      setMessage("角色更新失敗");
      setMessageType("error");
    }

    setSavingId("");
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMessage("");

    const trimmedName = newName.trim();
    const trimmedEmail = newEmail.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail) {
      setMessage("請完整填寫姓名與 Email");
      setMessageType("error");
      setCreating(false);
      return;
    }

    try {
      const duplicateQuery = query(
        collection(db, "users"),
        where("email", "==", trimmedEmail)
      );

      const duplicateSnapshot = await getDocs(duplicateQuery);

      if (!duplicateSnapshot.empty) {
        setMessage("這個 Email 已存在於幹部資料中");
        setMessageType("error");
        setCreating(false);
        return;
      }

      await addDoc(collection(db, "users"), {
        name: trimmedName,
        email: trimmedEmail,
        role: newRole,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setNewName("");
      setNewEmail("");
      setNewRole("vice");

      setMessage("幹部資料新增成功");
      setMessageType("success");

      fetchUsers();
    } catch (err) {
      console.error("create user profile error:", err);
      setMessage("新增幹部資料失敗");
      setMessageType("error");
    }

    setCreating(false);
  };

  const messageClassName =
    messageType === "success"
      ? "bg-green-50 text-green-700"
      : messageType === "error"
      ? "bg-red-50 text-red-600"
      : "bg-slate-100 text-slate-700";

  return (
    <AdminLayout>
      <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        {/* 左邊：新增幹部資料 */}
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold tracking-[0.2em] text-amber-700">
            ROLE MANAGEMENT
          </div>

          <h1 className="mt-3 text-3xl font-black text-slate-900">
            職位授權管理
          </h1>

          <p className="mt-4 leading-8 text-slate-600">
            社長可在此新增幹部資料並管理角色權限。
          </p>

          <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-800">
            目前為免費穩定版流程：
            <br />
            1. 先在此新增幹部資料（姓名、Email、角色）
            <br />
            2. 再由管理員到 Firebase Authentication 手動建立相同 Email 的登入帳號
            <br />
            3. 幹部忘記密碼時，可使用登入頁的「忘記密碼」功能重設密碼
          </div>

          <form onSubmit={handleCreateUser} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                姓名
              </label>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
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
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="請輸入幹部 Email"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                角色
              </label>
              <select
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}（{role.value}）
                  </option>
                ))}
              </select>
            </div>

            {message ? (
              <div className={`rounded-xl px-4 py-3 text-sm ${messageClassName}`}>
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {creating ? "新增中..." : "新增幹部資料"}
            </button>
          </form>
        </div>

        {/* 右邊：幹部角色列表 */}
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold tracking-[0.2em] text-amber-700">
            USER LIST
          </div>

          <h2 className="mt-3 text-3xl font-black text-slate-900">
            幹部角色列表
          </h2>

          {fetching ? (
            <div className="mt-8 text-slate-500">載入中...</div>
          ) : users.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-slate-500">
              目前沒有使用者資料。
            </div>
          ) : (
            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-[1.2fr_1.6fr_1fr_160px] bg-slate-50 px-6 py-4 text-sm font-semibold text-slate-600">
                <div>姓名</div>
                <div>Email</div>
                <div>角色</div>
                <div>操作</div>
              </div>

              {users.map((user) => (
                <div
                  key={user.id}
                  className="grid grid-cols-[1.2fr_1.6fr_1fr_160px] items-center border-t border-slate-200 px-6 py-4"
                >
                  <div className="font-semibold text-slate-900">
                    {user.name || "未命名"}
                  </div>

                  <div className="break-all text-sm text-slate-600">
                    {user.email}
                  </div>

                  <div>
                    <select
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
                      value={user.role || ""}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value)
                      }
                    >
                      {roleOptions.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}（{role.value}）
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <button
                      onClick={() => handleSave(user.id, user.role)}
                      disabled={savingId === user.id}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      {savingId === user.id ? "儲存中..." : "儲存角色"}
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