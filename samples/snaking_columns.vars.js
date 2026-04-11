const LOREM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ';

function range(n) {
  return Array.from({ length: n }, (_, i) => i);
}

module.exports = {
  loremShort: LOREM.repeat(10),
  lineCount: range(80),
  textNodeCount: range(30),
  cardCount: range(25),
  tableRowCount: range(50),
};
