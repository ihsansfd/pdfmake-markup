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

function resolveFile(name) {
  const candidates = [
    name,
    `${name}.pdfmk`,
    path.join(__dirname, 'samples', path.basename(name)),
    path.join(__dirname, 'samples', `${path.basename(name)}.pdfmk`),
  ];
  return candidates.find((p) => fs.existsSync(p));
}

const pdfsDir = path.join(__dirname, 'samples', 'pdfs');
if (!fs.existsSync(pdfsDir)) {
  fs.mkdirSync(pdfsDir);
}

async function generateSample(filePath) {
  const markup = fs.readFileSync(filePath, 'utf-8');
  const docDefinition = pdfmakeMarkup.decode(markup);
  const baseName = path.basename(filePath, '.pdfmk');
  const outputPath = path.join(pdfsDir, `${baseName}.pdf`);
  const now = Date.now();
  const pdf = pdfmake.createPdf(docDefinition);

  await pdf.write(outputPath);
  console.log(`Generated: ${outputPath} (${Date.now() - now}ms)`);
}

function getAllSampleFiles() {
  return fs
    .readdirSync(path.join(__dirname, 'samples'))
    .filter((name) => name.endsWith('.pdfmk'))
    .map((name) => path.join(__dirname, 'samples', name))
    .sort();
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: node sample-runner.js <sample-name>');
    console.error('   or: node sample-runner.js --all');
    console.error('  e.g. node sample-runner.js basics');
    process.exit(1);
  }

  if (input === '--all') {
    const failures = [];

    for (const filePath of getAllSampleFiles()) {
      try {
        await generateSample(filePath);
      } catch (err) {
        failures.push({ filePath, err });
        console.error(`Failed: ${path.basename(filePath, '.pdfmk')}`);
        console.error(err);
      }
    }

    if (failures.length > 0) {
      console.error(`Finished with ${failures.length} failure(s).`);
      process.exit(1);
    }

    return;
  }

  const filePath = resolveFile(input);
  if (!filePath) {
    console.error(`Sample not found: ${input}`);
    process.exit(1);
  }

  try {
    await generateSample(filePath);
  } catch (err) {
    console.error('PDF generation failed:', err);
    process.exit(1);
  }
}

main();
