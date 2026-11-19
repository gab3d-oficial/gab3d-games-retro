// =========================================================
// controls.js — controle virtual (toque) + teclado
// Botões padronizados: up, down, left, right, a, b, start, select
// Multitoque: dá para segurar o direcional e apertar A ao mesmo tempo.
// =========================================================

const ouvintes = new Set();
const estado = {};
let ativo = false;

const TECLAS = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  KeyX: 'a', KeyK: 'a', Space: 'a',
  KeyZ: 'b', KeyJ: 'b',
  Enter: 'start',
  ShiftLeft: 'select', ShiftRight: 'select'
};

export function onInput(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn); }

function emitir(botao, apertado) {
  if (!!estado[botao] === apertado) return;
  estado[botao] = apertado;
  ouvintes.forEach(fn => fn(botao, apertado));
}

export function releaseAll() { Object.keys(estado).forEach(b => emitir(b, false)); }
export function setEnabled(v) { ativo = v; if (!v) releaseAll(); }

function vibrar() { try { navigator.vibrate && navigator.vibrate(8); } catch (_) { /* iPhone não suporta */ } }

export function initControls(raiz) {
  // ---- botões A, B, START, SELECT ----
  raiz.querySelectorAll('[data-btn]').forEach(el => {
    const botao = el.dataset.btn;
    const soltar = () => { el.classList.remove('is-down'); emitir(botao, false); };
    el.addEventListener('pointerdown', e => {
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      el.classList.add('is-down');
      vibrar();
      emitir(botao, true);
    });
    el.addEventListener('pointerup', soltar);
    el.addEventListener('pointercancel', soltar);
    el.addEventListener('lostpointercapture', soltar);
    el.addEventListener('contextmenu', e => e.preventDefault());
  });

  // ---- direcional de 8 direções (deslizar o dedo funciona) ----
  const pad = raiz.querySelector('#dpad');
  let dedo = null;
  const DIRS = ['up', 'down', 'left', 'right'];

  const aplicar = lista => {
    DIRS.forEach(d => {
      const on = lista.includes(d);
      pad.querySelector('.' + d).classList.toggle('is-down', on);
      emitir(d, on);
    });
  };
  const ler = e => {
    const r = pad.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(x, y) < r.width * 0.12) return [];      // zona morta no centro
    const ang = Math.atan2(y, x) * 180 / Math.PI;          // 0 = direita, 90 = baixo
    const out = [];
    if (ang > -67.5 && ang < 67.5) out.push('right');
    if (ang > 112.5 || ang < -112.5) out.push('left');
    if (ang > 22.5 && ang < 157.5) out.push('down');
    if (ang < -22.5 && ang > -157.5) out.push('up');
    return out;
  };
  pad.addEventListener('pointerdown', e => {
    e.preventDefault();
    dedo = e.pointerId;
    try { pad.setPointerCapture(e.pointerId); } catch (_) {}
    vibrar();
    aplicar(ler(e));
  });
  pad.addEventListener('pointermove', e => { if (e.pointerId === dedo) aplicar(ler(e)); });
  const fim = e => { if (e.pointerId === dedo) { dedo = null; aplicar([]); } };
  pad.addEventListener('pointerup', fim);
  pad.addEventListener('pointercancel', fim);
  pad.addEventListener('contextmenu', e => e.preventDefault());

  // ---- teclado (computador) ----
  window.addEventListener('keydown', e => {
    const b = TECLAS[e.code];
    if (!b || !ativo) return;
    e.preventDefault();
    if (!e.repeat) emitir(b, true);
  });
  window.addEventListener('keyup', e => {
    const b = TECLAS[e.code];
    if (b && ativo) { e.preventDefault(); emitir(b, false); }
  });
  window.addEventListener('blur', releaseAll);
}
