import jQuery from 'jquery';

import '../src/style.scss';
import '../src/tree-multiselect.js';

Object.assign(globalThis, { $: jQuery, jQuery });

// jQuery UI 的模块在非 AMD 环境下读取全局 jQuery，且必须在插件的
// sortable 调用之前加载。
await import('jquery-ui/dist/jquery-ui.js');
