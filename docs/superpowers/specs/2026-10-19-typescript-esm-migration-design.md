# tree-multiselect 迁移到 TypeScript + ESM 设计文档

日期：2026-10-19
状态：待评审

## 目标（为什么做）

让使用者在 TypeScript 项目中 `import 'tree-multiselect'` 即可完成插件注册，并获得准确的类型提示：`treeMultiselect(params)` 的配置项、返回值上的 `.reload()` / `.remove()`、以及 `onChange` 回调中对象的形状。类型声明**由源码编译产出**，不与实现脱节。

同时把 Grunt + Browserify + Babel + Uglify + grunt-sass 这套构建链整体替换掉。

## 非目标

- 不再提供 UMD / 全局 `<script>` 直用的产物，不再产出 `dist/jquery.tree-multiselect.js` 或 `dist/*.min.js`
- 不改动公开 API 的行为：参数名、默认值、`data-section` / `data-description` / `data-index` / `readonly` 语义、`.reload()` / `.remove()` 行为、`onChange` 签名一律保持原样
- 不改动 DOM 结构与 CSS 类名（`.tree-multiselect` / `.selections` / `.selected` / `.item` / `.section` / `searchhit` 属性等），不改 `data-key` 约定
- 不引入 jsdom
- 不打包 jQuery 进产物
- 不维护 bower

## 反目标（即使技术上跑通也算失败）

- 手写 `.d.ts` 与源码并行维护
- 要求使用者额外配置别名或提供全局 `jQuery` 才能工作
- 现有使用者的 `<select>` HTML 与配置对象需要改动才能继续工作（除加载方式外）

## 约束

- Node 24（当前环境 v24.19.0）、npm 10
- 产物为纯 ESM，`package.json` 设 `"type": "module"`
- jQuery 为 peerDependency，由使用者提供；jQuery UI 为可选 peerDependency（仅 `sortable: true` 需要）
- 测试必须在真实浏览器中运行

## 使用者已拍板的决定

| 议题 | 决定 |
| --- | --- |
| 迁移动机 | 产出 `.d.ts` 给使用者 |
| 构建链 | 整体替换 Grunt/Browserify |
| 分发形态 | 支持 `import 'tree-multiselect'` |
| UMD | 不要，只输出 ESM |
| 测试运行环境 | 真实浏览器 |
| 测试技术 | 用最新的 |
| 公开 API | 完全不变 |
| `dist/jquery.tree-multiselect.js` 路径 | 不保留 |

## 我做的判断（评审时请重点检查）

这些是为了让方案可执行而由我定的，若与你的预期不符请指出。

1. **构建工具用 `tsc`，不引入打包器。** 迁移后源码本身就是 ESM，直接 `tsc` 输出「未打包的 ESM + `.d.ts`」即可，由使用者的打包器去做打包和压缩。这样 `.d.ts` 与 `.js` 天然一一对应，不需要 dts 打包插件，也避开了 TypeScript 7 与各类 bundler 插件的兼容风险。代价是 `dist/` 下文件变多（当前源码共 12 个模块），且产物不再压缩——对 ESM 使用者无影响。
2. **模块解析用 `module: "NodeNext"`，源码相对导入写 `.js` 后缀**（如 `import Tree from './tree.js'`）。这样产物在 Node 的 ESM 解析下也成立，不是只能被打包器吃下。
3. **lint 换成 ESLint 10 + typescript-eslint 8 的 flat config**，保留现有风格规则（2 空格缩进、单引号、分号、unix 换行）。
4. **测试用 Vitest 5 browser mode + Playwright（Chromium）**，jQuery 与 jQuery UI 从 npm 引入最新版（jquery 4.0.0、jquery-ui 1.14.2，后者的 peer 范围是 `>=1.12 <5`，与 jQuery 4 兼容）。测试文件改为 `.ts` 并使用 `import`（现有 `require('utility')` 这种裸模块名依赖 Browserify 的 `paths` 配置，必然要改）。
5. **断言保留 chai 的 `assert` 风格**，在 setup 中注入全局，避免重写约 1300 行测试的断言；`describe/it/beforeEach` 通过 Vitest 的 `globals: true` 继续可用。
6. **兼容性口径随之收窄为 jQuery 3.7+**。用 jQuery 4 跑测试后就不再验证 1.8/1.11，README 里「Requires jQuery v1.8+」需要改写；peerDependencies 定为 `jquery: ">=3.7 <5"`。这是迁移的连带后果，若你希望维持 1.8 的承诺，就必须保留一份老 jQuery 的测试矩阵。
7. **CSS 产物改名去掉 `jquery.` 前缀**，输出 `dist/tree-multiselect.css` 与 `dist/tree-multiselect.min.css`，通过 `exports` 暴露 `./style.css`。
8. **删除** `Gruntfile.js`、`.babelrc`、`.eslintrc.yml`、`bower.json`、`.npmignore`（改用 `files` 白名单）、`test/vendor/`（jQuery 与 jQuery UI 改从 npm 取）。
9. **`test/test.html` 与 `test/test-performance.html`** 改为 Vite 服务的 `demo/` 页面（`<script type="module">`），从测试体系中移出，仅供手动把玩。
10. **版本号按 breaking change 处理**，发布时升到 3.0.0。

## 评审后补充的决定

一名独立评审通读了本文档与仓库，提出 8 个会卡住实施的问题。核实后全部已定，实施者无需再问。

1. **`@types/jquery` 作为 `dependencies`**（你的决定）。`jquery@4.0.0` 本身不带任何类型声明，而本文档的公开类型表面（`declare global { interface JQuery { ... } }`、`JQuery<TreeMultiselectHandle>`）必须要能解析出 `JQuery` 界面，因此它必须对使用者可见。选 `dependencies` 的收益是使用者 `npm i tree-multiselect` 后开箱即用、符合反目标「不需要额外配置」；已知代价是它会把 jQuery 的全局类型注入使用者的编译环境，且当使用者自己装的是 `@types/jquery@3.x` 时可能出现两份类型共存——这一点在验收里作为一个已知限制记录下来。

### 其余已定

2. **jQuery UI 的类型**：`@types/jqueryui`（最新 1.12.24，包名是 `jqueryui` 而非 `jquery-ui`）以 devDependency 引入，tsconfig 里 `types: ["jquery", "jqueryui"]`，它声明了全局的 `JQuery.sortable` 重载。`sortable` 只出现在方法体内、不出现在任何类型位置，所以**不需要**手写 ambient 声明，也不会有手写声明进入发布的 `dist`。若 `'option', 'start'` 这类调用在 `@types/jqueryui` 里没有对应重载，由实施者在调用点做窄化断言，不改公开类型。

3. **`npm test` 保持聚合**：`npm test` = `typecheck && lint && vitest run`，与现在 `grunt test` = lint + karma 的语义一致，CI 只需 `npm test` 即可守住三道关卡。

4. **覆盖率**：现有 `conf/karma.js` 会产出 istanbul 覆盖率，但 `.circleci/config.yml` 里没有任何上传步骤（`codecov` / `grunt-coveralls` 只是留着的依赖），README 的 Codecov 徽章实际上早已没有数据支撑。决定：改用 Vitest 的 istanbul 覆盖率做本地信号，**不新增上传步骤**；README 里那个徽章在文档清理时一并去掉。

5. **发布流程**：`dist/` 是构建产物，不进版本库——它现在确实已经不在仓库里了（本地提交 `a0f00a0` 删除了 `dist/` 下 4 个文件）。因此新增 `dist/` 到 `.gitignore`，用 `files: ["dist"]` 控制发布内容；`release.sh` 里的 `grunt release` 换成 `npm run build`，并去掉会导致构建产物被提交的 `git add .`（改为只提交版本号变更），其余 tag / push / `npm publish` 不变。`package.json` 的 `release` 脚本同样指向构建。

6. **测试的类型严格度**：测试文件纳入类型检查（独立的 tsconfig 包含 `test/`），但公开类型不放宽——`maxSelections` 就只接受 `number`，尽管运行时对任意值都宽容。少数故意传入非法值的用例（如 `options.test.js:474` 的 `{maxSelections: true}`、`utility.test.js` 里给 `Ast.createSection` 传字符串、给 `createDomSelection` 传第四个参数）在调用点就地做窄化断言。

7. **TypeScript 版本钉在 6.0.3**：`typescript-eslint@8.71.2` 的 peer 范围是 `typescript >=4.8.4 <6.1.0`，用 TS 7 就会失去带类型感知的 lint 规则。等 typescript-eslint 支持 TS 7 后再升。

8. **测试里 jQuery UI 的加载方式**：`jquery-ui@1.14.2` 没有 `exports` map、没有类型，`ui/widgets/sortable.js` 是 UMD 包装且**没有 CommonJS 分支**，非 AMD 环境下直接读取全局 `jQuery`。而 ESM 的静态 import 会被提升到赋值 `globalThis.jQuery` 之前执行，导致该模块拿到 `undefined`。因此 `test/setup.ts` 用顶层 await：

   ```ts
   import jQuery from 'jquery';
   globalThis.$ = globalThis.jQuery = jQuery;
   await import('jquery-ui/ui/widgets/sortable');
   ```

   `test/vendor/` 照原计划删除，不再需要 vendored jQuery / jQuery UI。

## 迁移后的结构

```
src/
  tree-multiselect.ts          # 入口：import jquery、挂 $.fn.treeMultiselect、导出类型
  tree-multiselect/
    main.ts                    # $.fn 实现 + 默认参数合并
    tree.ts                    # 核心：AST 构建、渲染、事件
    search.ts                  # 三元组倒排索引
    ui-builder.ts              # 双栏容器
    ast/{index,common,item,section}.ts
    utility/{index,array,dom}.ts
  style.scss
test/
  setup.ts                     # 注入 jQuery 全局、加载 jQuery UI、chai assert、引入插件
  integration/common.ts
  integration/*.test.ts
  unit/utility.test.ts
dist/                          # tsc 产出：ESM + d.ts + sourcemap，sass 产出 CSS
```

### 公开类型表面

```ts
export interface TreeMultiselectOptions { /* 16 个可选参数，与 README 表格一一对应 */ }
export interface TreeMultiselectItem {
  text: string;
  value: string;
  initialIndex: number | null;
  section: string | null;
}
export interface TreeMultiselectHandle {
  reload(): void;
  remove(): void;
}

declare global {
  interface JQuery {
    // 运行时由 this.map() 返回一个 jQuery 对象（内含 handle），不是数组
    treeMultiselect(options?: TreeMultiselectOptions): JQuery<TreeMultiselectHandle>;
  }
}
```

`TreeMultiselectItem` 只声明 README 已承诺的 4 个字段（`onChange` 实际传入的 AST 对象还有 `description` / `disabled` / `node` 等内部字段，不纳入公开契约）。

### 导入模型

- 每个内部模块显式 `import jQuery from 'jquery'`，`jquery` 在构建中标记为 external，绝不内联
- 源码中不再出现隐式全局 `jQuery` / `$`；`document` 等 DOM 全局照常
- 使用者在入口 `import 'tree-multiselect'` 后，`$.fn.treeMultiselect` 即可用，同时类型增强生效

## package.json 变化

```jsonc
{
  "type": "module",
  "exports": {
    ".": { "types": "./dist/tree-multiselect.d.ts", "import": "./dist/tree-multiselect.js" },
    "./style.css": "./dist/tree-multiselect.css",
    "./package.json": "./package.json"
  },
  "files": ["dist"],
  "dependencies": { "@types/jquery": "^4.0.1" },
  "peerDependencies": { "jquery": ">=3.7 <5", "jquery-ui": ">=1.12 <5" },
  "peerDependenciesMeta": { "jquery-ui": { "optional": true } }
}
```

`browser` 字段移除（原本指向已废弃的 min 产物）。script 命令改为：`build`（tsc + sass）、`typecheck`、`lint`、`test`、`test:watch`、`dev`（Vite 起的 demo）。

## 测试

- Vitest 配置启用 browser mode，`provider: 'playwright'`，`browser: 'chromium'`，headless
- `test/setup.ts`：`import jQuery from 'jquery'` 并挂到 `globalThis.$` / `globalThis.jQuery`，`import 'jquery-ui/ui/widgets/sortable'`，注入 `globalThis.assert`（chai），最后 `import '../src/tree-multiselect'` 触发插件注册
- 现有 9 个集成测试 + 1 个单元测试的用例**逐条保留**，作为迁移的回归基线
- `sortable` 的用例是直接调用 widget 的 `start` / `stop` 回调（options.test.js:267 起），不依赖真实拖拽，可在新环境下原样保留
- 如果 jQuery UI 的 ESM 子路径入口缺类型，在 `test/` 下补一个最小的模块声明，不用 `any` 污染源码

## CI

`.circleci/config.yml` 更新：换用较新的 `cimg/node` 镜像，`npx playwright install --with-deps chromium`，然后 `npm test`。

## 风险

| 风险 | 应对 |
| --- | --- |
| `strict` 打开后暴露大量隐式全局与空值问题（`getAttribute` 返回 `string \| null`、AST 的 `node` 可空） | 逐模块自底向上迁移（utility → ast → search → ui-builder → tree → main → 入口），每步保持测试通过 |
| jQuery 4 与现有代码的兼容性 | 测试覆盖全部行为；目前用到的 API（`map`/`attr`/`children`/`change`/`extend`/`sortable`）均未被 jQuery 4 移除 |
| `declare global` 的类型增强依赖使用者 `import` 本包才生效 | 这是 `import 'tree-multiselect'` 用法本身要求的，需在 README 中写清楚 |
| 未打包产物的路径与 `exports` 不一致会静默破坏类型解析 | 以「从 `dist` 安装后跑一个最小 TS 消费者」作为验收项 |

## 留给实施者的空间

- 具体 tsconfig 选项取值（target/lib/sourceMap 细节）
- 测试 setup 的文件组织与 demo 页面的具体形态
- ESLint 规则的逐条落法
- 每个模块内部类型的粒度（是否导出内部类型）
