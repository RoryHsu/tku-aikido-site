import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const REMEMBERED_ADMIN_EMAIL_KEY = "tku_aikido_remembered_admin_email";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, currentUser, profile } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberAccount, setRememberAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedEmail = window.localStorage.getItem(
      REMEMBERED_ADMIN_EMAIL_KEY
    );

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberAccount(true);
    }
  }, []);

  useEffect(() => {
    if (currentUser && profile?.role) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [currentUser, profile, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError("請輸入 Email 和密碼。");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await login(trimmedEmail, password);

      if (rememberAccount) {
        window.localStorage.setItem(
          REMEMBERED_ADMIN_EMAIL_KEY,
          trimmedEmail
        );
      } else {
        window.localStorage.removeItem(REMEMBERED_ADMIN_EMAIL_KEY);
      }

      navigate("/admin/dashboard");
    } catch (err) {
      console.error("admin login error:", err);

      if (err?.code === "auth/user-not-found") {
        setError("找不到此 Email 對應的帳號。");
      } else if (err?.code === "auth/wrong-password") {
        setError("密碼錯誤，請重新輸入。");
      } else if (err?.code === "auth/invalid-email") {
        setError("Email 格式不正確。");
      } else if (err?.code === "auth/invalid-credential") {
        setError("登入失敗，請確認 Email 或密碼是否正確。");
      } else if (err?.code === "auth/too-many-requests") {
        setError("嘗試次數過多，請稍後再試。");
      } else {
        setError("登入失敗，請確認 Email 或密碼是否正確。");
      }
    }

    setLoading(false);
  };

  const forgetSavedAccount = () => {
    window.localStorage.removeItem(REMEMBERED_ADMIN_EMAIL_KEY);
    setEmail("");
    setRememberAccount(false);
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] bg-white shadow-sm lg:grid-cols-[1fr_1.1fr]">
          <div className="hidden bg-slate-950 p-10 text-white lg:block">
            <div className="text-sm font-semibold tracking-[0.3em] text-slate-400">
              TKU AIKIDO ADMIN
            </div>

            <h1 className="mt-6 text-4xl font-black leading-tight">
              淡江合氣道社
              <br />
              後台管理系統
            </h1>

            <p className="mt-6 max-w-md leading-8 text-slate-300">
              幹部可在此管理活動公告、媒體資料、社員資料、職位授權與財務證明。
            </p>

            <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-semibold text-slate-300">
                登入提醒
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-400">
                「記住帳號」只會記住目前裝置上的 Email，不會保存密碼，也不會同步給其他幹部。
              </p>
            </div>
          </div>

          <div className="p-8 sm:p-10 lg:p-12">
            <div className="text-sm font-semibold tracking-[0.2em] text-slate-400">
              TKU AIKIDO ADMIN
            </div>

            <h2 className="mt-3 text-3xl font-black text-slate-900">
              幹部登入
            </h2>

            <p className="mt-4 leading-7 text-slate-500">
              請使用已授權的幹部 Email 與密碼登入後台。
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  autoComplete="username"
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  placeholder="請輸入幹部 Email"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  密碼
                </label>

                <input
                  type="password"
                  value={password}
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  placeholder="請輸入密碼"
                  required
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberAccount}
                    onChange={(event) =>
                      setRememberAccount(event.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  記住此裝置上的帳號
                </label>

                <button
                  type="button"
                  onClick={forgetSavedAccount}
                  className="text-sm font-semibold text-slate-500 hover:text-red-600"
                >
                  清除記住帳號
                </button>
              </div>

              <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-700">
                系統只會在此裝置記住 Email，不會記住密碼，也不會寫入資料庫。
                若使用公用電腦，請不要勾選。
              </div>

              {error ? (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {loading ? "登入中..." : "登入後台"}
              </button>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-sm">
                <Link
                  to="/admin/forgot-password"
                  className="font-semibold text-slate-500 hover:text-slate-900"
                >
                  忘記密碼？
                </Link>

                <Link
                  to="/"
                  className="font-semibold text-slate-500 hover:text-slate-900"
                >
                  返回首頁
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}