import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { ExternalLink, PlayCircle } from "lucide-react";
import { db } from "../lib/firebase";
import {
  resolveMediaThumbnail,
  resolveMediaTargetUrl,
} from "../utils/googleDrive";

function SectionTitle({ eyebrow, title, desc }) {
  return (
    <div className="mb-8">
      <div className="text-sm font-semibold tracking-[0.24em] text-amber-700">
        {eyebrow}
      </div>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
        {title}
      </h1>
      {desc ? (
        <p className="mt-4 max-w-3xl leading-8 text-slate-600">{desc}</p>
      ) : null}
    </div>
  );
}

function truncate(text, length = 100) {
  if (!text) return "";
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

export default function Videos() {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);

      try {
        const q = query(
          collection(db, "media"),
          where("visibleOnWebsite", "==", true),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        setMediaList(data);
      } catch (error) {
        console.error("fetch videos media error:", error);
      }

      setLoading(false);
    };

    fetchMedia();
  }, []);

  const videoItems = useMemo(() => {
    return mediaList.filter((item) => item.type === "video");
  }, [mediaList]);

  const groupedItems = useMemo(() => {
    const groups = {
      社課: [],
      成果展: [],
      迎新: [],
      交流活動: [],
      公告素材: [],
      其他: [],
    };

    videoItems.forEach((item) => {
      const category = item.category || "其他";
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
    });

    return groups;
  }, [videoItems]);

  return (
    <div className="bg-slate-50">
      <section className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
          <SectionTitle
            eyebrow="TAMKANG UNIVERSITY AIKIDO CLUB"
            title="影片專區"
            desc="集中展示社團形象影片、演武片段、活動紀錄與成果展內容，讓更多人看見淡江合氣道社的訓練與活動成果。"
          />
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          {loading ? (
            <div className="text-slate-500">載入中...</div>
          ) : videoItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
                <PlayCircle className="h-10 w-10 text-amber-700" />
              </div>
              <h2 className="mt-6 text-3xl font-black text-slate-900">
                頁面正在建設中
              </h2>
              <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-600">
                我們正在整理社團影片素材，未來將在這裡展示社團形象影片、演武片段、迎新活動與成果展紀錄。
              </p>

              <div className="mx-auto mt-8 max-w-2xl rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-slate-500">
                影片內容準備中，敬請期待。
              </div>
            </div>
          ) : (
            <div className="space-y-14">
              {Object.entries(groupedItems).map(([groupName, items]) => {
                if (!items.length) return null;

                return (
                  <section key={groupName}>
                    <div className="mb-6">
                      <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-amber-700">
                        {groupName}
                      </div>
                      <h2 className="mt-4 text-3xl font-black text-slate-900">
                        {groupName}影片
                      </h2>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                      {items.map((item) => {
                        const thumbnail = resolveMediaThumbnail(item);
                        const targetUrl = resolveMediaTargetUrl(item);

                        return (
                          <a
                            key={item.id}
                            href={targetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="group block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                          >
                            {thumbnail ? (
                              <div className="relative">
                                <img
                                  src={thumbnail}
                                  alt={item.title}
                                  className="h-60 w-full object-cover transition duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                  <div className="rounded-full bg-white/90 p-4 shadow-lg">
                                    <PlayCircle className="h-10 w-10 text-slate-900" />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex h-60 flex-col items-center justify-center bg-slate-100 text-slate-400">
                                <PlayCircle className="h-12 w-12" />
                                <div className="mt-3 text-sm tracking-[0.18em]">
                                  VIDEO COVER
                                </div>
                              </div>
                            )}

                            <div className="p-6">
                              <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-slate-600">
                                {item.category || "其他"}
                              </div>

                              <h3 className="mt-4 text-2xl font-black leading-tight text-slate-900">
                                {item.title}
                              </h3>

                              {item.description ? (
                                <p className="mt-4 leading-8 text-slate-600">
                                  {truncate(item.description, 90)}
                                </p>
                              ) : null}

                              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
                                觀看影片
                                <ExternalLink className="h-4 w-4" />
                              </div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}