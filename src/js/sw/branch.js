export default function branchThread () {
  const vm = this

  const { port } = new SharedWorker(/* webpackChunkName: "sharedworker" */ new URL('./sharedworker.js', import.meta.url), vm.sharedworkerName)
  const iframeIndex = Object.keys(window.parent).filter(key => key.match(/^\d$/)).map(n => window.parent[n]).indexOf(window)
  function toMain (action, data) {
    const post = Object.assign({ action: 'toMain', do: action, emit: data })
    port.postMessage(post)
  }
  port.addEventListener('message', function (e) {
    const commands = {
      getStructure ({ structure }) {
        for (const [key, val] of Object.entries(structure)) {
          vm[key] = val
        }
      },

      resChartData ({ res }) {
        for (const [key, val] of Object.entries(res)) {
          vm[key] = val
        }
        console.log(123, res)
        // toMain('setHeight', { iframeIndex, height: document.documentElement.offsetHeight + 11 })
        // console.log(res)
        const title = new Title('')
        const translateX = vm.type === 'spider' ? 450 : 0
        const yMajorLabel = new AxisTitle(vm.yAxis).left({ translateX })
        const legend = new Legend({ offset: 20 })
        const xLabel = new AxisTitle(vm.xAxis).bottom()
        const init = { title, yMajorLabel, xLabel, legend }
        const config = {
          el: '#chart-svg',
          table: new DataTable({ el: '#chart-table', colTitle: vm.table, hover: vm.type === 'spider' }),
          transpose: vm.transpose
        }
        const json = {
          labelsEnum: vm.labelsEnum,
          legendsEnum: vm.legendsEnum,
          dataset: vm.dataset,
          rawData: vm.rawData
        }
        if (!vm.type.match(/url/) && json.dataset.length === 0) {
          $(config.el).parents('.js-pdf').removeClass('js-pdf')
          // () => new ComingSoon(config).initVis().wangleData()
        }
        const launcher = {
          hgrouped () { return new HGroupedChart({ ...config, marginLeft: 0 }).initVis({ title, xLabel, legend }).wangleData(json) },
          grouped () { return new GroupedChart(config).initVis(init).wangleData(json) },
          stacked () { return new StackedChart(config).initVis(init).wangleData(json) },
          candle () { return new GroupedChart(config).initVis(init).wangleData(json) },
          line () { return new LineChart(config).initVis(init).wangleData(json) },
          pie () { return new PieChart({ ...config, innerRadius: 180 }).initVis({ title, legend }).wangleData(json) },
          spider () { return new HGroupedChart({ ...config, original: 'spider' }).initVis(init).wangleData(vm.filterData(json, 0)) }
          // url: json,
          // image: json
        }
        if (launcher[vm.type]) {
          launcher[vm.type]().updateVis()
        }
      },
      close () {
        window.parent = null
        port.close()
      }
    }
    const { data: { action } } = e
    if (commands[action]) {
      console.log(action, e.data)
      commands[action](e.data)
      return
    }
    console.log('debug =>', e.data)
  })
  port.start()

  port.postMessage({ action: 'branch', iframeIndex: vm.iframeIndex })
}
