/* =========================================================
   QUEBRA-BLOCOS — jogo original Gab 3D
   Tela 160x144
   ========================================================= */
(function () {
  'use strict';
  var W = 160, H = 144, HUD = 12;
  var tela = document.getElementById('tela');
  var g = tela.getContext('2d');
  var IN = window.GabInput, SOM = window.GabAudio, F = window.GabFont;

  var LINHAS_COR = ['#FF4D6D', '#FF8A1A', '#FFD23F', '#39FF88', '#1E7BFF', '#8A5CFF', '#E6ECF7'];
  var COR = { fundo: '#0A0F1C', fundo2: '#101A33', hud: '#060912', linha: '#1E7BFF', texto: '#E6ECF7', apagado: '#6F7EA3',
              laranja: '#FF8A1A', ouro: '#FFD23F', bola: '#FFFFFF', painel: 'rgba(6,9,18,.86)', coracao: '#FF4D6D' };
  var CHAVE = 'gab3d.quebrablocos.recorde';
  var recorde = 0;
  try { recorde = parseInt(localStorage.getItem(CHAVE) || '0', 10) || 0; } catch (e) {}

  var estado = 'titulo';  // titulo | jogo | pausa | fim
  var raq = { x: 66, y: 132, w: 28, h: 4 };
  var bola = { x: 0, y: 0, vx: 0, vy: 0, s: 3, presa: true, rastro: [] };
  var blocos = [], particulas = [];
  var vidas = 3, nivel = 1, pontos = 0, relogio = 0, ultimo = 0, tFim = 0, tremor = 0, novoRecorde = false, faixaNivel = 0;

  function velBase() { return 82 + nivel * 12; }

  function montaNivel() {
    blocos = [];
    var linhas = Math.min(3 + nivel, 7), cols = 10, bw = 14, bh = 6, gap = 1;
    var ox = Math.floor((W - (cols * (bw + gap) - gap)) / 2);
    for (var r = 0; r < linhas; r++) {
      for (var c = 0; c < cols; c++) {
        if (nivel % 3 === 2 && (r + c) % 4 === 0) continue;          // fase com buracos
        if (nivel % 3 === 0 && (c === 4 || c === 5) && r < 2) continue; // fase com corredor
        blocos.push({
          x: ox + c * (bw + gap), y: HUD + 10 + r * (bh + gap), w: bw, h: bh,
          hp: (nivel >= 3 && r === 0) ? 2 : 1, linha: r, cor: LINHAS_COR[r % LINHAS_COR.length], vivo: true
        });
      }
    }
    faixaNivel = 1.6;
  }

  function prende() { bola.presa = true; bola.vx = 0; bola.vy = 0; bola.rastro = []; }

  function lanca() {
    if (!bola.presa) return;
    bola.presa = false;
    var v = velBase(), a = (Math.random() * 0.7 - 0.35);
    bola.vx = v * Math.sin(a); bola.vy = -v * Math.cos(a);
    SOM.beep(660, 0.05);
  }

  function novoJogo() {
    vidas = 3; nivel = 1; pontos = 0; particulas = [];
    raq.x = (W - raq.w) / 2;
    montaNivel(); prende();
    estado = 'jogo';
    SOM.melodia([392, 523, 659, 784], 70);
  }

  // ---------------- entrada ----------------
  IN.on('press', function (b) {
    if (estado === 'titulo' || estado === 'fim') {
      if ((b === 'a' || b === 'start') && !(estado === 'fim' && tFim < 0.7)) novoJogo();
      return;
    }
    if (b === 'start') { estado = estado === 'pausa' ? 'jogo' : 'pausa'; SOM.beep(estado === 'pausa' ? 330 : 523, 0.06); return; }
    if (estado === 'jogo' && (b === 'a' || b === 'up')) lanca();
  });
  IN.onPause(function () { if (estado === 'jogo') estado = 'pausa'; });

  // ---------------- física ----------------
  function colide(a, b) { return a.x < b.x + b.w && a.x + a.s > b.x && a.y < b.y + b.h && a.y + a.s > b.y; }

  function subpasso(h) {
    var px = bola.x, py = bola.y;
    bola.x += bola.vx * h; bola.y += bola.vy * h;

    if (bola.x < 1) { bola.x = 1; bola.vx = Math.abs(bola.vx); SOM.beep(300, 0.03, 'square', 0.04); }
    if (bola.x + bola.s > W - 1) { bola.x = W - 1 - bola.s; bola.vx = -Math.abs(bola.vx); SOM.beep(300, 0.03, 'square', 0.04); }
    if (bola.y < HUD + 1) { bola.y = HUD + 1; bola.vy = Math.abs(bola.vy); SOM.beep(300, 0.03, 'square', 0.04); }
    if (bola.y > H + 4) { perdeVida(); return true; }

    // raquete: o ângulo depende de onde a bola bate
    if (bola.vy > 0 && py + bola.s <= raq.y + 1 && bola.y + bola.s >= raq.y &&
        bola.x + bola.s >= raq.x && bola.x <= raq.x + raq.w) {
      bola.y = raq.y - bola.s;
      var rel = ((bola.x + bola.s / 2) - (raq.x + raq.w / 2)) / (raq.w / 2);
      rel = Math.max(-1, Math.min(1, rel));
      var v = Math.hypot(bola.vx, bola.vy), ang = rel * 1.05;
      bola.vx = v * Math.sin(ang); bola.vy = -v * Math.cos(ang);
      SOM.beep(440, 0.04, 'square', 0.06);
    }

    for (var i = 0; i < blocos.length; i++) {
      var b = blocos[i];
      if (!b.vivo || !colide(bola, b)) continue;
      var vinhaDeCima = px + bola.s > b.x && px < b.x + b.w;
      if (vinhaDeCima) bola.vy = -bola.vy; else bola.vx = -bola.vx;
      bola.x = px; bola.y = py;
      b.hp--;
      if (b.hp <= 0) {
        b.vivo = false;
        pontos += 10 + (6 - Math.min(b.linha, 6)) * 5;
        explosao(b.x + b.w / 2, b.y + b.h / 2, b.cor, 12);
        tremor = 0.08;
      }
      SOM.beep(520 + (6 - Math.min(b.linha, 6)) * 70, 0.05, 'square', 0.06);
      var vel = Math.hypot(bola.vx, bola.vy), max = velBase() * 1.6;
      if (vel < max) { bola.vx *= 1.012; bola.vy *= 1.012; }
      if (!blocos.some(function (q) { return q.vivo; })) proximoNivel();
      return true;
    }
    return false;
  }

  function proximoNivel() {
    pontos += 100; nivel++;
    SOM.melodia([523, 659, 784, 1047], 90);
    montaNivel(); prende();
  }

  function perdeVida() {
    vidas--;
    tremor = 0.25;
    SOM.beep(330, 0.12, 'square', 0.08); setTimeout(function () { SOM.beep(196, 0.35, 'sawtooth', 0.07, -80); }, 120);
    if (vidas <= 0) {
      estado = 'fim'; tFim = 0;
      novoRecorde = pontos > recorde;
      if (novoRecorde) { recorde = pontos; try { localStorage.setItem(CHAVE, String(recorde)); } catch (e) {} }
    } else {
      prende();
    }
  }

  function explosao(x, y, cor, n) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = 15 + Math.random() * 55;
      particulas.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 0.4 + Math.random() * 0.4, cor: cor });
    }
  }

  function atualiza(dt) {
    var vel = IN.down.b ? 190 : 118;
    if (IN.down.left) raq.x -= vel * dt;
    if (IN.down.right) raq.x += vel * dt;
    raq.x = Math.max(1, Math.min(W - 1 - raq.w, raq.x));

    if (bola.presa) { bola.x = raq.x + raq.w / 2 - bola.s / 2; bola.y = raq.y - bola.s - 1; return; }

    bola.rastro.unshift([bola.x, bola.y]); if (bola.rastro.length > 4) bola.rastro.pop();
    var dist = Math.hypot(bola.vx, bola.vy) * dt, n = Math.max(1, Math.ceil(dist / 1.5));
    for (var i = 0; i < n; i++) if (subpasso(dt / n)) break;
  }

  // ---------------- desenho ----------------
  function pad(n, d) { n = String(n); while (n.length < d) n = '0' + n; return n; }

  function clareia(hex, f) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
    r = Math.round(r + (255 - r) * f); gg = Math.round(gg + (255 - gg) * f); b = Math.round(b + (255 - b) * f);
    return 'rgb(' + r + ',' + gg + ',' + b + ')';
  }
  function escurece(hex, f) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgb(' + Math.round((n >> 16) * f) + ',' + Math.round(((n >> 8) & 255) * f) + ',' + Math.round((n & 255) * f) + ')';
  }

  function coracao(x, y) {
    g.fillStyle = COR.coracao;
    g.fillRect(x, y, 2, 2); g.fillRect(x + 3, y, 2, 2); g.fillRect(x, y + 1, 5, 2); g.fillRect(x + 1, y + 3, 3, 1); g.fillRect(x + 2, y + 4, 1, 1);
  }

  function painel(y, h) {
    g.fillStyle = COR.painel; g.fillRect(10, y, W - 20, h);
    g.fillStyle = COR.linha; g.fillRect(10, y, W - 20, 1); g.fillRect(10, y + h - 1, W - 20, 1);
  }

  function desenha() {
    g.save();
    if (tremor > 0) g.translate(Math.round((Math.random() - 0.5) * 3), Math.round((Math.random() - 0.5) * 3));

    var grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, COR.fundo2); grad.addColorStop(1, COR.fundo);
    g.fillStyle = grad; g.fillRect(-4, -4, W + 8, H + 8);
    g.fillStyle = 'rgba(30,123,255,.07)';
    for (var gx = 0; gx < W; gx += 16) g.fillRect(gx, HUD, 1, H);

    if (estado !== 'titulo') {
      for (var i = 0; i < blocos.length; i++) {
        var b = blocos[i]; if (!b.vivo) continue;
        g.fillStyle = b.hp > 1 ? escurece(b.cor, 0.6) : b.cor; g.fillRect(b.x, b.y, b.w, b.h);
        g.fillStyle = clareia(b.cor, 0.45); g.fillRect(b.x, b.y, b.w, 1);
        g.fillStyle = escurece(b.cor, 0.55); g.fillRect(b.x, b.y + b.h - 1, b.w, 1);
        if (b.hp > 1) { g.fillStyle = clareia(b.cor, 0.2); g.fillRect(b.x + 3, b.y + 2, b.w - 6, 2); }
      }
      // raquete
      g.fillStyle = COR.laranja; g.fillRect(raq.x, raq.y, raq.w, raq.h);
      g.fillStyle = '#FFC48A'; g.fillRect(raq.x + 1, raq.y, raq.w - 2, 1);
      g.fillStyle = COR.linha; g.fillRect(raq.x, raq.y, 3, raq.h); g.fillRect(raq.x + raq.w - 3, raq.y, 3, raq.h);
      // bola com rastro
      for (var r = bola.rastro.length - 1; r >= 0; r--) {
        g.fillStyle = 'rgba(255,255,255,' + (0.35 - r * 0.08) + ')';
        g.fillRect(Math.round(bola.rastro[r][0]), Math.round(bola.rastro[r][1]), bola.s, bola.s);
      }
      g.fillStyle = COR.bola; g.fillRect(Math.round(bola.x), Math.round(bola.y), bola.s, bola.s);
    }

    for (var p = 0; p < particulas.length; p++) {
      var q = particulas[p]; g.fillStyle = q.cor; g.fillRect(Math.round(q.x), Math.round(q.y), 1, 1);
    }

    // HUD
    g.fillStyle = COR.hud; g.fillRect(-4, -4, W + 8, HUD + 4);
    g.fillStyle = COR.linha; g.fillRect(0, HUD - 1, W, 1);
    F.draw(g, pad(pontos, 5), 3, 3, { cor: COR.texto });
    F.draw(g, 'FASE ' + nivel, W / 2, 3, { cor: COR.laranja, align: 'center' });
    for (var v = 0; v < vidas; v++) coracao(W - 8 - v * 7, 3);
    g.restore();

    var pisca = Math.floor(relogio * 2.5) % 2 === 0;
    if (estado === 'titulo') {
      for (var c = 0; c < 10; c++) for (var l = 0; l < 3; l++) {
        g.fillStyle = LINHAS_COR[(l + Math.floor(relogio * 3)) % 5];
        g.fillRect(6 + c * 15, 22 + l * 7, 14, 6);
      }
      F.draw(g, 'QUEBRA', W / 2, 52, { escala: 3, cor: COR.laranja, sombra: '#6A3300', align: 'center' });
      F.draw(g, 'BLOCOS', W / 2, 72, { escala: 3, cor: COR.texto, sombra: '#1E3A80', align: 'center' });
      if (pisca) F.draw(g, 'APERTE A OU START', W / 2, 104, { cor: COR.texto, align: 'center' });
      F.draw(g, 'A LANCA  B CORRE', W / 2, 116, { cor: COR.apagado, align: 'center' });
      F.draw(g, 'RECORDE ' + recorde, W / 2, 128, { cor: COR.ouro, align: 'center' });
    } else if (estado === 'jogo') {
      if (bola.presa && pisca) F.draw(g, 'A PARA LANCAR', W / 2, 112, { cor: COR.texto, align: 'center' });
      if (faixaNivel > 0) { painel(60, 20); F.draw(g, 'FASE ' + nivel, W / 2, 64, { escala: 2, cor: COR.ouro, align: 'center' }); }
    } else if (estado === 'pausa') {
      painel(56, 32);
      F.draw(g, 'PAUSA', W / 2, 62, { escala: 2, cor: COR.texto, align: 'center' });
      F.draw(g, 'START CONTINUA', W / 2, 78, { cor: COR.apagado, align: 'center' });
    } else if (estado === 'fim') {
      painel(40, 62);
      F.draw(g, 'FIM DE JOGO', W / 2, 47, { escala: 2, cor: COR.laranja, align: 'center' });
      F.draw(g, 'PONTOS ' + pontos, W / 2, 66, { cor: COR.texto, align: 'center' });
      if (novoRecorde) F.draw(g, 'NOVO RECORDE!', W / 2, 76, { cor: COR.ouro, align: 'center' });
      if (tFim > 0.7 && pisca) F.draw(g, 'A PARA JOGAR', W / 2, 90, { cor: COR.texto, align: 'center' });
    }
  }

  // ---------------- laço ----------------
  function quadro(t) {
    var dt = Math.min(0.04, (t - (ultimo || t)) / 1000);
    ultimo = t; relogio += dt;
    if (estado === 'jogo') { atualiza(dt); if (faixaNivel > 0) faixaNivel -= dt; }
    if (estado === 'fim') tFim += dt;
    if (tremor > 0) tremor -= dt;
    for (var i = particulas.length - 1; i >= 0; i--) {
      var p = particulas[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 80 * dt; p.vida -= dt;
      if (p.vida <= 0) particulas.splice(i, 1);
    }
    desenha();
    requestAnimationFrame(quadro);
  }

  requestAnimationFrame(quadro);
})();
