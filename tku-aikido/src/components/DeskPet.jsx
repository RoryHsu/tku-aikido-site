import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion as Motion, useReducedMotion } from "framer-motion";
import petImage from "../assets/pet/pet.webp";

/**
 * 右下角的桌寵：會在右下角範圍內跑來跑去、練合氣道、睡覺。
 * 固定在畫面上（position: fixed），捲動網頁也不會跑掉。
 * 點她會打招呼；睡覺時點她會醒來。右上角的 × 可以收起來。
 */

const STORAGE_KEY = "tku-desk-pet-hidden";
const RUN_SPEED = 70; // 每秒跑幾 px
const IMAGE_RATIO = 360 / 292; // 圖片高 / 寬

const aikidoLines = ["えいっ！", "呼吸投げ！", "四方投げ～", "受身！", "合氣！"];
const helloLines = ["ciallo～(∠・ω< )⌒★", "歡迎來到淡江合氣道社！", "一起來練合氣道吧～", "社課見！"];
const wakeLines = ["唔…早安～", "我沒有在偷懶！", "再睡五分鐘…"];

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const rand = (min, max) => min + Math.random() * (max - min);

function readHidden() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeHidden(value) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, "1");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 無痕模式等情況存不了，只影響下次是否記得收起
  }
}

function getSizes() {
  const vw = typeof window === "undefined" ? 1280 : window.innerWidth;
  const petW = vw < 640 ? 70 : 96;
  const zoneW = Math.round(Math.min(360, vw * 0.55));
  return { petW, zoneW };
}

// 身體動作（相對於目前位置）
function bodyMotion(mode, dir, petW) {
  switch (mode) {
    case "run":
      return {
        animate: { x: 0, y: [0, -9, 0], rotate: [-4 * dir, 3 * dir, -4 * dir], scaleY: 1 },
        transition: { duration: 0.34, repeat: Infinity, ease: "easeInOut" },
      };
    case "aikido":
      // 兩次「沉身 → 向前投」
      return {
        animate: {
          x: [0, -5 * dir, 18 * dir, 0, -5 * dir, 18 * dir, 0],
          y: [0, 4, -4, 0, 4, -4, 0],
          rotate: [0, -6 * dir, 12 * dir, 0, -6 * dir, 12 * dir, 0],
          scaleY: [1, 0.92, 1.04, 1, 0.92, 1.04, 1],
        },
        transition: {
          duration: 2.4,
          times: [0, 0.2, 0.3, 0.5, 0.7, 0.8, 1],
          ease: "easeOut",
        },
      };
    case "sleep":
      return {
        // 躺下時以腳底為軸轉 84 度，往上抬避免身體超出畫面
        animate: { x: petW * 0.15, y: -petW * 0.45, rotate: -84, scaleY: 1 },
        transition: { duration: 0.8, ease: "easeInOut" },
      };
    case "hello":
      return {
        animate: { x: 0, y: [0, -26, 0, -10, 0], rotate: [0, -6, 0, 4, 0], scaleY: 1 },
        transition: { duration: 0.9, ease: "easeOut" },
      };
    default:
      return {
        animate: { x: 0, y: [0, -2, 0], rotate: 0, scaleY: [1, 0.985, 1] },
        transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
      };
  }
}

export default function DeskPet() {
  const reduceMotion = useReducedMotion();
  const [hidden, setHidden] = useState(readHidden);
  const [sizes, setSizes] = useState(getSizes);
  const [mode, setMode] = useState("idle");
  const [x, setX] = useState(() => getSizes().zoneW - getSizes().petW - 12);
  const [moveSeconds, setMoveSeconds] = useState(0);
  const [dir, setDir] = useState(-1); // 1 = 面向右，-1 = 面向左
  const [bubble, setBubble] = useState("");
  const [aikidoRound, setAikidoRound] = useState(0);

  const xRef = useRef(x);
  const sizesRef = useRef(sizes);
  const modeRef = useRef(mode);
  const timerRef = useRef(null);
  const pokeRef = useRef(() => {});

  useEffect(() => {
    const onResize = () => {
      const next = getSizes();
      sizesRef.current = next;
      setSizes(next);
      const maxX = next.zoneW - next.petW - 12;
      if (xRef.current > maxX) {
        xRef.current = maxX;
        setMoveSeconds(0);
        setX(maxX);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // 行為循環：跑步 → 練合氣道 → 發呆 → 睡覺……隨機切換
  useEffect(() => {
    if (hidden) return undefined;

    const later = (fn, ms) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(fn, ms);
    };

    const setModeBoth = (next) => {
      modeRef.current = next;
      setMode(next);
    };

    const idle = (ms) => {
      setModeBoth("idle");
      later(nextAction, ms);
    };

    const run = () => {
      const { petW, zoneW } = sizesRef.current;
      const maxX = Math.max(0, zoneW - petW - 12);
      const from = xRef.current;
      let to = rand(0, maxX);
      if (Math.abs(to - from) < maxX * 0.35) to = from < maxX / 2 ? maxX : 0;
      const seconds = Math.abs(to - from) / RUN_SPEED;

      setDir(to > from ? 1 : -1);
      setBubble("");
      setModeBoth("run");
      setMoveSeconds(seconds);
      setX(to);
      xRef.current = to;
      later(() => idle(rand(600, 1500)), seconds * 1000 + 80);
    };

    const aikido = () => {
      setModeBoth("aikido");
      setAikidoRound((n) => n + 1);
      setBubble(pick(aikidoLines));
      later(() => {
        setBubble("");
        idle(rand(1200, 2500));
      }, 2600);
    };

    const sleep = () => {
      setBubble("");
      setModeBoth("sleep");
      later(() => {
        setModeBoth("idle");
        later(nextAction, 1500);
      }, rand(9000, 15000));
    };

    function nextAction() {
      const r = Math.random();
      if (r < 0.45) run();
      else if (r < 0.75) aikido();
      else if (r < 0.9) sleep();
      else idle(rand(2000, 4000));
    }

    // 點她：打招呼；睡覺時則是被叫醒
    pokeRef.current = () => {
      const wasSleeping = modeRef.current === "sleep";
      setModeBoth("hello");
      setBubble(wasSleeping ? pick(wakeLines) : pick(helloLines));
      later(() => {
        setBubble("");
        idle(reduceMotion ? 999999 : rand(1500, 2500));
      }, 2200);
    };

    if (reduceMotion) {
      setModeBoth("idle");
      return () => clearTimeout(timerRef.current);
    }

    later(nextAction, 2500);
    return () => clearTimeout(timerRef.current);
  }, [hidden, reduceMotion]);

  const hide = () => {
    writeHidden(true);
    setHidden(true);
  };

  const show = () => {
    writeHidden(false);
    setHidden(false);
  };

  if (hidden) {
    return (
      <button
        type="button"
        onClick={show}
        className="fixed bottom-4 right-4 z-40 h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-amber-50 shadow-lg transition hover:scale-110"
        aria-label="叫桌寵出來"
        title="叫桌寵出來"
      >
        <img
          src={petImage}
          alt=""
          className="h-full w-full object-cover object-top"
          draggable={false}
        />
      </button>
    );
  }

  const { petW, zoneW } = sizes;
  const petH = Math.round(petW * IMAGE_RATIO);
  const body = bodyMotion(mode, dir, petW);
  const nearRightEdge = x > zoneW - petW - 80;

  return (
    <div
      className="pointer-events-none fixed bottom-0 right-0 z-40"
      style={{ width: zoneW, height: petH + 80 }}
    >
      <Motion.div
        className="group absolute bottom-3 left-0"
        style={{ width: petW, height: petH }}
        initial={false}
        animate={{ x }}
        transition={{ duration: moveSeconds, ease: "linear" }}
      >
        {/* 影子 */}
        <div
          className="absolute -bottom-1 left-1/2 h-2.5 -translate-x-1/2 rounded-full bg-black/15 blur-[2px] transition-all duration-700"
          style={{ width: mode === "sleep" ? petH * 1.05 : petW * 0.7, marginLeft: mode === "sleep" ? -petH * 0.45 : 0 }}
        />

        {/* 對話泡泡：靠近畫面右緣時改成靠右對齊，避免被切掉 */}
        <div
          className={`absolute bottom-full mb-2 ${
            nearRightEdge ? "right-0" : "left-1/2 -translate-x-1/2"
          }`}
        >
          <AnimatePresence>
            {bubble ? (
              <Motion.div
                key={bubble}
                initial={{ opacity: 0, y: 6, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4 }}
                className="whitespace-nowrap rounded-2xl border border-amber-200 bg-white px-3 py-1.5 text-xs font-bold text-amber-700 shadow-md"
              >
                {bubble}
              </Motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* 睡覺的 Zzz */}
        {mode === "sleep" ? (
          <div
            className="absolute text-amber-700"
            style={{
              left: -petW * 0.3,
              bottom: petW * 0.75,
              textShadow: "0 0 3px #fff, 0 0 3px #fff, 0 0 3px #fff",
            }}
          >
            {[0, 1, 2].map((i) => (
              <Motion.span
                key={i}
                className="absolute font-black"
                style={{ fontSize: 14 + i * 5 }}
                initial={{ opacity: 0, x: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], x: [0, -8 - i * 6], y: [0, -30 - i * 10] }}
                transition={{ duration: 2.4, delay: 0.9 + i * 0.8, repeat: Infinity }}
              >
                z
              </Motion.span>
            ))}
          </div>
        ) : null}

        {/* 合氣道的氣流 */}
        {mode === "aikido" ? (
          <svg
            key={aikidoRound}
            className="absolute top-1/4 h-2/3 w-full"
            style={{ left: dir * petW * 0.55, transform: `scaleX(${dir})` }}
            viewBox="0 0 100 100"
            fill="none"
          >
            {[0.45, 1.65].map((delay) => (
              <Motion.path
                key={delay}
                d="M15 85 Q 85 75 80 15"
                stroke="#B31213"
                strokeWidth="5"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.8, 0] }}
                transition={{ duration: 0.55, delay }}
              />
            ))}
          </svg>
        ) : null}

        {/* 跑步揚起的灰塵 */}
        {mode === "run" ? (
          <div
            className="absolute bottom-0"
            style={{ left: dir === 1 ? -6 : petW - 6 }}
          >
            {[0, 1].map((i) => (
              <Motion.span
                key={i}
                className="absolute block h-2.5 w-2.5 rounded-full bg-slate-300/70"
                animate={{ opacity: [0.8, 0], scale: [0.6, 1.6], x: [0, -10 * dir], y: [0, -6] }}
                transition={{ duration: 0.6, delay: i * 0.3, repeat: Infinity }}
              />
            ))}
          </div>
        ) : null}

        {/* 身體 */}
        <Motion.button
          type="button"
          onClick={() => pokeRef.current()}
          className="pointer-events-auto absolute inset-0 block cursor-pointer focus:outline-none"
          style={{ originX: 0.5, originY: 1 }}
          animate={body.animate}
          transition={body.transition}
          aria-label="和桌寵打招呼"
        >
          <Motion.img
            src={petImage}
            alt=""
            draggable={false}
            className="h-full w-full select-none drop-shadow-sm"
            style={{ scaleX: dir === 1 ? -1 : 1, originY: 1 }}
            animate={mode === "sleep" ? { scaleY: [1, 1.03, 1] } : { scaleY: 1 }}
            transition={mode === "sleep" ? { duration: 2.4, repeat: Infinity } : { duration: 0.2 }}
          />
        </Motion.button>

        {/* 收起 */}
        {mode === "sleep" ? null : (
          <button
            type="button"
            onClick={hide}
            className="pointer-events-auto absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-slate-500 opacity-60 shadow transition hover:text-slate-900 group-hover:opacity-100 sm:opacity-0"
            aria-label="收起桌寵"
            title="收起桌寵"
          >
            ×
          </button>
        )}
      </Motion.div>
    </div>
  );
}
