// =========================================================
// router.js — rotas por URL (compatível com GitHub Pages)
//
//   #/                  -> biblioteca
//   #/jogo/cobrinha     -> abre o jogo "cobrinha"   (link do NFC)
//   ?jogo=cobrinha      -> convertido para #/jogo/cobrinha
//   /jogo/cobrinha      -> tratado pelo 404.html (link curto opcional)
// =========================================================

export function parseRoute() {
  const partes = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (partes[0] === 'jogo' && partes[1]) {
    return { view: 'game', id: decodeURIComponent(partes[1]) };
  }
  return { view: 'home' };
}

/** Aceita ?jogo=slug (ou ?g=slug) e troca para o formato com # sem recarregar. */
export function normalizeEntry() {
  const q = new URLSearchParams(location.search);
  const slug = q.get('jogo') || q.get('g');
  if (slug) {
    history.replaceState(null, '', `${location.pathname}#/jogo/${encodeURIComponent(slug)}`);
  }
}

export function onRoute(callback) {
  window.addEventListener('hashchange', () => callback(parseRoute()));
  callback(parseRoute());
}

export function go(caminho) {
  const alvo = caminho.startsWith('#') ? caminho : `#${caminho}`;
  if (location.hash === alvo) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = alvo;
}
