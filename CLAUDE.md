# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A Chrome extension (Manifest V3) that helps teachers in Paraíba (Brazil) work more efficiently with the state educational platform at `saber.pb.gov.br`. It injects a UI panel and keyboard shortcuts into the platform's pages.

## Build and packaging

```bash
# Package the extension into a versioned zip for distribution
rake zip
```

After running `rake zip`, update the `version` field in `manifest.json` to match the date (`YYYY.MM.DD`).

There is no test suite and no linter configured.

## Loading for development

Load unpacked in Chrome:
1. Open `chrome://extensions`
2. Enable Developer mode
3. Click "Load unpacked" and select this repository directory

## Architecture

### Entry points

- **`saber.js`** — content script injected into every `saber.pb.gov.br/platform/*` page. It detects the current page by `window.location.pathname` and conditionally injects DOM elements and event listeners.
- **`options.js` / `options.html`** — the extension's settings page, accessible via the Chrome extensions menu.
- **`dados.js`** — data collection helpers; **not referenced in `manifest.json`**, so it is legacy/unused code.

### Page detection pattern

`saber.js` uses a set of `isPagina*()` functions that check `window.location.pathname` to determine which page is active, then conditionally injects UI:

| Page | pathname pattern |
|---|---|
| Minhas Aulas | ends with `/platform/teachings` |
| Registros de aula (list) | ends with `/class_logs` |
| Novo/editar registro de aula | includes `/class_logs` and `/new` or `/edit` |
| Frequências (list) | ends with `/class_frequencies` |
| Novo/editar frequência | includes `/class_frequencies` and `/new` or `/edit` |
| Avaliações | ends with `/class_ratings` |
| Desempenho escolar (edit) | matches `enrollment_early_years_rating_reports/[0-9]+/edit` |

### The "registros" clipboard mechanism

The core workflow centers on a multi-line text buffer stored in `chrome.storage.sync` under the key `registros`. It acts as a queue:

- Each line is a tab-separated record (date, number of classes, content, methodology, etc.).
- When a new form page opens, `atualizaColagemAPartirDoPrimeiroRegistroDaSerie()` pops the first line, pastes it into the `#colagem` textarea, fires a `change` event to auto-fill form fields, and saves the remaining lines back to storage.
- Lines starting with `#` are treated as comments/navigation hints: a line like `#1238787 Turma X` triggers a redirect to `platform/teachings/1238787` and is then removed from the queue.
- The `#registros` textarea in the injected panel and in `options.html` is the user-facing editor for this buffer.

### chrome.storage keys

| Key | Storage | Description |
|---|---|---|
| `registros` | sync | Multi-line clipboard queue (the main data) |
| `aulas_seguidas` | sync | Default number of consecutive classes |
| `justificativa` | sync | Default absence justification text |
| `presenca` | sync | Default attendance status (P/A/N) |
| `assinatura` | sync | Whether user has a subscription |
| `turmas` | local | Array of `[label, teaching_id]` pairs for the class selector |
| `turmaAtual` | local | Currently selected class ID |
| `guardado` | local | A single saved snapshot of `registros` |

### Injected UI elements

- **Panel (`criaPainel()`)** — injected into list pages and form pages. Contains `#registros` textarea, Save/Clear buttons, and a dropdown with context-sensitive actions.
- **`#colagem` textarea** — injected into new/edit form pages. User pastes tab-separated data; the `change` event handler parses it and fills the form fields.
- **Presence selector (`adicionaSeletorDePresencao()`)** — injected into frequency edit pages to bulk-mark students present/absent.

### External dependencies (vendored)

- `js/luxon.min.js` — date manipulation, loaded by `manifest.json` before `saber.js`
- `js/jquery-3.6.0.min.js` — present but **not** listed in `manifest.json` content scripts; only used in `options.html` via a `<script>` tag
- `dist/` — Semantic UI 2.x CSS/JS, referenced by `options.html`; the platform itself uses Bootstrap 2.3.2

### Messages system

On panel creation, `baixa_mensagens()` fetches `docs/mensagens.json` from the raw GitHub URL and renders contextual announcements into `#mensagens`. The JSON is a flat array of `[category, text, url, icon_class]` tuples; categories map to the `isPagina*()` detection functions.
