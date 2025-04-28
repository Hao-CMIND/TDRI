export const ready = ['ready', function (cb) {
  const isReady = this.some(e => e.readyState !== null && e.readyState !== 'loading')
  if (isReady) {
    cb()
  } else {
    this.one('DOMContentLoaded', cb)
  }
  return this
}]

export const on = ['on', function (event, cbOrSelector, cbOrCapture, capture) {
  const events = event.split(' ')
  events.forEach(evt => {
    this.forEach(el => {
      if (typeof cbOrSelector === 'function') {
        el.addEventListener(evt, cbOrSelector, cbOrCapture)
      } else {
        el.addEventListener(evt, function (e) {
          if (e.target.matches(cbOrSelector)) {
            cbOrCapture.bind(this)(e)
          }
        },
        capture
        )
      }
    })
  })
  return this
}]

export const one = ['one', function (event, cbOrSelector, cbOrCapture) {
  this.on(event, cbOrSelector, cbOrCapture, { once: true })
  return this
}]

export const off = ['off', function (event, cbOrSelector, cb) {
  if (typeof cbOrSelector === 'function') {
    this.forEach(e => e.removeEventListener(event, cbOrSelector))
  } else {
    this.forEach(el => {
      el.removeEventListener(event, e => {
        if (e.target.matches(cbOrSelector)) {
          cb(e)
        }
      })
    })
  }
  return this
}]

export const trigger = ['trigger', function (evt) {
  this.forEach((e) => {
    if (typeof evt === 'string' && typeof e[evt] === 'function') {
      e[evt]()
      return
    }
    e.dispatchEvent(new Event(evt))
  })
  return this
}]

export const removeClass = ['removeClass', function (classNames) {
  this.changeClass('remove', classNames)
  return this
}]

export const addClass = ['addClass', function (classNames) {
  this.changeClass('add', classNames)
  return this
}]

export const toggleClass = ['toggleClass', function (className, force) {
  return this.map(el => {
    el.classList.toggle(className, force)
    return el
  })
}]

export const hasClass = ['hasClass', function (className) {
  if (!this.length) return this
  return this[0].classList.contains(className)
}]

export const next = ['next', function () {
  return this.map(e => e.nextElementSibling).filter(e => e)
}]

export const nextAll = ['nextAll', function (selector = '', el = $()) {
  if (this.length) {
    return this.next().nextAll(selector, el.concat(this.next()))
  }

  if (selector) {
    return this.filterEl(el, selector)
  }

  return this.noReapted(el)
}]

export const prev = ['prev', function () {
  return this.map(e => e.previousElementSibling).filter(e => e)
}]

export const prevAll = ['prevAll', function (selector = '', el = $()) {
  if (this.length) {
    return this.prev().prevAll(selector, el.concat(this.prev()))
  }

  if (selector) {
    return this.filterEl(el, selector)
  }

  return this.noReapted(el)
}]

export const siblings = ['siblings', function () {
  return this.flatMap(e => $(e).parent().children().filter(child => e !== child))
}]

export const children = ['children', function (selector) {
  return this.flatMap(e => {
    const children = $(e.children)
    if (selector) {
      return children.filterEl(children, selector)
    }
    return children
  })
}]

export const nth = ['nth', function (n) {
  if (n > -1) {
    return $(this[n])
  }
  if (n < 0) {
    return $(this[this.length - n])
  }

  return this.map(e => this.parent().children().indexOf(e))
}]

export const find = ['find', function (selector = '', el = $()) {
  if (this.length) {
    const eachChildren = this.children()
    this.merge(el, eachChildren)
    return this.children().find(selector, el)
  }
  if (selector) {
    return this.filterEl(el, selector)
  }
  return this.noReapted(el)
}]

export const parent = ['parent', function (selector) {
  const el = this.map(e => e.parentElement).filter(e => {
    return e !== document && e
  })
  if (selector) {
    return this.filterEl(el, selector)
  }
  return el
}]

export const parents = ['parents', function (selector = '', el = $()) {
  if (this.length) {
    const eachParent = this.parent()
    this.merge(el, eachParent)
    return this.parent().parents(selector, el)
  }
  if (selector) {
    return this.filterEl(el, selector)
  }
  return this.noReapted(el)
}]

export const css = ['css', function (styles, value) {
  if (!styles || this.length === 0) return
  if (typeof styles === 'string' && value === undefined) {
    const camelProp = styles.replace(/(-[a-z])/, g => g.replace('-', '').toUpperCase())
    return getComputedStyle(this[0], null)[camelProp]
  }
  if (typeof styles === 'object') {
    Object.entries(styles).forEach(([style, val]) => {
      this.forEach(e => {
        e.style.setProperty(style, val)
      })
    })
  }
  if (value) {
    const camelProp = styles.replace(/(-[a-z])/, g => g.replace('-', '').toUpperCase())
    this.forEach(e => {
      e.style.setProperty(camelProp, value)
    })
  }
  return this
}]

export const txt = ['txt', function (text) {
  if (text !== undefined) {
    return this.map((e, i) => {
      e.textContent = typeof text === 'function' ? text(e.textContent, i) : text
      return e
    })
  }
  return this.map(e => e.textContent).join('')
}]

export const val = ['val', function (value) {
  if (value !== undefined) {
    return this.map((e, i) => {
      e.value = typeof value === 'function' ? value(e.value, i) : value
      return e
    })
  }
  if (this.length) return this[0].value
}]

export const attr = ['attr', function (attributes, value) {
  if (!attributes || this.length === 0) return
  if (typeof attributes === 'string' && value === undefined) return this[0].getAttribute(attributes)
  this.forEach(e => {
    if (typeof attributes === 'object') {
      Object.entries(attributes).forEach(([attr, val]) => {
        if (val === '') {
          e.removeAttribute(properties)
          return
        }
        e.setAttribute(attr, val)
      })
    }
    if (typeof attributes === 'string') {
      if (value) {
        e.setAttribute(attributes, value)
      }
      if (value === '') {
        e.removeAttribute(attributes)
      }
    }
  })

  return this
}]
export const prop = ['prop', function (properties, value) {
  if (!properties || this.length === 0) return
  if (typeof properties === 'string' && value === undefined) return this[0][properties]

  this.forEach(e => {
    if (typeof properties === 'object') {
      Object.entries(properties).forEach(([prop, val]) => {
        e[prop] = val
      })
    }
    if (typeof properties === 'string') {
      if (value) {
        e[properties] = value
      }
      if (value === '') {
        delete e[properties]
      }
    }
  })
  return this
}]

export const removeAttr = ['removeAttr', function (attribute) {
  if (!attribute) return
  this.forEach(el => {
    el.removeAttribute(attribute)
  })
  return this
}]

export const removeProp = ['removeProp', function (property) {
  if (!property) return
  this.forEach(el => {
    el[property] = ''
  })
  return this
}]

export const data = ['data', function (dataset, value) {
  function assign (e, key, val) {
    e.dataset[key] = typeof val === 'object' ? JSON.stringify(val) : val
  }
  if (this.length === 0) return
  if (dataset === undefined) return this[0].dataset
  if (typeof dataset === 'string') return this[0].dataset[dataset]

  if (typeof dataset === 'object') {
    Object.entries(dataset).forEach(([key, val]) => {
      this.forEach(e => {
        assign(e, key, val)
      })
    })
  }
  if (value) {
    this.forEach(el => {
      assign(el, dataset, value)
    })
  }
  return this
}]

function dimension (dim, val) {
  let value = 0
  const validNode = [Node.ELEMENT_NODE, Node.DOCUMENT_NODE]
  if (val) {
    this.forEach(el => {
      if (validNode.includes(el.nodeType)) {
        el.style.setProperty(dim, String(val).replace(/(^\d+$)/, '$1px'))
      }
    })
    return this
  }

  const _this = this[0]
  if (_this === window) {
    value = ({ height: innerHeight, width: innerWidth }[dim])
  }
  if (validNode.includes(_this.nodeType)) {
    value = getComputedStyle(_this, null)[dim]
  }
  return value
}

export const height = ['height', function (val) {
  return dimension.bind(this, 'height')(val)
}]

export const width = ['width', function (val) {
  return dimension.bind(this, 'width')(val)
}]

export const bounding = ['bounding', function (prop) {
  const bound = this[0].getBoundingClientRect()
  if (prop) return bound[prop]
  return bound
}]

export const create = ['create', function (nodeName, force) {
  if (!nodeName.match(/^[A-Z]*$/)) throw new Error('Should use uppercase nodeName(' + nodeName.toUpperCase() + ')')
  const el = document.createElement(nodeName.toLowerCase())

  try {
    if (el instanceof HTMLUnknownElement) {
      throw new Error('Invalid Element')
    }
    this.push(el)
    return this
  } catch (error) {
    if (force) {
      this.push(el)
      return this
    }
    console.error(error)
  }
}]
export const html = ['html', function (htmlStr) {
  if (htmlStr !== undefined) {
    const { body } = document.implementation.createHTMLDocument('')
    body.innerHTML = htmlStr
    this.forEach(el => {
      while (el.firstChild) { el.removeChild(el.firstChild) }
      const frag = document.createDocumentFragment()
      const cloneNodes = document.importNode(body, true).childNodes
      Array.from(cloneNodes).forEach(node => { frag.appendChild(node) })

      el.appendChild(frag)
    })
    return this
  }
  if (this.length) return this[0].innerHTML
  return ''
}]
export const clone = ['clone', function () {
  return this.flatMap(el => {
    if (el.content?.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      return $(document.importNode(el.content, true).childNodes)
    }
    return document.importNode(el, true)
  })
}]

function insert (action, args) {
  this.forEach((el, i, arr) => {
    args.forEach(arg => {
      if (typeof arg === 'string') {
        console.log(arg)
        const txt = document.createTextNode(arg)
        if (action === 'before') el.parentNode.insertBefore(txt, el)
        if (action === 'prepend') el.insertBefore(txt, el.firstChild)
        if (action === 'append') el.appendChild(txt)
        if (action === 'after') el.parentNode.insertBefore(txt, el.nextSibling)
        return
      }

      $(arg).forEach(selected => {
        const toClone = i === (action.match(/before|prepend/) ? 0 : arr.length - 1)
        const child = toClone ? selected : document.importNode(selected, true)
        if (action === 'before') el.parentNode.insertBefore(child, el)
        if (action === 'prepend') el.insertBefore(child, el.firstChild)
        if (action === 'append') el.appendChild(child)
        if (action === 'after') el.parentNode.insertBefore(child, el.nextSibling)
      })
    })
  })
  return this
}

export const before = ['before', function (...args) {
  return insert.bind(this, 'before')(args.flat())
}]
export const append = ['append', function (...args) {
  return insert.bind(this, 'append')(args.flat())
}]
export const prepend = ['prepend', function (...args) {
  return insert.bind(this, 'prepend')(args.flat().reverse())
}]
export const after = ['after', function (...args) {
  return insert.bind(this, 'after')(args.flat().reverse())
}]

export const scrollTop = ['scrollTop', function (value) {
  let win
  const _this = this[0]
  if (_this.window === _this) {
    win = _this
  }
  if (_this.nodeType === Node.DOCUMENT_NODE) {
    win = _this.defaultView
  }

  if (value === undefined) {
    return win ? win.pageYOffset : _this.scrollTop
  }

  if (win) {
    win.scrollTo(win.pageXOffset, value)
  } else {
    _this.scrollTop = value
  }
  return this
}]

export const scrollLeft = ['scrollLeft', function (value) {
  let win
  const _this = this[0]
  if (_this.window === el) {
    win = el
  }
  if (_this.nodeType === Node.DOCUMENT_NODE) {
    win = _this.defaultView
  }

  if (value === undefined) {
    return win ? win.pageXOffset : _this.scrollLeft
  }

  if (win) {
    win.scrollTo(value, win.pageYOffset)
  } else {
    _this.scrollLeft = value
  }
  return this
}]

export const remove = ['remove', function () {
  this.forEach(el => {
    el.remove()
  })
  return this
}]

export const dropdown = ['dropdown',
  function (action) {
    this.forEach(el => {
      Dropdown.getOrCreateInstance(el)[action]()
    })
    return this
  }
]
export const collapse = ['collapse',
  function (action) {
    this.forEach(el => {
      Collapse.getOrCreateInstance(el)[action]()
    })
    return this
  }
]

$.bootstrap = function (...plugins) {
  plugins.forEach(([key, module]) => {
    this.bootstrap[key] = module
    $.ElementCollection.prototype[key.toLocaleLowerCase()] = function (action) {
      this.forEach(el => { module.getOrCreateInstance(el)[action]() })
      return this
    }
  })
}

export function $ (param) {
  if (!param) return new $.ElementCollection() // undefined
  if (typeof param === 'string' || param instanceof String) {
    return new $.ElementCollection(...document.querySelectorAll(param))
  }
  if ([Window, Document, HTMLElement, SVGElement].some(prototype => param instanceof prototype)) {
    return new $.ElementCollection(param) // windows document
  }

  if (Array.isArray(param) || (typeof param === 'object')) {
    return new $.ElementCollection(...param)// array-like
  }
}

$.use = function (...methods) {
  $.ElementCollection = class extends Array {
    filterEl (el, matchEl) {
      return el.filter((item, pos, self) => $(matchEl).includes(item) && self.indexOf(item) === pos)
    }

    noReapted (el) {
      return el.filter((item, pos, self) => self.indexOf(item) === pos)
    }

    merge (arr1, arr2) {
      Array.prototype.push.apply(arr1, arr2)
    }

    changeClass (action, className) {
      const isFunc = typeof className === 'function'
      this.forEach((e, i) => {
        const result = isFunc ? className(e, i) : className
        if (typeof result === 'string' || result instanceof String) {
          e.classList[action](result)
        }
        if (Array.isArray(result)) {
          e.classList[action](...result)
        }
      })
    }
  }

  methods.forEach(([method, func]) => {
    if (method.match(/each|map/)) {
      $[method] = func
    }
    $.ElementCollection.prototype[method] = func
  })
}

export const each = ['each', function (iterator, cb) {
  if (typeof iterator === 'function') {
    this.forEach(iterator)
    return this
  }
  if (typeof iterator === 'object') {
    Object.entries(iterator).forEach(([key, val], i) => {
      cb(key, val, i, iterator)
    })
    return iterator
  }
}]

export const map = ['map', function (iterator, cb) {
  let index = -1
  const cache = []
  for (const [key, val] of Object.entries(iterator)) {
    index++
    cache.push(cb(val, key, index, iterator))
  }
  return cache
}]

// $.get = async function ({ url, data = {}, success = () => {}, dataType }) {
//   const queryStr = Object.entries(data).map(([key, value]) => key + '=' + value).join('&')
//   let res = await fetch(url + '?' + queryStr, {
//     method: 'GET',
//     headers: {
//       'Content-Type': dataType
//     }
//   })
//   res = await res.json()
//   success(res)
// }
