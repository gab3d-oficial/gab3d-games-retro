/* =========================================================
   COBRINHA NEON — jogo original Gab 3D
   Tela 160x144 · grade de 20x16 casas de 8px
   ========================================================= */
(function () {
  'use strict';
  var W = 160, H = 144, CASA = 8, COLS = 20, LINS = 16, TOPO = 16;
  var tela = document.getElementById('tela');
  var g = tela.getContext('2d');
  var IN = window.GabInput, SOM = window.GabAudio, F = window.GabFont;

  var COR = {
    fundo: '#0A0F1C', xadrez: '#0E1628', hud: '#060912', linha: '#1E7BFF',
    corpo1: '#39FF88', corpo2: '#22D36E', cabeca: '#B9FFD8', olho: '#0A0F1C',
    fruta: '#FF8A1A', brilho: '#FFD3A3', folha: '#39FF88', ouro: '#FFD23F',
    texto: '#E6ECF7', apagado: '#6F7EA3', laranja: '#FF8A1A', painel: 'rgba(6,9,18,.86)'
  };
  var CHAVE = 'gab3d.cobrinha.recorde';
  var recorde = 0;
  try { recorde = parseInt(localStorage.getItem(CHAVE) || '0', 10) || 0; } catch (e) {}

  var estado = 'titulo';       // titulo | jogo | pausa | fim
  var cobra, dir, fila, fruta, pontos = 0, passoMs, acum = 0, ultimo = 0, relogio = 0, tFim = 0;
  var particulas = [], novoRecorde = false, venceu = false;
  var DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  function novoJogo() {
    cobra = [[6, 8], [5, 8], [4, 8]];
    dir = [1, 0]; fila = []; pontos = 0; passoMs = 150; acum = 0;
    particulas = []; venceu = false;
    novaFruta();
  }

  function novaFruta() {
    var livres = [];
    for (var y = 0; y < LINS; y++) for (var x = 0; x < COLS; x++) if (!ocupado(x, y)) livres.push([x, y]);
    if (!livres.length) { venceu = true; fimDeJogo(); return; }
    var p = livres[Math.floor(Math.random() * livres.length)];
    fruta = { x: p[0], y: p[1], ouro: Math.random() < 0.12 };
  }

  function ocupado(x, y) {
    for (var i = 0; i < cobra.length; i++) if (cobra[i][0] === x && cobra[i][1] === y) return true;
    return false;
  }

  // ---------------- entrada ----------------
  IN.on('press', function (b) {
    if (estado === 'titulo' || estado === 'fim') {
      if ((b === 'a' || b === 'b' || b === 'start') && !(estado === 'fim' && tFim < 0.7)) {
        novoJogo(); estado = 'jogo';
        SOM.melodia([523, 659, 784], 70);
      }
      return;
    }
    if (b === 'start') {
      estado = estado === 'pausa' ? 'jogo' : 'pausa';
      SOM.beep(estado === 'pausa' ? 330 : 523, 0.06);
      return;
    }
    if (estado !== 'jogo') return;
    var nd = DIRS[b]; if (!nd) return;
    var ref = fila.length ? fila[fila.length - 1] : dir;
    if ((nd[0] === -ref[0] && nd[1] === -ref[1]) || (nd[0] === ref[0] && nd[1] === ref[1])) return;
    if (fila.length < 3) fila.push(nd);
  });
  IN.onPause(function () { if (estado === 'jogo') estado = 'pausa'; });

  // ---------------- lógica ----------------
  function passo() {
    if (fila.length) dir = fila.shift();
    var cab = [cobra[0][0] + dir[0], cobra[0][1] + dir[1]];
    var come = cab[0] === fruta.x && cab[1] === fruta.y;
    if (cab[0] < 0 || cab[1] < 0 || cab[0] >= COLS || cab[1] >= LINS) return fimDeJogo();
    for (var i = 0; i < cobra.length - (come ? 0 : 1); i++) {
      if (cobra[i][0] === cab[0] && cobra[i][1] === cab[1]) return fimDeJogo();
    }
    cobra.unshift(cab);
    if (come) {
      var ouro = fruta.ouro;
      pontos += ouro ? 5 : 1;
      explosao(fruta.x * CASA + 4, TOPO + fruta.y * CASA + 4, ouro ? COR.ouro : COR.fruta, ouro ? 18 : 10);
      SOM.beep(ouro ? 988 : 740, 0.07, 'square', 0.07, ouro ? 420 : 180);
      passoMs = Math.max(70, passoMs - 3);
      if (ouro) { cobra.push(cobra[cobra.length - 1].slice()); cobra.push(cobra[cobra.length - 1].slice()); }
      novaFruta();
    } else {
      cobra.pop();
    }
  }

  function fimDeJogo() {
    estado = 'fim'; tFim = 0;
    novoRecorde = pontos > recorde;
    if (novoRecorde) { recorde = pontos; try { localStorage.setItem(CHAVE, String(recorde)); } catch (e) {} }
    if (venceu) SOM.melodia([523, 659, 784, 1047, 784, 1047], 110);
    else { SOM.beep(392, 0.12, 'square', 0.08); setTimeout(function () { SOM.beep(262, 0.4, 'sawtooth', 0.07, -140); }, 120); }
    for (var i = 0; i < cobra.length; i += 2) explosao(cobra[i][0] * CASA + 4, TOPO + cobra[i][1] * CASA + 4, COR.corpo1, 3);
  }

  function explosao(x, y, cor, n) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = 20 + Math.random() * 50;
      particulas.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, vida: 0.5 + Math.random() * 0.4, cor: cor });
    }
  }

  // ---------------- desenho ----------------
  function pad(n, d) { n = String(n); while (n.length < d) n = '0' + n; return n; }

  function painel(y, h) {
    g.fillStyle = COR.painel; g.fillRect(10, y, W - 20, h);
    g.fillStyle = COR.linha; g.fillRect(10, y, W - 20, 1); g.fillRect(10, y + h - 1, W - 20, 1);
  }

  function desenhaFruta(f) {
    var x = f.x * CASA, y = TOPO + f.y * CASA;
    var pulsa = Math.sin(relogio * 8) > 0;
    g.fillStyle = f.ouro ? (pulsa ? COR.ouro : '#FFF3B0') : COR.fruta;
    g.fillRect(x + 2, y + 2, 4, 5); g.fillRect(x + 1, y + 3, 6, 3);
    g.fillStyle = f.ouro ? '#FFFFFF' : COR.brilho; g.fillRect(x + 2, y + 3, 1, 1);
    g.fillStyle = COR.folha; g.fillRect(x + 4, y + 1, 2, 1);
  }

  function desenhaCobra() {
    for (var i = cobra.length - 1; i >= 0; i--) {
      var s = cobra[i], prox = cobra[i - 1];
      g.fillStyle = i % 2 ? COR.corpo2 : COR.corpo1;
      if (prox && (prox[0] !== s[0] || prox[1] !== s[1])) {
        var mx = Math.min(s[0], prox[0]), my = Math.min(s[1], prox[1]);
        g.fillRect(mx * CASA + 1, TOPO + my * CASA + 1, Math.abs(s[0] - prox[0]) * CASA + 6, Math.abs(s[1] - prox[1]) * CASA + 6);
      } else {
        g.fillRect(s[0] * CASA + 1, TOPO + s[1] * CASA + 1, 6, 6);
      }
    }
    var c = cobra[0], cx = c[0] * CASA, cy = TOPO + c[1] * CASA;
    g.fillStyle = COR.cabeca; g.fillRect(cx + 1, cy + 1, 6, 6);
    g.fillStyle = COR.olho;
    if (dir[0] !== 0) { var ex = dir[0] > 0 ? cx + 5 : cx + 2; g.fillRect(ex, cy + 2, 1, 1); g.fillRect(ex, cy + 5, 1, 1); }
    else { var ey = dir[1] > 0 ? cy + 5 : cy + 2; g.fillRect(cx + 2, ey, 1, 1); g.fillRect(cx + 5, ey, 1, 1); }
  }

  function desenha() {
    g.fillStyle = COR.fundo; g.fillRect(0, 0, W, H);
    g.fillStyle = COR.xadrez;
    for (var y = 0; y < LINS; y++) for (var x = 0; x < COLS; x++) if ((x + y) % 2 === 0) g.fillRect(x * CASA, TOPO + y * CASA, CASA, CASA);

    g.fillStyle = COR.hud; g.fillRect(0, 0, W, TOPO);
    g.fillStyle = COR.linha; g.fillRect(0, TOPO - 1, W, 1);
    F.draw(g, 'PONTOS ' + pad(pontos, 3), 4, 5, { cor: COR.texto });
    F.draw(g, 'REC ' + pad(recorde, 3), W - 4, 5, { cor: COR.laranja, align: 'right' });

    if (estado !== 'titulo') { desenhaFruta(fruta); desenhaCobra(); }

    for (var i = 0; i < particulas.length; i++) {
      var p = particulas[i]; g.fillStyle = p.cor; g.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    }

    var pisca = Math.floor(relogio * 2.5) % 2 === 0;
    if (estado === 'titulo') {
      // cobrinha decorativa ondulando
      for (var k = 0; k < 14; k++) {
        var sx = 24 + k * 8, sy = 96 + Math.round(Math.sin(relogio * 4 - k * 0.6) * 5);
        g.fillStyle = k === 13 ? COR.cabeca : (k % 2 ? COR.corpo2 : COR.corpo1);
        g.fillRect(sx, sy, 7, 7);
      }
      F.draw(g, 'COBRINHA', W / 2, 34, { escala: 3, cor: COR.corpo1, sombra: '#0B5A33', align: 'center' });
      F.draw(g, 'NEON', W / 2, 56, { escala: 2, cor: COR.laranja, sombra: '#6A3300', align: 'center' });
      if (pisca) F.draw(g, 'APERTE A OU START', W / 2, 120, { cor: COR.texto, align: 'center' });
      F.draw(g, 'SEGURE A PARA ACELERAR', W / 2, 131, { cor: COR.apagado, align: 'center' });
    } else if (estado === 'pausa') {
      painel(56, 32);
      F.draw(g, 'PAUSA', W / 2, 62, { escala: 2, cor: COR.texto, align: 'center' });
      F.draw(g, 'START CONTINUA', W / 2, 78, { cor: COR.apagado, align: 'center' });
    } else if (estado === 'fim') {
      painel(40, 62);
      F.draw(g, venceu ? 'VOCE VENCEU!' : 'FIM DE JOGO', W / 2, 47, { escala: 2, cor: venceu ? COR.ouro : COR.laranja, align: 'center' });
      F.draw(g, 'PONTOS ' + pontos, W / 2, 66, { cor: COR.texto, align: 'center' });
      if (novoRecorde) F.draw(g, 'NOVO RECORDE!', W / 2, 76, { cor: COR.ouro, align: 'center' });
      if (tFim > 0.7 && pisca) F.draw(g, 'A PARA JOGAR', W / 2, 90, { cor: COR.texto, align: 'center' });
    }
  }

  // ---------------- laço ----------------
  function quadro(t) {
    var dt = Math.min(0.05, (t - (ultimo || t)) / 1000);
    ultimo = t; relogio += dt;
    if (estado === 'jogo') {
      acum += dt * 1000 * (IN.down.a ? 1.9 : 1);
      while (acum >= passoMs && estado === 'jogo') { acum -= passoMs; passo(); }
    }
    if (estado === 'fim') tFim += dt;
    for (var i = particulas.length - 1; i >= 0; i--) {
      var p = particulas[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 90 * dt; p.vida -= dt;
      if (p.vida <= 0) particulas.splice(i, 1);
    }
    desenha();
    requestAnimationFrame(quadro);
  }

  novoJogo();
  requestAnimationFrame(quadro);
})();
