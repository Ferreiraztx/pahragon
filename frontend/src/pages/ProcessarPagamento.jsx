import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function ProcessarPagamento() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Pega o ID da reserva na URL de forma segura
    const params = new URLSearchParams(window.location.search);
    let bookingId = params.get("bookingId");
    if (!bookingId) {
      const match = window.location.search.match(/[?&]bookingId=(\d+)/);
      bookingId = match ? match[1] : null;
    }

    if (bookingId) {
      // Pergunta para o back-end: "Foi pago?"
      api.post("/payments/confirmar", { bookingId: Number(bookingId) })
        .then((res) => {
          if (res.data.pago) {
            // 🟩 Se o banco disser que está pago, vai para a tela de Sucesso!
            navigate(`/pagamento/sucesso?bookingId=${bookingId}`);
          } else {
            // 🟥 Se o banco disser que não está pago, vai para a tela de Falha!
            navigate(`/pagamento/falha?bookingId=${bookingId}`);
          }
        })
        .catch((err) => {
          console.error(err);
          navigate(`/pagamento/falha?bookingId=${bookingId}`);
        });
    } else {
      navigate("/agendar");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e2221]"></div>
      <p className="mt-4 text-sm font-medium text-slate-500">Verificando status do pagamento...</p>
    </div>
  );
}