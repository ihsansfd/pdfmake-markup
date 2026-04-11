const files = [
  {
    label: 'pdfmake README',
    name: 'README.md',
    src: 'https://raw.githubusercontent.com/bpampuch/pdfmake/master/README.md',
    description: 'Canonical pdfmake documentation.',
  },
  {
    label: 'License file',
    name: 'LICENSE',
    src: 'https://raw.githubusercontent.com/bpampuch/pdfmake/master/LICENSE',
    description: null,
  },
];

const attachmentMap = {};
for (const f of files) {
  attachmentMap[f.name] = { src: f.src, name: f.name };
}

module.exports = { files, attachmentMap };
