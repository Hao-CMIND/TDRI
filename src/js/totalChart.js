// totalChart.js
function findDataset (product, category) {
  const dataset = biography[product].find(dataset => dataset[0][0] === category)
  const json = {
    title: dataset[0][0],
    data: dataset.slice(2).map(set => {
      return {
        [set[0]]: {
          [dataset[0][1]]: { v1: set[1] }
        }
      }
    })
  }
  return dataset
}

class PopoverChart {
  constructor (args = {}) {
    const def = {
      el: '',
      marginTop: 0,
      marginRight: 30,
      marginBottom: 0,
      marginLeft: 20,
      paddingX: 0.5,
      height: 400,
      width: 450,
      themes: ['#323DFF', '#6FCF97', '#7B85FF', '#BEC2FF', '#2F80ED', '#56CCF2', '#F2C94C', '#FF897D', '#F2994A', '#BDBDBD']
    }
    Object.assign(def, args)
    Object.assign(this, def)
  }

  get marginX () {
    return this.marginLeft + this.marginRight
  }

  get translate () {
    const coor = this.view.attr('transform').match(/[0-9]+/g)
    const [x, y] = coor.map(n => +n)
    return { x, y }
  }

  get marginY () {
    return this.marginTop + this.marginBottom
  }

  get viewport () {
    return [this.width, this.height]
  }

  center (offset = [0, 0]) {
    return d3.map(this.viewport, (b, i) => b / 2 + offset[i])
  }

  initVis () {
    const vis = this
    const { width, height, marginLeft: ml, marginTop: mt } = this
    vis.svg = d3.create('div')
    vis.view = vis.svg.append('svg').attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', width)
      .attr('height', height)
      .attr('text-anchor', 'middle')

      .append('g').attr('transform', `translate(${ml},${mt})`)

    vis.colors = d3.scaleOrdinal().range(vis.themes)
    return this
  }

  createLegend () {
    const vis = this
    const legends = vis.view.selectAll('.legend').data(vis.values)
    const enterLengend = legends.enter().append('g').attr('class', 'legend').attr('text-anchor', 'start')
      .attr('transform', (d, i) => `translate(${vis.width / 3 * (i % 3)}, ${300 + Math.floor(i / 3) * 25})`)
    enterLengend.append('circle').attr('x', 5).attr('r', 8).attr('fill', d => vis.colors(d.legend))
    enterLengend.append('text').attr('x', 9).attr('alignment-baseline', 'middle').text(d => d.legend + d.percentage)
  }

  getHTML (from, product) {
    const vis = this
    const title = d3.create('div')

    title.append('h3').html(`${from}<span class="t-black">的</span>${product}<span class="t-black">產品</span>使用者${vis.title}比例<span class="btn btn-light-purple btn-sm p-0 fl-right"><span class="fi-database-down fz-16"></span>推薦資料<span class="fi-piechart fz-16"></span></span>`).attr('class', 't-purple')

    return title.html() + vis.svg.html()
  }
}

class PopoverPie extends PopoverChart {
  wangleData (dataset) {
    const vis = this
    const [label, total, ...sets] = dataset
    const [title] = label
    vis.title = title
    // const [, numberic, ratio] = total
    vis.legends = sets.map(set => set[0])
    vis.labels = label[1]
    vis.values = vis.pie(sets.map(set => set[1]))
      .map((pieData, i) => {
        return Object.assign(pieData, {
          legend: vis.legends[i],
          percentage: d3.format('.2%')(sets[i][2])
        })
      })
    vis.colors.domain(vis.labels)
    // console.log(vis.values)
    return this
  }

  get pie () {
    return d3.pie().value(v => v)
  }

  get arc () {
    const vis = this
    const size = Math.min(...vis.viewport)
    return d3
      .arc()
      .innerRadius(d => 40)
      .outerRadius(d => 120)
  }

  updateVis () {
    const vis = this
    const paths = vis.view.selectAll('path').data(vis.values)
    paths.enter().append('path')
      .attr('transform', `translate(${vis.center([-20, -70])})`)
      .attr('d', d => vis.arc(d))
      .attr('fill', d => vis.colors(d.legend))

    const texts = vis.view.selectAll('text').data(vis.values)
    texts.enter().append('text')
      .attr('transform', d => `translate(${vis.center([vis.arc.centroid(d)[0] - 20, vis.arc.centroid(d)[1] - 70])})`)
      .attr('fill', '#fff')
      .text(d => d.percentage)

    const legends = vis.view.selectAll('.legend').data(vis.values)
    const enterLengend = legends.enter().append('g').attr('class', 'legend').attr('text-anchor', 'start')
      .attr('transform', (d, i) => `translate(${vis.width / 3 * (i % 3)}, ${300 + Math.floor(i / 3) * 25})`)
    enterLengend.append('circle').attr('x', 5).attr('r', 8).attr('fill', d => vis.colors(d.legend))
    enterLengend.append('text').attr('x', 9).attr('alignment-baseline', 'middle').text(d => d.legend + ' ' + d.percentage)
    return this
  }
}

class PopoverBar extends PopoverChart {
  constructor () {
    super()
    const vis = this

    vis.xScale = d3.scaleLinear().range([0, 380])
    vis.yScale = d3.scaleBand().range([0, 240]).padding(0.25)
  }

  initVis () {
    super.initVis()
    const vis = this
    vis.yAxis = vis.view
      .append('g')
      .attr('class', 'y-axis')
      // .style('font-size', 16)
      .attr('transform', 'translate(35,0)')
    vis.xAxis = vis.view
      .append('g')
      .attr('class', 'x-axis')
      // .style('font-size', 16)
      // .style('text-anchor', 'start')
      .attr('transform', 'translate(35,240)')
      // .attr('color', '#bdbdbd')

    vis.axisBottom = d3.axisBottom(vis.xScale).tickFormat(d3.format('.0%')).tickSize(-240)
    vis.axisLeft = d3.axisLeft(vis.yScale).tickSize(0)
    return this
  }

  wangleData (dataset) {
    const vis = this
    const [label, total, ...sets] = dataset
    const [title] = label
    vis.title = title
    vis.legends = sets.map(set => set[0])
    vis.labels = vis.legends
    vis.values = sets.map(set => { return { value: set[2] } }).map((d, i) => {
      return Object.assign(d, {
        legend: vis.legends[i],
        percentage: d3.format('.2%')(sets[i][2])
      })
    })

    vis.yScale.domain(vis.legends)
    vis.xScale.domain([0, 1])
    vis.colors.domain(vis.legends)

    return this
  }

  updateVis () {
    const vis = this
    vis.axisBottom(vis.xAxis)
    vis.axisLeft(vis.yAxis)

    const rects = vis.view.selectAll('.bar').data(vis.values)
    rects.enter().append('rect').attr('class', 'bar')
      .attr('x', 36)
      .attr('y', d => vis.yScale(d.legend)).attr('width', d => vis.xScale(d.value))
      .attr('height', vis.yScale.bandwidth())
      .attr('fill', d => vis.colors(d.legend))

    const legends = vis.view.selectAll('.legend').data(vis.values)
    const enterLengend = legends.enter().append('g').attr('class', 'legend').attr('text-anchor', 'start')
      .attr('transform', (d, i) => `translate(${vis.width / 3 * (i % 3)}, ${300 + Math.floor(i / 3) * 25})`)
    enterLengend.append('circle').attr('x', 5).attr('r', 8).attr('fill', d => vis.colors(d.legend))
    enterLengend.append('text').attr('x', 9).attr('alignment-baseline', 'middle').text(d => d.legend + ' ' + d.percentage)
    return this
  }
}

class PopoverGroup {
  constructor (args = {}) {
    const def = {
      el: '',
      marginTop: 30,
      marginRight: 10,
      marginBottom: 30,
      marginLeft: 30,
      paddingX: 0.5,
      height: 400,
      width: 800,
      themes: ['#323DFF', '#6FCF97', '#7B85FF', '#BEC2FF', '#2F80ED', '#56CCF2', '#F2C94C', '#FF897D', '#F2994A', '#BDBDBD']
    }
    Object.assign(def, args)
    Object.assign(this, def)
    const vis = this
    vis.xScale = d3.scaleBand().range([0, this.width - this.marginLeft - this.marginRight]).padding(0.25)
    vis.yScale = d3.scaleLinear().range([0, this.height - this.marginTop - this.marginBottom])
  }

  get marginX () {
    return this.marginLeft + this.marginRight
  }

  get translate () {
    const coor = this.view.attr('transform').match(/[0-9]+/g)
    const [x, y] = coor.map(n => +n)
    return { x, y }
  }

  get marginY () {
    return this.marginTop + this.marginBottom
  }

  get viewport () {
    return [this.width, this.height]
  }

  center (offset = [0, 0]) {
    return d3.map(this.viewport, (b, i) => b / 2 + offset[i])
  }

  initVis () {
    const vis = this
    const { width, height, marginLeft: ml, marginTop: mt } = this
    vis.svg = d3.create('div')
    vis.view = vis.svg.append('svg').attr('viewBox', `0 0 ${width} ${550}`)
      .attr('width', width)
      .attr('height', 550)
      .attr('text-anchor', 'middle')

      .append('g').attr('transform', `translate(${ml},${mt})`)

    vis.colors = d3.scaleOrdinal().range(vis.themes)
    vis.yAxis = vis.view
      .append('g')
      .attr('class', 'y-axis')
      // .style('font-size', 16)
      .attr('transform', 'translate(0,0)')
    vis.xAxis = vis.view
      .append('g')
      .attr('class', 'x-axis')
      // .style('font-size', 16)
      // .style('text-anchor', 'start')
      .attr('transform', `translate(0,${height - this.marginTop - this.marginBottom})`)
      // .attr('color', '#bdbdbd')

    vis.axisBottom = d3.axisBottom(vis.xScale)// .tickSize(-height  +  this.marginX)
    vis.axisLeft = d3.axisLeft(vis.yScale).tickSize(-width)//
    vis.eachThemes = [
      ['#BEC2FF', '#7B85FF', '#323DFF'],
      ['#AF9EFF', '#7A59FF', '#5428DA'],
      ['#E685B5', '#D63384', '#AB296A'],
      ['#E35D6A', '#DC3545', '#B02A37'],
      ['#FEB272', '#FD9843', '#FD7E14'],
      ['#FFDA6A', '#FFCD39', '#FFC107'],
      ['#8EDC00', '#7ABE00', '#66A000'],
      ['#75B798', '#479F76', '#198754'],
      ['#3DD5F3', '#0DCAF0', '#0AA2C0'],
      ['#0AA2C0', '#087990', '#055160']
    ]
    return this
  }

  getHTML (from, product) {
    const vis = this
    const title = d3.create('div')
    title.append('h3').html(`${from}<span class="t-black">的</span>${product}<span class="t-black">產品</span>使用者關注品類<span class="btn btn-light-purple btn-sm p-0 fl-right"><span class="fi-database-down fz-16"></span>推薦資料<span class="fi-piechart fz-16"></span></span>`).attr('class', 't-purple')
    return title.html() + vis.svg.html()
  }

  wangleData (dataset) {
    const vis = this
    for (const item in dataset) {
      for (let i = 0; i < dataset[item].length; i++) {
        dataset[item][i].ratio = Math.round(dataset[item][i].ratio * 10000) / 100
        dataset[item][i].product = item
      }
      dataset[item].sort((a, b) => b.ratio - a.ratio)
    }
    vis.values = Object.entries(dataset)
    d3.scaleOrdinal().range([])

    vis.labels = Object.keys(dataset)
    vis.eachColors = Object.fromEntries(vis.labels.map((label, i) => {
      return [label, d3.scaleOrdinal().range(vis.eachThemes[i])]
    }))

    vis.xScale.domain(vis.labels)
    vis.yScale.domain([100, 0])
    return this
  }

  createLegend () {
    const vis = this
    const legends = vis.view.selectAll('.legend').data(vis.values)
    const enterLengend = legends.enter().append('g').attr('class', 'legend').attr('text-anchor', 'start')
      .attr('transform', (d, i) => `translate(${vis.width / 3 * (i % 3)}, ${400 + Math.floor(i / 3) * 25})`)
    enterLengend.append('circle').attr('x', 5).attr('r', 8).attr('fill', (d, i) => vis.eachThemes[i].at(-1))
    enterLengend.append('text').attr('x', 9).attr('alignment-baseline', 'middle').text(d => d[0])

    legends.exit().remove()
  }

  updateVis () {
    const vis = this

    vis.axisBottom(vis.xAxis)
    vis.axisLeft(vis.yAxis)

    vis.createLegend()

    const gs = vis.view.selectAll('.group').data(vis.values)
    const enterGroup = gs.enter().append('g').attr('class', 'group')
    enterGroup.attr('transform', d => `translate(${vis.xScale(d[0])},0)`)
    const rects = enterGroup.selectAll('rect').data(([label, set]) => set)
    rects.enter().append('rect').attr('class', 'focusbar')
      .attr('y', d => vis.yScale(0) - vis.yScale(100 - d.ratio))
      .attr('width', vis.xScale.bandwidth())
      .attr('height', d => vis.yScale(100 - d.ratio)) // d=> vis.yScale(d.ratio)
      .attr('fill', d => this.eachColors[d.product](d.key))
      .attr('data-bs-toggle', 'popover')
      .attr('data-bs-title', d => d.product)
      .attr('data-bs-content', d => `<p>${d.key}</br>${d.ratio + '%'}</p>`)
      .attr('data-bs-trigger', 'hover')
      .attr('data-bs-html', 'true')

    gs.exit().remove()
    return this
  }

  addPopover () {
    this.popovers = []
    d3.selectAll('.focusbar').each((d, i, a) => {
      this.popovers.push(new $.bootstrap.Popover(a[i]))
    })
  }

  destroy () {
    this.popovers.forEach(p => p.dispose())
    this.wangleData({}).updateVis()
  }
}

// $('.js-chart-popover').map(popover => {
//   const htmlStr = popoverChart.initVis().wangleData(findDataset(popover.dataset.product, popover.dataset.chart)).updateVis().getHTML()
//   popover.dataset.bsContent = htmlStr
//   return new $.bootstrap.Popover(popover)
// })
const popcharts = {
  pie: PopoverPie,
  bar: PopoverBar,
  group: PopoverGroup
}

// 靜態站demo用
window.addEventListener('DOMContentLoaded', function (e) {
  // - 新增分析資料
  $('.js-chart-popover').map(popover => {
    const popoverChart = new popcharts[popover.dataset.type]()
    let dataset = null

    if (popover.dataset.type === 'group') {
      dataset = focusData
      const chart = popoverChart.initVis().wangleData(dataset).updateVis()

      popover.dataset.bsContent = chart.getHTML(popover.dataset.from, popover.dataset.product)
      $(popover).on('inserted.bs.popover', function (e) {
        popoverChart.addPopover()
      }).on('hide.bs.popover', function (e) {
        popoverChart.destroy()
      })
      return new $.bootstrap.Popover(popover)
    } else {
      dataset = findDataset(popover.dataset.product, popover.dataset.chart)
      const htmlStr = popoverChart.initVis()
        .wangleData(dataset)
        .updateVis()
        .getHTML(popover.dataset.from, popover.dataset.product)
      popover.dataset.bsContent = htmlStr
      return new $.bootstrap.Popover(popover)
    }
  })
})

function getPopoverPie (json) {
  const popoverChart = new PopoverPie()
  return popoverChart.initVis()
    .wangleData(json)
    .updateVis()
    .getHTML()
}
