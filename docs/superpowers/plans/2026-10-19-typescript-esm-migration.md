# tree-multiselect 迁移到 TypeScript + ESM 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 tree-multiselect 从 ES6 + Grunt/Browserify 迁移到 TypeScript + 纯 ESM，产出由源码编译的 `.d.ts`，并让使用者通过 `import 'tree-multiselect'` 注册插件。

**Architecture:** 源码逐模块改写为 TypeScript，用 `tsc` 直接输出「未打包的 ESM + 声明文件」（不引入打包器）；jQuery 由使用者提供（peerDependency），类型靠 `@types/jquery`；测试从 Karma + Browserify 迁到 Vitest 5 browser mode + Playwright/Chromium，仍在真实浏览器中运行。

**Tech Stack:** TypeScript 6.0.3、Node 24、ESM（`module: NodeNext`）、Vitest 5.0.5 + `@vitest/browser-playwright`、Playwright/Chromium、chai 5.3.3、ESLint 10 + typescript-eslint 8.71.2 + `@stylistic/eslint-plugin` 5.10、sass CLI、jquery 4.0.0、jquery-ui 1.14.2。

**Spec:** `docs/superpowers/specs/2026-10-19-typescript-esm-migration-design.md`

## Global Constraints

- 产物**只有 ESM**：不产出 UMD、不产出任何全局脚本构建、不保留 `dist/jquery.tree-multiselect.js` 与 `dist/*.min.js` 这些路径。
- **公开 API 完全不变**：参数名与默认值、`data-section` / `data-description` / `data-index` / `readonly` 语义、`.reload()` / `.remove()` 行为、`onChange` 签名一律照旧；DOM 结构与 CSS 类名（`.tree-multiselect` / `.selections` / `.selected` / `.item` / `.section` / `.title`、`searchhit` 属性、`data-key` 约定）不得改动。
- **不引入打包器**：JS 产物完全由 `tsc -p tsconfig.build.json` 生成；压缩交给使用者的打包器。
- 所有相对导入必须带 `.js` 后缀（NodeNext 要求），源码中不出现隐式全局 `jQuery` / `$`。
- `package.json` 设 `"type": "module"`；jQuery peer 范围为 `">=3.7 <5"`；`@types/jquery` 为 `dependencies`；`@types/jqueryui` 为 devDependency。
- TypeScript 固定 **6.0.3**（不要升到 7.x，`typescript-eslint@8.71.2` 的 peer 范围是 `>=4.8.4 <6.1.0`）。
- 断言库固定 **chai 5.3.3** + `@types/chai` 5.2.3（chai 6 不附带类型声明且改了 API 形态）。
- 测试保留全部现有用例；断言继续用 chai 的 `assert`，`describe` / `it` / `beforeEach` 用 Vitest 全局。
- 产物路径：`dist/tree-multiselect.js`、`dist/tree-multiselect/*.js`、`dist/tree-multiselect.d.ts`、`dist/tree-multiselect.css`、`dist/tree-multiselect.min.css`。`dist/` 为构建产物，进 `.gitignore`，不进版本库。
- 单文件类型检查命令（各任务内引用）：`npm run typecheck:file -- <相对路径>`，它用与 `tsconfig.build.json` 相同的编译选项检查该文件及其导入图。
- 迁移期间每个任务结束时代码与测试应当是绿的；任务内部的中间步骤可能短暂不绿，以步骤里给出的检查命令为准。

## Review Focus

以下是 spec 暗示、但现有测试未覆盖、最可能让使用者踩坑的五类输入/状态。每一条都会在注明任务的测试里钉住：

1. **应用里存在两份 jQuery 实例**：使用者 `import 'tree-multiselect'` 后，插件必须注册在同一个 jQuery 实例上（模块解析去重失败时 `$.fn.treeMultiselect` 会是 `undefined`）——Task 4。
2. **`maxSelections` 与批量选择交互**：通过 section 复选框一次勾选超过上限时，上限必须仍然生效——Task 5。
3. **`onChange` 的参数反映最终状态**：点 section 复选框触发批量变更时，`allSelectedItems` 必须是变更后的完整集合——Task 5。
4. **搜索词含正则元字符**：输入 `a[b` 或 `.*` 必须按字面匹配且不抛异常——Task 5。
5. **`freeze: true` 与 `sortable: true` 同时出现**：冻结时不得挂上排序（源码里的 `!this.params.freeze` 守卫）——Task 5。

---

### Task 1: 搭建 TS/ESM 工具链并跑通冒烟测试

**Files:**
- Modify: `package.json`、`.gitignore`
- Create: `tsconfig.json`、`tsconfig.build.json`、`eslint.config.js`、`vitest.config.ts`、`test/setup.ts`、`test/globals.d.ts`、`test/jquery-ui.d.ts`、`test/smoke.test.ts`
- Move: `sass/style.scss` → `src/style.scss`

**Interfaces:**
- Consumes: 无
- Produces: `npm run typecheck`、`npm run typecheck:file -- <path>`、`npm run lint`、`npm test`、`npm run build:js`、`npm run build:css`、`npm run dev`；`test/setup.ts` 负责把 jQuery 挂到全局并加载 jQuery UI 的 sortable

- [ ] **Step 1: 改写 `package.json`**

保留 `name` / `version` / `description` / `keywords` / `repository` / `author` / `license` / `bugs` / `homepage`。移除 `browser` 字段与全部旧 devDependencies（grunt-\*、karma-\*、browserify\*、babel\*、mocha、node-sass、eslint 8 系列、codecov、grunt-coveralls）。写入：

```jsonc
{
  "type": "module",
  "scripts": {
    "build": "npm run build:js && npm run build:css",
    "build:js": "tsc -p tsconfig.build.json",
    "build:css": "sass src/style.scss dist/tree-multiselect.css && sass --style=compressed src/style.scss dist/tree-multiselect.min.css",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "typecheck:file": "tsc --noEmit --strict --target ES2020 --lib ES2020,DOM --module NodeNext --moduleResolution NodeNext --esModuleInterop --skipLibCheck --types jquery,jqueryui",
    "lint": "eslint .",
    "test": "npm run typecheck && npm run lint && vitest run",
    "test:watch": "vitest",
    "dev": "vite demo",
    "prepublishOnly": "npm run build"
  },
  "dependencies": { "@types/jquery": "^4.0.1" },
  "peerDependencies": { "jquery": ">=3.7 <5", "jquery-ui": ">=1.12 <5" },
  "peerDependenciesMeta": { "jquery-ui": { "optional": true } },
  "files": ["dist"],
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@stylistic/eslint-plugin": "^5.10.0",
    "@types/chai": "^5.2.3",
    "@types/jqueryui": "^1.12.24",
    "@vitest/browser-playwright": "^5.0.5",
    "chai": "^5.3.3",
    "eslint": "^10.13.0",
    "jquery": "^4.0.0",
    "jquery-ui": "^1.14.2",
    "playwright": "^1.64.1",
    "sass": "^1.105.2",
    "typescript": "6.0.3",
    "typescript-eslint": "^8.71.2",
    "vite": "^8.3.4",
    "vitest": "^5.0.5"
  }
}
```

- [ ] **Step 2: 安装依赖并移动样式文件**

```bash
npm install
git mv sass/style.scss src/style.scss
rmdir sass
```

`npm install` 会重写 `package-lock.json`；旧依赖会从 lock 中消失，这是预期的。

- [ ] **Step 3: 写 `tsconfig.json`（检查用）与 `tsconfig.build.json`（构建用）**

`tsconfig.json`：

```jsonc
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "noEmit": true,
    "types": ["jquery", "jqueryui", "vitest/globals"]
  },
  "include": ["src/**/*.ts", "test/**/*.ts"],
  "exclude": ["test/consumer/**", "demo/**"]
}
```

`exclude` 里的两项必须保留：`test/consumer/**` 的 `import 'tree-multiselect'` 只能对着构建产物解析（Task 7 才成立），`demo/**` 会 `import '../src/style.scss'`，两者都不能进主 typecheck 的编译范围。

`tsconfig.build.json`：

```jsonc
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["jquery", "jqueryui"]
  },
  "include": ["src/**/*.ts"]
}
```

构建用配置刻意**不**包含 `vitest/globals`，保证发布的 `dist` 不引用测试环境类型。

- [ ] **Step 4: 写 `eslint.config.js`**

ESLint 10 已移除核心格式规则，格式规则全部来自 `@stylistic`：

```js
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'demo/dist/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { '@stylistic': stylistic },
    rules: {
      '@stylistic/indent': ['error', 2],
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/linebreak-style': ['error', 'unix'],
      'prefer-const': 'off',
      'no-var': 'off'
    }
  }
);
```

`prefer-const` / `no-var` 保持关闭，与迁移前 `.eslintrc.yml` 一致（源码有意使用 `var`/`let`）。

- [ ] **Step 5: 写 `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/setup.ts'],
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: true,
      instances: [{ browser: 'chromium' }]
    }
  }
});
```

`include` 只认 `.ts`，迁移期间尚未改写的 `.js` 测试不会被拾取。

- [ ] **Step 6: 写 `test/setup.ts`、`test/globals.d.ts`、`test/jquery-ui.d.ts`**

`test/setup.ts`：

```ts
import { assert } from 'chai';
import jQuery from 'jquery';

globalThis.$ = jQuery;
globalThis.jQuery = jQuery;
globalThis.assert = assert;

// jquery-ui 的 UMD 包装没有 CommonJS 分支，非 AMD 环境下读取全局 jQuery，
// 因此必须在赋值全局之后动态引入（静态 import 会被提升到赋值之前）。
await import('jquery-ui/ui/widgets/sortable');
```

`test/globals.d.ts`：

```ts
declare global {
  var assert: typeof import('chai').assert;
}

export {};
```

`$` 与 `jQuery` 由 `@types/jquery` 声明，无需重复声明。

`test/jquery-ui.d.ts`（仅为解决该模块路径没有类型，不随包发布）：

```ts
declare module 'jquery-ui/ui/widgets/sortable';
```

- [ ] **Step 7: 写冒烟测试 `test/smoke.test.ts`**

```ts
describe('toolchain', () => {
  it('loads jquery and jquery ui sortable in the browser', () => {
    assert.isFunction($);
    assert.isFunction($('div').sortable);
  });
});
```

- [ ] **Step 8: 运行三道关卡验证工具链**

```bash
npm run typecheck   # 期望：无输出，退出码 0
npm run lint        # 期望：无输出，退出码 0
npx vitest run      # 期望：1 passed
```

- [ ] **Step 9: 把 `dist/` 与 demo 构建产物加入 `.gitignore` 并提交**

`.gitignore` 追加 `dist/`、`demo/dist/`。

```bash
git add package.json package-lock.json .gitignore tsconfig.json tsconfig.build.json eslint.config.js vitest.config.ts test/setup.ts test/globals.d.ts test/jquery-ui.d.ts test/smoke.test.ts src/style.scss
git commit -m "chore: replace grunt/browserify toolchain with typescript, eslint 10 and vitest browser mode"
```

---

### Task 2: 迁移 utility 层

**Files:**
- Create: `src/tree-multiselect/utility/array.ts`、`src/tree-multiselect/utility/dom.ts`、`src/tree-multiselect/utility/index.ts`
- Create: `test/unit/utility.test.ts`
- Delete: `src/tree-multiselect/utility/*.js`

**Interfaces:**
- Consumes: Task 1 的工具链
- Produces:
  - `array.ts`：`flatten`、`uniq`、`removeFalseyExceptZero`、`moveEl`、`subtract`、`intersect`、`intersectMany`
  - `dom.ts`：`createNode(tag: string, props?: NodeProps): HTMLElement`、`createSelection(astItem: ItemOptions & { id: number }, createCheckboxes: boolean, disableCheckboxes: boolean): HTMLElement`、`createSelected(astItem, disableRemoval: boolean, showSectionOnSelected: boolean): HTMLElement`、`createSection(astSection, createCheckboxes: boolean, disableCheckboxes: boolean): HTMLElement`
  - `index.ts`：`assert(bool: unknown, message?: string): void`、`getKey(el: Element): number`、`isInteger(value: unknown): boolean`，以及命名空间导出 `array`、`dom`

- [ ] **Step 1: 写失败的测试 `test/unit/utility.test.ts`**

把 `test/unit/utility.test.js` 中 `describe('Utility')` 下的三组用例（`asserts`、`getKey`、`isInteger`）、`describe('array')` 下的全部用例，以及 `describe('dom')` 下的 `creates nodes with correct tag`、`creates nodes with correct properties` 两组用例搬入。文件头改为：

```ts
import * as Util from '../../src/tree-multiselect/utility/index.js';
```

`test/unit/utility.test.js` 里三组与 AST 有关的用例（`can tell that AST item is not a section`、`creates selection node with all properties`、`creates selection node with value as text`）**不放在本任务**，留给 Task 3，那里会用 `Ast` 重写。

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run test/unit/utility.test.ts
```

期望：FAIL，报找不到模块 `../../src/tree-multiselect/utility/index.js`。

- [ ] **Step 3: 实现 `array.ts`**

逐个函数迁移，`filterInPlace` 留在模块内不导出。类原样保留 `var` 与就地修改语义。`flatten` 需要重载以保住 `flatten(null) === null`、`flatten('foo') === 'foo'` 这两个既有断言：

```ts
export function flatten<T>(arr: T[], r?: T[]): T[];
export function flatten(arr: null): null;
export function flatten(arr: string): string;
export function flatten(arr: unknown, r?: unknown[]): unknown;
```

`intersectMany(arrays: number[][]): number[]`（索引里存的是 `data-key`，天然是数字）；其余为 `uniq<T>(arr: T[]): void` 形式的就地修改。

- [ ] **Step 4: 检查该模块编译**

```bash
npm run typecheck:file -- src/tree-multiselect/utility/array.ts
```

期望：退出码 0。

- [ ] **Step 5: 实现 `dom.ts`**

`NodeProps` 为 `Record<string, string | number | boolean> & { text?: string }`，`createNode` 跳过 `text` 键并用 `textContent` 赋值（与迁移前一致）。三个工厂函数的参数类型先用 Task 3 将产出的 `Item` / `Section` 的结构化子集（`id`、`value`、`text`、`description`、`initialIndex`、`section`、`disabled`、`treeId`），写成 `dom.ts` 内部导出的 `interface SelectionAstNode` / `SelectedAstNode` / `SectionAstNode`，避免与 `ast/` 形成运行时循环依赖。字符串模板 `` `treemultiselect-${astItem.treeId}-${astItem.id}` `` 保持不变。

注意保持既有细节：`disabled` 通过 `setAttribute('disabled', true)` 设置（属性存在即生效）；`data-index` 仅在 `astItem.initialIndex` 为真时写入。

- [ ] **Step 6: 实现 `index.ts`**

`assert` 抛出 `new Error(message || 'Assertion failed')`；`getKey` 用 `parseInt(el.getAttribute('data-key') as string)` 并先断言元素存在；`array` / `dom` 用 `export * as array from './array.js';` 形式导出。删除三个旧 `.js` 文件。

- [ ] **Step 7: 运行测试确认通过**

```bash
npx vitest run test/unit/utility.test.ts
```

期望：PASS，且用例数与迁移前 `test/unit/utility.js` 中对应分组的数量一致。

- [ ] **Step 8: 提交**

```bash
git add src/tree-multiselect/utility test/unit/utility.test.ts
git rm src/tree-multiselect/utility/array.js src/tree-multiselect/utility/dom.js src/tree-multiselect/utility/index.js
git commit -m "refactor: port utility layer to typescript"
```

---

### Task 3: 迁移 AST 层

**Files:**
- Create: `src/tree-multiselect/ast/common.ts`、`src/tree-multiselect/ast/item.ts`、`src/tree-multiselect/ast/section.ts`、`src/tree-multiselect/ast/index.ts`
- Create: `test/unit/ast.test.ts`
- Delete: `src/tree-multiselect/ast/*.js`

**Interfaces:**
- Consumes: `Util.dom.createSelection` / `createSection`（Task 2）
- Produces:
  - `ItemOptions`：`{ treeId?: number; id?: number; value?: string; text?: string | null; description?: string | null; initialIndex?: string | null; section?: string | null; disabled?: boolean; selected?: boolean }`
  - `SectionOptions`：`{ treeId?: number; id?: number; name?: string }`
  - `Item` 类：`treeId`、`id`、`value`、`text`、`description`、`initialIndex: number | null`、`section`、`disabled`、`selected`、`node: HTMLElement | null`；方法 `isSection(): false`、`isItem(): true`、`addSearchHitMarker(isSearchHit: boolean): void`、`removeSearchHitMarker(isSearchHit?: boolean): void`、`isNotSearchHit(): boolean`、`render(createCheckboxes: boolean, disableCheckboxes: boolean): HTMLElement`
  - `Section` 类：同样字段（`items: (Item | Section)[]`、`name`），`isSection(): true`、`isItem(): false`
  - `createLookup(arr: (Item | Section)[]): Lookup`、`createItem(obj: ItemOptions): Item`、`createSection(obj: SectionOptions): Section`，其中 `interface Lookup { arr: (Item | Section)[]; children: Record<string, Lookup> }`
  - `common.ts`：`addSearchHitMarker(node: HTMLElement | null, isSearchHit: boolean): void`、`removeSearchHitMarker(node: HTMLElement | null): void`、`isNotSearchHit(node: HTMLElement | null): boolean`

- [ ] **Step 1: 写失败的测试 `test/unit/ast.test.ts`**

把 `test/unit/utility.test.js` 中三组 AST 用例搬来（`can tell that AST item is not a section`、`creates selection node with all properties`、`creates selection node with value as text`），文件头：

```ts
import * as Ast from '../../src/tree-multiselect/ast/index.js';
import * as Util from '../../src/tree-multiselect/utility/index.js';
```

两处故意传非法参数的调用保留原意、就地窄化：
- `Ast.createSection('name')` → `Ast.createSection('name' as unknown as Ast.SectionOptions)`
- `Util.dom.createSelection(option, 0, true, true)` → `(Util.dom.createSelection as (...args: unknown[]) => HTMLElement)(option, 0, true, true)`

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run test/unit/ast.test.ts
```

期望：FAIL，找不到 `../../src/tree-multiselect/ast/index.js`。

- [ ] **Step 3: 实现 `common.ts`**

常量 `SEARCH_HIT_ATTR = 'searchhit'`、`'true'` / `'false'` 字面量保留；三个函数对 `node` 为 `null` 时静默跳过（与迁移前 `if (node)` 一致）。`Item` / `Section` 的这三个方法委托到这里。

- [ ] **Step 4: 实现 `item.ts` 与 `section.ts`**

`Item` 构造里 `initialIndex` 仍用 `obj.initialIndex ? parseInt(obj.initialIndex) : null`。`render` 保持「已有 `node` 就复用」的惰性缓存语义。`Section.prototype.render` 同理。

- [ ] **Step 5: 实现 `index.ts`**

导出 `createLookup` / `createSection` / `createItem` 与类型 `Lookup` / `ItemOptions` / `SectionOptions`，删除旧 `.js`。

- [ ] **Step 6: 运行测试确认通过**

```bash
npx vitest run test/unit/ast.test.ts test/unit/utility.test.ts
```

期望：PASS（两个文件都过）。

- [ ] **Step 7: 提交**

```bash
git add src/tree-multiselect/ast test/unit/ast.test.ts
git rm src/tree-multiselect/ast/common.js src/tree-multiselect/ast/item.js src/tree-multiselect/ast/section.js src/tree-multiselect/ast/index.js
git commit -m "refactor: port ast layer to typescript"
```

---

### Task 4: 迁移核心插件（search / ui-builder / tree / main / 入口）

**Files:**
- Create: `src/tree-multiselect/types.ts`、`src/tree-multiselect/search.ts`、`src/tree-multiselect/ui-builder.ts`、`src/tree-multiselect/tree.ts`、`src/tree-multiselect/main.ts`、`src/tree-multiselect.ts`
- Create: `test/integration/common.ts`、`test/integration/initial-load.test.ts`
- Delete: `src/tree-multiselect/search.js`、`src/tree-multiselect/ui-builder.js`、`src/tree-multiselect/tree.js`、`src/tree-multiselect/main.js`、`src/tree-multiselect.js`、`test/integration/common.js`、`test/integration/initial-load.test.js`

**Interfaces:**
- Consumes: `Ast`（Task 3）、`Util`（Task 2）
- Produces:
  - `types.ts`：`TreeMultiselectOptions`（16 个可选参数，与 README 表格一一对应）、`TreeMultiselectSearchParam = 'value' | 'text' | 'description' | 'section'`、`TreeMultiselectItem = { text: string; value: string; initialIndex: number | null; section: string | null }`、`TreeMultiselectHandle = { reload(): void; remove(): void }`、`ResolvedTreeMultiselectOptions`（全部字段必填）
  - `search.ts`：`class Search { constructor(searchHitAttr: string, astItems: Record<string, Item>, astSections: Record<string, Section>, searchParams: TreeMultiselectSearchParam[]) }`，公有方法仅 `search(value: string): void`；`MAX_SAMPLE_SIZE = 3` 与 `splitWord` 保持在模块内
  - `ui-builder.ts`：`class UiBuilder { readonly $el; $treeContainer; $selectionContainer; $selectedContainer; constructor($el: JQuery, hideSidePanel: boolean); attach(): void; remove(): void }`
  - `tree.ts`：`class Tree { constructor(id: number, $originalSelect: JQuery, params: ResolvedTreeMultiselectOptions); initialize(): void; remove(): void; reload(): void }`
  - `main.ts`：`function treeMultiselect(this: JQuery, opts?: TreeMultiselectOptions): JQuery<TreeMultiselectHandle>`
  - 入口 `src/tree-multiselect.ts`：把 `treeMultiselect` 挂到 `jQuery.fn`，`declare global { interface JQuery { treeMultiselect(options?: TreeMultiselectOptions): JQuery<TreeMultiselectHandle> } }`，并 `export type` 三个公开类型

- [ ] **Step 1: 写失败的集成测试**

把 `test/integration/common.js` 改写为 `test/integration/common.ts`：删掉 `chai.config.includeStack = true;`（chai 5 不需要），其余逐字保留，`module.exports = { ... }` 改为 `export default { ... }`，内部使用全局 `$` / `assert`。

把 `test/integration/initial-load.test.js` 改写为 `test/integration/initial-load.test.ts`：`var Common = require('./common')` → `import Common from './common.js'`，其余用例逐条保留，断言不加不改。

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run test/integration/initial-load.test.ts
```

期望：FAIL（`setup.ts` 引用的 `../src/tree-multiselect.js` 尚不存在 → 启动即失败）。

- [ ] **Step 3: 实现 `types.ts`**

`TreeMultiselectOptions` 的 16 个字段与默认值照 README 与 `main.js` 的 `defaults` 对象：`allowBatchSelection`、`collapsible`、`enableSelectAll`、`selectAllText`、`unselectAllText`、`freeze`、`hideSidePanel`、`maxSelections`、`onChange`、`onlyBatchSelection`、`searchable`、`searchParams`、`sectionDelimiter`、`showSectionOnSelected`、`sortable`、`startCollapsed`。`maxSelections: number`（不放宽成 `boolean` 之类，即便运行时宽容）。`onChange` 类型为 `((allSelectedItems: TreeMultiselectItem[], addedItems: TreeMultiselectItem[], removedItems: TreeMultiselectItem[]) => void) | null`。

- [ ] **Step 4: 实现 `search.ts`**

`index` 字段类型 `Record<string, number[]>`；`astItems` / `astSections` 用 `Record<string, Item>` / `Record<string, Section>`（数字键可正常索引，且 `Object.keys` 得到 `string[]` 后可直接用）。三元组索引构建、`splitWord`、`handleNodeVisibilities` 里的父级 section 回溯逻辑逐行照搬。

- [ ] **Step 5: 实现 `ui-builder.ts`**

四段 `jQuery('<div class="...">')` 结构照搬，`hideSidePanel` 时给 `.selections` 加 `no-border` 且不创建 `.selected` 节点。

- [ ] **Step 6: 实现 `tree.ts`**

把 `tree.js` 整体迁移，字段类型：`astItems: Record<string, Item>`、`astSections: Record<string, Section>`、`selectedNodes: Record<string, HTMLElement | null>`、`selectedKeys: number[]`、`keysToAdd: number[]`、`keysToRemove: number[]`、`$originalSelect: JQuery`、`$treeContainer` / `$selectionContainer` / `$selectedContainer: JQuery`。

保持以下语义不动：`createAst` 里 `data-key` 与 `initialIndex` 排序、`keysToAdd` 的 `flatten` + `removeFalseyExceptZero` + `uniq`、`render()` 的「先删后加 → 重画 section 复选框 → 重写原始 `<select>` 的 option 顺序与 selected → `change()` → `onChange`」顺序、`render(true)` 抑制回调、`redrawSectionCheckboxes` 的 `0b11` 位掩码、`unfilteredNodeIds()` 对 `searchhit` 属性的依赖。

`this.$selectedContainer.sortable({ start, stop })` 依赖 `@types/jqueryui` 提供的全局 `JQuery.sortable` 重载，不要引实体依赖。

- [ ] **Step 7: 实现 `main.ts` 与入口 `src/tree-multiselect.ts`**

`main.ts` 的 `mergeDefaultOptions` 用 `jQuery.extend({}, defaults, options)`，返回前窄化为 `ResolvedTreeMultiselectOptions`；`this.map(...)` 返回 `JQuery<any>`，显式窄化为 `JQuery<TreeMultiselectHandle>`。

入口：

```ts
import jQuery from 'jquery';
import treeMultiselect from './tree-multiselect/main.js';
import type { TreeMultiselectOptions, TreeMultiselectHandle } from './tree-multiselect/types.js';

jQuery.fn.treeMultiselect = treeMultiselect;

declare global {
  interface JQuery {
    treeMultiselect(options?: TreeMultiselectOptions): JQuery<TreeMultiselectHandle>;
  }
}

export type { TreeMultiselectOptions, TreeMultiselectItem, TreeMultiselectHandle } from './tree-multiselect/types.js';
```

`test/setup.ts` 末尾追加 `import '../src/tree-multiselect.js';` 完成注册。删除全部旧 `.js` 源文件。

- [ ] **Step 8: 运行测试确认通过**

```bash
npx vitest run test/integration/initial-load.test.ts
```

期望：PASS，16 个用例全过。失败时对照 `git show HEAD:test/integration/initial-load.test.js` 检查是否是迁移引入的行为偏差。

- [ ] **Step 9: 加入 jQuery 实例一致性测试（Review Focus 1）**

在 `test/integration/initial-load.test.ts` 追加：

```ts
it('registers the plugin on the same jquery instance the app imports', () => {
  assert.strictEqual(typeof $.fn.treeMultiselect, 'function');
  assert.strictEqual($('select').treeMultiselect, $.fn.treeMultiselect);
});
```

（`$` 与插件模块解析到同一份 jquery 时两者才相等；若不等，说明打包/解析出现两份实例。）

- [ ] **Step 10: 跑全量检查并提交**

```bash
npm test
git add -A src test
git commit -m "refactor: port core plugin to typescript with esm entry"
```

---

### Task 5: 迁移其余集成测试并补齐行为测试

**Files:**
- Create: `test/integration/interactivity.test.ts`、`options.test.ts`、`reloading.test.ts`、`removing.test.ts`、`search.test.ts`、`section-checkboxes.test.ts`、`section-selections.test.ts`、`single-selections.test.ts`
- Delete: 对应的 8 个 `.js` 测试文件

**Interfaces:**
- Consumes: Task 4 的插件入口与 `test/integration/common.ts` 的辅助方法（`selection`、`selected`、`section`、`selectionCheckbox`、`sectionCheckbox`、`find`、`findCheckbox`、`textOf`、`assertSelection`、`assertSelected`、`createFixtureSelect`）
- Produces: 无新接口

- [ ] **Step 1: 机械迁移 8 个测试文件**

每个文件只做三处改动：文件名改 `.ts`；`var Common = require('./common')` → `import Common from './common.js'`；其余用例、断言、`done` 回调逐字保留（Vitest 支持 `it(name, done => ...)`）。

- [ ] **Step 2: 窄化三处故意传非法值的调用**

- `test/integration/options.test.js` 的 `maximum number of selections doesn't work with non-numerical truthy values`：`{ maxSelections: true }` → `{ maxSelections: true as unknown as number }`
- 三个 `sortable` 用例里对 `sortable('option', 'start')` 的链式调用，若 `@types/jqueryui` 没有对应重载，改为 `($('div.selected') as unknown as { sortable(cmd: string, name: string): (...args: unknown[]) => void }).sortable('option', 'start')`，并在文件顶部加一行注释说明这是类型窄化而非行为改动。

- [ ] **Step 3: 运行确认全部通过**

```bash
npx vitest run
```

期望：PASS，用例总数 = 原 Karma 套件用例数（9 个集成文件 + 1 个单元文件）。失败用例逐条对照 `git show HEAD:<同名 .js 文件>` 定位是迁移偏差还是既存行为。

- [ ] **Step 4: 补 `maxSelections` 与批量选择的测试（Review Focus 2）**

在 `test/integration/options.test.ts` 追加：`maxSelections: 1`、一个含 3 个 item 的 section，点击该 section 的复选框后，`.selected .item` 数量必须为 1，且 `.selections` 中被勾选的复选框数量为 1。

- [ ] **Step 5: 补 `onChange` 批量变更参数的测试（Review Focus 3）**

同一文件追加：section 复选框点击后，`onChange` 收到的 `allSelectedItems` 长度等于最终选中数、`addedItems` 长度等于本次新增数、`removedItems` 为空。

- [ ] **Step 6: 补搜索正则元字符的测试（Review Focus 4）**

在 `test/integration/search.test.ts` 追加：对一个含 `a[b` 字面量的选项，分别输入 `a[b` 与 `.*`，前者必须命中该项、后者必须不命中任何项，且两者都不得抛异常。

- [ ] **Step 7: 补 `freeze` 与 `sortable` 并存的测试（Review Focus 5）**

在 `test/integration/options.test.ts` 追加：`{ freeze: true, sortable: true }` 时 `$('div.selected').hasClass('ui-sortable')` 必须为 `false`。

- [ ] **Step 8: 提交**

```bash
npm test
git add -A test
git commit -m "test: port integration suite to typescript and vitest"
```

---

### Task 6: 把手工页面迁到 Vite 驱动的 demo

**Files:**
- Create: `demo/index.html`、`demo/main.ts`、`demo/performance.html`、`demo/performance.ts`
- Delete: `test/test.html`、`test/test-performance.html`

**Interfaces:**
- Consumes: Task 4 的入口
- Produces: `npm run dev` 可打开 demo

- [ ] **Step 1: 迁移 `test/test.html` 为 `demo/index.html` + `demo/main.ts`**

HTML 里删掉 `<script src>` 与指向 `dist` 的 `<link>`，改为 `<script type="module" src="./main.ts"></script>`；样式改为 `import '../src/style.scss'` 放进 `main.ts`（Vite 直接处理 Sass）。被迁走的 `<select>` 节点与原先的 `treeMultiselect({...})` 调用参数逐字保留。

- [ ] **Step 2: 迁移 `test/test-performance.html` 为 `demo/performance.html` + `demo/performance.ts`**

同样处理，保留其生成大量 option 并计时的逻辑。

- [ ] **Step 3: 验证 demo 能构建**

```bash
npx vite build demo
```

期望：退出码 0，`demo/dist/` 产出（已在 `.gitignore` 中）。

- [ ] **Step 4: 提交**

```bash
git add demo test
git rm test/test.html test/test-performance.html
git commit -m "docs: move manual test pages to a vite-served demo"
```

---

### Task 7: 构建产物、打包元数据与消费者类型验收

**Files:**
- Modify: `package.json`
- Create: `test/consumer/tsconfig.json`、`test/consumer/consumer.ts`（两者都不随包发布，`files: ["dist"]` 已保证）

**Interfaces:**
- Consumes: Task 4 的入口
- Produces: `npm run build` 产出 `dist/tree-multiselect.js` + `dist/tree-multiselect/*.js` + `dist/tree-multiselect.d.ts` + `dist/*.css`；`exports` 映射

- [ ] **Step 1: 给 `package.json` 加 `exports`**

```jsonc
"exports": {
  ".": { "types": "./dist/tree-multiselect.d.ts", "import": "./dist/tree-multiselect.js" },
  "./style.css": "./dist/tree-multiselect.css",
  "./package.json": "./package.json"
}
```

同时把 `"main"` 与 `"types"` 也指向 `dist/tree-multiselect.js` / `dist/tree-multiselect.d.ts`，兼容尚未支持 `exports` 的工具链。

- [ ] **Step 2: 跑构建**

```bash
npm run build
```

期望：`dist/tree-multiselect.js`、`dist/tree-multiselect.d.ts`、`dist/tree-multiselect/main.js`、`dist/tree-multiselect/utility/array.js`、`dist/tree-multiselect.css`、`dist/tree-multiselect.min.css` 均存在。

- [ ] **Step 3: 检查产物的 ESM 正确性**

```bash
grep -n "from './tree-multiselect/main.js'" dist/tree-multiselect.js
grep -c "^export" dist/tree-multiselect.d.ts
```

期望：第一条匹配到带 `.js` 后缀的相对导入；第二条大于 0（公开类型被导出）。同时确认 `dist/` 里没有任何 `require(` 出现：

```bash
grep -rn "require(" dist/ | grep -v "\.map:" | head
```

期望：无输出。

- [ ] **Step 4: 写消费者验收用例**

`test/consumer/consumer.ts`：

```ts
import jQuery from 'jquery';
import 'tree-multiselect';

const trees = jQuery('select').treeMultiselect({
  searchable: true,
  maxSelections: 3,
  onChange: (all, added, removed) => {
    const first: string = all[0].text;
    const section: string | null = removed[0].section;
    void first;
    void section;
    void added;
  }
});

const handle = trees[0];
handle.reload();
handle.remove();
```

`test/consumer/tsconfig.json`：

```jsonc
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "paths": { "tree-multiselect": ["../../dist/tree-multiselect.d.ts"] }
  },
  "include": ["consumer.ts"]
}
```

- [ ] **Step 5: 跑消费者类型验收**

```bash
npx tsc -p test/consumer/tsconfig.json
```

期望：退出码 0。这一步同时验证 `declare global` 的类型增强生效（`treeMultiselect` 方法可被识别）、`.reload()` / `.remove()` 存在、`onChange` 三个参数可解构。若报找不到 `jquery` 的类型，说明 `@types/jquery` 没有被当作可解析的依赖，检查它是否在 `dependencies` 中。

- [ ] **Step 6: 检查发布内容**

```bash
npm pack --dry-run
```

期望：文件清单只含 `dist/**`、`package.json`、`README.md`、`LICENSE`；不含 `src/`、`test/`、`demo/`。

- [ ] **Step 7: 提交**

```bash
git add package.json test/consumer
git commit -m "build: emit esm and declarations, add consumer type acceptance test"
```

---

### Task 8: 移除旧工具链、更新 CI 与文档

**Files:**
- Delete: `Gruntfile.js`、`.babelrc`、`.eslintrc.yml`、`bower.json`、`.npmignore`、`conf/karma.js`、`conf/`、`test/vendor/`
- Modify: `.circleci/config.yml`、`README.md`、`release.sh`、`package.json`（版本号 3.0.0）、`CLAUDE.md`

**Interfaces:**
- Consumes: 前 7 个任务的全部产出
- Produces: 干净的仓库与发布流程

- [ ] **Step 1: 删除旧工具链文件**

```bash
git rm Gruntfile.js .babelrc .eslintrc.yml bower.json .npmignore conf/karma.js
git rm -r test/vendor
rmdir conf
```

- [ ] **Step 2: 更新 `release.sh`**

把 `grunt release` 换成 `npm run build`，把 `git add .` 换成 `git add package.json package-lock.json`（`dist/` 是构建产物，不提交），保留版本号读取、commit、tag、push、`npm publish` 的流程。

- [ ] **Step 3: 更新 `.circleci/config.yml`**

镜像换 `cimg/node:24.0-browsers`，步骤改为：安装 Chrome（保留 `browser-tools/install-chrome`）→ `checkout` → 缓存 `package.json` 对应依赖 → `npm ci` → `npx playwright install --with-deps chromium` → `npm test`。

- [ ] **Step 4: 更新 README**

改写以下部分，其余章节（`<option>` 属性表、参数表、`.reload()` / `.remove()` 说明、FAQ）逐字保留：
- 删除 Codecov 与 david-dm 徽章，保留 CircleCI 徽章
- 安装章节：改为 npm 安装 + `import 'tree-multiselect';`，并给出 `import 'tree-multiselect/style.css';`；删除 bower 与「把 jquery.tree-multiselect.min.js 挂到页面上」的说法
- 兼容性：`Requires jQuery v1.8+` → `Requires jQuery 3.7+`（jQuery UI 仅在 `sortable: true` 时需要，且需自行加载）
- 新增 TypeScript 小节：说明类型随包提供、公开类型名（`TreeMultiselectOptions` / `TreeMultiselectItem` / `TreeMultiselectHandle`）、以及「必须 `import 'tree-multiselect'` 才能获得 `$.fn.treeMultiselect` 的类型」
- How to build：`grunt` 系列命令换成 `npm test` / `npm run build` / `npm run dev` / `npm run lint`
- 版本号：`package.json` 升到 `3.0.0`（breaking change），并同步 README 中出现的版本字样

- [ ] **Step 5: 更新 CLAUDE.md**

把构建/测试命令表、架构说明里过时的部分改写为迁移后的现实（tsc 构建、vitest browser mode、ESM-only 分发、`dist/` 不再是版本库内容、jQuery 3.7+ 与 peerDependency 关系）。

- [ ] **Step 6: 全量验证**

```bash
npm run typecheck
npm run lint
npx vitest run
npm run build
npx tsc -p test/consumer/tsconfig.json
npm pack --dry-run
```

期望：全部退出码 0；测试用例数不少于迁移前的 Karma 套件；`npm pack --dry-run` 只列出 `dist/**` 与三个元数据文件。

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "chore!: drop grunt/browserify/bower, ship esm-only 3.0.0"
```

---

## Self-Review

**Spec coverage**

| Spec 要求 | 落在哪个任务 |
| --- | --- |
| 源码改写为 TS、`tsc` 产出 ESM + `.d.ts` | Task 2–4、Task 7 |
| `import 'tree-multiselect'` 注册 + 类型增强 | Task 4 Step 7、Task 7 Step 5 |
| `@types/jquery` 进 `dependencies` | Task 1 Step 1 |
| `@types/jqueryui` 仅作 devDependency、不手写发布用声明 | Task 1 Step 1、Task 4 Step 6 |
| jQuery 显式 import、不打包 jQuery | Task 4 Step 7、Task 7 Step 3 |
| `npm test` 聚合 typecheck + lint + test | Task 1 Step 1 |
| Vitest browser mode + Playwright，真实 Chromium | Task 1 Step 5、Step 8 |
| jQuery UI 用顶层 await 动态加载 | Task 1 Step 6 |
| 现有 9 集成 + 1 单元测试逐条保留 | Task 2、3、4、5 |
| `dist/` 不进版本库、`files` 白名单 | Task 1 Step 9、Task 7 Step 6 |
| CSS 去掉 `jquery.` 前缀、`./style.css` 导出 | Task 1 Step 1、Task 7 Step 1 |
| 删除 Grunt/Babel/ESLint 8 配置/bower/vendor | Task 8 Step 1 |
| release 流程改为构建时产出 dist | Task 8 Step 2 |
| CI 更新 | Task 8 Step 3 |
| README/兼容性口径（3.7+）、去 Codecov 徽章 | Task 8 Step 4 |
| 版本升 3.0.0 | Task 8 Step 4 |
| 覆盖率保留本地生成、不上传 | Task 1（`npm test` 不含上传）、Task 8 Step 3（CI 无上传步骤） |
| 消费者类型验收 | Task 7 Step 4–5 |

**类型一致性**：`TreeMultiselectOptions` / `TreeMultiselectItem` / `TreeMultiselectHandle` / `ResolvedTreeMultiselectOptions` 只在 `types.ts` 定义一次（Task 4 Step 3），Task 4 Step 7 与 Task 7 Step 4 引用同名类型；`Item` / `Section` / `Lookup` 在 Task 3 定义，Task 4 的 `search.ts` / `tree.ts` 使用同名类型；`Util.dom.createSelection` 的结构化参数类型在 Task 2 定义、Task 3 的 `Item.render` 消费。

**Review Focus 覆盖**：5 条各对应 Task 4 Step 9 与 Task 5 Step 4–7 的测试。

**已知未覆盖项**（记录在案，不在本计划范围内）：`dist` 产物的运行时冒烟测试无法在 Node 里做（jQuery 在无 DOM 环境导出的是工厂函数），因此 Task 7 的验收是类型层面的；真实运行由 Task 4–5 的浏览器测试覆盖源码，而非 `dist` —— 这是一处已知的验收缝隙。
