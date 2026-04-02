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

    try {
      await addDoc(collection(db, "events"), {
        title,
        date,
        time,
        location,
        category,
        coverImage,
        registrationUrl,
        description,
        published,
        createdBy: currentUser?.email || "",
        createdByName: profile?.name || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setTitle("");
      setDate("");
      setTime("");
      setLocation("");
      setCategory("社課");
      setCoverImage("");
      setRegistrationUrl("");
      setDescription("");
      setPublished(true);

      setMessage("活動新增成功");
      fetchEvents();
    } catch (err) {
      console.error("add event error:", err);
      setMessage("新增失敗，請稍後再試");
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
      <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold tracking-[0.2em] text-amber-700">
            EVENT MANAGEMENT
          </div>
          <h1 className="mt-3 text-3xl font-black text-slate-900">
            活動公告管理
          </h1>
          <p className="mt-4 leading-8 text-slate-600">
            建立社課、迎新、成果展與活動公告，並同步顯示在前台。
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

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {loading ? "儲存中..." : "儲存活動"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold tracking-[0.2em] text-amber-700">
            EVENT LIST
          </div>
          <h2 className="mt-3 text-3xl font-black text-slate-900">
            已建立活動
          </h2>

          {fetching ? (
            <div className="mt-6 text-slate-500">載入中...</div>
          ) : eventList.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-slate-500">
              目前尚未建立任何活動資料。
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {eventList.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 p-5"
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

                      <div className="mt-2 text-sm text-slate-500">
                        狀態：{item.published ? "已公開" : "未公開"}
                      </div>
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

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
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