import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
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
  pending_receiver_signature: "待領款人簽名",
  pending_treasurer_signature: "待財務長 / 經手人簽名",
  pending_president_review: "待社長簽名審核",
  approved: "已完成",
  returned: "退回修改",
  rejected: "已拒絕",
};

const statusClassMap = {
  draft: "bg-slate-100 text-slate-700",
  pending_receiver_signature: "bg-blue-100 text-blue-700",
  pending_treasurer_signature: "bg-purple-100 text-purple-700",
  pending_president_review: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  returned: "bg-orange-100 text-orange-700",
  rejected: "bg-red-100 text-red-700",
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

const pdfLabelCell = {
  border: "1px solid #111",
  background: "#f0f0f0",
  fontWeight: "700",
  textAlign: "center",
  padding: "7px",
  width: "16%",
};

const pdfValueCell = {
  border: "1px solid #111",
  padding: "7px",
  minHeight: "30px",
};

const pdfSignatureCell = {
  border: "1px solid #111",
  padding: "8px",
  verticalAlign: "top",
};

function toTaiwanYear(dateString) {
  if (!dateString) return { year: "", month: "", day: "" };

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return { year: "", month: "", day: "" };

  return {
    year: String(date.getFullYear() - 1911),
    month: String(date.getMonth() + 1).padStart(2, "0"),
    day: String(date.getDate()).padStart(2, "0"),
  };
}

function numberToChineseAmount(inputAmount) {
  const amount = Number(inputAmount);
  if (!Number.isFinite(amount) || amount <= 0) return "";

  const num = Math.floor(amount);
  if (num === 0) return "零元整";

  const digitMap = ["零", "壹", "貳", "參", "肆", "伍", "陸", "柒", "捌", "玖"];
  const unitMap = ["", "拾", "佰", "仟"];
  const sectionUnitMap = ["", "萬", "億"];

  function sectionToChinese(section) {
    let result = "";
    let zeroFlag = false;

    for (let i = 0; i < 4; i += 1) {
      const digit = section % 10;

      if (digit === 0) {
        if (result !== "") zeroFlag = true;
      } else {
        if (zeroFlag) {
          result = digitMap[0] + result;
          zeroFlag = false;
        }

        result = digitMap[digit] + unitMap[i] + result;
      }

      section = Math.floor(section / 10);
    }

    return result;
  }

  let result = "";
  let sectionIndex = 0;
  let rest = num;
  let needZero = false;

  while (rest > 0) {
    const section = rest % 10000;

    if (section === 0) {
      needZero = true;
    } else {
      const sectionText = sectionToChinese(section);

      if (needZero && result !== "") {
        result = digitMap[0] + result;
      }

      result = sectionText + sectionUnitMap[sectionIndex] + result;
      needZero = section < 1000;
    }

    rest = Math.floor(rest / 10000);
    sectionIndex += 1;
  }

  result = result.replace(/^零+/, "");
  result = result.replace(/零+/g, "零");
  result = result.replace(/零$/g, "");

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

function createSignatureToken() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function PdfCheckbox({ checked, label }) {
  return (
    <span style={{ marginRight: "14px", whiteSpace: "nowrap" }}>
      <span
        style={{
          display: "inline-block",
          width: "15px",
          fontWeight: "700",
          fontSize: "14px",
        }}
      >
        {checked ? "■" : "□"}
      </span>
      <span>{label}</span>
    </span>
  );
}

function SignatureProgress({ item }) {
  const Badge = ({ done, label }) => (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
        done ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      {label}：{done ? "已簽" : "未簽"}
    </span>
  );

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Badge done={item.hasReceiverSignature} label="領款人" />
      <Badge done={item.hasTreasurerSignature} label="財務長" />
      <Badge done={item.hasPresidentSignature} label="社長" />
    </div>
  );
}

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
          className="h-36 w-full touch-none rounded-lg bg-white"
          style={{
            touchAction: "none",
            overscrollBehavior: "contain",
          }}
        />
      </div>

      <p className="mt-2 text-xs leading-6 text-slate-400">
        手機簽名時，簽名框內已鎖定滑動。請直接在白色區域內簽名。
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
        height: "1123px",
        boxSizing: "border-box",
        padding: "32px 42px",
        overflow: "hidden",
        fontFamily:
          '"Noto Sans TC", "Microsoft JhengHei", "PingFang TC", Arial, sans-serif',
      }}
    >
      <div className="mb-2 text-center">
        <div style={{ fontSize: "16px", fontWeight: "700", letterSpacing: "2px" }}>
          淡江大學合氣道社－財務證明
        </div>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
          border: "2px solid #111",
          fontSize: "13px",
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
                fontSize: "17px",
                fontWeight: "700",
                padding: "9px",
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
                <PdfCheckbox
                  key={item}
                  checked={form.expenseType === item}
                  label={item}
                />
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
                <div key={item} style={{ marginBottom: "3px" }}>
                  <PdfCheckbox checked={form.subsidyType === item} label={item} />
                </div>
              ))}
            </td>
          </tr>

          <tr>
            <td style={pdfLabelCell}>備註</td>
            <td
              colSpan="5"
              style={{
                ...pdfValueCell,
                height: "78px",
                verticalAlign: "top",
              }}
            >
              {form.note || ""}
            </td>
          </tr>

          <tr>
            <td colSpan="2" style={pdfLabelCell}>
              新台幣（大寫）
            </td>
            <td
              colSpan="2"
              style={{
                ...pdfValueCell,
                textAlign: "center",
                fontWeight: "700",
              }}
            >
              {amountChinese}
            </td>
            <td style={pdfLabelCell}>NT$</td>
            <td style={{ ...pdfValueCell, fontWeight: "700" }}>
              {form.amount || ""}
            </td>
          </tr>

          <tr>
            <td
              colSpan="6"
              style={{
                border: "1px solid #111",
                height: "155px",
                padding: "12px",
                verticalAlign: "top",
              }}
            >
              <div style={{ marginBottom: "8px", fontWeight: "700" }}>
                上款已照數領訖　此據
              </div>

              <div style={{ marginBottom: "8px" }}>淡江大學合氣道社台照</div>

              <div style={{ marginLeft: "300px", lineHeight: "29px" }}>
                <div>
                  ◆ 領款人簽章：
                  {receiverSignature ? (
                    <img
                      src={receiverSignature}
                      alt="領款人簽章"
                      style={{
                        width: "145px",
                        height: "40px",
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
                    <PdfCheckbox
                      checked={form.receiverType === "淡江合氣道社員"}
                      label="淡江合氣道社員"
                    />
                  </span>

                  <span style={{ marginLeft: "12px" }}>
                    <PdfCheckbox
                      checked={form.receiverType === "非社員"}
                      label={`非社員：${form.nonMemberNote || "______"}`}
                    />
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
                height: "330px",
                padding: "10px",
                verticalAlign: "top",
              }}
            >
              <div style={{ fontWeight: "700", marginBottom: "6px" }}>
                費用明細及收據黏貼處（浮貼）
              </div>

              <div style={{ fontSize: "12px", marginBottom: "8px" }}>
                ※ 申請校補助之款項請貼收據影本；社費支出之款項請貼正本收據
              </div>

              <div
                style={{
                  border: "1px dashed #777",
                  height: "270px",
                  padding: "8px",
                  display: "grid",
                  gridTemplateColumns: receipts.length >= 2 ? "1fr 1fr" : "1fr",
                  gap: "8px",
                  boxSizing: "border-box",
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
                        minHeight: "118px",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={receipt}
                        alt={`收據 ${index + 1}`}
                        style={{
                          maxWidth: "100%",
                          maxHeight: receipts.length >= 2 ? "118px" : "250px",
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
                      height: "250px",
                    }}
                  >
                    收據 / 發票 JPG 黏貼處
                  </div>
                )}
              </div>
            </td>
          </tr>

          <tr>
            <td colSpan="2" style={{ ...pdfSignatureCell, height: "92px" }}>
              <div style={{ fontWeight: "700" }}>經手人（財務長）簽章：</div>
              {treasurerSignature ? (
                <img
                  src={treasurerSignature}
                  alt="財務長簽章"
                  style={{
                    width: "170px",
                    height: "56px",
                    objectFit: "contain",
                    marginTop: "5px",
                  }}
                />
              ) : null}
            </td>

            <td colSpan="3" style={{ ...pdfSignatureCell, height: "92px" }}>
              <div style={{ fontWeight: "700" }}>社長簽章：</div>
              {presidentSignature ? (
                <img
                  src={presidentSignature}
                  alt="社長簽章"
                  style={{
                    width: "170px",
                    height: "56px",
                    objectFit: "contain",
                    marginTop: "5px",
                  }}
                />
              ) : null}
            </td>

            <td style={{ ...pdfSignatureCell, height: "92px" }}>
              <div style={{ fontWeight: "700" }}>社章</div>
              {clubSeal ? (
                <img
                  src={clubSeal}
                  alt="社章"
                  style={{
                    width: "66px",
                    height: "66px",
                    objectFit: "contain",
                    marginTop: "3px",
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

export default function FinancePage() {
  const { currentUser, profile } = useAuth();
  const pdfRef = useRef(null);

  const [currentRecordId, setCurrentRecordId] = useState("");
  const [currentStatus, setCurrentStatus] = useState("");
  const [form, setForm] = useState(initialForm);
  const [records, setRecords] = useState([]);
  const [receiptImages, setReceiptImages] = useState([]);
  const [receiverSignature, setReceiverSignature] = useState("");
  const [treasurerSignature, setTreasurerSignature] = useState("");
  const [presidentSignature, setPresidentSignature] = useState("");
  const [clubSeal, setClubSeal] = useState("");
  const [receiverSignatureToken, setReceiverSignatureToken] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState("");
  const [pendingPdfRecordId, setPendingPdfRecordId] = useState("");

  const role = profile?.role || "";
  const isPresident = role === "president";
  const isFinanceRole = role === "finance";
  const isFinance = role === "finance" || role === "president";

  const amountChinese = useMemo(() => {
    return numberToChineseAmount(form.amount);
  }, [form.amount]);

  const hasReceiverSigned = Boolean(receiverSignature);
  const isReturned = currentStatus === "returned";

  const formLocked =
    !isReturned &&
    (hasReceiverSigned ||
      currentStatus === "pending_treasurer_signature" ||
      currentStatus === "pending_president_review" ||
      currentStatus === "approved");

  const canGeneratePdf =
    currentStatus === "approved" &&
    receiverSignature?.startsWith("data:image/") &&
    treasurerSignature?.startsWith("data:image/") &&
    presidentSignature?.startsWith("data:image/");

  useEffect(() => {
    fetchClubSeal();
    fetchRecords();
  }, []);

  useEffect(() => {
    if (!pendingPdfRecordId) return;
    if (currentRecordId !== pendingPdfRecordId) return;
    if (currentStatus !== "approved") return;

    const timer = setTimeout(() => {
      generatePdf();
      setPendingPdfRecordId("");
    }, 300);

    return () => clearTimeout(timer);
  }, [pendingPdfRecordId, currentRecordId, currentStatus, form, receiptImages]);

  const fetchClubSeal = async () => {
    try {
      const ref = doc(db, "clubSettings", "main");
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setClubSeal(data.clubSeal || "");
      }
    } catch (error) {
      console.error("fetch club seal error:", error);
      setMessage("讀取社章失敗，PDF 可能暫時無法自動套用社章。");
    }
  };

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
    if (formLocked) {
      setMessage("領款人簽名後，單據內容已鎖定，不能再修改收據。");
      return;
    }

    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const imageUrls = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      const dataUrl = await readFileAsDataUrl(file);
      imageUrls.push(dataUrl);
    }

    setReceiptImages((prev) => [...prev, ...imageUrls]);
    event.target.value = "";
  };

  const removeReceiptImage = (indexToRemove) => {
    if (formLocked) {
      setMessage("領款人簽名後，單據內容已鎖定，不能刪除收據。");
      return;
    }

    setReceiptImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const clearForm = () => {
    setCurrentRecordId("");
    setCurrentStatus("");
    setReceiverSignatureToken("");
    setForm(initialForm);
    setReceiptImages([]);
    setReceiverSignature("");
    setTreasurerSignature("");
    setPresidentSignature("");
    setDeleteConfirmId("");
    setPendingPdfRecordId("");
    setMessage("");
  };

  const buildRecordPayload = (status, token) => ({
    ...form,
    amount: Number(form.amount || 0),
    amountChinese,
    receiptImages,
    receiverSignature,
    treasurerSignature,
    presidentSignature,
    hasReceiverSignature: Boolean(receiverSignature),
    hasTreasurerSignature: Boolean(treasurerSignature),
    hasPresidentSignature: Boolean(presidentSignature),
    hasClubSeal: Boolean(clubSeal),
    receiverSignatureToken: token || receiverSignatureToken || "",
    receiverSignedAt: receiverSignature ? serverTimestamp() : null,
    status,
    createdBy: currentUser?.email || "",
    createdByName: profile?.name || "",
    updatedAt: serverTimestamp(),
  });

  const saveRecord = async (status = "draft") => {
    setLoading(true);
    setMessage("");
    setDeleteConfirmId("");

    try {
      const isCreatingReceiverSignatureRequest =
        status === "pending_receiver_signature";

      let nextToken = receiverSignatureToken;

      if (isCreatingReceiverSignatureRequest) {
        nextToken = createSignatureToken();
      }

      const basePayload = buildRecordPayload(status, nextToken);

      const payload = isCreatingReceiverSignatureRequest
        ? {
            ...basePayload,
            receiverSignature: "",
            treasurerSignature: "",
            presidentSignature: "",
            hasReceiverSignature: false,
            hasTreasurerSignature: false,
            hasPresidentSignature: false,
            receiverSignedAt: null,
            reviewedBy: "",
            reviewedByName: "",
            reviewedAt: null,
            receiverSignatureToken: nextToken,
            status: "pending_receiver_signature",
          }
        : basePayload;

      if (currentRecordId) {
        await updateDoc(doc(db, "financeRecords", currentRecordId), {
          ...payload,
        });

        setCurrentStatus(status);
        setReceiverSignatureToken(nextToken);
      } else {
        const docRef = await addDoc(collection(db, "financeRecords"), {
          ...payload,
          createdAt: serverTimestamp(),
          reviewedBy: "",
          reviewedByName: "",
          reviewedAt: null,
        });

        setCurrentRecordId(docRef.id);
        setCurrentStatus(status);
        setReceiverSignatureToken(nextToken);
      }

      if (isCreatingReceiverSignatureRequest) {
        setReceiverSignature("");
        setTreasurerSignature("");
        setPresidentSignature("");

        setMessage(
          currentStatus === "returned"
            ? "已重新建立領款人簽名連結。舊簽名已清空，請將新連結傳給領款人重新簽名。"
            : "已建立領款人簽名連結，請到右側列表複製連結給領款人。"
        );
      } else {
        setMessage("單據已儲存。");
      }

      fetchRecords();
    } catch (err) {
      console.error("save finance record error:", err);
      setMessage("儲存失敗，請確認 Firestore rules 與 collection 名稱。");
    }

    setLoading(false);
  };

  const loadRecordToForm = (record) => {
    setCurrentRecordId(record.id);
    setCurrentStatus(record.status || "");
    setReceiverSignatureToken(record.receiverSignatureToken || "");
    setDeleteConfirmId("");

    setForm({
      activityName: record.activityName || "",
      activityCode: record.activityCode || "",
      expenseType: record.expenseType || "活動費",
      expenseCode: record.expenseCode || "",
      date: record.date || "",
      subsidyType: record.subsidyType || "社費支出",
      note: record.note || "",
      amount: record.amount ? String(record.amount) : "",
      receiverName: record.receiverName || "",
      receiverType: record.receiverType || "淡江合氣道社員",
      nonMemberNote: record.nonMemberNote || "",
      studentId: record.studentId || "",
      description: record.description || "",
    });

    setReceiptImages(record.receiptImages || []);
    setReceiverSignature(record.receiverSignature || "");
    setTreasurerSignature(record.treasurerSignature || "");
    setPresidentSignature(record.presidentSignature || "");

    if (record.status === "approved") {
      setMessage("已載入已完成單據。可以產生正式 PDF。");
    } else if (isPresident && record.status === "pending_president_review") {
      setMessage("已載入待社長審核單據。請確認內容、完成社長簽章，然後按「社長簽名並核准」。");
    } else {
      setMessage("已載入單據。");
    }
  };

  const generatePdfFromRecord = (record) => {
    if (!record || record.status !== "approved") {
      setMessage("此單據尚未完成，不能直接產生 PDF。");
      return;
    }

    loadRecordToForm(record);
    setPendingPdfRecordId(record.id);
    setMessage("正在準備 PDF，請稍候...");
  };

  const resubmitReturnedRecordWithoutReceiverResign = async () => {
    if (!currentRecordId) {
      setMessage("請先從右側列表載入一筆被退回的單據。");
      return;
    }

    if (currentStatus !== "returned") {
      setMessage("只有被社長退回的單據，才能使用此功能。");
      return;
    }

    if (!receiverSignature) {
      setMessage("此單據沒有領款人簽名，不能保留簽名送回流程。請重新建立領款人簽名連結。");
      return;
    }

    setLoading(true);
    setMessage("");
    setDeleteConfirmId("");

    try {
      await updateDoc(doc(db, "financeRecords", currentRecordId), {
        ...form,
        amount: Number(form.amount || 0),
        amountChinese,
        receiptImages,
        receiverSignature,
        hasReceiverSignature: true,
        treasurerSignature: "",
        presidentSignature: "",
        hasTreasurerSignature: false,
        hasPresidentSignature: false,
        reviewedBy: "",
        reviewedByName: "",
        reviewedAt: null,
        status: "pending_treasurer_signature",
        updatedAt: serverTimestamp(),
      });

      setTreasurerSignature("");
      setPresidentSignature("");
      setCurrentStatus("pending_treasurer_signature");

      setMessage("已保留領款人簽名並送回財務長 / 經手人簽名階段。請財務長重新簽章後再送社長審核。");

      fetchRecords();
    } catch (err) {
      console.error("resubmit returned record error:", err);
      setMessage("送回財務長簽名階段失敗。");
    }

    setLoading(false);
  };

  const submitTreasurerSignature = async () => {
    if (!currentRecordId) {
      setMessage("請先從右側列表載入一筆單據。");
      return;
    }

    if (!receiverSignature) {
      setMessage("領款人尚未簽名，不能進入財務長簽名階段。");
      return;
    }

    if (!treasurerSignature) {
      setMessage("請先完成財務長 / 經手人簽章。");
      return;
    }

    setLoading(true);
    setMessage("");
    setDeleteConfirmId("");

    try {
      await updateDoc(doc(db, "financeRecords", currentRecordId), {
        treasurerSignature,
        hasTreasurerSignature: true,
        status: "pending_president_review",
        updatedAt: serverTimestamp(),
      });

      setCurrentStatus("pending_president_review");
      setMessage("財務長簽名已完成，已送出社長簽名審核。");
      fetchRecords();
    } catch (err) {
      console.error("submit treasurer signature error:", err);
      setMessage("送出社長審核失敗。");
    }

    setLoading(false);
  };

  const approveByPresident = async () => {
    if (!currentRecordId) {
      setMessage("請先從右側列表載入一筆單據。");
      return;
    }

    if (!receiverSignature || !treasurerSignature) {
      setMessage("領款人與財務長簽章尚未完整，不能核准。");
      return;
    }

    if (!presidentSignature) {
      setMessage("請先完成社長簽章。");
      return;
    }

    if (!clubSeal) {
      setMessage("尚未設定社章。請先到社章設定頁上傳社章。");
      return;
    }

    setLoading(true);
    setMessage("");
    setDeleteConfirmId("");

    try {
      await updateDoc(doc(db, "financeRecords", currentRecordId), {
        presidentSignature,
        hasPresidentSignature: true,
        hasClubSeal: true,
        status: "approved",
        reviewedBy: currentUser?.email || "",
        reviewedByName: profile?.name || "",
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setCurrentStatus("approved");
      setMessage("社長已核准，現在可以產生正式 PDF。");
      fetchRecords();
    } catch (err) {
      console.error("approve finance record error:", err);
      setMessage("社長核准失敗。");
    }

    setLoading(false);
  };

  const updateRecordStatus = async (id, status) => {
    setLoading(true);
    setMessage("");
    setDeleteConfirmId("");

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

  const deleteFinanceRecord = async (recordId) => {
    if (!recordId) return;

    if (deleteConfirmId !== recordId) {
      setDeleteConfirmId(recordId);
      setMessage("請再次點擊「確認刪除此單據」，才會真正刪除。");
      return;
    }

    const finalConfirm = window.confirm(
      "最後確認：此操作會永久刪除此財務單據，刪除後無法復原。確定要刪除嗎？"
    );

    if (!finalConfirm) {
      setDeleteConfirmId("");
      setMessage("已取消刪除。");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await deleteDoc(doc(db, "financeRecords", recordId));

      if (currentRecordId === recordId) {
        clearForm();
      }

      setDeleteConfirmId("");
      setMessage("單據已刪除。");
      fetchRecords();
    } catch (err) {
      console.error("delete finance record error:", err);
      setMessage("刪除失敗，請確認 Firestore rules 是否允許刪除 financeRecords。");
    }

    setLoading(false);
  };

  const generatePdf = async () => {
    setMessage("");
    setDeleteConfirmId("");

    if (!canGeneratePdf) {
      setMessage("流程尚未完成。必須完成領款人簽名、財務長 / 經手人簽名、社長簽名並核准後，才能產生正式 PDF。");
      return;
    }

    if (!clubSeal) {
      setMessage("尚未設定社章，不能產生正式 PDF。");
      return;
    }

    if (!pdfRef.current) {
      setMessage("找不到 PDF 模板。");
      return;
    }

    try {
      const canvas = await html2canvas(pdfRef.current, {
        scale: 1.35,
        backgroundColor: "#ffffff",
        useCORS: true,
        width: 794,
        height: 1123,
        windowWidth: 794,
        windowHeight: 1123,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.82);

      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(
        imgData,
        "JPEG",
        0,
        0,
        pageWidth,
        pageHeight,
        undefined,
        "FAST"
      );

      const safeActivityName = form.activityName || "財務單據";
      const safeDate = form.date || new Date().toISOString().slice(0, 10);
      const fileName = `${safeDate}_${safeActivityName}_${form.expenseType}_${form.amount || 0}元.pdf`;

      pdf.save(fileName);
      setMessage("正式 PDF 已產生並下載。");
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
            領款收據 / 財務證明管理
          </h1>

          <p className="mt-4 leading-8 text-slate-600">
            流程：財務長建單 → 領款人線上簽名 → 財務長 / 經手人簽名 →
            社長簽名審核 → 自動套用社章 → 產生正式 PDF。
          </p>

          {currentRecordId ? (
            <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
              目前載入單據 ID：
              <span className="font-semibold">{currentRecordId}</span>
              <br />
              狀態：
              <span className="font-semibold">
                {statusLabelMap[currentStatus] || currentStatus || "未設定"}
              </span>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-800">
              先填好資料並建立領款人簽名連結。領款人簽完後，資料會自動進入「待財務長簽名」。
            </div>
          )}

          {isPresident && currentStatus === "pending_president_review" ? (
            <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-700">
              此單據正在等待社長簽名審核。請確認左側資料與右側 PDF 預覽無誤後，在社長簽章區簽名，然後按「社長簽名並核准」。
            </div>
          ) : null}

          {currentStatus === "approved" ? (
            <div className="mt-4 rounded-2xl bg-green-50 px-4 py-4 text-sm leading-7 text-green-700">
              此單據已完成簽核。現在只可產生正式 PDF。
              {isFinanceRole ? " 財務長也可以刪除此單據。" : ""}
            </div>
          ) : null}

          {currentStatus === "returned" ? (
            <div className="mt-4 rounded-2xl bg-orange-50 px-4 py-4 text-sm leading-7 text-orange-700">
              此單據已被社長退回。你可以直接修改原本資料，不需要重新建立整張單據。
              若只是備註、活動編號或小錯字，可保留領款人簽名並送回財務長確認；
              若修改金額、領款人、收據或重要內容，建議重新建立領款人簽名連結。
            </div>
          ) : formLocked && currentStatus !== "approved" ? (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-4 text-sm leading-7 text-red-700">
              領款人已簽名，主要單據內容已鎖定。若需修改，請由社長退回後再選擇是否重新建立領款人簽名連結。
            </div>
          ) : null}

          <form className="mt-8 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  所屬活動
                </label>
                <input
                  disabled={formLocked}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none disabled:bg-slate-100"
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
                  disabled={formLocked}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none disabled:bg-slate-100"
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
                  disabled={formLocked}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none disabled:bg-slate-100"
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
                  disabled={formLocked}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none disabled:bg-slate-100"
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
                  disabled={formLocked}
                  type="date"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none disabled:bg-slate-100"
                  value={form.date}
                  onChange={(e) => updateForm("date", e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  申請補助
                </label>
                <select
                  disabled={formLocked}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none disabled:bg-slate-100"
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
                  disabled={formLocked}
                  type="number"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none disabled:bg-slate-100"
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
                disabled={formLocked}
                className="min-h-[90px] w-full rounded-xl border border-slate-300 px-4 py-3 outline-none disabled:bg-slate-100"
                value={form.note}
                onChange={(e) => updateForm("note", e.target.value)}
                placeholder="可填寫補充說明"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xl font-black text-slate-900">領款人資料</h2>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    領款人姓名
                  </label>
                  <input
                    disabled={formLocked}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none disabled:bg-slate-100"
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
                    disabled={formLocked}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none disabled:bg-slate-100"
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
                    disabled={formLocked}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none disabled:bg-slate-100"
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
                  disabled={formLocked}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none disabled:bg-slate-100"
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
                disabled={formLocked}
                className="min-h-[100px] w-full rounded-xl border border-slate-300 px-4 py-3 outline-none disabled:bg-slate-100"
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="例如：六度空間社遊活動費用、印刷費、場地費等"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="block text-sm font-semibold text-slate-700">
                  上傳發票 / 收據 JPG
                </label>

                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  已上傳 {receiptImages.length} 張
                </div>
              </div>

              <input
                disabled={formLocked}
                type="file"
                accept="image/*"
                multiple
                onChange={handleReceiptUpload}
                className="mt-3 block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm disabled:bg-slate-100"
              />

              <p className="mt-2 text-xs leading-6 text-slate-400">
                可一次選擇多張圖片。Windows 可按住 Ctrl 選多張；也可以分批上傳，系統會自動累加。
              </p>

              {receiptImages.length > 0 ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {receiptImages.map((item, index) => (
                    <div
                      key={`${item.slice(0, 30)}-${index}`}
                      className="relative rounded-xl border border-slate-200 bg-slate-50 p-2"
                    >
                      {!formLocked ? (
                        <button
                          type="button"
                          onClick={() => removeReceiptImage(index)}
                          className="absolute right-2 top-2 rounded-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white shadow hover:bg-red-700"
                        >
                          刪除
                        </button>
                      ) : null}

                      <img
                        src={item}
                        alt={`收據 ${index + 1}`}
                        className="h-40 w-full rounded-lg bg-white object-contain"
                      />

                      <div className="mt-2 text-center text-xs font-semibold text-slate-500">
                        收據 / 發票 {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                  尚未上傳收據或發票。
                </div>
              )}
            </div>

            {currentStatus === "pending_treasurer_signature" ||
            currentStatus === "pending_president_review" ||
            currentStatus === "approved" ? (
              <SignaturePad
                label="經手人 / 財務長簽章"
                value={treasurerSignature}
                onChange={setTreasurerSignature}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-7 text-slate-500">
                領款人尚未完成線上簽名前，財務長 / 經手人簽章區會先鎖定。
              </div>
            )}

            {isPresident ? (
              <>
                {currentStatus === "pending_president_review" ||
                currentStatus === "approved" ? (
                  <SignaturePad
                    label="社長簽章"
                    value={presidentSignature}
                    onChange={setPresidentSignature}
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-7 text-slate-500">
                    單據尚未送到社長審核階段，社長簽章區會先鎖定。
                  </div>
                )}
              </>
            ) : null}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="text-sm font-semibold text-slate-700">
                社章套用狀態
              </div>

              {clubSeal ? (
                <div className="mt-4 flex items-center gap-4">
                  <img
                    src={clubSeal}
                    alt="社章"
                    className="h-20 w-20 rounded-xl border border-slate-200 bg-white object-contain p-2"
                  />
                  <div className="text-sm leading-7 text-slate-500">
                    已讀取社長設定的社章。核准後產生 PDF 時，會自動套用在「社章」欄位。
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-sm leading-7 text-red-600">
                  尚未設定社章。請社長先到「社章設定」頁上傳社章。
                </div>
              )}
            </div>

            {message ? (
              <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {message}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              {!formLocked ? (
                <>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => saveRecord("draft")}
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    儲存草稿
                  </button>

                  {currentStatus === "returned" && receiverSignature ? (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={resubmitReturnedRecordWithoutReceiverResign}
                      className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-700"
                    >
                      保留領款人簽名，送回財務長確認
                    </button>
                  ) : null}

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => saveRecord("pending_receiver_signature")}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    {currentStatus === "returned"
                      ? "重新建立領款人簽名連結"
                      : "建立領款人簽名連結"}
                  </button>
                </>
              ) : null}

              {currentStatus === "pending_treasurer_signature" ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={submitTreasurerSignature}
                  className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-700"
                >
                  財務長簽名完成，送出社長審核
                </button>
              ) : null}

              {isPresident && currentStatus === "pending_president_review" ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={approveByPresident}
                  className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700"
                >
                  社長簽名並核准
                </button>
              ) : null}

              <button
                type="button"
                disabled={!canGeneratePdf || !clubSeal}
                onClick={generatePdf}
                className={`rounded-xl px-5 py-3 text-sm font-semibold ${
                  canGeneratePdf && clubSeal
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "cursor-not-allowed bg-slate-300 text-slate-500"
                }`}
              >
                產生正式 PDF
              </button>

              {currentStatus !== "approved" ? (
                <button
                  type="button"
                  onClick={clearForm}
                  className="rounded-xl border border-red-300 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  清空表單
                </button>
              ) : null}
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

                        <SignatureProgress item={item} />
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          statusClassMap[item.status] ||
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {statusLabelMap[item.status] || item.status || "未設定"}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      {item.status === "approved" ? (
                        <>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => generatePdfFromRecord(item)}
                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                          >
                            產生 PDF
                          </button>

                          {isFinanceRole ? (
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => deleteFinanceRecord(item.id)}
                              className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
                                deleteConfirmId === item.id
                                  ? "bg-red-700 hover:bg-red-800"
                                  : "bg-red-500 hover:bg-red-600"
                              }`}
                            >
                              {deleteConfirmId === item.id
                                ? "確認刪除此單據"
                                : "刪除此單據"}
                            </button>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => loadRecordToForm(item)}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                              isPresident && item.status === "pending_president_review"
                                ? "bg-slate-900 text-white hover:bg-slate-800"
                                : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {isPresident && item.status === "pending_president_review"
                              ? "確認並簽名"
                              : "載入單據 / 簽名 / 產生 PDF"}
                          </button>

                          {!isPresident &&
                          item.receiverSignatureToken &&
                          item.status === "pending_receiver_signature" ? (
                            <button
                              type="button"
                              onClick={() => {
                                const link = `${window.location.origin}/finance/sign/${item.id}?token=${item.receiverSignatureToken}`;
                                navigator.clipboard.writeText(link);
                                setMessage("已複製領款人簽名連結，可傳給對方簽名。");
                              }}
                              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                              複製領款人簽名連結
                            </button>
                          ) : null}
                        </>
                      )}
                    </div>

                    {isPresident && item.status !== "approved" ? (
                      <div className="mt-4 flex flex-wrap gap-3">
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
              下方是即將輸出的財務證明版面。必須完成完整簽核流程後，才能產生正式 PDF。
            </p>

            <div className="mt-6 overflow-auto rounded-2xl border border-slate-200 bg-slate-100 p-4">
              <div
                style={{
                  transform: "scale(0.65)",
                  transformOrigin: "top left",
                  width: "794px",
                  height: "760px",
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

            <div
              style={{
                position: "fixed",
                left: "-99999px",
                top: 0,
                width: "794px",
                height: "1123px",
                background: "#ffffff",
                zIndex: -1,
                overflow: "hidden",
              }}
            >
              <div ref={pdfRef}>
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