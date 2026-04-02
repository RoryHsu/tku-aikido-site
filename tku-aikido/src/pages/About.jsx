function PageShell({ title, desc, children }) {
  return (
    <div>
      <section className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="text-sm font-semibold tracking-[0.24em] text-amber-700">
            TAMKANG UNIVERSITY AIKIDO CLUB
          </div>
          <h1 className="mt-4 text-5xl font-black tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            {desc}
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        {children}
      </section>
    </div>
  );
}

export default function About() {
  return (
    <PageShell title="關於本社" desc="介紹社團理念、訓練精神與組織文化。">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
          <div className="text-2xl font-black text-slate-900">社團理念</div>
          <p className="mt-4 leading-8 text-slate-600">
            透過合氣道學習身體控制、禮法與合作，讓訓練不只是技術，也是一種長期養成。
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
          <div className="text-2xl font-black text-slate-900">社團文化</div>
          <p className="mt-4 leading-8 text-slate-600">
            重視傳承、紀律與彼此支持，建立有溫度也有制度的大學社團環境。
          </p>
        </div>
      </div>
    </PageShell>
  );
}