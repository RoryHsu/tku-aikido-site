import { auth } from "./firebase";

/**
 * 財務單據自動存到 Google Drive
 *
 * 做法：社團的 Google 帳號部署一支 Apps Script（google-apps-script/FinanceDriveSync.gs），
 * 網站產生正式 PDF 後送過去，由 Apps Script 存進指定的 Drive 資料夾，並更新「財務單據總表」試算表。
 *
 * 部署完 Apps Script 後，把「網頁應用程式」網址貼在下面這一行，就會自動啟用。
 * 留空代表不使用 Drive 同步，網站其他功能照常運作。
 */
export const DRIVE_SYNC_URL = "";

export function isDriveSyncEnabled() {
  return Boolean(DRIVE_SYNC_URL);
}

function pickRecordFields(record) {
  // 學號 / 身分證號不寫進試算表，只留在 PDF 內
  return {
    id: record.id || "",
    date: record.date || "",
    activityName: record.activityName || "",
    activityCode: record.activityCode || "",
    expenseType: record.expenseType || "",
    expenseCode: record.expenseCode || "",
    subsidyType: record.subsidyType || "",
    amount: record.amount || "",
    amountChinese: record.amountChinese || "",
    receiverName: record.receiverName || "",
    receiverType: record.receiverType || "",
    note: record.note || "",
    reviewedByName: record.reviewedByName || "",
  };
}

export async function uploadFinancePdf({ pdfBase64, fileName, record }) {
  if (!auth.currentUser) throw new Error("請先登入");

  // 用登入憑證證明身分，Apps Script 會確認是社長或財務長才收檔
  const idToken = await auth.currentUser.getIdToken();

  // 用 text/plain 送出，Apps Script 才不會被瀏覽器的跨網域檢查擋下
  const response = await fetch(DRIVE_SYNC_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      idToken,
      fileName,
      pdfBase64,
      record: pickRecordFields(record),
    }),
  });

  const result = await response.json().catch(() => null);
  if (!result?.ok) {
    throw new Error(result?.error || "Google Drive 沒有回應");
  }
  return result; // { ok, fileUrl, folderUrl }
}
