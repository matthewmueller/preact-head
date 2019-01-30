const { Browser } = require('../misc/transpile')
const puppeteer = require('puppeteer')
const Deferred = require('deferral')
const express = require('express')
const pkgdir = require('pkg-dir')
const assert = require('assert')
const http = require('http')

const preact = require.resolve('preact/dist/preact.mjs')

// name, existing, vdom, expected
const tests = [
  ['empty', '<head></head>', `h(Head, {}, [])`, `<head></head>`],
  [
    'empty with title',
    '<head><title>hi</title></head>',
    `h(Head, {}, [])`,
    `<head><title>hi</title></head>`
  ],
  [
    'title',
    '<head></head>',
    `h(Head, {}, [ h('title', {}, ['my title']) ])`,
    `<head><title>my title</title></head>`
  ],
  [
    'existing title',
    '<head><title>hi</title></head>',
    `h(Head, {}, [ h('title', {}, ['my title']) ])`,
    `<head><title>my title</title></head>`
  ],
  [
    'meta',
    '<head></head>',
    `h(Head, {}, [ h('meta', { property:'og:title', content:'my title' }) ])`,
    `<head><meta property="og:title" content="my title" class="elmo-head"></head>`
  ],
  [
    'meta unchanged',
    '<head><meta property="og:title" content="my title" class="elmo-head"></head>',
    `h(Head, {}, [ h('meta', { property:'og:title', content:'my title' }) ])`,
    `<head><meta property="og:title" content="my title" class="elmo-head"></head>`
  ],
  [
    'meta changed',
    '<head><meta property="og:title" content="my title" class="elmo-head"></head>',
    `h(Head, {}, [ h('meta', { property:'og:title', content:'new title' }) ])`,
    `<head><meta property="og:title" content="new title" class="elmo-head"></head>`
  ],
  [
    'meta deleted',
    '<head><meta property="og:title" content="my title" class="elmo-head"></head>',
    `h(Head, {}, [])`,
    `<head></head>`
  ],
  [
    'divs are ignored',
    '<head></head>',
    `h(Head, {}, [h('div')])`,
    `<head></head>`
  ]
]

async function Server() {
  const app = express()
  const server = await new Promise((res, _rej) => {
    const s = http.createServer(app)
    s.listen(0, 'localhost', () => {
      res(s)
    })
  })

  const address = server.address()

  app.url = `http://${address.address}:${address.port}`
  app.close = () => new Promise((res, _rej) => server.close(res))
  return app
}

describe('Head', function() {
  let server
  let browser
  let code
  let page

  before(async function() {
    const pkgroot = await pkgdir(__filename)
    code = await Browser(pkgroot)
  })

  beforeEach(async () => {
    browser = await puppeteer.launch()
    page = await browser.newPage()
    server = await Server()
  })

  afterEach(async () => {
    await page.close()
    await browser.close()
    await server.close()
  })

  tests.forEach(test => {
    it(test[0], async () => {
      server.get('/preact', (_req, res) => res.sendFile(preact))
      server.get('/head', (_req, res) => res.type('js').send(code))
      server.get('/', (_req, res) => {
        res.send(`
          <html>
            ${test[1]}
            <body>
              <div id="harness"></div>
              <script type="module">
                import { h, render } from '/preact'
                import Head from '/head'
                const harness = document.getElementById("harness")
                render(${test[2]}, harness)
                if (harness.innerHTML !== '') {
                  throw new Error('harness expected to be empty')
                }
                console.log(document.head.outerHTML)
                console.log('done')
              </script>
            </body>
          </html>
        `)
      })
      const deferred = new Deferred()
      const logs = []
      page.on('error', err => {
        deferred.resolve(err)
      })
      page.on('pageerror', err => {
        deferred.resolve(err)
      })
      page.on('response', res => {
        const status = res.status()
        if (status === 200) return
        deferred.resolve(new Error(`${res.url()}: ${status}`))
      })
      page.on('console', msg => {
        const type = msg.type()
        const text = msg.text()
        if (type === 'log') {
          if (text === 'done') {
            deferred.resolve()
            return
          }
          logs.push(text)
          return
        }
        console.error(text)
      })
      await page.goto(server.url)
      const result = await deferred.wait()
      if (result instanceof Error) throw result
      assert.deepEqual(logs[0], test[3])
    })
  })
})
