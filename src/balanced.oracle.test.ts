import { assert, describe, it } from 'vite-plus/test'
import { matcher } from './balanced.ts'

type Range = undefined | [number, number]

// The straightforward walk the matcher replaced, keeping every unclosed opening on a stack, which states the rules most plainly.
const stackRange = (a: string, b: string, str: string): Range => {
  let ai = str.indexOf(a)
  if (a === b) {
    const next = str.indexOf(b, ai + 1)
    if (next === -1) return undefined

    return [ai, next]
  }

  let bi = str.indexOf(b, ai)
  const begs: number[] = []
  let depth = Infinity
  let best: Range
  let i = ai

  while (i >= 0) {
    if (i === ai && (i !== bi || a.length > b.length)) {
      begs.push(i)
      ai = str.indexOf(a, i + 1)
      if (bi === i) bi = str.indexOf(b, i + 1)
    } else {
      if (ai === i) ai = str.indexOf(a, i + 1)

      const beg = begs.pop()
      if (beg !== undefined) {
        if (!begs.length) return [beg, bi]

        if (begs.length < depth) {
          depth = begs.length
          best = [beg, bi]
        }
      }

      bi = str.indexOf(b, i + 1)
    }

    i = ai === -1 ? bi : Math.min(ai, bi)
  }

  return best
}

const pairs: [string, string][] = [
  ['{', '}'],
  ['<', '</'],
  ['</', '<'],
  ['aa', 'a'],
  ['a', 'aa'],
  ['ab', 'ba'],
  ['<b>', '</b>'],
  ['{{', '}}'],
  ['{{{', '}}'],
  ['<?', '?>'],
  ['(', ')'],
  ['a', 'a'],
  ['ab', 'ab'],
]

const alphabet = ['{', '}', '<', '/', 'a', 'b', '>', '?', '(', ')', 'x']

// A fixed seed makes every run check the same inputs, so a failure reproduces.
const randomFrom = (seed: number): ((n: number) => number) => {
  let state = seed

  return (n) => {
    state = (state * 1103515245 + 12345) % 2147483648

    return state % n
  }
}

describe('All Balanced Oracle Tests', () => {
  describe('matcher', () => {
    it('matches the stack-based walk on 400,000 seeded random strings over overlapping and identical delimiter pairs', () => {
      // Arrange
      const random = randomFrom(1)
      const matchers = pairs.map(([a, b]) => ({ a, b, match: matcher(a, b) }))

      // Act & Assert
      for (let round = 0; round < 400_000; round++) {
        const { a, b, match } = matchers[random(matchers.length)] ?? { a: '{', b: '}', match: matcher('{', '}') }
        const length = random(round % 4 ? 24 : 120)
        let str = ''
        for (let i = 0; i < length; i++) str += alphabet[random(alphabet.length)]

        const found = match(str)
        assert.deepEqual(found && [found.start, found.end], stackRange(a, b, str), JSON.stringify([a, b, str]))
      }
    })
  })
})
