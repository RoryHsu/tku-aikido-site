import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { ExternalLink, Image as ImageIcon } from "lucide-react";
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

export default function Achievements() {
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
        console.error("fetch achievements media error:", error);
      }

      setLoading(false);
    };

    fetchMedia();
  }, []);

  const achievementItems = useMemo(() => {
    return mediaList.filter((item) => {
      const category = item.category || "";
      const type = item.type || "";

      const categoryMatch = [
        "成果展",
        "交流活動",
        "迎新",
        "社課",
        "其他",
      ].includes(category);

      const typeMatch = ["image", "poster", "document"].includes(type);

      return categoryMatch && typeMatch;
    });
  }, [mediaList]);

  const groupedItems = useMemo(() => {
    const groups = {
      成果展: [],
      交流活動: [],
      迎新: [],
      社課: [],
      其他: [],
    };

    achievementItems.forEach((item) => {
      const category = item.category || "其他";
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
    });

    return groups;
  }, [achievementItems]);

  return (
    <div className="bg-slate-50">
      <section className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
          <SectionTitle
            eyebrow="TAMKANG UNIVERSITY AIKIDO CLUB"
            title="歷屆成果"
            desc="整理社團歷年成果、活動紀錄、迎新與交流內容，呈現淡江合氣道社的發展軌跡與活動亮點。"
          />
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          {loading ? (
            <div className="text-slate-500">載入中...</div>
          ) : achievementItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
                <ImageIcon className="h-10 w-10 text-amber-700" />
              </div>
              <h2 className="mt-6 text-3xl font-black text-slate-900">
                頁面正在建設中
              </h2>
              <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-600">
                我們正在整理淡江合氣道社的歷屆成果與活動資料，未來將在這裡展示成果展演、跨校交流與社團重要紀錄。
              </p>
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
                        {groupName}紀錄
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
                              <img
                                src={thumbnail}
                                alt={item.title}
                                className="h-60 w-full object-cover transition duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-60 items-center justify-center bg-slate-100 text-sm tracking-[0.18em] text-slate-400">
                                ACHIEVEMENT COVER
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
                                查看素材
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