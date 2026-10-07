import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import AdminLayout from "../../components/AdminLayout";

const semesterFields = [
  "108-1",
  "108-2",
  "109-1",
  "109-2",
  "110-1",
  "110-2",
  "111-1",
  "111-2",
];

const emptySemesterData = semesterFields.reduce((acc, key) => {
  acc[key] = "-";
  return acc;
}, {});

function calculateYears(semesters = {}) {
  let count = 0;

  semesterFields.forEach((key) => {
    const value = semesters[key];
    if (value === 1 || value === "1") {
      count += 1;
    }
  });

  return count / 2;
}

export default function MembersPage() {
  const [memberCode, setMemberCode] = useState("");
  const [name, setName] = useState("");
  const [departmentGrade, setDepartmentGrade] = useState("");
  const [size, setSize] = useState("-");
  const [officerRole, setOfficerRole] = useState("");
  const [semesters, setSemesters] = useState(emptySemesterData);

  const [memberList, setMemberList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [message, setMessage] = useState("");

  const computedYears = useMemo(() => calculateYears(semesters), [semesters]);

  // 編輯模式
  const [editingId, setEditingId] = useState("");
  const formRef = useRef(null);

  // 列表搜尋與篩選
  const [keyword, setKeyword] = useState("");
  const [officerOnly, setOfficerOnly] = useState(false);

  const filteredMembers = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return memberList.filter((item) => {
      if (officerOnly && !item.officerRole) return false;
      if (!kw) return true;
      return [item.memberCode, item.name, item.departmentGrade, item.officerRole]
        .filter(Boolean)
        .some((text) => String(text).toLowerCase().includes(kw));
    });
  }, [memberList, keyword, officerOnly]);

  const startEdit = (item) => {
    setEditingId(item.id);
    setMemberCode(item.memberCode || "");
    setName(item.name || "");
    setDepartmentGrade(item.departmentGrade || "");
    setSize(item.size || "-");
    setOfficerRole(item.officerRole || "");
    setSemesters(
      semesterFields.reduce((acc, key) => {
        const value = item.semesters?.[key];
        acc[key] = value === 1 || value === "1" ? "1" : "-";
        return acc;
      }, {})
    );
    setMessage("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const fetchMembers = async () => {
    setFetching(true);

    try {
      const q = query(collection(db, "members"), orderBy("createdAt", "asc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));
      setMemberList(data);
    } catch (err) {
      console.error("fetch members error:", err);
      setMessage("讀取社員資料失敗");
    }

    setFetching(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleSemesterChange = (key, value) => {
    setSemesters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetForm = () => {
    setEditingId("");
    setMemberCode("");
    setName("");
    setDepartmentGrade("");
    setSize("-");
    setOfficerRole("");
    setSemesters(emptySemesterData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const fields = {
        memberCode: memberCode.trim(),
        name: name.trim(),
        departmentGrade: departmentGrade.trim(),
        size: size.trim(),
        officerRole: officerRole.trim(),
        semesters,
        yearsOfService: calculateYears(semesters),
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "members", editingId), fields);
        setMessage("社員資料已更新");
      } else {
        await addDoc(collection(db, "members"), {
          ...fields,
          createdAt: serverTimestamp(),
        });
        setMessage("社員年資資料新增成功");
      }
      resetForm();
      fetchMembers();
    } catch (err) {
      console.error("add member error:", err);
      setMessage(editingId ? "更新失敗，請稍後再試" : "新增失敗，請稍後再試");
    }

    setLoading(false);
  };

  const handleDelete = async (id, memberName) => {
    const confirmed = window.confirm(`確定要刪除「${memberName}」嗎？`);
    if (!confirmed) return;

    setDeletingId(id);
    setMessage("");

    try {
      await deleteDoc(doc(db, "members", id));
      if (editingId === id) resetForm();
      setMessage("社員資料刪除成功");
      fetchMembers();
    } catch (err) {
      console.error("delete member error:", err);
      setMessage("刪除失敗，請稍後再試");
    }

    setDeletingId("");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div ref={formRef} className="min-w-0 scroll-mt-20 rounded-2xl bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-black text-slate-900">
              {editingId ? "編輯社員資料" : "新增社員資料"}
            </h1>
            {editingId ? (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                編輯中：{name || "未命名"}
              </span>
            ) : null}
          </div>

          <p className="mt-4 leading-8 text-slate-600">
            副社長可依照社員年資表格式，手動新增社員資料與各學期參與狀況，系統會自動計算年資。
          </p>

          <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-800">
            填寫方式：
            <br />
            1. 各學期欄位填 <span className="font-semibold">1</span> 代表有參與
            <br />
            2. 填 <span className="font-semibold">-</span> 代表未參與
            <br />
            3. 年資會自動依照「參與學期總數 ÷ 2」計算
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  編號
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                  value={memberCode}
                  onChange={(e) => setMemberCode(e.target.value)}
                  placeholder="例如：2-1"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  姓名
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="請輸入姓名"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  系級
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                  value={departmentGrade}
                  onChange={(e) => setDepartmentGrade(e.target.value)}
                  placeholder="例如：電機系、資工系、應用日語"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  尺寸
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="例如：3、2(公用)、-"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                幹部
              </label>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                value={officerRole}
                onChange={(e) => setOfficerRole(e.target.value)}
                placeholder="例如：副社長、活動長，沒有可留空"
              />
            </div>

            <div>
              <div className="mb-3 text-sm font-medium text-slate-700">
                各學期參與狀況
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                {semesterFields.map((field) => (
                  <div key={field}>
                    <label className="mb-2 block text-sm text-slate-600">
                      {field}
                    </label>
                    <select
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                      value={semesters[field]}
                      onChange={(e) =>
                        handleSemesterChange(field, e.target.value)
                      }
                    >
                      <option value="-">-</option>
                      <option value="1">1</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-sm text-slate-500">自動計算年資</div>
              <div className="mt-2 text-3xl font-black text-slate-900">
                {computedYears}
              </div>
            </div>

            {message ? (
              <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {message}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? "儲存中..." : editingId ? "儲存修改" : "新增社員資料"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  取消編輯
                </button>
              ) : null}
            </div>
          </form>
        </div>

        <div className="min-w-0 rounded-2xl bg-white p-5 shadow-sm sm:p-8">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-2xl font-black text-slate-900">社員年資列表</h2>
            <span className="text-sm text-slate-500">
              {filteredMembers.length} / {memberList.length} 人
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-amber-700"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜尋編號、姓名、系級、幹部…"
            />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={officerOnly}
                onChange={(e) => setOfficerOnly(e.target.checked)}
              />
              只看幹部
            </label>
          </div>

          {fetching ? (
            <div className="mt-6 text-slate-500">載入中...</div>
          ) : memberList.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-slate-500">
              目前尚未建立任何社員年資資料。
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-slate-500">
              沒有符合條件的社員。
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-[1200px] w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">編號</th>
                    <th className="px-4 py-3 text-left font-semibold">姓名</th>
                    <th className="px-4 py-3 text-left font-semibold">系級</th>
                    <th className="px-4 py-3 text-left font-semibold">尺寸</th>
                    {semesterFields.map((field) => (
                      <th
                        key={field}
                        className="px-4 py-3 text-center font-semibold"
                      >
                        {field}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center font-semibold">
                      年資
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">幹部</th>
                    <th className="px-4 py-3 text-center font-semibold">
                      操作
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMembers.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-t border-slate-200 ${
                        editingId === item.id ? "bg-amber-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3">{item.memberCode || "-"}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {item.name || "-"}
                      </td>
                      <td className="px-4 py-3">{item.departmentGrade || "-"}</td>
                      <td className="px-4 py-3">{item.size || "-"}</td>

                      {semesterFields.map((field) => (
                        <td key={field} className="px-4 py-3 text-center">
                          {item.semesters?.[field] || "-"}
                        </td>
                      ))}

                      <td className="px-4 py-3 text-center font-bold text-slate-900">
                        {typeof item.yearsOfService === "number"
                          ? item.yearsOfService
                          : calculateYears(item.semesters || {})}
                      </td>

                      <td className="px-4 py-3">{item.officerRole || "-"}</td>

                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          編輯
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.name)}
                          disabled={deletingId === item.id}
                          className="ml-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          {deletingId === item.id ? "刪除中..." : "刪除"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}