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

export default function SealPage() {
  const { profile, currentUser } = useAuth();

  const [clubSeal, setClubSeal] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState("");

  const isPresident = profile?.role === "president";

  useEffect(() => {
    fetchClubSeal();
  }, []);

  const fetchClubSeal = async () => {
    setFetching(true);
    setMessage("");

    try {
      const ref = doc(db, "clubSettings", "main");
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setClubSeal(data.clubSeal || "");
      }
    } catch (error) {
      console.error("fetch club seal error:", error);
      setMessage("讀取社章失敗，請確認 Firestore rules 是否允許讀取 clubSettings/main。");
    }

    setFetching(false);
  };

  const handleSealUpload = async (event) => {
    if (!isPresident) {
      setMessage("只有社長可以上傳或更新社章。");
      return;
    }

    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("請上傳 JPG、PNG 或其他圖片格式。");
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    setClubSeal(dataUrl);
    setMessage("已選擇社章圖片，請按「儲存社章」。");
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

    setLoading(true);
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
      setMessage("儲存社章失敗，請確認 Firestore rules 是否允許社長寫入 clubSettings/main。");
    }

    setLoading(false);
  };

  const removePreview = () => {
    setClubSeal("");
    setMessage("已清除目前畫面上的社章預覽。如要從資料庫移除，請再按「儲存社章」。");
  };

  if (!isPresident) {
    return (
      <AdminLayout>
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold tracking-[0.2em] text-amber-700">
            SEAL SETTING
          </div>

          <h1 className="mt-3 text-3xl font-black text-slate-900">
            沒有權限
          </h1>

          <p className="mt-4 leading-8 text-slate-600">
            社章設定只開放社長使用。
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="text-sm font-semibold tracking-[0.2em] text-amber-700">
            SEAL SETTING
          </div>

          <h1 className="mt-3 text-3xl font-black text-slate-900">
            社章設定
          </h1>

          <p className="mt-4 leading-8 text-slate-600">
            社長可以在此上傳社團印章。完成後，財務證明 PDF 會自動把社章套用到「社章」欄位。
          </p>

          <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-700">
            建議上傳透明背景 PNG。如果只有 JPG 也可以使用，但 PDF 會顯示圖片本身的背景。
          </div>

          <div className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                上傳社章圖片
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={handleSealUpload}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            {message ? (
              <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm leading-7 text-slate-700">
                {message}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={loading || !clubSeal}
                onClick={saveClubSeal}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading ? "儲存中..." : "儲存社章"}
              </button>

              <button
                type="button"
                onClick={removePreview}
                className="rounded-xl border border-red-300 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                清除預覽
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="text-sm font-semibold tracking-[0.2em] text-amber-700">
            PREVIEW
          </div>

          <h2 className="mt-3 text-3xl font-black text-slate-900">
            社章預覽
          </h2>

          {fetching ? (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-500">
              載入社章中...
            </div>
          ) : clubSeal ? (
            <div className="mt-8">
              <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 p-8">
                <img
                  src={clubSeal}
                  alt="社章預覽"
                  className="max-h-64 max-w-full rounded-2xl bg-white object-contain p-4 shadow-sm"
                />
              </div>

              <div className="mt-5 rounded-2xl bg-green-50 px-4 py-4 text-sm leading-7 text-green-700">
                目前已有社章。財務證明經社長核准後，正式 PDF 會自動套用此社章。
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-500">
              目前尚未上傳社章。
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}