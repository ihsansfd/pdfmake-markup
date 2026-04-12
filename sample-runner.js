const fs = require('fs');
const path = require('path');
const pdfmake = require('pdfmake');
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
    `${name}.pdfmk`,
    path.join(__dirname, 'samples', path.basename(name)),
    path.join(__dirname, 'samples', `${path.basename(name)}.pdfmk`),
  ];
  return candidates.find((p) => fs.existsSync(p));
}

const filePath = resolveFile(input);
if (!filePath) {
  console.error(`Sample not found: ${input}`);
  process.exit(1);
}

const markup = fs.readFileSync(filePath, 'utf-8');
const docDefinition = pdfmakeMarkup.decode(markup);

const pdfsDir = path.join(__dirname, 'samples', 'pdfs');
if (!fs.existsSync(pdfsDir)) {
  fs.mkdirSync(pdfsDir);
}

const baseName = path.basename(filePath, '.pdfmk');
const outputPath = path.join(pdfsDir, `${baseName}.pdf`);
const now = Date.now();
const pdf = pdfmake.createPdf(docDefinition);
pdf.write(outputPath).then(
  () => console.log(`Generated: ${outputPath} (${Date.now() - now}ms)`),
  (err) => {
    console.error('PDF generation failed:', err);
    process.exit(1);
  },
);
