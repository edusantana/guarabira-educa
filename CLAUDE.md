# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A Chrome extension (Manifest V3) that helps teachers in the municipality of Guarabira (PB, Brazil) work more efficiently with the Guarabira Educa educational platform at `guarabira-educa.ids.inf.br`. It injects action buttons and keyboard shortcuts into the platform's daily record (registro diário) pages.

## Build and packaging

```bash
# Package the extension into a versioned zip for distribution
rake zip
```

After running `rake zip`, update the `version` field in `manifest.json` to match the date (`YYYY.M.D` — no leading zeros, required by Chrome).

There is no test suite and no linter configured.

## Publishing

- **Chrome Web Store**: upload the `.zip` at https://chrome.google.com/webstore/devconsole
- **Manual CRX signing**: use `chrome://extensions` → Developer mode → "Compactar extensão". Keep the generated `.pem` to sign future versions with the same extension ID.

## Loading for development

Load unpacked in Chrome:
1. Open `chrome://extensions`
2. Enable Developer mode
3. Click "Load unpacked" and select this repository directory

## Architecture

### Target platform

Guarabira Educa is an **Angular 13 SPA** with **hash-based routing** (`#/` routes). The DOM is rendered asynchronously after navigation — standard `DOMContentLoaded` is not sufficient. All injection must be triggered by `MutationObserver` + `hashchange`.

### Entry point

- **`educa.js`** — the only content script. Injected into every `https://guarabira-educa.ids.inf.br/*` page. Uses `window.location.hash` regex to detect the active route, then conditionally injects UI.

### Route detection

`educa.js` uses regex constants against `window.location.hash`:

| Constant | Hash pattern | `paginaAtual()` value |
|---|---|---|
| `HASH_REGISTRO_DIARIO` | `#/diarioescolar/turma/\d+/registrodiario/etapa/\d+/componente/\d+` | `'registro-diario'` |
| `HASH_TURMA` | `#/diarioescolar/turma/\d+` | `'turma'` |

### Injection strategy

```
hashchange event  →  ultimoHash = null  →  tentaInjetar()
MutationObserver  →  tentaInjetar()
tentaInjetar()    →  isPaginaRegistroDiario()  →  injetaBotaoCopiarExcluir()
```

- `ultimoHash` prevents redundant log spam on repeated MutationObserver firings.
- `document.getElementById('educa-copiar-excluir')` guard prevents double-injection.
- Anchor for injection: `app-diario-escolar-turma-registro-diario .p-button-danger` (the Excluir button). The injected wrapper is inserted before it via `insertBefore`.

### Injected UI — `injetaBotaoCopiarExcluir()`

A `div` wrapper with `margin-right:auto` is inserted to the left of the Excluir button. It contains:

| Button | ID | Shortcut | Color | Action |
|---|---|---|---|---|
| **C**opiar | `educa-copiar-excluir` | ALT+C | Blue `#2b58a1` | Saves all Quill editor contents to `chrome.storage.sync` under `registrodiario`; highlights editors green |
| Li**m**par | `educa-limpar-excluir` | ALT+M | Gray `#6c757d` | Removes `registrodiario` from storage; clears editor highlights |
| Col**a**r [v] | `educa-colar-excluir` | ALT+V | Green `#28a745` | Restores editor contents from `registrodiario`; highlights editors yellow |
| Div**i**dir em 3 | `educa-dividir-excluir` | ALT+I | Orange `#fd7e14` | Splits first editor text by `.`, distributes sentences to each editor |
| ? (Ajuda) | `educa-ajuda` | — | Purple `#6f42c1` | Opens Ajuda.md on GitHub in a new tab |

The existing `.salvar-fab` button is assigned **ALT+S**.

Button labels use `innerHTML` with `<u>` tags to underline the shortcut letter visually.

### Quill editor interaction

The platform uses Quill rich text editors wrapped in Angular's `p-editor`. Editors are selected with:
```js
document.querySelectorAll('app-diario-escolar-turma-registro-diario .ql-editor')
```

After setting `editor.innerHTML`, always dispatch:
```js
editor.dispatchEvent(new Event('input', { bubbles: true }));
```
This is required to trigger Angular change detection.

### chrome.storage keys

| Key | Storage | Description |
|---|---|---|
| `registrodiario` | sync | Object with keys `observacoes`, `atividades`, `conteudos`, `horario` — one per Quill editor |

### Help file

`Ajuda.md` — user-facing documentation for teachers. References `screenshot/botoes.png`. Published at:
`https://github.com/edusantana/guarabira-educa/blob/main/Ajuda.md`
