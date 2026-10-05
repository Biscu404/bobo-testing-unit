#!/usr/bin/env node
/* Offline check: boots the desktop and fails on any request that leaves the app
   origin, any page error, or if the bundled VT323 font did not load.
   Usage: node scripts/check-offline.mjs [url]   (default http://localhost:3000/) */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

const URL_ = process.argv[2] || 'http://localhost:3000/';
const CH = '/opt/pw-browsers/chromium';
const origin = new URL(URL_).origin;
const br = await chromium.launch({ executablePath: existsSync(CH) ? CH : undefined });
const p = await br.newPage();
const external = [], errors = [];
p.on('request', r => {
  const u = r.url();
  if (!u.startsWith(origin) && !u.startsWith('data:') && !u.startsWith('blob:')) external.push(u);
});
p.on('pageerror', e => errors.push(e.message));
await p.goto(URL_);
await p.waitForTimeout(3000);
const font = await p.evaluate(async () => {
  await document.fonts.ready;
  return [...document.fonts].some(f => f.family.includes('VT323') && f.status === 'loaded');
});
await br.close();
console.log(font ? 'PASS - VT323 loaded locally' : 'FAIL - VT323 not loaded');
console.log(external.length ? `FAIL - external requests:\n  ${external.join('\n  ')}` : 'PASS - no external requests');
console.log(errors.length ? `FAIL - page errors:\n  ${errors.join('\n  ')}` : 'PASS - no page errors');
process.exit(font && !external.length && !errors.length ? 0 : 1);
