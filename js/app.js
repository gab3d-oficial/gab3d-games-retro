// =========================================================
// app.js — ponto de entrada. Liga biblioteca, rotas, controles
// e a tela do jogo. Normalmente você não precisa editar aqui.
// =========================================================

import { loadLibrary, findGame, cartridgeUrl } from './library.js';
import { normalizeEntry, onRoute, go } from './router.js';
import { initControls, onInput, setEnabled, releaseAll } from './controls.js';
import * as player from './player.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let biblioteca = [];
let atual = null;
let jogando = false;
let mudo = false;
try { mudo = localStorage.getItem('gab3d.mudo') === '1'; } catch (_) {}

// ---------------- áudio ----------------
// O áudio do navegador só libera depois de um toque. O toque em JOGAR
// cria um AudioContext aqui, e os jogos HTML5 (mesmo domínio) usam esse
// mesmo contexto — assim o som funciona também no iPhone.
function liberarAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!window.GabAudioCtx) window.GabAudioCtx = new AC();
    const ctx = window.GabAudioCtx;
    if (ctx.state === 'suspended') ctx.resume();
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf; src.connect(ctx.destination); src.start(0);
  } catch (_) {}
}

// ---------------- avisos ----------------
let toastTimer = null;
function toast(msg, ms = 2600) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, ms);
}

async function copiar(texto) {
  try { await navigator.clipboard.writeText(texto); toast('Link do cartucho copiado: ' + texto, 3500); }
  catch (_) { window.prompt('Copie o link para gravar na tag NFC:', texto); }
}

// ---------------- biblioteca ----------------
function renderBiblioteca() {
  const grid = $('#game-grid');
  $('#game-count').textContent = `${biblioteca.length} CARTUCHO${biblioteca.length === 1 ? '' : 'S'}`;
  if (!biblioteca.length) {
    grid.innerHTML = '<p class="grid-msg">Nenhum jogo ativo em <code>games/games.json</code>.</p>';
    return;
  }
  grid.innerHTML = biblioteca.map(j => `
    <article class="cart" style="--cart:${esc(j.cor)}">
      <a class="cart-shell" href="#/jogo/${encodeURIComponent(j.id)}" aria-label="Jogar ${esc(j.titulo)}">
        <div class="cart-label"><img src="${esc(j.capa)}" alt="Capa de ${esc(j.titulo)}" loading="lazy"></div>
      </a>
      <div class="cart-info">
        <h3>${esc(j.titulo)}</h3>
        <p>${esc(j.descricao)}</p>
        <div class="cart-meta">
          <span>${esc(j.console)}</span>
          <span>${j.tipo === 'rom' ? 'HOMEBREW' : 'HTML5'}</span>
          ${j.autor ? `<span>${esc(j.autor)}</span>` : ''}
        </div>
        <div class="cart-actions">
          <a class="btn btn-primary" href="#/jogo/${encodeURIComponent(j.id)}">▶ JOGAR</a>
          <button class="btn btn-ghost" data-copy="${esc(j.id)}">LINK NFC</button>
        </div>
      </div>
    </article>`).join('');
}

// ---------------- telas ----------------
function mostrar(view) {
  $('#view-home').hidden = view !== 'home';
  $('#view-game').hidden = view !== 'game';
  document.body.dataset.view = view;
}

function abrirJogo(jogo) {
  player.unmount();
  atual = jogo;
  jogando = false;
  mostrar('game');
  document.title = `${jogo.titulo} · Gab 3D Games`;
  $('#game-title').textContent = jogo.titulo.toUpperCase();
  $('#insert-cover').src = jogo.capa;
  $('#insert-cover').alt = `Capa de ${jogo.titulo}`;
  $('#insert-title').textContent = jogo.titulo.toUpperCase();
  $('#insert-desc').textContent = jogo.controles || jogo.descricao || '';
  const ins = $('#insert');
  ins.hidden = false;
  ins.style.animation = 'none'; void ins.offsetWidth; ins.style.animation = '';
  $('#power-led').classList.add('on');
  setEnabled(true);
  window.scrollTo(0, 0);
}

function iniciarJogo() {
  if (!atual || jogando) return;
  liberarAudio();
  jogando = true;
  $('#insert').hidden = true;
  player.mount($('#stage'), atual, { muted: mudo });
}

function fecharJogo() {
  player.unmount();
  atual = null;
  jogando = false;
  setEnabled(false);
  $('#power-led').classList.remove('on');
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

async function trocarRota(rota) {
  if (rota.view === 'game') {
    const jogo = findGame(biblioteca, rota.id);
    if (!jogo) {
      toast(`Cartucho "${rota.id}" não encontrado.`);
      go('/');
      return;
    }
    if (atual && atual.id === jogo.id) return;
    abrirJogo(jogo);
  } else {
    fecharJogo();
    mostrar('home');
    document.title = 'Gab 3D Games Retrô';
  }
}

// ---------------- botões da interface ----------------
function ligarInterface() {
  initControls($('#view-game'));

  onInput((btn, down) => {
    if (!atual) return;
    if (!jogando) {
      if (down && (btn === 'a' || btn === 'start')) iniciarJogo();
      return;
    }
    if (down) liberarAudio();
    player.sendInput(btn, down);
  });

  $('#btn-play').addEventListener('click', iniciarJogo);
  $('#btn-back').addEventListener('click', () => go('/'));

  const btnMute = $('#btn-mute');
  const pintarMute = () => btnMute.classList.toggle('off', mudo);
  pintarMute();
  btnMute.addEventListener('click', () => {
    mudo = !mudo;
    try { localStorage.setItem('gab3d.mudo', mudo ? '1' : '0'); } catch (_) {}
    player.setMuted(mudo);
    pintarMute();
    toast(mudo ? 'Som desligado' : 'Som ligado', 1200);
  });

  $('#btn-full').addEventListener('click', () => {
    const el = document.documentElement;
    if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return; }
    if (el.requestFullscreen) {
      el.requestFullscreen({ navigationUI: 'hide' }).catch(() => toast('Tela cheia não permitida aqui.'));
    } else {
      toast('No iPhone: Compartilhar → "Adicionar à Tela de Início" para jogar em tela cheia.', 4500);
    }
  });

  document.addEventListener('click', e => {
    const copy = e.target.closest('[data-copy]');
    if (copy) {
      const jogo = findGame(biblioteca, copy.dataset.copy);
      if (jogo) copiar(cartridgeUrl(jogo));
      return;
    }
    const scroll = e.target.closest('[data-scroll]');
    if (scroll) $(scroll.dataset.scroll)?.scrollIntoView({ behavior: 'smooth' });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { releaseAll(); player.send({ gab: 'pause' }); }
  });

  // evita zoom com dois dedos / duplo toque no iOS durante o jogo
  document.addEventListener('gesturestart', e => { if (atual) e.preventDefault(); });

  $('#ano').textContent = new Date().getFullYear();
}

// ---------------- início ----------------
async function iniciar() {
  normalizeEntry();
  ligarInterface();
  try {
    biblioteca = await loadLibrary();
    renderBiblioteca();
  } catch (err) {
    console.error(err);
    $('#game-grid').innerHTML = `<p class="grid-msg">Não foi possível carregar a biblioteca.<br>
      Se abriu o arquivo direto do computador, use um servidor local
      (<code>python3 -m http.server</code>) ou publique no GitHub Pages.</p>`;
  }
  onRoute(trocarRota);
}

iniciar();
