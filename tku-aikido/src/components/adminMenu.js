import {
  CalendarDays,
  FileText,
  Home,
  Image,
  ShieldCheck,
  Stamp,
  Users,
} from "lucide-react";

// 後台共用設定：側邊欄選單、頂部欄頁面名稱、路由權限都從這裡讀取
export const roleLabelMap = {
  president: "社長",
  vice: "副社長",
  finance: "財務長",
  activity: "活動長",
  pr: "公關",
  alumni: "歷任幹部",
};

// 開發者可以切換成這些職位預覽（"none" 代表還沒被授權職位的帳號）
export const previewRoleOptions = [
  { value: "", label: "開發者（全部功能）" },
  { value: "president", label: "社長" },
  { value: "vice", label: "副社長" },
  { value: "finance", label: "財務長" },
  { value: "activity", label: "活動長" },
  { value: "pr", label: "公關" },
  { value: "alumni", label: "歷任幹部" },
  { value: "none", label: "未設定職位" },
];

// 後台顯示用的職位名稱
export function roleLabelOf(profile) {
  if (profile?.isDeveloper) {
    if (!profile.previewRole) return "開發者";
    const label =
      previewRoleOptions.find((item) => item.value === profile.previewRole)?.label ||
      profile.previewRole;
    return `預覽：${label}`;
  }
  return roleLabelMap[profile?.role] || profile?.role || "未設定";
}

// 各職位可使用的功能（社長全部都可以）
//   所有現任幹部：活動公告、照片影片
//   副社長：另外可管理社員資料
//   財務長：另外可管理領款收據
//   歷任幹部：照片影片（只能修改自己上傳的）
// 修改這裡時，Firebase 的 Firestore 規則也要一起改

export const adminMenuItems = [
  {
    label: "後台首頁",
    path: "/admin/dashboard",
    icon: Home,
    roles: ["president", "vice", "finance", "activity", "pr", "alumni"],
  },
  {
    label: "職位授權管理",
    path: "/admin/roles",
    icon: ShieldCheck,
    roles: ["president"],
  },
  {
    label: "社員資料管理",
    path: "/admin/members",
    icon: Users,
    roles: ["president", "vice"],
  },
  {
    label: "活動公告管理",
    path: "/admin/events",
    icon: CalendarDays,
    roles: ["president", "vice", "finance", "activity", "pr"],
  },
  {
    label: "照片 / 影片管理",
    path: "/admin/media",
    icon: Image,
    roles: ["president", "vice", "finance", "activity", "pr", "alumni"],
  },
  {
    label: "領款收據管理",
    path: "/admin/finance",
    icon: FileText,
    roles: ["president", "finance"],
  },
  {
    label: "社章設定",
    path: "/admin/seal",
    icon: Stamp,
    roles: ["president"],
  },
];

// 取得某個頁面允許的職位（給 App.jsx 的 RoleRoute 使用）
export function rolesFor(path) {
  return adminMenuItems.find((item) => item.path === path)?.roles || ["president"];
}
