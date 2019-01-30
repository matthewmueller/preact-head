import { Component, cloneElement } from 'preact'

const META_TYPES = ['name', 'httpEquiv', 'charSet', 'itemProp']
const IS_BROWSER = typeof window !== 'undefined'
const MARKER = 'elmo-head'

const VALID_TYPES = {
  title: true,
  meta: true,
  base: true,
  link: true,
  style: true,
  script: true
}

const ATTR_MAP = {
  acceptCharset: 'accept-charset',
  className: 'class',
  htmlFor: 'for',
  httpEquiv: 'http-equiv'
}

// our mounted head components
// reset on each rewind
let HEAD_COMPONENTS = []

// only update on client-side
function update() {
  if (!IS_BROWSER) return
  updateClient(HEAD_COMPONENTS)
}

// client updates
function updateClient(headComponents) {
  const vnodes = flatten(headComponents)
  const buckets = {}

  // buckets the vnodes
  for (let i = 0; i < vnodes.length; i++) {
    const vnode = vnodes[i]
    const nodeName = vnode.nodeName
    if (typeof nodeName !== 'string') continue
    if (!VALID_TYPES[nodeName]) continue
    const bucket = buckets[nodeName] || []
    bucket.push(vnode)
    buckets[nodeName] = bucket
  }

  // only write the title once
  if (buckets.title) {
    syncTitle(buckets.title[0])
  }

  // sync the vnodes to the DOM
  for (let type in VALID_TYPES) {
    if (type === 'title') continue
    syncElements(type, buckets[type] || [])
  }
}

// Map an array of Head components into VDOM nodes
function flatten(headComponents) {
  let children = []

  for (let i = 0; i < headComponents.length; i++) {
    const head = headComponents[i]
    if (!head.props || !head.props.children) continue
    children = children.concat(head.props.children || [])
  }

  // TODO: look back at next.js to see why we
  // need to do this double reversal
  // TODO: less fancy
  children = children
    .reverse()
    .filter(uniqueHead())
    .reverse()

  const results = []
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    // strings are handled natively & pass functions through
    if (typeof child === 'string' || !('nodeName' in child)) {
      results.push(child)
      continue
    }
    // ignore invalid head tags
    if (!VALID_TYPES[child.nodeName]) {
      continue
    }

    // mark the classname
    const attrs = child.attributes || {}
    const className = attrs.className ? `${attrs.className} ${MARKER}` : MARKER
    results.push(cloneElement(child, { className }))
  }

  return results
}

// write the title to the DOM
function syncTitle(vnode) {
  const title = [].concat(vnode.children).join('')
  if (title !== document.title) document.title = title
}

// sync elements with the DOM
function syncElements(type, vnodes) {
  const headElement = document.getElementsByTagName('head')[0]
  const oldNodes = Array.prototype.slice.call(
    headElement.querySelectorAll(type + '.' + MARKER)
  )

  const newNodes = []
  for (let i = 0; i < vnodes.length; i++) {
    newNodes.push(vnodeToDOMNode(vnodes[i]))
  }

  // loop over old nodes looking for old nodes to delete
  const dels = []
  for (let i = 0; i < oldNodes.length; i++) {
    const oldNode = oldNodes[i]
    let found = false
    for (let j = 0; j < newNodes.length; j++) {
      if (oldNode.isEqualNode(newNodes[j])) {
        found = true
        break
      }
    }
    if (!found) {
      dels.push(oldNode)
    }
  }

  // loop over new nodes looking for new nodes to add
  const adds = []
  for (let i = 0; i < newNodes.length; i++) {
    const newNode = newNodes[i]
    let found = false
    for (let j = 0; j < oldNodes.length; j++) {
      if (newNode.isEqualNode(oldNodes[j])) {
        found = true
        break
      }
    }
    if (!found) {
      adds.push(newNode)
    }
  }

  // remove the old nodes
  for (let i = 0; i < dels.length; i++) {
    const node = dels[i]
    if (!node.parentNode) continue
    node.parentNode.removeChild(node)
  }

  // add the new nodes
  for (let i = 0; i < adds.length; i++) {
    const node = adds[i]
    headElement.appendChild(node)
  }
}

// vnodeToDOMNode converts a virtual node into a DOM node
function vnodeToDOMNode(vnode) {
  const el = document.createElement(vnode.nodeName)
  const attrs = vnode.attributes || {}
  const children = vnode.children
  for (const p in attrs) {
    if (!attrs.hasOwnProperty(p)) continue
    if (p === 'dangerouslySetInnerHTML') continue
    const attr = ATTR_MAP[p] || p.toLowerCase()
    el.setAttribute(attr, attrs[p])
  }
  if (attrs['dangerouslySetInnerHTML']) {
    el.innerHTML = attrs['dangerouslySetInnerHTML'].__html || ''
  } else if (children) {
    el.textContent = typeof children === 'string' ? children : children.join('')
  }
  return el
}

// All the heads are collected together
export default class Head extends Component {
  // server: this should get called before rewind
  // client: doesn't matter where it is really
  componentWillMount() {
    HEAD_COMPONENTS.push(this)
    update()
  }

  static rewind() {
    const children = flatten(HEAD_COMPONENTS)
    // resets the HEAD_COMPONENTS
    HEAD_COMPONENTS = []
    return children
  }

  static unique() {
    return uniqueHead
  }

  componentDidUpdate() {
    update()
  }

  componentWillUnmount() {
    const i = HEAD_COMPONENTS.indexOf(this)
    if (~i) HEAD_COMPONENTS.splice(i, 1)
    update()
  }

  render() {
    return null
  }
}

function uniqueHead() {
  const tags = []
  const metaTypes = []
  const metaCategories = {}
  return h => {
    switch (h.nodeName) {
      case 'title':
      case 'base':
        if (~tags.indexOf(h.nodeName)) return false
        tags.push(h.nodeName)
        break
      case 'meta':
        for (let i = 0, len = META_TYPES.length; i < len; i++) {
          const metatype = META_TYPES[i]
          if (!h.attributes.hasOwnProperty(metatype)) continue
          if (metatype === 'charSet') {
            if (~metaTypes.indexOf(metatype)) return false
            metaTypes.push(metatype)
          } else {
            const category = h.attributes[metatype]
            const categories = metaCategories[metatype] || []
            if (~categories.indexOf(category)) return false
            categories.push(category)
            metaCategories[metatype] = categories
          }
        }
        break
    }
    return true
  }
}
