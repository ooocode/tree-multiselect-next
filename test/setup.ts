import { assert } from 'chai';
import jQuery from 'jquery';

import '../src/tree-multiselect.js';

// @types/jquery 用 `declare const` 声明全局 $ / jQuery，const 不会出现在
// typeof globalThis 上，所以这里用 Object.assign 而不是逐个属性赋值。
Object.assign(globalThis, { $: jQuery, jQuery, assert });

// jquery-ui 的模块在非 AMD 环境下读取全局 jQuery，且 widgets/sortable 依赖
// core / widget / mouse 已经就位，因此这里引入合并构建，并必须在赋值全局
// 之后动态引入（静态 import 会被提升到赋值之前）。
await import('jquery-ui/dist/jquery-ui.js');
