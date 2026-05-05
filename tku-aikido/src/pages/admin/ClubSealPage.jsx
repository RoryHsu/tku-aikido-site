import { useEffect, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/AdminLayout";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ClubSealPage() {
  const { currentUser, profile } = useAuth();

  const [clubSeal, setClubSeal] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const isPresident = profile?.role === "president";

  useEffect(() => {
    const fetchClubSeal = async () => {
      setLoading(true);

      try {
        const ref = doc(db, "clubSettings", "main");
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setClubSeal(data.clubSeal || "");
        }
      } catch (error) {
        console.error("fetch club seal error:", error);
        setMessage("讀取社章失敗。");
      }

      setLoading(false);
    };

    fetchClubSeal();
  }, []);

  const handleSealUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("請上傳 JPG 或 PNG 圖片。");
      return;
    }

    if (file.size > 700 * 1024) {
      setMessage("圖片太大，請先壓縮到 700KB 以下再上傳。");
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    setClubSeal(dataUrl);
    setMessage("社章已載入預覽，請按「儲存社章」。");
  };

  const saveClubSeal = async () => {
    if (!isPresident) {
      setMessage("只有社長可以儲存社章。");
      return;
    }

    if (!clubSeal) {
      setMessage("請先上傳社章圖片。");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await setDoc(
        doc(db, "clubSettings", "main"),
        {
          clubSeal,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser?.email || "",
          updatedByName: profile?.name || "",
        },
        { merge: true }
      );

      setMessage("社章已儲存。之後財務證明 PDF 會自動套用這個社章。");
    } catch (error) {
      console.error("save club seal error:", error);
      setMessage("儲存社章失敗，請確認 Firestore Rules。");
    }

    setSaving(false);
  };

  if (!isPresident) {
    return (
      <AdminLayout>
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-black text-slate-900">沒有權限</h1>
          <p className="mt-4 text-slate-600">只有社長可以管理社章。</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="text-sm font-bold uppercase tracking-[0.22em] text-orange-600">
            Club Seal Settings
          </div>

          <h1 className="mt-3 text-4xl font-black text-slate-900">
            社章設定
          </h1>

          <p className="mt-5 leading-8 text-slate-600">
            社長可在這裡上傳合氣道社社章。儲存後，所有需要社章的財務證明 PDF
            都會自動套用這個社章。
          </p>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <label className="mb-3 block text-sm font-semibold text-slate-700">
              上傳社章 JPG / PNG
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleSealUpload}
              className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
            />

            <p className="mt-3 text-sm leading-7 text-slate-500">
              建議使用透明背景 PNG。圖片大小請控制在 700KB 以下。
            </p>
          </div>

          {message ? (
            <div className="mt-5 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
              {message}
            </div>
          ) : null}

          <button
            type="button"
            disabled={saving || loading}
            onClick={saveClubSeal}
            className="mt-6 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? "儲存中..." : "儲存社章"}
          </button>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="text-sm font-bold uppercase tracking-[0.22em] text-orange-600">
            Preview
          </div>

          <h2 className="mt-3 text-3xl font-black text-slate-900">
            社章預覽
          </h2>

          <div className="mt-8 flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50">
            {clubSeal ? (
              <img
                src={clubSeal}
                alt="社章預覽"
                className="max-h-64 max-w-64 object-contain"
              />
            ) : (
              <div className="text-slate-400">
                {loading ? "載入中..." : "尚未上傳社章"}
              </div>
            )}
          </div>

          <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-800">
            儲存後，財務證明單右下角「社章」欄位會自動顯示此圖片。
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}