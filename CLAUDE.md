# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

Framework-agnostic plugin that renders a treeview/checkbox UI for a `<select multiple>` element. The original `<select>` is hidden but remains the source of truth — the plugin reads options from it and writes selected values/order back to it, so `selectElement.selectedOptions` keeps working. The source is TypeScript; the package is **ESM-only**, has no runtime dependencies, and ships declarations generated from source. There is no UMD/global bundle.

## Commands

Install dependencies first: `npm install`. Node 24 is the development baseline.

| Command | Purpose |
| --- | --- |
| `npm test` | `typecheck` + `lint` + `build:js` + `typecheck:consumer` + `test:ssr` + `vitest run` (the CI gate) |
| `npm run typecheck` | `tsc -p tsconfig.json --noEmit` over `src/` and `test/` |
| `npm run typecheck:file -- <path>` | Type-check one file and its import graph (TS 6 needs `--ignoreConfig` here) |
| `npm run lint` | ESLint 10 flat config; add `--fix` to normalize quotes/indent |
| `npx vitest run <file>` | Run a single test file |
| `npm run build` | `tsc -p tsconfig.build.json` → `dist/` (ESM + `.d.ts`), then Sass → `dist/*.css` |
| `npm run dev` | Vite-served pages in `demo/` |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:ssr` | Import the built entry in DOM-less Node; guards SSR safety |

`npm run build` is what produces the published package; `dist/` is git-ignored and must never be edited by hand.

**Browser requirement:** tests run in real Chrome via Vitest browser mode + Playwright with `launchOptions: { channel: 'chrome' }` (see [vitest.config.ts](vitest.config.ts)). Google Chrome must be installed locally; CI installs it with the CircleCI `browser-tools` orb.

## Architecture

Entry chain: [src/tree-multiselect.ts](src/tree-multiselect.ts) re-exports the `treeMultiselect` function from `./tree-multiselect/main.js` plus the public types. It is side-effect free, so `import 'tree-multiselect-next'` is safe under SSR (Next.js prerendering, Remix, plain Node); the function itself must be called in a browser.

Key modules under [src/tree-multiselect/](src/tree-multiselect/):

- `types.ts` — public surface: `TreeMultiselectOptions`, `TreeMultiselectItem`, `TreeMultiselectHandle`, `ResolvedTreeMultiselectOptions`.
- `main.ts` — merges defaults and creates one `Tree` per `<select>`. Accepts a single select or an iterable (array/NodeList) via the exported `TreeMultiselectTarget` type and returns an array of `{ reload, remove }` handles.
- `tree.ts` — the core: builds the AST from `<option>` children, renders HTML, and wires every event handler. Everything it does to the DOM is plain DOM API; it holds raw `HTMLElement`s.
- `events.ts` — the single place event listeners are bound. Uses native `addEventListener` delegation on the tree root with `Element.closest()`; hover uses `mouseover`/`mouseout` because `mouseenter`/`mouseleave` do not bubble.
- `sortable.ts` — the optional drag-to-reorder integration (`sortable: true`), implemented with native Pointer Events (no jQuery UI). Siblings that make way are animated with a FLIP (Web Animations API) and every animation is skipped under `prefers-reduced-motion`.
- `ast/` — `Item` / `Section` classes backed by DOM nodes. Every item/section gets an integer `data-key` used as the primary identifier everywhere.
- `search.ts` — trigram inverted index over the configured `searchParams`.
- `ui-builder.ts` — the two-pane wrapper: `.selections` (left tree) and `.selected` (right side panel).
- `utility/` — in-place array helpers used heavily by `render()`, plus DOM factories.

### Render model (important)

User interaction never mutates selection state directly. Handlers push keys into `keysToAdd` / `keysToRemove`, then call `render()`, which:

1. Dedupes and reconciles the staged arrays against `selectedKeys`, applying `maxSelections` truncation.
2. Removes/creates DOM nodes in both the tree and the side panel, checks/unchecks inputs.
3. Recomputes section checkbox states via `redrawSectionCheckboxes()` (bitmask `0b11`: bit 1 = all children checked, bit 0 = all unchecked; else indeterminate).
4. Rewrites the original `<select>`'s `<option>` order (sorted by selection order) and `selected` state, then dispatches a native `change` event (so `addEventListener('change')` listeners fire) and `params.onChange` unless `render(true)` was used.

`selectedKeys` is the canonical ordered selection. Any new mutation path must go through the staging arrays + `render()` rather than editing `selectedKeys` directly.

### Search/filter mechanism

Search matches are applied by setting a `searchhit="true"|"false"` attribute on item/section nodes; visibility is implemented purely in CSS ([src/style.scss](src/style.scss) hides `*[searchhit=false]` and collapses filtered sections). `unfilteredNodeIds()` also consults this attribute, so "Select All" only selects currently visible search hits.

### Reload semantics

`Tree.reload()` snapshots selected values, removes the UI, re-reads the `<select>`'s current `<option>` children, rewrites `selected` attributes by value, then reinitializes. Added options therefore appear and prior user selections survive, but selection is keyed by option **value** (duplicate values are indistinguishable during reload).

## Conventions and gotchas

- **ESM + NodeNext:** every relative import in `src/` and `test/` must carry the `.js` suffix (e.g. `import Tree from './tree.js'`), even though the file on disk is `.ts`. Vite maps `.js` back to `.ts`; `tsc` emits correctly only with this convention.
- **Plain DOM everywhere:** `tree.ts`, `ui-builder.ts`, `search.ts`, `ast/`, `utility/`, `events.ts` and `sortable.ts` use native DOM/JS APIs. There is no jQuery dependency, and no module imports one. `test/setup.ts` assigns `assert` onto `globalThis` with `Object.assign`.
- **Tests** run against `src/`, not `dist/`. `vitest.config.ts` collects only `test/**/*.test.ts`. `test/integration/common.ts` registers a `beforeEach` fixture; a test file that uses no helpers must still `import './common.js'` for that side effect.
- **Versioning:** `.githooks/pre-commit` (enabled via `git config core.hooksPath .githooks`) runs `npm version patch --no-git-tag-version` on every commit and stages `package.json` + `package-lock.json` into that same commit. Bypass one bump with `SKIP_VERSION_BUMP=1 git commit ...`.
- **TypeScript is pinned to 6.0.3** because `typescript-eslint@8` supports `<6.1.0`. Do not bump it alone.
- **No runtime dependencies.** `sortable: true` uses Pointer Events, so jQuery UI is not needed either.
- **Lint style:** `standard`-like rules via `@stylistic` — 2-space indent, single quotes, semicolons, LF. `prefer-const`/`no-var` are off. `@typescript-eslint/no-this-alias` allows the legacy `self`/`$originalSelect` names (no aliases are used any more).
- `tsconfig.json` excludes `test/consumer/**` (resolved against built `dist`) and `demo/**` (imports `.scss`).
- **Package contents:** `files: ["dist"]`; `npm pack --dry-run` should list only `dist/**`, `package.json`, `README.md`, `LICENSE`. `test/consumer/` is the type-level acceptance check for the published declarations.
