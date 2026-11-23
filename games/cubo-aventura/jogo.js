/* =========================================================
   CUBE QUEST (Cubo Aventura) — jogo de plataforma original Gab 3D
   O cubo Gab 3D atravessa a oficina até o portal.
   ← → anda · segure B corre · A pula · START pausa
   ========================================================= */
(function () {
  'use strict';
  var W = 160, H = 144, T = 8, LINS = 18;
  var tela = document.getElementById('tela');
  var g = tela.getContext('2d');
  var IN = window.GabInput, SOM = window.GabAudio, F = window.GabFont;

  var COR = {
    ceu1: '#0A0F1C', ceu2: '#1B3266', morro: '#14244A', morro2: '#1A2F5C', nuvem: '#2C467F',
    terra: '#18244A', terra2: '#22325F', topo: '#1E7BFF', topo2: '#6AA9FF',
    bloco: '#FF8A1A', bloco2: '#C8650A', bloco3: '#FFB466', bonus: '#F4F7FC', bonus2: '#AEB9CF', usado: '#4A5470',
    espinho: '#E6ECF7', espinho2: '#8E9AB0', ouro: '#FFD23F', ouro2: '#E0A800',
    inim: '#FF4D6D', inim2: '#A61E3B', laranja: '#FF8A1A', laranja2: '#FFB34D', azul: '#1E7BFF', azul2: '#0D4FB8',
    branco: '#F4F7FC', cinza: '#C5CEDF', navy: '#0A0F1C', texto: '#E6ECF7', apagado: '#6F7EA3',
    painel: 'rgba(6,9,18,.86)', linha: '#1E7BFF', roxo: '#8A5CFF', verde: '#39FF88'
  };

  // ---------------- fases ----------------
  // '#' chão · 'B' bloco de filamento · 'X' bloco bônus · 'o' moeda · '^' espinho · 'K' checkpoint · 'G' portal
  function criaFase(n) {
    var cols = n === 1 ? 152 : 172;
    var m = [];
    for (var r = 0; r < LINS; r++) { m.push([]); for (var c = 0; c < cols; c++) m[r].push('.'); }
    var inimigos = [];
    function chao(a, b) { for (var x = a; x <= b; x++) { m[16][x] = '#'; m[17][x] = '#'; } }
    function linha(a, b, r, t) { for (var x = a; x <= b; x++) m[r][x] = t; }
    function coluna(x, h) { for (var r = 16 - h; r < 16; r++) m[r][x] = '#'; }
    function inimigo(x) { inimigos.push({ x0: x * T, y0: 15 * T + 1 }); }
    function portal(x) { m[14][x] = 'G'; m[15][x] = 'G'; }

    if (n === 1) {
      chao(0, 22); linha(8, 8, 12, 'X'); linha(9, 9, 12, 'B'); linha(10, 10, 12, 'X'); linha(14, 17, 13, 'o'); inimigo(19);
      chao(26, 48); linha(30, 34, 12, 'B'); linha(31, 33, 10, 'o'); inimigo(38); inimigo(42);
      coluna(45, 1); coluna(46, 2); coluna(47, 3); coluna(48, 3);
      chao(52, 80); m[15][54] = 'K'; linha(60, 61, 15, '^'); linha(64, 64, 12, 'X'); linha(65, 65, 12, 'B'); linha(66, 66, 12, 'X');
      linha(65, 65, 8, 'X'); linha(70, 73, 13, 'o'); inimigo(70); inimigo(76);
      linha(82, 82, 13, 'B'); linha(82, 82, 11, 'o');
      chao(85, 115); linha(88, 92, 11, 'B'); linha(89, 91, 9, 'o'); linha(96, 99, 8, 'B'); linha(96, 99, 6, 'o');
      inimigo(98); inimigo(104); linha(110, 111, 15, '^'); linha(108, 113, 12, 'o');
      chao(119, 151); coluna(122, 1); coluna(123, 2); coluna(124, 3); coluna(125, 4); coluna(126, 4);
      linha(123, 126, 10, 'o'); inimigo(132); inimigo(137); linha(140, 140, 12, 'X'); portal(146);
    } else {
      chao(0, 16); linha(6, 9, 12, 'B'); linha(7, 8, 12, 'X'); linha(6, 9, 10, 'o'); inimigo(12);
      linha(19, 21, 14, 'B'); linha(24, 26, 12, 'B'); linha(24, 26, 10, 'o'); linha(29, 31, 14, 'B');
      chao(34, 62); inimigo(38); inimigo(42); inimigo(47); linha(44, 46, 15, '^');
      linha(50, 54, 11, 'B'); linha(52, 52, 11, 'X'); linha(50, 54, 9, 'o'); coluna(58, 2); coluna(59, 3); coluna(60, 4);
      chao(65, 96); m[15][66] = 'K'; linha(70, 71, 15, '^'); linha(75, 76, 15, '^'); linha(80, 81, 15, '^');
      linha(72, 79, 11, 'o'); linha(84, 88, 12, 'X'); linha(84, 88, 12, 'B'); m[12][86] = 'X'; inimigo(90); inimigo(93);
      linha(99, 100, 13, 'B'); linha(103, 104, 11, 'B'); linha(107, 108, 9, 'B'); linha(107, 108, 7, 'o');
      linha(111, 112, 11, 'B'); linha(115, 116, 13, 'B');
      chao(119, 150); inimigo(124); inimigo(128); inimigo(133); inimigo(138); linha(126, 136, 11, 'o');
      coluna(142, 1); coluna(143, 2); coluna(144, 3); coluna(145, 4); coluna(146, 5); coluna(147, 5);
      chao(153, 171); linha(156, 157, 15, '^'); portal(165);
    }
    return { m: m, cols: cols, inimigos: inimigos, inicio: { x: 2 * T, y: 15 * T } };
  }

  // ---------------- estado ----------------
  var CHAVE = 'gab3d.cuboaventura.recorde';
  var recorde = 0;
  try { recorde = parseInt(localStorage.getItem(CHAVE) || '0', 10) || 0; } catch (e) {}

  var estado = 'titulo', relogio = 0, ultimo = 0, tEstado = 0, novoRecorde = false;
  var fase = 1, nivel, cam = 0, vidas = 3, moedas = 0, pontos = 0, checkpoint = null;
  var p = { x: 0, y: 0, vx: 0, vy: 0, noChao: false, dir: 1, coyote: 0, buffer: 0, morto: false };
  var inim = [], part = [], popups = [], pulandoSegurado = false;

  function pad(n, d) { n = String(n); while (n.length < d) n = '0' + n; return n; }

  function carregaFase(n, manterCheckpoint) {
    if (!manterCheckpoint) { nivel = criaFase(n); checkpoint = null; }
    var ini = checkpoint || nivel.inicio;
    p.x = ini.x; p.y = ini.y; p.vx = 0; p.vy = 0; p.dir = 1; p.morto = false; p.noChao = false;
    inim = nivel.inimigos.map(function (e) { return { x: e.x0, y: e.y0, vx: -18, vy: 0, vivo: true, amassado: 0 }; });
    part = []; popups = [];
    cam = Math.max(0, p.x - 64);
  }

  function novoJogo() {
    fase = 1; vidas = 3; moedas = 0; pontos = 0;
    carregaFase(1, false);
    estado = 'jogo'; tEstado = 0;
    SOM.melodia([392, 523, 659, 784], 70);
  }

  // ---------------- entrada ----------------
  IN.on('press', function (b) {
    if (estado === 'titulo' || estado === 'fim' || estado === 'zerou') {
      if ((b === 'a' || b === 'start') && tEstado > 0.8) novoJogo();
      return;
    }
    if (b === 'start' && (estado === 'jogo' || estado === 'pausa')) {
      estado = estado === 'pausa' ? 'jogo' : 'pausa';
      SOM.beep(estado === 'pausa' ? 330 : 523, 0.06);
      return;
    }
    if (estado === 'jogo' && (b === 'a' || b === 'up')) p.buffer = 0.12;
  });
  IN.onPause(function () { if (estado === 'jogo') estado = 'pausa'; });

  // ---------------- mapa ----------------
  function tile(c, r) {
    if (c < 0 || c >= nivel.cols) return '#';      // paredes invisíveis nas pontas
    if (r < 0 || r >= LINS) return '.';
    return nivel.m[r][c];
  }
  function solido(c, r) { var t = tile(c, r); return t === '#' || t === 'B' || t === 'X' || t === 'U'; }

  function bateBloco(c, r) {
    var t = tile(c, r);
    if (t === 'X') {
      nivel.m[r][c] = 'U';
      ganhaMoeda(c * T + 2, r * T - 8);
      popups.push({ x: c * T + 1, y: r * T - 6, vy: -60, vida: 0.5 });
      SOM.beep(988, 0.06, 'square', 0.06, 300);
    } else if (t === 'B') {
      SOM.beep(140, 0.05, 'square', 0.05);
      faisca(c * T + 4, r * T + 8, COR.bloco3, 4);
    }
  }

  function ganhaMoeda(x, y) {
    moedas++; pontos += 10;
    faisca(x + 2, y + 2, COR.ouro, 6);
    if (moedas % 50 === 0) { vidas++; SOM.melodia([784, 988, 1175, 1568], 70); }
  }

  function faisca(x, y, cor, n) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = 20 + Math.random() * 40;
      part.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, vida: 0.4 + Math.random() * 0.3, cor: cor });
    }
  }

  // ---------------- física do cubo ----------------
  function movePersonagem(dt) {
    var corre = IN.down.b;
    var max = corre ? 92 : 58, acel = corre ? 420 : 380;
    if (IN.down.left && !IN.down.right) { p.vx -= acel * dt; p.dir = -1; }
    else if (IN.down.right && !IN.down.left) { p.vx += acel * dt; p.dir = 1; }
    else {
      var atrito = (p.noChao ? 520 : 160) * dt;
      if (Math.abs(p.vx) <= atrito) p.vx = 0; else p.vx -= Math.sign(p.vx) * atrito;
    }
    p.vx = Math.max(-max, Math.min(max, p.vx));

    // pulo com tolerâncias (coyote time e buffer)
    p.coyote = p.noChao ? 0.08 : Math.max(0, p.coyote - dt);
    p.buffer = Math.max(0, p.buffer - dt);
    if (p.buffer > 0 && p.coyote > 0) {
      p.vy = -190 - Math.abs(p.vx) * 0.25; p.buffer = 0; p.coyote = 0; p.noChao = false;
      pulandoSegurado = true;
      SOM.beep(440, 0.08, 'square', 0.05, 280);
    }
    if (pulandoSegurado && !(IN.down.a || IN.down.up)) { if (p.vy < -60) p.vy = -60; pulandoSegurado = false; }
    p.vy = Math.min(230, p.vy + 560 * dt);

    // eixo X
    p.x += p.vx * dt;
    var r0 = Math.floor(p.y / T), r1 = Math.floor((p.y + 7) / T), c, r;
    if (p.vx > 0) {
      c = Math.floor((p.x + 6) / T);
      for (r = r0; r <= r1; r++) if (solido(c, r)) { p.x = c * T - 7; p.vx = 0; break; }
    } else if (p.vx < 0) {
      c = Math.floor((p.x + 1) / T);
      for (r = r0; r <= r1; r++) if (solido(c, r)) { p.x = (c + 1) * T - 1; p.vx = 0; break; }
    }
    // eixo Y
    var estava = p.noChao;
    p.noChao = false;
    p.y += p.vy * dt;
    var c0 = Math.floor((p.x + 1) / T), c1 = Math.floor((p.x + 6) / T);
    if (p.vy > 0) {
      r = Math.floor((p.y + 7) / T);
      for (c = c0; c <= c1; c++) if (solido(c, r)) {
        p.y = r * T - 8; p.vy = 0; p.noChao = true;
        if (!estava) faisca(p.x + 4, p.y + 8, COR.cinza, 3);
        break;
      }
    } else if (p.vy < 0) {
      r = Math.floor(p.y / T);
      for (c = c0; c <= c1; c++) if (solido(c, r)) {
        p.y = (r + 1) * T; p.vy = 0;
        // bate no bloco que está mais embaixo do centro do cubo
        var cc = Math.floor((p.x + 4) / T);
        bateBloco(solido(cc, r) ? cc : c, r);
        break;
      }
    }

    // itens e perigos nas casas que o cubo toca
    for (c = c0; c <= c1; c++) {
      for (r = Math.floor(p.y / T); r <= Math.floor((p.y + 7) / T); r++) {
        var t = tile(c, r);
        if (t === 'o') { nivel.m[r][c] = '.'; ganhaMoeda(c * T, r * T); SOM.beep(988, 0.05, 'square', 0.05, 300); }
        else if (t === '^' && p.y + 7 > r * T + 3) { morre(); return; }
        else if (t === 'K' && (!checkpoint || checkpoint.x !== c * T)) {
          checkpoint = { x: c * T, y: 15 * T };
          SOM.melodia([659, 784], 70);
          faisca(c * T + 4, r * T, COR.laranja, 8);
        }
        else if (t === 'G') { venceFase(); return; }
      }
    }
    if (p.y > H + 16) morre();
  }

  // ---------------- inimigos: nós de filamento ----------------
  function moveInimigos(dt) {
    for (var i = 0; i < inim.length; i++) {
      var e = inim[i];
      if (!e.vivo) { e.amassado -= dt; continue; }
      if (Math.abs(e.x - p.x) > W + 16) continue;     // só anda perto da tela
      e.vy = Math.min(200, e.vy + 500 * dt);
      e.x += e.vx * dt;
      var frente = e.vx > 0 ? Math.floor((e.x + 7) / T) : Math.floor(e.x / T);
      var rr = Math.floor((e.y + 3) / T);
      var semChao = !solido(frente, Math.floor((e.y + 8) / T));
      if (solido(frente, rr) || semChao) { e.vx = -e.vx; e.x += e.vx * dt * 2; }
      e.y += e.vy * dt;
      var rb = Math.floor((e.y + 6) / T);
      if (solido(Math.floor((e.x + 4) / T), rb)) { e.y = rb * T - 7; e.vy = 0; }
      if (e.y > H + 16) e.vivo = false;

      // contato com o cubo
      if (!p.morto && p.x + 6 > e.x && p.x + 1 < e.x + 8 && p.y + 7 > e.y && p.y < e.y + 7) {
        if (p.vy > 0 && p.y + 7 - e.y < 6) {
          e.vivo = false; e.amassado = 0.4;
          p.vy = (IN.down.a || IN.down.up) ? -200 : -130;
          pontos += 100;
          popups.push({ x: e.x, y: e.y - 4, vy: -30, vida: 0.6, txt: '100' });
          SOM.beep(330, 0.06, 'square', 0.07, 400);
          faisca(e.x + 4, e.y + 4, COR.inim, 8);
        } else {
          morre();
          return;
        }
      }
    }
  }

  // ---------------- vida e morte ----------------
  function morre() {
    if (p.morto) return;
    p.morto = true; p.vy = -170; p.vx = 0;
    vidas--;
    estado = 'morreu'; tEstado = 0;
    SOM.beep(523, 0.1, 'square', 0.07);
    setTimeout(function () { SOM.beep(262, 0.45, 'sawtooth', 0.07, -150); }, 110);
  }

  function venceFase() {
    estado = 'venceu'; tEstado = 0;
    pontos += 500 + vidas * 100;
    SOM.melodia([523, 659, 784, 1047, 784, 1047, 1319], 110);
    faisca(p.x + 4, p.y, COR.verde, 20);
  }

  function salvaRecorde() {
    novoRecorde = pontos > recorde;
    if (novoRecorde) { recorde = pontos; try { localStorage.setItem(CHAVE, String(recorde)); } catch (e) {} }
  }

  // ---------------- desenho ----------------
  function desenhaFundo() {
    var grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, COR.ceu1); grad.addColorStop(1, COR.ceu2);
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    // nuvens pixel
    var nOff = cam * 0.15 + relogio * 3;
    g.fillStyle = COR.nuvem;
    for (var i = 0; i < 6; i++) {
      var nx = ((i * 71 - nOff) % 240 + 240) % 240 - 40, ny = 18 + (i * 23) % 30;
      g.fillRect(nx, ny, 20, 4); g.fillRect(nx + 4, ny - 3, 10, 3); g.fillRect(nx + 14, ny - 2, 4, 2);
    }
    // morros em paralaxe
    var mOff = cam * 0.35;
    for (var x = 0; x < W; x++) {
      var wx = x + mOff;
      var h1 = 30 + Math.round(Math.sin(wx / 23) * 9 + Math.sin(wx / 9) * 3);
      g.fillStyle = COR.morro; g.fillRect(x, H - 16 - h1, 1, h1);
      var wx2 = x + cam * 0.55;
      var h2 = 16 + Math.round(Math.sin(wx2 / 15 + 1) * 6);
      g.fillStyle = COR.morro2; g.fillRect(x, H - 16 - h2, 1, h2);
    }
  }

  function desenhaTile(t, x, y, c, r) {
    if (t === '#') {
      g.fillStyle = COR.terra; g.fillRect(x, y, T, T);
      g.fillStyle = COR.terra2; g.fillRect(x + ((c * 3 + r) % 5), y + ((c + r * 2) % 6) + 1, 2, 1);
      if (!solido(c, r - 1)) { g.fillStyle = COR.topo; g.fillRect(x, y, T, 2); g.fillStyle = COR.topo2; g.fillRect(x, y, T, 1); }
    } else if (t === 'B') {
      g.fillStyle = COR.bloco; g.fillRect(x, y, T, T);
      g.fillStyle = COR.bloco2; g.fillRect(x, y + 2, T, 1); g.fillRect(x, y + 5, T, 1); g.fillRect(x + 7, y, 1, T); g.fillRect(x, y + 7, T, 1);
      g.fillStyle = COR.bloco3; g.fillRect(x, y, 7, 1);
    } else if (t === 'X' || t === 'U') {
      var usado = t === 'U';
      g.fillStyle = COR.navy; g.fillRect(x, y, T, T);
      g.fillStyle = usado ? COR.usado : COR.bonus; g.fillRect(x + 1, y + 1, 6, 6);
      if (!usado) {
        g.fillStyle = COR.bonus2; g.fillRect(x + 1, y + 6, 6, 1); g.fillRect(x + 6, y + 1, 1, 6);
        var brilho = Math.floor(relogio * 4) % 4;
        g.fillStyle = brilho === 0 ? COR.ouro : COR.laranja;
        g.fillRect(x + 3, y + 2, 2, 4); g.fillRect(x + 2, y + 3, 4, 2);     // "+" de bônus
      }
    } else if (t === '^') {
      g.fillStyle = COR.espinho2; g.fillRect(x, y + 6, T, 2);
      g.fillStyle = COR.espinho;
      g.fillRect(x + 1, y + 4, 2, 2); g.fillRect(x + 2, y + 2, 1, 2);
      g.fillRect(x + 5, y + 4, 2, 2); g.fillRect(x + 5, y + 2, 1, 2);
    } else if (t === 'o') {
      var fase4 = Math.floor(relogio * 8 + c) % 4, larg = [5, 3, 1, 3][fase4];
      g.fillStyle = COR.ouro2; g.fillRect(x + 4 - Math.ceil(larg / 2), y + 2, larg, 5);
      g.fillStyle = COR.ouro; g.fillRect(x + 4 - Math.ceil(larg / 2), y + 2, Math.max(1, larg - 1), 4);
    } else if (t === 'K') {
      var ativo = checkpoint && checkpoint.x === c * T;
      g.fillStyle = COR.cinza; g.fillRect(x + 1, y - 8, 1, 16);
      g.fillStyle = ativo ? COR.laranja : COR.usado; g.fillRect(x + 2, y - 8, 5, 4);
      if (ativo) { g.fillStyle = COR.laranja2; g.fillRect(x + 2, y - 8, 5, 1); }
    } else if (t === 'G' && tile(c, r - 1) !== 'G') {
      // portal Gab 3D (2 casas de altura)
      g.fillStyle = COR.azul2; g.fillRect(x - 2, y - 2, 12, 18);
      g.fillStyle = COR.azul; g.fillRect(x - 1, y - 1, 10, 16);
      for (var k = 0; k < 14; k++) {
        var cor = ['#39FF88', '#1E7BFF', '#8A5CFF', '#FF8A1A'][(k + Math.floor(relogio * 10)) % 4];
        g.fillStyle = cor; g.fillRect(x + 1, y + k, 6, 1);
      }
      g.fillStyle = COR.laranja; g.fillRect(x + 1, y - 5, 6, 3); g.fillStyle = COR.laranja2; g.fillRect(x + 1, y - 5, 3, 1);
    }
  }

  function desenhaCubo(x, y) {
    x = Math.round(x); y = Math.round(y);
    g.fillStyle = COR.navy; g.fillRect(x - 1, y - 1, 10, 10);
    g.fillStyle = COR.laranja; g.fillRect(x, y, 8, 2);
    g.fillStyle = COR.laranja2; g.fillRect(x, y, 4, 1);
    g.fillStyle = COR.azul; g.fillRect(x, y + 2, 4, 6);
    g.fillStyle = COR.branco; g.fillRect(x + 4, y + 2, 4, 6);
    g.fillStyle = COR.azul2; g.fillRect(x, y + 7, 4, 1);
    g.fillStyle = COR.cinza; g.fillRect(x + 4, y + 7, 4, 1);
    g.fillStyle = COR.navy;
    if (p.dir > 0) { g.fillRect(x + 5, y + 3, 1, 2); g.fillRect(x + 7, y + 3, 1, 2); }
    else { g.fillRect(x + 1, y + 3, 1, 2); g.fillRect(x + 3, y + 3, 1, 2); g.fillStyle = COR.branco; }
  }

  function desenhaInimigo(e) {
    var x = Math.round(e.x - cam), y = Math.round(e.y);
    if (!e.vivo) {
      if (e.amassado > 0) { g.fillStyle = COR.inim; g.fillRect(x, y + 5, 8, 2); }
      return;
    }
    var passo = Math.floor(relogio * 6 + e.x0) % 2;
    g.fillStyle = COR.inim2; g.fillRect(x + 1, y + 1, 6, 5);
    g.fillStyle = COR.inim; g.fillRect(x + 1, y, 6, 5); g.fillRect(x, y + 1, 8, 3);
    g.fillStyle = '#FF8FA6'; g.fillRect(x + 2, y + 1, 1, 1); g.fillRect(x + 4, y + 3, 2, 1);   // fios enrolados
    g.fillStyle = COR.branco; g.fillRect(x + (e.vx < 0 ? 1 : 4), y + 2, 3, 2);
    g.fillStyle = COR.navy; g.fillRect(x + (e.vx < 0 ? 1 : 6), y + 2, 1, 2);
    g.fillStyle = COR.navy; g.fillRect(x + 1 + passo, y + 6, 2, 1); g.fillRect(x + 5 - passo, y + 6, 2, 1);
  }

  function painel(y, h) {
    g.fillStyle = COR.painel; g.fillRect(10, y, W - 20, h);
    g.fillStyle = COR.linha; g.fillRect(10, y, W - 20, 1); g.fillRect(10, y + h - 1, W - 20, 1);
  }

  function desenha() {
    desenhaFundo();
    if (nivel) {
      var c0 = Math.floor(cam / T), c1 = Math.min(nivel.cols - 1, c0 + 21);
      for (var r = 0; r < LINS; r++) for (var c = c0; c <= c1; c++) {
        var t = nivel.m[r][c]; if (t !== '.') desenhaTile(t, c * T - Math.round(cam), r * T, c, r);
      }
      for (var i = 0; i < inim.length; i++) desenhaInimigo(inim[i]);
      if (estado !== 'titulo') {
        var some = estado === 'venceu' && tEstado > 0.4;
        if (!some) desenhaCubo(p.x - cam, p.y);
      }
    }
    for (var q = 0; q < part.length; q++) { var pt = part[q]; g.fillStyle = pt.cor; g.fillRect(Math.round(pt.x - cam), Math.round(pt.y), 1, 1); }
    for (var u = 0; u < popups.length; u++) {
      var pp = popups[u];
      if (pp.txt) F.draw(g, pp.txt, Math.round(pp.x - cam), Math.round(pp.y), { cor: COR.branco });
      else { g.fillStyle = COR.ouro; g.fillRect(Math.round(pp.x - cam) + 1, Math.round(pp.y), 4, 5); }
    }

    // HUD
    g.fillStyle = 'rgba(6,9,18,.75)'; g.fillRect(0, 0, W, 10);
    F.draw(g, pad(pontos, 6), 3, 3, { cor: COR.texto });
    g.fillStyle = COR.ouro; g.fillRect(56, 3, 3, 5);
    F.draw(g, 'X' + pad(moedas, 2), 61, 3, { cor: COR.ouro });
    F.draw(g, 'FASE ' + fase, 104, 3, { cor: COR.laranja, align: 'center' });
    g.fillStyle = COR.laranja; g.fillRect(132, 3, 5, 2); g.fillStyle = COR.azul; g.fillRect(132, 5, 2, 3); g.fillStyle = COR.branco; g.fillRect(134, 5, 3, 3);
    F.draw(g, 'X' + Math.max(0, vidas), 139, 3, { cor: COR.texto });

    var pisca = Math.floor(relogio * 2.5) % 2 === 0;
    if (estado === 'titulo') {
      painel(24, 92);
      F.draw(g, 'CUBE', W / 2, 32, { escala: 3, cor: COR.laranja, sombra: '#6A3300', align: 'center' });
      F.draw(g, 'QUEST', W / 2, 52, { escala: 2, cor: COR.branco, sombra: '#1E3A80', align: 'center' });
      F.draw(g, 'A PULA   B CORRE', W / 2, 72, { cor: COR.apagado, align: 'center' });
      F.draw(g, 'PULE NOS NOS DE FILAMENTO', W / 2, 82, { cor: COR.apagado, align: 'center' });
      if (pisca) F.draw(g, 'APERTE A OU START', W / 2, 96, { cor: COR.texto, align: 'center' });
      F.draw(g, 'RECORDE ' + recorde, W / 2, 106, { cor: COR.ouro, align: 'center' });
    } else if (estado === 'pausa') {
      painel(50, 32);
      F.draw(g, 'PAUSA', W / 2, 56, { escala: 2, cor: COR.texto, align: 'center' });
      F.draw(g, 'START CONTINUA', W / 2, 72, { cor: COR.apagado, align: 'center' });
    } else if (estado === 'venceu' && tEstado > 0.6) {
      painel(44, 36);
      F.draw(g, 'FASE ' + fase + ' COMPLETA!', W / 2, 50, { cor: COR.verde, align: 'center' });
      F.draw(g, 'PONTOS ' + pontos, W / 2, 62, { cor: COR.texto, align: 'center' });
      F.draw(g, 'MOEDAS ' + moedas, W / 2, 70, { cor: COR.ouro, align: 'center' });
    } else if (estado === 'fim' || estado === 'zerou') {
      painel(36, 62);
      F.draw(g, estado === 'zerou' ? 'VOCE ZEROU!' : 'FIM DE JOGO', W / 2, 43, { escala: 2, cor: estado === 'zerou' ? COR.verde : COR.laranja, align: 'center' });
      F.draw(g, 'PONTOS ' + pontos, W / 2, 62, { cor: COR.texto, align: 'center' });
      if (novoRecorde) F.draw(g, 'NOVO RECORDE!', W / 2, 72, { cor: COR.ouro, align: 'center' });
      if (tEstado > 0.8 && pisca) F.draw(g, 'A PARA JOGAR', W / 2, 86, { cor: COR.texto, align: 'center' });
    }
  }

  // ---------------- laço ----------------
  function quadro(t) {
    var dt = Math.min(0.033, (t - (ultimo || t)) / 1000);
    ultimo = t; relogio += dt; tEstado += dt;

    if (estado === 'titulo' && !nivel) carregaFase(1, false);
    if (estado === 'titulo') cam = (Math.sin(relogio * 0.2) * 0.5 + 0.5) * 400;

    if (estado === 'jogo') {
      movePersonagem(dt);
      if (estado === 'jogo') moveInimigos(dt);
      var alvo = Math.max(0, Math.min(nivel.cols * T - W, p.x - 64));
      cam += (alvo - cam) * Math.min(1, dt * 10);
    } else if (estado === 'morreu') {
      p.vy += 500 * dt; p.y += p.vy * dt;
      if (tEstado > 1.4) {
        if (vidas <= 0) { estado = 'fim'; tEstado = 0; salvaRecorde(); }
        else { carregaFase(fase, true); estado = 'jogo'; tEstado = 0; }
      }
    } else if (estado === 'venceu') {
      if (tEstado > 2.6) {
        if (fase >= 2) { estado = 'zerou'; tEstado = 0; salvaRecorde(); }
        else { fase++; carregaFase(fase, false); estado = 'jogo'; tEstado = 0; }
      }
    }

    for (var i = part.length - 1; i >= 0; i--) {
      var pt = part[i];
      pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 90 * dt; pt.vida -= dt;
      if (pt.vida <= 0) part.splice(i, 1);
    }
    for (var u = popups.length - 1; u >= 0; u--) {
      var pp = popups[u]; pp.y += pp.vy * dt; pp.vy += 120 * dt; pp.vida -= dt;
      if (pp.vida <= 0) popups.splice(u, 1);
    }
    desenha();
    requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);
})();
