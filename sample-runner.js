const fs = require('fs');
const path = require('path');
const pdfmake = require('pdfmake');
const nunjucks = require('nunjucks');
const pdfmakeMarkup = require('./dist/index');

pdfmake.addFonts({
  Roboto: {
    normal: path.join(__dirname, 'node_modules/pdfmake/build/fonts/Roboto/Roboto-Regular.ttf'),
    bold: path.join(__dirname, 'node_modules/pdfmake/build/fonts/Roboto/Roboto-Medium.ttf'),
    italics: path.join(__dirname, 'node_modules/pdfmake/build/fonts/Roboto/Roboto-Italic.ttf'),
    bolditalics: path.join(__dirname, 'node_modules/pdfmake/build/fonts/Roboto/Roboto-MediumItalic.ttf'),
  },
});

const input = process.argv[2];
if (!input) {
  console.error('Usage: node sample-runner.js <sample-name>');
  console.error('  e.g. node sample-runner.js basics');
  process.exit(1);
}

function resolveFile(name) {
  const candidates = [
    name,
    `${name}.pdfmk.njk`,
    `${name}.pdfmk`,
    path.join(__dirname, 'samples', path.basename(name)),
    path.join(__dirname, 'samples', `${path.basename(name)}.pdfmk.njk`),
    path.join(__dirname, 'samples', `${path.basename(name)}.pdfmk`),
  ];
  return candidates.find((p) => fs.existsSync(p));
}

const filePath = resolveFile(input);
if (!filePath) {
  console.error(`Sample not found: ${input}`);
  process.exit(1);
}

function markupLiteral(val) {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'string') return JSON.stringify(val);
  if (Array.isArray(val)) return '[' + val.map(markupLiteral).join(',') + ']';
  if (typeof val === 'object') {
    return (
      '{' +
      Object.entries(val)
        .map(([k, v]) => {
          const key = /^[a-zA-Z_$][\w$]*$/.test(k) ? k : JSON.stringify(k);
          return `${key}:${markupLiteral(v)}`;
        })
        .join(',') +
      '}'
    );
  }
  return 'null';
}

// Auto-wrap every `{{ expr }}` output tag with the `markup` filter so users
// don't have to know about it. `{% ... %}` control tags are left alone.
function autoWrapOutputTags(source) {
  return source.replace(/\{\{\s*([\s\S]+?)\s*\}\}/g, (_m, expr) => {
    if (/\|\s*markup(\s*\||\s*$)/.test(expr)) return `{{ ${expr} }}`;
    return `{{ (${expr}) | markup }}`;
  });
}

const isNjk = filePath.endsWith('.pdfmk.njk');
const rawBaseName = path
  .basename(filePath)
  .replace(/\.pdfmk\.njk$/, '')
  .replace(/\.pdfmk$/, '');

let markup;
if (isNjk) {
  const varsFile = filePath.replace(/\.pdfmk\.njk$/, '.vars.js');
  const vars = fs.existsSync(varsFile) ? require(path.resolve(varsFile)) : {};
  const env = new nunjucks.Environment(null, { autoescape: false });
  env.addFilter('markup', markupLiteral);
  const source = autoWrapOutputTags(fs.readFileSync(filePath, 'utf-8'));
  markup = env.renderString(source, vars);
} else {
  markup = fs.readFileSync(filePath, 'utf-8');
}

const docDefinition = pdfmakeMarkup.decode(markup);

const pdfsDir = path.join(__dirname, 'samples', 'pdfs');
if (!fs.existsSync(pdfsDir)) {
  fs.mkdirSync(pdfsDir);
}

const outputPath = path.join(pdfsDir, `${rawBaseName}.pdf`);
const now = Date.now();
const pdf = pdfmake.createPdf(docDefinition);
pdf.write(outputPath).then(
  () => console.log(`Generated: ${outputPath} (${Date.now() - now}ms)`),
  (err) => {
    console.error('PDF generation failed:', err);
    process.exit(1);
  },
);
