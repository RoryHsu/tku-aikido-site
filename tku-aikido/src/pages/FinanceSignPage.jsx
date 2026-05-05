import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

function SignaturePad({ label, value, onChange }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
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
    event.stopPropagation();

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
    event.stopPropagation();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const point = getPointer(event);

    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const stopDrawing = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

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
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-700">{label}</div>

        <button
          type="button"
          onClick={clearSignature}
          className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          清除
        </button>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-2">
        <canvas
          ref={canvasRef}
          width={720}
          height={220}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="h-40 w-full touch-none rounded-lg bg-white"
          style={{
            touchAction: "none",
            overscrollBehavior: "contain",
          }}
        />
      </div>

      <p className="mt-3 text-xs leading-6 text-slate-500">
        手機簽名時，簽名框內已鎖定滑動。請直接在白色區域內簽名。
      </p>
    </div>
  );
}

const statusLabelMap = {
  draft: "草稿",
  pending_receiver_signature: "待領款人簽名",
  pending_treasurer_signature: "待財務長 / 經手人簽名",
  pending_president_review: "待社長簽名審核",
  approved: "已完成",
  returned: "退回修改",
  rejected: "已拒絕",
};

export default function FinanceSignPage() {
  const { recordId } = useParams();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";

  const [record, setRecord] = useState(null);
  const [signature, setSignature] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchRecord = async () => {
      setLoading(true);
      setMessage("");

      try {
        if (!recordId || !token) {
          setMessage("簽名連結不完整，請確認網址是否正確。");
          setLoading(false);
          return;
        }

        const ref = doc(db, "financeRecords", recordId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setMessage("找不到這份財務證明。");
          setLoading(false);
          return;
        }

        const data = {
          id: snap.id,
          ...snap.data(),
        };

        if (data.receiverSignatureToken !== token) {
          setMessage("簽名連結驗證失敗。請使用財務長提供的最新連結。");
          setLoading(false);
          return;
        }

        if (data.status !== "pending_receiver_signature") {
          setRecord(data);

          if (data.hasReceiverSignature) {
            setSignature(data.receiverSignature || "");
            setMessage("這份財務證明已完成領款人簽名，無需重複簽名。");
          } else {
            setMessage(
              `此單據目前狀態為「${statusLabelMap[data.status] || data.status}」，暫時不能由領款人簽名。`
            );
          }

          setLoading(false);
          return;
        }

        setRecord(data);
      } catch (error) {
        console.error("fetch finance sign record error:", error);
        setMessage("讀取財務證明失敗，請稍後再試。");
      }

      setLoading(false);
    };

    fetchRecord();
  }, [recordId, token]);

  const submitSignature = async () => {
    setMessage("");

    if (!record) {
      setMessage("找不到財務證明資料。");
      return;
    }

    if (record.receiverSignatureToken !== token) {
      setMessage("簽名連結驗證失敗。");
      return;
    }

    if (record.status !== "pending_receiver_signature") {
      setMessage("此單據目前不能由領款人簽名。");
      return;
    }

    if (!signature || !signature.startsWith("data:image/")) {
      setMessage("請先在簽名框內完成簽名。");
      return;
    }

    setSubmitting(true);

    try {
      await updateDoc(doc(db, "financeRecords", record.id), {
        receiverSignature: signature,
        hasReceiverSignature: true,
        receiverSignedAt: serverTimestamp(),
        status: "pending_treasurer_signature",
        updatedAt: serverTimestamp(),
        receiverSignatureToken: token,
      });

      setRecord((prev) => ({
        ...prev,
        receiverSignature: signature,
        hasReceiverSignature: true,
        status: "pending_treasurer_signature",
      }));

      setMessage("簽名完成。此單據已送回財務長 / 經手人簽章。");
    } catch (error) {
      console.error("submit receiver signature error:", error);
      setMessage("簽名送出失敗，請稍後再試。");
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 px-5 py-10">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
          <div className="text-slate-500">讀取財務證明中...</div>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-slate-100 px-5 py-10">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
          <div className="text-sm font-bold tracking-[0.2em] text-red-600">
            SIGNATURE ERROR
          </div>

          <h1 className="mt-3 text-3xl font-black text-slate-900">
            無法進行簽名
          </h1>

          <p className="mt-4 leading-8 text-slate-600">
            {message || "簽名連結無效。"}
          </p>
        </div>
      </div>
    );
  }

  const canSign =
    record.status === "pending_receiver_signature" &&
    record.receiverSignatureToken === token &&
    !record.hasReceiverSignature;

  return (
    <div className="min-h-screen bg-slate-100 px-5 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="text-sm font-bold uppercase tracking-[0.22em] text-amber-700">
            TKU AIKIDO FINANCE SIGNATURE
          </div>

          <h1 className="mt-3 text-3xl font-black text-slate-900">
            領款人線上簽名
          </h1>

          <p className="mt-4 leading-8 text-slate-600">
            請確認下方財務證明內容無誤後，在簽名框內完成簽名並送出。
          </p>

          {message ? (
            <div className="mt-5 rounded-2xl bg-slate-100 px-4 py-4 text-sm leading-7 text-slate-700">
              {message}
            </div>
          ) : null}
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900">財務證明內容</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">所屬活動</div>
              <div className="mt-2 font-bold text-slate-900">
                {record.activityName || "未填寫"}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">費用類別</div>
              <div className="mt-2 font-bold text-slate-900">
                {record.expenseType || "未填寫"}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">金額</div>
              <div className="mt-2 font-bold text-slate-900">
                NT$ {record.amount || 0}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">新台幣大寫</div>
              <div className="mt-2 font-bold text-slate-900">
                {record.amountChinese || "未填寫"}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">領款人</div>
              <div className="mt-2 font-bold text-slate-900">
                {record.receiverName || "未填寫"}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">
                學號 / 身分證號
              </div>
              <div className="mt-2 font-bold text-slate-900">
                {record.studentId || "未填寫"}
              </div>
            </div>
          </div>

          {record.description ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">
                費用明細說明
              </div>
              <div className="mt-2 leading-7 text-slate-800">
                {record.description}
              </div>
            </div>
          ) : null}

          {record.receiptImages?.length > 0 ? (
            <div className="mt-6">
              <div className="mb-3 text-sm font-semibold text-slate-700">
                發票 / 收據附件：共 {record.receiptImages.length} 張
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {record.receiptImages.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <img
                      src={item}
                      alt={`收據 ${index + 1}`}
                      className="h-48 w-full rounded-xl bg-white object-contain"
                    />

                    <div className="mt-2 text-center text-xs font-semibold text-slate-500">
                      收據 / 發票 {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <SignaturePad
          label="領款人簽名"
          value={signature}
          onChange={setSignature}
        />

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <button
            type="button"
            disabled={!canSign || submitting}
            onClick={submitSignature}
            className={`w-full rounded-2xl px-6 py-4 text-base font-bold ${
              canSign && !submitting
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "cursor-not-allowed bg-slate-300 text-slate-500"
            }`}
          >
            {submitting ? "送出中..." : "確認簽名並送出"}
          </button>

          {!canSign ? (
            <p className="mt-4 text-center text-sm leading-7 text-slate-500">
              此連結目前不可簽名，可能已簽署完成或單據狀態已變更。
            </p>
          ) : (
            <p className="mt-4 text-center text-sm leading-7 text-slate-500">
              送出後，單據會交由財務長 / 經手人進行下一步簽章。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}