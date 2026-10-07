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
import { useAuth } from "../../context/AuthContext";

const categoryOptions = [
  "社課",
  "迎新",
  "成果展",
  "交流活動",
  "講習",
  "社遊",
  "招生活動",
  "其他",
];

export default function EventsPage() {
  const { currentUser, profile } = useAuth();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("社課");
  const [coverImage, setCoverImage] = useState("");
  const [registrationUrl, setRegistrationUrl] = useState("");
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(true);

  const [eventList, setEventList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [message, setMessage] = useState("");

  // 編輯模式：有值代表正在修改這筆活動
  const [editingId, setEditingId] = useState("");
  const [togglingId, setTogglingId] = useState("");
  const formRef = useRef(null);

  // 列表搜尋與篩選
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredEvents = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return eventList.filter((item) => {
      if (statusFilter === "published" && !item.published) return false;
      if (statusFilter === "draft" && item.published) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (!kw) return true;
      return [item.title, item.location, item.description, item.date]
        .filter(Boolean)
        .some((text) => String(text).toLowerCase().includes(kw));
    });
  }, [eventList, keyword, statusFilter, categoryFilter]);

  const resetForm = () => {
    setEditingId("");
    setTitle("");
    setDate("");
    setTime("");
    setLocation("");
    setCategory("社課");
    setCoverImage("");
    setRegistrationUrl("");
    setDescription("");
    setPublished(true);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setTitle(item.title || "");
    setDate(item.date || "");
    setTime(item.time || "");
    setLocation(item.location || "");
    setCategory(item.category || "社課");
    setCoverImage(item.coverImage || "");
    setRegistrationUrl(item.registrationUrl || "");
    setDescription(item.description || "");
    setPublished(item.published !== false);
    setMessage("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const togglePublished = async (item) => {
    setTogglingId(item.id);
    try {
      await updateDoc(doc(db, "events", item.id), {
        published: !item.published,
        updatedAt: serverTimestamp(),
      });
      setEventList((list) =>
        list.map((row) =>
          row.id === item.id ? { ...row, published: !item.published } : row
        )
      );
    } catch (err) {
      console.error("toggle event error:", err);
      setMessage("更新公開狀態失敗，請稍後再試");
    }
    setTogglingId("");
  };

  const fetchEvents = async () => {
    setFetching(true);
    try {
      const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));
      setEventList(data);
    } catch (err) {
      console.error("fetch events error:", err);
      setMessage("讀取活動資料失敗");
    }
    setFetching(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const fields = {
      title,
      date,
      time,
      location,
      category,
      coverImage,
      registrationUrl,
      description,
      published,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "events", editingId), fields);
        setMessage("活動已更新");
      } else {
        await addDoc(collection(db, "events"), {
          ...fields,
          createdBy: currentUser?.email || "",
          createdByName: profile?.name || "",
          createdAt: serverTimestamp(),
        });
        setMessage("活動新增成功");
      }

      resetForm();
      fetchEvents();
    } catch (err) {
      console.error("add event error:", err);
      setMessage(editingId ? "更新失敗，請稍後再試" : "新增失敗，請稍後再試");
    }

    setLoading(false);
  };

  const handleDelete = async (id, eventTitle) => {
    const confirmed = window.confirm(`確定要刪除活動「${eventTitle}」嗎？`);
    if (!confirmed) return;

    setDeletingId(id);
    setMessage("");

    try {
      await deleteDoc(doc(db, "events", id));
      if (editingId === id) resetForm();
      setMessage("活動刪除成功");
      fetchEvents();
    } catch (err) {
      console.error("delete event error:", err);
      setMessage("刪除失敗，請稍後再試");
    }

    setDeletingId("");
  };

  return (
    <AdminLayout>
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div ref={formRef} className="min-w-0 scroll-mt-20 rounded-2xl bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-black text-slate-900">
              {editingId ? "編輯活動" : "新增活動"}
            </h1>
            {editingId ? (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                編輯中
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            建立社課、迎新、成果展與活動公告，勾選「顯示在前台網站」才會出現在網站上。
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                活動名稱
              </label>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：六度空間-Lazertreks 社遊"
                required
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  日期
                </label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  時間
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="例如：16:00 - 18:00"
                  required
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  地點
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="例如：六度空間-Lazertreks"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  活動分類
                </label>
                <select
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categoryOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                封面圖片連結
              </label>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                報名連結
              </label>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                value={registrationUrl}
                onChange={(e) => setRegistrationUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                活動說明
              </label>
              <textarea
                className="min-h-[160px] w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="請輸入活動內容"
              />
            </div>

            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              顯示在前台網站
            </label>

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
                {loading ? "儲存中..." : editingId ? "儲存修改" : "新增活動"}
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
            <h2 className="text-2xl font-black text-slate-900">已建立活動</h2>
            <span className="text-sm text-slate-500">
              {filteredEvents.length} / {eventList.length} 筆
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-amber-700"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜尋活動名稱、地點、日期…"
            />
            <select
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">全部狀態</option>
              <option value="published">已公開</option>
              <option value="draft">未公開</option>
            </select>
            <select
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">全部分類</option>
              {categoryOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {fetching ? (
            <div className="mt-6 text-slate-500">載入中...</div>
          ) : eventList.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-slate-500">
              目前尚未建立任何活動資料。
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-slate-500">
              沒有符合條件的活動。
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {filteredEvents.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-5 ${
                    editingId === item.id
                      ? "border-amber-700 ring-2 ring-amber-100"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-xl font-black text-slate-900">
                        {item.title}
                      </div>

                      <div className="mt-2 text-sm text-slate-500">
                        類別：{item.category || "未分類"}
                      </div>

                      <div className="mt-2 text-sm text-slate-500">
                        日期：{item.date || "未填寫"} ｜ 時間：{item.time || "未填寫"}
                      </div>

                      <div className="mt-2 text-sm text-slate-500">
                        地點：{item.location || "未填寫"}
                      </div>

                      <span
                        className={`mt-3 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          item.published
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.published ? "已公開" : "未公開"}
                      </span>
                    </div>

                    {item.coverImage ? (
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="h-24 w-32 rounded-xl border border-slate-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-32 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-400">
                        無封面
                      </div>
                    )}
                  </div>

                  {item.description ? (
                    <p className="mt-4 line-clamp-3 leading-7 text-slate-600">
                      {item.description}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      編輯
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePublished(item)}
                      disabled={togglingId === item.id}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                      {item.published ? "改為不公開" : "公開到前台"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.title)}
                      disabled={deletingId === item.id}
                      className="ml-auto rounded-xl px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
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