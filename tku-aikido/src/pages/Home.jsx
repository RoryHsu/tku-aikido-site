import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Shield,
  Users,
  ChevronRight,
  PlayCircle,
} from "lucide-react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";

import coach1 from "../assets/coaches/coach1.jpg";
import coach2 from "../assets/coaches/coach2.jpg";
import coach3 from "../assets/coaches/coach3.jpg";

import heroVideo from "../assets/home/video1.mp4";
import demoPhoto from "../assets/home/photo1.jpg";
import classPhoto from "../assets/home/photo2.jpg";

function SectionTitle({ eyebrow, title, desc, dark = false }) {
  return (
    <div className="mb-8">
      <div
        className={`text-sm font-semibold tracking-[0.24em] ${
          dark ? "text-amber-400" : "text-amber-700"
        }`}
      >
        {eyebrow}
      </div>
      <h2
        className={`mt-3 text-3xl font-black tracking-tight sm:text-4xl ${
          dark ? "text-white" : "text-slate-900"
        }`}
      >
        {title}
      </h2>
      {desc ? (
        <p
          className={`mt-4 max-w-3xl leading-8 ${
            dark ? "text-slate-300" : "text-slate-600"
          }`}
        >
          {desc}
        </p>
      ) : null}
    </div>
  );
}

function truncate(text, length = 100) {
  if (!text) return "";
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}

export default function Home() {
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const coaches = [
    {
      image: coach1,
      position: "指導教練",
      name: "徐蔚人",
      rank: "合氣道四段",
      role: "Chief Instructor",
      description:
        "負責社團整體教學架構與技術發展，確保訓練符合正統合氣道精神與技術體系。",
    },
    {
      image: coach2,
      position: "訓練長",
      name: "周以琦",
      rank: "合氣道三級",
      role: "Training Director",
      description:
        "負責社課開課、閉課及課前暖身操，協助指導教練規劃不同色帶的訓練進度。",
    },
    {
      image: coach3,
      position: "客座講師",
      name: "謝佳倫",
      rank: "合氣道二段",
      role: "Guest Instructor",
      description:
        "定期回社進行技術交流與特別講習，提供不同觀點與進階技術分享。",
    },
  ];

  useEffect(() => {
    const fetchEvents = async () => {
      setEventsLoading(true);

      try {
        const q = query(
          collection(db, "events"),
          where("published", "==", true),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        setEvents(data.slice(0, 3));
      } catch (err) {
        console.error("fetch published events error:", err);
      }

      setEventsLoading(false);
    };

    fetchEvents();
  }, []);

  return (
    <div>
      <section className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-24">
          <div className="flex flex-col justify-center">
            <h1 className="mt-6 text-5xl font-black leading-tight tracking-tight text-slate-900 sm:text-6xl">
              淡江合氣道社
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              透過合氣道學習身體控制、禮法與合作，讓訓練不只是技術，也是一種長期養成。
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/about"
                className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                了解本社
              </Link>

              <Link
                to="/contact"
                className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                立即聯絡
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <CalendarDays className="h-5 w-5 text-amber-700" />
                <div className="mt-3 text-3xl font-black text-slate-900">
                  2節 / 週
                </div>
                <div className="text-sm text-slate-500">固定社課</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <Shield className="h-5 w-5 text-amber-700" />
                <div className="mt-3 text-3xl font-black text-slate-900">
                  自我防護
                </div>
                <div className="text-sm text-slate-500">保護自身安全</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <Users className="h-5 w-5 text-amber-700" />
                <div className="mt-3 text-3xl font-black text-slate-900">
                  新手友善
                </div>
                <div className="text-sm text-slate-500">
                  0基礎也可以，循序入門
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
              <video
                className="h-[280px] w-full object-cover"
                src={heroVideo}
                autoPlay
                muted
                loop
                playsInline
                controls
              />
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
              <img
                src={demoPhoto}
                alt="演武照片"
                className="h-[180px] w-full object-cover"
              />
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
              <img
                src={classPhoto}
                alt="社課照片"
                className="h-[180px] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <SectionTitle
            eyebrow="ABOUT"
            title="社團簡介"
            desc="淡江合氣道社致力於推廣合氣道與武道文化，訓練內容包含受身、體術、關節技、投技，以及木劍與短杖等延伸課程。"
          />

          <div className="grid gap-6 md:grid-cols-3">
            {[
              ["武道精神", "重視禮法、專注、穩定與尊重，培養長期練習的自律性。"],
              ["多元訓練", "從基本受身到體術、武器，逐步建立完整訓練體驗。"],
              ["社團傳承", "透過迎新、社課、演武與成果展示，延續社團文化。"],
            ].map(([title, text]) => (
              <div
                key={title}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <div className="text-2xl font-black text-slate-900">
                  {title}
                </div>
                <p className="mt-4 leading-8 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <SectionTitle
            eyebrow="CLASSES"
            title="社課資訊"
            desc="固定時段建立訓練節奏，適合新生持續參與與熟悉內容。"
          />

          <div className="grid gap-6 md:grid-cols-3">
            {[
              ["週二 Tuesday", "20:00–22:00"],
              ["週四 Thursday", "20:00–22:00"],
              ["週五 Friday （自由加練）", "20:00–22:00"],
            ].map(([day, time]) => (
              <div
                key={day}
                className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
              >
                <div className="text-sm font-semibold tracking-[0.18em] text-slate-500">
                  {day}
                </div>
                <div className="mt-3 text-3xl font-black text-slate-900">
                  {time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <SectionTitle
            eyebrow="COACHES"
            title="教練團隊"
            desc="由指導教練、訓練長與客座講師共同組成完整教學架構，提供系統化與專業的武道訓練環境。"
          />

          <div className="grid gap-8 lg:grid-cols-3">
            {coaches.map((coach) => (
              <div
                key={coach.name}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="overflow-hidden">
                  <img
                    src={coach.image}
                    alt={coach.name}
                    className="h-[320px] w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="p-7">
                  <div className="text-sm font-semibold tracking-[0.2em] text-amber-700">
                    {coach.position}
                  </div>

                  <div className="mt-2 text-3xl font-black text-slate-900">
                    {coach.name}
                  </div>

                  <div className="mt-1 text-lg font-semibold text-slate-600">
                    {coach.rank}
                  </div>

                  <div className="mt-1 text-xs tracking-[0.18em] text-slate-400">
                    {coach.role}
                  </div>

                  <p className="mt-5 leading-8 text-slate-600">
                    {coach.description}
                  </p>

                  <Link
                    to="/coaches"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900"
                  >
                    查看完整介紹 <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <SectionTitle
                eyebrow="EVENTS"
                title="最新活動"
                desc="由後台管理系統發佈並同步顯示於前台網站。"
              />
            </div>

            <Link
              to="/events"
              className="hidden rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 md:inline-flex"
            >
              查看全部活動
            </Link>
          </div>

          {eventsLoading ? (
            <div className="text-slate-500">載入中...</div>
          ) : events.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-slate-500">
              目前尚無已公開活動。
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {events.map((item) => (
                <Link
                  to={`/events/${item.id}`}
                  key={item.id}
                  className="block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  {item.coverImage ? (
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="h-52 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-52 items-center justify-center bg-slate-100 text-sm tracking-[0.18em] text-slate-400">
                      EVENT COVER
                    </div>
                  )}

                  <div className="p-6">
                    <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-amber-700">
                      {item.category || "活動"}
                    </div>

                    <div className="mt-4 text-2xl font-black text-slate-900">
                      {item.title}
                    </div>

                    <div className="mt-3 text-sm text-slate-500">
                      日期：{item.date || "未填寫"}
                    </div>

                    <div className="mt-2 text-sm text-slate-500">
                      時間：{item.time || "未填寫"}
                    </div>

                    <div className="mt-2 text-sm text-slate-500">
                      地點：{item.location || "未填寫"}
                    </div>

                    <p className="mt-4 leading-8 text-slate-600">
                      {truncate(item.description)}
                    </p>

                    <div className="mt-6 text-sm font-semibold text-blue-600">
                      閱讀更多 →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8 md:hidden">
            <Link
              to="/events"
              className="inline-flex rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              查看全部活動
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <SectionTitle
            eyebrow="VIDEOS"
            title="影片專區"
            desc="未來可嵌入 YouTube、Instagram Reel 或 Facebook 影片。"
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {[
              ["社團形象影片", "社團介紹與招生短片"],
              ["演武展示", "受身、體術與武器訓練片段"],
              ["活動紀錄", "迎新、成果展與交流活動精華"],
            ].map(([title, text]) => (
              <div
                key={title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex aspect-video items-center justify-center rounded-2xl bg-slate-100">
                  <PlayCircle className="h-14 w-14 text-slate-400" />
                </div>
                <div className="mt-5 text-2xl font-black text-slate-900">
                  {title}
                </div>
                <p className="mt-3 leading-8 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}