// =========================================================
// library.js — lê o catálogo de jogos (games/games.json)
// Para adicionar jogos NÃO precisa mexer aqui: só edite o JSON.
// =========================================================

const CATALOGO = 'games/games.json';
let cache = null;

const PADRAO = {
  tipo: 'html5',          // 'html5' (pasta com index.html) ou 'rom' (homebrew via emulador)
  core: 'snes',           // só para tipo 'rom': snes, gb, gbc, gba, nes, segaMD...
  descricao: '',
  capa: 'assets/capas/padrao.svg',
  cor: '#1E7BFF',         // cor do cartucho na biblioteca
  botoes: null,           // 2, 4 ou 6 botões no portátil (padrão: 2 para HTML5, 4 para ROM)
  console: 'GAB 3D',
  ativo: true
};

export async function loadLibrary() {
  if (cache) return cache;
  const resp = await fetch(CATALOGO, { cache: 'no-cache' });
  if (!resp.ok) throw new Error(`Não consegui ler ${CATALOGO} (HTTP ${resp.status})`);
  const dados = await resp.json();
  cache = (dados.jogos || [])
    .filter(j => j && j.id && j.titulo && j.caminho)
    .map(j => ({ ...PADRAO, ...j, id: String(j.id).toLowerCase().trim() }))
    .map(j => ({ ...j, botoes: [2, 4, 6].includes(Number(j.botoes)) ? Number(j.botoes) : (j.tipo === 'rom' ? 4 : 2) }))
    .filter(j => j.ativo !== false);
  return cache;
}

export function findGame(lista, id) {
  const alvo = String(id || '').toLowerCase().trim();
  return lista.find(j => j.id === alvo) || null;
}

/** Endereço base do site (funciona em usuario.github.io/repo/ e em domínio próprio). */
export function siteBase() {
  return location.origin + location.pathname.replace(/index\.html$/, '');
}

/** Link que vai gravado na tag NFC do cartucho. */
export function cartridgeUrl(jogo) {
  return `${siteBase()}#/jogo/${encodeURIComponent(jogo.id)}`;
}

/** Endereço carregado dentro da tela do portátil. */
export function playerSrc(jogo) {
  if (jogo.tipo === 'rom') {
    const q = new URLSearchParams({ rom: jogo.caminho, core: jogo.core || 'snes' });
    return `player-rom.html?${q.toString()}`;
  }
  return jogo.caminho;
}
