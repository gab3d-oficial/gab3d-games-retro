# Gab 3D Games Retrô

Plataforma web de jogos retrô acessada por **mini cartuchos físicos com tag NFC**.
Encoste o cartucho no celular → o jogo abre direto → toque em **JOGAR**.

- 100% estático: roda grátis no **GitHub Pages** (ou Cloudflare Pages, Netlify, hospedagem paga).
- Interface original inspirada nos consoles dos anos 90: console 16-bit na tela inicial e um portátil na tela de jogo.
- Controle na tela que se adapta a cada jogo: 2, 4 ou 6 botões (A B · A B X Y · A B C X Y Z), START, SELECT e multitoque.
- Android e iPhone, em pé ou deitado. No computador também funciona pelo teclado.
- Biblioteca carregada de um **JSON**: para adicionar jogos não precisa mexer no código.
- Suporta **jogos HTML5** e **ROMs homebrew autorizadas** (via EmulatorJS).

---

## 1. Estrutura

```
gab3d-games-retro/
├── index.html              ← site (biblioteca + portátil)
├── 404.html                ← permite links curtos /jogo/<id>
├── player-rom.html         ← tocador de ROM homebrew (EmulatorJS)
├── manifest.webmanifest    ← "Adicionar à tela inicial"
├── .nojekyll               ← avisa o GitHub Pages para não processar nada
├── css/style.css
├── js/
│   ├── app.js              ← liga tudo
│   ├── library.js          ← lê o games.json
│   ├── router.js           ← rotas #/jogo/<id>
│   ├── controls.js         ← controle virtual + teclado
│   └── player.js           ← coloca o jogo na tela e repassa os botões
├── games/
│   ├── games.json          ← ★ CATÁLOGO DE CARTUCHOS (o que você vai editar)
│   ├── _shared/            ← entrada, som e fonte pixel para jogos HTML5
│   ├── _modelo/            ← modelo para criar jogo novo
│   ├── cobrinha/           ← jogo original Gab 3D
│   └── quebra-blocos/      ← jogo original Gab 3D
├── roms/                   ← ROMs homebrew autorizadas (vazia)
└── assets/                 ← ícones e capas (SVG originais)
```

---

## 2. Testar no computador (Mac)

Abrir o `index.html` com duplo clique **não funciona**: o navegador bloqueia a leitura do JSON.
Use um servidor local. No Terminal:

```bash
cd ~/Downloads/gab3d-games-retro
python3 -m http.server 8000
```

Abra **http://localhost:8000** no navegador.
Para testar no celular na mesma rede Wi-Fi, use `http://IP-DO-MAC:8000`. O IP aparece em Ajustes do Sistema → Wi-Fi → Detalhes.

---

## 3. Publicar no GitHub Pages (grátis)

### Pelo navegador, sem instalar nada

1. Crie uma conta em **github.com**.
2. Clique em **New repository**:
   - Nome: `gab3d-games-retro`
   - Marque **Public** (o plano grátis do Pages exige repositório público).
   - Clique em **Create repository**.
3. Na página do repositório, clique em **uploading an existing file**.
4. Arraste **o conteúdo** da pasta (`index.html`, `css`, `js`, `games`…), não a pasta em si.
   O `index.html` precisa ficar na raiz do repositório.
5. Clique em **Commit changes**.
6. Vá em **Settings → Pages**:
   - Source: **Deploy from a branch**
   - Branch: **main**, pasta **/ (root)**
   - Clique em **Save**.
7. Espere 1 a 2 minutos. O site fica em:
   **`https://SEU-USUARIO.github.io/gab3d-games-retro/`**

> O arquivo `.nojekyll` começa com ponto e o Mac o esconde.
> Ele é opcional; se não subir, tudo funciona igual.

### Atualizações depois

Para trocar ou adicionar arquivos, abra a pasta no GitHub, clique em **Add file → Upload files**, arraste e faça o commit.
Em 1 a 2 minutos o site atualiza.
Se preferir, use o app **GitHub Desktop** (grátis) para sincronizar a pasta inteira de uma vez.

---

## 4. Domínio próprio (opcional, recomendado antes de gravar muitas tags)

O link gravado no NFC **não pode mudar**: se a tag estiver travada, não dá para regravar.
Por isso, o ideal é gravar as tags já com o seu domínio, por exemplo `https://gab3d.com.br/#/jogo/cobrinha`.
Assim você pode trocar de hospedagem no futuro sem perder nenhum cartucho vendido.

### Registro.br + GitHub Pages

1. Registre o domínio em **registro.br** (R$ 40/ano para .com.br; precisa de CPF ou CNPJ).
2. No painel do Registro.br, em **DNS → Editar zona**, crie:

   | Tipo  | Nome  | Valor                     |
   |-------|-------|---------------------------|
   | A     | (vazio) | 185.199.108.153         |
   | A     | (vazio) | 185.199.109.153         |
   | A     | (vazio) | 185.199.110.153         |
   | A     | (vazio) | 185.199.111.153         |
   | CNAME | www   | SEU-USUARIO.github.io     |

3. No GitHub, em **Settings → Pages → Custom domain**, digite `gab3d.com.br` e salve.
4. Quando a verificação de DNS terminar (de minutos até 24 h), marque **Enforce HTTPS**.

---

## 5. Gravar as tags NFC

Use o app **NFC Tools** (Android ou iPhone), da wakdev:

1. **Escrever → Adicionar registro → URL/URI**.
2. Cole o link do cartucho. Na biblioteca, o botão **LINK NFC** copia esse link pronto.
   - Formato recomendado: `https://SEU-SITE/#/jogo/cobrinha`
   - Também funcionam: `https://SEU-SITE/?jogo=cobrinha` e `https://SEU-SITE/jogo/cobrinha`.
     Este último é o link curto, que passa pelo `404.html`.
3. **Escrever** e encoste a tag.
4. Teste em um Android **e** em um iPhone.
   - No **iPhone**, a leitura NFC em segundo plano aparece como notificação no topo e é preciso tocar nela.
     Funciona do iPhone XS em diante, com a tela desbloqueada.
   - No **Android**, o NFC precisa estar ligado. Normalmente abre direto no navegador.
5. Só use **Bloquear tag** depois de testar, porque é irreversível.

Tags NTAG213 (144 bytes) bastam: o link ocupa menos de 60 bytes.

---

## 6. Adicionar um jogo novo

### A) Jogo HTML5 (seu ou com licença)

1. Copie `games/_modelo/` para `games/meu-jogo/`.
2. Faça o jogo usando:
   - `GabInput.down.left` (botão segurado) e `GabInput.on('press', b => …)` (botão apertado).
   - `GabAudio.beep(freq, duração)` para som.
   - `GabFont.draw(ctx, 'TEXTO', x, y, {cor, escala, align})` para texto pixel.
   - Tela padrão: `canvas` de 160×144.
3. Crie uma capa 320×240 (SVG ou PNG) em `assets/capas/meu-jogo.svg`.
4. Adicione no `games/games.json`:

```json
{
  "id": "meu-jogo",
  "titulo": "Meu Jogo",
  "descricao": "Uma frase sobre o jogo.",
  "controles": "Direcional move · A pula",
  "capa": "assets/capas/meu-jogo.svg",
  "tipo": "html5",
  "caminho": "games/meu-jogo/index.html",
  "cor": "#8A5CFF",
  "console": "GAB 3D",
  "autor": "Gab 3D",
  "botoes": 4
}
```

`"botoes"` escolhe o controle que aparece no portátil para esse jogo:
- `2`: A e B grandes. Bom para jogos simples.
- `4`: A, B, X e Y em losango. Para plataforma, aventura e ROMs 16-bit.
- `6`: duas fileiras, X Y Z em cima e A B C embaixo, no estilo dos controles de luta.

No jogo, os botões chegam como `'a'`, `'b'`, `'c'`, `'x'`, `'y'`, `'z'`.

5. Suba os arquivos. O cartucho aparece sozinho na biblioteca.

Jogos HTML5 de terceiros com licença também servem.
Se o jogo não usar o `gab-input.js`, inclua `<script src="../_shared/gab-input.js"></script>` e conecte os controles,
ou peça que eu faça a adaptação.

### B) ROM homebrew (SNES, Game Boy etc.)

1. Coloque a ROM em `roms/` (ex.: `roms/aventura.sfc`) e, ao lado, a licença ou o print da autorização.
2. No `games.json`, use `"tipo": "rom"`, `"core": "snes"` (ou `gb`, `gbc`, `gba`, `nes`) e `"caminho": "roms/aventura.sfc"`.
3. Se for copiar o item `exemplo-homebrew`, mude `"ativo"` para `true`.

O emulador (EmulatorJS) é carregado pela CDN oficial `cdn.emulatorjs.org`.
Os botões do portátil Gab 3D são enviados ao emulador.
**Teste a primeira ROM em Android e iPhone**: controle, som e tela cheia variam conforme a versão do emulador.

### ⚠️ Regras de licença (importante, porque os cartuchos são vendidos)

- **Nunca** use ROMs de jogos comerciais, mesmo que "antigos" ou "abandonados".
  Também não use personagens, logos ou músicas de terceiros.
- Homebrew só com licença que permita **redistribuição E uso comercial**.
  Exemplos: MIT, GPL, CC-BY, CC0. Licenças "NC" (não comercial) **não servem**.
  Se a licença não for clara, peça **autorização por escrito** ao autor e guarde o e-mail ou print.
- Dê crédito ao autor no campo `"autor"` do JSON.
- O `id` de um jogo **nunca deve mudar** depois que a tag for gravada.

---

## Fitas com código (só joga quem tem o cartucho)

- Cada fita tem um código único. O link gravado na tag é `https://gab3dgames.com.br/#/c/CODIGO`.
- Ao encostar a fita, o site confere o código, mostra "Cartucho nº 027 conectado" e libera os jogos **naquele celular**.
- Sem fita, a pessoa vê a biblioteca, mas a tela do jogo pede "INSIRA SEU CARTUCHO".
- `cartuchos.json` guarda só a impressão digital (SHA-256) de cada código. Os códigos de verdade ficam na lista privada `lista-cartuchos-gab3d.csv`, que **nunca** deve ir para o GitHub.
- **Bloquear uma fita** (por exemplo, se o link vazou): apague a linha dela em `cartuchos.json`. Ela para de funcionar em todos os celulares.
- **Abrir o site para todos** (evento ou demonstração): mude `"exigirCartucho": true` para `false`.
- **Mais fitas:** peça um novo lote. Os números continuam de onde pararam, e os códigos antigos seguem valendo.
- Limitação: quem compartilha o link da própria fita passa o acesso junto. É uma proteção simples, para afastar o acesso casual.

---

## 7. Custos: grátis × domínio × hospedagem paga

| Opção | Endereço | Custo/ano | Observação |
|---|---|---|---|
| **GitHub Pages** | `usuario.github.io/gab3d-games-retro` | **R$ 0** | 1 GB de site, ~100 GB/mês de tráfego, HTTPS grátis |
| **GitHub Pages + domínio .com.br** | `gab3d.com.br` | **~R$ 40** | Recomendado. Hospedagem continua grátis |
| Cloudflare Pages + domínio | `gab3d.com.br` | ~R$ 40 | Tráfego ilimitado no plano grátis; alternativa se crescer |
| Hospedagem paga + domínio | `gab3d.com.br` | ~R$ 150–300 | Desnecessário para site estático; útil só se quiser e-mail ou painel |

Trocar de hospedagem depois é simples: suba os mesmos arquivos e aponte o DNS.
**Se as tags usarem o seu domínio, nenhum cartucho precisa ser regravado.**

---

## 8. Problemas comuns

- **Biblioteca vazia / "Não foi possível carregar"**: você abriu o arquivo direto. Use o servidor local ou o GitHub Pages.
- **Sem som no iPhone**: confira a chave de silencioso lateral e o volume, e toque em JOGAR.
  O iOS só libera som depois de um toque.
- **Tela cheia no iPhone**: o Safari não permite tela cheia em sites.
  Use Compartilhar → **Adicionar à Tela de Início** e abra pelo ícone.
- **Mudei o games.json e não atualizou**: espere 1 a 2 minutos após o commit e recarregue a página.
- **Cartucho "não encontrado"**: o `id` no link da tag precisa ser igual ao `id` no JSON, em minúsculas.

---

Jogos inclusos: **Cobrinha Neon** e **Quebra-Blocos**, criados para a Gab 3D, com gráficos e sons originais gerados por código.
Interface original Gab 3D, sem uso de marcas, logos ou assets de terceiros.
EmulatorJS © seus autores (GPL-3.0), carregado via CDN apenas para homebrew autorizado.
