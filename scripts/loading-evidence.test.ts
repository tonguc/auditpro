import assert from 'node:assert/strict';
import {loadingEvidence} from '../lib/loading-evidence';
const result=loadingEvidence(`<head><base href="https://example.com/assets/"></head><body>
<template><img src="fake.png"><script src="fake.js"></script></template>
<img src="hero.png"><img src="second.png" loading="lazy">
<script type="module" src="module.js"></script><script type="module" async src="async.js"></script>
<script defer src="defer.js"></script><script async="false" defer src="boolean.js"></script>
<script nomodule src="old.js"></script><script type="application/ld+json" src="data.json"></script>
<script src="blocking.js"></script><script>const template='<img src="fake2">';</script>
</body>`,new URL('https://example.com/'));
assert.deepEqual(result.images.map(row=>row.loading),['default-eager','lazy']);
assert.equal(result.images[0].src,'https://example.com/assets/hero.png');
assert.deepEqual(result.scripts.map(row=>row.mode),['module-deferred','module-async','classic-deferred','classic-async','legacy-fallback','data-block/src-ignored','classic-parser-blocking']);
assert.equal(loadingEvidence('<img loading="bad" src="javascript:bad">',new URL('https://example.com')).images[0].loading,'invalid/default-eager');
assert.equal(loadingEvidence('<img src="https://user:secret@example.com/image">',new URL('https://example.com')).images[0].src,'[non-HTTP or credential URL]');
assert.deepEqual(loadingEvidence('',new URL('https://example.com')),{images:[],scripts:[]});
console.log('Loading declarations: inert content, base URLs, boolean async, modules, fallbacks and data blocks passed.');
