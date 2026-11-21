/* =========================================================
   INVASORES GAB — jogo original Gab 3D
   Defenda a oficina dos robôs invasores. Tela 160x144.
   ← → move · A atira · START pausa
   ========================================================= */
(function () {
  'use strict';
  var W = 160, H = 144, HUD = 12;
  var tela = document.getElementById('tela');
  var g = tela.getContext('2d');
  var IN = window.GabInput, SOM = window.GabAudio, F = window.GabFont;

  var COR = {
    fundo: '#070B16', texto: '#E6ECF7', apagado: '#6F7EA3', laranja: '#FF8A1A', ouro: '#FFD23F',
    azul: '#1E7BFF', azul2: '#0D4FB8', branco: '#F4F7FC', verde: '#39FF88', roxo: '#8A5CFF', rosa: '#FF4D6D',
    painel: 'rgba(6,9,18,.86)', linha: '#1E7BFF', tiroInim: '#FF4D6D'
  };
  // robôs originais Gab 3D (8x6), 2 quadros de animação cada
  var SPR = {
    cubo: [   // robô-cubo com antenas
      ['.#....#.', '.######.', '##.##.##', '########', '.#....#.', '#......#'],
      ['.#....#.', '.######.', '##.##.##', '########', '.#....#.', '..#..#..']
    ],
    drone: [  // disco voador com luzes
      ['..####..', '.######.', '#.#..#.#', '########', '..#..#..', '........'],
      ['..####..', '.######.', '.#.##.#.', '########', '.#....#.', '........']
    ],
    bico: [   // bico de impressora rebelde
      ['.######.', '.#.##.#.', '.######.', '..####..', '...##...', '..#..#..'],
      ['.######.', '.#.##.#.', '.######.', '..####..', '...##...', '.#....#.']
    ]
  };
  var TIPOS = [
    { spr: 'bico', cor: COR.roxo, pts: 30 },
    { spr: 'drone', cor: COR.verde, pts: 20 },
    { spr: 'drone', cor: COR.verde, pts: 20 },
    { spr: 'cubo', cor: COR.laranja, pts: 10 },
    { spr: 'cubo', cor: COR.laranja, pts: 10 }
  ];
  var CHAVE = 'gab3d.invasores.recorde';
  var recorde = 0;
  try { recorde = parseInt(localStorage.getItem(CHAVE) || '0', 10) || 0; } catch (e) {}

  var estado = 'titulo', relogio = 0, ultimo = 0, tFim = 0, novoRecorde = false;
  var nave = { x: 74, y: 128, w: 11, h: 6 }, recarga = 0, invenc = 0;
  var tiros = [], tirosInim = [], inim = [], part = [], ovni = null, tOvni = 12;
  var dir = 1, tPasso = 0, quadroAnim = 0, tFogo = 1, onda = 1, vidas = 3, pontos = 0, faixa = 0, somPasso = 0;
  var estrelas = [];
  for (var s = 0; s < 40; s++) estrelas.push([Math.floor(Math.random() * W), HUD + Math.floor(Math.random() * (H - HUD)), Math.random()]);

  function pad(n, d) { n = String(n); while (n.length < d) n = '0' + n; return n; }

  function criaOnda() {
    inim = [];
    var desce = Math.min(onda - 1, 5) * 3;
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c < 8; c++) {
        var t = TIPOS[r];
        inim.push({ x: 14 + c * 15, y: HUD + 10 + r * 11 + desce, w: 8, h: 6, tipo: t, vivo: true });
      }
    }
    dir = 1; tPasso = 0; tFogo = 1.2; faixa = 1.6;
  }

  function novoJogo() {
    onda = 1; vidas = 3; pontos = 0; tiros = []; tirosInim = []; part = []; ovni = null; tOvni = 12;
    nave.x = 74; invenc = 0; criaOnda();
    estado = 'jogo';
    SOM.melodia([392, 523, 659, 784], 70);
  }

  function atirar() {
    if (recarga > 0 || tiros.length >= 2) return;
    tiros.push({ x: nave.x + 5, y: nave.y - 3 });
    recarga = 0.22;
    SOM.beep(880, 0.05, 'square', 0.05, -400);
  }

  // ---------------- entrada ----------------
  IN.on('press', function (b) {
    if (estado === 'titulo' || estado === 'fim') {
      if ((b === 'a' || b === 'start') && !(estado === 'fim' && tFim < 0.8)) novoJogo();
      return;
    }
    if (b === 'start') { estado = estado === 'pausa' ? 'jogo' : 'pausa'; SOM.beep(estado === 'pausa' ? 330 : 523, 0.06); return; }
    if (estado === 'jogo' && (b === 'a' || b === 'b')) atirar();
  });
  IN.onPause(function () { if (estado === 'jogo') estado = 'pausa'; });

  // ---------------- lógica ----------------
  function colide(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  function explosao(x, y, cor, n) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = 15 + Math.random() * 45;
      part.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 0.35 + Math.random() * 0.35, cor: cor });
    }
  }

  function vivos() { var n = 0; for (var i = 0; i < inim.length; i++) if (inim[i].vivo) n++; return n; }

  function fim() {
    estado = 'fim'; tFim = 0;
    novoRecorde = pontos > recorde;
    if (novoRecorde) { recorde = pontos; try { localStorage.setItem(CHAVE, String(recorde)); } catch (e) {} }
    SOM.beep(330, 0.14, 'square', 0.08);
    setTimeout(function () { SOM.beep(165, 0.5, 'sawtooth', 0.07, -60); }, 140);
  }

  function atingido() {
    if (invenc > 0) return;
    vidas--; invenc = 1.6;
    explosao(nave.x + 5, nave.y + 3, COR.azul, 16);
    explosao(nave.x + 5, nave.y + 3, COR.laranja, 10);
    SOM.beep(220, 0.3, 'sawtooth', 0.08, -120);
    tirosInim = [];
    if (vidas <= 0) fim();
  }

  function atualiza(dt) {
    if (IN.down.left) nave.x -= 75 * dt;
    if (IN.down.right) nave.x += 75 * dt;
    nave.x = Math.max(2, Math.min(W - 2 - nave.w, nave.x));
    if (recarga > 0) recarga -= dt;
    if (invenc > 0) invenc -= dt;
    if (faixa > 0) faixa -= dt;

    // formação: anda em passos, mais rápida com menos robôs
    var n = vivos();
    var intervalo = Math.max(0.05, 0.6 - (40 - n) * 0.013 - (onda - 1) * 0.04);
    tPasso += dt;
    if (tPasso >= intervalo) {
      tPasso = 0; quadroAnim ^= 1;
      var bate = false;
      for (var i = 0; i < inim.length; i++) {
        var e = inim[i]; if (!e.vivo) continue;
        if ((dir > 0 && e.x + e.w + 2 > W - 3) || (dir < 0 && e.x - 2 < 3)) { bate = true; break; }
      }
      for (var j = 0; j < inim.length; j++) {
        var f = inim[j]; if (!f.vivo) continue;
        if (bate) f.y += 4; else f.x += dir * 2;
        if (f.y + f.h >= nave.y) { fim(); return; }
      }
      if (bate) dir = -dir;
      somPasso = (somPasso + 1) % 4;
      SOM.beep([98, 92, 87, 82][somPasso], 0.07, 'square', 0.04);
    }

    // robôs atiram (só o de baixo de cada coluna)
    tFogo -= dt;
    if (tFogo <= 0) {
      tFogo = Math.max(0.35, 1.1 - onda * 0.1) * (0.6 + Math.random() * 0.8);
      var baixo = {};
      for (var k = 0; k < inim.length; k++) {
        var b = inim[k]; if (!b.vivo) continue;
        var col = Math.round(b.x);
        if (!baixo[col] || baixo[col].y < b.y) baixo[col] = b;
      }
      var lista = Object.keys(baixo).map(function (c) { return baixo[c]; });
      if (lista.length) {
        var at = lista[Math.floor(Math.random() * lista.length)];
        tirosInim.push({ x: at.x + 3, y: at.y + 6 });
      }
    }

    // nave misteriosa
    tOvni -= dt;
    if (!ovni && tOvni <= 0) { ovni = { x: -16, y: HUD + 2, w: 14, h: 5, vx: 32 }; if (Math.random() < 0.5) { ovni.x = W + 2; ovni.vx = -32; } }
    if (ovni) {
      ovni.x += ovni.vx * dt;
      if (Math.floor(relogio * 8) % 2) SOM.beep(1400, 0.02, 'triangle', 0.015);
      if (ovni.x < -20 || ovni.x > W + 20) { ovni = null; tOvni = 14 + Math.random() * 10; }
    }

    // tiros da nave
    for (var t = tiros.length - 1; t >= 0; t--) {
      var tr = tiros[t]; tr.y -= 175 * dt;
      var caixa = { x: tr.x, y: tr.y, w: 1, h: 4 };
      if (tr.y < HUD) { tiros.splice(t, 1); continue; }
      var acertou = false;
      for (var q = 0; q < inim.length; q++) {
        var r = inim[q];
        if (r.vivo && colide(caixa, r)) {
          r.vivo = false; pontos += r.tipo.pts; acertou = true;
          explosao(r.x + 4, r.y + 3, r.tipo.cor, 10);
          SOM.beep(180, 0.08, 'square', 0.06, -120);
          break;
        }
      }
      if (!acertou && ovni && colide(caixa, ovni)) {
        var valor = [50, 100, 150, 300][Math.floor(Math.random() * 4)];
        pontos += valor; explosao(ovni.x + 7, ovni.y + 2, COR.rosa, 18);
        SOM.melodia([784, 988, 1175], 60);
        ovni = null; tOvni = 16 + Math.random() * 10; acertou = true;
      }
      if (acertou) tiros.splice(t, 1);
    }
    // tiros inimigos
    for (var u = tirosInim.length - 1; u >= 0; u--) {
      var ti = tirosInim[u]; ti.y += (68 + onda * 8) * dt;
      if (ti.y > H) { tirosInim.splice(u, 1); continue; }
      if (colide({ x: ti.x, y: ti.y, w: 2, h: 4 }, nave)) { tirosInim.splice(u, 1); atingido(); if (estado !== 'jogo') return; }
    }

    if (vivos() === 0) {
      onda++; pontos += 100; tiros = []; tirosInim = [];
      SOM.melodia([523, 659, 784, 1047], 90);
      criaOnda();
    }
  }

  // ---------------- desenho ----------------
  function sprite(nome, x, y, cor) {
    var rows = SPR[nome][quadroAnim];
    g.fillStyle = cor;
    for (var r = 0; r < rows.length; r++) for (var c = 0; c < 8; c++) if (rows[r][c] === '#') g.fillRect(x + c, y + r, 1, 1);
  }

  function desenhaNave(x, y) {
    x = Math.round(x); y = Math.round(y);
    g.fillStyle = COR.azul2; g.fillRect(x, y + 3, 11, 3);
    g.fillStyle = COR.azul; g.fillRect(x + 1, y + 2, 9, 3);
    g.fillStyle = COR.branco; g.fillRect(x + 4, y, 3, 3);
    g.fillStyle = COR.laranja; g.fillRect(x + 5, y + 1, 1, 1); g.fillRect(x + 1, y + 5, 2, 1); g.fillRect(x + 8, y + 5, 2, 1);
  }

  function painel(y, h) {
    g.fillStyle = COR.painel; g.fillRect(10, y, W - 20, h);
    g.fillStyle = COR.linha; g.fillRect(10, y, W - 20, 1); g.fillRect(10, y + h - 1, W - 20, 1);
  }

  function desenha() {
    g.fillStyle = COR.fundo; g.fillRect(0, 0, W, H);
    for (var s = 0; s < estrelas.length; s++) {
      var es = estrelas[s];
      g.fillStyle = (Math.floor(relogio * 2 + es[2] * 10) % 4 === 0) ? '#FFFFFF' : '#2E3B63';
      g.fillRect(es[0], es[1], 1, 1);
    }
    // chão da oficina
    g.fillStyle = '#0D1630'; g.fillRect(0, 136, W, 8);
    g.fillStyle = COR.azul; g.fillRect(0, 136, W, 1);

    if (estado !== 'titulo') {
      for (var i = 0; i < inim.length; i++) { var e = inim[i]; if (e.vivo) sprite(e.tipo.spr, Math.round(e.x), Math.round(e.y), e.tipo.cor); }
      if (ovni) {
        var ox = Math.round(ovni.x), oy = ovni.y;
        g.fillStyle = COR.rosa; g.fillRect(ox + 2, oy + 1, 10, 3); g.fillRect(ox, oy + 2, 14, 2);
        g.fillStyle = COR.branco; g.fillRect(ox + 5, oy, 4, 1);
        g.fillStyle = Math.floor(relogio * 10) % 2 ? COR.ouro : COR.branco;
        g.fillRect(ox + 2, oy + 4, 1, 1); g.fillRect(ox + 6, oy + 4, 2, 1); g.fillRect(ox + 11, oy + 4, 1, 1);
      }
      g.fillStyle = COR.ouro;
      for (var t = 0; t < tiros.length; t++) g.fillRect(Math.round(tiros[t].x), Math.round(tiros[t].y), 1, 4);
      g.fillStyle = COR.tiroInim;
      for (var u = 0; u < tirosInim.length; u++) {
        var ti = tirosInim[u], zig = Math.floor(ti.y / 3) % 2;
        g.fillRect(Math.round(ti.x) + zig, Math.round(ti.y), 1, 2); g.fillRect(Math.round(ti.x) + 1 - zig, Math.round(ti.y) + 2, 1, 2);
      }
      if (estado !== 'fim' && !(invenc > 0 && Math.floor(relogio * 12) % 2)) desenhaNave(nave.x, nave.y);
    }
    for (var p = 0; p < part.length; p++) { var q = part[p]; g.fillStyle = q.cor; g.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); }

    // HUD
    g.fillStyle = '#060912'; g.fillRect(0, 0, W, HUD);
    g.fillStyle = COR.linha; g.fillRect(0, HUD - 1, W, 1);
    F.draw(g, pad(pontos, 5), 3, 3, { cor: COR.texto });
    F.draw(g, 'ONDA ' + onda, W / 2, 3, { cor: COR.laranja, align: 'center' });
    for (var v = 0; v < Math.max(0, vidas); v++) {
      var vx = W - 10 - v * 9;
      g.fillStyle = COR.azul; g.fillRect(vx, 6, 7, 3); g.fillStyle = COR.branco; g.fillRect(vx + 3, 4, 1, 2);
    }

    var pisca = Math.floor(relogio * 2.5) % 2 === 0;
    if (estado === 'titulo') {
      quadroAnim = Math.floor(relogio * 2) % 2;
      sprite('bico', 44, 22, COR.roxo); sprite('drone', 76, 22, COR.verde); sprite('cubo', 108, 22, COR.laranja);
      F.draw(g, 'INVASORES', W / 2, 40, { escala: 2, cor: COR.verde, sombra: '#0B5A33', align: 'center' });
      F.draw(g, 'GAB', W / 2, 54, { escala: 3, cor: COR.laranja, sombra: '#6A3300', align: 'center' });
      F.draw(g, '= 30', 88, 82, { cor: COR.texto }); sprite('bico', 70, 81, COR.roxo);
      F.draw(g, '= 20', 88, 92, { cor: COR.texto }); sprite('drone', 70, 91, COR.verde);
      F.draw(g, '= 10', 88, 102, { cor: COR.texto }); sprite('cubo', 70, 101, COR.laranja);
      if (pisca) F.draw(g, 'APERTE A OU START', W / 2, 118, { cor: COR.texto, align: 'center' });
      F.draw(g, 'RECORDE ' + recorde, W / 2, 128, { cor: COR.ouro, align: 'center' });
    } else if (estado === 'jogo' && faixa > 0) {
      painel(64, 20); F.draw(g, 'ONDA ' + onda, W / 2, 68, { escala: 2, cor: COR.ouro, align: 'center' });
    } else if (estado === 'pausa') {
      painel(56, 32);
      F.draw(g, 'PAUSA', W / 2, 62, { escala: 2, cor: COR.texto, align: 'center' });
      F.draw(g, 'START CONTINUA', W / 2, 78, { cor: COR.apagado, align: 'center' });
    } else if (estado === 'fim') {
      painel(40, 62);
      F.draw(g, 'FIM DE JOGO', W / 2, 47, { escala: 2, cor: COR.laranja, align: 'center' });
      F.draw(g, 'PONTOS ' + pontos, W / 2, 66, { cor: COR.texto, align: 'center' });
      if (novoRecorde) F.draw(g, 'NOVO RECORDE!', W / 2, 76, { cor: COR.ouro, align: 'center' });
      if (tFim > 0.8 && pisca) F.draw(g, 'A PARA JOGAR', W / 2, 90, { cor: COR.texto, align: 'center' });
    }
  }

  // ---------------- laço ----------------
  function quadro(t) {
    var dt = Math.min(0.04, (t - (ultimo || t)) / 1000);
    ultimo = t; relogio += dt;
    if (estado === 'jogo') atualiza(dt);
    if (estado === 'fim') tFim += dt;
    for (var i = part.length - 1; i >= 0; i--) {
      var p = part[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vida -= dt;
      if (p.vida <= 0) part.splice(i, 1);
    }
    desenha();
    requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);
})();
