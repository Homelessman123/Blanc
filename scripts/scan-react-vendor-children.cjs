#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');

const filePath = process.argv[2];
if (!filePath) {
    console.error('Usage: node scripts/scan-react-vendor-children.cjs <path-to-js-file>');
    process.exit(2);
}

const context = Number.parseInt(process.argv[3] ?? '', 10) || 140;
const maxPrint = Number.parseInt(process.argv[4] ?? '', 10) || 25;

const s = fs.readFileSync(filePath, 'utf8');
const needle = process.argv[5] || 'Children';

let idx = 0;
const hits = [];
while (true) {
    const next = s.indexOf(needle, idx);
    if (next === -1) break;
    hits.push(next);
    idx = next + needle.length;
}

console.log('file', filePath);
console.log('bytes', Buffer.byteLength(s, 'utf8'));
console.log('needle', needle);
console.log('hits', hits.length);
console.log('context', context);
console.log('maxPrint', maxPrint);
for (let i = 0; i < Math.min(maxPrint, hits.length); i++) {
    const at = hits[i];
    const start = Math.max(0, at - context);
    const end = Math.min(s.length, at + needle.length + context);
    console.log(`\n#${i} @${at}`);
    console.log(s.slice(start, end));
}
