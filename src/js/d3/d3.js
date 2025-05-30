/* filename => d3.js */
/* cdn 請用 node js 安裝 ↓↓↓↓↓ */
/* npm i d3-array@3.2.4 d3-axis@3.0.0  d3-ease@3.0.1 d3-format@3.1.0 d3-interpolate@3.0.1 d3-path@3.1.0 d3-scale@4.0.2 d3-selection@3.0.0 d3-shape@3.2.0 d3-time-format@4.1.0 d3-transition@3.0.1 -S */
import * as d3array from 'https://cdn.jsdelivr.net/npm/d3-array@3.2.4/+esm'
import * as d3axis from 'https://cdn.jsdelivr.net/npm/d3-axis@3.0.0/+esm'
import * as d3ease from 'https://cdn.jsdelivr.net/npm/d3-ease@3.0.1/+esm'
import { dispatch } from 'https://cdn.jsdelivr.net/npm/d3-dispatch@3.0.1/+esm'
import * as d3format from 'https://cdn.jsdelivr.net/npm/d3-format@3.1.0/+esm'
import * as d3interpolate from 'https://cdn.jsdelivr.net/npm/d3-interpolate@3.0.1/+esm'
import * as d3path from 'https://cdn.jsdelivr.net/npm/d3-path@3.1.0/+esm'
import * as d3scale from 'https://cdn.jsdelivr.net/npm/d3-scale@4.0.2/+esm'
import * as d3selection from 'https://cdn.jsdelivr.net/npm/d3-selection@3.0.0/+esm'
import * as d3shape from 'https://cdn.jsdelivr.net/npm/d3-shape@3.2.0/+esm'
import * as d3timeformat from 'https://cdn.jsdelivr.net/npm/d3-time-format@4.1.0/+esm'
import * as d3transition from 'https://cdn.jsdelivr.net/npm/d3-transition@3.0.1/+esm'
const RADIANS = Math.PI / 180

const SPIRALS = {
  archimedean: archimedeanSpiral,
  rectangular: rectangularSpiral
}

const cw = 1 << 11 >> 5
const ch = 1 << 11

/* eslint-disable */
function cloud () {
  let size = [256, 256]
  let text = cloudText
  let font = cloudFont
  let fontSize = cloudFontSize
  let fontStyle = cloudFontNormal
  let fontWeight = cloudFontNormal
  let rotate = cloudRotate
  let padding = cloudPadding
  let spiral = archimedeanSpiral
  let words = []
  let timeInterval = Infinity
  const event = dispatch('word', 'end')
  let timer = null
  let random = Math.random
  const cloud = {}
  let canvas = cloudCanvas

  cloud.canvas = function (_) {
    return arguments.length ? (canvas = functor(_), cloud) : canvas
  }

  cloud.start = function () {
    const contextAndRatio = getContext(canvas())
    const board = zeroArray((size[0] >> 5) * size[1])
    let bounds = null
    const n = words.length
    let i = -1
    const tags = []
    const data = words.map(function (d, i) {
      d.text = text.call(this, d, i)
      d.font = font.call(this, d, i)
      d.style = fontStyle.call(this, d, i)
      d.weight = fontWeight.call(this, d, i)
      d.rotate = rotate.call(this, d, i)
      d.size = ~~fontSize.call(this, d, i)
      d.padding = padding.call(this, d, i)
      return d
    }).sort(function (a, b) { return b.size - a.size })

    if (timer) clearInterval(timer)
    timer = setInterval(step, 0)
    step()

    return cloud

    function step () {
      const start = Date.now()
      while (Date.now() - start < timeInterval && ++i < n && timer) {
        const d = data[i]
        d.x = (size[0] * (random() + 0.5)) >> 1
        d.y = (size[1] * (random() + 0.5)) >> 1
        cloudSprite(contextAndRatio, d, data, i)
        if (d.hasText && place(board, d, bounds)) {
          tags.push(d)
          event.call('word', cloud, d)
          if (bounds) cloudBounds(bounds, d)
          else bounds = [{ x: d.x + d.x0, y: d.y + d.y0 }, { x: d.x + d.x1, y: d.y + d.y1 }]
          // Temporary hack
          d.x -= size[0] >> 1
          d.y -= size[1] >> 1
        }
      }
      if (i >= n) {
        cloud.stop()
        event.call('end', cloud, tags, bounds)
      }
    }
  }

  cloud.stop = function () {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    for (const d of words) {
      delete d.sprite
    }
    return cloud
  }

  function getContext (canvas) {
    const context = canvas.getContext('2d', { willReadFrequently: true })

    canvas.width = canvas.height = 1
    const ratio = Math.sqrt(context.getImageData(0, 0, 1, 1).data.length >> 2)
    canvas.width = (cw << 5) / ratio
    canvas.height = ch / ratio

    context.fillStyle = context.strokeStyle = 'red'

    return { context, ratio }
  }

  function place (board, tag, bounds) {
    const perimeter = [{ x: 0, y: 0 }, { x: size[0], y: size[1] }]
    const startX = tag.x
    const startY = tag.y
    const maxDelta = Math.sqrt(size[0] * size[0] + size[1] * size[1])
    const s = spiral(size)
    const dt = random() < 0.5 ? 1 : -1
    let t = -dt
    let dxdy
    let dx
    let dy

    while (dxdy = s(t += dt)) {
      dx = ~~dxdy[0]
      dy = ~~dxdy[1]

      if (Math.min(Math.abs(dx), Math.abs(dy)) >= maxDelta) break

      tag.x = startX + dx
      tag.y = startY + dy

      if (tag.x + tag.x0 < 0 || tag.y + tag.y0 < 0 ||
          tag.x + tag.x1 > size[0] || tag.y + tag.y1 > size[1]) continue
      // TODO only check for collisions within current bounds.
      if (!bounds || collideRects(tag, bounds)) {
        if (!cloudCollide(tag, board, size[0])) {
          const sprite = tag.sprite
          const w = tag.width >> 5
          const sw = size[0] >> 5
          const lx = tag.x - (w << 4)
          const sx = lx & 0x7f
          const msx = 32 - sx
          const h = tag.y1 - tag.y0
          let x = (tag.y + tag.y0) * sw + (lx >> 5)
          var last
          for (let j = 0; j < h; j++) {
            last = 0
            for (let i = 0; i <= w; i++) {
              board[x + i] |= (last << msx) | (i < w ? (last = sprite[j * w + i]) >>> sx : 0)
            }
            x += sw
          }
          return true
        }
      }
    }
    return false
  }

  cloud.timeInterval = function (_) {
    return arguments.length ? (timeInterval = _ == null ? Infinity : _, cloud) : timeInterval
  }

  cloud.words = function (_) {
    return arguments.length ? (words = _, cloud) : words
  }

  cloud.size = function (_) {
    return arguments.length ? (size = [+_[0], +_[1]], cloud) : size
  }

  cloud.font = function (_) {
    return arguments.length ? (font = functor(_), cloud) : font
  }

  cloud.fontStyle = function (_) {
    return arguments.length ? (fontStyle = functor(_), cloud) : fontStyle
  }

  cloud.fontWeight = function (_) {
    return arguments.length ? (fontWeight = functor(_), cloud) : fontWeight
  }

  cloud.rotate = function (_) {
    return arguments.length ? (rotate = functor(_), cloud) : rotate
  }

  cloud.text = function (_) {
    return arguments.length ? (text = functor(_), cloud) : text
  }

  cloud.spiral = function (_) {
    return arguments.length ? (spiral = SPIRALS[_] || _, cloud) : spiral
  }

  cloud.fontSize = function (_) {
    return arguments.length ? (fontSize = functor(_), cloud) : fontSize
  }

  cloud.padding = function (_) {
    return arguments.length ? (padding = functor(_), cloud) : padding
  }

  cloud.random = function (_) {
    return arguments.length ? (random = _, cloud) : random
  }

  cloud.on = function () {
    const value = event.on.apply(event, arguments)
    return value === event ? cloud : value
  }

  return cloud
};

function cloudText (d) {
  return d.text
}

function cloudFont () {
  return 'serif'
}

function cloudFontNormal () {
  return 'normal'
}

function cloudFontSize (d) {
  return Math.sqrt(d.value)
}

function cloudRotate () {
  return (~~(random() * 6) - 3) * 30
}

function cloudPadding () {
  return 1
}

// Fetches a monochrome sprite bitmap for the specified text.
// Load in batches for speed.
function cloudSprite (contextAndRatio, d, data, di) {
  if (d.sprite) return
  const c = contextAndRatio.context
  const ratio = contextAndRatio.ratio

  c.clearRect(0, 0, (cw << 5) / ratio, ch / ratio)
  let x = 0
  let y = 0
  let maxh = 0
  const n = data.length
  --di
  while (++di < n) {
    d = data[di]
    c.save()
    c.font = d.style + ' ' + d.weight + ' ' + ~~((d.size + 1) / ratio) + 'px ' + d.font
    const metrics = c.measureText(d.text)
    const anchor = -Math.floor(metrics.width / 2)
    let w = (metrics.width + 1) * ratio
    let h = d.size << 1
    if (d.rotate) {
      const sr = Math.sin(d.rotate * RADIANS)
      const cr = Math.cos(d.rotate * RADIANS)
      const wcr = w * cr
      const wsr = w * sr
      const hcr = h * cr
      const hsr = h * sr
      w = (Math.max(Math.abs(wcr + hsr), Math.abs(wcr - hsr)) + 0x1f) >> 5 << 5
      h = ~~Math.max(Math.abs(wsr + hcr), Math.abs(wsr - hcr))
    } else {
      w = (w + 0x1f) >> 5 << 5
    }
    if (h > maxh) maxh = h
    if (x + w >= (cw << 5)) {
      x = 0
      y += maxh
      maxh = 0
    }
    if (y + h >= ch) break
    c.translate((x + (w >> 1)) / ratio, (y + (h >> 1)) / ratio)
    if (d.rotate) c.rotate(d.rotate * RADIANS)
    c.fillText(d.text, anchor, 0)
    if (d.padding) c.lineWidth = 2 * d.padding, c.strokeText(d.text, anchor, 0)
    c.restore()
    d.width = w
    d.height = h
    d.xoff = x
    d.yoff = y
    d.x1 = w >> 1
    d.y1 = h >> 1
    d.x0 = -d.x1
    d.y0 = -d.y1
    d.hasText = true
    x += w
  }
  const pixels = c.getImageData(0, 0, (cw << 5) / ratio, ch / ratio).data
  const sprite = []
  while (--di >= 0) {
    d = data[di]
    if (!d.hasText) continue
    const w = d.width
    const w32 = w >> 5
    let h = d.y1 - d.y0
    // Zero the buffer
    for (var i = 0; i < h * w32; i++) sprite[i] = 0
    x = d.xoff
    if (x == null) return
    y = d.yoff
    let seen = 0
    let seenRow = -1
    for (let j = 0; j < h; j++) {
      for (var i = 0; i < w; i++) {
        const k = w32 * j + (i >> 5)
        const m = pixels[((y + j) * (cw << 5) + (x + i)) << 2] ? 1 << (31 - (i % 32)) : 0
        sprite[k] |= m
        seen |= m
      }
      if (seen) seenRow = j
      else {
        d.y0++
        h--
        j--
        y++
      }
    }
    d.y1 = d.y0 + seenRow
    d.sprite = sprite.slice(0, (d.y1 - d.y0) * w32)
  }
}

// Use mask-based collision detection.
function cloudCollide (tag, board, sw) {
  sw >>= 5
  const sprite = tag.sprite
  const w = tag.width >> 5
  const lx = tag.x - (w << 4)
  const sx = lx & 0x7f
  const msx = 32 - sx
  const h = tag.y1 - tag.y0
  let x = (tag.y + tag.y0) * sw + (lx >> 5)
  let last
  for (let j = 0; j < h; j++) {
    last = 0
    for (let i = 0; i <= w; i++) {
      if (((last << msx) | (i < w ? (last = sprite[j * w + i]) >>> sx : 0)) &
          board[x + i]) return true
    }
    x += sw
  }
  return false
}

function cloudBounds (bounds, d) {
  const b0 = bounds[0]
  const b1 = bounds[1]
  if (d.x + d.x0 < b0.x) b0.x = d.x + d.x0
  if (d.y + d.y0 < b0.y) b0.y = d.y + d.y0
  if (d.x + d.x1 > b1.x) b1.x = d.x + d.x1
  if (d.y + d.y1 > b1.y) b1.y = d.y + d.y1
}

function collideRects (a, b) {
  return a.x + a.x1 > b[0].x && a.x + a.x0 < b[1].x && a.y + a.y1 > b[0].y && a.y + a.y0 < b[1].y
}

function archimedeanSpiral (size) {
  const e = size[0] / size[1]
  return function (t) {
    return [e * (t *= 0.1) * Math.cos(t), t * Math.sin(t)]
  }
}

function rectangularSpiral (size) {
  const dy = 4
  const dx = dy * size[0] / size[1]
  let x = 0
  let y = 0
  return function (t) {
    const sign = t < 0 ? -1 : 1
    // See triangular numbers: T_n = n * (n + 1) / 2.
    switch ((Math.sqrt(1 + 4 * sign * t) - sign) & 3) {
      case 0: x += dx; break
      case 1: y += dy; break
      case 2: x -= dx; break
      default: y -= dy; break
    }
    return [x, y]
  }
}

// TODO reuse arrays?
function zeroArray (n) {
  const a = []
  let i = -1
  while (++i < n) a[i] = 0
  return a
}

function cloudCanvas () {
  return document.createElement('canvas')
}

function functor (d) {
  return typeof d === 'function' ? d : function () { return d }
}
/* eslint-enable */
const d3 = Object.assign({}, d3array, d3axis, d3ease, d3format, d3interpolate, d3path, d3scale, d3selection, d3shape, d3timeformat, d3transition, { cloud })
