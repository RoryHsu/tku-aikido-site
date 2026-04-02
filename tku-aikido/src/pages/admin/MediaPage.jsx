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

      await addDoc(collection(db, "media"), {
        title: title.trim(),
        type,
        category,
        driveUrl: normalizedViewUrl,
        thumbnailUrl: normalizedThumbnailUrl,
        description: description.trim(),
        visibleOnWebsite,
        googleDriveFileId: extractGoogleDriveFileId(normalizedDriveUrl),
        createdBy: currentUser?.email || "",
        createdByName: profile?.name || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setTitle("");
      setType("image");
      setCategory("社課");
      setDriveUrl("");
      setThumbnailUrl("");
      setDescription("");
      setVisibleOnWebsite(true);

      setMessage("媒體新增成功");
      fetchMedia();
    } catch (err) {
      console.error("add media error:", err);
      setMessage("新增失敗，請稍後再試");
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
      <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold tracking-[0.2em] text-amber-700">
            MEDIA MANAGEMENT
          </div>

          <h1 className="mt-3 text-3xl font-black text-slate-900">
            照片 / 影片管理
          </h1>

          <p className="mt-4 leading-8 text-slate-600">
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

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {loading ? "儲存中..." : "儲存媒體"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold tracking-[0.2em] text-amber-700">
            MEDIA LIST
          </div>

          <h2 className="mt-3 text-3xl font-black text-slate-900">
            已建立媒體
          </h2>

          {fetching ? (
            <div className="mt-6 text-slate-500">載入中...</div>
          ) : mediaList.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-slate-500">
              目前尚未建立任何媒體資料。
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {mediaList.map((item) => {
                const itemPreview =
                  item.thumbnailUrl ||
                  (isGoogleDriveUrl(item.driveUrl)
                    ? getGoogleDriveThumbnailUrl(item.driveUrl)
                    : "");

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xl font-black text-slate-900">
                          {item.title}
                        </div>
                        <div className="mt-2 text-sm text-slate-500">
                          類型：{item.type} ｜ 分類：{item.category}
                        </div>
                        <div className="mt-2 text-sm text-slate-500">
                          狀態：{item.visibleOnWebsite ? "已公開" : "未公開"}
                        </div>
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

                    <div className="mt-4 flex items-center gap-3">
                      <a
                        href={item.driveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-sm font-semibold text-blue-600 hover:underline"
                      >
                        開啟 Google Drive 連結
                      </a>

                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        disabled={deletingId === item.id}
                        className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                      >
                        {deletingId === item.id ? "刪除中..." : "刪除"}
                      </button>
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