import { useEffect, useMemo, useState } from "react";
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
      await addDoc(collection(db, "members"), {
        memberCode: memberCode.trim(),
        name: name.trim(),
        departmentGrade: departmentGrade.trim(),
        size: size.trim(),
        officerRole: officerRole.trim(),
        semesters,
        yearsOfService: calculateYears(semesters),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setMessage("社員年資資料新增成功");
      resetForm();
      fetchMembers();
    } catch (err) {
      console.error("add member error:", err);
      setMessage("新增失敗，請稍後再試");
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
      <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold tracking-[0.2em] text-amber-700">
            MEMBER SENIORITY MANAGEMENT
          </div>

          <h1 className="mt-3 text-3xl font-black text-slate-900">
            社員年資表管理
          </h1>

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
            <div className="grid gap-5 md:grid-cols-2">
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
            </div>

            <div className="grid gap-5 md:grid-cols-2">
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

              <div className="grid gap-4 md:grid-cols-2">
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

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {loading ? "儲存中..." : "新增社員資料"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold tracking-[0.2em] text-amber-700">
            MEMBER SENIORITY TABLE
          </div>

          <h2 className="mt-3 text-3xl font-black text-slate-900">
            社員年資列表
          </h2>

          {fetching ? (
            <div className="mt-6 text-slate-500">載入中...</div>
          ) : memberList.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-slate-500">
              目前尚未建立任何社員年資資料。
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
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
                  {memberList.map((item) => (
                    <tr key={item.id} className="border-t border-slate-200">
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

                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          disabled={deletingId === item.id}
                          className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
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