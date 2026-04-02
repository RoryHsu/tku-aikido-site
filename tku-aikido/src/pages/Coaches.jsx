import coach1 from "../assets/coaches/coach1.jpg";
import coach2 from "../assets/coaches/coach2.jpg";
import coach3 from "../assets/coaches/coach3.jpg";

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

export default function Coaches() {

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
        "負責社開課、閉課及課前暖身操，協助老師規劃不同色帶的進度。",

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

  return (

    <PageShell

      title="教練團隊"

      desc="淡江合氣道社由專業教練團隊指導，提供完整且系統化的武道訓練環境。"

    >

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

            </div>

          </div>

        ))}

      </div>

    </PageShell>

  );

}