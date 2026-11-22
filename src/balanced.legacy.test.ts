import { assert, describe, it } from 'vite-plus/test'
import { matcher } from './balanced.ts'

describe('All Balanced Legacy Tests', () => {
  describe('matcher', () => {
    it('matches the upstream balanced-match suite', () => {
      assert.deepEqual(matcher('{', '}')('pre{in{nest}}post'), { start: 3, end: 12, pre: 'pre', body: 'in{nest}', post: 'post' })
      assert.deepEqual(matcher('{', '}')('{{{{{{{{{in}post'), { start: 8, end: 11, pre: '{{{{{{{{', body: 'in', post: 'post' })
      assert.deepEqual(matcher('{', '}')('pre{body{in}post'), { start: 8, end: 11, pre: 'pre{body', body: 'in', post: 'post' })
      assert.deepEqual(matcher('{', '}')('pre{in}po}st'), { start: 3, end: 6, pre: 'pre', body: 'in', post: 'po}st' })
      assert.deepEqual(matcher('{', '}')('pre}{in{nest}}post'), { start: 4, end: 13, pre: 'pre}', body: 'in{nest}', post: 'post' })
      assert.deepEqual(matcher('{', '}')('pre{body}between{body2}post'), { start: 3, end: 8, pre: 'pre', body: 'body', post: 'between{body2}post' })
      assert.deepEqual(matcher('<b>', '</b>')('pre<b>in<b>nest</b></b>post'), { start: 3, end: 19, pre: 'pre', body: 'in<b>nest</b>', post: 'post' })
      assert.deepEqual(matcher('<b>', '</b>')('pre</b><b>in<b>nest</b></b>post'), { start: 7, end: 23, pre: 'pre</b>', body: 'in<b>nest</b>', post: 'post' })
      assert.deepEqual(matcher('{{', '}}')('pre{{{in}}}post'), { start: 3, end: 9, pre: 'pre', body: '{in}', post: 'post' })
      assert.deepEqual(matcher('{{{', '}}')('pre{{{in}}}post'), { start: 3, end: 8, pre: 'pre', body: 'in', post: '}post' })
      assert.deepEqual(matcher('{', '}')('pre{{first}in{second}post'), { start: 4, end: 10, pre: 'pre{', body: 'first', post: 'in{second}post' })
      assert.deepEqual(matcher('<?', '?>')('pre<?>post'), { start: 3, end: 4, pre: 'pre', body: '', post: 'post' })
      assert.deepEqual(matcher('___', '___')('PRE ___BODY___ POST'), { start: 4, end: 11, pre: 'PRE ', body: 'BODY', post: ' POST' })

      // @ts-expect-error: upstream passes null delimiters to check they match nothing.
      assert.strictEqual(matcher(null, null)('nope'), undefined)
      assert.strictEqual(matcher('{', '}')('nope'), undefined)
      assert.strictEqual(matcher('{', '}')('{nope'), undefined)
      assert.strictEqual(matcher('{', '}')('nope}'), undefined)
      assert.strictEqual(matcher(/\{/, /\}/)('nope'), undefined)
      assert.strictEqual(matcher(/\{/, '}')('no opening}'), undefined)
      assert.strictEqual(matcher('{', /\}/)('{no closing'), undefined)

      assert.deepEqual(matcher(/\s+\{\s+/, /\s+\}\s+/)('pre  {   in{nest}   }  post'), { start: 3, end: 17, pre: 'pre', body: 'in{nest}', post: 'post' })
    })
  })
})
