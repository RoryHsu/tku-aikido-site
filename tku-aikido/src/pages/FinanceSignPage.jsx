import { useEffect, useRef, useState } from "react";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useParams, useSearchParams } from "react-router-dom";
import { db } from "../lib/firebase";

function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111827";

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (value) {
      const image = new Image();
      image.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      };
      image.src = value;
    }
  }, [value]);

  const getPointer = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const clientX =
      event.touches && event.touches.length > 0
        ? event.touches[0].clientX
        : event.clientX;

    const clientY =
      event.touches && event.touches.length > 0
        ? event.touches[0].clientY
        : event.clientY;

    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDrawing = (event) => {
    event.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const point = getPointer(event);

    drawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (event) => {
    if (!drawingRef.current) return;

    event.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const point = getPointer(event);

    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!drawingRef.current) return;

    drawingRef.current = false;

    const canvas = canvasRef.current;
    onChange(canvas.toDataURL("image/png"));
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={720}
        height={240}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="h-52 w-full rounded-2xl border border-dashed border-slate-300 bg-white"
      />

      <button
        type="button"
        onClick={clearSignature}
        className="mt-3 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
      >
        清除簽名
      </button>
    </div>
  );
}

export default function FinanceSignPage() {
  const { recordId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [record, setRecord] = useState(null);
  const [signature, setSignature] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchRecord = async () => {
      setLoading(true);

      try {
        const ref = doc(db, "financeRecords", recordId);
        const snapshot = await getDoc(ref);

        if (!snapshot.exists()) {
          setMessage("找不到這張財務證明單。");
          setLoading(false);
          return;
        }

        const data = {
          id: snapshot.id,
          ...snapshot.data(),
        };

        if (!token || data.receiverSignatureToken !== token) {
          setMessage("簽名連結無效，請向財務長確認最新連結。");
          setLoading(false);
          return;
        }

        setRecord(data);
        setSignature(data.receiverSignature || "");
      } catch (err) {
        console.error("fetch sign record error:", err);
        setMessage("讀取單據失敗。");
      }

      setLoading(false);
    };

    fetchRecord();
  }, [recordId, token]);

  const submitSignature = async () => {
    if (!signature) {
      setMessage("請先完成簽名。");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await updateDoc(doc(db, "financeRecords", recordId), {
        receiverSignature: signature,
        hasReceiverSignature: true,
        receiverSignedAt: serverTimestamp(),
        status: "pending_review",
        updatedAt: serverTimestamp(),
      });

      setMessage("簽名已送出，請通知財務長或社長進行後續審核。");
    } catch (err) {
      console.error("submit signature error:", err);
      setMessage("簽名送出失敗，請稍後再試。");
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 px-6 py-10 text-slate-600">
        載入中...
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-slate-100 px-6 py-10">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-black text-slate-900">無法簽名</h1>
          <p className="mt-4 leading-8 text-slate-600">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
        <div className="text-sm font-semibold tracking-[0.2em] text-amber-700">
          TKU AIKIDO FINANCE SIGNATURE
        </div>

        <h1 className="mt-3 text-3xl font-black text-slate-900">
          領款人線上簽名
        </h1>

        <p className="mt-4 leading-8 text-slate-600">
          請確認下方財務證明內容無誤後，在簽名區手寫簽名並送出。
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="grid gap-4 text-sm text-slate-700 md:grid-cols-2">
            <div>
              <span className="font-semibold">所屬活動：</span>
              {record.activityName || "未填寫"}
            </div>

            <div>
              <span className="font-semibold">活動編號：</span>
              {record.activityCode || "未填寫"}
            </div>

            <div>
              <span className="font-semibold">費用類別：</span>
              {record.expenseType || "未填寫"}
            </div>

            <div>
              <span className="font-semibold">金額：</span>
              NT$ {record.amount || 0}
            </div>

            <div>
              <span className="font-semibold">新台幣大寫：</span>
              {record.amountChinese || ""}
            </div>

            <div>
              <span className="font-semibold">領款人：</span>
              {record.receiverName || "未填寫"}
            </div>

            <div>
              <span className="font-semibold">身分別：</span>
              {record.receiverType || "未填寫"}
            </div>

            <div>
              <span className="font-semibold">學號 / 身分證號：</span>
              {record.studentId || "未填寫"}
            </div>
          </div>

          {record.description ? (
            <div className="mt-5 border-t border-slate-200 pt-5 text-sm leading-7 text-slate-700">
              <span className="font-semibold">費用明細：</span>
              {record.description}
            </div>
          ) : null}
        </div>

        <div className="mt-8">
          <div className="mb-3 text-sm font-semibold text-slate-700">
            領款人簽章
          </div>

          <SignaturePad value={signature} onChange={setSignature} />
        </div>

        {message ? (
          <div className="mt-5 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
            {message}
          </div>
        ) : null}

        <button
          type="button"
          disabled={saving}
          onClick={submitSignature}
          className="mt-6 w-full rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          {saving ? "送出中..." : "確認並送出簽名"}
        </button>
      </div>
    </div>
  );
}