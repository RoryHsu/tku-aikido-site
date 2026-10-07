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
import {
  extractGoogleDriveFileId,
  getGoogleDriveThumbnailUrl,
  getGoogleDriveViewUrl,
  isGoogleDriveUrl,
} from "../../utils/googleDrive";

const typeOptions = [
  { value: "image", label: "照片" },
  { value: "video", label: "影片" },
  { value: "poster", label: "海報" },
  { value: "document", label: "文件" },
];

const typeLabelMap = Object.fromEntries(
  typeOptions.map((item) => [item.value, item.label])
);

const categoryOptions = [
  "社課",
  "成果展",
  "迎新",
  "交流活動",
  "公告素材",
  "其他",
];

export default function MediaPage() {
  const { currentUser, profile } = useAuth();

  const [title, setTitle] = useState("");
  const [type, setType] = useState("image");
  const [category, setCategory] = useState("社課");
  const [driveUrl, setDriveUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [description, setDescription] = useState("");
  const [visibleOnWebsite, setVisibleOnWebsite] = useState(true);

  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [message, setMessage] = useState("");

  // 歷任幹部只能修改、刪除自己上傳的媒體
  const isAlumni = profile?.role === "alumni";
  const canManage = (item) =>
    !isAlumni || (item.createdBy && item.createdBy === currentUser?.email);

  // 編輯模式
  const [editingId, setEditingId] = useState("");
  const formRef = useRef(null);

  // 列表搜尋與篩選
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredMedia = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return mediaList.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (statusFilter === "published" && !item.visibleOnWebsite) return false;
      if (statusFilter === "draft" && item.visibleOnWebsite) return false;
      if (!kw) return true;
      return [item.title, item.category, item.description, item.createdByName]
        .filter(Boolean)
        .some((text) => String(text).toLowerCase().includes(kw));
    });
  }, [mediaList, keyword, typeFilter, statusFilter]);

  const resetForm = () => {
    setEditingId("");
    setTitle("");
    setType("image");
    setCategory("社課");
    setDriveUrl("");
    setThumbnailUrl("");
    setDescription("");
    setVisibleOnWebsite(true);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setTitle(item.title || "");
    setType(item.type || "image");
    setCategory(item.category || "社課");
    setDriveUrl(item.driveUrl || "");
    setThumbnailUrl(item.thumbnailUrl || "");
    setDescription(item.description || "");
    setVisibleOnWebsite(item.visibleOnWebsite !== false);
    setMessage("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const autoFileId = useMemo(() => {
    return extractGoogleDriveFileId(driveUrl);
  }, [driveUrl]);

  const autoThumbnailUrl = useMemo(() => {
    if (!isGoogleDriveUrl(driveUrl)) return "";
    return getGoogleDriveThumbnailUrl(driveUrl);
  }, [driveUrl]);

  const previewThumbnail = thumbnailUrl.trim() || autoThumbnailUrl;

  const fetchMedia = async () => {
    setFetching(true);
    try {
      const q = query(collection(db, "media"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));
      setMediaList(data);
    } catch (err) {
      console.error("fetch media error:", err);
      setMessage("讀取媒體資料失敗");
    }
    setFetching(false);
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const normalizedDriveUrl = driveUrl.trim();
      const normalizedThumbnailUrl =
        thumbnailUrl.trim() ||
        (isGoogleDriveUrl(normalizedDriveUrl)
          ? getGoogleDriveThumbnailUrl(normalizedDriveUrl)
          : "");

      const normalizedViewUrl = isGoogleDriveUrl(normalizedDriveUrl)
        ? getGoogleDriveViewUrl(normalizedDriveUrl)
        : normalizedDriveUrl;

      const fields = {
        title: title.trim(),
        type,
        category,
        driveUrl: normalizedViewUrl,
        thumbnailUrl: normalizedThumbnailUrl,
        description: description.trim(),
        visibleOnWebsite,
        googleDriveFileId: extractGoogleDriveFileId(normalizedDriveUrl),
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "media", editingId), fields);
        setMessage("媒體已更新");
      } else {
        await addDoc(collection(db, "media"), {
          ...fields,
          createdBy: currentUser?.email || "",
          createdByName: profile?.name || "",
          createdAt: serverTimestamp(),
        });
        setMessage("媒體新增成功");
      }

      resetForm();
      fetchMedia();
    } catch (err) {
      console.error("add media error:", err);
      setMessage(editingId ? "更新失敗，請稍後再試" : "新增失敗，請稍後再試");
    }

    setLoading(false);
  };

  const handleDelete = async (id, itemTitle) => {
    const confirmed = window.confirm(`確定要刪除「${itemTitle}」嗎？`);
    if (!confirmed) return;

    setDeletingId(id);
    setMessage("");

    try {
      await deleteDoc(doc(db, "media", id));
      if (editingId === id) resetForm();
      setMessage("媒體刪除成功");
      fetchMedia();
    } catch (err) {
      console.error("delete media error:", err);
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
              {editingId ? "編輯媒體" : "新增照片 / 影片"}
            </h1>
            {editingId ? (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                編輯中
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-sm leading-7 text-slate-500">
            貼上 Google Drive 分享連結後，系統會自動解析縮圖，供前台成果頁與影片頁顯示。
          </p>

          <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-800">
            請確認 Google Drive 檔案權限已設為：
            <br />
            <span className="font-semibold">知道連結的任何人可查看</span>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                標題
              </label>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：2025 成果展影片"
                required
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  類型
                </label>
                <select
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {typeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  分類
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
                Google Drive 分享連結
              </label>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                required
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              <div>
                <span className="font-semibold text-slate-800">Google Drive 檔案 ID：</span>{" "}
                {autoFileId || "尚未解析"}
              </div>
              <div className="mt-2 break-all">
                <span className="font-semibold text-slate-800">自動縮圖連結：</span>{" "}
                {autoThumbnailUrl || "尚未產生"}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                自訂封面圖連結（可留空）
              </label>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="若留空，將自動使用 Google Drive 縮圖"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                說明
              </label>
              <textarea
                className="min-h-[120px] w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="請輸入媒體說明"
              />
            </div>

            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={visibleOnWebsite}
                onChange={(e) => setVisibleOnWebsite(e.target.checked)}
              />
              顯示在前台網站
            </label>

            {previewThumbnail ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 text-sm font-semibold text-slate-700">
                  預覽縮圖
                </div>
                <img
                  src={previewThumbnail}
                  alt="預覽縮圖"
                  className="h-56 w-full rounded-2xl border border-slate-200 object-cover"
                />
              </div>
            ) : null}

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
                {loading ? "儲存中..." : editingId ? "儲存修改" : "新增媒體"}
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
            <h2 className="text-2xl font-black text-slate-900">已建立媒體</h2>
            <span className="text-sm text-slate-500">
              {filteredMedia.length} / {mediaList.length} 筆
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-amber-700"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜尋標題、分類、建立者…"
            />
            <select
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">全部類型</option>
              {typeOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">全部狀態</option>
              <option value="published">已公開</option>
              <option value="draft">未公開</option>
            </select>
          </div>

          {fetching ? (
            <div className="mt-6 text-slate-500">載入中...</div>
          ) : mediaList.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-slate-500">
              目前尚未建立任何媒體資料。
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-slate-500">
              沒有符合條件的媒體。
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {filteredMedia.map((item) => {
                const itemPreview =
                  item.thumbnailUrl ||
                  (isGoogleDriveUrl(item.driveUrl)
                    ? getGoogleDriveThumbnailUrl(item.driveUrl)
                    : "");

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-5 ${
                      editingId === item.id
                        ? "border-amber-700 ring-2 ring-amber-100"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xl font-black text-slate-900">
                          {item.title}
                        </div>
                        <div className="mt-2 text-sm text-slate-500">
                          類型：{typeLabelMap[item.type] || item.type} ｜ 分類：{item.category}
                        </div>
                        <span
                          className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            item.visibleOnWebsite
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {item.visibleOnWebsite ? "已公開" : "未公開"}
                        </span>
                        <div className="mt-2 text-sm text-slate-500">
                          建立者：{item.createdByName || item.createdBy}
                        </div>
                      </div>

                      {itemPreview ? (
                        <img
                          src={itemPreview}
                          alt={item.title}
                          className="h-20 w-28 rounded-xl border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-28 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-400">
                          無封面
                        </div>
                      )}
                    </div>

                    {item.description ? (
                      <p className="mt-4 leading-7 text-slate-600">
                        {item.description}
                      </p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {canManage(item) ? (
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          編輯
                        </button>
                      ) : null}

                      <a
                        href={item.driveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        開啟連結
                      </a>

                      {canManage(item) ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.title)}
                          disabled={deletingId === item.id}
                          className="ml-auto rounded-xl px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          {deletingId === item.id ? "刪除中..." : "刪除"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}