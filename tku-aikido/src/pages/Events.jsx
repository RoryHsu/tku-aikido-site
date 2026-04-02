import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { db } from "../lib/firebase";

function truncate(text, length = 120) {
  if (!text) return "";
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);

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

        setEvents(data);
      } catch (error) {
        console.error("fetch events error:", error);
      }

      setLoading(false);
    };

    fetchEvents();
  }, []);

  return (
    <div className="bg-slate-50 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-10">
          <div className="text-sm font-semibold tracking-[0.24em] text-amber-700">
            EVENTS
          </div>
          <h1 className="mt-3 text-4xl font-black text-slate-900">
            活動列表
          </h1>
          <p className="mt-4 max-w-3xl leading-8 text-slate-600">
            查看淡江合氣道社最新公開活動、社課、社遊、迎新與成果展資訊。
          </p>
        </div>

        {loading ? (
          <div className="text-slate-500">載入中...</div>
        ) : events.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-slate-500">
            目前尚無已公開活動。
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
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
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center bg-slate-100 text-sm tracking-[0.18em] text-slate-400">
                    EVENT COVER
                  </div>
                )}

                <div className="p-6">
                  <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-amber-700">
                    {item.category || "活動"}
                  </div>

                  <h2 className="mt-4 text-2xl font-black leading-tight text-slate-900">
                    {item.title}
                  </h2>

                  <div className="mt-5 space-y-2 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      <span>{item.date || "未填寫"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4" />
                      <span>{item.time || "未填寫"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{item.location || "未填寫"}</span>
                    </div>
                  </div>

                  {item.description ? (
                    <p className="mt-5 leading-8 text-slate-600">
                      {truncate(item.description, 90)}
                    </p>
                  ) : null}

                  <div className="mt-6 text-sm font-semibold text-blue-600">
                    閱讀更多 →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}