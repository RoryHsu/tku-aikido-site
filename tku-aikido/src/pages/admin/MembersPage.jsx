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

/**
 * 學期代號：「115-1」= 115 學年度上學期（8 月～隔年 1 月），「115-2」= 下學期（2 月～7 月）。
 * 學期範圍依今天的日期自動計算，每到新學期就會自動多一欄，不需要改程式。
 * 資料格式：semesters = { "108-1": "1", "115-1": "1" }，有參與的學期記 "1"。
 */
const DEFAULT_START_YEAR = 108;
const RECENT_YEARS = 4;

function getCurrentSemester(date = new Date()) {
  const rocYear = date.getFullYear() - 1911;
  const month = date.getMonth() + 1;
  if (month >= 8) return { year: rocYear, term: 1 };
  if (month === 1) return { year: rocYear - 1, term: 1 };
  return { year: rocYear - 1, term: 2 };
}

const CURRENT = getCurrentSemester();
const CURRENT_KEY = `${CURRENT.year}-${CURRENT.term}`;

const semesterKey = (year, term) => `${year}-${term}`;
const isAttended = (value) => value === 1 || value === "1";
const isFuture = (year, term) =>
  year > CURRENT.year || (year === CURRENT.year && term > CURRENT.term);

function parseSemesterKey(key) {
  const match = /^(\d{2,3})-([12])$/.exec(key);
  return match ? { year: Number(match[1]), term: Number(match[2]) } : null;
}

// 只留下有參與的學期，例如 { "108-1": "1", "109-2": "1" }
function attendedOnly(semesters = {}) {
  return Object.keys(semesters).reduce((acc, key) => {
    if (parseSemesterKey(key) && isAttended(semesters[key])) acc[key] = "1";
    return acc;
  }, {});
}

function calculateYears(semesters = {}) {
  return Object.keys(attendedOnly(semesters)).length / 2;
}

function earliestYear(semesters = {}) {
  return Object.keys(attendedOnly(semesters)).reduce((min, key) => {
    const parsed = parseSemesterKey(key);
    return parsed && parsed.year < min ? parsed.year : min;
  }, Infinity);
}

function yearRange(startYear, endYear) {
  const years = [];
  for (let year = startYear; year <= endYear; year += 1) years.push(year);
  return years;
}

export default function MembersPage() {
  const [memberCode, setMemberCode] = useState("");
  const [name, setName] = useState("");
  const [departmentGrade, setDepartmentGrade] = useState("");
  const [size, setSize] = useState("-");
  const [officerRole, setOfficerRole] = useState("");
  const [semesters, setSemesters] = useState({});
  // 表單往前多顯示幾個學年（輸入很久以前的社員時使用）
  const [extraYears, setExtraYears] = useState(0);
  // 列表顯示最近幾年，或全部學期
  const [showAllYears, setShowAllYears] = useState(false);

  const [memberList, setMemberList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [message, setMessage] = useState("");

  const computedYears = useMemo(() => calculateYears(semesters), [semesters]);

  // 學期範圍：從 108 學年（或資料中最早的學年）到目前學年
  const dataStartYear = useMemo(
    () =>
      Math.min(
        DEFAULT_START_YEAR,
        ...memberList.map((item) => earliestYear(item.semesters))
      ),
    [memberList]
  );
  const formYears = yearRange(
    Math.min(dataStartYear, earliestYear(semesters)) - extraYears,
    CURRENT.year
  ).reverse();
  const listYears = yearRange(
    showAllYears
      ? dataStartYear
      : Math.max(dataStartYear, CURRENT.year - RECENT_YEARS + 1),
    CURRENT.year
  );
  const listSemesterKeys = listYears
    .flatMap((year) => [semesterKey(year, 1), semesterKey(year, 2)])
    .filter((key) => {
      const { year, term } = parseSemesterKey(key);
      return !isFuture(year, term);
    });

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
    setSemesters(attendedOnly(item.semesters));
    setExtraYears(0);
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

  const toggleSemester = (key) => {
    setSemesters((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = "1";
      return next;
    });
  };

  const resetForm = () => {
    setEditingId("");
    setMemberCode("");
    setName("");
    setDepartmentGrade("");
    setSize("-");
    setOfficerRole("");
    setSemesters({});
    setExtraYears(0);
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
        semesters: attendedOnly(semesters),
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
            1. 點一下學期按鈕切換「有參與」（紅色）與「未參與」（灰色）
            <br />
            2. 年資會自動依照「參與學期總數 ÷ 2」計算
            <br />
            3. 學期會依日期自動更新，目前是 {CURRENT.year} 學年度
            {CURRENT.term === 1 ? "上" : "下"}學期（{CURRENT_KEY}）
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
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-medium text-slate-700">
                  各學期參與狀況
                  <span className="ml-2 text-xs text-slate-500">
                    已選 {Object.keys(semesters).length} 學期
                  </span>
                </div>
                <div className="flex gap-2">
                  {Object.keys(semesters).length ? (
                    <button
                      type="button"
                      onClick={() => setSemesters({})}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                    >
                      全部清除
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setExtraYears((n) => n + 1)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    ＋ 更早的學年
                  </button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {formYears.map((year) => (
                  <div
                    key={year}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <span className="w-16 shrink-0 text-sm font-bold text-slate-700">
                      {year} 學年
                    </span>
                    {[1, 2].map((term) => {
                      const key = semesterKey(year, term);
                      const on = Boolean(semesters[key]);
                      const future = isFuture(year, term);
                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={future && !on}
                          onClick={() => toggleSemester(key)}
                          title={future ? "這個學期還沒開始" : key}
                          className={`flex-1 rounded-lg px-2 py-2 text-sm font-bold transition ${
                            on
                              ? "bg-amber-700 text-white"
                              : future
                                ? "cursor-not-allowed bg-slate-50 text-slate-300"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          } ${key === CURRENT_KEY ? "ring-2 ring-amber-700/30" : ""}`}
                        >
                          {term === 1 ? "上" : "下"}
                          {on ? " ✓" : ""}
                        </button>
                      );
                    })}
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
            <select
              value={showAllYears ? "all" : "recent"}
              onChange={(e) => setShowAllYears(e.target.value === "all")}
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none"
            >
              <option value="recent">顯示最近 {RECENT_YEARS} 學年</option>
              <option value="all">顯示全部學期（{dataStartYear} 學年起）</option>
            </select>
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
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">編號</th>
                    <th className="px-4 py-3 text-left font-semibold">姓名</th>
                    <th className="px-4 py-3 text-left font-semibold">系級</th>
                    <th className="px-4 py-3 text-left font-semibold">尺寸</th>
                    {listSemesterKeys.map((key) => (
                      <th
                        key={key}
                        className={`whitespace-nowrap px-2 py-3 text-center font-semibold ${
                          key === CURRENT_KEY ? "text-amber-700" : ""
                        }`}
                      >
                        {key}
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

                      {listSemesterKeys.map((key) => (
                        <td key={key} className="px-2 py-3 text-center">
                          {isAttended(item.semesters?.[key]) ? (
                            <span className="font-bold text-amber-700">1</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      ))}

                      <td className="px-4 py-3 text-center font-bold text-slate-900">
                        {calculateYears(item.semesters)}
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