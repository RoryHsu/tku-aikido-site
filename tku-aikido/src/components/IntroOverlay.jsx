import { useEffect, useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";

import logo from "../assets/brand/logo.webp";
import banner from "../assets/brand/banner.webp";

// 開場動畫：宣紙底 + 社徽蓋章 + 書法橫幅 → 方塊隨機消失，露出首頁
// 同一個分頁只播一次（sessionStorage），偏好減少動態效果的使用者直接略過
const STORAGE_KEY = "tku-aikido-intro-played";
const COLS = 6;
const ROWS = 4;
const LOGO_DURATION = 2000; // 標誌停留時間（毫秒）
const REVEAL_SPREAD = 0.7; // 方塊消失的時間範圍（秒）

function shouldPlayIntro() {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return false;
    }
    return sessionStorage.getItem(STORAGE_KEY) !== "1";
  } catch {
    return true;
  }
}

export default function IntroOverlay({ onFinish }) {
  const [play] = useState(shouldPlayIntro);
  const [phase, setPhase] = useState(play ? "logo" : "done");

  // 每個方塊隨機延遲，做出逐塊消失的效果
  const delays = useMemo(
    () =>
      Array.from({ length: COLS * ROWS }, () => Math.random() * REVEAL_SPREAD),
    []
  );

  useEffect(() => {
    if (!play) {
      onFinish?.();
      return undefined;
    }

    document.body.style.overflow = "hidden";

    const toReveal = setTimeout(() => setPhase("reveal"), LOGO_DURATION);
    const toDone = setTimeout(() => {
      setPhase("done");
      document.body.style.overflow = "";
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // 無法寫入 sessionStorage 時，下次重新整理會再播一次，不影響使用
      }
      onFinish?.();
    }, LOGO_DURATION + (REVEAL_SPREAD + 0.2) * 1000);

    return () => {
      clearTimeout(toReveal);
      clearTimeout(toDone);
      document.body.style.overflow = "";
    };
    // 只在第一次載入時執行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "done") return null;

  return (
    <div className="fixed inset-0 z-[100]" aria-hidden="true">
      <div
        className="grid h-full w-full"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        }}
      >
        {delays.map((delay, index) => (
          <Motion.div
            key={index}
            className="-m-px bg-slate-50"
            initial={{ opacity: 1 }}
            animate={{ opacity: phase === "reveal" ? 0 : 1 }}
            transition={{ duration: 0.15, delay: phase === "reveal" ? delay : 0 }}
          />
        ))}
      </div>

      <Motion.div
        className="absolute inset-0 flex flex-col items-center justify-center px-6"
        animate={{ opacity: phase === "logo" ? 1 : 0 }}
        transition={{ duration: 0.25 }}
      >
        {/* 社徽：像蓋印章一樣由大縮小落下 */}
        <Motion.img
          src={logo}
          alt=""
          className="h-28 w-28 rounded-full mix-blend-multiply sm:h-36 sm:w-36"
          initial={{ opacity: 0, scale: 1.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
        />
        {/* 書法橫幅：由左往右像墨跡一樣展開 */}
        <Motion.img
          src={banner}
          alt=""
          className="mt-4 w-full max-w-xl mix-blend-multiply"
          initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
          animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
        />
      </Motion.div>
    </div>
  );
}
