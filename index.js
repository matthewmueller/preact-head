/* @jsx h */
import { h, render, Component, cloneElement } from 'preact'
import stringify from 'preact-render-to-string'

const DOMAttributeNames = {
  acceptCharset: 'accept-charset',
  className: 'class',
  htmlFor: 'for',
  httpEquiv: 'http-equiv'
}

const browser = typeof window !== 'undefined'
let mounted = []

function reducer(components) {
  return components
  .map(c => c.children)
  .filter((c) => !!c)
  .reduce((a, b) => a.concat(b), [])
  .reverse()
  .filter(unique())
  .reverse()
  .map((c) => {
    const className = (c.className ? c.className + ' ' : '') + 'next-head'
    return cloneElement(c, { className })
  })
}

function updateClient (head) {
  const tags = {}
  head.forEach((h) => {
    const components = tags[h.nodeName] || []
    components.push(h)
    tags[h.nodeName] = components
  })

  updateTitle(tags.title ? tags.title[0] : null)

  const types = ['meta', 'base', 'link', 'style', 'script']
  types.forEach((type) => {
    updateElements(type, tags[type] || [])
  })
}

function updateElements (type, components) {
  const headEl = document.getElementsByTagName('head')[0]
  const oldTags = Array.prototype.slice.call(headEl.querySelectorAll(type + '.next-head'))
  const newTags = components.map(domify).filter((newTag) => {
    for (let i = 0, len = oldTags.length; i < len; i++) {
      const oldTag = oldTags[i]
      if (oldTag.isEqualNode(newTag)) {
        oldTags.splice(i, 1)
        return false
      }
    }
    return true
  })
  
  oldTags.forEach((t) => t.parentNode.removeChild(t))
  newTags.forEach((t) => headEl.appendChild(t))
}

function domify (component) {
  const el = document.createElement(component.nodeName)
  const attrs = component.attributes || {}
  const children = component.children
  
  for (const p in attrs) {
    if (!attrs.hasOwnProperty(p)) continue
    if (p === 'dangerouslySetInnerHTML') continue

    const attr = DOMAttributeNames[p] || p.toLowerCase()
    el.setAttribute(attr, attrs[p])
  }

  if (attrs['dangerouslySetInnerHTML']) {
    el.innerHTML = attrs['dangerouslySetInnerHTML'].__html || ''
  } else if (children) {
    el.textContent = typeof children === 'string' ? children : children.join('')
  }

  return el
}

const METATYPES = ['name', 'httpEquiv', 'charSet', 'itemProp']

// returns a function for filtering head child elements
// which shouldn't be duplicated, like <title/>.
function unique () {
  const tags = []
  const metaTypes = []
  const metaCategories = {}
  return (h) => {
    switch (h.nodeName) {
      case 'title':
      case 'base':
        if (~tags.indexOf(h.nodeName)) return false
        tags.push(h.nodeName)
        break
      case 'meta':
        for (let i = 0, len = METATYPES.length; i < len; i++) {
          const metatype = METATYPES[i]
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

function updateTitle (component) {
  let title
    if (component) {
      const { children } = component
      title = typeof children === 'string' ? children : children.join('')
    } else {
      title = ''
    }
    if (title !== document.title) {
      document.title = title
    }
}

function update() {
  const state = reducer(mounted.map(mount => mount.props))
  if (browser) updateClient(state)
}

export default class Head extends Component {
  static rewind () {
    const state = reducer(mounted.map(mount => mount.props))
    mounted = []
    return state.map(stringify).join('')
  }

  componentDidUpdate() {
    update()
  }
  
  componentWillMount() {
    mounted.push(this)
    update()
  }
  
  componentWillUnmount() {
    const i = mounted.indexOf(this)
    mounted.splice(index, 1)
    update()
  }

  render() {
    return null
  }
}