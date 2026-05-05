import { CalendarDays, ShieldCheck, Smile } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import photo1 from "../assets/home/photo1.jpg";
import photo2 from "../assets/home/photo2.jpg";
import video1 from "../assets/home/video1.mp4";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <Navbar />

      <main>
        <section className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-24">
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
                淡江合氣道社
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                透過合氣道學習身體控制、禮法與合作，讓訓練不只是技術，
                也是一種長期養成。
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#about"
                  className="rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800"
                >
                  了解本社
                </a>

                <a
                  href="#contact"
                  className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:border-slate-950 hover:text-slate-950"
                >
                  立即聯絡
                </a>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <CalendarDays className="text-amber-700" size={22} />
                  <div className="mt-4 text-2xl font-black text-slate-950">
                    2節 / 週
                  </div>
                  <div className="mt-1 text-sm text-slate-500">固定社課</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <ShieldCheck className="text-amber-700" size={22} />
                  <div className="mt-4 text-2xl font-black text-slate-950">
                    自我防護
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    保護自身安全
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <Smile className="text-amber-700" size={22} />
                  <div className="mt-4 text-2xl font-black text-slate-950">
                    新手友善
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    0基礎也可以，循序入門
                  </div>
                </div>
              </div>
            </div>

            <div className="grid content-center gap-5">
              <div className="overflow-hidden rounded-3xl bg-black shadow-sm">
                <video
                  src={video1}
                  controls
                  className="h-72 w-full object-cover sm:h-80 lg:h-96"
                  poster=""
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <img
                  src={photo1}
                  alt="淡江合氣道社活動照片"
                  className="h-44 w-full rounded-3xl object-cover shadow-sm"
                />

                <img
                  src={photo2}
                  alt="淡江合氣道社社課照片"
                  className="h-44 w-full rounded-3xl object-cover shadow-sm"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <div className="text-sm font-bold tracking-[0.3em] text-amber-700">
                ABOUT
              </div>

              <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
                社團簡介
              </h2>

              <p className="mt-5 text-base leading-8 text-slate-600">
                淡江合氣道社致力於推廣合氣道與武道文化，訓練內容包含受身、
                體術、關節技、投技，以及木劍與短杖等延伸課程。
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
                <h3 className="text-2xl font-black text-slate-950">
                  武道精神
                </h3>
                <p className="mt-4 leading-8 text-slate-600">
                  重視禮法、專注、穩定與尊重，培養長期練習的態度。
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
                <h3 className="text-2xl font-black text-slate-950">
                  多元訓練
                </h3>
                <p className="mt-4 leading-8 text-slate-600">
                  從基本受身到體術、武器，逐步建立完整訓練基礎。
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
                <h3 className="text-2xl font-black text-slate-950">
                  社團傳承
                </h3>
                <p className="mt-4 leading-8 text-slate-600">
                  透過迎新、社課、演武與成果展示，延續社團經驗與交流。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="bg-slate-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
              <div>
                <div className="text-sm font-bold tracking-[0.3em] text-slate-400">
                  JOIN US
                </div>

                <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                  歡迎加入淡江合氣道社
                </h2>

                <p className="mt-5 max-w-3xl leading-8 text-slate-300">
                  無論你是否有武術經驗，都可以從基礎開始練習。歡迎透過
                  Instagram、Facebook 或 Email 聯絡我們。
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="text-sm leading-8 text-slate-300">
                  Instagram：tku.aikido
                  <br />
                  Facebook：淡江大學合氣道社
                  <br />
                  Email：30190@tkueca.org
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}