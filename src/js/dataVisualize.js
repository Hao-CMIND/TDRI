function branchThread (vm, { sharedworkerName }) {
  const { port } = new SharedWorker(sw, sharedworkerName)
  let response = null
  let errorMsg = null
  const structure = {}
  port.addEventListener('message', function (e) {
    const commands = {
      getStructure ({ structure: resStructure }) {
        Object.assign(structure, resStructure)
      },
      errorResChartData ({ res }) {
        errorMsg(res)
      },
      resChartData ({ res, filename, reqBody }) {
        response({ structure, res, filename, reqBody })
        // if (res.brandFilter) {
        //   vm.filterBrands = vm[res.brandFilter]
        //   vm.selectedBrands = vm.filterBrands
        // }
        // const { sn } = vm

        // //   if (title.match(/售價分析|好感度/)) {
        // //     vm.filterBrands = vm.labelsEnum
        // //     vm.selectedBrands = vm.filterBrands
        // //     sn = 'B03'
        // //   }
        // //   if (title.match(/喜歡/)) {
        // //     vm.filterBrands = vm.legendsEnum
        // //     vm.selectedBrands = vm.filterBrands
        // //     sn = 'R01'
        // //   }
        // // }
        // // console.log(sn)
        // const toggleChart = res
        // if (toggleChart.length > 1) {
        //   Object.assign(vm, { toggleChart })
        // }
        // if (chartTypes[sn]?.launcher) {
        //   Object.assign(vm, chartTypes[sn].launcher(vm))
        //   vm.charts.toggle = false
        // }
      },
      close () {
        app.unmount()
        port.close()
        window.parent = null
      }
    }
    const { data: { action } } = e
    if (commands[action]) {
      commands[action](e.data)
      return
    }
    console.log('debug =>', e.data)
  })
  port.start()

  port.postMessage({ action: 'branch', iframeIndex: vm.iframeIndex })

  return new Promise((resolve, reject) => {
    response = resolve
    errorMsg = reject
  })
}
const { createApp, ref, watch, computed } = Vue
const app = createApp({
  setup () {
    const resData = ref([])
    const isLoading = ref(true)
    const isNoData = ref(false)
    const reqBody = ref({})
    const struct = ref({
      title: '',
      descr: '',
      brandFilter: '',
      selectedBrands: [],
      filterItems: [],
      filterDefault: -1,
      category: [],
      tag: [],
      role: [],
      type: '',
      sn: '',
      typeRadio: true
    })

    const isInvisible = ref(false)
    const isShow = ref(true)

    const toggleChartTypes = ref([])
    const selectedChartType = ref('')
    const selectedBrands = ref([])
    // const charts = ref([])
    const downloadfilename = ref('')
    const downloadPopover = ref(null)
    const downloadToast = ref(null)
    const dropdownBrands = ref(null)
    const list = ref([]) // 列表用
    const isEnlarging = ref(false)
    const showDetail = ref(true)
    const toast = ref({
      msg: '正在下載中...',
      isDownloading: true
    })
    function changeEvt (a) {
    }

    watch(() => struct.value.filterDefault, (newFilterDefault) => {
      selectedBrands.value = []
      selectedChartType.value = toggleChartTypes.value[0]?.valueType
    })

    const tables = ref({})
    watch([() => selectedBrands.value, () => struct.value.filterDefault, () => selectedChartType.value], ([brands, filterDefault, type]) => {
      const { sn, table, transpose } = struct.value
      if (sn.match(/B/)) {
        isInvisible.value = brands.length === 1
      }

      let { labelsEnum, dataset, unit } = resData.value[filterDefault]

      let cols, rows
      const legendsEnum = brands.length === 0 ? resData.value[filterDefault].legendsEnum : brands

      if (sn === 'D01') {
        cols = labelsEnum.slice()
        rows = legendsEnum.slice()
        cols.push('市佔率')
        const data = transpose ? dataset.slice() : d3.transpose(dataset)
        const sum = data.flat().reduce((acc, cur) => acc + cur, 0)

        dataset = rows.map((row, i) =>
          cols.map((col, j) => j === 0 ? thousands(data[i][0]) : fixed2(data[i][0] / sum))
        )
      } else if (sn.match(/B02|B03/)) {
        rows = resData.value[filterDefault].legendsEnum
        cols = brands.length === 0 ? labelsEnum : brands
        const indice = selectedBrands.value.map(brand => {
          return struct.value.selectedBrands[0].indexOf(brand)
        })
        let data = dataset.map(set => set.map(v => thousands(v)))
        if (indice.length) {
          data = indice.map(index => data[index])
        }
        dataset = d3.transpose(data)
      } else if (sn === 'B01') {
        rows = labelsEnum
        cols = ['近12個月最高搜尋次數', '近12個月平均搜尋次數', '近12個月最低搜尋次數']
        if (dataset.length / labelsEnum.length === 2) {
          cols.push('未來3個月搜尋次數預測')
          const predict = dataset.slice(labelsEnum.length, dataset.length)
          dataset = dataset.slice(0, labelsEnum.length).map((set, i) => [d3.max(set), Math.round(d3.mean(set)), d3.min(set), Math.round(d3.mean(predict[i]))].map(n => thousands(n)))
        }
      } else if (sn.match(/M(03|04|05|06|07|08|09|10|11|12|13|14|15|16|17|18|19|20|21|22)/)) {
        rows = transpose ? labelsEnum : legendsEnum
        cols = transpose ? legendsEnum : labelsEnum
        // cols=cols.map()

        if (unit) {
          if (transpose) {
            cols = cols.map(col => col + unit)
          } else {
            rows = rows.map(row => row + unit)
          }
        }

        const rowCount = Object.keys(rows).length
        const colCount = Object.keys(cols).length

        const matrix = Array.from({ length: rowCount }, () =>
          Array(colCount).fill(0)
        )

        dataset.forEach(([rowIdx, colIdx, value]) => {
          matrix[colIdx][rowIdx] += value
        })

        dataset = matrix
      } else if (sn.match(/M02/)) {
        dataset = dataset.slice().map(set => {
          return {
            size: set[0] + 'x' + set[1],
            qty: set[2],
            title: labelsEnum[set[3]]
          }
        })
        const groupBy = Object.groupBy(dataset, set => set.size)

        cols = brands.length ? brands : Array.from(new Set(Object.values(groupBy).flatMap(items => items.map(item => item.title))))

        rows = Object.keys(groupBy)
        dataset = rows.map(size => {
          const row = Array(cols.length).fill('-')
          groupBy[size].forEach(item => {
            const colIndex = cols.indexOf(item.title)
            row[colIndex] = item.qty
          })
          return row
        })
      } else if (sn.match(/TA[0-9]/)) {
        rows = labelsEnum
        cols = legendsEnum
        if (brands.length) {
          dataset = dataset.filter(([brandIndex]) => brands.includes(struct.value.brandFilter[brandIndex]))
        }
      } else if (sn.match(/R0/)) {
        console.log(177, 'R0')
        cols = labelsEnum

        const data = d3.transpose(dataset)

        if (brands.length === 0) {
          rows = legendsEnum.filter(legend => legend === '總體平均')

          dataset = [data.at(-1)]
        } else {
          rows = legendsEnum.filter(legend => brands.includes(legend))

          dataset = rows.map(row => {
            const rowIndex = struct.value.selectedBrands[struct.value.filterDefault].indexOf(row)
            return data[rowIndex]
          })
        }

        // dataset = radardata
      } else if (sn.match(/M01/)) {
        rows = resData.value[filterDefault].table[0]
        cols = labelsEnum
      } else if (sn.match(/B(07|08|09|10|11|12|13|14|15|16|17)/)) {
        rows = transpose ? labelsEnum : legendsEnum
        cols = transpose ? legendsEnum : labelsEnum

        let data = dataset.map(set => set.map(d => thousands(d)))

        if (type === 'percentage' && vm.selectedBrands.length === 0) {
          data = data.map(set => {
            const total = set.reduce((acc, cur) => +acc + +cur, 0)
            return set.map(d => fixed2(d / total))
          })
        }
        if (type === 'percentage' && vm.selectedBrands.length > 0) {
          const brandIndexMap = Object.fromEntries(
            struct.value.brandFilter.map((name, index) => [name, index])
          )

          const targetIndexes = brands.map(name => brandIndexMap[name])

          data = data.map(row => {
            const sum = targetIndexes.reduce((acc, i) => acc + Number(row[i]), 0)

            return row.map(value => fixed2(Number(value) / sum))
          })
        }

        const transposData = transpose ? data : d3.transpose(data)
        if (struct.value.brandFilter) {
          dataset = rows.map(row => transposData[struct.value.brandFilter?.indexOf(row)])
        } else {
          dataset = data
        }
        if (unit) {
          if (transpose) {
            rows = rows.map(row => row + unit)
          } else {
            cols = cols.map(col => col + unit)
          }
        }
      } else if (sn.match(/B(19|20)/)) {
        rows = transpose ? labelsEnum : legendsEnum
        cols = transpose ? legendsEnum : labelsEnum

        let data = dataset.map(set => set.map(d => thousands(d)))
        if (type === 'percentage' && vm.selectedBrands.length === 0) {
          data = data.map(set => {
            const total = set.reduce((acc, cur) => +acc + +cur, 0)
            console.log(total)
            return set.map(d => fixed2(d / total))
          })
        }
        // if (type === 'percentage' && vm.selectedBrands.length > 0) {
        //   const filterData = vm.selectedBrands.map(brand => data.map(set => set[rows.indexOf(brand)]))
        // }
        const transposData = transpose ? data : d3.transpose(data)

        dataset = rows.map(row => transposData[struct.value.brandFilter?.indexOf(row)])
      } else {
        rows = transpose ? labelsEnum : legendsEnum
        cols = transpose ? legendsEnum : labelsEnum

        let data = dataset
        if (!/G01|G02|TA/.test(sn)) {
          data = dataset.map(set => set.map(d => thousands(d)))
        }
        dataset = transpose ? data : d3.transpose(data)

        // dataset = rows.map(row => transposData[struct.value.brandFilter?.indexOf(row)])
      }

      tables.value = { title: table ?? '', cols, rows, dataset }
    })

    function enLarge () {
      if (isEnlarging.value) {
        isEnlarging.value = false
        document.exitFullscreen()
        return
      }
      isEnlarging.value = true
      document.documentElement.requestFullscreen()
    }
    function resetChartFilter () {
      selectedBrands.value = []
      if (struct.value.filterItems.length) {
        struct.value.filterDefault = struct.value.filterItems.findIndex(item => item !== '')
      }
      $(dropdownBrands.value).dropdown('show').dropdown('hide')
    }
    function togglingChart (item, chartType) {
      const filteredResult = item === struct.value.filterDefault
      const isSameType = selectedChartType.value === chartType.valueType
      return isShow.value || (filteredResult && (isSameType || chartType.sameContainer))
    }

    // function setTable ({ sn, table, transpose }, res) {
    //   return res.map((r, k) => {
    //     let { labelsEnum, legendsEnum, dataset } = r
    //     let cols, rows

    //     if (sn === 'D01') {
    //       cols = labelsEnum.slice()
    //       rows = legendsEnum.slice()
    //       cols.push('市佔率')
    //       const data = transpose ? dataset.slice() : d3.transpose(dataset)
    //       const sum = data.flat().reduce((acc, cur) => acc + cur, 0)
    //       dataset = rows.map((row, i) =>
    //         cols.map((col, j) => j === 0 ? thousands(data[i][0]) : fixed2(data[i][0] / sum))
    //       )
    //     } else if (sn === 'B01') {
    //       rows = r.labelsEnum
    //       cols = ['近12個月最高搜尋次數', '近12個月平均搜尋次數', '近12個月最低搜尋次數']
    //       if (r.dataset.length / r.labelsEnum.length === 2) {
    //         cols.push('未來3個月搜尋次數預測')
    //         const predict = r.dataset.slice(r.labelsEnum.length, r.dataset.length)
    //         dataset = r.dataset.slice(0, labelsEnum.length).map((set, i) => [d3.max(set), Math.round(d3.mean(set)), d3.min(set), Math.round(d3.mean(predict[i]))].map(n => thousands(n)))
    //       }
    //     } else if (sn.match(/M[0-9]{2}/)) {
    //       rows = transpose ? labelsEnum : legendsEnum
    //       cols = transpose ? legendsEnum : labelsEnum
    //       dataset = rows.map((_, legendIndex) => {
    //         return cols.map((_, labelIndex) => {
    //           const matchingEntry = dataset.find(
    //             ([labelIdx, legendIdx]) => labelIdx === labelIndex && legendIdx === legendIndex
    //           )

    //           return matchingEntry ? matchingEntry[2] : '-'
    //         })
    //       })
    //     } else if (sn.match(/TA[0-9]/)) {
    //       rows = labelsEnum
    //       cols = legendsEnum
    //     } else {
    //       const data = dataset.map(set => set.map(d => thousands(d)))
    //       rows = transpose ? labelsEnum : legendsEnum
    //       cols = transpose ? legendsEnum : labelsEnum
    //       dataset = transpose ? data : d3.transpose(data)
    //     }
    //     return { title: table ?? '', cols, rows, dataset }
    //   })
    // }
    function addToProj () {
      console.log(reqBody.value)
    }
    async function downloadImageHandler (e) {
      $(downloadToast.value).toast('show')
      toast.value.msg = '正在下載中...'
      toast.value.isDownloading = true
      $(downloadPopover.value).popover('hide')
      const { action } = e.target.closest('button').dataset
      const node = d3.select('svg')
        .attr('version', '1.1')
        .attr('xmlns', 'http://www.w3.org/2000/svg').node()/*
      const { width, height } = node.getBBox()
      node = node */.cloneNode(true)
      const SVGtitleEl = node.querySelector('.svg-chart-title')
      const chartTitle = struct.value.title
      const filename = downloadfilename.value + '-' + chartTitle + new Date().toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\/|:|\s/g, '')
      SVGtitleEl.textContent = chartTitle
      const img = {
        async pdf () {
          console.warn('npm i jspdf@2.5.1 -S  =====> 發生錯誤時，請安裝 jspdf 2.5.1 ')
          const el = $('.js-pdf').parent()
          const width = 1424// el.width()
          const canvas = await html2canvas(el[0], { windowWidth: 1920 })
          const PDF_HEIGHT = width * 1.414
          let doc

          // 靜態站判定使用(不須修改)
          if (typeof PDF === 'undefined') {
            const PDF = jsPDF
            doc = new PDF('p', 'px', [width, PDF_HEIGHT])
          } else {
            doc = new PDF('p', 'px', [width, PDF_HEIGHT])
          }
          doc.addImage(canvas, 'JPEG', 0, 0, width, canvas.height)
          doc.save(filename + '.pdf')
        },
        svg () {
          SVGtitleEl.removeAttribute('class')
          const div = document.createElement('div')
          div.innerHTML = node.outerHTML
            .replace(/[0-9]+\.[0-9]{2,}/gm, p1 => Math.round(p1 * 10) / 10 + '')
            .replace(/fill="currentColor"/gm, 'fill="#000"')

          div.querySelectorAll('line').forEach(line => {
            const attrs = ['y2']
            line.classList.remove('domain')
            if (line.classList.length === 0) { attrs.push('class') }
            attrs.forEach(attr => {
              if (attr === 'y2' && +line.getAttribute(attr) !== 0) { return }
              line.removeAttribute(attr)
            })
            if (line.attributes.length === 1) { line.remove() }
          })
          div.querySelectorAll('path').forEach(path => {
            const attrs = ['stroke-dasharray', 'stroke-dashoffset', 'stroke']
            path.classList.remove('domain')
            if (path.classList.length === 0) { attrs.push('class') }
            attrs.forEach(attr => {
              if (attr === 'stroke-dasharray' && +path.getAttribute(attr) === 5) { return }
              if (attr === 'stroke' && path.getAttribute(attr) !== 'none') { return }
              path.removeAttribute(attr)
              if (path.attributes.length === 1) { path.remove() }
            })
          })
          div.querySelectorAll('g').forEach(g => {
            const attrs = ['data-legend', 'transform', 'opacity']
            g.classList.remove('graphic', 'chart', 'tick', 'legend', 'line', 'dashed-line')
            if (g.classList.length === 0) { attrs.push('class') }
            attrs.forEach(attr => {
              if (attr === 'transform' && g.getAttribute(attr) !== 'translate(0,0)') { return }
              g.removeAttribute(attr)
            })
            if (g.attributes.length === 0) {
              g.replaceWith(...g.childNodes)
            }
          })
          div.querySelectorAll('.bs-tip').forEach(tip => {
            const attrs = ['data-bs-toggle', 'data-bs-html', 'data-bs-content', 'data-bs-trigger', 'data-legend']
            tip.classList.remove('bs-tip')
            if (tip.classList.length === 0) { attrs.push('class') }
            attrs.forEach(attr => { tip.removeAttribute(attr) })
          })

          svgToBlob(div.firstElementChild, (blob) => {
            downloadLink(filename + '.svg', URL.createObjectURL(blob))
          })
        },
        png () {
          console.warn('npm i html2canvas@1.4.1 -S  =====> 發生錯誤時，請安裝 html2canvas 1.4.1 ')
          return html2canvas($('#chart-svg')[0], { windowWidth: 1920, backgroundColor: null }).then(canvas => downloadLink(filename + '.png', canvas.toDataURL('image/png')))
        }
      }
      await img[action]()
      vm.isDownloading = false
      $(downloadToast.value).toast('hide')
    }

    return { showDetail, resData, resetChartFilter, isEnlarging, enLarge, isNoData, isLoading, changeEvt, tables, struct, selectedBrands, toggleChartTypes, selectedChartType, isInvisible, downloadfilename, downloadPopover, downloadToast, dropdownBrands, toast, isShow, togglingChart, downloadImageHandler, addToProj, reqBody } // , , brandFilter, selectedBrands, filterItems, filterDefault,charts,setTable,
  },
  async mounted () {
    const vm = this
    const urlParam = new URLSearchParams(location.search)
    const sharedworkerName = urlParam.get('sharedworker')
    const preview = urlParam.get('preview')

    vm.showDetail = preview === null

    const { structure, res, filename, reqBody } = await branchThread(vm, { sharedworkerName })
    console.log(321, structure, res)
    vm.downloadfilename = filename
    res.forEach(({ dataset }, i) => { // 移除無資料因素
      if (dataset.length === 0) {
        structure.filterItems[i] = ''
      }
    })
    if (structure.filterItems.length) { // 重新指定 預設因素資料
      structure.filterDefault = structure.filterItems.findIndex(item => item !== '')
      if (structure.filterDefault === -1) {
        vm.isLoading = false
        return
      }
    }
    vm.resData = res

    ;['title', 'descr', 'brandFilter', 'sn', 'filterItems', 'filterDefault', 'tag', 'category', 'role', 'type', 'typeRadio'].forEach(key => { vm.struct[key] = structure[key] })

    vm.reqBody = reqBody

    if (structure.brandFilter) {
      const filterDataset = res.find(r => r.filter === structure.filterDefault)
      if (structure.sn === 'M02') {
        vm.struct.selectedBrands = res.map(r => r.labelsEnum)

        vm.struct.brandFilter = vm.struct.selectedBrands[0]
      } else if (structure.sn.match(/R01|R02/)) {
        vm.struct.brandFilter = filterDataset[structure.brandFilter].filter(brand => brand !== '總體平均')
        vm.struct.selectedBrands = res.map(r => {
          return r[structure.brandFilter].filter(brand => brand !== '總體平均')
        })
      } else if (structure.brandFilter === 'custom') {
        vm.struct.selectedBrands = res.map(r => {
          return r.dataset.map(d => d[3]).filter((el, i, arr) => arr.indexOf(el) === i)
        })
        vm.struct.brandFilter = vm.struct.selectedBrands[0]
        // vm.struct.selectedBrands = vm.struct.brandFilter[0]
      } else {
        vm.struct.brandFilter = filterDataset[structure.brandFilter]
        vm.struct.selectedBrands = res.map(r => {
          return r[structure.brandFilter]
        })
      }

      vm.selectedBrands = []
    }
    if (structure.sn.match(/RE|TA|G|T01/)) {
      console.log('vm', vm)
      console.log('structure', structure, vm.struct)
      return
    }
    // vm.tables = vm.setTable(structure, res)

    // if (structure.sn.match(/TA[0-9]/)) {
    //   return
    // }
    const { toggleChartTypes, launcher } = chartTypes[structure.sn]
    if (toggleChartTypes) {
      Object.assign(vm, { toggleChartTypes, selectedChartType: toggleChartTypes[0].valueType })
    }
    await vm.$nextTick()
    vm.isLoading = false
    ;({ update: vm.changeEvt = () => {} } = launcher({ ...structure, res, title: '' }))

    vm.isShow = false

    new $.bootstrap.Popover(vm.downloadPopover)
    let popoverClickBinding = null
    $(vm.dropdownBrands).on('hide.bs.dropdown', function () {
      vm.changeEvt(vm)
    })

    $(vm.downloadPopover)
      .on('inserted.bs.popover', function (e) {
        popoverClickBinding = vm.downloadImageHandler.bind($(this).parents('.container-fluid'))
        $('.popover').on('click', popoverClickBinding)
      }).on('hidden.bs.popover', function (e) {
        $('.popover').off('click', popoverClickBinding)
      })

    console.log('vm', vm)
  }
})
const vm = app.mount('#app')
