// Copies runtime assets from dependencies into public/ so the app works fully offline.
import fs from 'node:fs';
import path from 'node:path';

const copyDir = (from, to, filter = () => true) => {
  fs.mkdirSync(to, { recursive: true });
  for (const f of fs.readdirSync(from)) if (filter(f)) fs.copyFileSync(path.join(from, f), path.join(to, f));
};
copyDir('node_modules/pdfjs-dist/cmaps', 'public/cmaps');
copyDir('node_modules/pdfjs-dist/standard_fonts', 'public/standard_fonts');
copyDir('node_modules/tesseract.js/dist', 'public/tesseract', (f) => f === 'worker.min.js');
copyDir('node_modules/tesseract.js-core', 'public/tesseract', (f) => /-lstm\.(js|wasm|wasm\.js)$/.test(f));
console.log('assets copied');

// The licences of everything the app ships, as one text file for the About screen (every store expects the notices
// these licences require to be shown to users).
const read = (p) => { try { return fs.readFileSync(p, 'utf8').trim(); } catch { return ''; } };
const pkg = (name) => JSON.parse(fs.readFileSync(`node_modules/${name}/package.json`, 'utf8'));
const licenceFile = (name) => {
  const f = fs.readdirSync(`node_modules/${name}`).find((x) => /^licen[sc]e/i.test(x));
  return f ? read(`node_modules/${name}/${f}`) : '';
};
const MIT = (who) => `MIT License\n\nCopyright (c) ${who}\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`;
const ISC = (who) => `ISC License\n\nCopyright (c) ${who}\n\nPermission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.\n\nTHE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.`;
const who = (name) => { const a = pkg(name).author; return (typeof a === 'string' ? a : a?.name) || `the ${name} authors`; };
const apache = licenceFile('pdfjs-dist');
// [what it is, licence name, licence text]
const parts = [
  ...['pdf-lib', 'pdfjs-dist', 'tesseract.js', 'tesseract.js-core', 'fflate', 'fast-xml-parser', 'preact', '@preact/signals', 'lucide-preact',
    '@capacitor/core', '@capacitor/filesystem', '@capacitor/share', '@capacitor/app', 'electron']
    .map((n) => [`${n} ${pkg(n).version}`, pkg(n).license, licenceFile(n) || (pkg(n).license === 'ISC' ? ISC(who(n)) : MIT(who(n)))]),
  [`@pdf-lib/fontkit ${pkg('@pdf-lib/fontkit').version}`, 'MIT', MIT('Devon Govett and the pdf-lib authors')],
  [`@neslinesli93/qpdf-wasm ${pkg('@neslinesli93/qpdf-wasm').version}`, 'ISC', ISC(who('@neslinesli93/qpdf-wasm'))],
  ['qpdf (PDF encryption and repair, inside qpdf-wasm), copyright Jay Berkenbilt', 'Apache-2.0', apache],
  ['Tesseract OCR engine and its English and Arabic language data, copyright Google Inc. and the Tesseract authors', 'Apache-2.0', apache],
  ['Noto Sans, Noto Serif, Noto Sans Mono and Noto Naskh Arabic fonts', 'SIL Open Font License 1.1', read('public/fonts/OFL.txt')],
  ['Character maps for PDF text (from pdf.js)', 'BSD-3-Clause', read('node_modules/pdfjs-dist/cmaps/LICENSE')],
  ['Liberation fonts (substitutes for the standard PDF fonts, from pdf.js)', 'SIL Open Font License 1.1', read('node_modules/pdfjs-dist/standard_fonts/LICENSE_LIBERATION')],
  ['Foxit fonts (substitutes for the standard PDF fonts, from pdf.js)', 'BSD-3-Clause', read('node_modules/pdfjs-dist/standard_fonts/LICENSE_FOXIT')],
];
const missing = parts.filter((p) => !p[2]).map((p) => p[0]);
if (missing.length) throw new Error(`No licence text for: ${missing.join(', ')}`);
// Each licence text once; the components under it are listed above it.
const texts = new Map();
for (const [what, licence, text] of parts) texts.set(text, { licence, what: [...(texts.get(text)?.what ?? []), what] });
const rule = '='.repeat(78);
fs.writeFileSync('public/licenses.txt',
  'MK PDF includes the following open-source software and fonts. Thank you to their authors.\n\n' +
  parts.map(([what, licence]) => `• ${what} — ${licence}`).join('\n') + '\n\n' +
  [...texts].map(([text, { what }]) => `${rule}\n${what.join('\n')}\n${rule}\n\n${text}`).join('\n\n') + '\n');
console.log(`licences written (${parts.length} components)`);
