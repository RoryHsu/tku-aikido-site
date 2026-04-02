import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import {
  CalendarDays,
  Clock3,
  MapPin,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { db } from "../lib/firebase";

function formatTextWithLinks(text) {
  if (!text) return null;

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    const isUrl = /^https?:\/\/[^\s]+$/.test(part);

    if (isUrl) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="break-all font-medium text-blue-600 underline underline-offset-4 hover:text-blue-700"
        >
          {part}
        </a>
      );
    }

    return part.split("\n").map((line, lineIndex, arr) => (
      <span key={`${index}-${lineIndex}`}>
        {line}
        {lineIndex < arr.length - 1 && <br />}
      </span>
    ));
  });
}

function extractFirstUrl(text) {
  if (!text) return "";
  const match = text.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : "";
}

export default function EventDetail() {
  const { id } = useParams();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const ref = doc(db, "events", id);
        const snapshot = await getDoc(ref);

        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.published) {
            setEventData({ id: snapshot.id, ...data });
          } else {
            setEventData(null);
          }
        } else {
          setEventData(null);
        }
      } catch (error) {
        console.error("fetch event detail error:", error);
        setEventData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-5xl text-slate-500">載入中...</div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-[60vh] bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <h1 className="text-3xl font-black text-slate-900">找不到活動</h1>
          <p className="mt-4 text-slate-600">
            這則活動可能不存在、已刪除，或尚未公開。
          </p>

          <Link
            to="/events"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            返回活動列表
          </Link>
        </div>
      </div>
    );
  }

  const mapUrl = extractFirstUrl(eventData.description);
  const registrationUrl = eventData.registrationUrl || "";

  return (
    <div className="bg-slate-50 py-14 lg:py-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <Link
          to="/events"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          返回活動列表
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            {eventData.coverImage ? (
              <img
                src={eventData.coverImage}
                alt={eventData.title}
                className="h-[320px] w-full object-cover"
              />
            ) : (
              <div className="flex h-[320px] items-center justify-center bg-slate-100 text-sm tracking-[0.18em] text-slate-400">
                EVENT COVER
              </div>
            )}

            <div className="p-8 lg:p-10">
              <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-amber-700">
                {eventData.category || "活動"}
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-slate-900">
                {eventData.title}
              </h1>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <CalendarDays className="h-4 w-4" />
                    日期
                  </div>
                  <div className="mt-2 text-base font-bold text-slate-900">
                    {eventData.date || "未填寫"}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <Clock3 className="h-4 w-4" />
                    時間
                  </div>
                  <div className="mt-2 text-base font-bold text-slate-900">
                    {eventData.time || "未填寫"}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <MapPin className="h-4 w-4" />
                    地點
                  </div>
                  <div className="mt-2 text-base font-bold text-slate-900">
                    {eventData.location || "未填寫"}
                  </div>
                </div>
              </div>

              <div className="mt-10 border-t border-slate-200 pt-8">
                <h2 className="text-2xl font-black text-slate-900">
                  活動內容
                </h2>

                <div className="mt-5 whitespace-pre-wrap text-[17px] leading-9 text-slate-700">
                  {formatTextWithLinks(eventData.description)}
                </div>
              </div>
            </div>
          </div>

          <div className="h-fit rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="text-sm font-semibold tracking-[0.18em] text-amber-700">
              QUICK ACTIONS
            </div>

            <h2 className="mt-4 text-2xl font-black text-slate-900">
              活動操作
            </h2>

            <p className="mt-4 leading-8 text-slate-600">
              可透過下方按鈕快速前往報名頁面或地圖位置。
            </p>

            <div className="mt-8 space-y-4">
              {registrationUrl ? (
                <a
                  href={registrationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  前往報名
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}

              {mapUrl ? (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  查看地圖
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}

              <Link
                to="/events"
                className="flex w-full items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                返回活動列表
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}