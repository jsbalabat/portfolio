import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

function getGitCommitSha() {
  if (process.env.CF_PAGES_COMMIT_SHA) {
    return process.env.CF_PAGES_COMMIT_SHA.slice(0, 7);
  }
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
}

function getGitBranch() {
  if (process.env.CF_PAGES_BRANCH) {
    return process.env.CF_PAGES_BRANCH;
  }
  try {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch {
    return 'main';
  }
}

const commitSha = getGitCommitSha();
const gitBranch = getGitBranch();
const appVersion = pkg.version || '0.1.0';

// https://astro.build/config
export default defineConfig({
  site: 'https://marcbalabat.tech',
  output: 'static',
  adapter: cloudflare({
    imageService: 'cloudflare',
  }),
  integrations: [
    react(),
    sitemap(),
  ],
  vite: {
    define: {
      'import.meta.env.PUBLIC_APP_VERSION': JSON.stringify(appVersion),
      'import.meta.env.PUBLIC_GIT_SHA': JSON.stringify(commitSha),
      'import.meta.env.PUBLIC_GIT_BRANCH': JSON.stringify(gitBranch),
    },
    plugins: [
      tailwindcss(),
    ],
  },
});
