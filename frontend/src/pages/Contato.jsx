import Navbar from '../components/Navbar'

export default function Contato() {
  const infos = [
    { icon: '📍', title: 'Endereço', info: 'R. João Alencar Guimarães, 574\nSta. Quitéria — Curitiba, PR' },
    { icon: '🕐', title: 'Horário', info: 'Seg a Sex: 7h às 22h\nSáb: 8h em diante' },
    { icon: '📱', title: 'WhatsApp', info: '(41) 99999-9999' },
    { icon: '📸', title: 'Instagram', info: '@pahragon' },
  ]

  const whatsappUrl = "https://wa.me/5541999999999"
  const instagramUrl = "https://instagram.com/pahragon"
  const mapaUrl = "https://maps.google.com/maps?q=Rua+Joao+Alencar+Guimaraes+574+Curitiba&output=embed"

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        <div className="mb-10">
          <span className="text-[#00c46a] text-xs font-bold tracking-widest uppercase">Fale com a gente</span>
          <h1 className="text-4xl font-black text-white mt-2">Contato</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {infos.map((item, i) => (
              <div key={i} className="bg-[#141414] border border-white/5 rounded-2xl p-5 flex gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#00c46a]/10 flex items-center justify-center text-xl shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">{item.title}</p>
                  <p className="text-white text-sm whitespace-pre-line">{item.info}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden h-64">
              <iframe
                title="Mapa"
                src={mapaUrl}
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
                allowFullScreen={true}
                loading="lazy"
              />
            </div>
            <a href={whatsappUrl} className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 rounded-2xl transition">
              <span className="text-xl">💬</span>
              Chamar no WhatsApp
            </a>
            <a href={instagramUrl} className="flex items-center justify-center gap-3 w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 rounded-2xl transition">
              <span className="text-xl">📸</span>
              Seguir no Instagram
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}