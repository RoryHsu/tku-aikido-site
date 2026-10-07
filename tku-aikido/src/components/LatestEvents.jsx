import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin } from "lucide-react";
import { fetchPublishedEvents } from "../lib/publicEvents";

export default function LatestEvents({ limit = 3 }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublishedEvents()
      .then((data) => setEvents(data.slice(0, limit)))
      .catch((error) => console.error("fetch latest events error:", error))
      .finally(() => setLoading(false));
  }, [limit]);

  return (
    <section id="events" className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-sm font-bold tracking-[0.3em] text-amber-700">
              EVENTS
            </div>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
              最新活動
            </h2>
          </div>

          <Link
            to="/events"
            className="rounded-full border border-slate-300 px-5 py-2 text-sm font-bold text-slate-700 hover:border-slate-950 hover:text-slate-950"
          >
            查看全部活動 →
          </Link>
        </div>

        {loading ? (
          <div className="mt-10 text-slate-500">載入中...</div>
        ) : events.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-slate-300 px-6 py-10 text-slate-500">
            目前尚無已公開活動。
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((item) => (
              <Link
                key={item.id}
                to={`/events/${item.id}`}
                className="group block overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                {item.coverImage ? (
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-slate-100 text-sm tracking-[0.18em] text-slate-400">
                    EVENT
                  </div>
                )}

                <div className="p-6">
                  <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-amber-700">
                    {item.category || "活動"}
                  </div>

                  <h3 className="mt-4 text-xl font-black leading-tight text-slate-950 group-hover:text-amber-700">
                    {item.title}
                  </h3>

                  <div className="mt-4 space-y-2 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      <span>
                        {item.date || "日期未定"}
                        {item.time ? `\u3000${item.time}` : ""}
                      </span>
                    </div>
                    {item.location ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{item.location}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
