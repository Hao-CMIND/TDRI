function createStateManager () {
  return {
    reset () {
      Object.assign(this, { action: 'none', node: null, link: null, dir: null, initPos: { x: 0, y: 0 } })
    }
  }
}
const state = createStateManager()
function getArrivalDir (point, pos) {
  let ang = Math.atan2(pos.y - point.y, pos.x - point.x) * 180 / Math.PI

  if (ang < 0) { ang += 360 }

  if (ang >= 315 || ang < 45) { return 'right' }
  if (ang >= 45 && ang < 135) { return 'top' }
  if (ang >= 135 && ang < 225) { return 'left' }
  if (ang >= 225 && ang < 315) { return 'bottom' }
}

function getDirPoint (point, pos) {
  for (const [dir, { circle: { x, y } }] of Object.entries(directions)) {
    if (distance({ x: point.x + x, y: point.y + y }, pos) < 10) {
      return dir
    }
  }
  return null
}

function linkExists (links, src1, tgt1) {
  return links.find(({ source: src2, target: tgt2 }) => {
    return (src2 === src1 && tgt2 === tgt1) || (tgt2 === src1 && src2 === tgt1)
  }
  )
}
class CanvasContext {
  constructor (canvas) {
    this.el = canvas
    this.w = this.el.width
    this.h = this.el.height
    this.ctx = canvas.getContext('2d')
    this.scaleRatio = 2.5
  }

  get ctr () {
    return { x: this.w / 2, y: this.h / 2 }
  }

  get bgRadius () {
    const r = 240
    return [r * 3, r * 2, r].map(Math.round)
  }

  imgBg (img, bgc) {
    const { w, h } = this
    this.drawBackground(bgc)
    return new Promise((resolve, reject) => {
      img.addEventListener('load', function () {
        img.width = w
        img.height = h
        img.style.setProperty('left', `calc(50% - ${(w / 2.5) / 2}px)`)
        img.style.setProperty('width', `${w / 2.5}px`)
        img.style.setProperty('height', `${h / 2.5}px`)

        resolve(this)
      })
      img.src = this.el.toDataURL('image/png', 1.0)
    })
  }

  draw (nodes, links) {
    const { ctx, w, h } = this
    ctx.clearRect(0, 0, w, h)

    this.drawCharacter(nodes)
    this.drawLinks(links, '#bdbdbd')
    ctx.lineWidth = 8
  }

  scaling (cb) {
    const { ctx, w, h } = this
    ctx.save()
    // ctx.translate(w / 2, h / 2)
    ctx.scale(this.scaleRatio, this.scaleRatio)
    cb()
    ctx.restore()
  }

  drawCharacter (node) {
    const { ctx } = this
    if (node instanceof Node) {
      const { x, y, title, img } = node
      ctx.fillStyle = '#000'
      ctx.font = '700 16px 微軟正黑體'
      ctx.textAlign = 'center'
      ctx.fillText(title, x, y + 40)
      ctx.drawImage(img, x - 20, y - 20, 40, 40)

      return
    }
    Object.values(node).forEach(this.drawCharacter.bind(this))
  }

  drawLinks (links, color) {
    const { ctx } = this
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    links.forEach(this.drawRoute.bind(this))
    links.forEach(link => {
      const { target, source, from, to } = link
      this.drawDeparturePoints(source, from, color)
      this.drawArrivalPoint(target, to)
      this.drawActionTag(link)
    })
  }

  drawRoute ({ target, source, from, to, path }) {
    const { ctx } = this
    if (path) {
      ctx.stroke(path)
      return path
    }

    const route = getRoute({ target, source, from, to }, this.w + 100, this.h + 100)
    if (route.length) {
      ctx.strokeStyle = '#bdbdbd'
      const cornerPath = roundCornersPath(route)
      ctx.stroke(cornerPath)
      return route
    }
    return null
  }

  drawDeparturePoints (node, dir, fill = '#bdbdbd') {
    const { ctx } = this
    ctx.fillStyle = fill // 設置圓點的顏色為 #bdbdbd

    if (dir) {
      const { x, y } = directions[dir].circle
      ctx.beginPath()
      ctx.arc(x + node.x, y + node.y, 4, 0, 2 * Math.PI)
      return
    }
    ctx.beginPath()
    Object.values(directions).forEach(({ circle }) => {
      const { x, y } = circle
      ctx.moveTo(node.x + x, node.y + y)
      ctx.arc(node.x + x, node.y + y, 4, 0, 2 * Math.PI)
    })
    ctx.fill()
  }

  drawArrivalPoint (tgt, dir, pointTo = 'avatar') {
    const { ctx } = this
    const { x: tx = 0, y: ty = 0 } = directions[dir][pointTo] ?? {}
    const coor = directions[dir].triangle.map(({ x, y }) => ({
      x: x + tx + tgt.x,
      y: y + ty + tgt.y
    }))
    ctx.moveTo(coor[0].x, coor[0].y)
    ctx.lineTo(coor[1].x, coor[1].y)
    ctx.lineTo(coor[2].x, coor[2].y)
    ctx.fill()
  }

  drawActionTag ({ tagCenter, action }) {
    const { ctx } = this
    const { x, y } = tagCenter
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.roundRect(x - action.length * 8 - 4, y - 8, action.length * 16 + 8, 20, 16)
    ctx.fill()
    ctx.stroke()

    ctx.font = '12px 微軟正黑體'
    ctx.fillStyle = '#000'
    ctx.fillText(action, x, y + 6)
  }

  drawBackground ({ fill1 = '#f1f1f1', fill2 = '#eae9f2', fill3 = '#e4e2f3', rect } = {}) {
    const { ctx, ctr: { x: cx, y: cy }, w, h } = this
    const [r0, r1, r2] = this.bgRadius
    ctx.save()
    if (rect) {
      ctx.fillStyle = rect
      ctx.fillRect(0, 0, w, h)
    }

    ctx.lineWidth = 1
    ctx.font = '700 40px 微軟正黑體'
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'
    ctx.fillText('影響者 (Influencers)', cx - 240 * 3 - 400, cy - 240 * 3)
    ctx.textAlign = 'right'
    ctx.fillText('使用者 (Users)', cx + 240 * 3 + 400, cy - 240 * 3)
    ctx.textBaseline = 'bottom'
    ctx.fillText('治理 (Governance)', cx + 240 * 3 + 400, cy + 240 * 3)
    ctx.textAlign = 'left'
    ctx.fillText('提供者 (Providers)', cx - 240 * 3 - 400, cy + 240 * 3)

    ctx.fillStyle = fill1
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, cy, r0, 0, 2 * Math.PI)
    ctx.save()
    ctx.shadowOffsetY = 2
    ctx.shadowBlur = 10
    ctx.shadowColor = 'rgba(0,0,0,.08)'

    ctx.fill()
    ctx.restore()

    ctx.stroke()
    ctx.fillStyle = fill2
    ctx.beginPath()
    ctx.arc(cx, cy, r1, 0, 2 * Math.PI)
    ctx.fill()
    ctx.fillStyle = fill3
    ctx.beginPath()
    ctx.arc(cx, cy, r2, 0, 2 * Math.PI)
    ctx.fill()

    ctx.fillStyle = '#b9b9b9'
    ctx.font = '30px 微軟正黑體'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('環境設定者 (權力高 / 利益低)', cx - r0 + 320, cy + r0 - 180)
    ctx.fillText('Keep Informed', cx - r0 + 320, cy + r0 - 180 + 32)
    ctx.fillText('關注者 (權力低 / 利益高) ', cx - r1 + 260, cy + r1 - 160)
    ctx.fillText('Keep Satisfied', cx - r1 + 260, cy + r1 - 160 + 32)

    ctx.fillText('參與者 (權力高 / 利益高)', cx - r2 + 180, cy + r2 - 70)
    ctx.fillText('Manage Closely', cx - r2 + 180, cy + r2 - 70 + 32)

    ctx.fillText('群眾 (權力低 / 利益低)', cx - r0 + 70, cy + r0 - 50)
    ctx.fillText('Monitor', cx - r0 + 70, cy + r0 - 50 + 32)

    ctx.strokeStyle = '#b9b9b9'
    ctx.setLineDash([2])
    ctx.beginPath()
    ctx.moveTo(0, cy)
    ctx.lineTo(w, cy)
    ctx.moveTo(cx, 0)
    ctx.lineTo(cx, h)
    ctx.stroke()

    ctx.restore()
  }
}

class Node {
  static init = (_ => {
    this.prototype.width = 58
    this.prototype.height = 58
    return null
  })()

  x = undefined
  y = undefined
  // x = 850
  // y = 50
  tempData = {
    rights: '',
    benefits: '',
    angle: ''
  }

  avatar = 'avatar11.png'
  constructor (args) {
    Object.assign(this, args)
  }

  loadImg (src) {
    this.img ??= new Image()
    this.img.width = 40
    this.img.height = 40
    src ??= this.avatar

    this.img.src = './img/' + src
    return new Promise(resolve => {
      this.img.addEventListener('load', resolve.bind(null, this), { once: true })
    })
  }

  get left () {
    return this.x - 29
  }

  get top () {
    return this.y - 29
  }

  positionContext ({ rights, benefits, angle }) {
    const { x, y } = Node.cCtx.ctr
    const text = [
      {
        defaultPos: [
          { x, y }, { x: x + 29, y: y - 29 },
          { x: x - 29, y: y - 29 },
          { x: x - 29, y: y + 29 },
          { x: x + 29, y: y + 29 }
        ],
        rights: '高',
        benefits: '高',
        relation: '參與者',
        desc: ['Manage Closly 參與者（權力高／利益高）：', '對產品有高度興趣，並能影響自己的命運。', '與他們密切合作，從他們的想法中獲益，並解決可能的衝突。']
      },
      {
        defaultPos: [
          // { x: Node.cCtx.ctr.x, y: Node.cCtx.ctr.y }, { x: 600, y: 200 },
          // { x: 400, y: 175 },
          // { x: 400, y: 398 },
          // { x: 590, y: 380 }

          { x, y }, { x: x + 29 * 4, y: y - 29 * 3 },
          { x: x - 29 * 4, y: y - 29 * 3 },
          { x: x - 29 * 4, y: y + 29 * 3 },
          { x: x + 29 * 4, y: y + 29 * 3 }
        ],
        rights: '低',
        benefits: '高',
        relation: '關注者',
        desc: ['Keep Satisfied 關注者（權力低／利益高）：', '對產品有高度興趣，但無法影響產品或環境。', '收集他們的意見和反饋，並在產品決策中加以考慮。']
      },
      {
        defaultPos: [
          // { x: Node.cCtx.ctr.x, y: Node.cCtx.ctr.y }, { x: 665, y: 100 },
          // { x: 308, y: 121 },
          // { x: 330, y: 450 },
          // { x: 700, y: 440 }

          { x, y }, { x: x + 29 * 7, y: y - 29 * 5 },
          { x: x - 29 * 7, y: y - 29 * 5 },
          { x: x - 29 * 7, y: y + 29 * 5 },
          { x: x + 29 * 7, y: y + 29 * 5 }
        ],
        rights: '高',
        benefits: '低',
        relation: '環境設定者',
        desc: ['Keep informed 環境設定者（權力高／利益低）：', '雖然他們對產品本身不太感興趣，但對開發有影響力。', '建立良好關係，了解他們可能的需求和關切。']
      },
      {
        defaultPos: [
          // { x: Node.cCtx.ctr.x, y: Node.cCtx.ctr.y }, { x: 760, y: 80 },
          // { x: 185, y: 80 },
          // { x: 186, y: 495 },
          // { x: 860, y: 500 }
          { x, y }, { x: x + 29 * 10, y: y - 29 * 7 },
          { x: x - 29 * 10, y: y - 29 * 7 },
          { x: x - 29 * 10, y: y + 29 * 7 },
          { x: x + 29 * 10, y: y + 29 * 7 }
        ],
        rights: '低',
        benefits: '低',
        relation: '群眾',
        desc: ['Monitor 群眾（權力低／利益低）：', '給他們提供產品相關資訊，但無需過多互動。', '資訊可主動發布（如通訊），也可被動提供（如資訊平台）。']
      }
    ]
    if (angle && rights && benefits) {
      const group = this.getGroup(angle)
      return text.find(t => t.rights === rights && t.benefits === benefits).defaultPos[group]
    }

    if (rights && benefits) {
      return text.find(t => t.rights === rights && t.benefits === benefits)
    }
  }

  getPosition ({ type, value }) {
    if (this.x === undefined || this.y === undefined) {
      this.tempData[type] = value

      const position = this.positionContext(this.tempData)
      if (position?.x) {
        return position
      }
      return
    }

    const newRadius = Object.assign({}, this.radius)
    newRadius[type] = value
    const props = this.positionContext({ benefits: newRadius.benefits, rights: newRadius.rights })

    if (type.match(/benefits|rights/)) {
      return props.defaultPos[this.quadrant]
    }
    return props.defaultPos[this.getGroup(value)]
  }

  // radiusContext ({ rights, benefits }) {
  //   if (rights === '低') {
  //     if (benefits === '低') {
  //       return (Math.min(Node.cCtx.w, Node.cCtx.h) / 2) / 3 * 3.2
  //     }
  //     if (benefits === '高') {
  //       return Node.cCtx.bgRadius[1]
  //     }
  //   }
  //   if (rights === '高') {
  //     if (benefits === '低') {
  //       return Node.cCtx.bgRadius[2]
  //     }
  //     if (benefits === '高') {
  //       return Node.cCtx.bgRadius[0]
  //     }
  //   }
  // }

  get radius () {
    if (this.x === undefined || this.y === undefined) return { rights: '', benefits: '', group: '', desc: [] }
    const d = distance(this, { x: Node.cCtx.ctr.x, y: Node.cCtx.ctr.y })
    if (d < Node.cCtx.bgRadius[2]) return { rights: '高', benefits: '高', group: '參與者', desc: ['Manage Closly 參與者（權力高／利益高）：', '對產品有高度興趣，並能影響自己的命運。', '與他們密切合作，從他們的想法中獲益，並解決可能的衝突。'] }

    if (d < Node.cCtx.bgRadius[1]) {
      return { rights: '低', benefits: '高', group: '關注者', desc: ['Keep Satisfied 關注者（權力低／利益高）：', '對產品有高度興趣，但無法影響產品或環境。', '收集他們的意見和反饋，並在產品決策中加以考慮。'] }
    }

    if (d < Node.cCtx.bgRadius[0]) return { rights: '高', benefits: '低', group: '環境設定者', desc: ['Keep informed 環境設定者（權力高／利益低）：', '雖然他們對產品本身不太感興趣，但對開發有影響力。', '建立良好關係，了解他們可能的需求和關切。'] }

    return { rights: '低', benefits: '低', group: '群眾', desc: ['Monitor 群眾（權力低／利益低）：', '給他們提供產品相關資訊，但無需過多互動。', '資訊可主動發布（如通訊），也可被動提供（如資訊平台）。'] }
  }

  getGroup (group) {
    return [null, '使用者', '影響者', '提供者', '治理'].indexOf(group)
  }

  get quadrant () {
    let a = Math.atan2(Node.cCtx.ctr.y - this.y, Node.cCtx.ctr.x - this.x) * 180 / Math.PI
    if (a < 0) { a += 360 }
    if (a < 89) return 2
    if (a < 179) return 1
    if (a < 269) return 4
    return 3
  }

  get angle () {
    if (this.x === undefined || this.y === undefined) return ''
    const a = this.quadrant
    if (a === 2) return '影響者'
    if (a === 1) return '使用者'
    if (a === 4) return '治理'
    return '提供者'
  }

  get fromLinks () {
    return Node.links.filter(link => {
      return link.target === this
    })
  }

  get toLinks () {
    return Node.links.filter(link => {
      return link.source === this
    })
  }

  get postData () {
    return {
      x: this.x,
      y: this.y,
      title: this.title,
      avatar: this.avatar
    }
  }
}

function getActionPositon (route) {
  const linkLength = []
  route.reduce(({ x: x1, y: y1 }, { x: x2, y: y2 }) => {
    linkLength.push(Math.hypot(x2 - x1, y2 - y1))
    return { x: x2, y: y2 }
  })
  const maxI = linkLength.indexOf(
    linkLength.reduce((a, b) => (a > b ? a : b))
  )
  const [{ x: x1, y: y1 }, { x: x2, y: y2 }] = route.slice(maxI, 2 + maxI)

  return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }
}
function _uuid () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) % 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

function getNodeUUID (nodes, node) {
  const [uuid] = Object.entries(nodes).find(([, eachNode]) => {
    return node === eachNode
  })
  return uuid
}

function postNodesJSON (nodes) {
  const json = {}
  for (const uuid in nodes) {
    json[uuid] = nodes[uuid].postData
  }
  return json
}
function postLinksJSON (nodes, links) {
  return links.map(link => {
    const { from, to, action } = link
    return {
      from,
      to,
      action,
      source: getNodeUUID(nodes, link.source),
      target: getNodeUUID(nodes, link.target)
    }
  })
}

function getActionNode (nodes, pos) {
  return Object.values(nodes).find((node) => {
    // 假設檢測範圍為節點中心半徑 40
    return distance(node, pos) <= 40
  })
}

function getRoute ({ target, source, from, to }, width, height) {
  return OrthogonalConnector.route({
    pointA: { shape: source, side: from, distance: 0.5 },
    pointB: { shape: target, side: to, distance: 0.5 },
    shapeMargin: 0,
    globalBoundsMargin: 100,
    globalBounds: { left: 0, top: 0, width, height }
  })
}

function getPosition (cCtx, event) {
  const { left, top } = cCtx.el.getBoundingClientRect()
  return { x: Math.round(event.clientX - left), y: Math.round(event.clientY - top) }
}
const directions = {
  top: {
    avatar: { x: 0, y: -22 },
    triangle: [{ x: 6, y: -8 }, { x: 0, y: 0 }, { x: -6, y: -8 }],
    circle: { x: 0, y: -25 }
  },
  right: {
    avatar: { x: 22, y: 0 },
    triangle: [{ x: 8, y: 6 }, { x: 0, y: 0 }, { x: 8, y: -6 }],
    circle: { x: 25, y: 0 }
  },
  bottom: {
    avatar: { x: 0, y: 22 },
    triangle: [{ x: -6, y: 8 }, { x: 0, y: 0 }, { x: 6, y: 8 }],
    circle: { x: 0, y: 25 }
  },
  left: {
    avatar: { x: -22, y: 0 },
    triangle: [{ x: -8, y: -6 }, { x: 0, y: 0 }, { x: -8, y: 6 }],
    circle: { x: -25, y: 0 }
  }
}
