#!/usr/bin/env node
/**
 * Builds a fully self-contained offline HTML file.
 * Inlines React, ReactDOM, jsPDF, and pre-compiled app code.
 */

const fs   = require('fs');
const path = require('path');
const babel = require('@babel/core');

const NM = path.join(__dirname, 'node_modules');

// ── Read vendor libs ─────────────────────────────────────────────────────────
const reactJs    = fs.readFileSync(path.join(NM, 'react/umd/react.production.min.js'), 'utf8');
const reactDomJs = fs.readFileSync(path.join(NM, 'react-dom/umd/react-dom.production.min.js'), 'utf8');
// Replace </script> inside the source so the HTML parser doesn't break the tag early
const jspdfJs    = fs.readFileSync(path.join(NM, 'jspdf/dist/jspdf.umd.js'), 'utf8')
                     .replace(/<\/script>/gi, '<\\/script>');

// ── Read & compile app source ─────────────────────────────────────────────────
const appSrc = fs.readFileSync(path.join(__dirname, 'app-source.jsx'), 'utf8');

const compiled = babel.transformSync(appSrc, {
  presets: [
    ['@babel/preset-react', { runtime: 'classic' }]
  ],
  filename: 'app.jsx',
}).code;

// ── Assemble HTML ─────────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AuditPro — UX + SEO Audit Tool</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0A0E1A; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    input, button, select { font-family: inherit; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #111827; }
    ::-webkit-scrollbar-thumb { background: #1e2d45; border-radius: 3px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <!-- React 18 -->
  <script>${reactJs}</script>
  <!-- ReactDOM 18 -->
  <script>${reactDomJs}</script>
  <!-- jsPDF 2.5.1 -->
  <script>${jspdfJs}</script>
  <!-- AuditPro App -->
  <script>
${compiled}
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'auditpro-offline.html'), html, 'utf8');

const size = (html.length / 1024).toFixed(0);
console.log(`✅ Built auditpro-offline.html — ${size} KB`);
