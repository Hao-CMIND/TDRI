// pdeIndex.js
function instanceCharts (tab, id, { type, yAxis, xAxis, table, json }) {
  const tabId = tab + '-' + id
  const yMajorLabel = new AxisTitle(yAxis).left()
  const legend = new Legend({ offset: 20 })
  const xLabel = new AxisTitle(xAxis).bottom()
  const init = { yMajorLabel, xLabel, legend }

  const config = {
    height: 350,
    el: '#chart-svg-' + tabId,
    table: new DataTable({ el: '#chart-table-' + tabId, colTitle: table })
  }
  const launcher = [
    function () { return new GroupedChart(config).initVis(init).wangleData(json) },
    function () { return new StackedChart(config).initVis(init).wangleData(json) },
    // function () { return new CandleChart(config).initVis({ yMajorLabel, xLabel }).wangleData(json) },
    function () { return new LineChart(config).initVis(init).wangleData(json) },
    function () { return new PieChart({ ...config, innerRadius: 100 }).initVis(init).wangleData(json) }
    // function () { return new SpiderChart(config).initVis().wangleData(json) }
  ]
  return launcher[type]
}
function goBack (e) {
  $('#product-selection').toggleClass('hidden')
    .next().toggleClass('hidden')
}

function clickHandler (e) {
  $('.js-back').on('click', goBack)
  $('.product-list a').off('click', clickHandler).on('click', goBack)

  $('#product-selection').toggleClass('hidden').next().toggleClass('hidden')
  const chartEnum = ['GroupedChart', 'StackedChart', 'LineChart', 'PieChart']
  const type = ((Math.random() * 100) | 0) % (chartEnum.length)
  let labelLen = 3
  let legendsLen = 10

  if (chartEnum[type] === 'PieChart') {
    labelLen = 1
  }
  if (chartEnum[type] === 'LineChart') {
    labelLen = 11
    legendsLen = 11
  }

  // if (chartEnum[type] === 'CandleChart') {
  //   labelLen = 10
  //   legendsLen = 4
  // }

  const labelsEnum = Array.from({ length: labelLen }, (v, i) => '標籤' + (i + 1))
  const legendsEnum = Array.from({ length: legendsLen }, (v, i) => '圖例' + (i + 1))

  const dataset = Array.from({ length: labelsEnum.length }, (d, j) => {
    const ds = Array.from({ length: legendsEnum.length }, (v, i) => {
      const max = /* type === 5 ? 50 : */ 20 ** 2
      const min =/*  type === 5 ? 0 : */ (10 - i) ** 2
      return Math.floor(Math.random() * (max - min + 1)) + min
    })
    // if (chartEnum[type] === 'CandleChart') {
    //   ds.sort((a, b) => b - a)
    // }

    return ds
  })

  setTimeout(() => {
    instanceCharts('index', 0, { type, yAxis: 'Y軸示範', xAxis: 'X軸示範', table: '範例', json: { labelsEnum, legendsEnum, dataset } })().updateVis()
  }, 500)
}
$('.product-list a').on('click', clickHandler)

const staggerAnimate = initStaggerAnimate()
$(window).on('scroll', staggerAnimate)
