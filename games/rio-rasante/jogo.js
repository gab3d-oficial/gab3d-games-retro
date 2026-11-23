/* =========================================================
   RIVER RUSH (Rio Rasante) — jogo original Gab 3D
   Voe rio acima, destrua inimigos e pontes e não deixe o
   combustível acabar. Tela 160x144.
   ← → desvia · ↑ acelera · ↓ freia · A atira · START pausa
   ========================================================= */
(function () {
  'use strict';
  var W = 160, H = 144, HUD = 11, LIN = 4;     // cada "linha" do rio tem 4 px
  var tela = document.getElementById('tela');
  var g = tela.getContext('2d');
  var IN = window.GabInput, SOM = window.GabAudio, F = window.GabFont;

  var COR = {
    terra: '#2F8F4E', terra2: '#257A41', terra3: '#3FA862', agua: '#1E7BFF', agua2: '#5AA6FF', margem: '#E8D9A8',
    estrada: '#5A6378', estrada2: '#E6ECF7', ponte: '#C8650A', ponte2: '#FFB466',
    branco: '#F4F7FC', cinza: '#AEB9CF', azul: '#1E7BFF', azul2: '#0D4FB8', laranja: '#FF8A1A', navy: '#0A0F1C',
    vermelho: '#FF4D6D', vermelho2: '#A61E3B', amarelo: '#FFD23F', roxo: '#8A5CFF', verde: '#39FF88',
    texto: '#E6ECF7', apagado: '#6F7EA3', painel: 'rgba(6,9,18,.86)', linha: '#1E7BFF'
  };
  var CHAVE = 'gab3d.riorasante.recorde';
  var recorde = 0;
  try { recorde = parseInt(localStorage.getItem(CHAVE) || '0', 10) || 0; } catch (e) {}

  // ---------------- estado ----------------
  var estado = 'titulo', relogio = 0, ultimo = 0, tEstado = 0, novoRecorde = false;
  var cam = 0, linhas = [], ents = [], tiros = [], part = [];
  var aviao = { x: 76, y: 116, w: 9, h: 9, inclina: 0 };
  var combustivel = 1, vidas = 3, pontos = 0, invenc = 0, ultimaPonte = 0, trecho = 0;
  var gerador = null, recarga = 0, alarme = 0, abastecendo = false;

  // ---------------- gerador do rio ----------------
  function novoGerador(semente) {
    var s = semente || 1;
    function rnd() { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }
    return { rnd: rnd, cx: 80, larg: 70, alvoCx: 80, alvoLarg: 70, cont: 0, linha: 0, ilha: 0, alvoIlha: 0 };
  }

  var TRECHO = 46;   // linhas entre pontes

  function geraLinha() {
    var gen = gerador, r = gen.linha, pos = r % TRECHO;
    var lin = { l: 0, r: W, il: 0, ir: 0, ponte: false };
    if (pos < 6) {                                    // chegada estreita da ponte
      gen.cx += (80 - gen.cx) * 0.4; gen.larg += (34 - gen.larg) * 0.5; gen.ilha = 0; gen.alvoIlha = 0;
      if (pos === 3 && r > TRECHO) lin.ponte = true;
    } else {
      if (gen.cont-- <= 0) {
        var dificil = Math.min(1, r / 900);
        gen.alvoLarg = 30 + gen.rnd() * (100 - dificil * 40);
        gen.alvoCx = 18 + gen.alvoLarg / 2 + gen.rnd() * (W - 36 - gen.alvoLarg);
        gen.alvoIlha = gen.alvoLarg > 84 && gen.rnd() < 0.55 ? gen.alvoLarg * (0.25 + gen.rnd() * 0.2) : 0;
        gen.cont = 6 + Math.floor(gen.rnd() * 10);
      }
      gen.cx += Math.max(-2, Math.min(2, gen.alvoCx - gen.cx));
      gen.larg += Math.max(-3, Math.min(3, gen.alvoLarg - gen.larg));
      gen.ilha += Math.max(-3, Math.min(3, gen.alvoIlha - gen.ilha));
    }
    lin.l = Math.round(gen.cx - gen.larg / 2); lin.r = Math.round(gen.cx + gen.larg / 2);
    if (gen.ilha > 6) { lin.il = Math.round(gen.cx - gen.ilha / 2); lin.ir = Math.round(gen.cx + gen.ilha / 2); }
    linhas[r] = lin;

    // ponte
    if (lin.ponte) ents.push({ tipo: 'ponte', y: r * LIN, x: lin.l, w: lin.r - lin.l, h: 8, vivo: true, linha: r });
    // inimigos e tanques
    else if (pos > 8 && gen.rnd() < 0.085) {
      var t = gen.rnd(), tipo = t < 0.34 ? 'barco' : t < 0.62 ? 'heli' : t < 0.9 ? 'tanque' : 'jato';
      if (tipo === 'jato' && r < 120) tipo = 'barco';
      var tam = { barco: [14, 5], heli: [11, 7], tanque: [8, 14], jato: [11, 5] }[tipo];
      var xs = [];
      if (lin.il) { xs.push([lin.l + 2, lin.il - tam[0] - 2]); xs.push([lin.ir + 2, lin.r - tam[0] - 2]); }
      else xs.push([lin.l + 2, lin.r - tam[0] - 2]);
      var faixa = xs[Math.floor(gen.rnd() * xs.length)];
      if (faixa[1] > faixa[0] || tipo === 'jato') {
        var ex = tipo === 'jato' ? (gen.rnd() < 0.5 ? -14 : W + 2) : faixa[0] + gen.rnd() * (faixa[1] - faixa[0]);
        var dir = tipo === 'jato' ? (ex < 0 ? 1 : -1) : (gen.rnd() < 0.5 ? -1 : 1);
        ents.push({ tipo: tipo, x: ex, y: r * LIN, w: tam[0], h: tam[1], vivo: true, ativo: false, dir: dir, linha: r });
      }
    }
    gen.linha++;
  }

  function telaY(mundoY) { return H - (mundoY - cam) - LIN; }
  function linhaEm(yTela) { return linhas[Math.ceil((H - yTela + cam - LIN) / LIN)]; }
  function ehTerra(x, yTela) {
    var lin = linhaEm(yTela);
    if (!lin) return false;
    if (x < lin.l || x > lin.r) return true;
    if (lin.il && x > lin.il && x < lin.ir) return true;
    return false;
  }

  // ---------------- início / reinício ----------------
  function preparaRio(apartir) {
    linhas = []; ents = []; tiros = []; part = [];
    gerador = novoGerador(12345 + apartir * 7);
    gerador.linha = 0;
    // pula até o trecho salvo, sem guardar inimigos antigos
    while (gerador.linha < apartir) geraLinha();
    ents = ents.filter(function (e) { return e.linha >= apartir + 6; });
    cam = apartir * LIN;
    while (gerador.linha * LIN < cam + H + 40) geraLinha();
    var lin = linhaEm(aviao.y + 4);
    aviao.x = lin ? (lin.l + lin.r) / 2 - 4 : 76;
    if (lin && lin.il && aviao.x + 9 > lin.il && aviao.x < lin.ir) aviao.x = lin.l + 4;
  }

  function novoJogo() {
    vidas = 3; pontos = 0; combustivel = 1; ultimaPonte = 0; trecho = 1; invenc = 1.2;
    preparaRio(0);
    estado = 'jogo'; tEstado = 0;
    SOM.melodia([392, 523, 659, 784], 70);
  }

  // ---------------- entrada ----------------
  IN.on('press', function (b) {
    if (estado === 'titulo' || estado === 'fim') {
      if ((b === 'a' || b === 'start') && tEstado > 0.8) novoJogo();
      return;
    }
    if (b === 'start' && (estado === 'jogo' || estado === 'pausa')) {
      estado = estado === 'pausa' ? 'jogo' : 'pausa'; SOM.beep(estado === 'pausa' ? 330 : 523, 0.06); return;
    }
  });
  IN.onPause(function () { if (estado === 'jogo') estado = 'pausa'; });

  // ---------------- explosões ----------------
  function explosao(x, y, cores, n) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = 15 + Math.random() * 55;
      part.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 0.35 + Math.random() * 0.45, cor: cores[i % cores.length] });
    }
    SOM.beep(140 + Math.random() * 40, 0.25, 'sawtooth', 0.07, -90);
  }

  function colide(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  function cai() {
    if (estado !== 'jogo') return;
    explosao(aviao.x + 4, aviao.y + 4, [COR.laranja, COR.amarelo, COR.branco, COR.vermelho], 28);
    vidas--; estado = 'caiu'; tEstado = 0;
  }

  // ---------------- atualização ----------------
  function atualiza(dt) {
    var vel = IN.down.up ? 58 : IN.down.down ? 16 : 32;
    cam += vel * dt;
    while (gerador.linha * LIN < cam + H + 40) geraLinha();

    // avião
    var mov = 0;
    if (IN.down.left) mov -= 1;
    if (IN.down.right) mov += 1;
    aviao.x = Math.max(0, Math.min(W - aviao.w, aviao.x + mov * 68 * dt));
    aviao.inclina = mov;
    if (invenc > 0) invenc -= dt;

    // combustível
    combustivel -= dt * (0.042 + (vel - 32) * 0.0004);
    abastecendo = false;
    if (combustivel <= 0) { combustivel = 0; cai(); return; }
    if (combustivel < 0.25) {
      alarme -= dt;
      if (alarme <= 0) { SOM.beep(880, 0.08, 'square', 0.05); alarme = 0.5; }
    }

    // tiro (segurar A atira em sequência)
    recarga -= dt;
    if ((IN.down.a || IN.down.b) && recarga <= 0 && tiros.length < 2) {
      tiros.push({ x: aviao.x + 4, y: aviao.y - 4, w: 1, h: 5 });
      recarga = 0.2;
      SOM.beep(1100, 0.04, 'square', 0.04, -500);
    }
    for (var t = tiros.length - 1; t >= 0; t--) {
      var tr = tiros[t]; tr.y -= 170 * dt;
      if (tr.y < HUD) { tiros.splice(t, 1); continue; }
      if (ehTerra(tr.x, tr.y)) { tiros.splice(t, 1); continue; }
      for (var k = 0; k < ents.length; k++) {
        var e = ents[k]; if (!e.vivo) continue;
        var caixa = { x: e.x, y: telaY(e.y) - e.h + LIN, w: e.w, h: e.h };
        if (colide(tr, caixa)) {
          e.vivo = false; tiros.splice(t, 1);
          var val = { barco: 30, heli: 60, jato: 100, tanque: 80, ponte: 500 }[e.tipo];
          pontos += val;
          explosao(caixa.x + e.w / 2, caixa.y + e.h / 2, e.tipo === 'tanque' ? [COR.laranja, COR.branco] : [COR.amarelo, COR.laranja, COR.vermelho], e.tipo === 'ponte' ? 40 : 16);
          if (e.tipo === 'ponte') {
            linhas[e.linha].ponte = false;
            ultimaPonte = e.linha; trecho++;
            SOM.melodia([523, 659, 784, 1047], 70);
          }
          break;
        }
      }
    }

    // inimigos
    var corpo = { x: aviao.x + 1, y: aviao.y + 1, w: aviao.w - 2, h: aviao.h - 2 };
    for (var i = ents.length - 1; i >= 0; i--) {
      var en = ents[i];
      var ty = telaY(en.y);
      if (ty > H + 20) { ents.splice(i, 1); continue; }
      if (ty < -30 || !en.vivo) continue;
      if (!en.ativo && (en.tipo === 'jato' || ty > 20 + (en.linha * 37 % 50))) en.ativo = true;
      if (en.ativo) {
        if (en.tipo === 'jato') en.x += en.dir * 60 * dt;
        else if (en.tipo === 'barco' || en.tipo === 'heli') {
          var nx = en.x + en.dir * (en.tipo === 'heli' ? 26 : 16) * dt;
          var yMeio = ty - en.h / 2 + LIN;
          if (ehTerra(nx, yMeio) || ehTerra(nx + en.w, yMeio)) en.dir = -en.dir; else en.x = nx;
        }
        if (en.tipo === 'jato' && (en.x < -20 || en.x > W + 20)) { ents.splice(i, 1); continue; }
      }
      var cx = { x: en.x, y: ty - en.h + LIN, w: en.w, h: en.h };
      if (colide(corpo, cx)) {
        if (en.tipo === 'tanque') {
          abastecendo = true;
          combustivel = Math.min(1, combustivel + dt * 0.45);
          if (Math.floor(relogio * 12) % 2 === 0) SOM.beep(660 + combustivel * 500, 0.03, 'triangle', 0.04);
        } else if (invenc <= 0) { en.vivo = false; cai(); return; }
      }
    }
    // terra
    if (invenc <= 0) {
      var pontosAviao = [[aviao.x + 4, aviao.y + 1], [aviao.x + 1, aviao.y + 5], [aviao.x + 8, aviao.y + 5], [aviao.x + 4, aviao.y + 8]];
      for (var p = 0; p < pontosAviao.length; p++) if (ehTerra(pontosAviao[p][0], pontosAviao[p][1])) { cai(); return; }
    }
  }

  // ---------------- desenho ----------------
  function painel(y, h) {
    g.fillStyle = COR.painel; g.fillRect(10, y, W - 20, h);
    g.fillStyle = COR.linha; g.fillRect(10, y, W - 20, 1); g.fillRect(10, y + h - 1, W - 20, 1);
  }

  function desenhaAviao(x, y, inc) {
    x = Math.round(x); y = Math.round(y);
    var asaE = inc < 0 ? 1 : 0, asaD = inc > 0 ? 1 : 0;
    g.fillStyle = COR.navy; g.fillRect(x + 3, y - 1, 3, 11); g.fillRect(x - 1 + asaE, y + 3, 11 - asaE - asaD, 4);
    g.fillStyle = COR.branco; g.fillRect(x + 4, y, 1, 9); g.fillRect(x + 3, y + 1, 3, 7);
    g.fillStyle = COR.azul; g.fillRect(x + asaE, y + 4, 9 - asaE - asaD, 2);
    g.fillStyle = COR.azul2; g.fillRect(x + 2, y + 7, 5, 1);
    g.fillStyle = COR.laranja; g.fillRect(x + 4, y + 2, 1, 2); g.fillRect(x + 3, y + 8, 3, 1);
    // chama do motor
    if (Math.floor(relogio * 20) % 2) { g.fillStyle = COR.amarelo; g.fillRect(x + 4, y + 9, 1, 2); }
  }

  function desenhaEnt(e) {
    var x = Math.round(e.x), y = Math.round(telaY(e.y) - e.h + LIN);
    if (!e.vivo) return;
    if (e.tipo === 'ponte') {
      g.fillStyle = COR.ponte; g.fillRect(x, y, e.w, e.h);
      g.fillStyle = COR.ponte2; g.fillRect(x, y, e.w, 1);
      g.fillStyle = '#7A3A05'; for (var k = x; k < x + e.w; k += 6) g.fillRect(k, y + 2, 1, e.h - 2);
      g.fillStyle = COR.amarelo; for (var k2 = x + 2; k2 < x + e.w - 2; k2 += 6) g.fillRect(k2, y + 4, 3, 1);
    } else if (e.tipo === 'barco') {
      var d = e.dir > 0;
      g.fillStyle = COR.navy; g.fillRect(x, y + 2, e.w, 3); g.fillRect(d ? x + e.w - 2 : x, y + 1, 2, 2);
      g.fillStyle = COR.cinza; g.fillRect(x + 1, y + 2, e.w - 2, 2);
      g.fillStyle = COR.branco; g.fillRect(x + 4, y, 5, 2);
      g.fillStyle = COR.vermelho; g.fillRect(x + 5, y - 1, 2, 1);
      g.fillStyle = COR.agua2; g.fillRect(d ? x - 2 : x + e.w, y + 4, 2, 1);
    } else if (e.tipo === 'heli') {
      g.fillStyle = COR.vermelho2; g.fillRect(x + 2, y + 2, 7, 4);
      g.fillStyle = COR.vermelho; g.fillRect(x + 3, y + 2, 5, 3);
      g.fillStyle = COR.branco; g.fillRect(e.dir > 0 ? x + 6 : x + 3, y + 3, 2, 1);
      g.fillStyle = COR.vermelho2; g.fillRect(e.dir > 0 ? x : x + 9, y + 3, 2, 1);
      g.fillStyle = Math.floor(relogio * 18) % 2 ? COR.branco : COR.cinza;
      g.fillRect(x, y, 11, 1); g.fillRect(x + 5, y + 1, 1, 1);
      g.fillStyle = COR.navy; g.fillRect(x + 3, y + 6, 5, 1);
    } else if (e.tipo === 'jato') {
      g.fillStyle = COR.roxo; g.fillRect(x + 1, y + 2, 9, 2);
      g.fillStyle = '#B59BFF'; g.fillRect(e.dir > 0 ? x + 8 : x, y + 2, 3, 1);
      g.fillStyle = COR.roxo; g.fillRect(x + 4, y, 3, 5);
      g.fillStyle = COR.amarelo; g.fillRect(e.dir > 0 ? x - 1 : x + 11, y + 2, 1, 2);
    } else if (e.tipo === 'tanque') {
      g.fillStyle = COR.navy; g.fillRect(x - 1, y - 1, e.w + 2, e.h + 2);
      for (var s = 0; s < e.h; s += 4) { g.fillStyle = (s / 4) % 2 ? COR.branco : COR.laranja; g.fillRect(x, y + s, e.w, 4); }
      g.fillStyle = COR.navy; F.draw(g, 'C', x + 3, y + 5, { cor: COR.navy });
    }
  }

  function desenhaRio() {
    var r0 = Math.max(0, Math.floor(cam / LIN) - 1), r1 = Math.min(linhas.length - 1, r0 + Math.ceil(H / LIN) + 2);
    g.fillStyle = COR.terra; g.fillRect(0, 0, W, H);
    for (var r = r0; r <= r1; r++) {
      var lin = linhas[r]; if (!lin) continue;
      var y = Math.round(telaY(r * LIN));
      g.fillStyle = COR.agua; g.fillRect(lin.l, y, lin.r - lin.l, LIN);
      if (lin.il) { g.fillStyle = COR.terra; g.fillRect(lin.il, y, lin.ir - lin.il, LIN); }
      // areia nas margens
      g.fillStyle = COR.margem; g.fillRect(lin.l - 1, y, 1, LIN); g.fillRect(lin.r, y, 1, LIN);
      if (lin.il) { g.fillRect(lin.il, y, 1, LIN); g.fillRect(lin.ir - 1, y, 1, LIN); }
      // ondinhas
      if ((r * 7) % 5 === 0) { g.fillStyle = COR.agua2; g.fillRect(lin.l + ((r * 13) % Math.max(1, lin.r - lin.l - 4)), y + 1, 3, 1); }
      // textura da terra e árvores
      if ((r * 11) % 7 === 0) {
        g.fillStyle = COR.terra2;
        for (var tx = (r * 17) % 23; tx < W; tx += 23) if (tx < lin.l - 4 || tx > lin.r + 4) { g.fillRect(tx, y, 4, 3); g.fillStyle = COR.terra3; g.fillRect(tx + 1, y, 2, 1); g.fillStyle = COR.terra2; }
      }
      // estrada que chega na ponte
      if (r % TRECHO === 3) {
        g.fillStyle = COR.estrada; g.fillRect(0, y - 4, lin.l, 8); g.fillRect(lin.r, y - 4, W - lin.r, 8);
        g.fillStyle = COR.estrada2; for (var ex = 2; ex < W; ex += 8) if (ex < lin.l - 3 || ex > lin.r + 1) g.fillRect(ex, y, 4, 1);
      }
    }
  }

  function desenha() {
    desenhaRio();
    for (var i = 0; i < ents.length; i++) desenhaEnt(ents[i]);
    g.fillStyle = COR.amarelo;
    for (var t = 0; t < tiros.length; t++) g.fillRect(Math.round(tiros[t].x), Math.round(tiros[t].y), 1, 5);
    if (estado === 'jogo' || estado === 'pausa' || estado === 'titulo') {
      if (!(invenc > 0 && Math.floor(relogio * 12) % 2)) desenhaAviao(aviao.x, aviao.y, aviao.inclina);
    }
    for (var p = 0; p < part.length; p++) { var q = part[p]; g.fillStyle = q.cor; g.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); }

    // HUD
    g.fillStyle = 'rgba(6,9,18,.85)'; g.fillRect(0, 0, W, HUD);
    g.fillStyle = COR.linha; g.fillRect(0, HUD - 1, W, 1);
    F.draw(g, String(pontos).padStart(6, '0'), 3, 3, { cor: COR.texto });
    // marcador de combustível
    F.draw(g, 'V', 62, 3, { cor: COR.vermelho });
    g.fillStyle = '#26314F'; g.fillRect(67, 3, 40, 5);
    var nivel = Math.round(38 * combustivel);
    g.fillStyle = combustivel < 0.25 ? (Math.floor(relogio * 4) % 2 ? COR.vermelho : COR.laranja) : abastecendo ? COR.verde : COR.amarelo;
    g.fillRect(68, 4, nivel, 3);
    F.draw(g, 'C', 109, 3, { cor: COR.verde });
    for (var v = 0; v < Math.max(0, vidas); v++) {
      var vx = W - 8 - v * 8;
      g.fillStyle = COR.branco; g.fillRect(vx + 2, 2, 1, 7); g.fillStyle = COR.azul; g.fillRect(vx, 5, 5, 2);
    }

    var pisca = Math.floor(relogio * 2.5) % 2 === 0;
    if (estado === 'titulo') {
      painel(18, 104);
      F.draw(g, 'RIVER', W / 2, 24, { escala: 3, cor: COR.agua2, sombra: '#0D2A66', align: 'center' });
      F.draw(g, 'RUSH', W / 2, 44, { escala: 2, cor: COR.laranja, sombra: '#6A3300', align: 'center' });
      F.draw(g, 'A ATIRA  CIMA ACELERA', W / 2, 62, { cor: COR.apagado, align: 'center' });
      F.draw(g, 'PASSE NOS TANQUES', W / 2, 72, { cor: COR.texto, align: 'center' });
      F.draw(g, 'PARA ABASTECER', W / 2, 80, { cor: COR.texto, align: 'center' });
      F.draw(g, 'DERRUBE AS PONTES', W / 2, 90, { cor: COR.ponte2, align: 'center' });
      if (pisca) F.draw(g, 'APERTE A OU START', W / 2, 102, { cor: COR.texto, align: 'center' });
      F.draw(g, 'RECORDE ' + recorde, W / 2, 112, { cor: COR.amarelo, align: 'center' });
    } else if (estado === 'pausa') {
      painel(52, 32);
      F.draw(g, 'PAUSA', W / 2, 58, { escala: 2, cor: COR.texto, align: 'center' });
      F.draw(g, 'START CONTINUA', W / 2, 74, { cor: COR.apagado, align: 'center' });
    } else if (estado === 'caiu' && tEstado > 0.6) {
      painel(56, 22);
      F.draw(g, combustivel <= 0 ? 'SEM COMBUSTIVEL!' : 'ABATIDO!', W / 2, 60, { cor: COR.laranja, align: 'center' });
      F.draw(g, 'VIDAS ' + Math.max(0, vidas), W / 2, 69, { cor: COR.texto, align: 'center' });
    } else if (estado === 'fim') {
      painel(36, 62);
      F.draw(g, 'FIM DE JOGO', W / 2, 43, { escala: 2, cor: COR.laranja, align: 'center' });
      F.draw(g, 'PONTOS ' + pontos, W / 2, 62, { cor: COR.texto, align: 'center' });
      F.draw(g, 'PONTES ' + (trecho - 1), W / 2, 71, { cor: COR.ponte2, align: 'center' });
      if (novoRecorde) F.draw(g, 'NOVO RECORDE!', W / 2, 80, { cor: COR.amarelo, align: 'center' });
      if (tEstado > 0.8 && pisca) F.draw(g, 'A PARA JOGAR', W / 2, 90, { cor: COR.texto, align: 'center' });
    }
  }

  // ---------------- laço ----------------
  function quadro(t) {
    var dt = Math.min(0.033, (t - (ultimo || t)) / 1000);
    ultimo = t; relogio += dt; tEstado += dt;
    if (estado === 'titulo') {
      if (!gerador) preparaRio(0);
      cam += 20 * dt;
      while (gerador.linha * LIN < cam + H + 40) geraLinha();
      var lin = linhaEm(aviao.y + 4);
      if (lin) aviao.x += (((lin.il ? (lin.l + lin.il) / 2 : (lin.l + lin.r) / 2) - 4) - aviao.x) * Math.min(1, dt * 3);
    } else if (estado === 'jogo') {
      atualiza(dt);
    } else if (estado === 'caiu') {
      if (tEstado > 1.8) {
        if (vidas <= 0) {
          estado = 'fim'; tEstado = 0;
          novoRecorde = pontos > recorde;
          if (novoRecorde) { recorde = pontos; try { localStorage.setItem(CHAVE, String(recorde)); } catch (e) {} }
        } else {
          combustivel = 1; invenc = 1.5;
          preparaRio(ultimaPonte ? ultimaPonte + 1 : 0);
          estado = 'jogo'; tEstado = 0;
        }
      }
    }
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
