const line = '["first", "second"]';

// Find quote positions
const quotePositions = [];
for (let i = 0; i < line.length; i++) {
  if (line[i] === '"') {
    quotePositions.push(i);
    console.log('Quote at position', i);
  }
}

console.log('Quote positions:', quotePositions);
console.log('Even number?', quotePositions.length % 2 === 0);
