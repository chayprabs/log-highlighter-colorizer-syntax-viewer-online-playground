import { highlightLog } from './lib/highlighter'

const BLUE = 'color: #2aa1d3';
const GREEN = 'color: #6eb56c';
const MAGENTA = 'color: #c51e8a';
const CYAN = 'color: #36c4c4';

const result = highlightLog('https://api.example.com/v1/users?page=1');
console.log('Result:', result);
console.log('Contains BLUE?', result.includes(BLUE));
console.log('Contains GREEN?', result.includes(GREEN));
console.log('Contains MAGENTA?', result.includes(MAGENTA));
console.log('Contains CYAN?', result.includes(CYAN));
