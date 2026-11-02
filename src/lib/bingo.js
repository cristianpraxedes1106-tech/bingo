export const LETTERS = ["B", "I", "N", "G", "O"];

export function createCard() {
  const columns = [
    range(1, 15),
    range(16, 30),
    range(31, 45),
    range(46, 60),
    range(61, 75)
  ];
  const selectedColumns = columns.map((column) => shuffle(column).slice(0, 5));
  const card = Array.from({ length: 5 }, (_, row) =>
    selectedColumns.map((column) => column[row])
  );
  card[2][2] = "★";
  return card;
}

export function createDrawPool() {
  return Array.from({ length: 75 }, (_, index) => index + 1);
}

export function getLetter(number) {
  if (number <= 15) return "B";
  if (number <= 30) return "I";
  if (number <= 45) return "N";
  if (number <= 60) return "G";
  return "O";
}

export function drawNumber(pool) {
  if (!pool.length) return null;
  const index = Math.floor(Math.random() * pool.length);
  return pool.splice(index, 1)[0];
}

export function hasBingo(card, calledNumbers, mode = "line") {
  const marked = (value) => value === "★" || calledNumbers.includes(value);
  const rows = card.map((row) => row.every(marked));
  const columns = card[0].map((_, col) => card.every((row) => marked(row[col])));
  const diagonals = [
    card.every((row, index) => marked(row[index])),
    card.every((row, index) => marked(row[4 - index]))
  ];
  const corners = [card[0][0], card[0][4], card[4][0], card[4][4]].every(marked);

  if (mode === "full") return card.flat().every(marked);
  if (mode === "column") return columns.some(Boolean);
  if (mode === "diagonal") return diagonals.some(Boolean);
  if (mode === "corners") return corners;
  return rows.some(Boolean);
}

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function shuffle(values) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}
