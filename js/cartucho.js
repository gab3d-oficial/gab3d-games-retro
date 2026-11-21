// =========================================================
// cartucho.js — só joga quem tem a fita Gab 3D
//
// Cada fita tem um código único no link da tag NFC:
//   https://gab3dgames.com.br/#/c/K7QX9M2PAB
// O site guarda só o "hash" (impressão digital) de cada código em
// cartuchos.json, então ninguém consegue descobrir ou inventar códigos
// olhando o site. Ao encostar a fita, o celular fica liberado.
// Para bloquear uma fita (ex.: link vazou), apague a linha dela
// do cartuchos.json — ela para de funcionar em todos os celulares.
// =========================================================

const ARQUIVO = 'cartuchos.json';
const CHAVE = 'gab3d.cartucho';
let dados = null;

async function carregar() {
  if (dados) return dados;
  const resp = await fetch(ARQUIVO, { cache: 'no-cache' });
  if (!resp.ok) throw new Error('cartuchos.json não encontrado');
  dados = await resp.json();
  return dados;
}

export function normaliza(codigo) {
  return String(codigo || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

async function sha256(texto) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** O site exige cartucho? (pode desligar em cartuchos.json: "exigirCartucho": false) */
export async function exigeCartucho() {
  try { return (await carregar()).exigirCartucho !== false; }
  catch (_) { return false; }   // sem arquivo de cartuchos, o site fica aberto
}

/** Confere um código. Devolve { codigo, numero } ou null. */
export async function validar(codigo) {
  const c = normaliza(codigo);
  if (c.length < 6 || !(window.crypto && crypto.subtle)) return null;
  const d = await carregar();
  const numero = d.cartuchos[await sha256(d.sal + c)];
  return typeof numero ==='number' ? { codigo: c, numero } : null;
}

/** Identificação aleatória deste aparelho (não tem nenhum dado pessoal). */
function aparelhoId() {
  const gera = () => (crypto.randomUUID ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join(''));
  try {
    let id = localStorage.getItem('gab3d.aparelho');
    if (!id) { id = gera(); localStorage.setItem('gab3d.aparelho', id); }
    return id;
  } catch (_) { return gera(); }
}

/**
 * Avisa o servidor que a fita foi usada neste aparelho.
 * Devolve { ok: true } ou { ok: false, motivo: 'limite' | 'bloqueada' | 'invalida' }.
 * Se o servidor estiver fora do ar, o jogo continua liberado (o cliente não é punido).
 */
export async function ativarNoServidor(cart) {
  const d = await carregar();
  if (!d.api) return { ok: true, semServidor: true };
  try {
    const resp = await fetch(d.api.replace(/\/$/, '') + '/ativar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo: cart.codigo, aparelho: aparelhoId() })
    });
    const r = await resp.json();
    if (r && r.ok === false && ['limite', 'bloqueada', 'invalida'].includes(r.motivo)) return r;
    return { ok: true, ...r };
  } catch (_) {
    return { ok: true, foraDoAr: true };
  }
}

export function salvar(cart) {
  try { localStorage.setItem(CHAVE, JSON.stringify({ codigo: cart.codigo, numero: cart.numero, em: Date.now() })); } catch (_) {}
}

export function esquecer() {
  try { localStorage.removeItem(CHAVE); } catch (_) {}
}

/** Cartucho já conectado neste celular (revalida, para fitas bloqueadas pararem de funcionar). */
export async function conectado() {
  let salvo = null;
  try { salvo = JSON.parse(localStorage.getItem(CHAVE) || 'null'); } catch (_) {}
  if (!salvo || !salvo.codigo) return null;
  const ok = await validar(salvo.codigo).catch(() => null);
  if (!ok) { esquecer(); return null; }
  const srv = await ativarNoServidor(ok);
  if (!srv.ok) { esquecer(); return { erro: srv.motivo, numero: ok.numero }; }
  return ok;
}

export function numeroFormatado(n) {
  return String(n).padStart(3, '0');
}
