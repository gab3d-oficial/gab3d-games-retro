/* =========================================================
   PULA-PIXEL — jogo original Gab 3D
   Corrida infinita com o cubo Gab 3D. Tela 160x144.
   A / ↑ pula (segure para pular mais alto) · ↓ abaixa
   ========================================================= */
(function () {
  'use strict';
  var W = 160, H = 144, CHAO = 118;
  var tela = document.getElementById('tela');
  var g = tela.getContext('2d');
  var IN = window.GabInput, SOM = window.GabAudio, F = window.GabFont;

  var COR = {
    ceu1: '#0A0F1C', ceu2: '#1A2552', predio: '#121B36', predio2: '#1B2850', janela: '#FFD23F',
    chao: '#1E7BFF', chao2: '#0D4FB8', terra: '#0A1430', texto: '#E6ECF7', apagado: '#6F7EA3',
    laranja: '#FF8A1A', laranja2: '#FFB34D', ouro: '#FFD23F', bloco: '#FF4D6D', bloco2: '#A61E3B',
    drone: '#8A5CFF', drone2: '#5B33C4', branco: '#F4F7FC', cinza: '#C5CEDF', azul: '#1E7BFF', azul2: '#0D4FB8',
    navy: '#0A0F1C', painel: 'rgba(6,9,18,.86)', linha: '#1E7BFF'
  };
  var CHAVE = 'gab3d.pulapixel.recorde';
  var recorde = 0;
  try { recorde = parseInt(localStorage.getItem(CHAVE) || '0', 10) || 0; } catch (e) {}

  var estado = 'titulo', relogio = 0, ultimo = 0, tFim = 0, novoRecorde = false;
  var jog = { x: 26, y: CHAO - 12, vy: 0, h: 12, noChao: true, abaixado: false };
  var obst = [], moedas = [], part = [];
  var vel = 70, dist = 0, bonus = 0, proximo = 80;

  // cenário fixo (gerado uma vez)
  var estrelas = [], predios = [], xp = 0;
  for (var i = 0; i < 28; i++) estrelas.push([Math.random() * W, 14 + Math.random() * 60, Math.random() < 0.3]);
  while (xp < 240) {
    var pw = 14 + Math.floor(Math.random() * 18), ph = 18 + Math.floor(Math.random() * 36);
    predios.push({ x: xp, w: pw, h: ph, j: Math.random() });
    xp += pw + 2;
  }
  var LARG_PREDIOS = xp;

  function pontos() { return Math.floor(dist / 6) + bonus; }
  function pad(n, d) { n = String(n); while (n.length < d) n = '0' + n; return n; }

  function novoJogo() {
    jog.y = CHAO - 12; jog.vy = 0; jog.noChao = true; jog.h = 12;
    obst = []; moedas = []; part = [];
    vel = 70; dist = 0; bonus = 0; proximo = 80;
    estado = 'jogo';
    SOM.melodia([523, 659, 784], 70);
  }

  function pular() {
    if (!jog.noChao) return;
    jog.vy = -205; jog.noChao = false;
    SOM.beep(440, 0.09, 'square', 0.06, 300);
  }

  // ---------------- entrada ----------------
  IN.on('press', function (b) {
    if (estado === 'titulo' || estado === 'fim') {
      if ((b === 'a' || b === 'b' || b === 'start' || b === 'up') && !(estado === 'fim' && tFim < 0.8)) novoJogo();
      return;
    }
    if (b === 'start') { estado = estado === 'pausa' ? 'jogo' : 'pausa'; SOM.beep(estado === 'pausa' ? 330 : 523, 0.06); return; }
    if (estado === 'jogo' && (b === 'a' || b === 'up' || b === 'b')) pular();
  });
  IN.on('release', function (b) {
    if ((b === 'a' || b === 'up' || b === 'b') && jog.vy < -70) jog.vy = -70;  // pulo curto
  });
  IN.onPause(function () { if (estado === 'jogo') estado = 'pausa'; });

  // ---------------- obstáculos ----------------
  function criaObstaculo() {
    var r = Math.random(), x = W + 6;
    if (dist < 250 || r < 0.45) {
      var h = 8 + Math.floor(Math.random() * 9);
      obst.push({ tipo: 'bloco', x: x, y: CHAO - h, w: 8, h: h });
    } else if (r < 0.65) {
      obst.push({ tipo: 'bloco', x: x, y: CHAO - 9, w: 16, h: 9 });
    } else if (r < 0.85) {
      obst.push({ tipo: 'drone', x: x, y: CHAO - 17, w: 11, h: 6 });   // abaixe!
    } else {
      obst.push({ tipo: 'drone', x: x, y: CHAO - 31, w: 11, h: 6 });   // não pule!
    }
    if (Math.random() < 0.45) {
      var alt = CHAO - 22 - Math.floor(Math.random() * 18);
      for (var k = 0; k < 3; k++) moedas.push({ x: x + 34 + k * 9, y: alt, ok: true });
    }
  }

  function colide(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  function poeira(x, y, cor, n, forca) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = (forca || 30) * (0.4 + Math.random());
      part.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 15, vida: 0.4 + Math.random() * 0.4, cor: cor });
    }
  }

  function morrer() {
    estado = 'fim'; tFim = 0;
    var p = pontos();
    novoRecorde = p > recorde;
    if (novoRecorde) { recorde = p; try { localStorage.setItem(CHAVE, String(recorde)); } catch (e) {} }
    poeira(jog.x + 5, jog.y + 6, COR.laranja, 14, 60);
    poeira(jog.x + 5, jog.y + 6, COR.azul, 10, 50);
    SOM.beep(392, 0.12, 'square', 0.08);
    setTimeout(function () { SOM.beep(196, 0.4, 'sawtooth', 0.07, -100); }, 120);
  }

  function atualiza(dt) {
    vel = Math.min(155, vel + dt * 1.8);
    dist += vel * dt;

    var estavaNoChao = jog.noChao;
    jog.abaixado = IN.down.down && jog.noChao;
    jog.h = jog.abaixado ? 7 : 12;
    jog.vy += 560 * dt;
    if (!jog.noChao && IN.down.down) jog.vy += 600 * dt;   // descida rápida
    jog.y += jog.vy * dt;
    if (jog.y >= CHAO - jog.h) {
      jog.y = CHAO - jog.h; jog.vy = 0; jog.noChao = true;
      if (!estavaNoChao) poeira(jog.x + 5, CHAO, COR.cinza, 5, 20);
    } else {
      jog.noChao = false;
    }

    proximo -= vel * dt;
    if (proximo <= 0) { criaObstaculo(); proximo = 58 + Math.random() * 85 + vel * 0.35; }

    var corpo = { x: jog.x + 1, y: jog.y + 1, w: 8, h: jog.h - 1 };
    for (var i = obst.length - 1; i >= 0; i--) {
      var o = obst[i];
      o.x -= vel * dt;
      if (o.x + o.w < -4) { obst.splice(i, 1); continue; }
      if (colide(corpo, o)) { morrer(); return; }
    }
    for (var m = moedas.length - 1; m >= 0; m--) {
      var c = moedas[m];
      c.x -= vel * dt;
      if (c.x < -6) { moedas.splice(m, 1); continue; }
      if (c.ok && colide(corpo, { x: c.x, y: c.y, w: 5, h: 5 })) {
        c.ok = false; bonus += 10;
        poeira(c.x + 2, c.y + 2, COR.ouro, 6, 30);
        SOM.beep(988, 0.06, 'square', 0.06, 300);
      }
    }
  }

  // ---------------- desenho ----------------
  function painel(y, h) {
    g.fillStyle = COR.painel; g.fillRect(10, y, W - 20, h);
    g.fillStyle = COR.linha; g.fillRect(10, y, W - 20, 1); g.fillRect(10, y + h - 1, W - 20, 1);
  }

  function desenhaCubo(x, y, h, t) {
    x = Math.round(x); y = Math.round(y);
    var corpo = h - 2;                        // 2 linhas de perninhas
    g.fillStyle = COR.navy; g.fillRect(x - 1, y - 1, 12, corpo + 2);
    g.fillStyle = COR.laranja; g.fillRect(x, y, 10, 3);
    g.fillStyle = COR.laranja2; g.fillRect(x, y, 5, 1);
    g.fillStyle = COR.azul; g.fillRect(x, y + 3, 5, corpo - 3);
    g.fillStyle = COR.branco; g.fillRect(x + 5, y + 3, 5, corpo - 3);
    g.fillStyle = COR.azul2; g.fillRect(x, y + corpo - 1, 5, 1);
    g.fillStyle = COR.cinza; g.fillRect(x + 5, y + corpo - 1, 5, 1);
    if (corpo > 6) { g.fillStyle = COR.navy; g.fillRect(x + 7, y + 4, 1, 2); g.fillRect(x + 9, y + 4, 1, 2); }
    // perninhas animadas
    g.fillStyle = COR.navy;
    var passo = jog.noChao ? Math.floor(t * 12) % 2 : 0;
    g.fillRect(x + 2 + passo, y + corpo, 2, 2);
    g.fillRect(x + 6 - passo, y + corpo, 2, 2);
  }

  function desenha() {
    var grad = g.createLinearGradient(0, 0, 0, CHAO);
    grad.addColorStop(0, COR.ceu1); grad.addColorStop(1, COR.ceu2);
    g.fillStyle = grad; g.fillRect(0, 0, W, H);

    // estrelas (bem devagar)
    for (var i = 0; i < estrelas.length; i++) {
      var s = estrelas[i], sx = ((s[0] - dist * 0.04) % W + W) % W;
      g.fillStyle = s[2] && Math.floor(relogio * 3 + i) % 2 ? COR.ouro : '#4A5A86';
      g.fillRect(Math.round(sx), s[1], 1, 1);
    }
    // prédios em paralaxe
    var off = (dist * 0.22) % LARG_PREDIOS;
    for (var rep = 0; rep < 2; rep++) {
      for (var p = 0; p < predios.length; p++) {
        var pr = predios[p], px = Math.round(pr.x - off + rep * LARG_PREDIOS);
        if (px > W || px + pr.w < 0) continue;
        g.fillStyle = p % 2 ? COR.predio : COR.predio2;
        g.fillRect(px, CHAO - pr.h, pr.w, pr.h);
        g.fillStyle = COR.janela;
        for (var jy = CHAO - pr.h + 4; jy < CHAO - 4; jy += 6) {
          for (var jx = px + 3; jx < px + pr.w - 3; jx += 5) {
            if (((jx - px) * 7 + jy * 3 + p) % 5 === 0) g.fillRect(jx, jy, 2, 2);
          }
        }
      }
    }
    // chão
    g.fillStyle = COR.terra; g.fillRect(0, CHAO, W, H - CHAO);
    g.fillStyle = COR.chao; g.fillRect(0, CHAO, W, 2);
    g.fillStyle = COR.chao2;
    for (var cx = -(Math.floor(dist) % 10); cx < W; cx += 10) g.fillRect(cx, CHAO + 5, 5, 1);
    for (var cx2 = -(Math.floor(dist * 1.3) % 14); cx2 < W; cx2 += 14) g.fillRect(cx2, CHAO + 12, 3, 1);

    // moedas
    for (var m = 0; m < moedas.length; m++) {
      var c = moedas[m]; if (!c.ok) continue;
      var brilho = Math.floor(relogio * 6 + m) % 3 === 0;
      g.fillStyle = brilho ? '#FFF3B0' : COR.ouro;
      g.fillRect(Math.round(c.x) + 1, c.y, 3, 5); g.fillRect(Math.round(c.x), c.y + 1, 5, 3);
    }
    // obstáculos
    for (var o = 0; o < obst.length; o++) {
      var ob = obst[o], ox = Math.round(ob.x), oy = Math.round(ob.y);
      if (ob.tipo === 'bloco') {
        g.fillStyle = COR.bloco; g.fillRect(ox, oy, ob.w, ob.h);
        g.fillStyle = '#FF8FA6'; g.fillRect(ox, oy, ob.w, 1);
        g.fillStyle = COR.bloco2;
        for (var ly = oy + 3; ly < oy + ob.h; ly += 3) g.fillRect(ox, ly, ob.w, 1);   // camadas de impressão
      } else {
        g.fillStyle = COR.drone2; g.fillRect(ox, oy + 2, ob.w, 4);
        g.fillStyle = COR.drone; g.fillRect(ox + 1, oy + 2, ob.w - 2, 3);
        g.fillStyle = COR.ouro; g.fillRect(ox + 4, oy + 3, 3, 1);
        g.fillStyle = Math.floor(relogio * 20) % 2 ? COR.branco : COR.cinza;
        g.fillRect(ox - 1, oy, 5, 1); g.fillRect(ox + ob.w - 4, oy, 5, 1);
      }
    }
    if (estado !== 'fim') desenhaCubo(jog.x, jog.y, jog.h, relogio);

    for (var q = 0; q < part.length; q++) {
      var pt = part[q]; g.fillStyle = pt.cor; g.fillRect(Math.round(pt.x), Math.round(pt.y), 1, 1);
    }

    // HUD
    g.fillStyle = 'rgba(6,9,18,.7)'; g.fillRect(0, 0, W, 11);
    F.draw(g, pad(pontos(), 5), 3, 3, { cor: COR.texto });
    F.draw(g, 'REC ' + pad(recorde, 5), W - 3, 3, { cor: COR.laranja, align: 'right' });

    var pisca = Math.floor(relogio * 2.5) % 2 === 0;
    if (estado === 'titulo') {
      painel(18, 78);
      F.draw(g, 'PULA', W / 2, 26, { escala: 3, cor: COR.laranja, sombra: '#6A3300', align: 'center' });
      F.draw(g, 'PIXEL', W / 2, 46, { escala: 3, cor: COR.branco, sombra: '#1E3A80', align: 'center' });
      if (pisca) F.draw(g, 'APERTE A OU START', W / 2, 72, { cor: COR.texto, align: 'center' });
      F.draw(g, 'A PULA   BAIXO ABAIXA', W / 2, 84, { cor: COR.apagado, align: 'center' });
    } else if (estado === 'pausa') {
      painel(50, 32);
      F.draw(g, 'PAUSA', W / 2, 56, { escala: 2, cor: COR.texto, align: 'center' });
      F.draw(g, 'START CONTINUA', W / 2, 72, { cor: COR.apagado, align: 'center' });
    } else if (estado === 'fim') {
      painel(34, 60);
      F.draw(g, 'FIM DE JOGO', W / 2, 41, { escala: 2, cor: COR.laranja, align: 'center' });
      F.draw(g, 'PONTOS ' + pontos(), W / 2, 60, { cor: COR.texto, align: 'center' });
      if (novoRecorde) F.draw(g, 'NOVO RECORDE!', W / 2, 70, { cor: COR.ouro, align: 'center' });
      if (tFim > 0.8 && pisca) F.draw(g, 'A PARA JOGAR', W / 2, 82, { cor: COR.texto, align: 'center' });
    }
  }

  // ---------------- laço ----------------
  function quadro(t) {
    var dt = Math.min(0.04, (t - (ultimo || t)) / 1000);
    ultimo = t; relogio += dt;
    if (estado === 'jogo') atualiza(dt);
    else if (estado === 'titulo') dist += 30 * dt;     // cenário andando no título
    if (estado === 'fim') tFim += dt;
    for (var i = part.length - 1; i >= 0; i--) {
      var p = part[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 90 * dt; p.vida -= dt;
      if (p.vida <= 0) part.splice(i, 1);
    }
    desenha();
    requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);
})();
