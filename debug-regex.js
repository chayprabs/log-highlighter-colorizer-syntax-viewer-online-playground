const pattern = /"([^"]+)"(?=\s*:)/g;
const str = '["first", "second"]';

let match;
while ((match = pattern.exec(str)) !== null) {
  console.log('Match:', match[0], 'at index', match.index);
}
console.log('Matches found:', str.match(pattern));
