# Bolla — bingo social

Plataforma web para organizar partidas recreativas de bingo em eventos presenciais, com painel do organizador, entrada por QR Code, cartelas digitais e sorteios sincronizados entre dispositivos.

## Stack

- HTML, CSS e JavaScript (ES modules)
- Vite
- Bootstrap 6.0.0-alpha.1 e Bootstrap Icons
- PeerJS + WebRTC para conexão direta entre organizador e jogadores
- QRCode, GSAP e SweetAlert2

## Como funciona o multiplayer

1. O organizador cria e configura a sala.
2. Ao iniciar, o Bolla cria um identificador PeerJS e gera o QR Code com esse identificador.
3. Cada celular abre o link do QR Code e estabelece uma conexão WebRTC com o organizador.
4. O organizador transmite os números sorteados e o estado da partida para os celulares conectados.

Não é necessário criar conta, fazer login ou configurar um banco de dados. O PeerJS usa um serviço público de sinalização para localizar os dispositivos; depois, os dados da partida trafegam pela conexão WebRTC entre eles.

**Importante:** mantenha a aba do organizador aberta e conectada à internet durante toda a partida. Se o organizador fechar a página ou perder a conexão, os jogadores serão desconectados. A sala não fica armazenada em nuvem e não há recuperação automática após encerrar a sessão. A disponibilidade do serviço público de sinalização e as configurações de rede dos dispositivos também podem afetar a conexão.

## Requisitos

- Node.js 20.19+ ou 22.12+
- npm

## Desenvolvimento

```bash
npm install
npm run dev
```

## Publicação no GitHub Pages

O deploy é feito automaticamente pelo GitHub Actions a cada atualização na branch `main`.

1. No repositório, abra **Settings → Pages**.
2. Em **Build and deployment → Source**, selecione **GitHub Actions**.
3. Acompanhe a publicação na aba **Actions**.

Site: https://cristianpraxedes1106-tech.github.io/bingo/

## Regras de produto

O projeto é voltado a eventos recreativos gratuitos. Não inclui apostas, cobrança por cartela ou prêmios em dinheiro.

## Bootstrap

O projeto usa Bootstrap 6.0.0-alpha.1, uma versão alpha que pode sofrer alterações incompatíveis antes da versão estável.
