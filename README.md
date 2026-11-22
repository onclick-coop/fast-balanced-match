# @onclick/fast-balanced-match

[![Release](https://github.com/onclick-coop/fast-balanced-match/actions/workflows/release.yaml/badge.svg)](https://github.com/onclick-coop/fast-balanced-match/actions/workflows/release.yaml)
[![npm](https://img.shields.io/npm/v/@onclick/fast-balanced-match)](https://www.npmjs.com/package/@onclick/fast-balanced-match)
[![JSR](https://jsr.io/badges/@onclick/fast-balanced-match)](https://jsr.io/@onclick/fast-balanced-match)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Match balanced string pairs, like `{` and `}` or `<b>` and `</b>`. Supports regular expressions as well!

A faster take on [`balanced-match`](https://github.com/juliangruber/balanced-match): the same results, about half the memory, and a few edge cases fixed.

<img src="https://raw.githubusercontent.com/onclick-coop/fast-balanced-match-bench/main/results.svg" width="100%" alt="Time and memory per workload, fast-balanced-match compared with balanced-match">

## Install

```sh
npm install @onclick/fast-balanced-match
jsr add @onclick/fast-balanced-match
```

Published on [npm](https://www.npmjs.com/package/@onclick/fast-balanced-match) and [JSR](https://jsr.io/@onclick/fast-balanced-match), as ESM and CommonJS with types, for Node, Deno, Bun, Workers and browsers.

## Example

```js
import { matcher } from '@onclick/fast-balanced-match'

const braces = matcher('{', '}')

braces('pre{in{nested}}post')
// { start: 3, end: 14, pre: 'pre', body: 'in{nested}', post: 'post' }

braces('pre{first}between{second}post')
// { start: 3, end: 9, pre: 'pre', body: 'first', post: 'between{second}post' }

matcher(/\s+\{\s+/, /\s+\}\s+/)('pre  {   in{nest}   }  post')
// { start: 3, end: 17, pre: 'pre', body: 'in{nest}', post: 'post' }
```

## API

### const match = matcher(a, b)

Returns a function that finds pairs of `a` and `b`, each a string or a regular expression.
Build it once per pair and reuse it, since it settles how to scan when built.

A regular expression finds its first match in each string, and that text is paired from the start of the string, so `matcher(/(?<=x)\{/, '}')('{a}x{b}')` pairs the `{` at 0.

### const m = match(str)

For the first non-nested matching pair in `str`, returns an object with these keys, or `undefined` when there is none:

- **start** the index of the opening
- **end** the index of the matching closing
- **pre** the text before the opening
- **body** the text between them
- **post** the text after the closing

If `str` has more openings than closings, the first closed pair is used, so `{{a}` gives `'a'`.

## Coming from balanced-match

```js
// balanced-match
balanced('{', '}', str)

// fast-balanced-match
const braces = matcher('{', '}')
braces(str)
```

The result has the same shape, and `range(a, b, str)` is the result's `start` and `end`.

## Results compared with balanced-match

It returns the same result for every input in `balanced-match`'s own tests, and differs only here.

**Overlapping delimiters**

- Where an opening and a closing start at the same place, the longer one wins.
- `matcher('<', '</')('<a</b')` gives `'a'`, where `balanced-match` also counts `</` as an opening.

**Sticky and global regexes**

- They match from the same place, but through a copy, so the caller's `lastIndex` never moves.
- A global or sticky `RegExp` subclass that overrides `Symbol.match` loses that override.

**Regexes from another realm**

- A regex made in an iframe or a Node `vm` context works, where `balanced-match` treats it as a string.

**Empty delimiters**

- A matcher with an empty delimiter never matches, where `balanced-match` returns a meaningless pair.

## Performance

On an Apple M2 with Node 26, it runs 30% faster on short input, 12% faster on everyday input, and 4 to 7 times faster on deeply nested or unclosed input, and ties on regex delimiters.
It allocates about half as much on everyday input and almost nothing on nested or unclosed input.

[`fast-balanced-match-bench`](https://github.com/onclick-coop/fast-balanced-match-bench) has the workloads and full results.

## Testing

```sh
vp run test
```

The suite includes [`balanced-match`'s v5.0.0 tests](https://github.com/juliangruber/balanced-match/blob/v5.0.0/test/test.ts) with the same inputs and expected outputs.
It also checks every result against a plain stack-based walk on 400,000 seeded random strings.

## License

[MIT](LICENSE), the same license as `balanced-match`.

- Original code copyright [Julian Gruber](https://github.com/juliangruber), author of `balanced-match`
- Port to TypeScript copyright [Isaac Z. Schlueter](https://github.com/isaacs)
- Modifications copyright 2026 Onclick LLC
