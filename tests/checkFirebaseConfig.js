'use strict';
const fs = require('fs');
const path = require('path');

const requiredFields = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId'
];

function walk(dir) {
  let results = [];
  for (const file of fs.readdirSync(dir)) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      results = results.concat(walk(filepath));
    } else if (filepath.endsWith('.html')) {
      results.push(filepath);
    }
  }
  return results;
}

function checkReferences(htmlPath, content, errors) {
  const base = path.dirname(htmlPath);
  const linkRegex = /<link[^>]+href=["']([^"']+)["'][^>]*>/gi;
  const scriptRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = linkRegex.exec(content))) {
    const href = m[1];
    if (!/^(?:https?:)?\/\//i.test(href)) {
      const resolved = path.resolve(base, href);
      if (!fs.existsSync(resolved)) {
        errors.push(`Missing file referenced in ${htmlPath}: ${href}`);
      }
    }
  }
  while ((m = scriptRegex.exec(content))) {
    const src = m[1];
    if (!/^(?:https?:)?\/\//i.test(src)) {
      const resolved = path.resolve(base, src);
      if (!fs.existsSync(resolved)) {
        errors.push(`Missing file referenced in ${htmlPath}: ${src}`);
      }
    }
  }
}

function extractConfig(content) {
  const objRegex = /firebaseConfig\s*=\s*{([\s\S]*?)}/i;
  const match = objRegex.exec(content);
  if (!match) return null;
  const body = match[1];
  const config = {};
  for (const field of requiredFields) {
    const r = new RegExp(field + "\\s*:\\s*\"([^\"]+)\"", 'i');
    const m = r.exec(body);
    if (m) config[field] = m[1];
  }
  return config;
}

const htmlFiles = walk(process.cwd());
const configs = [];
const errors = [];

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  checkReferences(file, content, errors);
  const cfg = extractConfig(content);
  if (cfg) {
    const missing = requiredFields.filter(f => !(f in cfg));
    if (missing.length) {
      errors.push(`Missing fields in ${file}: ${missing.join(', ')}`);
    }
    configs.push({file, cfg});
  }
}

if (configs.length > 1) {
  const first = configs[0].cfg;
  for (let i = 1; i < configs.length; i++) {
    const {file, cfg} = configs[i];
    for (const field of requiredFields) {
      if (first[field] !== cfg[field]) {
        errors.push(`Mismatch in ${file} for field ${field}`);
      }
    }
  }
}

if (errors.length) {
  console.error('Errors found:');
  for (const e of errors) console.error(' - ' + e);
  process.exit(1);
} else {
  console.log('All Firebase configs match and referenced files exist.');
}
