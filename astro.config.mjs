import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

function getGitCommitSha() {
  // If deployed from main branch on Cloudflare Pages:
  if (process.env.CF_PAGES_COMMIT_SHA && process.env.CF_PAGES_BRANCH === 'main') {
    return process.env.CF_PAGES_COMMIT_SHA.slice(0, 7);
  }
  // Retrieve commit pushed to main (origin/main or main)
  try {
    const originMainSha = execSync('git rev-parse --short origin/main', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (originMainSha) return originMainSha;
  } catch {}
  try {
    const mainSha = execSync('git rev-parse --short main', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (mainSha) return mainSha;
  } catch {}
  if (process.env.CF_PAGES_COMMIT_SHA) {
    return process.env.CF_PAGES_COMMIT_SHA.slice(0, 7);
  }
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
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

function getAppVersion() {
  if (process.env.PUBLIC_APP_VERSION) {
    return process.env.PUBLIC_APP_VERSION.replace(/^v/, '');
  }
  try {
    const gitTag = execSync('git describe --tags --abbrev=0', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (gitTag) {
      return gitTag.replace(/^v/, '');
    }
  } catch {}
  return pkg.version || '0.4.0';
}

const commitSha = getGitCommitSha();
const gitBranch = getGitBranch();
const appVersion = getAppVersion();

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
