class Tip {

  static createTip (selection, { toggle = 'tooltip', placement = 'top', delay = 0, instance, title } = {}) {
    const name = instance?.constructor.name
    selection.attr('class', selection.attr('class') + ' tip')
      .attr('data-bs-html', 'true')
      .attr('data-bs-toggle', toggle)
      .attr('data-bs-placement', placement)

    if (title !== null) {
      selection.attr('title', function (d, e) {
        if (!instance) { return }
        const el = this
        const graphic = el.parentNode
        const graphics = graphic.parentNode
        const labelIndex = Array.from(graphic.children).filter(el => el.classList.contains('tip')).indexOf(el)
        const legendIndex = Array.from(graphics.children).indexOf(graphic)
        const label = instance.labels[labelIndex]
        const legend = instance.legends[legendIndex]

        const replaceWord = { ...instance.dataset[legendIndex][labelIndex], legend, label }
        let htmlStr = '<h3 class=\'mb-0\' style=\'text-align:left;color:#333;font-size:1rem;\'>{{label}}</h3><ul class=\'list-unstyled mb-0\' style=\'min-width:180px;color:#828282;font-size:1rem;text-align:left\'><li>{{legend}}<strong style=\'float:right\'>{{v1}}</strong></li></ul>'
        const pattern = ['label', 'legend', 'v1', 'v2', 'v3'].map(word => `{{${word}}}`).join('|')
        htmlStr = htmlStr.replace(new RegExp(pattern, 'g'), function (match) {
          const matchKeyword = match.replace(/{|}/g, '')
          const text = replaceWord[matchKeyword]
          return +text ? d3.format(',')(text) : text
        })
        return htmlStr
      })
    }
    selection.nodes().forEach(function (el, i, a) {
      el.tip = new bootstrap.Tooltip(el, {
        delay
      })
    })
  }
}

class BarChart extends Utility {
  wangleData (json) {
    const vis = super.wangleData(json)
    // prettier-ignore
    const group = vis.labels.map(label => {
      return [label, vis.legends.reduce((acc, legend, i) => {
        const result = json[legend][label].v1
        return result ? acc + result : acc
      }, 0)]
    })
    vis.groups = [group]
    return vis
  }

  bindingPath (vis) {
    vis.graphics
      .selectAll('.graphic')
      .data(this.groups)
      .join(enter => {
        enter
          .append('g')
          .attr('class', 'graphic')
          .attr('fill', vis.color.range()[0])
          .selectAll('rect')
          .data(d => d)
          .join(vis.enter.bind(this), vis.update.bind(this), vis.exit.bind(this))
      })
  }
}


export class VerticalBarChart extends BarChart {
  constructor (container) {
    const defs = { dir: 'vertical', xScale: 'scaleBand', yScale: 'scaleLinear' }
    const args = Object.assign(defs, container)
    super(args)
  }

  wangleData (json) {
    const vis = super.wangleData(json)
    const yTicks = [0, d3.map(vis.groups, d => d3.max(d, v => v[1]))].flat()
    vis.updateTicks(vis, vis.labels, yTicks)
    return vis
  }

  updateTicks (vis, xTicks, yTicks) {
    vis.xScale
      .paddingInner(vis.paddingX)
      .paddingOuter(vis.paddingX / 2)
      .domain(xTicks)
    vis.yScale.domain(yTicks)
    return vis
  }

  enter (enter) {
    const vis = this
    enter
      .append('rect')
      .attr('width', vis.xScale.bandwidth())
      .attr('x', ([label]) => vis.xScale(label))
      .attr('y', vis.height)
      .transition(vis.t)
      .attr('height', ([, val]) => vis.height - vis.yScale(val))
      .attr('y', ([, val]) => vis.yScale(val))
  }

  update (update) {
    const vis = this
    update
      .transition(vis.t)
      .attr('width', vis.xScale.bandwidth())
      .attr('height', ([, val]) => vis.height - vis.yScale(val))
      .attr('x', ([label]) => vis.xScale(label))
      .attr('y', ([, val]) => vis.yScale(val))
  }

  exit (exit) {
    const vis = this
    exit
      .transition(vis.t)
      .attr('width', vis.xScale.bandwidth())
      .attr('height', 0)
      .attr('y', vis.height)
      .remove()
  }
}
export class HorizontalBarChart extends BarChart {
  constructor (container) {
    const defs = { dir: 'horizontal', xScale: 'scaleLinear', yScale: 'scaleBand' }
    const args = Object.assign(defs, container)
    super(args)
  }

  wangleData (json) {
    const vis = super.wangleData(json)
    const xTicks = [0, d3.map(vis.groups, d => d3.max(d, v => v[1]))].flat()
    vis.updateTicks(vis, xTicks, vis.labels)
    return vis
  }

  updateTicks (vis, xTicks, yTicks) {
    vis.xScale.domain(xTicks)
    vis.yScale
      .paddingInner(vis.paddingY)
      .paddingOuter(vis.paddingY / 2)
      .domain(yTicks)
    return vis
  }

  enter (enter) {
    const vis = this
    enter
      .append('rect')
      .attr('height', vis.yScale.bandwidth())
      .attr('y', ([label]) => vis.yScale(label))
      .transition(vis.t)
      .attr('width', ([, val]) => vis.xScale(val))
  }

  update (update) {
    const vis = this
    update
      .transition(vis.t)
      .attr('width', ([label, val]) => vis.xScale(val))
      .attr('height', vis.yScale.bandwidth())
      .attr('x', 0)
      .attr('y', ([label]) => vis.yScale(label))
  }

  exit (exit) {
    const vis = this
    exit
      .transition(vis.t)
      .attr('width', 0)
      .attr('height', vis.yScale.bandwidth())
      .remove()
  }
}
class StackedVerticalBarChart extends StackedChart {
  constructor (container) {
    const defs = { dir: 'vertical', xScale: 'scaleBand', yScale: 'scaleLinear' }
    const args = Object.assign(defs, container)
    super(args)
  }

  wangleData (json) {
    const vis = super.wangleData(json)
    const yTicks = d3.extent(vis.groups.map(([, set]) => set).flat(Infinity))
    vis.updateTicks(vis, vis.labels, yTicks)
    return vis
  }

  updateTicks (vis, xTicks, yTicks) {
    vis.xScale
      .paddingInner(vis.paddingX)
      .paddingOuter(vis.paddingX / 2)
      .domain(xTicks)
    vis.yScale.domain(yTicks)
    return vis
  }

  enter (enter) {
    const vis = this
    enter
      .append('rect')
      .attr('width', vis.xScale.bandwidth())
      .attr('x', ({ data: [label] }) => vis.xScale(label))
      .attr('y', vis.height)
      .transition(vis.t)
      .attr('height', ([lo, hi]) => vis.height - vis.yScale(hi - lo))
      .attr('y', ([, hi]) => vis.yScale(hi))
  }

  update (update) {
    const vis = this
    update
      .transition(vis.t)
      .attr('width', vis.xScale.bandwidth())
      .attr('height', ([lo, hi]) => vis.height - (vis.yScale(hi - lo) ?? vis.height))
      .attr('x', ({ data: [label] }) => vis.xScale(label))
      .attr('y', ([, hi]) => vis.yScale(hi))
  }

  exit (exit) {
    const vis = this
    exit.transition(vis.t).attr('height', 0).remove()
  }

  async exitGroup (g) {
    const vis = this
    await g.transition(vis.t).attr('height', 0).end()
  }
}