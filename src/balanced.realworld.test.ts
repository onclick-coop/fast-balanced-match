import { assert, describe, it } from 'vite-plus/test'
import { matcher } from './balanced.ts'

describe('All Balanced Real World Tests', () => {
  describe('matcher', () => {
    it('finds the alternatives of a glob brace expansion', () => {
      // Act
      const result = matcher('{', '}')('src/{components,utils}/**/*.ts')

      // Assert
      assert.deepEqual(result, { start: 4, end: 21, pre: 'src/', body: 'components,utils', post: '/**/*.ts' })
    })

    it('keeps a nested brace expansion inside its outer group', () => {
      // Act
      const result = matcher('{', '}')('a{b,{c,d}}e')

      // Assert
      assert.deepEqual(result, { start: 1, end: 9, pre: 'a', body: 'b,{c,d}', post: 'e' })
    })

    it('finds a mustache template variable', () => {
      // Act
      const result = matcher('{{', '}}')('Hello {{user.name}}!')

      // Assert
      assert.deepEqual(result, { start: 6, end: 17, pre: 'Hello ', body: 'user.name', post: '!' })
    })

    it('matches an outer html element around a nested one of the same tag', () => {
      // Act
      const result = matcher('<div>', '</div>')('<div><div>inner</div></div><p>')

      // Assert
      assert.deepEqual(result, { start: 0, end: 21, pre: '', body: '<div>inner</div>', post: '<p>' })
    })

    it('finds the arguments of a function call holding a nested call', () => {
      // Act
      const result = matcher('(', ')')('sum(a, max(b, c)) + 1')

      // Assert
      assert.deepEqual(result, { start: 3, end: 16, pre: 'sum', body: 'a, max(b, c)', post: ' + 1' })
    })

    it('finds the body of a latex environment', () => {
      // Act
      const result = matcher('\\begin{itemize}', '\\end{itemize}')('\\begin{itemize}\\item a\\end{itemize}')

      // Assert
      assert.deepEqual(result, { start: 0, end: 22, pre: '', body: '\\item a', post: '' })
    })

    it('finds a markdown code fence by its identical delimiters', () => {
      // Act
      const result = matcher('```', '```')('text\n```js\nconst x = 1\n```\nmore')

      // Assert
      assert.deepEqual(result, { start: 5, end: 23, pre: 'text\n', body: 'js\nconst x = 1\n', post: '\nmore' })
    })

    it('finds a shell command substitution', () => {
      // Act
      const result = matcher('$(', ')')('echo $(date +%Y)')

      // Assert
      assert.deepEqual(result, { start: 5, end: 15, pre: 'echo ', body: 'date +%Y', post: '' })
    })

    it('finds the innermost closed block of source code missing its last closing brace', () => {
      // Act
      const result = matcher('{', '}')('function f() { if (x) { return 1 }')

      // Assert
      assert.deepEqual(result, { start: 22, end: 33, pre: 'function f() { if (x) ', body: ' return 1 ', post: '' })
    })

    it('finds the first array in a json document', () => {
      // Act
      const result = matcher('[', ']')('{"tags":["a","b"],"n":[1]}')

      // Assert
      assert.deepEqual(result, { start: 8, end: 16, pre: '{"tags":', body: '"a","b"', post: ',"n":[1]}' })
    })
  })
})
