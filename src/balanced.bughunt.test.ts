import { runInNewContext } from 'node:vm'
import { assert, describe, it } from 'vite-plus/test'
import { matcher } from './balanced.ts'

describe('All Balanced Bug Hunt Tests', () => {
  describe('matcher', () => {
    it('treats a closing that starts with the opening as a closing, not a new opening', () => {
      // Act
      const result = matcher('<', '</')('<a</b')

      // Assert
      assert.deepEqual(result, { start: 0, end: 2, pre: '', body: 'a', post: 'b' })
    })

    it('treats a closing that starts with the opening as a closing inside nesting', () => {
      // Act
      const result = matcher('<', '</')('<a<b</c</d')

      // Assert
      assert.deepEqual(result, { start: 0, end: 7, pre: '', body: 'a<b</c', post: 'd' })
    })

    it('skips a stray closing that starts with the opening at the very start', () => {
      // Act
      const result = matcher('<', '</')('</a<b</c')

      // Assert
      assert.deepEqual(result, { start: 3, end: 5, pre: '</a', body: 'b', post: 'c' })
    })

    it('finds no pair when every opening is the start of a closing', () => {
      // Act
      const result = matcher('<', '</')('</a</b')

      // Assert
      assert.strictEqual(result, undefined)
    })

    it('reads a run of a delimiter overlapping itself one position at a time, the longer one winning each', () => {
      // Act
      const result = matcher('aa', 'a')('aaa')

      // Assert
      assert.deepEqual(result, { start: 1, end: 2, pre: 'a', body: '', post: '' })
    })

    it('pairs delimiters that overlap each other end to start', () => {
      // Act
      const result = matcher('ab', 'ba')('aba')

      // Assert
      assert.deepEqual(result, { start: 0, end: 1, pre: '', body: '', post: '' })
    })

    it('treats an opening that starts with the closing as an opening', () => {
      // Act
      const result = matcher('</', '<')('</a<')

      // Assert
      assert.deepEqual(result, { start: 0, end: 3, pre: '', body: 'a', post: '' })
    })

    it('gives the same answer for a sticky regex on every call', () => {
      // Arrange
      const opening = /\{/y

      // Act
      const first = matcher(opening, '}')('{a}')
      const second = matcher(opening, '}')('{a}')

      // Assert
      assert.deepEqual(first, { start: 0, end: 2, pre: '', body: 'a', post: '' })
      assert.deepEqual(second, first)
      assert.strictEqual(opening.lastIndex, 0)
    })

    it("starts a sticky regex where the caller's lastIndex stands, without moving it", () => {
      // Arrange
      const opening = /\{/y
      opening.lastIndex = 1

      // Act
      const result = matcher(opening, '}')('x{a}')

      // Assert
      assert.deepEqual(result, { start: 1, end: 3, pre: 'x', body: 'a', post: '' })
      assert.strictEqual(opening.lastIndex, 1)
    })

    it('recognizes a regex made in another realm', () => {
      // Arrange
      const opening: RegExp = runInNewContext('/a/')

      // Act
      const result = matcher(opening, 'b')('ab')

      // Assert
      assert.deepEqual(result, { start: 0, end: 1, pre: '', body: '', post: '' })
    })

    it("leaves a global regex's lastIndex as the caller set it", () => {
      // Arrange
      const opening = /\{/g
      opening.lastIndex = 2

      // Act
      const result = matcher(opening, '}')('{a}')

      // Assert
      assert.deepEqual(result, { start: 0, end: 2, pre: '', body: 'a', post: '' })
      assert.strictEqual(opening.lastIndex, 2)
    })

    it('finds no pair when a regex delimiter matches only empty text', () => {
      // Act
      const result = matcher(/x*/, '}')('{a}')

      // Assert
      assert.strictEqual(result, undefined)
    })

    it('pairs a regex delimiter that can match empty text when it matches real text', () => {
      // Act
      const result = matcher(/\{*/, '}')('{a}')

      // Assert
      assert.deepEqual(result, { start: 0, end: 2, pre: '', body: 'a', post: '' })
    })

    it('pairs delimiters made of surrogate pairs', () => {
      // Act
      const result = matcher('\u{1F600}', '\u{1F601}')('a\u{1F600}b\u{1F601}c')

      // Assert
      assert.deepEqual(result, { start: 1, end: 4, pre: 'a', body: 'b', post: 'c' })
    })

    it('pairs nul and control character delimiters', () => {
      // Act
      const result = matcher('\0', '\u0001')('a\0b\u0001')

      // Assert
      assert.deepEqual(result, { start: 1, end: 3, pre: 'a', body: 'b', post: '' })
    })

    it('matches nesting a hundred thousand deep without overflowing the stack', () => {
      // Arrange
      const deep = '{'.repeat(100_000) + '}'.repeat(100_000)

      // Act
      const result = matcher('{', '}')(deep)

      // Assert
      assert.strictEqual(result?.start, 0)
      assert.strictEqual(result?.end, 199_999)
    })

    it('finds the one closed pair under a hundred thousand unclosed openings', () => {
      // Arrange
      const unclosed = '{'.repeat(100_000) + 'x}'

      // Act
      const result = matcher('{', '}')(unclosed)

      // Assert
      assert.strictEqual(result?.start, 99_999)
      assert.strictEqual(result?.body, 'x')
    })
  })
})
