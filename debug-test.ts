import { highlightLog } from './lib/highlighter'

console.log('=== URL Test ===')
console.log(highlightLog('https://api.example.com/v1/users?page=1'))

console.log('\n=== JSON Array Test ===')
console.log(highlightLog('["first", "second"]'))

console.log('\n=== Non-JSON Test ===')
console.log(highlightLog('This is not JSON: {"key"}'))

console.log('\n=== Nginx URL Test ===')
console.log(highlightLog('"GET /api/v1/users HTTP/1.1"'))
