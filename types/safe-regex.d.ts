/** Minimal typings — package ships without `.d.ts` (CI runs `tsc --noEmit`). */
declare module 'safe-regex' {
  function safeRegex(re: RegExp | string): boolean
  export default safeRegex
}
