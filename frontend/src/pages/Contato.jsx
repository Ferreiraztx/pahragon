import Navbar from '../components/Navbar'

export default function Contato() {
  const infos = [
    { icon: '📍', title: 'Endereço', info: 'R. João Alencar Guimarães, 574\nSta. Quitéria — Curitiba, PR' },
    { icon: '🕐', title: 'Horário', info: 'Seg a Sex: 7h às 22h\nSáb: 8h às 19h' },
    { icon: '📱', title: 'WhatsApp', info: '(41) 99999-9999' },
    { icon: '📸', title: 'Instagram', info: '@pahragon' },
  ]

  const whatsappUrl = "https://wa.me/5541999999999"
  const instagramUrl = "https://instagram.com/pahragon"
  const mapaUrl = "https://maps.google.com/maps?q=Rua+Joao+Alencar+Guimaraes+574+Curitiba&output=embed"

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#2d3130] antialiased tracking-tight font-sans">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        {/* Título da Página com Tipografia Editorial */}
        <div className="mb-12">
          <span className="text-teal-600 text-xs font-extrabold tracking-widest uppercase block mb-1">
            Fale com a gente
          </span>
          <h1 className="text-4xl font-black text-[#1e2221] tracking-tighter">
            Contato
          </h1>
        </div>

        {/* Layout em Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Coluna da Esquerda: Cards de Informação */}
          <div className="space-y-4">
            {infos.map((item, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 flex gap-4 shadow-sm hover:border-slate-300 transition-all">
                <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-xl shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                    {item.title}
                  </p>
                  <p className="text-[#1e2221] text-sm font-medium whitespace-pre-line leading-relaxed">
                    {item.info}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Coluna da Direita: Mapa e Ações Sociais */}
          <div className="space-y-4">
            {/* Container do Mapa Integrado sem o Filtro Dark */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden h-64 shadow-sm">
              <iframe
                title="Mapa"
                src={mapaUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
              />
            </div>

            {/* Links de Ação como Botões Estruturados */}
            <div className="grid grid-cols-1 gap-3 pt-2">
              <a 
                href={whatsappUrl} 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full bg-[#1e2221] hover:bg-black text-white font-bold py-4 rounded-xl transition shadow-sm text-sm tracking-wide"
              >
                <span className="text-lg">💬</span>
                Chamar no WhatsApp
              </a>

              <a 
                href={instagramUrl} 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-bold py-4 rounded-xl transition shadow-sm text-sm tracking-wide"
              >
                <span className="text-lg">📸</span>
                Seguir no Instagram
              </a>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}