import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { previewRoleOptions } from "./adminMenu";

// 只有開發者看得到：切換成其他職位，測試該職位看到的畫面與權限
export default function DeveloperRoleSwitcher() {
  const { profile, setPreviewRole } = useAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);

  const handleChange = async (e) => {
    setSwitching(true);
    try {
      await setPreviewRole(e.target.value);
      navigate("/admin/dashboard");
    } catch (err) {
      console.error("switch preview role error:", err);
      window.alert(`切換失敗（${err.code || err.message}）`);
    }
    setSwitching(false);
  };

  return (
    <label className="flex items-center gap-1.5 rounded-full border border-yellow-300 bg-yellow-50 py-1 pl-3 pr-1 text-xs font-bold text-yellow-800">
      <Eye size={14} className="shrink-0" />
      <span className="hidden md:inline">切換職位</span>
      <select
        value={profile?.previewRole || ""}
        onChange={handleChange}
        disabled={switching}
        className="max-w-[9rem] rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-800 outline-none disabled:opacity-60"
        aria-label="切換預覽職位"
      >
        {previewRoleOptions.map((item) => (
          <option key={item.value || "developer"} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
