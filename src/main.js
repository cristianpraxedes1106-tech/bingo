import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap";
import "./styles.css";
import QRCode from "qrcode";
import Swal from "sweetalert2";
import { gsap } from "gsap";
import { createCard, createDrawPool, drawNumber, getLetter, hasBingo, LETTERS } from "./lib/bingo.js";

const app = document.querySelector("#app");
const params = new URLSearchParams(window.location.search);
const isPlayerRoute = params.get("view") === "player";
const STORAGE_KEY = "bolla-demo-room";
let room = loadRoom();
let playerCard = loadPlayerCard();
let markedNumbers = new Set();
let scanner = null;

function loadRoom() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
}

function saveRoom() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(room));
}

function loadPlayerCard() {
  try {
    return JSON.parse(localStorage.getItem("bolla-player-card")) || null;
  } catch {
    return null;
  }
}

function savePlayerCard() {
  localStorage.setItem("bolla-player-card", JSON.stringify(playerCard));
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function createRoom() {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  room = {
    code,
    title: "Bingo da galera",
    prize: "Um prêmio surpresa",
    mode: "line",
    status: "waiting",
    started: false,
    pool: createDrawPool(),
    called: [],
    createdAt: new Date().toISOString()
  };
  saveRoom();
  renderHost();
}

function roomUrl() {
  return new URL(`?view=player&room=${room.code}`, window.location.href).toString();
}

function renderShell(content, active = "host") {
  app.innerHTML = `
    <div class="app-shell">
      <nav class="topbar">
        <a class="brand" href="./" aria-label="Bolla início">
          <span class="brand-mark"><i class="bi bi-circle-fill"></i><i class="bi bi-stars"></i></span>
          <span>bolla<span class="brand-dot">.</span></span>
        </a>
        <div class="topbar-right">
          <span class="demo-pill"><span></span> MODO DEMONSTRAÇÃO</span>
          <a class="top-link ${active === "host" ? "active" : ""}" href="./"><i class="bi bi-display"></i><span>Organizador</span></a>
        </div>
      </nav>
      ${content}
      <footer class="footer-note">Feito para reunir pessoas. <span>Jogue junto. Celebre junto.</span></footer>
    </div>`;
}

function renderLanding() {
  renderShell(`
    <main class="landing container">
      <section class="hero-grid">
        <div class="hero-copy">
          <div class="eyebrow"><span class="eyebrow-spark">✳</span> SEU EVENTO, OUTRO NÍVEL</div>
          <h1>O próximo grito<br />de <span class="text-gradient">BINGO!</span></h1>
          <p class="hero-description">Crie sua sala, compartilhe o QR Code e deixe a diversão acontecer. O bingo da sua galera começa aqui.</p>
          <div class="hero-actions">
            <button class="btn btn-primary btn-lg rounded-pill px-4" id="create-room"><i class="bi bi-plus-lg me-2"></i>Criar uma sala</button>
            <button class="btn btn-outline-light btn-lg rounded-pill px-4" id="join-room"><i class="bi bi-qr-code-scan me-2"></i>Entrar em uma sala</button>
          </div>
          <div class="hero-proof"><span class="avatar-stack"><b>🎉</b><b>🎱</b><b>✨</b></span><span>Simples de organizar. Fácil de jogar.</span></div>
        </div>
        <div class="hero-art" aria-label="Ilustração de bolas coloridas de bingo">
          <div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>
          <div class="floating-ball ball-b">B</div><div class="floating-ball ball-7">7</div>
          <div class="floating-ball ball-42">42</div><div class="floating-ball ball-68">68</div>
          <div class="hero-ticket"><div class="ticket-top"><span>B</span><span>I</span><span>N</span><span>G</span><span>O</span></div><div class="ticket-grid">
            ${Array.from({length:25},(_,i)=>`<span class="${[1,6,12,18,23].includes(i)?"ticket-hit":""}">${i===12?"★":[3,8,14,20,25,31,39,46,52,61,67,72,11,19,28,34,43,55,63,70,5,16,37,49][i%24]}</span>`).join("")}
          </div><div class="ticket-shine"></div></div>
          <span class="spark spark-a">✦</span><span class="spark spark-b">✧</span><span class="spark spark-c">✳</span>
        </div>
      </section>
      <section class="feature-strip">
        <div><i class="bi bi-qr-code"></i><span><b>Entrada rápida</b><small>Um QR Code e pronto</small></span></div>
        <div><i class="bi bi-phone"></i><span><b>No celular</b><small>Cada pessoa com sua cartela</small></span></div>
        <div><i class="bi bi-stars"></i><span><b>Ao vivo</b><small>Todo mundo acompanha junto</small></span></div>
      </section>
      <section class="how-section">
        <div><span class="section-kicker">SEM COMPLICAÇÃO</span><h2>Três passos.<br/><span>Uma baita diversão.</span></h2></div>
        <div class="step-list"><article><b>01</b><div><strong>Crie sua sala</strong><p>Escolha o nome, o prêmio recreativo e a modalidade.</p></div></article><article><b>02</b><div><strong>Convide a galera</strong><p>Mostre o QR Code para cada pessoa entrar pelo celular.</p></div></article><article><b>03</b><div><strong>Comece a partida</strong><p>Sorteie os números e acompanhe quem completa a cartela.</p></div></article></div>
      </section>
    </main>`);
  document.querySelector("#create-room").addEventListener("click", createRoom);
  document.querySelector("#join-room").addEventListener("click", askRoomCode);
}

async function askRoomCode() {
  const { value } = await Swal.fire({
    title: "Entrar em uma sala",
    text: "Digite o código exibido pelo organizador.",
    input: "text",
    inputPlaceholder: "Ex.: A7K2QX",
    confirmButtonText: "Continuar",
    showCancelButton: true,
    cancelButtonText: "Voltar",
    inputAttributes: { maxlength: 6, autocapitalize: "characters" }
  });
  if (value) {
    window.location.href = `?view=player&room=${encodeURIComponent(value.trim().toUpperCase())}`;
  }
}

function renderHost() {
  if (!room) return renderLanding();
  const setup = !room.started;
  const content = setup ? `
    <main class="dashboard container">
      <div class="page-heading">
        <div><div class="eyebrow"><span class="eyebrow-spark">✳</span> CENTRAL DO ORGANIZADOR</div><h1>Prepare sua<br/><span class="text-gradient">partida.</span></h1><p>Configure tudo com calma. A sala só começa quando você der o sinal.</p></div>
        <button class="btn btn-outline-light rounded-pill" id="new-room"><i class="bi bi-plus-lg me-2"></i>Nova sala</button>
      </div>
      <div class="room-layout setup-layout">
        <section class="main-panel setup-preview">
          <div class="panel-heading"><div><span class="section-kicker">PRÉVIA DA SALA</span><h2 id="preview-title">${escapeHtml(room.title)}</h2></div><span class="status-chip waiting"><i></i>Em preparação</span></div>
          <div class="setup-welcome"><div class="setup-icon"><i class="bi bi-tv"></i></div><div><h3>Sua tela de sorteio vai aparecer aqui.</h3><p>Ideal para deixar esta página aberta na TV ou projetor. Antes de iniciar, ajuste as opções ao lado.</p></div></div>
          <div class="setup-steps">
            <div class="setup-step"><span>1</span><div><b>Personalize a rodada</b><p>Dê um nome ao evento, defina o prêmio recreativo e escolha como alguém vence.</p></div><i class="bi bi-sliders"></i></div>
            <div class="setup-step"><span>2</span><div><b>Confira antes de começar</b><p>Veja se o nome e a modalidade estão certos. Depois de iniciar, a sala fica pronta para receber participantes.</p></div><i class="bi bi-check2-circle"></i></div>
            <div class="setup-step"><span>3</span><div><b>Mostre o QR Code e dê o play</b><p>Com a sala iniciada, o código de entrada aparece aqui para você exibir na TV.</p></div><i class="bi bi-qr-code"></i></div>
          </div>
          <div class="setup-notice"><i class="bi bi-info-circle"></i><span><b>Importante:</b> a versão atual ainda está em demonstração local. O QR será gerado, mas para celulares diferentes entrarem na mesma sala precisamos conectar o Supabase.</span></div>
        </section>
        <aside class="side-column">
          <section class="side-card settings-card setup-settings">
            <div class="side-card-head"><span class="section-kicker">1. CONFIGURE SUA SALA</span><i class="bi bi-toggles"></i></div>
            <label class="form-label mt-3" for="event-title">Nome do evento</label><input class="form-control custom-input" id="event-title" value="${escapeHtml(room.title)}" maxlength="50" placeholder="Ex.: Bingo da festa junina"/>
            <label class="form-label mt-3" for="event-prize">Prêmio recreativo</label><input class="form-control custom-input" id="event-prize" value="${escapeHtml(room.prize)}" maxlength="80" placeholder="Ex.: Kit de chocolates"/>
            <label class="form-label mt-3" for="game-mode">Como ganha?</label><select class="form-select custom-input" id="game-mode"><option value="line" ${room.mode==="line"?"selected":""}>Uma linha</option><option value="column" ${room.mode==="column"?"selected":""}>Uma coluna</option><option value="diagonal" ${room.mode==="diagonal"?"selected":""}>Diagonal</option><option value="corners" ${room.mode==="corners"?"selected":""}>Quatro cantos</option><option value="full" ${room.mode==="full"?"selected":""}>Cartela cheia</option></select>
            <div class="setup-summary"><small>RESUMO</small><b id="summary-title">${escapeHtml(room.title)}</b><span id="summary-mode">Vitória: Uma linha</span></div>
            <button class="btn btn-primary btn-lg rounded-pill w-100 mt-3" id="start-room"><i class="bi bi-play-fill me-2"></i>Salvar e iniciar sala</button>
            <p class="setup-hint"><i class="bi bi-lightbulb"></i> O QR Code só aparece depois que você iniciar.</p>
          </section>
        </aside>
      </div>
    </main>` : `
    <main class="dashboard container">
      <div class="page-heading">
        <div><div class="eyebrow"><span class="eyebrow-spark">✳</span> CENTRAL DO ORGANIZADOR</div><h1>Sua sala está<br/><span class="text-gradient">no ar.</span></h1><p>Mostre o QR Code na TV e conduza a rodada por aqui.</p></div>
        <button class="btn btn-outline-light rounded-pill" id="new-room"><i class="bi bi-plus-lg me-2"></i>Nova sala</button>
      </div>
      <div class="room-layout">
        <section class="main-panel">
          <div class="panel-heading"><div><span class="section-kicker">SUA PARTIDA</span><h2>${escapeHtml(room.title)}</h2></div><span class="status-chip ${room.status}"><i></i>${statusLabel()}</span></div>
          <div class="draw-stage">
            <div class="draw-meta"><span>ÚLTIMO NÚMERO</span><span>${room.called.length} / 75 SORTEADOS</span></div>
            <div class="draw-ball-wrap"><div class="draw-ball" id="draw-ball"><span id="draw-letter">${room.called.length ? getLetter(room.called.at(-1)) : "?"}</span><strong id="draw-number">${room.called.length ? room.called.at(-1) : "—"}</strong></div><div class="draw-glow"></div></div>
            <p class="draw-caption" id="draw-caption">${room.called.length ? "Número sorteado. Boa sorte!" : "Tudo pronto. Faça o primeiro sorteio quando quiser."}</p>
            <div class="draw-actions">
              <button class="btn btn-primary btn-lg rounded-pill px-4" id="draw-now" ${room.status === "finished" || room.status === "paused" ? "disabled" : ""}><i class="bi bi-shuffle me-2"></i>Sortear número</button>
              <button class="btn btn-soft btn-lg rounded-pill" id="toggle-pause" ${room.called.length === 0 ? "disabled" : ""}><i class="bi bi-${room.status === "paused" ? "play-fill" : "pause-fill"} me-2"></i>${room.status === "paused" ? "Continuar" : "Pausar"}</button>
            </div>
          </div>
          <div class="history-block"><div class="subheading"><span>ÚLTIMOS NÚMEROS</span><small>Mais recente primeiro</small></div><div class="history-list">${renderHistory()}</div></div>
          <div class="called-board"><div class="subheading"><span>PAINEL DE NÚMEROS</span><small>75 bolas</small></div><div class="number-board">${renderNumberBoard()}</div></div>
        </section>
        <aside class="side-column">
          <section class="side-card invite-card"><div class="side-card-head"><span class="section-kicker">SALA INICIADA · CONVITES</span><i class="bi bi-qr-code"></i></div><h3>É só apontar<br/>a câmera.</h3><p>Exiba este código para a galera. A entrada por celulares diferentes será liberada quando o multiplayer estiver conectado.</p><div class="qr-frame"><canvas id="room-qr"></canvas></div><div class="room-code-label">CÓDIGO DA SALA</div><div class="room-code"><strong>${room.code}</strong><button id="copy-code" aria-label="Copiar código"><i class="bi bi-copy"></i></button></div><button class="btn btn-light w-100 rounded-pill mt-3" id="copy-link"><i class="bi bi-link-45deg me-2"></i>Copiar link de entrada</button></section>
          <section class="side-card settings-card"><div class="side-card-head"><span class="section-kicker">CONFIGURAÇÕES</span><i class="bi bi-sliders"></i></div><label class="form-label" for="event-title">Nome do evento</label><input class="form-control custom-input" id="event-title" value="${escapeHtml(room.title)}" maxlength="50"/><label class="form-label mt-3" for="event-prize">Prêmio recreativo</label><input class="form-control custom-input" id="event-prize" value="${escapeHtml(room.prize)}" maxlength="80"/><label class="form-label mt-3" for="game-mode">Como ganha?</label><select class="form-select custom-input" id="game-mode"><option value="line" ${room.mode==="line"?"selected":""}>Uma linha</option><option value="column" ${room.mode==="column"?"selected":""}>Uma coluna</option><option value="diagonal" ${room.mode==="diagonal"?"selected":""}>Diagonal</option><option value="corners" ${room.mode==="corners"?"selected":""}>Quatro cantos</option><option value="full" ${room.mode==="full"?"selected":""}>Cartela cheia</option></select><button class="btn btn-primary w-100 rounded-pill mt-3" id="save-settings">Salvar configurações</button></section>
        </aside>
      </div>
      <div class="demo-warning"><i class="bi bi-info-circle"></i><span><b>Multiplayer ainda não conectado.</b> Os dados desta demonstração ficam neste navegador. Para o QR funcionar entre TV e celulares, falta configurar o Supabase.</span></div>
    </main>`;
  renderShell(content);
  bindHostEvents();
  if (room.started) drawQr();
  else bindSetupPreview();
}

function statusLabel() {
  return ({ waiting: "Aguardando", playing: "Em andamento", paused: "Pausado", finished: "Finalizado" })[room.status];
}

function renderHistory() {
  if (!room.called.length) return '<span class="history-empty">Os números sorteados vão aparecer aqui.</span>';
  return room.called.slice(-5).reverse().map((number,index)=>`<div class="history-ball ${index===0?"latest":""}"><small>${getLetter(number)}</small><b>${number}</b></div>`).join("");
}

function renderNumberBoard() {
  return LETTERS.map((letter, column)=>`<div class="number-column"><b>${letter}</b>${Array.from({length:15},(_,index)=>column*15+index+1).map(number=>`<span class="${room.called.includes(number)?"called":""}">${number}</span>`).join("")}</div>`).join("");
}

function bindHostEvents() {
  document.querySelector("#new-room").addEventListener("click", async () => {
    const result = await Swal.fire({ title:"Criar outra sala?", text:"A configuração atual será substituída.", icon:"question", showCancelButton:true, confirmButtonText:"Criar nova", cancelButtonText:"Cancelar" });
    if (result.isConfirmed) createRoom();
  });
  const startButton = document.querySelector("#start-room");
  if (startButton) {
    startButton.addEventListener("click", async () => {
      room.title = document.querySelector("#event-title").value.trim() || "Meu bingo";
      room.prize = document.querySelector("#event-prize").value.trim() || "Prêmio surpresa";
      room.mode = document.querySelector("#game-mode").value;
      const result = await Swal.fire({
        title:"Tudo pronto para começar?",
        html:`<div style="text-align:left"><p><b>${escapeHtml(room.title)}</b></p><p>Prêmio: ${escapeHtml(room.prize)}</p><p>Vitória: ${escapeHtml(modeLabel(room.mode))}</p><hr/><p>Ao iniciar, o QR Code e o código da sala serão exibidos.</p></div>`,
        icon:"question", showCancelButton:true, confirmButtonText:"Iniciar sala", cancelButtonText:"Voltar e revisar"
      });
      if (!result.isConfirmed) return;
      room.started = true;
      room.status = "waiting";
      saveRoom();
      renderHost();
      Swal.fire({ toast:true, position:"top-end", icon:"success", title:"Sala preparada!", showConfirmButton:false, timer:1800 });
    });
    return;
  }
  document.querySelector("#draw-now").addEventListener("click", drawNext);
  document.querySelector("#toggle-pause").addEventListener("click", () => {
    room.status = room.status === "paused" ? "playing" : "paused";
    saveRoom(); renderHost();
  });
  document.querySelector("#save-settings").addEventListener("click", () => {
    room.title = document.querySelector("#event-title").value.trim() || "Meu bingo";
    room.prize = document.querySelector("#event-prize").value.trim() || "Prêmio surpresa";
    room.mode = document.querySelector("#game-mode").value;
    saveRoom(); renderHost();
    Swal.fire({ toast:true, position:"top-end", icon:"success", title:"Configurações salvas", showConfirmButton:false, timer:1800 });
  });
  document.querySelector("#copy-code").addEventListener("click", () => copyText(room.code, "Código copiado!"));
  document.querySelector("#copy-link").addEventListener("click", () => copyText(roomUrl(), "Link copiado!"));
}

function modeLabel(mode) {
  return ({line:"Uma linha",column:"Uma coluna",diagonal:"Diagonal",corners:"Quatro cantos",full:"Cartela cheia"})[mode] || "Uma linha";
}

function bindSetupPreview() {
  const title = document.querySelector("#event-title");
  const mode = document.querySelector("#game-mode");
  const summaryTitle = document.querySelector("#summary-title");
  const summaryMode = document.querySelector("#summary-mode");
  const previewTitle = document.querySelector("#preview-title");
  const update = () => {
    const value = title.value.trim() || "Meu bingo";
    summaryTitle.textContent = value;
    previewTitle.textContent = value;
    summaryMode.textContent = "Vitória: " + modeLabel(mode.value);
  };
  title.addEventListener("input", update);
  mode.addEventListener("change", update);
}

function drawNext() {
  if (room.status === "paused") return Swal.fire("Partida pausada", "Continue a partida antes de sortear.", "info");
  if (!room.started) return Swal.fire("Sala ainda não iniciada", "Configure a sala e aperte “Salvar e iniciar sala” antes de sortear.", "info");
  if (!room.called.length) room.status = "playing";
  const number = drawNumber(room.pool);
  if (number === null) {
    room.status = "finished"; saveRoom(); renderHost();
    return Swal.fire("Fim de jogo!", "Todas as 75 bolas já foram sorteadas.", "success");
  }
  room.called.push(number);
  saveRoom();
  renderHost();
  gsap.fromTo("#draw-ball", { scale: .72, rotation: -16, opacity: .5 }, { scale: 1, rotation: 0, opacity: 1, duration: .55, ease: "back.out(1.8)" });
  document.querySelector("#draw-caption").textContent = `${getLetter(number)}-${number} foi sorteado!`;
}

async function drawQr() {
  const canvas = document.querySelector("#room-qr");
  if (!canvas) return;
  try {
    await QRCode.toCanvas(canvas, roomUrl(), { width: 176, margin: 1, color: { dark: "#17142b", light: "#ffffff" } });
  } catch (error) {
    console.error("Não foi possível gerar o QR Code:", error);
  }
}

async function copyText(value, message) {
  try {
    await navigator.clipboard.writeText(value);
    Swal.fire({ toast:true, position:"top-end", icon:"success", title:message, showConfirmButton:false, timer:1600 });
  } catch {
    Swal.fire("Copie este conteúdo", value, "info");
  }
}

function renderPlayer() {
  const code = (params.get("room") || "").toUpperCase();
  const knownRoom = room?.code === code ? room : null;
  if (!knownRoom) {
    renderShell(`<main class="player-page container"><div class="player-card-panel text-center"><div class="player-icon">🎱</div><span class="section-kicker">ENTRAR NA PARTIDA</span><h1>Encontre sua<br/><span class="text-gradient">sala de bingo.</span></h1><p>Este link ainda não está conectado a uma sala compartilhada. Peça ao organizador para abrir a partida neste mesmo dispositivo durante a demonstração.</p><a href="./" class="btn btn-primary rounded-pill px-4">Voltar ao início</a></div></main>`, "player");
    return;
  }
  if (!playerCard || playerCard.roomCode !== code) {
    playerCard = { roomCode: code, name: "Jogador", card: createCard() };
    savePlayerCard();
  }
  renderShell(`
    <main class="player-page container">
      <div class="player-topline"><a href="./" class="brand"><span class="brand-mark"><i class="bi bi-circle-fill"></i><i class="bi bi-stars"></i></span><span>bolla<span class="brand-dot">.</span></span></a><span class="status-chip ${knownRoom.status}"><i></i>${statusLabel()}</span></div>
      <section class="player-heading"><span class="section-kicker">SALA ${knownRoom.code}</span><h1>Boa sorte,<br/><span class="text-gradient">jogador!</span></h1><p>${escapeHtml(knownRoom.title)} · Prêmio: ${escapeHtml(knownRoom.prize)}</p></section>
      <section class="player-card-panel"><div class="player-card-head"><div><span class="section-kicker">SUA CARTELA</span><h2>Marque seus números</h2></div><button class="btn btn-soft rounded-pill" id="new-card"><i class="bi bi-arrow-repeat me-1"></i>Nova cartela</button></div><div class="bingo-card"><div class="bingo-letters">${LETTERS.map(letter=>`<b>${letter}</b>`).join("")}</div><div class="bingo-grid">${playerCard.card.flat().map((value,index)=>`<button class="bingo-cell ${value==="★"?"free-cell":""} ${markedNumbers.has(value)?"marked":""}" data-value="${value}" ${value==="★"?"disabled":""}>${value}</button>`).join("")}</div></div><div class="player-card-foot"><span><i class="bi bi-hand-index-thumb"></i> Toque para marcar</span><span id="marked-count">${markedNumbers.size} marcados</span></div><button class="btn btn-primary btn-lg rounded-pill w-100 mt-4" id="claim-bingo"><i class="bi bi-trophy me-2"></i>BINGO!</button></section>
      <section class="player-recent"><span class="section-kicker">ÚLTIMOS NÚMEROS</span><div class="history-list">${knownRoom.called.slice(-5).reverse().map((n,i)=>`<div class="history-ball ${i===0?"latest":""}"><small>${getLetter(n)}</small><b>${n}</b></div>`).join("") || '<span class="history-empty">Aguardando o primeiro sorteio.</span>'}</div></section>
      <div class="demo-warning"><i class="bi bi-info-circle"></i><span>Esta é uma demonstração local. O modo multiplayer será conectado ao servidor na próxima etapa.</span></div>
    </main>`, "player");
  document.querySelectorAll(".bingo-cell:not(.free-cell)").forEach(cell => {
    cell.addEventListener("click", () => {
      const value = Number(cell.dataset.value);
      if (markedNumbers.has(value)) markedNumbers.delete(value); else markedNumbers.add(value);
      cell.classList.toggle("marked", markedNumbers.has(value));
      document.querySelector("#marked-count").textContent = `${markedNumbers.size} marcados`;
      if (navigator.vibrate) navigator.vibrate(35);
    });
  });
  document.querySelector("#new-card").addEventListener("click", () => {
    playerCard.card = createCard(); markedNumbers.clear(); savePlayerCard(); renderPlayer();
  });
  document.querySelector("#claim-bingo").addEventListener("click", () => {
    const allCalled = knownRoom.called;
    const result = hasBingo(playerCard.card, allCalled, knownRoom.mode);
    Swal.fire(result ? { title:"BINGO!", text:"Padrão completo nesta demonstração. O host ainda precisa validar o resultado.", icon:"success" } : { title:"Ainda não foi!", text:"Sua cartela ainda não completou o padrão vencedor.", icon:"info" });
  });
}

if (isPlayerRoute) renderPlayer();
else if (room) renderHost();
else renderLanding();
