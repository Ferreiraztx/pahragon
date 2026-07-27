# 🎾 Pahragon Beach Tennis — Plataforma de Gestão e Agendamento de Quadras

![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/React-18+-blue?style=for-the-badge&logo=react)
![Express](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css)

A **Pahragon Beach Tennis** é uma plataforma Full-Stack web de alto desempenho para agendamento automatizado de quadras de Beach Tennis, gestão de aluguel de equipamentos extras (raquetes) e controle total de caixa/agenda via painel administrativo.

O sistema elimina o gargalo de agendamentos manuais via WhatsApp, contando com checkout direto integrado ao **Mercado Pago**, disparos automáticos de confirmação por e-mail (**Resend**) e conformidade com as exigências da **LGPD**.

---

## 🚀 Principais Funcionalidades

### 🎾 Área do Atleta (Front-End)
* **Agendamento em Menos de 1 Minuto:** Visualização clara de horários disponíveis em tempo real com controle dinâmico por blocos de 30 minutos (mínimo de 1h por reserva).
* **Aluguel de Equipamentos Extras:** Adição dinâmica de raquetes ao agendamento com recálculo instantâneo do valor total.
* **Validação de Grade:** Algoritmos que impedem buracos isolados na agenda (ex: intervalos vagos de apenas 30 minutos).
* **Checkout via Mercado Pago:** Pagamento via Pix com temporizador regressivo de segurança de 10 minutos para liberação automática do horário caso não seja pago.
* **Histórico e Status:** Painel "Minhas Reservas" com acompanhamento de agendamentos passados, pendentes, confirmados e detalhamento de equipamentos adicionados.

### 🛡️ Painel Administrativo do Balcão (Admin)
* **Agenda Interativa em Tempo Real:** Visualização no padrão FullCalendar dividida por quadras, status de pagamento e bloqueios.
* **Reserva Manual Rápida:** Criação de agendamentos no balcão com cálculo financeiro automático e integrado aos valores oficiais de hora/equipamento.
* **Gerenciamento de Grade:** Possibilidade de bloqueio de horários para aulas, eventos ou manutenção.
* **Ações Rápidas:** Alteração de status financeiro (Pago/Pendente) e exclusão/cancelamento instantâneo.

### 🔒 Blindagem Jurídica, LGPD e Segurança
* **Módulo de Exclusão & Anonimização:** Exclusão lógica dos dados pessoais (Nome, CPF, E-mail e Telefone) para conformidade total com a LGPD, preservando a integridade do histórico financeiro do caixa da arena.
* **Trava contra Fraudes de Identidade:** Bloqueio de alteração de CPF após a primeira validação.
* **Prevenção de Dup-Payment:** Travas no back-end impedindo cobranças duplicadas para reservas já confirmadas.

---

## 🛠️ Tecnologias Utilizadas

### **Front-End**
* **React.js** + **React Router DOM**
* **Tailwind CSS** (Design responsivo Off-White limpo e moderno)
* **FullCalendar** (TimeGrid e DayGrid)
* **Axios** (Comunicação otimizada com a API)

### **Back-End**
* **Node.js** & **Express.js**
* **Prisma ORM** (Gerenciamento de banco de dados relacional)
* **Mercado Pago SDK** (Processamento de pagamentos Pix/Cartão)
* **Resend API** (Envio transacional de e-mails de confirmação)
* **JWT & Bcrypt** (Autenticação segura e hash de senhas)

---

## 📦 Estrutura do Projeto

```text
pahragon-beach-tennis/
├── backend/
│   ├── src/
│   │   ├── controllers/   # Regras de negócio (bookings, payments, auth, etc.)
│   │   ├── middlewares/   # Autenticação JWT e validações
│   │   ├── routes/        # Definição de endpoints da API
│   │   └── services/      # Integrações de terceiros (Mercado Pago, Resend)
│   ├── prisma/            # Schema do banco de dados e migrations
│   └── server.js          # Ponto de entrada da aplicação Express
│
└── frontend/
    ├── src/
    │   ├── components/    # AgendaAdmin, Modais e Layouts
    │   ├── pages/         # Booking, PagamentoAguardando, MinhasReservas, etc.
    │   └── services/      # Configuração da instância do Axios
    └── public/
🔧 Como Executar o Projeto Localmente
Pré-requisitos
Node.js (v18 ou superior)

PostgreSQL ou MySQL (ou SQLite para ambiente de desenvolvimento via Prisma)

1. Clonar o repositório
Bash
git clone [https://github.com/seu-usuario/pahragon-beach-tennis.git](https://github.com/seu-usuario/pahragon-beach-tennis.git)
cd pahragon-beach-tennis
2. Configurar o Back-end
Bash
cd backend
npm install
Crie um arquivo .env na raiz da pasta backend com as variáveis necessárias:

Snippet de código
PORT=3001
DATABASE_URL="postgresql://usuario:senha@localhost:5432/pahragon_db"
JWT_SECRET="sua_chave_secreta_jwt"
MP_ACCESS_TOKEN="seu_token_mercado_pago"
RESEND_API_KEY="sua_chave_resend"
FRONTEND_URL="http://localhost:5173"
Execute as migrações do banco de dados e inicie o servidor:

Bash
npx prisma migrate dev
npm run dev
3. Configurar o Front-end
Em outro terminal:

Bash
cd frontend
npm install
npm run dev
Acesse no seu navegador em: http://localhost:5173

⚡ Tratamento de Cache em Servidores
O servidor Express está pré-configurado com cabeçalhos HTTP rigorosos para evitar problemas de cache estático em navegadores mobile (iOS Safari e Android Chrome):

JavaScript
res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
📄 Licença
Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

Developed with ❤️ by [Seu Nome / Sua Empresa]
