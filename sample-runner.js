const fs = require('fs');
const path = require('path');
const pdfmake = require('pdfmake');
const pdfmakeMarkup = require('./dist/index');

// Setup fonts
pdfmake.addFonts({
  Roboto: {
    normal: path.join(__dirname, 'node_modules/pdfmake/build/fonts/Roboto/Roboto-Regular.ttf'),
    bold: path.join(__dirname, 'node_modules/pdfmake/build/fonts/Roboto/Roboto-Medium.ttf'),
    italics: path.join(__dirname, 'node_modules/pdfmake/build/fonts/Roboto/Roboto-Italic.ttf'),
    bolditalics: path.join(__dirname, 'node_modules/pdfmake/build/fonts/Roboto/Roboto-MediumItalic.ttf'),
  },
});

// Parse CLI args
const input = process.argv[2];
if (!input) {
  console.error('Usage: node sample-runner.js <pdfmk-file>');
  console.error('  e.g. node sample-runner.js sample-query-with-params');
  process.exit(1);
}

// Resolve file path: accept with or without extension, look in samples/ dir
let filePath = input;
if (!filePath.endsWith('.pdfmk')) {
  filePath += '.pdfmk';
}
if (!fs.existsSync(filePath)) {
  filePath = path.join(__dirname, 'samples', path.basename(filePath));
}
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${input}`);
  console.error(`Looked in: ${path.resolve(input)}, ${filePath}`);
  process.exit(1);
}

// Sample context data — in a real app this would come from your backend
const context = {
  title: 'Sample Invoice',
  subtitle: 'Generated using pdfmake-markup',
  footerPrefix: 'pdfmake-markup sample',
};

// Read, decode, generate
const markup = fs.readFileSync(filePath, 'utf-8');
const docDefinition = pdfmakeMarkup.decode(markup, context);

const pdfsDir = path.join(__dirname, 'samples', 'pdfs');
if (!fs.existsSync(pdfsDir)) {
  fs.mkdirSync(pdfsDir);
}

const baseName = path.basename(filePath, '.pdfmk');
const outputPath = path.join(pdfsDir, `${baseName}.pdf`);

const now = Date.now();
const pdf = pdfmake.createPdf(docDefinition);
pdf.write(outputPath).then(() => {
  console.log(`Generated: ${outputPath} (${Date.now() - now}ms)`);
}, (err) => {
  console.error('PDF generation failed:', err);
  process.exit(1);
});
