import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import api from '../services/api'

export default function Torneios() {
  const [torneios, setTorneios] = useState([])

  useEffect(() => {
    api.get('/tournaments').then(res => setTorneios(res.data))
  }, [])

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#2d3130] antialiased tracking-tight font-sans text-base pt-20">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        
        {/* Cabeçalho Editorial */}
        <div className="mb-12 border-b border-slate-200/80 pb-8">
          <span className="text-xs font-extrabold uppercase tracking-widest text-teal-600">Competições</span>
          <h1 className="text-4xl sm:text-5xl font-black text-[#1e2221] tracking-tighter mt-1">Torneios</h1>
          <p className="text-slate-500 text-sm sm:text-base mt-2 max-w-xl font-normal leading-relaxed">
            Confira o calendário de competições ativas na arena, prepare sua dupla e garanta sua vaga.
          </p>
        </div>

        {/* Estado Vazio (Estilo Alerta do Admin) */}
        {torneios.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
            <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center mx-auto mb-4 text-xl">
              🏆
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">Nenhum torneio ativo</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">
              Novas competições estão sendo planejadas. Fique atento às nossas redes sociais.
            </p>
          </div>
        ) : (
          
          /* Grid de Torneios Ativos */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {torneios.map(t => {
              // 💡 FUNÇÃO DINÂMICA: Gera o link correto para o WhatsApp do torneio específico
              const gerarLinkInscricao = () => {
                let numeroDestino = t.whatsapp ? String(t.whatsapp).replace(/\D/g, "") : "";
                
                if (!numeroDestino) {
                  return "#";
                }

                // Garante que tenha o prefixo do país (55 - Brasil)
                if (!numeroDestino.startsWith("55")) {
                  numeroDestino = `55${numeroDestino}`;
                }

                // Mensagem customizada usando o nome do torneio criado
                const mensagem = `Olá! Vi o torneio "${t.nome}" no site e gostaria de realizar a inscrição da minha dupla, ainda restam vagas?`;
                
                return `https://wa.me/${numeroDestino}?text=${encodeURIComponent(mensagem)}`;
              };

              const linkWhatsApp = gerarLinkInscricao();

              return (
                <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-slate-300 flex flex-col justify-between transition-all group">
                  
                  <div>
                    {/* Título do Torneio */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="text-[#1e2221] font-black text-xl tracking-tight leading-snug">
                        {t.nome}
                      </h3>
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${
                        t.status === 'aberto' ? 'bg-teal-100 text-teal-900' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {t.status === 'aberto' ? 'Inscrições Abertas' : 'Encerrado'}
                      </span>
                    </div>

                    {/* Descrição opcional */}
                    {t.descricao && (
                      <p className="text-slate-500 text-sm font-normal mb-6 leading-relaxed">
                        {t.descricao}
                      </p>
                    )}
                    
                    {/* Informações técnicas organizadas como Metadados do Admin */}
                    <div className="grid grid-cols-3 gap-4 border-t border-b border-slate-100 py-4 mb-6">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Data</span>
                        <span className="text-sm font-mono font-bold text-slate-800">
                          {new Date(t.data).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Duplas</span>
                        <span className="text-sm font-mono font-bold text-slate-800">
                          {t.vagas} restando
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Inscrição</span>
                        <span className="text-sm font-mono font-bold text-teal-600">
                          R$ {Number(t.preco).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botão de Ação Condicional */}
                  {t.status === 'aberto' ? (
                    linkWhatsApp === "#" ? (
                      <button 
                        onClick={() => alert("Este torneio não possui um número de contato configurado.")}
                        className="block w-full text-center bg-slate-400 text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl"
                      >
                        Contato Indisponível
                      </button>
                    ) : (
                      <a 
                        href={linkWhatsApp} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center bg-[#1e2221] hover:bg-black text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition shadow-sm group-hover:shadow-md"
                      >
                        Inscrever via WhatsApp
                      </a>
                    )
                  ) : (
                    <button 
                      disabled 
                      className="block w-full text-center bg-slate-50 border border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl cursor-not-allowed"
                    >
                      Vagas Esgotadas
                    </button>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  )
}