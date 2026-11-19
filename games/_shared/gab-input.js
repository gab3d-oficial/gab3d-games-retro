/* =========================================================
   gab-input.js — entrada padronizada para jogos HTML5 Gab 3D
   Recebe os botões do portátil (postMessage) e do teclado.

   Uso no jogo:
     GabInput.down.left            -> true enquanto segurado
     GabInput.on('press', b => {}) -> botão apertado ('up','a','start'...)
     GabInput.on('release', b => {})
     GabInput.onPause(() => {})    -> app foi para segundo plano
   ========================================================= */
(function () {
  'use strict';
  var BOTOES = ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'select'];
  var down = {};
  BOTOES.forEach(function (b) { down[b] = false; });
  var ouv = { press: [], release: [], pause: [] };

  function set(b, v) {
    if (!(b in down) || down[b] === v) return;
    down[b] = v;
    (v ? ouv.press : ouv.release).forEach(function (f) { f(b); });
  }
  function soltarTudo() { BOTOES.forEach(function (b) { set(b, false); }); }

  window.addEventListener('message', function (e) {
    if (e.source !== window.parent) return;
    var d = e.data || {};
    if (d.gab === 'input') set(d.btn, !!d.down);
    else if (d.gab === 'pause') { soltarTudo(); ouv.pause.forEach(function (f) { f(); }); }
  });

  var TECLAS = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyX: 'a', KeyK: 'a', Space: 'a', KeyZ: 'b', KeyJ: 'b',
    Enter: 'start', ShiftLeft: 'select', ShiftRight: 'select'
  };
  window.addEventListener('keydown', function (e) {
    var b = TECLAS[e.code]; if (!b) return;
    e.preventDefault(); if (!e.repeat) set(b, true);
  });
  window.addEventListener('keyup', function (e) {
    var b = TECLAS[e.code]; if (b) { e.preventDefault(); set(b, false); }
  });
  window.addEventListener('blur', soltarTudo);

  window.GabInput = {
    down: down,
    on: function (tipo, fn) { if (ouv[tipo]) ouv[tipo].push(fn); },
    onPause: function (fn) { ouv.pause.push(fn); }
  };
})();
