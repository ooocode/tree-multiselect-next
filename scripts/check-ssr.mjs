/* global console */
// Regression check for SSR: the package entry must be importable in an
// environment without a DOM (Next.js prerendering, Remix, plain Node).
if (typeof document !== 'undefined') {
  throw new Error('check-ssr must run in a DOM-less environment');
}

await import('../dist/tree-multiselect.js');
console.log('SSR import ok: the entry loaded without a DOM');
