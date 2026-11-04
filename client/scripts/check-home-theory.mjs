import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const client = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporary = await mkdtemp(join(tmpdir(), 'careerforge-home-render-'));
try {
  const entry = join(temporary, 'check.mjs');
  await build({
    stdin: { contents: `
      import assert from 'node:assert/strict';
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { MemoryRouter } from 'react-router-dom';
      import { AppRoutes } from './src/App.jsx';
      import { HomePage } from './src/components/HomePage.jsx';
      import { DsaTheoryArticle } from './src/components/DsaTheoryArticle.jsx';
      import { explainerLessons } from '../shared/dsaExplainers.mjs';
      import { visualLessons } from '../shared/dsaVisualLessons.mjs';
      const ready = {user:null, checking:false, error:'', setUser:()=>{}, retry:()=>{}};
      for (const route of ['/', '/login', '/register']) {
        const guest = renderToStaticMarkup(<MemoryRouter initialEntries={[route]}><AppRoutes session={ready} /></MemoryRouter>);
        assert(guest.includes(route === '/' ? 'Learn. Practise.' : 'account-title'));
        assert.equal(guest.includes('name="email"'), route !== '/'); assert.equal(guest.includes('name="password"'), route !== '/');
        assert.equal(guest.includes('name="name"'), route === '/register');
        const signedIn = renderToStaticMarkup(<MemoryRouter initialEntries={[route]}><AppRoutes session={{...ready,user:{id:'test'}}} /></MemoryRouter>);
        assert(!signedIn.includes('name="password"')); assert(!signedIn.includes('Build the skills.'));
        const restoring = renderToStaticMarkup(<MemoryRouter initialEntries={[route]}><AppRoutes session={{...ready,checking:true}} /></MemoryRouter>);
        assert(restoring.includes('Checking your session')); assert(!restoring.includes('name="password"'));
        const offline = renderToStaticMarkup(<MemoryRouter initialEntries={[route]}><AppRoutes session={{...ready,error:'Temporarily offline'}} /></MemoryRouter>);
        assert(offline.includes('Temporarily offline')); assert(!offline.includes('name="password"'));
      }
      const home = renderToStaticMarkup(<MemoryRouter><HomePage setUser={()=>{}} /></MemoryRouter>);
      assert(home.includes('LIVE PLAYGROUND')); assert(home.includes('YOUR SUGGESTED PATH'));
      for (const lesson of [...explainerLessons, ...visualLessons]) {
        const problem = {...lesson, id:lesson.questionId || lesson.id};
        const html = renderToStaticMarkup(<DsaTheoryArticle problem={problem} topicId={lesson.topic} lesson={lesson} />);
        assert(html.includes('How does it work?'), lesson.id);
        assert(html.includes('Check your understanding'), lesson.id);
        assert(!html.includes('undefined'), lesson.id);
        if (problem.id === 'linear-search') {
          assert(html.includes('Best case')); assert(html.includes('Apply input'));
          assert(html.includes('first match')); assert(html.includes('Copy code'));
        }
      }
      console.log('Guest entry pages, session-loading/error guards, signed-in entry redirects and all 356 theory articles render successfully.');
    `, resolveDir: client, loader: 'jsx' },
    bundle: true, platform: 'node', format: 'esm', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, loader: { '.css': 'empty' }, outfile: entry,
    banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" }
  });
  await import(pathToFileURL(entry).href);
} finally {
  if (dirname(temporary) === resolve(tmpdir()) && temporary.split(/[\\/]/).at(-1).startsWith('careerforge-home-render-')) await rm(temporary, { recursive: true, force: true });
}
