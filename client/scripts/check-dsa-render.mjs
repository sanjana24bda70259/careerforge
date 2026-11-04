import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const client = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporary = await mkdtemp(join(tmpdir(), 'careerforge-dsa-render-'));
try {
  const entry = join(temporary, 'check.mjs');
  await build({
    stdin: { contents: `
      import assert from 'node:assert/strict';
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { DsaStoryPlayer } from './src/components/DsaStoryPlayer.jsx';
      import { AlgorithmPlayer } from './src/components/DsaVisualStudio.jsx';
      import { explainerLessons } from '../shared/dsaExplainers.mjs';
      import { visualLessons } from '../shared/dsaVisualLessons.mjs';
      for (const lesson of explainerLessons) {
        const html = renderToStaticMarkup(React.createElement(DsaStoryPlayer, { lesson }));
        assert(html.includes('Explanation timeline'), lesson.id);
        assert(html.includes('Read the full explanation'), lesson.id);
        assert(html.includes('aria-label="Previous scene" disabled'), lesson.id);
      }
      for (const lesson of visualLessons) {
        const html = renderToStaticMarkup(React.createElement(AlgorithmPlayer, { lesson }));
        assert(html.includes('Animation timeline'), lesson.id);
        assert(html.includes('REFERENCE SOLUTION'), lesson.id);
      }
      console.log('All 356 explanation players rendered successfully.');
    `, resolveDir: client, loader: 'jsx' },
    bundle: true, platform: 'node', format: 'esm', jsx: 'automatic',
    loader: { '.css': 'empty' }, outfile: entry,
    banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" }
  });
  await import(pathToFileURL(entry).href);
} finally {
  // Only remove the exact temporary directory allocated by this script.
  if (dirname(temporary) === resolve(tmpdir()) && temporary.split(/[\\/]/).at(-1).startsWith('careerforge-dsa-render-')) await rm(temporary, { recursive: true, force: true });
}
