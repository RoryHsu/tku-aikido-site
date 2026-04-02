import { CalendarDays } from "lucide-react";

function PageShell({ title, desc, children }) {
  return (
    <div>
      <section className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="text-sm font-semibold tracking-[0.24em] text-amber-700">
            CLASSES
          </div>

          <h1 className="mt-4 text-5xl font-black tracking-tight text-slate-900">
            社課資訊
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            固定時段訓練，培養穩定的練習節奏。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid gap-8 md:grid-cols-3">

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <CalendarDays className="h-6 w-6 text-amber-700" />

            <div className="mt-4 text-sm font-semibold tracking-[0.18em] text-slate-500">
              週二 Tuesday
            </div>

            <div className="mt-2 text-3xl font-black text-slate-900">
              20:00 – 22:00
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <CalendarDays className="h-6 w-6 text-amber-700" />

            <div className="mt-4 text-sm font-semibold tracking-[0.18em] text-slate-500">
              週四 Thursday
            </div>

            <div className="mt-2 text-3xl font-black text-slate-900">
              20:00 – 22:00
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <CalendarDays className="h-6 w-6 text-amber-700" />

            <div className="mt-4 text-sm font-semibold tracking-[0.18em] text-slate-500">
              週五 Friday（自由加練）
            </div>

            <div className="mt-2 text-3xl font-black text-slate-900">
              20:00 – 22:00
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}

export default function Classes() {
  return <PageShell />;
}