import { assert, describe, it } from 'vite-plus/test'
import { matcher } from './balanced.ts'

describe('All Balanced Tests', () => {
  describe('matcher', () => {
    it('an empty closing delimiter never matches', () => {
      // Act
      const result = matcher('{', '')('{a')

      // Assert
      assert.strictEqual(result, undefined)
    })

    it('one matcher answers each string it is given', () => {
      // Arrange
      const braces = matcher('{', '}')

      // Act
      const first = braces('a{b}c')
      const second = braces('{x}')

      // Assert
      assert.deepEqual(first, { start: 1, end: 3, pre: 'a', body: 'b', post: 'c' })
      assert.deepEqual(second, { start: 0, end: 2, pre: '', body: 'x', post: '' })
    })

    it('the outermost pair wins over a nested one', () => {
      // Act
      const result = matcher('{', '}')('pre{in{nest}}post')

      // Assert
      assert.deepEqual(result, { start: 3, end: 12, pre: 'pre', body: 'in{nest}', post: 'post' })
    })

    it('an unclosed opening before a pair is left in pre', () => {
      // Act
      const result = matcher('{', '}')('pre{body{in}post')

      // Assert
      assert.deepEqual(result, { start: 8, end: 11, pre: 'pre{body', body: 'in', post: 'post' })
    })

    it('only the first of two sibling pairs is matched', () => {
      // Act
      const result = matcher('{', '}')('pre{body}between{body2}post')

      // Assert
      assert.deepEqual(result, { start: 3, end: 8, pre: 'pre', body: 'body', post: 'between{body2}post' })
    })

    it('a pair at the very start closes at its first closing, delimiters matching literally and a stray closing left in post', () => {
      // Act
      const result = matcher('(', ')')('()po)st')

      // Assert
      assert.deepEqual(result, { start: 0, end: 1, pre: '', body: '', post: 'po)st' })
    })

    it('under an unclosed opening the first closed pair wins over a later sibling', () => {
      // Act
      const result = matcher('{', '}')('pre{{first}in{second}post')

      // Assert
      assert.deepEqual(result, { start: 4, end: 10, pre: 'pre{', body: 'first', post: 'in{second}post' })
    })

    it('an unclosed opening early in a gapped run of openings pairs at the shallowest depth', () => {
      // Act
      const result = matcher('{', '}')('{x{x{x{a}}}')

      // Assert
      assert.deepEqual(result, { start: 2, end: 10, pre: '{x', body: 'x{x{a}}', post: '' })
    })

    it('an unclosed opening late in a gapped run of openings pairs at the shallowest depth', () => {
      // Act
      const result = matcher('{', '}')('{x{x{x{x{a}}')

      // Assert
      assert.deepEqual(result, { start: 6, end: 11, pre: '{x{x{x', body: 'x{a}', post: '' })
    })

    it('an unclosed opening early in a run of openings pairs at the shallowest depth', () => {
      // Act
      const result = matcher('{', '}')('{{{{a}}}')

      // Assert
      assert.deepEqual(result, { start: 1, end: 7, pre: '{', body: '{{a}}', post: '' })
    })

    it('an unclosed opening late in a run of openings pairs at the shallowest depth', () => {
      // Act
      const result = matcher('{', '}')('{{{{{a}}')

      // Assert
      assert.deepEqual(result, { start: 3, end: 7, pre: '{{{', body: '{a}', post: '' })
    })

    it('identical delimiters pair the first two occurrences', () => {
      // Act
      const result = matcher('___', '___')('PRE ___BODY___ POST')

      // Assert
      assert.deepEqual(result, { start: 4, end: 11, pre: 'PRE ', body: 'BODY', post: ' POST' })
    })

    it('identical delimiters occurring once find no pair', () => {
      // Act
      const result = matcher('___', '___')('PRE ___BODY')

      // Assert
      assert.strictEqual(result, undefined)
    })

    it('a closing before any opening finds no pair', () => {
      // Act
      const result = matcher('{', '}')('nope}')

      // Assert
      assert.strictEqual(result, undefined)
    })

    it('a closing that starts with the opening is a closing, not a new opening', () => {
      // Act
      const result = matcher('<', '</')('<a<b</c</d')

      // Assert
      assert.deepEqual(result, { start: 0, end: 7, pre: '', body: 'a<b</c', post: 'd' })
    })

    it('a stray closing before an opening that starts with the closing pairs with nothing', () => {
      // Act
      const result = matcher('</', '<')('<a</b<')

      // Assert
      assert.deepEqual(result, { start: 2, end: 5, pre: '<a', body: 'b', post: '' })
    })

    it('a stray closing at the start that begins with the opening pairs with nothing', () => {
      // Act
      const result = matcher('<', '</')('</a<b</c')

      // Assert
      assert.deepEqual(result, { start: 3, end: 5, pre: '</a', body: 'b', post: 'c' })
    })

    it('a regex that matches only empty text finds no pair', () => {
      // Act
      const result = matcher(/x*/, '}')('{a}')

      // Assert
      assert.strictEqual(result, undefined)
    })

    it('an empty string delimiter finds no pair', () => {
      // Act
      const result = matcher('', '}')('{a}')

      // Assert
      assert.strictEqual(result, undefined)
    })

    it('an empty string holds no pair', () => {
      // Act
      const result = matcher('{', '}')('')

      // Assert
      assert.strictEqual(result, undefined)
    })

    it('regex delimiters match by their first match', () => {
      // Act
      const result = matcher(/\s+\{\s+/, /\s+\}\s+/)('pre  {   in{nest}   }  post')

      // Assert
      assert.deepEqual(result, { start: 3, end: 17, pre: 'pre', body: 'in{nest}', post: 'post' })
    })

    it('an opening regex that matches nothing finds no pair', () => {
      // Act
      const result = matcher(/\{/, '}')('true}')

      // Assert
      assert.strictEqual(result, undefined)
    })

    it('a closing regex that matches nothing finds no pair', () => {
      // Act
      const result = matcher('{', /\}/)('{true')

      // Assert
      assert.strictEqual(result, undefined)
    })
  })
})
