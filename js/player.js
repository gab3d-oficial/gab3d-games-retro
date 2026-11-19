// =========================================================
// player.js — carrega o jogo dentro da tela (iframe) e
// repassa os botões para ele via postMessage.
//
// Protocolo de mensagens (pai -> jogo):
//   { gab: 'input', btn: 'a', down: true }
//   { gab: 'pause' }              app foi para segundo plano
//   { gab: 'mute', value: true }  som ligado/desligado
// =========================================================

import { playerSrc } from './library.js';

let frame = null;
let mudo = false;

export function mount(palco, jogo, { muted = false } = {}) {
  unmount();
  mudo = muted;
  frame = document.createElement('iframe');
  frame.src = playerSrc(jogo);
  frame.title = jogo.titulo;
  frame.allow = 'autoplay; fullscreen; gamepad';
  frame.addEventListener('load', () => send({ gab: 'mute', value: mudo }));
  palco.appendChild(frame);
  return frame;
}

export function unmount() {
  if (frame) { frame.remove(); frame = null; }
}

export function isMounted() { return !!frame; }

export function send(msg) {
  if (frame && frame.contentWindow) frame.contentWindow.postMessage(msg, '*');
}

export function sendInput(btn, down) { send({ gab: 'input', btn, down }); }

export function setMuted(v) { mudo = v; send({ gab: 'mute', value: v }); }
