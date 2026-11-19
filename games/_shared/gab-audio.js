/* =========================================================
   gab-audio.js — efeitos sonoros 8-bit gerados na hora
   (sem arquivos de áudio). Usa o AudioContext liberado pelo
   botão JOGAR do portátil, para funcionar no iPhone.

   GabAudio.beep(freq, duracao, onda, volume, deslize)
   ========================================================= */
(function () {
  'use strict';
  var ctx = null;
  var mudo = false;

  function contexto() {
    if (ctx) return ctx;
    try { if (window.parent !== window && window.parent.GabAudioCtx) ctx = window.parent.GabAudioCtx; } catch (e) {}
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    return ctx;
  }

  function beep(freq, dur, onda, vol, deslize) {
    if (mudo) return;
    var c = contexto(); if (!c) return;
    if (c.state === 'suspended') c.resume();
    dur = dur || 0.08; vol = vol || 0.07;
    var t = c.currentTime;
    var o = c.createOscillator(), g = c.createGain();
    o.type = onda || 'square';
    o.frequency.setValueAtTime(freq || 440, t);
    if (deslize) o.frequency.linearRampToValueAtTime(Math.max(30, (freq || 440) + deslize), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function melodia(notas, passo) {
    notas.forEach(function (f, i) { setTimeout(function () { if (f) beep(f, (passo || 90) / 1000 * 0.9); }, i * (passo || 90)); });
  }

  // destrava o áudio no primeiro toque/tecla dentro do jogo (computador)
  ['pointerdown', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, function () { var c = contexto(); if (c && c.state === 'suspended') c.resume(); }, { once: true });
  });

  window.addEventListener('message', function (e) {
    if (e.source !== window.parent) return;
    if (e.data && e.data.gab === 'mute') mudo = !!e.data.value;
  });

  window.GabAudio = { beep: beep, melodia: melodia, setMuted: function (v) { mudo = !!v; } };
})();
