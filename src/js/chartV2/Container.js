/* filename => chartContainer.js */
class Container {
  constructor (args) {
    const def = {
      el: '#chart-svg',
      marginTop: 30,
      marginBottom: 60,
      marginLeft: 100,
      marginRight: 40,
      paddingX: 0.5,
      paddingY: 0.25,
      percentageMode: false,
      SI_unitTicks: false,
      dur: 1000,
      height: 600,
      items: {}, // type Object
      colorDomain: Array.from({ length: 2 }, (n, i) =>
        Array.from({ length: 26 }, (v, j) =>
          String.fromCharCode((i ? 'A' : 'a').charCodeAt() + j)
        )
      ).flat(Infinity),
      theme: [
        '#0009ec',
        '#6fcf97',
        '#603ae7',
        '#947dff',
        '#2f80ed',
        '#219653',
        '#f2c94c',
        '#939094',
        '#ff897d',
        '#27ae60',
        '#aeaaaf'
      ],
      get width () {
        const el = d3.select(this.el)
        const width = ['padding-left', 'padding-right'].reduce((w, curr) => {
          return (w -= +el.style(curr).replace('px', ''))
        }, +el.style('width').replace('px', ''))
        return width // - 30
      }
    }

    // this.charts = charts
    const vis = this

    Object.assign(def, args)
    Object.assign(vis, def)

    vis.offset = { y: 0, x: 0 }
    vis.orientation = null
  }

  get marginX () {
    return this.marginLeft + this.marginRight
  }

  get marginY () {
    return this.marginTop + this.marginBottom
  }

  get viewTranslate () {
    return [this.marginLeft, this.marginTop]
  }

  configBegin (items) {
    if (!items) return

    for (const item of Object.values(items)) {
      item?.configBegin(this)
    }
  }

  configEnd (items) {
    if (!items) return

    for (const item of Object.values(items)) {
      item?.configEnd(this)
    }
  }

  initVis (charts, args) {
    const vis = this
    const { width, height, marginLeft: ml, marginTop: mt } = vis
    const svg = d3
      .select(vis.el)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('text-anchor', 'middle')
      .attr('class', 'chart-container')
    if (d3.selectAll('#d3-grid').nodes().length === 0) {
      svg.append('style').attr('id', 'd3-grid').text('.x-axis line,.x-axis path,.y-axis line,.y-axis path{stroke:#e0e0e0}.coor text{transform:translate(-16px,0)rotate(10deg)}')
    }

    vis.view = svg.append('g')
      .attr('transform', `translate(${vis.viewTranslate.join(',')})`)
      .attr('class', 'canvas')

    vis.configBegin(vis.items)

    vis.width -= vis.marginX
    vis.height -= vis.marginY

    vis.configEnd(vis.items)
    vis.color = d3.scaleOrdinal(vis.colorDomain, vis.theme).unknown('none')

    return vis.createAxisGroup(vis).updateCharts(charts, args)
  }

  createAxisGroup (vis) {
    vis.yAxis = vis.view
      .append('g')
      .attr('class', 'y-axis')
      .style('font-size', 12)
      .attr('transform', `translate(${vis.offset.x},${vis.offset.y})`)
    vis.xAxis = vis.view
      .append('g')
      .attr('class', 'x-axis')
      .style('font-size', 12)

      .attr('transform', `translate(${vis.offset.x},${vis.height + vis.offset.y})`)
    return vis
  }

  vertical ({ xScale, yScale }) {
    const scaleType = { scaleBand: 'string', scaleTime: 'date', scaleLinear: 'number' }
    const vis = this
    vis.orientation = 'vertical'
    vis.axisType = { x: scaleType[xScale], y: scaleType[yScale] }
    vis.xScale = d3[xScale]().range([0, vis.width])
    vis.yScale = d3[yScale]().range([vis.height, 0])

    vis.axisBottom = d3.axisBottom(vis.xScale).tickSize(-vis.height)
    vis.axisLeft = d3.axisLeft(vis.yScale).tickSize(-vis.width)
    if (vis.percentageMode) {
      vis.axisLeft.tickFormat(d3.format('.0%'))
    }
    if (vis.SI_unitTicks) {
      vis.axisLeft.tickFormat(d3.format('.1s'))
    }
    if (xScale === 'scaleBand') {
      vis.gScale = d3
        .scaleBand()
        .paddingOuter(vis.paddingX / 2)
        .paddingInner(vis.paddingX / 4)
    }
    if (xScale === 'scaleTime') {
      vis.axisBottom.tickFormat(d3.timeFormat('%Y-%m'))
    }
    return this
  }

  horizontal ({ xScale, yScale }) {
    const vis = this
    vis.orientation = 'horizontal'
    vis.xScale = d3[xScale]().range([0, vis.width])
    vis.yScale = d3[yScale]().range([0, vis.height])

    vis.axisBottom = d3.axisBottom(vis.xScale).tickSize(-vis.height)
    vis.axisLeft = d3.axisLeft(vis.yScale).tickSize(-vis.width)
    if (vis.percentageMode) {
      vis.axisBottom.tickFormat(d3.format('.0%'))
    }

    if (yScale === 'scaleBand') {
      vis.gScale = d3
        .scaleBand()
        .paddingOuter(vis.paddingY / 4)
        .paddingInner(vis.paddingY / 2)
    }

    return this
  }

  updateCharts (charts, args = []) {
    const vis = this
    const graphics = vis.view
      .selectAll('.graphics')
      .data(charts)
      .join('g')
      .attr('class', 'graphics')
      .attr('transform', `translate(${vis.offset.x},${vis.offset.y})`)

    const mode = {}
    if (vis.percentageMode) {
      mode.stackOffset = 'stackOffsetExpand'
    }
    vis.charts = charts.map((Chart, i) => {
      const arg = { svg: vis, graphics: graphics.filter((d, j) => i === j) }

      if (args[i]) { Object.assign(arg, args[i]) }
      const chart = new Chart(arg)
      return chart
    })
    return vis
  }

  exe (command, ...arg) {
    this.charts.forEach(chart => chart[command](...arg))
    return this
  }

  wangleData (json) {
    if (Object.keys(json).length === 0) {
      this.view.append('text').text('無此因素資料').attr('class', 'no-data').attr('x', 342 - 60).attr('y', 200).attr('font-size', 72)
    } else {
      this.view.selectAll('.no-data').remove()
    }
    Object.values(this.items).forEach(item => {
      item?.wangle?.(this, json)
    })
    return this.exe('wangleData', json)
  }

  updateVis () {
    return this.exe('updateVis')
  }

  destroy () {
    return this.exe('destroy')
  }

  percentage (toggle) {
    const vis = this
    if (toggle === undefined) { return vis.percentageMode }

    vis.percentageMode = toggle
    const ticksFormat = toggle ? d3.format('.0%') : null
    const axis = { horizontal: 'axisBottom', vertical: 'axisLeft' }[vis.orientation]
    vis[axis].tickFormat(ticksFormat)

    return vis
  }

  stackMode (toggle) {
    const vis = this
    const stackOffset = toggle ? 'stackOffsetExpand' : 'stackOffsetNone'

    vis.charts.forEach(chart => {
      chart?.mode?.({ stackOffset })
    })
    return vis
  }

  SI_Unit (toggle) {
    const vis = this
    if (toggle === undefined) { return vis.SI_unitTicks }
    const ticksFormat = toggle ? d3.format('.1s') : null

    const axis = { horizontal: 'axisBottom', vertical: 'axisLeft' }[vis.orientation]
    vis[axis].tickFormat(ticksFormat)
  }
}
/* filename => chartContainer.js */
