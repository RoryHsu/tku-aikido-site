import { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("密碼重設信已寄出，請到信箱查看。");
    } catch (err) {
      console.error("reset password error:", err);

      if (err.code === "auth/user-not-found") {
        setError("找不到這個帳號。");
      } else if (err.code === "auth/invalid-email") {
        setError("Email 格式不正確。");
      } else {
        setError(`寄送失敗：${err.code}`);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-6">
      <div className="w-full max-w-md rounded-3xl bg-slate-800 p-8 shadow-xl">
        <div className="text-sm font-semibold tracking-[0.24em] text-amber-400">
          TKU AIKIDO ADMIN
        </div>

        <h1 className="mt-4 text-3xl font-black text-white">
          忘記密碼
        </h1>

        <p className="mt-3 leading-8 text-slate-300">
          請輸入你的幹部 Email，我們會寄送密碼重設信到你的信箱。
        </p>

        <form onSubmit={handleResetPassword} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-xl bg-slate-700 px-4 py-3 text-white outline-none"
              placeholder="請輸入 Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {message ? (
            <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-500 px-6 py-3 font-semibold text-white transition hover:bg-blue-600"
          >
            {loading ? "寄送中..." : "寄送重設信"}
          </button>

          <Link
            to="/admin/login"
            className="block text-center text-sm text-slate-300 hover:text-white"
          >
            返回登入頁
          </Link>
        </form>
      </div>
    </div>
  );
}