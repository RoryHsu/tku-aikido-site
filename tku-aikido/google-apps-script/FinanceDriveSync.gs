/**
 * 淡江合氣道社｜財務單據自動存到 Google Drive
 *
 * 這支程式部署在社團的 Google 帳號（例如 3019@tkueca.org）底下。
 * 網站產生正式 PDF 後會送到這裡，程式會：
 *   1. 確認送出的人是後台的「社長」或「財務長」
 *   2. 把 PDF 存進「財務單據 / 民國年 / 所屬活動」資料夾（同名檔案會更新成最新版）
 *   3. 在「財務單據總表」試算表新增或更新一列
 *
 * 第一次設定請看專案裡的 google-apps-script/設定說明.md
 */

// ======== 需要填的設定（只有這三行） ========
const ROOT_FOLDER_ID = "";                       // 財務資料夾的 ID（網址 folders/ 後面那串）
const FIREBASE_API_KEY = "AIzaSyCBOSfiMlIYIf56K41wXCScQo8k7zBOE74";
const FIREBASE_PROJECT_ID = "tku-aikido-admin";
// ===========================================

const ALLOWED_ROLES = ["president", "finance"];
const SHEET_NAME = "財務單據總表";
const SHEET_HEADERS = [
  "單據ID", "領款日期", "所屬活動", "活動編號", "費用類別", "費用編號",
  "申請補助", "金額", "金額大寫", "領款人", "身分別", "備註",
  "核准社長", "PDF 連結", "最後上傳時間", "上傳者",
];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const uploader = verifyUploader_(body.idToken);

    if (!body.pdfBase64 || !body.fileName || !body.record || !body.record.id) {
      throw new Error("資料不完整");
    }

    const record = body.record;
    const folder = getRecordFolder_(record);
    const file = savePdf_(folder, body.fileName, body.pdfBase64);
    upsertSheetRow_(record, file, uploader);

    return json_({ ok: true, fileUrl: file.getUrl(), folderUrl: folder.getUrl() });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

// 用網站的登入憑證確認身分：先向 Firebase 驗證，再讀 Firestore 的幹部資料確認職位
function verifyUploader_(idToken) {
  if (!idToken) throw new Error("沒有登入憑證");

  const lookup = UrlFetchApp.fetch(
    "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + FIREBASE_API_KEY,
    {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({ idToken: idToken }),
      muteHttpExceptions: true,
    }
  );
  const lookupData = JSON.parse(lookup.getContentText());
  const user = lookupData.users && lookupData.users[0];
  if (!user || !user.email) throw new Error("登入憑證無效，請重新登入後再試");

  const email = String(user.email).toLowerCase();
  const docUrl =
    "https://firestore.googleapis.com/v1/projects/" + FIREBASE_PROJECT_ID +
    "/databases/(default)/documents/users/" + encodeURIComponent(email);
  const res = UrlFetchApp.fetch(docUrl, {
    headers: { Authorization: "Bearer " + idToken },
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) throw new Error("找不到你的幹部資料");

  const fields = JSON.parse(res.getContentText()).fields || {};
  const role = fields.role && fields.role.stringValue;
  const name = (fields.name && fields.name.stringValue) || email;
  if (ALLOWED_ROLES.indexOf(role) === -1) throw new Error("只有社長或財務長可以存檔");

  return { email: email, name: name };
}

// 資料夾結構：財務資料夾 / 115年 / 日本合氣道大會
function getRecordFolder_(record) {
  const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const year = record.date ? (Number(String(record.date).slice(0, 4)) - 1911) + "年" : "未填日期";
  const activity = cleanName_(record.activityName) || "未分類活動";
  return getOrCreateFolder_(getOrCreateFolder_(root, year), activity);
}

function getOrCreateFolder_(parent, name) {
  const found = parent.getFoldersByName(name);
  return found.hasNext() ? found.next() : parent.createFolder(name);
}

// 同一張單據重新產生 PDF 時，舊檔移到垃圾桶，只保留最新版
function savePdf_(folder, fileName, pdfBase64) {
  const safeName = cleanName_(fileName) || "財務單據.pdf";
  const old = folder.getFilesByName(safeName);
  while (old.hasNext()) old.next().setTrashed(true);

  const blob = Utilities.newBlob(Utilities.base64Decode(pdfBase64), "application/pdf", safeName);
  return folder.createFile(blob);
}

function upsertSheetRow_(record, file, uploader) {
  const sheet = getSheet_();
  const row = [
    record.id, record.date, record.activityName, record.activityCode,
    record.expenseType, record.expenseCode, record.subsidyType,
    Number(record.amount) || record.amount, record.amountChinese,
    record.receiverName, record.receiverType, record.note,
    record.reviewedByName, file.getUrl(), new Date(), uploader.name,
  ];

  const ids = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), 1).getValues();
  for (let i = 1; i < ids.length; i++) {
    if (ids[i][0] === record.id) {
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return;
    }
  }
  sheet.appendRow(row);
}

function getSheet_() {
  const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const files = root.getFilesByName(SHEET_NAME);
  let spreadsheet;

  if (files.hasNext()) {
    spreadsheet = SpreadsheetApp.open(files.next());
  } else {
    spreadsheet = SpreadsheetApp.create(SHEET_NAME);
    DriveApp.getFileById(spreadsheet.getId()).moveTo(root);
  }

  const sheet = spreadsheet.getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHEET_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, SHEET_HEADERS.length).setFontWeight("bold");
  }
  return sheet;
}

function cleanName_(text) {
  return String(text || "").replace(/[\\/:*?"<>|]/g, "_").trim();
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// 部署前可以在編輯器執行這個函式，確認資料夾 ID 正確並授權存取 Drive
function testSetup() {
  const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
  getSheet_();
  Logger.log("設定正確，資料夾：" + root.getName());
}
