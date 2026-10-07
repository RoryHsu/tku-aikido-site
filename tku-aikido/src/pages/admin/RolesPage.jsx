import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { Crown, History, UserPlus, Users } from "lucide-react";
import { db } from "../../lib/firebase";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import { roleLabelMap } from "../../components/adminMenu";

// 社長只能透過「交接」產生，所以一般指派的選項不含社長
const assignableRoles = ["vice", "finance", "activity", "pr"];

// 幹部資料的文件 ID 統一用小寫 Email，Firestore 規則才找得到登入者的職位
const emailKeyOf = (user) => (user.email || "").trim().toLowerCase();

const timeOf = (value) =>
  value?.toMillis ? value.toMillis() : value?.seconds ? value.seconds * 1000 : 0;

function formatDate(value) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("zh-TW");
}

function RoleSelect({ value, onChange, disabled }) {
  return (
    <select
      className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none disabled:opacity-60"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {value === "" ? (
        <option value="" disabled>
          選擇職位…
        </option>
      ) : null}
      {assignableRoles.map((role) => (
        <option key={role} value={role}>
          {roleLabelMap[role]}
        </option>
      ))}
    </select>
  );
}

export default function RolesPage() {
  const { profile, refreshProfile } = useAuth();

  const [userList, setUserList] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [tab, setTab] = useState("current");
  const [keyword, setKeyword] = useState("");

  // 新增幹部
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("vice");
  const [adding, setAdding] = useState(false);

  // 交接
  const [successorId, setSuccessorId] = useState("");
  const [termLabel, setTermLabel] = useState("");
  const [retireOthers, setRetireOthers] = useState(false);
  const [handingOver, setHandingOver] = useState(false);

  const notify = (type, text) => setMessage({ type, text });

  /**
   * 把舊格式（文件 ID 是亂數）的幹部資料，轉成以 Email 當文件 ID 的新格式。
   * 只有社長打開這一頁時會執行；同一個 Email 已經有新格式資料時，直接刪掉舊的重複資料。
   */
  const migrateLegacyUsers = async (list) => {
    const legacy = list.filter(
      (user) => emailKeyOf(user) && user.id !== emailKeyOf(user)
    );
    if (legacy.length === 0) return false;

    const batch = writeBatch(db);
    const existingIds = new Set(list.map((user) => user.id));

    legacy.forEach((user) => {
      const key = emailKeyOf(user);
      if (!existingIds.has(key)) {
        const { id: _oldId, ...data } = user;
        batch.set(doc(db, "users", key), { ...data, email: key });
        existingIds.add(key);
      }
      batch.delete(doc(db, "users", user.id));
    });

    await batch.commit();
    notify("success", `已將 ${legacy.length} 筆幹部資料轉換為新格式。`);
    return true;
  };

  const fetchUsers = async () => {
    setFetching(true);
    try {
      const snapshot = await getDocs(collection(db, "users"));
      let list = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      if (profile?.role === "president" && (await migrateLegacyUsers(list))) {
        const again = await getDocs(collection(db, "users"));
        list = again.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
        await refreshProfile();
      }

      list.sort((a, b) => timeOf(a.createdAt) - timeOf(b.createdAt));
      setUserList(list);
    } catch (err) {
      console.error("fetch users error:", err);
      notify("error", "讀取幹部資料失敗");
    }
    setFetching(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const presidents = userList.filter((user) => user.role === "president");
  const currentOfficers = userList.filter(
    (user) => user.role && user.role !== "alumni"
  );
  const alumni = userList.filter((user) => user.role === "alumni");
  const successorOptions = currentOfficers.filter(
    (user) => user.role !== "president"
  );

  const matchKeyword = (user) => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return true;
    return [user.name, user.email, user.termLabel]
      .filter(Boolean)
      .some((text) => String(text).toLowerCase().includes(kw));
  };

  const visibleCurrent = useMemo(
    () => currentOfficers.filter(matchKeyword),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userList, keyword]
  );
  const visibleAlumni = useMemo(
    () => alumni.filter(matchKeyword),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userList, keyword]
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const existing = userList.find(
      (user) => (user.email || "").toLowerCase() === trimmedEmail
    );
    if (existing) {
      notify(
        "error",
        `這個 Email 已經在名單中（${existing.name || trimmedEmail}，${
          roleLabelMap[existing.role] || "未設定"
        }），請直接在列表中調整職位。`
      );
      return;
    }

    setAdding(true);
    try {
      await setDoc(doc(db, "users", trimmedEmail), {
        name: name.trim(),
        email: trimmedEmail,
        role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setName("");
      setEmail("");
      setRole("vice");
      notify("success", "幹部新增成功");
      fetchUsers();
    } catch (err) {
      console.error("add user role error:", err);
      notify("error", "新增失敗，請稍後再試");
    }
    setAdding(false);
  };

  const changeRole = async (user, nextRole) => {
    setBusyId(user.id);
    try {
      await updateDoc(doc(db, "users", user.id), {
        role: nextRole,
        updatedAt: serverTimestamp(),
      });
      notify("success", `已將「${user.name}」改為${roleLabelMap[nextRole]}`);
      fetchUsers();
    } catch (err) {
      console.error("change role error:", err);
      notify("error", "更新職位失敗，請稍後再試");
    }
    setBusyId("");
  };

  const retire = async (user) => {
    const ok = window.confirm(
      `確定讓「${user.name}」卸任嗎？\n卸任後會移到「歷任幹部」，只能協助上傳照片與影片。`
    );
    if (!ok) return;

    setBusyId(user.id);
    try {
      await updateDoc(doc(db, "users", user.id), {
        role: "alumni",
        formerRole: user.role,
        termEndedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      notify("success", `「${user.name}」已移到歷任幹部`);
      fetchUsers();
    } catch (err) {
      console.error("retire error:", err);
      notify("error", "卸任失敗，請稍後再試");
    }
    setBusyId("");
  };

  const removeAccess = async (user) => {
    const ok = window.confirm(
      `確定移除「${user.name}」的後台權限嗎？\n移除後這個帳號將無法再進入後台。`
    );
    if (!ok) return;

    setBusyId(user.id);
    try {
      await deleteDoc(doc(db, "users", user.id));
      notify("success", `已移除「${user.name}」的後台權限`);
      fetchUsers();
    } catch (err) {
      console.error("remove access error:", err);
      notify("error", "移除失敗，請稍後再試");
    }
    setBusyId("");
  };

  const handleHandover = async (e) => {
    e.preventDefault();
    const successor = successorOptions.find((user) => user.id === successorId);
    if (!successor || !profile?.id) return;

    const ok = window.confirm(
      `確定把社長交接給「${successor.name}」嗎？\n\n` +
        "・交接後你會變成「歷任幹部」，只能協助上傳照片與影片。\n" +
        (retireOthers ? "・其他現任幹部也會一起移到歷任幹部。\n" : "") +
        "・這個動作無法自行復原，只有新社長能再調整。"
    );
    if (!ok) return;

    setHandingOver(true);
    try {
      // 一次寫入：新社長上任、舊社長卸任，確保社團永遠只有一位社長
      const batch = writeBatch(db);
      const endFields = {
        role: "alumni",
        termEndedAt: serverTimestamp(),
        termLabel: termLabel.trim(),
        updatedAt: serverTimestamp(),
      };

      batch.update(doc(db, "users", successor.id), {
        role: "president",
        updatedAt: serverTimestamp(),
      });

      currentOfficers.forEach((user) => {
        if (user.id === successor.id) return;
        const isOldPresident = user.role === "president";
        if (isOldPresident || retireOthers) {
          batch.update(doc(db, "users", user.id), {
            ...endFields,
            formerRole: user.role,
          });
        }
      });

      await batch.commit();
      notify("success", `交接完成，新任社長為「${successor.name}」`);
      await refreshProfile();
    } catch (err) {
      console.error("handover error:", err);
      notify("error", "交接失敗，請稍後再試，資料沒有任何變更。");
    }
    setHandingOver(false);
  };

  const tabClass = (name) =>
    `flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
      tab === name ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <AdminLayout>
      <div className="space-y-5">
        {message.text ? (
          <div
            className={`rounded-xl px-4 py-3 text-sm font-semibold ${
              message.type === "error"
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        {presidents.length > 1 ? (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm leading-7 text-red-700">
            目前名單中有 {presidents.length} 位社長（
            {presidents.map((user) => user.name).join("、")}
            ）。一個社團只能有一位社長，請把其他人改成適合的職位。
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-2">
          {/* 新增幹部 */}
          <section className="min-w-0 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <UserPlus size={20} className="text-amber-700" />
              <h2 className="text-lg font-black text-slate-900">新增幹部</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              對方需要用這個 Email 註冊或登入，才會取得對應的後台權限。
            </p>

            <form onSubmit={handleAdd} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-amber-700"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="姓名"
                required
              />
              <input
                type="email"
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-amber-700"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
              />
              <select
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {assignableRoles.map((item) => (
                  <option key={item} value={item}>
                    {roleLabelMap[item]}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={adding}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {adding ? "新增中..." : "新增幹部"}
              </button>
            </form>
          </section>

          {/* 社長交接 */}
          <section className="min-w-0 rounded-2xl border-2 border-amber-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <Crown size={20} className="text-amber-700" />
              <h2 className="text-lg font-black text-slate-900">社長交接</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              一個社團只能有一位社長。交接後你會轉為歷任幹部。新社長要先在名單中，才能被選為接任者。
            </p>

            <form onSubmit={handleHandover} className="mt-4 grid gap-3 sm:grid-cols-2">
              <select
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none"
                value={successorId}
                onChange={(e) => setSuccessorId(e.target.value)}
                required
              >
                <option value="">選擇接任社長…</option>
                {successorOptions.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}（{roleLabelMap[user.role]}）
                  </option>
                ))}
              </select>
              <input
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-amber-700"
                value={termLabel}
                onChange={(e) => setTermLabel(e.target.value)}
                placeholder="屆別，例如：114 學年度"
              />
              <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={retireOthers}
                  onChange={(e) => setRetireOthers(e.target.checked)}
                />
                其他現任幹部也一起卸任（整屆換屆時勾選）
              </label>
              <button
                type="submit"
                disabled={handingOver || !successorId}
                className="rounded-xl bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-50 sm:col-span-2"
              >
                {handingOver ? "交接中..." : "確認交接"}
              </button>
            </form>
          </section>
        </div>

        {/* 名單 */}
        <section className="min-w-0 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <button type="button" className={tabClass("current")} onClick={() => setTab("current")}>
                <Users size={16} />
                現任幹部（{currentOfficers.length}）
              </button>
              <button type="button" className={tabClass("alumni")} onClick={() => setTab("alumni")}>
                <History size={16} />
                歷任幹部（{alumni.length}）
              </button>
            </div>
            <input
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-amber-700 sm:w-64"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜尋姓名、Email、屆別…"
            />
          </div>

          {fetching ? (
            <div className="mt-6 text-slate-500">載入中...</div>
          ) : tab === "current" ? (
            visibleCurrent.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center text-slate-500">
                沒有符合條件的現任幹部。
              </div>
            ) : (
              <ul className="mt-5 divide-y divide-slate-100">
                {visibleCurrent.map((user) => {
                  const isPresident = user.role === "president";
                  const isSelf = user.id === profile?.id;
                  const locked = isPresident && (isSelf || presidents.length === 1);

                  return (
                    <li key={user.id} className="flex flex-wrap items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-bold text-slate-900">{user.name}</span>
                          {isSelf ? (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">你</span>
                          ) : null}
                        </div>
                        <div className="truncate text-sm text-slate-500">{user.email}</div>
                      </div>

                      {locked ? (
                        <span className="rounded-full bg-amber-700 px-3 py-1 text-xs font-bold text-white">
                          社長
                        </span>
                      ) : (
                        <>
                          <RoleSelect
                            value={isPresident ? "" : user.role}
                            onChange={(next) => changeRole(user, next)}
                            disabled={busyId === user.id}
                          />
                          <button
                            type="button"
                            onClick={() => retire(user)}
                            disabled={busyId === user.id}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            卸任
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAccess(user)}
                            disabled={busyId === user.id}
                            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                          >
                            移除
                          </button>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )
          ) : visibleAlumni.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center text-slate-500">
              沒有符合條件的歷任幹部。
            </div>
          ) : (
            <>
              <p className="mt-4 text-sm text-slate-500">
                歷任幹部只能進入「照片 / 影片管理」協助上傳，並只能修改自己上傳的項目。
              </p>
              <ul className="mt-3 divide-y divide-slate-100">
                {visibleAlumni.map((user) => (
                  <li key={user.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold text-slate-900">{user.name}</div>
                      <div className="truncate text-sm text-slate-500">{user.email}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        曾任{roleLabelMap[user.formerRole] || "幹部"}
                        {user.termLabel ? ` ・ ${user.termLabel}` : ""}
                        {formatDate(user.termEndedAt)
                          ? ` ・ ${formatDate(user.termEndedAt)} 卸任`
                          : ""}
                      </div>
                    </div>

                    <span className="text-sm text-slate-500">恢復為</span>
                    <RoleSelect
                      value=""
                      onChange={(next) => changeRole(user, next)}
                      disabled={busyId === user.id}
                    />
                    <button
                      type="button"
                      onClick={() => removeAccess(user)}
                      disabled={busyId === user.id}
                      className="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      移除權限
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
