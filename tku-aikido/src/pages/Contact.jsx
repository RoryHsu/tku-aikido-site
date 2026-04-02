import { Instagram, Facebook, Mail, MapPin } from "lucide-react";

function PageShell({ title, desc, children }) {
  return (
    <div>
      <section className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-14">
          <div className="text-sm font-semibold tracking-[0.24em] text-amber-700">
            TAMKANG UNIVERSITY AIKIDO CLUB
          </div>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            {title}
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            {desc}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-10 lg:py-16">
        {children}
      </section>
    </div>
  );
}

export default function Contact() {
  return (
    <PageShell
      title="聯絡我們"
      desc="歡迎透過社群平台與 Email 聯絡淡江大學合氣道社，也可直接查看社課場地位置。"
    >
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.25fr]">
        {/* 左側：聯絡資訊 */}
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
          <div className="mb-6">
            <div className="text-sm font-semibold tracking-[0.2em] text-amber-700">
              CONTACT INFO
            </div>
            <h2 className="mt-3 text-3xl font-black text-slate-900">
              聯絡方式
            </h2>
            <p className="mt-3 leading-8 text-slate-600">
              若想加入社團、參加體驗課，或了解更多社課與活動資訊，歡迎透過以下方式與我們聯絡。
            </p>
          </div>

          <div className="space-y-4">
            <a
              href="https://www.instagram.com/tku.aikido?igsh=MWFpNzZzemNwcmE2ag=="
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:text-amber-700"
            >
              <Instagram className="h-5 w-5 text-amber-700" />
              <span>Instagram：tku.aikido</span>
            </a>

            <a
              href="https://www.facebook.com/share/1FwxQNkGYD/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:text-amber-700"
            >
              <Facebook className="h-5 w-5 text-amber-700" />
              <span>Facebook：淡江大學合氣道社</span>
            </a>

            <a
              href="mailto:3019@tkueca.org"
              className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:text-amber-700"
            >
              <Mail className="h-5 w-5 text-amber-700" />
              <span>Email: 3019@tkueca.org</span>
            </a>

            <a
              href="https://maps.app.goo.gl/xziDUuh7cazrTfR46"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:text-amber-700"
            >
              <MapPin className="h-5 w-5 text-amber-700" />
              <span>淡江大學紹謨紀念體育館軟墊區</span>
            </a>
          </div>

          <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-lg font-bold text-slate-900">社課地點</div>
            <p className="mt-2 leading-7 text-slate-600">
              淡江大學紹謨紀念體育館軟墊區
            </p>
            <p className="mt-2 text-sm text-slate-500">
              建議第一次來訪可先透過 Instagram 或 Facebook 與社團聯繫。
            </p>
          </div>
        </div>

        {/* 右側：大地圖 */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="text-sm font-semibold tracking-[0.2em] text-amber-700">
              LOCATION
            </div>
            <h2 className="mt-2 text-3xl font-black text-slate-900">
              社團位置
            </h2>
            <p className="mt-3 leading-8 text-slate-600">
              可直接開啟 Google 地圖查看路線與實際位置。
            </p>
          </div>

          <iframe
            src="https://www.google.com/maps?q=淡江大學紹謨紀念體育館&output=embed"
            width="100%"
            height="520"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="淡江大學紹謨紀念體育館軟墊區地圖"
          ></iframe>
        </div>
      </div>
    </PageShell>
  );
}