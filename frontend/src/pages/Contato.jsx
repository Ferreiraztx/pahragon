import Navbar from "../components/Navbar";

export default function Contato() {
  const infos = [
    {
      icon: "📍",
      title: "Endereço",
      info: "R. João Alencar Guimarães, 574\nSta. Quitéria — Curitiba, PR",
    },
    {
      icon: "🕐",
      title: "Horário",
      info: "Seg a Sex: 7h às 22h\nSáb: 8h às 19h",
    },
  ];

  const whatsappUrl = "https://wa.me/5541999999999";
  const instagramUrl = "https://instagram.com/pahragon";
  const mapaUrl =
    "https://maps.google.com/maps?q=Rua+Joao+Alencar+Guimaraes+574+Curitiba&output=embed";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f5f1] text-[#2d3130] antialiased font-sans">
      <Navbar />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-80px] top-24 h-64 w-64 rounded-full bg-teal-100/60 blur-3xl" />
        <div className="absolute right-[-60px] top-52 h-72 w-72 rounded-full bg-emerald-100/50 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-slate-200/50 blur-3xl" />
      </div>

      <main className="relative max-w-6xl mx-auto px-6 pt-32 pb-20">
        <section className="mb-14 max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-teal-700">
            Fale com a gente
          </span>

          <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] text-[#1e2221] sm:text-5xl">
            Contato
          </h1>

          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            Estamos prontos para tirar suas dúvidas, agendar seu atendimento e
            receber você no nosso espaço com toda atenção.
          </p>
        </section>

        {/* 🛠️ items-stretch adicionado aqui para nivelar a altura das duas colunas */}
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.05fr_0.95fr] items-stretch">
          
          {/* COLUNA ESQUERDA (CARDS) */}
          <div className="flex flex-col gap-4 h-full">
            {infos.map((item, i) => (
              <div
                key={i}
                className="group rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,23,42,0.10)]"
              >
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-emerald-50 text-xl shadow-sm">
                    {item.icon}
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                      {item.title}
                    </p>
                    <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-[#1e2221] sm:text-[15px]">
                      {item.info}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* flex-1 inserido no card de atendimento rápido para preencher o resto da coluna */}
            <div className="flex-1 rounded-3xl border border-[#d8e7e3] bg-gradient-to-br from-[#0f766e] to-[#134e4a] p-6 text-white shadow-[0_16px_50px_rgba(15,118,110,0.20)]flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-teal-100">
                  Atendimento rápido
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  Prefere falar agora?
                </h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-teal-50/90">
                  Chame no WhatsApp ou Instagram para dúvidas e informações
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#134e4a] transition hover:scale-[1.02] hover:bg-teal-50 shadow-sm"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.455L0 24zm6.59-4.846c1.66.986 3.296 1.481 5.352 1.482 5.434 0 9.853-4.425 9.856-9.864.001-2.634-1.015-5.11-2.862-6.959C17.098 1.964 14.62 1.44 12.004 1.44c-5.439 0-9.858 4.425-9.86 9.864-.001 2.128.563 3.733 1.542 5.305L2.7 21.3l4.947-1.296z" />
                  </svg>
                  WhatsApp
                </a>

                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#134e4a] transition hover:scale-[1.02] hover:bg-teal-50 shadow-sm"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                  Instagram
                </a>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA (MAPA DINÂMICO) */}
          <div className="flex flex-col h-full min-h-[420px] lg:min-h-full">
            <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm flex flex-col flex-1">
              
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                    Localização
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#1e2221]">
                    Venha nos visitar
                  </p>
                </div>

                <a
                  href="https://maps.google.com/?q=Rua+Joao+Alencar+Guimaraes+574+Curitiba"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-teal-700 transition hover:text-teal-900"
                >
                  Abrir no Maps
                </a>
              </div>

              {/* Ajustado com flex-1 e relative para expandir o mapa proporcionalmente */}
              <div className="flex-1 bg-slate-100 relative min-h-[300px] lg:min-h-0">
                <iframe
                  title="Mapa"
                  src={mapaUrl}
                  className="absolute inset-0 w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                />
              </div>

            </div>
          </div>
        </section>
      </main>
    </div>
  );
}