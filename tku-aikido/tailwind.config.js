/** @type {import('tailwindcss').Config} */

// 配色取自社徽與橫幅：
// slate → 墨色（偏暖的灰黑，取自橫幅的書法墨跡；slate-50 為宣紙白）
// amber → 朱紅（取自社徽紅 #B31213，對應最常用的 amber-700）
// 全站原本就用 slate / amber 這兩組 class，所以只要改這裡就能整站換色。
const ink = {
  50: "#faf8f4",
  100: "#f2eee6",
  200: "#e4ded3",
  300: "#cfc7b9",
  400: "#a39b8e",
  500: "#7a7368",
  600: "#5c564d",
  700: "#433e37",
  800: "#2c2925",
  900: "#1f1d1a",
  950: "#141311",
};

const vermilion = {
  50: "#fdf2f2",
  100: "#fbe2e1",
  200: "#f5c2c0",
  300: "#ec9693",
  400: "#df5f5b",
  500: "#cf3431",
  600: "#c01d1d",
  700: "#b31213",
  800: "#8f0f10",
  900: "#6e0d0e",
  950: "#3f0607",
};

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: ink,
        amber: vermilion,
      },
      fontFamily: {
        serif: ['"Noto Serif TC"', "serif"],
      },
    },
  },
  plugins: [],
}
