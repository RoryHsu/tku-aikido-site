import { useEffect, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

import photo1 from "../assets/home/photo1.jpg";
import photo2 from "../assets/home/photo2.jpg";

// 首頁全螢幕輪播：要新增一張，就在這裡多加一筆
const slides = [
  {
    image: photo1,
    title: "淡江合氣道社",
    desc: "透過合氣道學習身體控制、禮法與合作，讓訓練不只是技術，也是一種長期養成。",
  },
  {
    image: photo2,
    title: "零基礎也能開始",
    desc: "每週二、四固定社課，學長姊從受身開始帶，歡迎直接來體驗。",
  },
];

const AUTOPLAY_MS = 6000;

export default function HeroSlider({ ready = true }) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  const go = (step) => {
    setIndex((current) => (current + step + slides.length) % slides.length);
  };

  // 開場動畫結束後才開始自動輪播；index 改變時重新計時
  useEffect(() => {
    if (!ready || slides.length < 2) return undefined;
    const timer = setTimeout(
      () => setIndex((current) => (current + 1) % slides.length),
      AUTOPLAY_MS
    );
    return () => clearTimeout(timer);
  }, [ready, index]);

  return (
    <section className="relative h-[calc(100svh-76px)] min-h-[520px] w-full overflow-hidden bg-slate-950">
      <AnimatePresence initial={false}>
        <Motion.img
          key={slide.image}
          src={slide.image}
          alt={slide.title}
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 0.8 },
            scale: { duration: AUTOPLAY_MS / 1000, ease: "linear" },
          }}
        />
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      {/* 左下角文字區塊：開場動畫結束後從左側滑入 */}
      <Motion.div
        className="absolute bottom-0 left-0 w-full rounded-tr-[64px] bg-amber-700/95 px-5 pb-5 pt-6 text-white sm:w-[26rem] sm:pl-8 sm:pr-12 lg:w-[30rem] lg:pl-12"
        initial={{ x: "-100%", opacity: 0 }}
        animate={ready ? { x: 0, opacity: 1 } : { x: "-100%", opacity: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      >
        <div className="text-[10px] font-bold tracking-[0.25em] text-white/70 sm:text-xs">
          TAMKANG UNIVERSITY AIKIDO CLUB
        </div>

        {/* 固定文字區高度，每張投影片的紅框大小才會一致 */}
        <div className="min-h-[6.5rem] sm:min-h-[7rem]">
          <AnimatePresence mode="wait">
            <Motion.div
              key={index}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">
                {slide.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/85">{slide.desc}</p>
            </Motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            className="rounded-full border border-white/40 p-1.5 transition hover:bg-white hover:text-amber-700"
            aria-label="上一張"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="text-sm tabular-nums text-white/70">
            {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            className="rounded-full border border-white/40 p-1.5 transition hover:bg-white hover:text-amber-700"
            aria-label="下一張"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </Motion.div>
    </section>
  );
}
