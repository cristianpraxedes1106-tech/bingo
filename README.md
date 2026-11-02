# Bolla — plataforma de bingo

> Nome de trabalho; a identidade da marca ainda pode ser alterada.

Plataforma web para organizar partidas recreativas de bingo em eventos presenciais, com painel de host, entrada por QR Code, cartelas digitais e sorteio sincronizado.

## Stack

- HTML, CSS e JavaScript (ES modules)
- Vite
- Bootstrap 6.0.0-alpha.1
- Bootstrap Icons
- Supabase (Postgres, Auth, Realtime e Edge Functions — integração preparada para a próxima etapa)
- QRCode.js, html5-qrcode, GSAP e SweetAlert2

## Requisitos

- Node.js 20.19+ ou 22.12+
- npm

## Desenvolvimento

```bash
npm install
npm run dev
```

## Estado atual

A primeira entrega é um protótipo funcional de interface e motor local: criação de sala, geração de cartela, sorteio sem repetição, histórico e validação local de padrões. O QR Code abre a rota de jogador, mas partidas entre dispositivos ainda dependem da configuração do Supabase e das políticas do banco. Não use este protótipo local como sistema oficial de resultados.

## Configuração futura do Supabase

1. Crie um projeto Supabase.
2. Copie `.env.example` para `.env`.
3. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Aplique as migrations em `supabase/migrations/`.

Nunca coloque `service_role` ou qualquer segredo administrativo em variáveis `VITE_` ou no frontend.

## Regras de produto

O projeto é voltado a eventos recreativos gratuitos. Não inclui apostas, cobrança por cartela ou prêmios em dinheiro. Para partidas reais, sorteio e validação devem ser executados no servidor.

## Bootstrap

O projeto usa Bootstrap 6.0.0-alpha.1 por ser a linha 6 disponível nesta fase. É uma versão alpha e pode sofrer alterações incompatíveis antes da versão estável.