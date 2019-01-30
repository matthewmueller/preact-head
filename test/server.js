const renderToString = require('preact-render-to-string')
const { Node } = require('../misc/transpile')
const pkgdir = require('pkg-dir')
const { join } = require('path')
const assert = require('assert')
const { h } = require('preact')

// TODO: script tests
// TODO: style tests

// [name, input, html output, expected vnodes after rewinding]
const tests = [
  ['empty', Head => h(Head), ``, []],
  [
    'title',
    Head => h(Head, {}, [h('title', {}, 'hi')]),
    ``,
    [h('title', { className: 'elmo-head' }, 'hi')]
  ],
  [
    '2 titles pick last',
    Head => h(Head, {}, [h('title', {}, 'hi'), h('title', {}, 'cool')]),
    ``,
    [h('title', { className: 'elmo-head' }, 'cool')]
  ],
  [
    'meta',
    Head => h(Head, {}, [h('meta', { property: 'hi', value: 'cool' })]),
    ``,
    [h('meta', { className: 'elmo-head', property: 'hi', value: 'cool' })]
  ],
  [
    'title + meta',
    Head =>
      h(Head, {}, [
        h('title', {}, 'hi'),
        h('meta', { property: 'hi', value: 'cool' })
      ]),
    ``,
    [
      h('title', { className: 'elmo-head' }, 'hi'),
      h('meta', { className: 'elmo-head', property: 'hi', value: 'cool' })
    ]
  ],
  ['divs are ignored', Head => h(Head, {}, [h('div', {}, 'hi')]), ``, []]
]

// evaluate for node.js
function evaluate(code) {
  const exports = {}
  const module = { exports }
  eval(code)
  return module.exports
}

describe('head', () => {
  let Head

  before(async function() {
    const pkgroot = await pkgdir(__filename)
    const code = await Node(join(pkgroot, 'index.js'))
    Head = evaluate(code)
  })

  tests.forEach(test => {
    it(test[0], () => {
      const result = renderToString(test[1](Head))
      assert.equal(result, test[2])
      const vnodes = Head.rewind()
      assert.deepEqual(vnodes, test[3])
    })
  })
})
