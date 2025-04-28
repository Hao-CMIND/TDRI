/* filename => charts.js */
class Tip {
  static createTip (selection, { config } = {}) {
    selection
      .attr('data-bs-html', 'true')
      .attr('data-bs-toggle', 'tooltip')
      .attr('data-bs-placement', 'top')
      .each((d, i, a) => {
        a[i].tip = new $.bootstrap.Tooltip(a[i], config)
      })
  }

  static titleStr (title) {
    return `<h4 class='tip-title'>${title}</h4>`
  }

  static listStr (data) {
    const list = data.map(([label, val]) => `<li><span class='tip-label'>${label}</span><span class='tip-val'>${val}</span></li>`).join('')
    return `<ul class='list-unstyled mb-0'>${list}</ul>`
  }

  static removeTip (selection) {
    selection.nodes().forEach(function (el, i, a) {
      el?.tip?.dispose()
    })
  }

  static updateTip (selection, args) {
    selection
      .attr('data-bs-original-title', null)
      .attr('aria-label', null)
      .call(Tip.removeTip)
      .call(Tip.createTip, args)
  }
}

class Utility {
  constructor ({ dir, svg, graphics, xScale, yScale }) {
    Object.assign(this, svg[dir]({ xScale, yScale })) // initAxis
    graphics.selectAll('.clone').data([]).exit().remove()
    this.graphics = graphics
  }

  get t () {
    return d3.transition().duration(this.dur)
  }

  flatData (json) {
    return Object.entries(json).reduce((arr, [legend, set]) => {
      Object.entries(set).forEach(([label, value]) => arr.push({ label, legend, value }))
      return arr
    }, [])
  }

  wangleData (json) {
    const vis = this
    vis.visUpdated = false
    vis.dataset = Object.values(json).map(set => Object.values(set))
    vis.legends = Object.keys(json)
    vis.labels = Array.from(d3.union(Object.values(json).flatMap(d => Object.keys(d))))
    return this
  }

  updateVis () {
    const vis = this
    if (vis.visUpdated) return
    vis.visUpdated = true
    vis.axisBottom(vis.xAxis.transition(vis.t))
    if (vis.orientation === 'vertical' && vis.xScale.domain().length > 6) {
      vis.xAxis.attr('class', vis.xAxis.attr('class') + ' coor').attr('text-anchor', 'start')
    }
    vis.axisLeft(vis.yAxis.transition(vis.t))
    vis.bindingPath(vis)
    return vis
  }

  destroy () {
    const vis = this
    vis.view.selectAll('.graphics').remove()
    return this
  }
}

class FloatingBarChart extends Utility {
  constructor (container) {
    const defs = { dir: 'vertical', xScale: 'scaleBand', yScale: 'scaleLinear' }
    const args = Object.assign(defs, container)
    super(args)
  }

  wangleData (json) {
    const vis = super.wangleData(json)

    this.groups = Object.entries(json).map(([legend, set]) => {
      return [
        legend,
        Object.entries(set).map(([label, val]) => {
          const v = Object.values(val)
          return [label, [d3.max(v), Math.round(d3.mean(v)), d3.min(v)]]
        })
      ]
    })
    const values = this.groups.flat(Infinity).filter(Number)
    const yTicks = d3.extent(values).map((v, i) => {
      const mean = d3.mean(values) * 0.2
      return i ? v + mean : v - mean
    })

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

  bindingPath (vis) {
    vis.graphics
      .selectAll('.graphic')
      .data(this.groups)
      .join(
        enter => {
          enter
            .append('g')
            .attr('class', 'graphic')
            .attr('fill', ([legend]) => vis.color(legend))
            .selectAll('g')
            .data(([, group]) => group)
            .join(
              enter => {
                const g = enter.append('g')
                  .data(([, set]) => set)
                  .attr('transform', ([label]) => `translate(${vis.xScale(label)},0)`)
                g.append('rect')
                  .attr('y', ([, [, md]]) => vis.yScale(md))
                  .attr('width', vis.xScale.bandwidth())
                  .transition(vis.t)
                  .attr('y', ([, [hi]]) => vis.yScale(hi))
                  .attr('height', ([, [hi, , lo]]) => vis.yScale(lo) - vis.yScale(hi))

                g.append('line')
                  .attr('stroke', '#fff')
                  .attr('stroke-dasharray', 4)
                  .attr('x1', vis.xScale.bandwidth())
                  .attr('y1', ([, [, md]]) => vis.yScale(md))
                  .attr('y2', ([, [, md]]) => vis.yScale(md))

                const textes = ['lo', 'md', 'hi'].forEach((t, i) => {
                  const text = g.append('text')

                  text.attr('class', 'text-' + t)
                    .attr('x', vis.xScale.bandwidth() / 2)
                    .attr('y', ([, v]) => vis.yScale(v[i]) + (i < 2 ? -5 : 15))
                    .attr('fill', i === 1 ? '#888' : '#000')
                    .text(([, v]) => d3.format(',')(v[i]))
                })
              }
            )
        },
        update => {
          update
            .selectAll('g')
            .data(([, group]) => group)
            .join(
              enter => {
                const g = enter.append('g')
                  .data(([, set]) => set)
                  .attr('transform', ([label]) => `translate(${vis.xScale(label)},0)`)
                g.append('rect')
                  .attr('y', ([, [, md]]) => vis.yScale(md))
                  .attr('width', vis.xScale.bandwidth())
                  .transition(vis.t)
                  .attr('y', ([, [hi]]) => vis.yScale(hi))
                  .attr('height', ([, [hi, , lo]]) => vis.yScale(lo) - vis.yScale(hi))

                g.append('line')
                  .attr('stroke', '#fff')
                  .attr('stroke-dasharray', 4)
                  .attr('x1', vis.xScale.bandwidth())
                  .attr('y1', ([, [, md]]) => vis.yScale(md))
                  .attr('y2', ([, [, md]]) => vis.yScale(md))

                const textes = ['lo', 'md', 'hi'].forEach((t, i) => {
                  const text = g.append('text')
                  text.attr('class', 'text-' + t)
                    .attr('x', vis.xScale.bandwidth() / 2)
                    .attr('y', ([, v]) => vis.yScale(v[i]) + (i < 2 ? -5 : 15))
                    .attr('fill', i === 1 ? '#888' : '#000')
                    .text(([, v]) => d3.format(',')(v[i]))
                })
              },
              update => {
                const g = update
                  .data(([, set]) => set)

                g.transition(vis.t)
                  .attr('transform', ([label]) => `translate(${vis.xScale(label)},0)`)

                g.select('rect')
                  .transition(vis.t)
                  .attr('width', vis.xScale.bandwidth())
                  .attr('height', ([, [hi, , lo]]) => vis.yScale(lo) - vis.yScale(hi))
                  .attr('y', ([, [hi]]) => vis.yScale(hi))

                g.select('line')
                  .attr('stroke', '#fff')
                  .attr('stroke-dasharray', 4)
                  .transition(vis.t)
                  .attr('x1', vis.xScale.bandwidth())
                  .attr('y1', ([, [, md]]) => vis.yScale(md))
                  .attr('y2', ([, [, md]]) => vis.yScale(md))

                const textes = ['lo', 'md', 'hi'].forEach((t, i) => {
                  g.select('class', 'text-' + t)
                    .attr('x', vis.xScale.bandwidth() / 2)
                    .attr('y', ([, v]) => vis.yScale(v[i]) + (i < 2 ? -5 : 15))
                    .attr('fill', i === 1 ? '#888' : '#000')
                    .text(([, v]) => d3.format(',')(v[i]))
                })
              },
              exit => {
                exit.remove()
              }
            )
        },
        exit => {
          exit.remove()
        }
      )
  }
}

class StackedChart extends Utility {
  constructor (args) {
    // const args = Object.assign(container, dir, scales)
    super(args)
    const { stackOrder, stackOffset } = args
    this.mode({ stackOrder, stackOffset })
  }

  get stack () {
    const vis = this
    return d3
      .stack()
      .keys(vis.legends)
      .value(([, group], legend) => group.get(legend).value.v1)
      .order(d3[vis.stackOrder])
      .offset(d3[vis.stackOffset])
  }

  mode ({ stackOrder = 'stackOrderNone', stackOffset = 'stackOffsetNone' } = {}) {
    this.stackOrder = stackOrder
    this.stackOffset = stackOffset
  }

  wangleData (json) {
    const vis = super.wangleData(json)
    // prettier-ignore
    vis.groups = vis.stack(d3.index(vis.flatData(json), d => d.label, d => d.legend))
      .map(stack => {
        stack.forEach((d, i) => {
          d[2] = stack.key
        })
        return [stack.key, stack]
      })
    return vis
  }

  bindingPath (vis) {
    vis.graphics
      .selectAll('.graphic')
      .data(vis.groups)
      .join(
        enter => {
          enter
            .append('g')
            .attr('class', 'graphic')
            .attr('fill', ([legend]) => legend.match(/其他/) ? this.theme.at(-1) : this.color(legend))
            .selectAll('rect')
            .data(([, set]) => set)
            .join(vis.enter.bind(vis))
        },
        update => {
          update
            .transition(vis.t)
            .attr('fill', ([legend]) => legend.match(/其他/) ? this.theme.at(-1) : this.color(legend))
          update
            .selectAll('rect')
            .data(([, set]) => set)
            .join(vis.enter.bind(vis), vis.update.bind(vis), vis.exit.bind(vis))
        },
        async exit => {
          exit.transition(vis.t).attr('fill', '#fff').attr('stroke', '#fff')
          const update = exit.selectAll('rect').data(d => d)
          await vis.exitGroup(update)
          update.remove()
          exit.remove()
        }
      )
  }
}

class StackedHorizontalBarChart extends StackedChart {
  constructor (container) {
    const defs = { dir: 'horizontal', xScale: 'scaleLinear', yScale: 'scaleBand' }
    const args = Object.assign(defs, container)
    super(args)
  }

  wangleData (json) {
    const vis = super.wangleData(json)
    const xTicks = d3.extent(vis.groups.map(([, set]) => set).flat(Infinity))
    vis.updateTicks(vis, xTicks, vis.labels)
    return vis
  }

  updateTicks (vis, xTicks, yTicks) {
    vis.xScale.domain(xTicks)

    const maxTicks = d3.max(vis.xScale.ticks())
    // console.log(vis.percentageMode, 'maxTicks', maxTicks, (maxTicks > 1 && maxTicks < 10))

    if (!vis.percentageMode && (maxTicks >= 1 && maxTicks < 10)) {
      vis.axisBottom.ticks(maxTicks, 'd')
    }

    vis.yScale
      .paddingInner(vis.paddingY)
      .paddingOuter(vis.paddingY / 2)
      .domain(yTicks)

    return vis
  }

  enter (enter) {
    const vis = this
    const enterEl = enter
      .append('rect')
      .attr('height', vis.yScale.bandwidth())
      .attr('y', ({ data: [label] }) => vis.yScale(label))

      .attr('title', (d) => {
        const [lo, hi, label] = d
        const { data: [legend, dataMap] } = d

        const { v1 } = dataMap.get(label).value

        let tipItemTitle = legend

        const unitNode = vis.view.select('[data-unit]').node()
        if (unitNode) {
          tipItemTitle += (' ' + unitNode.dataset.unit)
        }
        return Tip.titleStr(label) + Tip.listStr([[tipItemTitle, d3.format(',')(v1)]])
      })
    enterEl.transition(vis.t)
      .attr('width', ([lo, hi]) => vis.xScale(hi - lo))
      .attr('x', ([lo]) => vis.xScale(lo))
    enterEl.call(Tip.createTip)
  }

  update (update) {
    const vis = this
    update
      .attr('title', (d) => {
        const [lo, hi, label] = d
        const { data: [legend, dataMap] } = d
        if (this.percentageMode) {
          return Tip.titleStr(label) + Tip.listStr([[legend, d3.format('.1%')(hi - lo)]])
        }

        const { v1 } = dataMap.get(label).value
        return Tip.titleStr(label) + Tip.listStr([[legend, d3.format(',')(v1)]])
      })
      .transition(vis.t)
      .attr('width', ([lo, hi]) => vis.xScale(hi - lo))
      .attr('height', vis.yScale.bandwidth())
      .attr('x', ([lo]) => vis.xScale(lo))
      .attr('y', ({ data: [label] }) => vis.yScale(label))

    update.call(Tip.updateTip)
  }

  exit (exit) {
    const vis = this
    exit.call(Tip.removeTip).transition(vis.t).attr('width', 0).remove()
  }

  async exitGroup (g) {
    const vis = this
    await g.transition(vis.t).attr('width', 0).end()
  }
}
class GroupedChart extends Utility {
  wangleData (json) {
    const vis = super.wangleData(json)
    // prettier-ignore
    vis.groups = Object.entries(json).map(([legend, set]) => {
      const entries = Object.entries(set)
      entries.forEach(entry => entry.push(legend))
      return [legend, entries]
    })
    return this
  }

  bindingPath (vis) {
    const pathUpdate = vis.graphics
      .selectAll('.graphic')
      .data(vis.groups)
      .join(
        enter => {
          enter
            .append('g')
            .attr('class', 'graphic')
            .attr('fill', ([legend]) => legend.match(/其他/) ? this.theme.at(-1) : this.color(legend))
            .selectAll('rect')
            .data(([, set]) => set)
            .join(enter => vis.enter(enter))
        },
        update => {
          update
            .transition(vis.t)
            .attr('fill', ([legend]) => legend.match(/其他/) ? this.theme.at(-1) : this.color(legend))
          update
            .selectAll('rect')
            .data(([, set]) => set)
            .join(
              enter => vis.enter(enter),
              update => vis.update(update),
              vis.exit.bind(vis)
            )
        },
        async exit => {
          exit.transition(vis.t).attr('fill', '#fff').attr('stroke', '#fff')
          const update = exit.selectAll('rect').data(d => d)
          await vis.exitGroup(update)
          update.remove()
          exit.remove()
        }
      )
  }
}
class GroupedVerticalBarChart extends GroupedChart {
  constructor (container) {
    const defs = { dir: 'vertical', xScale: 'scaleBand', yScale: 'scaleLinear' }
    const args = Object.assign(container, defs)
    super(args)
  }

  wangleData (json) {
    const vis = super.wangleData(json)
    const yTicks = [0, d3.max(vis.dataset.flat(Infinity), d => d.v1 ?? 0)]
    vis.updateTicks(vis, vis.labels, yTicks, vis.legends)
    return vis
  }

  updateTicks (vis, xTicks, yTicks, legends) {
    vis.xScale.paddingOuter(vis.paddingX / 8).domain(xTicks)
    vis.yScale.domain(yTicks)
    vis.gScale.range([0, vis.xScale.bandwidth()]).domain(legends)
    return vis
  }

  enter (enter) {
    const vis = this
    const enterRect = enter
      .append('rect')
      .attr('width', vis.gScale.bandwidth())
      .attr('x', ([label, , legend]) => vis.xScale(label) + vis.gScale(legend))
      .attr('y', vis.height)
      .attr('title', ([label, { v1 }, legend]) => {
        return Tip.titleStr(label) + Tip.listStr([[legend, d3.format(',')(v1)]])
      })
    enterRect.transition(vis.t)
      .attr('height', ([, value]) => vis.height - vis.yScale(value.v1 ?? 0))
      .attr('y', ([, value]) => vis.yScale(value.v1 ?? 0))

    enterRect.call(Tip.createTip)
  }

  update (update) {
    const vis = this

    update.attr('title', (d) => {
      const [label, { v1 }, legend] = d
      const str = Tip.titleStr(label) + Tip.listStr([[legend, d3.format(',')(v1)]])
      console.log('update', str)
      return str
    })
      .transition(vis.t)
      .attr('width', vis.gScale.bandwidth())
      .attr('height', ([, value]) => vis.height - vis.yScale(value.v1 ?? 0))
      .attr('x', ([label,, legend]) => vis.xScale(label) + vis.gScale(legend))
      .attr('y', ([, value]) => vis.yScale(value.v1 ?? 0))

    update.call(Tip.updateTip)
  }

  exit (exit) {
    const vis = this
    exit.call(Tip.removeTip).transition(vis.t).attr('height', 0).remove()
  }

  async exitGroup (g) {
    const vis = this
    await g.transition(vis.t).attr('height', 0).end()
  }
}
class GroupedHorizontalBarChart extends GroupedChart {
  constructor (container) {
    const defs = { dir: 'horizontal', xScale: 'scaleLinear', yScale: 'scaleBand' }
    const args = Object.assign(container, defs)
    super(args)
  }

  wangleData (json) {
    const vis = super.wangleData(json)
    const xTicks = [0, d3.max(vis.dataset.flat(Infinity), d => d.v1 ?? 0)]
    vis.updateTicks(vis, xTicks, vis.labels, vis.legends)
    return vis
  }

  updateTicks (vis, xTicks, yTicks, legends) {
    vis.xScale.domain(xTicks)

    const maxTicks = d3.max(vis.xScale.ticks())
    if ((vis.percentageMode && maxTicks >= 1 && maxTicks < 10)) {
      vis.axisBottom.ticks(maxTicks, 'd')
    }

    vis.yScale.paddingOuter(vis.paddingY / 8).domain(yTicks)
    vis.gScale.range([0, vis.yScale.bandwidth()]).domain(legends)
    return vis
  }

  enter (enter) {
    const vis = this
    enter
      .append('rect')

      .attr('height', vis.gScale.bandwidth())
      .attr('y', ([label, , legend]) => vis.yScale(label) + vis.gScale(legend))
      .transition(vis.t)
      .attr('width', ([, value]) => vis.xScale(value.v1 ?? 0))
  }

  update (update) {
    const vis = this

    update.attr('title', (d) => {
      const [label, { v1 }, legend] = d

      return Tip.titleStr(label) + Tip.listStr([[legend, d3.format(vis.percentageMode ? '.1%' : ',')(v1)]])
    })

      .transition(vis.t)
      .attr('width', ([, value]) => vis.xScale(value.v1 ?? 0))
      .attr('height', vis.gScale.bandwidth())
      .attr('x', 0)
      .attr('y', ([label, , legend]) => vis.yScale(label) + vis.gScale(legend))

    update.call(Tip.updateTip)
  }

  exit (exit) {
    const vis = this
    exit.call(Tip.removeTip).transition(vis.t).attr('width', 0).remove()
  }

  async exitGroup (g) {
    const vis = this
    await g.transition(vis.t).attr('width', 0).end()
  }
}

class LineChart extends Utility {
  constructor (container) {
    const defs = { dir: 'vertical', xScale: 'scaleTime', yScale: 'scaleLinear' }
    const args = Object.assign(defs, container)
    super(args)
  }

  wangleData (json) {
    const vis = super.wangleData(json)
    // prettier-ignore
    vis.groups = Object.entries(json).map(([legend, set]) => {
      return [legend, Object.entries(set).map(([label, val]) => {
        return { x: label, y: val, legend }
      })
      ]
    })
    const xTicks =
      this.axisType.x === 'string'
        ? vis.labels
        : d3.extent(vis.labels, d => vis.timeParse(d))
    const yTicks = [0, d3.max(vis.dataset.flat(Infinity), d => d.v1)]
    vis.updateTicks(vis, xTicks, yTicks)
    return vis
  }

  updateTicks (vis, xTicks, yTicks) {
    vis.xScale.domain(xTicks)
    vis.yScale.domain(yTicks)
    return vis
  }

  get dfnGenerator () {
    const vis = this
    return vis.generator.defined(d => d.y.v1 === 0 || Boolean(d.y.v1))
  }

  get timeParse () {
    return d3.timeParse('%Y-%m')
  }

  pointX (d) {
    const vis = this
    const offsetX = vis.xScale?.bandwidth?.() / 2 || 0
    let { x } = d
    if (vis.axisType.x === 'date') {
      x = vis.timeParse(d.x)
    }
    return vis.xScale(x) + offsetX
  }

  get generator () {
    const vis = this
    return d3
      .line()
      .x(vis.pointX.bind(this))
      .y(d => vis.yScale(d.y.v1))
  }

  bindingPath (vis) {
    vis.graphics
      .selectAll('.graphic')
      .data(vis.groups)
      .join(enter => {
        const g = enter
          .append('g')
          .attr('class', 'graphic')
          .attr('stroke', ([legend]) => vis.color(legend))
          .attr('fill', ([legend]) => vis.color(legend))

        const path = g.append('path').attr('fill', 'none')

        path
          .clone()
          .attr('stroke-width', 2)
          .datum(([, set]) => set)
          .attr('d', vis.generator).attr('stroke-dasharray', function () {
            const len = this.getTotalLength()
            return `0 ${len}`
          }).transition(vis.t).attr('stroke-dasharray', function () {
            const len = this.getTotalLength()
            return `${len} ${len}`
          })

        path
          .datum(([, set]) => set)
          .attr('stroke', '#e0e0e0')
          .attr('stroke-dasharray', 2)
          .attr('d', vis.dfnGenerator)

        g.selectAll('circle')
          .data(([, set]) => set)
          .join(enter => {
            enter
              .append('circle')
              .attr('cx', vis.pointX.bind(this))
              .attr('cy', d => vis.yScale(d.y.v1))
              .attr('r', 5)
              .attr('stroke', '#e0e0e0')
          })
      })
    // .join(enter=> vis.enter(enter) , update=>  vis.update(update),exit=> vis.exit(exit))
  }
}

class PredictLineChart extends LineChart {
  bindingPath (vis) {
    vis.graphics
      .selectAll('.graphic')
      .data(vis.groups)
      .join(enter => {
        const g = enter
          .append('g')
          .attr('class', 'graphic')
          .attr('stroke', ([legend]) => vis.color(legend))
          .attr('fill', ([legend]) => vis.color(legend))

        const path = g.append('path').attr('fill', 'none')

        path
          .clone()
          .attr('stroke-width', 2)
          .datum(([, set]) => set.slice(0, 12))
          .attr('d', vis.generator)
          .attr('stroke-dasharray', function () {
            const len = this.getTotalLength()
            return `0 ${len}`
          }).transition(vis.t).attr('stroke-dasharray', function () {
            const len = this.getTotalLength()
            return `${len} ${len}`
          })

        path
          .datum(([, set]) => set)
          .attr('stroke-dasharray', 2)
          .attr('d', vis.dfnGenerator).attr('opacity', 0)
          .transition(vis.t).delay(700)
          .attr('opacity', 1)

        g.selectAll('circle')
          .data(([, set]) => set)
          .join(enter => {
            const enterCircle = enter
              .append('circle')
              .attr('cx', vis.pointX.bind(this))
              .attr('cy', d => vis.yScale(d.y.v1))
              .attr('r', 5)
              .attr('opacity', 0)
              .attr('title', ({ x, y: { v1 }, legend }) => {
                return Tip.titleStr(legend) + Tip.listStr([['時間', x], ['搜尋量', v1]])
              })
            enterCircle.transition(vis.t)
              .delay((v, i) => i * 150)
              .attr('opacity', 1)
              .attr('stroke', '#e0e0e0')
            enterCircle.call(Tip.createTip)
          }, update => {}, exit => {})
      })
  }
}

class SlopeChart extends LineChart {
  constructor (container) {
    const defs = { xScale: 'scaleBand', yScale: 'scaleLinear' }
    const args = Object.assign(defs, container)
    super(args)
  }

  wangleData (json) {
    super.wangleData(json)
    this.groups = this.groups.map(([legend, set]) => {
      const slopeSet = set.filter((d, i, a) => i === 0 || i === a.length - 1)
      return [legend, set, slopeSet]
    })
  }

  bindingPath (vis) {
    vis.graphics
      .selectAll('.graphic')
      .data(vis.groups)
      .join(
        enter => {
          const g = enter
            .append('g')
            .attr('class', 'graphic')
            .attr('stroke', ([legend]) => vis.color(legend))
            .attr('fill', ([legend]) => vis.color(legend))
          const path = g.append('path')
            .attr('fill', 'none')

          path
            .clone()
            .datum(([, set]) => set)
            .attr('stroke-opacity', 0.3)
            .attr('stroke-dasharray', 2)
            .attr('d', vis.dfnGenerator)

          path
            .datum(([, , slopeset]) => slopeset)
            .attr('stroke-width', 2)
            .attr('d', vis.generator)

          g.selectAll('circle')
            .data(([, , slopeset]) => slopeset)
            .join(enter => {
              const enterCircle = enter
                .append('circle')
                .attr('cx', d => vis.xScale(d.x) + vis.xScale.bandwidth() / 2)
                .attr('cy', d => vis.yScale(d.y.v1))
                .attr('r', 5)
                .attr('title', (d, i) => {
                  const { x, legend, y: { v1, v2 } } = d

                  const textList = [
                    ['上市年月', x], ['產品數量佔比', v1 + '%']
                  ]

                  if (v2?.avg_price) {
                    textList.push(['平均售價', d3.format(',')(v2.avg_price)])
                  }
                  let str = Tip.titleStr(legend) + Tip.listStr(textList)

                  if (v2?.image_url_1) {
                    str += `<img src="${v2.image_url_1}" alt="代表產品"  width='150'/>`
                  }
                  return str
                })

              enterCircle.call(Tip.createTip)
            })
        })
      // .join(enter=> vis.enter(enter) , update=>  vis.update(update),exit=> vis.exit(exit))
  }
}

class PieChart {
  constructor ({ svg, graphics }) {
    Object.assign(this, svg.horizontal({ xScale: 'scaleBand', yScale: 'scaleBand' }))
    this.yScale.range([0, d3.min(this.viewport) / 2])
    this.graphics = graphics
    graphics.selectAll('.clone').data([]).exit().remove()
  }

  flatData (json) {
    return Object.entries(json).reduce((arr, [legend, set]) => {
      Object.entries(set).forEach(([label, value]) => arr.push({ label, legend, value }))
      return arr
    }, [])
  }

  wangleData (json) {
    const vis = this
    vis.dataset = Object.values(json).map(set => Object.values(set))
    vis.legends = Object.keys(json)
    vis.labels = Array.from(d3.union(Object.values(json).flatMap(d => Object.keys(d))))
    const sum = vis.labels.reduce((set, label) => Object.assign(set, { [label]: vis.legends.reduce((acc, legend) => acc + json[legend][label].v1, 0) }),
      {})
    Object.entries(json).forEach(([legend, set]) => {
      Object.entries(set).forEach(([label, { v1 }]) => {
        json[legend][label].v2 = v1 / sum[label]
      })
    })
    vis.sum = sum
    vis.updateTicks(vis, vis.legends, vis.labels)
    const groupByLabel = d3.group(vis.flatData(json), d => d.label)
    const flatGroup = d3.map(groupByLabel, ([, set]) => set
      .filter(d => d.value.v1)
      .map(d => {
        return Object.assign(d, {
          innerRadius: vis.yScale.bandwidth() / 1.75,
          outerRadius: vis.yScale.bandwidth()
        })
      })
    )
      .flatMap(vis.pie)
    vis.groups = d3.group(flatGroup, d => d.data.legend)
    return this
  }

  updateTicks (vis, xTicks, yTicks) {
    vis.yScale.domain(yTicks)
    return vis
  }

  get arc () {
    const vis = this
    return d3
      .arc()
      .innerRadius(d => d.data.innerRadius)
      .outerRadius(d => d.data.outerRadius)
  }

  get pie () {
    return d3.pie().value(v => v.value.v1)
  }

  get viewport () {
    return [this.width, this.height]
  }

  center (offset = [0, 0]) {
    return d3.map(this.viewport, (b, i) => b / 2 + offset[i])
  }

  bindingPath (vis) {
    console.log(vis.groups)
    const pathUpdate = vis.graphics.selectAll('.graphic').data(vis.groups)

    const enterPath = pathUpdate
      .enter()
      .append('path')
      .datum(d => d)
      .attr('class', 'graphic')
      .attr('transform', `translate(${vis.center()})`)
      .attr('d', ([, set]) => set.map(vis.arc).join(' '))
      .attr('fill', ([legend]) => vis.color(legend))
      .attr('stroke', ([legend]) => vis.color(legend))
      .attr('title', ([legend, data]) => {
        const { label, value: { v1, v2 } } = data[0].data
        return Tip.titleStr(legend) + Tip.listStr([[label, d3.format(',')(v1)], ['市占率', d3.format('.2%')(v2)]])
      })
    enterPath.call(Tip.createTip)
    pathUpdate
      .enter()
      .append('text')
      .attr('x', ([, set]) => {
        const [x] = set.map(vis.arc.centroid)[0]
        return x + vis.center()[0]
      })
      .attr('y', ([, set]) => {
        const [, y] = set.map(vis.arc.centroid)[0]
        return y + vis.center()[1]
      })
      .attr('fill', '#fff')
      .text(([, [{ data: { value: { v2 } } }]]) => (v2 > 0.03 ? d3.format('.2%')(v2) : ''))

    vis.graphics
      .append('text')
      .attr('font-size', 48)
      .attr('font-weight', 700)
      .attr('alignment-baseline', 'middle')
      .attr('transform', `translate(${vis.center()})`)
      .text(d3.format('.3s')(Object.values(vis.sum)[0]))
  }

  updateVis () {
    const vis = this
    vis.bindingPath(vis)
    return vis
  }
}
class RadarChart {
  constructor ({ svg, graphics }) {
    Object.assign(this, svg.horizontal({ xScale: 'scaleBand', yScale: 'scaleLinear' }))
    const vis = this
    vis.vmin = d3.min(vis.viewport) / 2
    vis.xScale.range([-Math.PI * 0.5, Math.PI * 1.5])
    vis.yScale.range([vis.vmin, 0])
    vis.graphics = graphics.attr('transform', `translate(${vis.center()[0]}, ${vis.offset.y + vis.vmin})`)

    graphics.selectAll('.clone').data([]).exit().remove()
  }

  wangleData (json) {
    const vis = this

    vis.dataset = Object.values(json).map(set => Object.values(set))

    const max = d3.max(vis.dataset.flat(Infinity).map(({ v1 }) => v1).map(v => Math.ceil(v / 5) * 5))

    vis.legends = Object.keys(json)
    vis.labels = Array.from(d3.union(Object.values(json).flatMap(d => Object.keys(d))))

    vis.groups = Object.entries(json).map(([legend, set]) => {
      const data = Object.entries(set).map(([label, values]) => {
        return { legend, angle: label, radius: values.v1, comments: values.comments }
      })
      return [legend, data]
    })
    this.updateTicks(vis, vis.labels, [max, 0])
  }

  get arc () {
    const vis = this
    return d3
      .arc({ startAngle: 0, endAngle: Math.PI / 2 })
      .innerRadius(d => vis.yScale(d - 10))
      .outerRadius(d => vis.yScale(d))
      .startAngle(0)
      .endAngle(Math.PI * 2)
  }

  get radialLine () {
    return d3
      .lineRadial()
      .angle(d => this.xScale(d.angle) + Math.PI / 2)
      .radius(d => this.yScale(d.radius))
      .curve(d3.curveLinearClosed)
  }

  get viewport () {
    return [this.width, this.height]
  }

  updateTicks (vis, xTicks, yTicks) {
    vis.xScale.domain(xTicks)
    vis.yScale.domain(yTicks)
    vis.createXAxis(vis).createYAxis(vis, yTicks)
    return this
  }

  updateXAxis (vis, text, line) {
    text
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'central')
      .attr('x', d => Math.cos(vis.xScale(d)) * (vis.vmin + 16))
      .attr('y', d => Math.sin(vis.xScale(d)) * (vis.vmin + 16))
      .text(d => d)
    line
      .attr('stroke', '#e0e0e0')
      .attr('x2', d => Math.cos(vis.xScale(d)) * (vis.vmin))
      .attr('y2', d => Math.sin(vis.xScale(d)) * (vis.vmin))
  }

  createXAxis (vis) {
    const xTicksValue = vis.labels
    const g = vis.xAxis.attr('transform', `translate(${vis.center()[0]}, ${vis.offset.y + vis.vmin})`)
    const joinG = g
      .selectAll('.x-tick')
      .data(xTicksValue)
      .join(enter => {
        const group = enter.append('g').attr('class', 'x-tick')
        vis.updateXAxis(vis,
          group.append('text'),
          group.append('line')
        )
      },
      update => {
        const group = update
        vis.updateXAxis(vis,
          group.select('text'),
          group.select('line')
        )
      }, exit => {
        exit.remove()
      }
      )

    return vis
  }

  createYAxis (vis, [max, min]) {
    const yTickValues = Array.from({ length: 5 }, (v, i) => max * (5 - i) / 5)
    const g = vis.yAxis.attr('transform', `translate(${vis.center()[0]}, ${vis.offset.y + vis.vmin})`)

    g.selectAll('path')
      .data(yTickValues)
      .join('path')
      .attr('fill', (d, i) => (i % 2 ? '#fff' : '#fafafa'))
      .attr('stroke', '#e0e0e0')
      .attr('d', vis.arc)
    g.selectAll('text')
      .data(yTickValues)
      .join('text')
      .text(d => d)
      .attr('font-size', 12)
      .attr('y', d => -vis.yScale(d))
    return vis
  }

  center (offset = [0, 0]) {
    return d3.map(this.viewport, (b, i) => b / 2 + offset[i])
  }

  bindingPath (vis) {
    const g = vis.graphics
      .selectAll('.graphic')
      .data(vis.groups)
      .join(enter => {
        const g = enter.append('g').attr('class', 'graphic')
          .attr('fill', ([legend]) => {
            const fill = vis.color(legend)
            return fill === 'none' ? '#dcdcdc' : fill
          })

          .attr('stroke', ([legend]) => {
            const stroke = vis.color(legend)
            return stroke === 'none' ? '#dcdcdc' : stroke
          })

        g.append('path')
          .datum(([, set]) => set)
          .attr('fill-opacity', 0.5)
          .attr('d', vis.radialLine)

        g.selectAll('circle')
          .data(([, set]) => set)
          .join(enter => {
            const circle = enter
              .append('circle')
              .attr('title', d => `<h3 class='mb-0' style='text-align:left;color:#333;font-size:1rem;'>${d.legend}</h3><p>原因 <strong class='fl-right'>${d.angle}</strong></p><p class='mt-0 mb-2'>程度<strong class='fl-right'>${d.radius}</strong></p><ul class='list-unstyled mb-0 popover-list-link' style='min-width:180px;color:#828282;font-size:1rem;text-align:left'>${d.comments.map(({ comments, url }) => `<li><a href='${url}' target='_blank'>${comments.slice(0, 10)}</a></li>`).join('')}</ul>`)

              .attr('cx', d => Math.cos(vis.xScale(d.angle)) * vis.yScale(d.radius))
              .attr('cy', d => Math.sin(vis.xScale(d.angle)) * vis.yScale(d.radius))
              .attr('r', 5)
              .attr('stroke', '#fff')
            circle.call(Tip.createTip)
          })
      }, update => {
        update.attr('fill', ([legend]) => {
          const fill = vis.color(legend)
          return fill === 'none' ? '#dcdcdc' : fill
        })
          .attr('stroke', ([legend]) => {
            const stroke = vis.color(legend)
            return stroke === 'none' ? '#dcdcdc' : stroke
          })
        update.select('path')
          .datum(([, set]) => set)
          .attr('fill-opacity', 0.5)
          .attr('d', vis.radialLine)

        update.selectAll('circle')
          .data(([, set]) => set)
          .join(enter => {
            const circle = enter
              .append('circle')
              .attr('title', d => `<h3 class='mb-0' style='text-align:left;color:#333;font-size:1rem;'>${d.legend}</h3><p>原因 <strong class='fl-right'>${d.angle}</strong></p><p class='mt-0 mb-2'>程度<strong class='fl-right'>${d.radius}</strong></p><ul class='list-unstyled mb-0 popover-list-link' style='min-width:180px;color:#828282;font-size:1rem;text-align:left'>${d.comments.map(({ comments, url }) => `<li><a href='${url}' target='_blank'>${comments.slice(0, 10)}</a></li>`).join('')}</ul>`)

              .attr('cx', d => Math.cos(vis.xScale(d.angle)) * vis.yScale(d.radius))
              .attr('cy', d => Math.sin(vis.xScale(d.angle)) * vis.yScale(d.radius))
              .attr('r', 5)
              .attr('stroke', '#fff')

            circle.call(Tip.createTip)
          },
          update => {
            const circle = update.attr('title', d => `<h3 class='mb-0' style='text-align:left;color:#333;font-size:1rem;'>${d.legend}</h3><p>原因 <strong class='fl-right'>${d.angle}</strong></p><p class='mt-0 mb-2'>程度<strong class='fl-right'>${d.radius}</strong></p><ul class='list-unstyled mb-0 popover-list-link' style='min-width:180px;color:#828282;font-size:1rem;text-align:left'>${d.comments.map(({ comments, url }) => `<li><a href='${url}' target='_blank'>${comments.slice(0, 10)}</a></li>`).join('')}</ul>`)

              .attr('cx', d => Math.cos(vis.xScale(d.angle)) * vis.yScale(d.radius))
              .attr('cy', d => Math.sin(vis.xScale(d.angle)) * vis.yScale(d.radius))

            circle.call(Tip.updateTip)
          },
          exit => {
            exit.call(Tip.removeTip).remove()
          })
      }, exit => {
        exit.remove()
      })
  }

  updateVis () {
    const vis = this

    console.log(vis.yScale.domain())

    vis.bindingPath(vis)
    return this
  }
}
class HeatmapChart extends Utility {
  constructor (container) {
    const defs = { dir: 'vertical', xScale: 'scaleBand', yScale: 'scaleBand' }
    const args = Object.assign(defs, container)
    super(args)
  }

  wangleData (json) {
    const vis = this
    // vis.dataset = Object.values(json).map(set => Object.values(set))
    vis.legends = Object.keys(json)
    vis.labels = Array.from(d3.union(Object.values(json).flatMap(d => Object.keys(d))))
    vis.groups = d3.group(this.flatData(json), d => Math.round(d.value?.v1 ?? 0 / 100) / 100)
    vis.updateTicks(vis, vis.labels, vis.legends)
    return vis
  }

  updateTicks (vis, xTicks, yTicks) {
    vis.xScale.domain(xTicks)
    vis.yScale.domain(yTicks)
    return vis
  }

  update (g) {
    const vis = this
    g.attr('width', vis.xScale.bandwidth())
      .attr('height', vis.yScale.bandwidth())
      .attr('x', ({ label }) => vis.xScale(label))
      .attr('y', ({ legend }) => vis.yScale(legend))
      .attr('rx', 0)
      .attr('ry', 0)
      .attr('title', (d) => {
        const { label, legend, value } = d
        const { v1, v2: { v, name }, v3 } = value

        const textList = [['產品數量', d3.format(',')(v1) + '個']]

        if (v3?.avg_price) {
          textList.push(['平均價格', d3.format(',')(v3.avg_price)])
        }

        let str = Tip.titleStr(label + 'x' + legend) + Tip.listStr(textList)

        if (v3?.image) {
          str += `<a class='t-blue' href=${v3.url} target='_blank' ><img src="${v3.image}" alt="代表產品"  width='150'/></a> `
        }

        return str
      })
    g.call(Tip.createTip)
    return g
  }

  updateText (g) {
    const vis = this
    return g
      .attr('x', ({ label }) => vis.xScale(label) + vis.xScale.bandwidth() / 2)
      .attr('y', ({ legend }) => vis.yScale(legend) + vis.yScale.bandwidth() / 2)
      .attr('fill', ({ value }) => value.v1 >= 60 ? '#fff' : '#000')
      .text(({ value }) => value.v1)
  }

  bindingPath (vis) {
    const color = d3.interpolateRgb('white', vis.color.range()[0])
    vis.graphics
      .selectAll('.graphic')
      .data(vis.groups)
      .join(
        enter => {
          const g = enter
            .append('g')
            .attr('class', 'graphic')
            .attr('fill', ([val]) => color(val))

          g.selectAll('rect')
            .data(([, set]) => set)
            .join(enter => vis.update(enter.append('rect')))

          g.selectAll('text').data(([, set]) => set)
            .join(enter => vis.updateText(enter.append('text')))
        },
        update => {
          const g = update
          g.selectAll('rect')
            .data(([, set]) => set)
            .join(
              enter => vis.update(enter.append('rect')),
              update => vis.update(update),
              exit => exit.remove()
            )
          g.selectAll('text')
            .data(([, set]) => set)
            .join(
              enter => vis.updateText(enter.append('text')),
              update => vis.updateText(update),
              exit => exit.remove()
            )
          g.transition(vis.t).attr('fill', ([val]) => color(val))
        },
        exit => exit.remove()
      )
  }

  updateVis () {
    const vis = this
    super.updateVis()
    vis.view.select('.legends').attr('opacity', '1')
    vis.view.select('.graphics').selectAll('text').attr('opacity', '1')
    return this
  }
}

class RoundHeatmapChart extends Utility {
  constructor (container) {
    const defs = { dir: 'vertical', xScale: 'scaleBand', yScale: 'scaleBand' }
    const args = Object.assign(defs, container)
    super(args)
  }

  wangleData (json) {
    const vis = this
    // vis.dataset = Object.values(json).map(set => Object.values(set))

    vis.legends = Object.keys(json)
    vis.labels = Array.from(d3.union(Object.values(json).flatMap(d => Object.keys(d))))
    vis.groups = d3.group(this.flatData(json), d => Math.round(d.value?.v1 ?? 0 / 100) / 100)
    vis.updateTicks(vis, vis.labels, vis.legends)
    return vis
  }

  updateTicks (vis, xTicks, yTicks) {
    vis.xScale.domain(xTicks)
    vis.yScale.domain(yTicks)
    return vis
  }

  update (g) {
    const vis = this

    g
      .attr('r', (d) => {
        return d3.min([vis.xScale.bandwidth(), vis.yScale.bandwidth()]) / 2
      })
      .attr('cx', ({ label }) => vis.xScale(label) + vis.xScale.bandwidth() / 2)
      .attr('cy', ({ legend }) => vis.yScale(legend) + vis.yScale.bandwidth() / 2).attr('title', ({ label, legend, value }) => {
        const { v1, v2 } = value
        return Tip.titleStr(label) + Tip.listStr([[legend, d3.format(',')(v1)]])
      })
    g.call(Tip.createTip)

    return g
  }

  updateText (g) {
    const vis = this
    return g
      .attr('x', ({ label }) => vis.xScale(label) + vis.xScale.bandwidth() / 2)
      .attr('y', ({ legend }) => vis.yScale(legend) + vis.yScale.bandwidth() / 2)
      .attr('fill', ({ value }) => value.v1 >= 60 ? '#fff' : '#000')
      .text(({ value }) => value.v1)
  }

  bindingPath (vis) {
    const color = d3.interpolateRgb('white', vis.color.range()[0])
    vis.graphics
      .selectAll('.graphic')
      .data(vis.groups)
      .join(
        enter => {
          const g = enter
            .append('g')
            .attr('class', 'graphic')
            .attr('fill', ([val]) => color(val))
            // .attr('fill-opacity', 0)
          g.selectAll('circle')
            .data(([, set]) => set)
            .join(enter => vis.update(enter.append('circle')))

          g.selectAll('text').data(([, set]) => set)
            .join(enter => vis.updateText(enter.append('text')))
        },
        update => {
          const g = update
          g.selectAll('circle')
            .data(([, set]) => set)
            .join(
              enter => vis.update(enter.append('circle')),
              update => vis.update(update),
              exit => exit.remove()
            )
          g.selectAll('text')
            .data(([, set]) => set)
            .join(
              enter => vis.updateText(enter.append('text')),
              update => vis.updateText(update),
              exit => exit.remove()
            )
          g.transition(vis.t).attr('fill', ([val]) => color(val))
        },
        exit => exit.remove()
      )
  }

  updateVis () {
    const vis = this
    super.updateVis()
    vis.view.select('.legends').attr('opacity', '1')
    vis.view.select('.graphics').selectAll('text').attr('opacity', '1')
    return this
  }
}

class HeatmapToRound extends HeatmapChart {
  updateVis () {
    const vis = this
    super.updateVis()
    vis.view.select('.legends').attr('opacity', '0')
    vis.view.select('.graphics').selectAll('text').attr('opacity', '0')
    return this
  }

  update (g) {
    const vis = this

    g.transition(vis.t).attr('width', 30)
      .attr('height', 30)
      .attr('x', ({ label }) => vis.xScale(label) + vis.xScale.bandwidth() / 2 - 15)
      .attr('y', ({ legend }) => vis.yScale(legend) + vis.yScale.bandwidth() / 2 - 15)
      .attr('rx', 15)
      .attr('ry', 15)
  }

  bindingPath (vis) {
    const color = d3.interpolateRgb('rgba(255,255,255,0)', vis.color.range()[0])
    vis.graphics
      .selectAll('.graphic')
      .data(vis.groups)
      .join(
        enter => {
          const g = enter
            .append('g')
            .attr('class', 'graphic')
            .attr('fill', ([val]) => color(val > 0 ? 1 : 0))
            // .attr('fill-opacity', 0)
          g.selectAll('rect')
            .data(([, set]) => set)
            .join(enter => vis.update(enter.append('rect')))
        /*   g.transition()
            .duration(([val]) => val * 1000)
            .delay(([val]) => (1 - val) * 1000) */
          // .attr('fill-opacity', 1)
        },
        update => {
          const g = update
          g.selectAll('rect')
            .data(([, set]) => set)
            .join(
              enter => vis.update(enter.append('rect')),
              update => vis.update(update),
              exit => exit.remove()
            )
          g.transition(vis.t).attr('fill', ([val]) => color(val > 0 ? 1 : 0))
        },
        exit => exit.remove()
      )
  }
}
class ScatterChart extends Utility {
  constructor ({ svg, graphics }) {
    super('vertical', { svg, graphics }, { xScale: 'scaleTime', yScale: 'scaleLinear' })
  }

  wangleData (json) {
    const vis = this
    vis.dataset = Object.values(json).map(set => Object.values(set))
    vis.legends = Object.keys(json)
    vis.labels = Array.from(d3.union(Object.values(json).flatMap(d => Object.keys(d))))
    vis.groups = d3.group(this.flatData(json), d => Math.ceil(d.value.v2 / 5) + 5)
    const d = new Date()
    const span = d.setMonth(3) - d.setMonth(0)
    const xTicks = d3
      .extent(d3.union(Object.values(json).flatMap(d => Object.keys(d))))
      .map((d, i) => +d + (i ? 1 : -1) * span)
    const values = Object.values(json).flatMap(set => Object.values(set).map(d => d.v1))
    const yTicks = d3.extent(values)
    vis.updateTicks(vis, xTicks, yTicks)
    return vis
  }

  updateTicks (vis, xTicks, yTicks) {
    vis.xScale.domain(xTicks)
    vis.yScale.domain(yTicks)
    return vis
  }

  radius (d) {
    return Math.ceil(d.value.v2 / 5) + 5
  }

  bindingPath (vis, r) {
    vis.graphics
      .selectAll('.graphic')
      .data(vis.groups)
      .join(
        enter => {
          enter
            .append('g')
            .attr('class', 'graphic')
            .selectAll('circle')
            .data(([, set]) => set)
            .join(enter => {
              enter
                .append('circle')
                .attr('cx', ({ label }) => vis.xScale(label))
                .attr('cy', d => vis.yScale(d.value.v1))
                .attr('r', 0)
                .attr('fill', d => vis.color(d.legend))
                .attr('stroke', d => vis.color(d.legend))
                .transition(vis.t)
                .attr('r', d => r ?? vis.radius(d))
            })
        },
        update => {
          update
            .selectAll('circle')
            .data(([, set]) => set)
            .join(
              enter => {
                enter
                  .append('circle')
                  .attr('cx', ({ label }) => vis.xScale(label))
                  .attr('cy', d => vis.yScale(d.value.v1))
                  .attr('r', 0)
                  .attr('fill', d => vis.color(d.legend))
                  .attr('stroke', d => vis.color(d.legend))
                  .transition(vis.t)
                  .attr('r', r ?? vis.radius)
              },
              update => {
                update
                  .transition(vis.t)
                  .attr('fill', d => vis.color(d.legend))
                  .attr('stroke', d => vis.color(d.legend))
                  .attr('r', r ?? vis.radius)
              },
              exit => {
                exit.transition(vis.t).attr('r', 0).remove()
              }
            )
        },
        exit => exit.remove()
      )
  }
}

export class BubbleChart extends Utility {
  constructor (container) {
    const defs = { dir: 'vertical', xScale: 'scaleLinear', yScale: 'scaleLinear' }
    const args = Object.assign(defs, container)
    super(args)
  }

  wangleData (json) {
    const vis = this
    vis.groups = Object.values(json).flat().toSorted((a, b) => b.qty - a.qty)
    vis.legends = d3.union(vis.groups.map(d => d.product))
    // vis.labels = []
    const xExtent = d3.extent(vis.groups, d => d.X)
    const yExtent = d3.extent(vis.groups, d => d.Y)
    xExtent[0] *= 0.95
    xExtent[1] *= 1.05
    yExtent[0] *= 0.95
    yExtent[1] *= 1.05
    vis.updateTicks(vis, xExtent, yExtent)
    return this
  }

  updateTicks (vis, xTicks, yTicks) {
    vis.xScale.domain(xTicks)
    vis.yScale.domain(yTicks)
    return this
  }

  updateVis () {
    const vis = this
    vis.axisBottom(vis.xAxis.transition(vis.t))
    vis.axisLeft(vis.yAxis.transition(vis.t))
    vis.bindingPath(vis)
    return this
  }

  bindingPath (vis) {
    const circle = vis.graphics.selectAll('.bubble').data(vis.groups).join('circle').attr('class', 'bubble')
      .attr('cx', d => vis.xScale(d.X))
      .attr('cy', d => Math.round(vis.yScale(d.Y)))
      .attr('r', d => d.qty)
      .attr('fill', d => vis.color(d.product)).attr('title', (d) => {
        return Tip.titleStr(d.product) + Tip.listStr([[d.X + 'x' + d.Y, d3.format(',')(d.qty)]])
      })
    circle.call(Tip.createTip)
  }
}

class Cloud {
  constructor ({ el = '#chart-svg' } = {}) {
    this.el = d3.select(el ?? '#chart-svg')
    this.margin = { top: 10, right: 10, bottom: 10, left: 10 }

    this.height = 600 - this.margin.top - this.margin.bottom
  }

  get width () {
    return +this.el.style('width').replace(/px/, '') - this.margin.left - this.margin.right
  }

  init () {
    this.view = this.el.append('svg')
      .attr('width', this.width)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
    return this
  }

  get layout () {
    return d3.cloud()
      .size([this.width, this.height])
      .padding(1)
      .rotate(0)
      .fontSize(d => d.size)
  }

  wangleData (json) {
    this.words = Object.entries(json)
    return this
  }

  updateVis () {
    const vis = this
    const layout = this.layout.words(this.words.map(([text, set]) => {
      return { text, size: Math.round((d3.mean(Object.values(set), d => d.v1) * 4 + 12) * 10) / 10 }
    }))

      .on('end', function (words) {
        const texts = vis.view
          .attr('transform', 'translate(' + vis.layout.size()[0] / 2 + ',' + vis.layout.size()[1] / 2 + ')')
          .selectAll('text')
          .data(words)

        texts.enter()
          .append('text').merge(texts)
          .attr('font-size', d => d.size)
          .attr('text-anchor', 'middle')
          .attr('x', d => d.x)
          .attr('y', d => d.y)
          .text(d => d.text)
        texts.exit().remove()
      })
    layout.start()
    return this
  }
}

// export function wordCloud (json) {
//   const el = d3.select('#chart-svg')

//   const margin = { top: 10, right: 10, bottom: 10, left: 10 }
//   const width = +el.style('width').replace(/px/, '') - margin.left - margin.right
//   const height = 600 - margin.top - margin.bottom

//   const svg = el.append('svg')
//     .attr('width', width)
//     .attr('height', height + margin.top + margin.bottom)
//     .append('g')
//     .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

//   const words = Object.entries(json)
// const layout = d3.cloud()
//   .size([width, height])
//   .padding(1)
//   .rotate(0)
//   .fontSize(d => d.size)
//   .words(words.map(([text, set]) => {
//     return { text, size: Math.round((d3.mean(Object.values(set), d => d.v1) * 4 + 12) * 10) / 10 }
//   })
//   )

//   .on('end', function (words) {
//     svg
//       .append('g')
//       .attr('transform', 'translate(' + layout.size()[0] / 2 + ',' + layout.size()[1] / 2 + ')')
//       .selectAll('text')
//       .data(words)
//       .enter()
//       .append('text')
//       .attr('font-size', d => d.size)
//       .attr('text-anchor', 'middle')
//       .attr('x', d => d.x)
//       .attr('y', d => d.y)
//       .text(d => d.text)
//   })
// layout.start()
// }
const charts = { Cloud, FloatingBarChart, StackedHorizontalBarChart, GroupedVerticalBarChart, GroupedHorizontalBarChart, LineChart, PredictLineChart, SlopeChart, PieChart, RadarChart, HeatmapChart, HeatmapToRound, RoundHeatmapChart, ScatterChart, BubbleChart }
/* filename => charts.js */
