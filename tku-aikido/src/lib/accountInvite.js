import { getApp, getApps, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import "./firebase";

/**
 * 幫幹部開通登入帳號：
 * 1. 用這個 Email 建立 Firebase 登入帳號（密碼是隨機的，沒有人知道）
 * 2. 寄一封「設定密碼」信給對方，對方點連結自己設定密碼
 *
 * 用另一個 Firebase App 實例來建立帳號，社長自己的登入狀態不會被切換。
 * 如果這個 Email 已經有帳號，就只重寄設定密碼信。
 */

function inviteAuth() {
  const app =
    getApps().find((item) => item.name === "account-invite") ||
    initializeApp(getApp().options, "account-invite");
  return getAuth(app);
}

function randomPassword() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("") + "!Aa1";
}

export async function inviteAccount(email) {
  const auth = inviteAuth();
  const target = email.trim().toLowerCase();
  let created = false;

  try {
    await createUserWithEmailAndPassword(auth, target, randomPassword());
    created = true;
  } catch (err) {
    if (err?.code !== "auth/email-already-in-use") throw err;
  } finally {
    await signOut(auth).catch(() => {});
  }

  // 設定完密碼後，信裡的「繼續」按鈕會回到後台登入頁；網域未授權時改寄一般版本
  try {
    await sendPasswordResetEmail(auth, target, {
      url: `${window.location.origin}/admin/login`,
    });
  } catch (err) {
    if (!String(err?.code || "").includes("continue-uri")) throw err;
    await sendPasswordResetEmail(auth, target);
  }

  return { created };
}

// 把 Firebase 錯誤代碼轉成看得懂的中文
export function inviteErrorMessage(err) {
  const code = err?.code || "";
  if (code === "auth/invalid-email") return "Email 格式不正確";
  if (code === "auth/operation-not-allowed")
    return "Firebase 尚未啟用「電子郵件/密碼」登入方式，請到 Firebase 主控台開啟";
  if (code === "auth/too-many-requests") return "寄送太頻繁，請稍後再試";
  if (code === "auth/network-request-failed") return "網路連線失敗，請稍後再試";
  return "開通帳號失敗，請稍後再試";
}
