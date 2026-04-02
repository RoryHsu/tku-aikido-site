import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/admin/dashboard");
    } catch (err) {
      console.error("Firebase login error:", err);

      if (err.code === "auth/user-not-found") {
        setError("找不到這個帳號。");
      } else if (err.code === "auth/wrong-password") {
        setError("密碼錯誤。");
      } else if (err.code === "auth/invalid-email") {
        setError("Email 格式不正確。");
      } else if (err.code === "auth/invalid-credential") {
        setError("帳號或密碼錯誤。");
      } else {
        setError(`登入失敗：${err.code}`);
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
          幹部登入
        </h1>

        <p className="mt-3 leading-8 text-slate-300">
          請使用幹部帳號登入後台管理系統。
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
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

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              密碼
            </label>
            <input
              type="password"
              className="w-full rounded-xl bg-slate-700 px-4 py-3 text-white outline-none"
              placeholder="請輸入密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

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
            {loading ? "登入中..." : "登入"}
          </button>

          <div className="text-right">
            <Link
              to="/admin/forgot-password"
              className="text-sm text-slate-300 hover:text-white"
            >
              忘記密碼？
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}