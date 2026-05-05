import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/AdminLayout";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const expenseTypeOptions = ["印刷費", "活動費", "其他"];
const subsidyTypeOptions = ["學校補助", "社費支出"];
const receiverTypeOptions = ["淡江合氣道社員", "非社員"];

const statusLabelMap = {
  draft: "草稿",
  pending_review: "待社長審核",
  returned: "退回修改",
  approved: "已核准",
  rejected: "已拒絕",
};

const statusClassMap = {
  draft: "bg-slate-100 text-slate-700",
  pending_review: "bg-amber-100 text-amber-700",
  returned: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function toTaiwanYear(dateString) {
  if (!dateString) {
    return {
      year: "",
      month: "",
      day: "",
    };
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return {
      year: "",
      month: "",
      day: "",
    };
  }

  return {
    year: String(date.getFullYear() - 1911),
    month: String(date.getMonth() + 1).padStart(2, "0"),
    day: String(date.getDate()).padStart(2, "0"),
  };
}

function numberToChineseAmount(inputAmount) {
  const amount = Number(inputAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "";
  }

  const digits = ["零", "壹", "貳", "參", "肆", "伍", "陸", "柒", "捌", "玖"];
  const units = ["", "拾", "佰", "仟"];
  const bigUnits = ["", "萬", "億"];

  const integer = Math.floor(amount);

  if (integer === 0) {
    return "零元整";
  }

  const sectionToChinese = (section) => {
    let str = "";
    let zero = true;

    for (let i = 0; i < 4; i++) {
      const digit = section % 10;

      if (digit === 0) {
        if (!zero) {
          zero = true;
          str = digits[0] + str;
        }
      } else {
        zero = false;
        str = digits[digit] + units[i] + str;
      }

      section = Math.floor(section / 10);
    }

    return str.replace(/零+$/g, "");
  };

  let result = "";
  let unitIndex = 0;
  let num = integer;
  let needZero = false;

  while (num > 0) {
    const section = num % 10000;

    if (section === 0) {
      needZero = true;
    } else {
      let sectionText = sectionToChinese(section);

      if (needZero && result) {
        result = digits[0] + result;
      }

      result = sectionText + bigUnits[unitIndex] + result;
      needZero = section < 1000;
    }

    num = Math.floor(num / 10000);
    unitIndex += 1;
  }

  return `${result}元整`;
}

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

function SignaturePad({ label, value, onChange }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111827";

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
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
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

      <canvas
        ref={canvasRef}
        width={520}
        height={160}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="h-32 w-full rounded-xl border border-dashed border-slate-300 bg-slate-50"
      />

      <p className="mt-2 text-xs text-slate-400">
        可使用滑鼠、觸控板或手機觸控手寫簽名。
      </p>
    </div>
  );
}

function FinancePdfTemplate({
  form,
  amountChinese,
  receipts,
  receiverSignature,
  treasurerSignature,
  presidentSignature,
  clubSeal,
}) {
  const rocDate = toTaiwanYear(form.date);

  return (
    <div
      id="finance-pdf-template"
      className="mx-auto bg-white text-black"
      style={{
        width: "794px",
        minHeight: "1123px",
        padding: "46px 54px",
        fontFamily:
          '"Noto Sans TC", "Microsoft JhengHei", "PingFang TC", Arial, sans-serif',
      }}
    >
      <div className="mb-3 flex items-center gap-3">
        <div
          style={{
            width: "42px",
            height: "42px",
            border: "2px solid #111",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            fontWeight: "bold",
          }}
        >
          合氣
        </div>

        <div style={{ fontSize: "18px", fontWeight: "700", letterSpacing: "2px" }}>
          淡江大學合氣道社－財務證明
        </div>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
          border: "2px solid #111",
          fontSize: "14px",
        }}
      >
        <tbody>
          <tr>
            <td
              colSpan="6"
              style={{
                border: "1px solid #111",
                background: "#444",
                color: "#fff",
                textAlign: "center",
                fontSize: "18px",
                fontWeight: "700",
                padding: "10px",
                letterSpacing: "3px",
              }}
            >
              淡江大學合氣道社－財務證明
            </td>
          </tr>

          <tr>
            <td style={pdfLabelCell}>所屬活動</td>
            <td colSpan="3" style={pdfValueCell}>
              {form.activityName || ""}
            </td>
            <td style={pdfLabelCell}>活動編號</td>
            <td style={pdfValueCell}>{form.activityCode || ""}</td>
          </tr>

          <tr>
            <td style={pdfLabelCell}>費用類別</td>
            <td colSpan="3" style={pdfValueCell}>
              {expenseTypeOptions.map((item) => (
                <span key={item} style={{ marginRight: "18px" }}>
                  □{form.expenseType === item ? "■" : ""} {item}
                </span>
              ))}
            </td>
            <td style={pdfLabelCell}>費用編號</td>
            <td style={pdfValueCell}>{form.expenseCode || ""}</td>
          </tr>

          <tr>
            <td style={pdfLabelCell}>領款日期</td>
            <td colSpan="3" style={pdfValueCell}>
              民國 {rocDate.year} 年 {rocDate.month} 月 {rocDate.day} 日
            </td>
            <td style={pdfLabelCell}>申請補助</td>
            <td style={pdfValueCell}>
              {subsidyTypeOptions.map((item) => (
                <div key={item}>
                  □{form.subsidyType === item ? "■" : ""} {item}
                </div>
              ))}
            </td>
          </tr>

          <tr>
            <td style={pdfLabelCell}>備註</td>
            <td colSpan="5" style={{ ...pdfValueCell, height: "92px", verticalAlign: "top" }}>
              {form.note || ""}
            </td>
          </tr>

          <tr>
            <td colSpan="2" style={pdfLabelCell}>
              新台幣（大寫）
            </td>
            <td colSpan="2" style={{ ...pdfValueCell, textAlign: "center", fontWeight: "700" }}>
              {amountChinese}
            </td>
            <td style={pdfLabelCell}>NT$</td>
            <td style={{ ...pdfValueCell, fontWeight: "700" }}>{form.amount || ""}</td>
          </tr>

          <tr>
            <td
              colSpan="6"
              style={{
                border: "1px solid #111",
                height: "170px",
                padding: "14px",
                verticalAlign: "top",
              }}
            >
              <div style={{ marginBottom: "10px", fontWeight: "700" }}>
                上款已照數領訖　此據
              </div>

              <div style={{ marginBottom: "10px" }}>淡江大學合氣道社台照</div>

              <div style={{ marginLeft: "310px", lineHeight: "34px" }}>
                <div>
                  ◆ 領款人簽章：
                  {receiverSignature ? (
                    <img
                      src={receiverSignature}
                      alt="領款人簽章"
                      style={{
                        width: "150px",
                        height: "42px",
                        objectFit: "contain",
                        verticalAlign: "middle",
                      }}
                    />
                  ) : (
                    "________________"
                  )}
                </div>

                <div>
                  ◆ 身分別：
                  <span style={{ marginLeft: "10px" }}>
                    □{form.receiverType === "淡江合氣道社員" ? "■" : ""} 淡江合氣道社員
                  </span>
                  <span style={{ marginLeft: "12px" }}>
                    □{form.receiverType === "非社員" ? "■" : ""} 非社員：
                    {form.nonMemberNote || "______"}
                  </span>
                </div>

                <div>
                  ◆ 學號（身分證號）：{form.studentId || "________________"}
                </div>

                <div>
                  ◆ 領款人姓名：{form.receiverName || "________________"}
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td
              colSpan="6"
              style={{
                border: "1px solid #111",
                height: "390px",
                padding: "12px",
                verticalAlign: "top",
              }}
            >
              <div style={{ fontWeight: "700", marginBottom: "8px" }}>
                費用明細及收據黏貼處（浮貼）
              </div>

              <div style={{ fontSize: "13px", marginBottom: "10px" }}>
                ※ 申請校補助之款項請貼收據影本；社費支出之款項請貼正本收據
              </div>

              <div
                style={{
                  border: "1px dashed #777",
                  minHeight: "305px",
                  padding: "10px",
                  display: "grid",
                  gridTemplateColumns: receipts.length > 1 ? "1fr 1fr" : "1fr",
                  gap: "10px",
                }}
              >
                {receipts.length > 0 ? (
                  receipts.map((receipt, index) => (
                    <div
                      key={index}
                      style={{
                        border: "1px solid #ccc",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "135px",
                      }}
                    >
                      <img
                        src={receipt}
                        alt={`收據 ${index + 1}`}
                        style={{
                          maxWidth: "100%",
                          maxHeight: receipts.length > 1 ? "140px" : "280px",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      color: "#777",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "280px",
                    }}
                  >
                    收據 / 發票 JPG 黏貼處
                  </div>
                )}
              </div>
            </td>
          </tr>

          <tr>
            <td colSpan="2" style={{ ...pdfSignatureCell, height: "95px" }}>
              <div style={{ fontWeight: "700" }}>經手人（財務長）簽章：</div>
              {treasurerSignature ? (
                <img
                  src={treasurerSignature}
                  alt="財務長簽章"
                  style={{
                    width: "180px",
                    height: "56px",
                    objectFit: "contain",
                    marginTop: "8px",
                  }}
                />
              ) : null}
            </td>

            <td colSpan="3" style={{ ...pdfSignatureCell, height: "95px" }}>
              <div style={{ fontWeight: "700" }}>社長簽章：</div>
              {presidentSignature ? (
                <img
                  src={presidentSignature}
                  alt="社長簽章"
                  style={{
                    width: "180px",
                    height: "56px",
                    objectFit: "contain",
                    marginTop: "8px",
                  }}
                />
              ) : null}
            </td>

            <td style={{ ...pdfSignatureCell, height: "95px" }}>
              <div style={{ fontWeight: "700" }}>社章</div>
              {clubSeal ? (
                <img
                  src={clubSeal}
                  alt="社章"
                  style={{
                    width: "70px",
                    height: "70px",
                    objectFit: "contain",
                    marginTop: "4px",
                  }}
                />
              ) : null}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const pdfLabelCell = {
  border: "1px solid #111",
  background: "#f0f0f0",
  fontWeight: "700",
  textAlign: "center",
  padding: "9px",
  width: "16%",
};

const pdfValueCell = {
  border: "1px solid #111",
  padding: "9px",
  minHeight: "34px",
};

const pdfSignatureCell = {
  border: "1px solid #111",
  padding: "10px",
  verticalAlign: "top",
};

const initialForm = {
  activityName: "",
  activityCode: "",
  expenseType: "活動費",
  expenseCode: "",
  date: "",
  subsidyType: "社費支出",
  note: "",
  amount: "",
  receiverName: "",
  receiverType: "淡江合氣道社員",
  nonMemberNote: "",
  studentId: "",
  description: "",
};

export default function FinancePage() {
  const { currentUser, profile } = useAuth();
  const pdfRef = useRef(null);

  const [form, setForm] = useState(initialForm);
  const [records, setRecords] = useState([]);
  const [receiptImages, setReceiptImages] = useState([]);
  const [receiverSignature, setReceiverSignature] = useState("");
  const [treasurerSignature, setTreasurerSignature] = useState("");
  const [presidentSignature, setPresidentSignature] = useState("");
  const [clubSeal, setClubSeal] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState("");

  const role = profile?.role || "";
  const isPresident = role === "president";
  const isFinance = role === "finance" || role === "president";

  const amountChinese = useMemo(() => {
    return numberToChineseAmount(form.amount);
  }, [form.amount]);

  useEffect(() => {
    const savedSeal = localStorage.getItem("tkuAikidoClubSeal");
    if (savedSeal) {
      setClubSeal(savedSeal);
    }

    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setFetching(true);

    try {
      const q = query(
        collection(db, "financeRecords"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      setRecords(data);
    } catch (err) {
      console.error("fetch finance records error:", err);
      setMessage("讀取財務紀錄失敗，請確認 Firestore rules 是否允許 financeRecords。");
    }

    setFetching(false);
  };

  const updateForm = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReceiptUpload = async (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    const imageUrls = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      const dataUrl = await readFileAsDataUrl(file);
      imageUrls.push(dataUrl);
    }

    setReceiptImages((prev) => [...prev, ...imageUrls]);
  };

  const handleClubSealUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const dataUrl = await readFileAsDataUrl(file);
    setClubSeal(dataUrl);
    localStorage.setItem("tkuAikidoClubSeal", dataUrl);
  };

  const clearForm = () => {
    setForm(initialForm);
    setReceiptImages([]);
    setReceiverSignature("");
    setTreasurerSignature("");
    setPresidentSignature("");
    setMessage("");
  };

  const saveRecord = async (status = "draft") => {
    setLoading(true);
    setMessage("");

    try {
      await addDoc(collection(db, "financeRecords"), {
        ...form,
        amount: Number(form.amount || 0),
        amountChinese,
        receiptCount: receiptImages.length,
        hasReceiverSignature: Boolean(receiverSignature),
        hasTreasurerSignature: Boolean(treasurerSignature),
        hasPresidentSignature: Boolean(presidentSignature),
        hasClubSeal: Boolean(clubSeal),
        status,
        createdBy: currentUser?.email || "",
        createdByName: profile?.name || "",
        reviewedBy: "",
        reviewedByName: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        reviewedAt: null,
      });

      setMessage(status === "pending_review" ? "已送出社長審核" : "草稿已儲存");
      fetchRecords();
    } catch (err) {
      console.error("save finance record error:", err);
      setMessage("儲存失敗，請確認 Firestore rules 與 collection 名稱。");
    }

    setLoading(false);
  };

  const updateRecordStatus = async (id, status) => {
    setLoading(true);
    setMessage("");

    try {
      await updateDoc(doc(db, "financeRecords", id), {
        status,
        reviewedBy: currentUser?.email || "",
        reviewedByName: profile?.name || "",
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setMessage(`單據狀態已更新為：${statusLabelMap[status]}`);
      fetchRecords();
    } catch (err) {
      console.error("update finance status error:", err);
      setMessage("狀態更新失敗。");
    }

    setLoading(false);
  };

  const generatePdf = async () => {
    setMessage("");

    if (!pdfRef.current) {
      setMessage("找不到 PDF 模板。");
      return;
    }

    try {
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);

      const safeActivityName = form.activityName || "財務單據";
      const safeDate = form.date || new Date().toISOString().slice(0, 10);
      const fileName = `${safeDate}_${safeActivityName}_${form.expenseType}_${form.amount || 0}元.pdf`;

      pdf.save(fileName);
      setMessage("PDF 已產生並下載。");
    } catch (err) {
      console.error("generate pdf error:", err);
      setMessage("PDF 產生失敗。");
    }
  };

  if (!isFinance) {
    return (
      <AdminLayout>
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-black text-slate-900">沒有權限</h1>
          <p className="mt-4 text-slate-600">
            此頁面只開放社長與財務長使用。
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold tracking-[0.2em] text-amber-700">
            FINANCE MANAGEMENT
          </div>

          <h1 className="mt-3 text-3xl font-black text-slate-900">
            財務證明 / 請款單管理
          </h1>

          <p className="mt-4 leading-8 text-slate-600">
            財務長可在此建立社團支出紀錄、上傳收據 JPG、手寫簽章並產生 PDF。
            社長可審核單據並加上社長簽章與社章。
          </p>

          <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-800">
            第一版功能：先產生 PDF 並下載到電腦，同時儲存財務紀錄到 Firestore。
            下一版可串接 Google Apps Script，自動把 PDF 存入社團 Google Drive。
          </div>

          <form className="mt-8 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  所屬活動
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                  value={form.activityName}
                  onChange={(e) => updateForm("activityName", e.target.value)}
                  placeholder="例如：六度空間-Lazertreks 社遊"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  活動編號
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                  value={form.activityCode}
                  onChange={(e) => updateForm("activityCode", e.target.value)}
                  placeholder="例如：A20260411"
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  費用類別
                </label>
                <select
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                  value={form.expenseType}
                  onChange={(e) => updateForm("expenseType", e.target.value)}
                >
                  {expenseTypeOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  費用編號
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                  value={form.expenseCode}
                  onChange={(e) => updateForm("expenseCode", e.target.value)}
                  placeholder="例如：EXP-20260411-001"
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  領款日期
                </label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                  value={form.date}
                  onChange={(e) => updateForm("date", e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  申請補助
                </label>
                <select
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                  value={form.subsidyType}
                  onChange={(e) => updateForm("subsidyType", e.target.value)}
                >
                  {subsidyTypeOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  金額 NT$
                </label>
                <input
                  type="number"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                  value={form.amount}
                  onChange={(e) => updateForm("amount", e.target.value)}
                  placeholder="例如：320"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  新台幣大寫
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none"
                  value={amountChinese}
                  readOnly
                  placeholder="系統自動產生"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                備註
              </label>
              <textarea
                className="min-h-[90px] w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                value={form.note}
                onChange={(e) => updateForm("note", e.target.value)}
                placeholder="可填寫補充說明"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xl font-black text-slate-900">
                領款人資料
              </h2>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    領款人姓名
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                    value={form.receiverName}
                    onChange={(e) => updateForm("receiverName", e.target.value)}
                    placeholder="請輸入領款人"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    身分別
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                    value={form.receiverType}
                    onChange={(e) => updateForm("receiverType", e.target.value)}
                  >
                    {receiverTypeOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {form.receiverType === "非社員" ? (
                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    非社員說明
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                    value={form.nonMemberNote}
                    onChange={(e) => updateForm("nonMemberNote", e.target.value)}
                    placeholder="例如：講師、校外人員"
                  />
                </div>
              ) : null}

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  學號 / 身分證號
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                  value={form.studentId}
                  onChange={(e) => updateForm("studentId", e.target.value)}
                  placeholder="請輸入學號或身分證號"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                費用明細說明
              </label>
              <textarea
                className="min-h-[100px] w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="例如：六度空間社遊活動費用、印刷費、場地費等"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                上傳發票 / 收據 JPG
              </label>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleReceiptUpload}
                className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              {receiptImages.length > 0 ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {receiptImages.map((item, index) => (
                    <div key={index} className="rounded-xl border border-slate-200 p-2">
                      <img
                        src={item}
                        alt={`收據 ${index + 1}`}
                        className="h-36 w-full rounded-lg object-contain"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <SignaturePad
              label="領款人簽章"
              value={receiverSignature}
              onChange={setReceiverSignature}
            />

            <SignaturePad
              label="經手人 / 財務長簽章"
              value={treasurerSignature}
              onChange={setTreasurerSignature}
            />

            {isPresident ? (
              <>
                <SignaturePad
                  label="社長簽章"
                  value={presidentSignature}
                  onChange={setPresidentSignature}
                />

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    上傳社章 JPG / PNG
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleClubSealUpload}
                    className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  />

                  {clubSeal ? (
                    <div className="mt-4 flex items-center gap-4">
                      <img
                        src={clubSeal}
                        alt="社章"
                        className="h-24 w-24 rounded-xl border border-slate-200 object-contain"
                      />
                      <div className="text-sm text-slate-500">
                        社章已儲存在此瀏覽器，下次產生 PDF 會自動套用。
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}

            {message ? (
              <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {message}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => saveRecord("draft")}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                儲存草稿
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => saveRecord("pending_review")}
                className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-700"
              >
                送出社長審核
              </button>

              <button
                type="button"
                onClick={generatePdf}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                產生 PDF
              </button>

              <button
                type="button"
                onClick={clearForm}
                className="rounded-xl border border-red-300 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                清空表單
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-8">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="text-sm font-semibold tracking-[0.2em] text-amber-700">
              FINANCE RECORDS
            </div>

            <h2 className="mt-3 text-3xl font-black text-slate-900">
              財務單據列表
            </h2>

            {fetching ? (
              <div className="mt-6 text-slate-500">載入中...</div>
            ) : records.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-slate-500">
                目前尚未建立任何財務紀錄。
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {records.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xl font-black text-slate-900">
                          {item.activityName || "未命名活動"}
                        </div>

                        <div className="mt-2 text-sm text-slate-500">
                          {item.expenseType} ｜ NT$ {item.amount || 0}
                        </div>

                        <div className="mt-2 text-sm text-slate-500">
                          領款人：{item.receiverName || "未填寫"}
                        </div>

                        <div className="mt-2 text-sm text-slate-500">
                          建立者：{item.createdByName || item.createdBy || "未知"}
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          statusClassMap[item.status] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {statusLabelMap[item.status] || item.status || "未設定"}
                      </span>
                    </div>

                    {isPresident ? (
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => updateRecordStatus(item.id, "approved")}
                          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                        >
                          核准
                        </button>

                        <button
                          type="button"
                          onClick={() => updateRecordStatus(item.id, "returned")}
                          className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                        >
                          退回修改
                        </button>

                        <button
                          type="button"
                          onClick={() => updateRecordStatus(item.id, "rejected")}
                          className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                        >
                          拒絕
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="text-sm font-semibold tracking-[0.2em] text-amber-700">
              PDF PREVIEW
            </div>

            <h2 className="mt-3 text-3xl font-black text-slate-900">
              PDF 預覽
            </h2>

            <p className="mt-4 leading-8 text-slate-600">
              下方是即將輸出的財務證明版面，排版參考紙本表格設計。
            </p>

            <div className="mt-6 overflow-auto rounded-2xl border border-slate-200 bg-slate-100 p-4">
              <div
                ref={pdfRef}
                style={{
                  transform: "scale(0.65)",
                  transformOrigin: "top left",
                  width: "794px",
                  height: "1123px",
                }}
              >
                <FinancePdfTemplate
                  form={form}
                  amountChinese={amountChinese}
                  receipts={receiptImages}
                  receiverSignature={receiverSignature}
                  treasurerSignature={treasurerSignature}
                  presidentSignature={presidentSignature}
                  clubSeal={clubSeal}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}