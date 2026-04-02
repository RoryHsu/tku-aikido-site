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

function truncate(text, length = 120) {
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

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setEvents(data);
      } catch (err) {
        console.error(err);
      }

      setEventsLoading(false);
    };

    fetchEvents();
  }, []);

  return (
    <div>

      {/* HERO */}

      <section className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">

        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-24">

          <div className="flex flex-col justify-center">

            <h1 className="mt-6 text-5xl font-black text-slate-900 sm:text-6xl">
              淡江合氣道社
            </h1>

            <p className="mt-6 text-lg text-slate-600">
              透過合氣道學習身體控制與武道精神。
            </p>

            <div className="mt-8 flex gap-4">

              <Link
                to="/about"
                className="rounded-full bg-slate-900 px-6 py-3 text-white"
              >
                了解本社
              </Link>

              <Link
                to="/contact"
                className="rounded-full border border-slate-300 px-6 py-3"
              >
                聯絡我們
              </Link>

            </div>

          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            <video
              className="sm:col-span-2 h-[280px] w-full object-cover rounded-3xl"
              src={heroVideo}
              autoPlay
              muted
              loop
              controls
            />

            <img
              src={demoPhoto}
              className="h-[180px] w-full object-cover rounded-3xl"
            />

            <img
              src={classPhoto}
              className="h-[180px] w-full object-cover rounded-3xl"
            />

          </div>

        </div>

      </section>

      {/* EVENTS */}

      <section className="border-y border-slate-200 bg-slate-50 py-16">

        <div className="mx-auto max-w-7xl px-6">

          <SectionTitle
            eyebrow="EVENTS"
            title="最新活動"
            desc="由後台發佈並同步顯示"
          />

          {eventsLoading ? (

            <div>載入中...</div>

          ) : events.length === 0 ? (

            <div>目前沒有活動</div>

          ) : (

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

              {events.map((item) => (

                <Link
                  to={`/events/${item.id}`}
                  key={item.id}
                  className="block rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >

                  <div className="text-2xl font-black text-slate-900">
                    {item.title}
                  </div>

                  <div className="mt-3 text-sm text-slate-500">
                    日期：{item.date}
                  </div>

                  <div className="mt-2 text-sm text-slate-500">
                    時間：{item.time}
                  </div>

                  <div className="mt-2 text-sm text-slate-500">
                    地點：{item.location}
                  </div>

                  <p className="mt-4 text-slate-600">
                    {truncate(item.description)}
                  </p>

                  <div className="mt-6 text-sm font-semibold text-blue-600">
                    閱讀更多 →
                  </div>

                </Link>

              ))}

            </div>

          )}

        </div>

      </section>

      {/* COACHES */}

      <section className="bg-white py-16">

        <div className="mx-auto max-w-7xl px-6">

          <SectionTitle
            eyebrow="COACHES"
            title="教練團隊"
          />

          <div className="grid gap-8 lg:grid-cols-3">

            {coaches.map((coach) => (

              <div
                key={coach.name}
                className="rounded-3xl border border-slate-200 p-6 shadow-sm"
              >

                <img
                  src={coach.image}
                  className="h-[300px] w-full object-cover rounded-2xl"
                />

                <div className="mt-4 text-2xl font-black">
                  {coach.name}
                </div>

                <div className="text-slate-500">
                  {coach.rank}
                </div>

                <p className="mt-4 text-slate-600">
                  {coach.description}
                </p>

              </div>

            ))}

          </div>

        </div>

      </section>

    </div>
  );
}