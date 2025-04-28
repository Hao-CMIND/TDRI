/* filename => configuration.js */
class Title {
  el = null
  constructor (title) {
    this.text = title
  }

  configBegin (chart) {
    const [x, y] = chart.viewTranslate
    this.el = chart.view
      .append('text')
      .attr('class', 'svg-chart-title')
      .attr('alignment-baseline', 'text-after-edge')
      .attr('font-weight', 700)
      .attr('font-size', 24)
      .text(this.text)
    const { height } = this.el.node().getBBox()
    chart.marginTop += height
    chart.offset.y += height

    if (this.isOverlapping) {
      this.el.attr('y', height)
    }
  }

  configEnd (chart) {
    this.el.attr('x', chart.width / 2)
  }

  overlapping () {
    this.isOverlapping = true
    return this
  }
}
class AxisTitle {
  el = null
  constructor (label) {
    this.text = label
  }

  left ({ offset = 30, translateX = 0, translateY = 0, unit } = {}) {
    this.begin = function (chart) {
      this.el.attr('text-anchor', 'start').attr('x', -offset + translateX).attr('alignment-baseline', 'text-after-edge')

      if (unit) {
        this.el.attr('data-unit', unit)
      }

      chart.marginLeft += offset
      chart.offset.x += offset
    }
    this.end = function (chart) {
      this.el.attr('y', chart.offset.y + translateY)
    }
    return this
  }

  bottom ({ offset = 50, translateX = 0, translateY = 20 } = {}) {
    this.begin = function (chart) {
      const { height } = this.el.node().getBBox()
      chart.marginBottom += offset + height
    }
    this.end = function (chart) {
      const { height } = this.el.node().getBBox()
      this.el
        .attr('x', chart.width + translateX)
        .attr('y', chart.height + chart.offset.y + height + translateY)
      // .attr('alignment-baseline', 'text-before-edge')
    }
    return this
  }

  configBegin (chart) {
    this.el = chart.view
      .append('text')
      .attr('class', 'axis-title')
      .attr('font-size', 14)
      .text(this.text)
    this.begin(chart)
  }

  configEnd (chart) {
    this.end(chart)
  }
}
class Legend {
  el = null
  constructor ({ size = 16, offset = { x: -150, y: 60 } } = {}) {
    this.size = size
    this.offset = offset
  }

  configBegin (chart) {
    this.el = chart.view.append('g').attr('class', 'legends')
    chart.marginBottom += this.offset.y
  }

  configEnd (chart) {
    this.el
      .attr('transform', `translate(${this.offset.x / 2},${chart.height + chart.offset.y + this.offset.y})`)
      .attr('text-anchor', 'start')
      .attr('font-size', 14)
  }

  wangle (chart, json) {
    const legend = this.el
      .selectAll('.legend')
      .data(Object.keys(json))
      .join(enter => {
        const group = enter.append('g')
          .attr('class', 'legend')
          .attr('transform', (d, i, a) => {
            const cols = 6
            const rows = Math.floor(i / cols)
            const itemWidth = (chart.width - this.offset.x) / cols
            const isLastRow = rows === Math.floor(a.length / cols)
            const mxAuto = (chart.width - itemWidth * (a.length % cols)) / 2
            const x = itemWidth / 2 + (itemWidth - (itemWidth / cols)) * (i % cols) + (isLastRow && mxAuto)
            return `translate(${x.toFixed(2)},${rows.toFixed(2) * this.size * 2})`
          })
        group.append('circle')
          .attr('cx', this.size / 2)
          .attr('r', this.size / 2)
          .attr('fill', d => (d.match(/其他/) ? chart.theme.at(-1) : chart.color(d)))
        group.append('text')
          .attr('x', this.size + 5)
          .attr('alignment-baseline', 'middle')
          .text(d => d)

        this.hover(chart, group)
      }, update => {
        update.attr('transform', (d, i, a) => {
          const cols = 5
          const rows = Math.floor(i / cols)
          const itemWidth = (chart.width - this.offset.x) / cols
          const isLastRow = rows === Math.floor(a.length / cols)
          const mxAuto = (chart.width - itemWidth * (a.length % cols)) / 2
          const x = itemWidth * (i % cols) + (isLastRow && mxAuto)
          return `translate(${x.toFixed(2)},${rows.toFixed(2) * this.size * 2})`
        })

        update.select('circle')
          .attr('fill', d => (d.match(/其他/) ? chart.theme.at(-1) : chart.color(d)))
        update.select('text')
          .text(d => d)
        this.hover(chart, update)
      }, exit => {
        exit.remove()
      })

    // this.hover(chart, legend)
  }

  hover (chart, legend) {
    legend.on('mouseenter mouseleave', function (e, triggerLegend) {
      d3.selectAll('.chart-container').selectAll('[data-bs-toggle]').filter(function (d, i, el) {
        return !this.dataset.bsOriginalTitle.includes(triggerLegend)
      }).attr('opacity', () => {
        return { mouseenter: 0.2, mouseleave: 1 }[e.type]
      })
    })
  }
}
class HeatmapLegend extends Legend {
  constructor ({ size = 20, offset = { x: -150, y: 60 }, legend = '產品數量' } = {}) {
    super({ size, offset })
    this.legend = legend
    this.updated = true
  }

  configEnd (chart) {
    super.configEnd(chart)
    this.text = this.el.append('text').text(this.legend)
    const { height } = this.text.node().getBBox()
    this.text
      .attr('font-size', 16)
      .attr('x', (chart.width - 460) / 2)
      .attr('y', height + 30)
  }

  wangle (chart) {
    if (!this.updated) return
    this.update = false

    const color = d3.interpolateRgb('white', chart.color.range()[0])
    const { width } = this.text.node().getBBox()
    const legend = this.el
      .selectAll('.legend')
      .data(Array.from({ length: 11 }, (v, i) => i * 10))
      .join('g')
      .attr('class', 'legend')
      .attr('transform', (d, i) => {
        const x = (chart.width - 440) / 2 + i * 40 + width
        return `translate(${x.toFixed(2)},${this.size})`
      })
    legend
      .append('rect')
      .attr('width', 40)
      .attr('height', 40)
      .attr('fill', d => color(d / 100))
      .attr('stroke', '#e0e0e0')
    legend
      .append('text')
      .attr('x', 20)
      .attr('y', 20)
      .attr('fill', d => (d < 60 ? '#000' : '#fff'))
      .attr('text-anchor', 'middle').attr('alignment-baseline', 'central')
      .attr('alignment-baseline', 'central')
      .text(d => d)
  }
}
/* filename => configuration.js */
