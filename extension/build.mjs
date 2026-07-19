import esbuild from 'esbuild';
import { argv } from 'process';
import { copyFileSync, mkdirSync } from 'fs';

const watch = argv.includes('--watch');

const shared = {
  bundle: true,
  platform: 'browser',
  target: 'chrome120',
  sourcemap: watch ? 'inline' : false,
  minify: !watch,
};

const entryPoints = [
  { in: 'src/content/index.ts',             out: 'content'     },
  { in: 'src/background/service-worker.ts', out: 'background'  },
  { in: 'src/popup/popup.ts',               out: 'popup/popup' },
];

function copyAssets() {
  mkdirSync('dist/popup', { recursive: true });
  copyFileSync('src/popup/popup.html', 'dist/popup/popup.html');
}

if (watch) {
  const ctx = await esbuild.context({ ...shared, entryPoints, outdir: 'dist' });
  copyAssets();
  await ctx.watch();
  console.log('Watching…');
} else {
  await esbuild.build({ ...shared, entryPoints, outdir: 'dist' });
  copyAssets();
  console.log('Build complete.');
}
