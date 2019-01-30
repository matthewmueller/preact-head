const nodeResolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const json = require('rollup-plugin-json')
const builtins = require('builtins')
const { writeFile } = require('mz/fs')
const pkgdir = require('pkg-dir')
const rollup = require('rollup')
const { join } = require('path')
const del = require('del')

// case-by-case externals
const manual = [
  'styled-jsx-preact/server',
  'styled-jsx-preact/style',
  'mz/fs',
  'elmo'
]

exports.Package = Package
async function Package(path) {
  const pkgroot = await pkgdir(path)
  const server = await Node(join(pkgroot, 'index.js'))
  await writeFile(join(pkgroot, 'server.js'), server)
  const browser = await Browser(join(pkgroot, 'index.js'), ['preact'])
  await writeFile(join(pkgroot, 'browser.js'), browser)
}

exports.Browser = Browser
async function Browser(input, externals = []) {
  const bundle = await rollup.rollup({
    input: input,
    external: externals,
    plugins: [
      nodeResolve({
        module: true,
        jsnext: true,
        browser: true
      }),
      json()
    ]
  })
  const result = await bundle.generate({ format: 'es' })
  return result.output[0].code
}

exports.Node = Node
async function Node(input) {
  const pkgroot = await pkgdir(input)
  const pkg = require(join(pkgroot, 'package.json'))

  const external = []
    .concat(builtins())
    .concat(Object.keys(pkg.dependencies || {}))
    .concat(Object.keys(pkg.devDependencies || {}))
    .concat(Object.keys(pkg.peerDependencies || {}))
    .concat(manual)

  const bundle = await rollup.rollup({
    input: input,
    external,
    plugins: [
      nodeResolve({
        module: true,
        jsnext: true,
        browser: false,
        only: [/^\.{0,2}\//]
      }),
      commonjs({
        // use a regex to make sure to include eventual hoisted packages
        include: /\/node_modules\//
      }),
      json()
    ]
  })

  const result = await bundle.generate({ format: 'cjs' })
  return result.output[0].code
}
