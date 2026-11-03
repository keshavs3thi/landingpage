// Builds the site locally and publishes dist/ to the main branch of keshavs3thi.github.io, the user-site
// repo that serves https://keshavsethi.com/ (dist/CNAME, from public/CNAME, keeps the domain attached).
// Source photos are gitignored, so only the resized, EXIF-stripped copies in dist/ ever reach GitHub.
// Refuses to run with uncommitted changes so the live site always matches a commit on main.
// Usage: npm run deploy  (or `npm run deploy -- --dirty` to publish the working tree as-is)

import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import ghpages from 'gh-pages';

const TARGET = { repo: 'https://github.com/keshavs3thi/keshavs3thi.github.io.git', branch: 'main' };

// gh-pages clones into node_modules/.cache by default, which overflows Windows' 260-char path limit
// under this project's long OneDrive path. The system temp folder is short.
process.env.CACHE_DIR ??= join(tmpdir(), 'portfolio-deploy');

const DIST = resolve('dist');

const run = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();

const dirty = run('git status --porcelain');
if (dirty && !process.argv.includes('--dirty')) {
  console.error('Uncommitted changes; commit them first (or pass --dirty):\n' + dirty);
  process.exit(1);
}

execSync('npm run build', { stdio: 'inherit' });

const sha = run('git rev-parse --short HEAD');
// gh-pages' returned promise resolves even on failure; only the callback sees the error.
await new Promise((resolve, reject) =>
  ghpages.publish(
    'dist',
    {
      ...TARGET,
      nojekyll: true, // Jekyll would drop Astro's _astro/ folder
      // gh-pages normally clears the old site with one `git rm` listing every file, which overflows
      // Windows' ~32k command-line limit once there are enough photos (spawn ENAMETOOLONG). Skip
      // that step and delete stale files from disk instead; gh-pages' `git add .` stages the deletions.
      add: true,
      beforeAdd: (git) => {
        const tracked = execSync('git ls-files -z', { cwd: git.cwd, encoding: 'utf8', maxBuffer: 64 << 20 });
        for (const file of tracked.split('\0').filter(Boolean)) {
          if (file !== '.nojekyll' && !existsSync(join(DIST, file))) rmSync(join(git.cwd, file), { force: true });
        }
      },
      message: `Deploy ${sha}${dirty ? ' (with uncommitted changes)' : ''}`,
    },
    (err) => (err ? reject(err) : resolve()),
  ),
);
console.log(`Published ${sha} to keshavsethi.com. GitHub Pages updates in about a minute.`);
