/* filename => chartTypes.js */
function downloadLink (filename, href) {
  const downloadBtn = document.createElement('a')
  downloadBtn.download = filename
  downloadBtn.href = href
  downloadBtn.click()
}
function svgToBlob (node, cb) {
  const svgContent = new XMLSerializer().serializeToString(node)
  const blob = new Blob([svgContent], { type: 'image/svg+xml' })
  cb(blob)
  URL.revokeObjectURL(blob)
}
function objectTranspose (legendsEnum, labelsEnum, dataset) {
  return labelsEnum.reduce((obj, label) => {
    return Object.assign(obj, {
      [label]: legendsEnum.reduce((obj, legend) => {
        return Object.assign(obj, { [legend]: dataset[legend][label] })
      }, {})
    })
  }, {})
}
function nestJSON ({ legendsEnum, labelsEnum, dataset: d }, transpose) {
  const result = legendsEnum.reduce((obj, legend, i) => {
    if (legend === '') return obj
    return Object.assign(obj, {
      [legend]: d.reduce((obj, set, j) => {
        const pushObj = {
          [labelsEnum[j]]: { v1: set[i] }
        }
        return Object.assign(obj, pushObj)
      }, {})
    })
  }, {})

  if (transpose) {
    return objectTranspose(legendsEnum, labelsEnum, result)
  }
  return result
}
function numberic2percentage (rawData) {
  const { legendsEnum, labelsEnum, dataset } = rawData
  const max = d3.max(dataset.flat(Infinity))
  return nestJSON({ legendsEnum, labelsEnum, dataset: dataset.map(set => set.map(d => d / max)) })
}

function switchBarType ({ divEl, res, title, yAxis, xAxis }) {
  // const multiItem = filterItems.length > 1
  const sets = []
  const chartsInstance = res.map((d, i) => {
    const dataset = { numberic: nestJSON(d), percentage: numberic2percentage(d) }
    sets.push(dataset)
    const { unit } = d
    const args = {
      el: res.length === 1 ? '#chart-svg' : '#chart-numberic-' + i,
      colorDomain: d.legendsEnum,
      items: {
        title: new Title(title),
        xAxis: new AxisTitle(xAxis ?? '').bottom(),
        yAxis: new AxisTitle((yAxis ?? '') + (unit ? ' ' + unit : '')).left(),
        legend: new Legend()
      }
    }
    if (divEl) { args.el = divEl }

    return new Container(args)
      .initVis([charts.StackedHorizontalBarChart])
      .wangleData(dataset.numberic)
      .updateVis()
  })
  return {
    update (vm) {
      const { struct, selectedBrands } = vm

      chartsInstance.forEach((chart, i) => {
        if (struct.filterDefault !== i) return

        // if (selectedBrands.length === 0) return

        if (selectedBrands.length === 1) {
          vm.selectedChartType = 'numberic'
        }
        const { selectedChartType } = vm
        const isPercen = selectedChartType === 'percentage' && (selectedBrands.length === 0 || selectedBrands.length > 1)
        const set = sets[i]
        if (selectedBrands.length === 0) {
          chart
            .percentage(isPercen)
            .updateCharts([charts.StackedHorizontalBarChart]).stackMode(isPercen)
            .wangleData(set[selectedChartType])
            .updateVis()
          return
        }

        let filteredData

        // console.log({ legendsEnum: Object.keys(set.numberic), labelsEnum: Object.keys(set.numberic[0]) })

        if (isPercen) {
          const result = Object.entries(objectTranspose(selectedBrands, Object.keys(set.numberic[selectedBrands[0]]), set.numberic)).reduce((acc, [factor, brandData]) => {
            // 找出該因素下最大 v1 值
            const totalV1 = Object.values(brandData).reduce((sum, b) => sum + b.v1, 0)
            acc[factor] = {}

            for (const brand in brandData) {
              const brandV1 = brandData[brand].v1
              acc[factor][brand] = {
                v1: +(brandV1 / totalV1).toFixed(4)
              }
            }

            return acc
          }, {})

          filteredData = objectTranspose(Object.keys(set.numberic[selectedBrands[0]]), selectedBrands, result)
        } else {
          filteredData = selectedBrands.reduce((selected, brand) => {
            return Object.assign(selected, { [brand]: set.numberic[brand] })
          }
          , {})
        }

        chart
          .percentage(isPercen)
          .updateCharts([charts.GroupedHorizontalBarChart]).stackMode(isPercen)
          .wangleData(filteredData)
          .updateVis()
      })
    }
  }
}
function slope ({ divEl, res, title, yAxis }) {
  const chartsInstance = res.map((d, i) => {
    const numberic = nestJSON(d, true)
    d.labelsEnum.forEach((label, i) => {
      d.legendsEnum.forEach((legend, j) => {
        const tip = d.rawData[i][j][0]
        if (tip) {
          numberic[label][legend].v2 = tip
        }
      })
    })
    // console.log(numberic)
    const args = {
      el: res.length === 1 ? '#chart-svg' : '#chart-numberic-' + i,
      colorDomain: d.labelsEnum,
      items: {
        title: new Title(title),
        xAxis: null,
        yAxis: new AxisTitle(yAxis).left(),
        legend: new Legend()
      }
    }
    if (divEl) { args.el = divEl }
    return new Container(args)
      .initVis([charts.SlopeChart])
      .wangleData(numberic)
      .updateVis()
  })
  return {

  }
}
function groupedBar ({ divEl, res, title, yAxis }) {
  const chartsInstance = res.map((d, i) => {
    const numberic = nestJSON(d)
    const args = {
      colorDomain: d.legendsEnum,
      items: {
        title: new Title(title),
        xAxis: null,
        yAxis: new AxisTitle(yAxis).left(),
        legend: new Legend()
      }
    }
    if (divEl) { args.el = divEl }
    return new Container(args)
      .initVis([charts.GroupedVerticalBarChart])
      .wangleData(numberic)
      .updateVis()
  })

  return {
    update ({ selectedBrands }) {
      chartsInstance.forEach((chart, i) => {
        const { labelsEnum } = res[i]
        const filteredData = nestJSON(res[i])
        if (labelsEnum.length !== selectedBrands.length && selectedBrands.length !== 0) {
          for (const legend in filteredData) {
            for (const label in filteredData[legend]) {
              if (selectedBrands.includes(label)) continue
              delete filteredData[legend][label]
            }
          }
        }

        chart.wangleData(filteredData).updateVis()
      })
    }
  }
}

// function horizontalBar ({ divEl, res, title, yAxis }) {
//   const chartsInstance = res.map((d, i) => {
//     const numberic = nestJSON(d)
//     const args = {
//       colorDomain: d.legendsEnum,
//       items: {
//         title: new Title(title),
//         xAxis: null,
//         yAxis: new AxisTitle(yAxis).left(),
//         legend: new Legend()
//       }
//     }
//     if (divEl) { args.el = divEl }
//     return new Container(args)
//       .initVis([charts.GroupedVerticalBarChart])
//       .wangleData(numberic)
//       .updateVis()
//   })

//   return {
//     update ({ selectedBrands }) {
//       chartsInstance.forEach((chart, i) => {
//         const { labelsEnum } = res[i]
//         const filteredData = nestJSON(res[i])
//         if (labelsEnum.length !== selectedBrands.length) {
//           for (const legend in filteredData) {
//             for (const label in filteredData[legend]) {
//               if (selectedBrands.includes(label)) continue
//               delete filteredData[legend][label]
//             }
//           }
//         }
//         chart.wangleData(filteredData).updateVis()

//         // console.log(108, selectedBrands, res, chart)
//       })
//     }
//   }
// }

function donut ({ divEl, res, title }) {
  const chartsInstance = res.map((d, i) => {
    const numberic = nestJSON(d)
    const args = {
      colorDomain: d.legendsEnum,
      items: {
        title: new Title(title),
        legend: new Legend()
      }
    }
    if (divEl) { args.el = divEl }
    return new Container(args)
      .initVis([charts.PieChart])
      .wangleData(numberic)
      .updateVis()
  })

  return { }
}

function lineType ({ divEl, res, title, xAxis, yAxis }) {
  const chart = res.map((d, i) => {
    const mergeDataset = d.dataset.slice(0, 10).map((set, i) => set.concat(d.dataset[i + 10]))

    const mergeRawData = { labelsEnum: d.labelsEnum, legendsEnum: d.legendsEnum, dataset: mergeDataset }
    const numberic = nestJSON(mergeRawData, true)
    const args = {
      el: '#chart-polyline-' + i,
      SI_unitTicks: true,
      colorDomain: d.labelsEnum,
      items: {
        title: new Title(title),
        xAxis: new AxisTitle(xAxis).bottom({ translateY: 25 }),
        yAxis: new AxisTitle(yAxis).left(),
        legend: new Legend()
      }
    }
    if (divEl) { args.el = divEl }
    return new Container(args)
      .initVis([charts.PredictLineChart])
      .wangleData(numberic)
      .updateVis()
  })
  return chart
}

function floatBar (vm) {
  const toggleChartInstance = lineType(vm)

  const linesData = []
  if (typeof vm.dashboard !== 'undefined') return {}
  const chart = vm.res.map((d, i) => {
    const numberic = d.dataset.slice(0, d.labelsEnum.length).reduce((obj, set, i) => {
      return Object.assign(obj, {
        [d.labelsEnum[i]]: set.reduce((obj, v, i) => {
          return Object.assign(obj, { ['v' + (i + 1)]: v })
        }, {})
      })
    }, {})
    linesData.push(Object.fromEntries(Object.entries(numberic)
      .map(([label, { v2 }]) => [label, { v1: v2 }])))
    const args = {
      el: '#chart-floatBar-' + i,
      SI_unitTicks: true,
      colorDomain: ['搜尋關鍵字'],
      items: {
        title: new Title(vm.title),
        xAxis: new AxisTitle(vm.xAxis).bottom({ translateY: 25 }),
        yAxis: new AxisTitle(vm.yAxis).left()
      }
    }
    if (vm.divEl) { args.el = vm.divEl }
    return new Container(args)
      .initVis([charts.FloatingBarChart])
      .wangleData({ 搜尋關鍵字: numberic })
      .updateVis()
  })
  return {}
}

function radar ({ divEl, res, title, yAxis }) {
  const sets = []
  const chartsInstance = res.map((d, i) => {
    const { labelsEnum, legendsEnum, rawData: usercomment } = d
    const json = nestJSON(d)
    json.平均值 = labelsEnum.reduce((group, label) =>
      Object.assign(group, {
        [label]: legendsEnum.reduce((set, legend) => {
          return { v1: set.v1 + +json[legend][label].v1, comments: [] }
        }, { v1: 0 })
      }),
    {})
    Object.entries(json.平均值).forEach(([label, value]) => {
      json.平均值[label].v1 = +(value.v1 / labelsEnum.length).toFixed(2)
    })
    legendsEnum.forEach((legend, i) => {
      labelsEnum.forEach((label, j) => {
        json[legend][label].comments = usercomment[j][i]
      })
    })
    sets.push(json)

    const args = {
      colorDomain: legendsEnum,
      el: res.length === 1 ? '#chart-svg' : '#chart-numberic-' + i,
      items: {
        title: new Title(title),
        xAxis: null,
        yAxis: new AxisTitle(yAxis).left(),
        legend: new Legend()
      }
    }
    if (divEl) { args.el = divEl }
    return new Container(args).initVis([charts.RadarChart], [{ comments: usercomment }]).wangleData({ 總體平均: json['總體平均'] })
      .updateVis()
  })

  return {

    update (vm) {
      const { selectedBrands, selectedChartType, struct } = vm
      // console.log(74, chartsInstance)
      chartsInstance.forEach((chart, i) => {
        if (struct.filterDefault !== i) return
        const set = sets[i]
        if (selectedBrands.length === 0) {
          chart
            .wangleData({ 總體平均: set['總體平均'] })
            .updateVis()
          return
        }
        const filteredData = selectedBrands.reduce((selected, brand) => {
          return Object.assign(selected, { [brand]: set[brand] })
        }
        , {})
        chart
          .wangleData(filteredData)
          .updateVis()
      })
    }
  }
}
function XYchartFormat ({ labelsEnum, legendsEnum, dataset, rawData }, indexes, brands = []) {
  dataset.forEach((set, i) => {
    if (rawData[i]?.length) {
      set.push(rawData[i])
    }
  })

  return labelsEnum.reduce((labelAcc, label, labelIndex) => {
    const legendData = legendsEnum.reduce((legendAcc, legend, legendIndex) => {
      const filteredItems = dataset.filter(
        ([labelIdx, legendIdx, , brand]) =>
          labelIdx === labelIndex &&
        legendIdx === legendIndex &&
        (brands.length === 0 || brands.includes(brand))
      )

      const v1 = filteredItems.reduce((sum, item) => sum + item[indexes.v1], 0)
      if (v1 === 0) return legendAcc

      const v2Item = filteredItems.reduce(
        (maxItem, item) => item[indexes.v1] > maxItem.v
          ? { v: item[indexes.v1], name: item[indexes.v2] }
          : maxItem,
        { v: -Infinity, name: '' }
      )

      const [[,,,, v3] = []] = filteredItems.filter(([,,,, raw]) => raw)
      const result = { v1, v2: v2Item }
      if (v3?.[0]) {
        result.v3 = v3[0][0]
      }

      return Object.assign(legendAcc, { [legend]: result })
    }, {})

    return Object.assign(labelAcc, { [label]: legendData })
  }, {})
}
function bubble2 ({ divEl, res, title, yAxis, xAxis }) {
  const sets = []
  const chartsInstance = res.map((d, i) => {
    const dataset = XYchartFormat(d, { v1: 2, v2: 3 })

    sets.push(dataset)
    const args = {
      el: res.length === 1 ? '#chart-svg' : '#chart-numberic-' + i,
      colorDomain: d.legendsEnum,
      items: {
        title: new Title(title),
        legend: new HeatmapLegend(),
        // xAxis: null,
        yAxis: new AxisTitle('售價').left()
        // legend: new Legend()
      }
    }
    if (divEl) { args.el = divEl }

    return new Container(args)
      .initVis([charts.RoundHeatmapChart])
      .wangleData(dataset)
      .updateVis()
  })

  return {
    update (vm) {
      const { selectedBrands, selectedChartType, struct } = vm
      chartsInstance.forEach((chart, i) => {
        if (struct.filterDefault !== i) return
        const set = XYchartFormat(res[i], { v1: 2, v2: 3 }, selectedBrands)
        chart.updateCharts([charts.RoundHeatmapChart]).wangleData(set).updateVis()
      })
    }
  }
}

function heatmap ({ divEl, res, title, yAxis, xAxis }) {
  const sets = []

  const chartsInstance = res.map((d, i) => {
    const { unit } = d
    const dataset = XYchartFormat(d, { v1: 2, v2: 3 })
    sets.push(dataset)
    const args = {
      el: res.length === 1 ? '#chart-svg' : '#chart-heat-' + i,
      colorDomain: d.legendsEnum,
      items: {
        title: new Title(title),
        legend: new HeatmapLegend(),
        yAxis: new AxisTitle((xAxis ?? '')).left(),
        xAxis: new AxisTitle((yAxis ?? '') + (unit ? ' ' + unit : '')).bottom()
        // legend: new Legend()
      }
    }
    if (divEl) { args.el = divEl }

    return new Container(args)
      .initVis([charts.HeatmapChart])
      .wangleData(dataset)
      .updateVis()
  })

  return {
    update (vm) {
      const { selectedBrands, selectedChartType, struct } = vm
      chartsInstance.forEach((chart, i) => {
        if (struct.filterDefault !== i) return
        const set = XYchartFormat(res[i], { v1: 2, v2: 3 }, selectedBrands)

        if (selectedChartType === 'heat') {
          chart.updateCharts([charts.HeatmapChart]).wangleData(set).updateVis()
        }
        if (selectedChartType === 'scatter') {
          chart.updateCharts([charts.HeatmapToRound]).wangleData(set).updateVis()
        }
      })
    }
  }
}

function wordCloud ({ res }) {
  const { dataset, labelsEnum, legendsEnum } = res[0]
  const json = nestJSON({ labelsEnum, legendsEnum, dataset }, true)
  const chart = new charts.Cloud().init().wangleData(json).updateVis()

  return {
    update ({ selectedBrands }) {
      const filter = {}
      Object.keys(json).forEach(group => {
        selectedBrands.forEach(brand => {
          filter[group] ??= {}
          filter[group][brand] = json[group][brand]
        })
      })
      chart.wangleData(filter).updateVis()
    }
  }
}

function bubbleData ({ legendsEnum, dataset, labelsEnum }) {
  const _legendsEnum = legendsEnum.slice()

  ; [_legendsEnum[0], _legendsEnum[1], _legendsEnum[2], _legendsEnum[3]] = ['X', 'Y', 'qty', 'product']

  return dataset.map(entry => _legendsEnum.reduce((acc, key, index) => {
    acc[key] = key === 'product' ? labelsEnum[entry[index]] : entry[index]
    return acc
  }, {}))
}

function bubble ({ divEl, sn, res, title, yAxis, xAxis }) {
  const sets = []
  const chartsInstance = res.map((d, i) => {
    const { unit } = d
    const dataset = Object.groupBy(bubbleData(d), d => d.product)
    sets.push(dataset)

    const args = {
      el: res.length === 1 ? '#chart-svg' : '#chart-numberic-' + i,
      colorDomain: d.labelsEnum,
      items: {
        title: new Title(title),
        xAxis: new AxisTitle((xAxis ?? '') + (unit ? ' ' + unit : '')).bottom(),
        yAxis: new AxisTitle((yAxis ?? '') + (unit ? ' ' + unit : '')).left(),
        legend: new Legend()
      }
    }
    if (divEl) { args.el = divEl }
    return new Container(args)
      .initVis([charts.BubbleChart])
      .wangleData(dataset)
      .updateVis()
  })

  return {
    update (vm) {
      const { selectedBrands, selectedChartType, struct } = vm
      chartsInstance.forEach((chart, i) => {
        if (struct.filterDefault !== i) return
        const data = selectedBrands.length
          ? Object.fromEntries(
            Object.entries(sets[i]).filter(([key]) => selectedBrands.includes(key))
          )
          : sets[i]

        chart.wangleData(data).updateVis()
      })
    }
  }
}

const thousands = d3.format(',.0f')
const fixed2 = d3.format('.3p')

const numType = [
  { valueType: 'numberic', label: '數量', hasContainer: true, sameContainer: true }
]
const withPercent = [
  { valueType: 'numberic', label: '數量', hasContainer: true, sameContainer: true },
  { valueType: 'percentage', label: '占比', hasContainer: false, sameContainer: true }
]
const heatmapRep = [
  { valueType: 'heat', label: '所有產品', hasContainer: true, sameContainer: true },
  { valueType: 'scatter', label: '代表產品', hasContainer: false, sameContainer: true }
]

const chartTypes = {
  L01: { sn: 'L01', launcher: slope, title: '產品使用情境趨勢', toggleChartTypes: numType },
  L02: { sn: 'L02', launcher: slope, title: '產品適用環境趨勢', toggleChartTypes: numType },
  L03: { sn: 'L03', launcher: slope, title: '產品主打訴求趨勢', toggleChartTypes: numType },
  L04: { sn: 'L04', launcher: slope, title: '產品功能趨勢', toggleChartTypes: numType },
  L05: { sn: 'L05', launcher: slope, title: '產品效能趨勢', toggleChartTypes: numType },
  L06: { sn: 'L06', launcher: slope, title: '產品外觀風格趨勢', toggleChartTypes: numType },
  L07: { sn: 'L07', launcher: slope, title: '產品尺寸趨勢', toggleChartTypes: numType },
  L08: { sn: 'L08', launcher: slope, title: '產品重量容量趨勢', toggleChartTypes: numType },
  B01: {

    sn: 'B01',
    launcher: floatBar,
    title: '搜尋熱度',
    toggleChartTypes: [
      { valueType: 'floatBar', label: '箱型圖', hasContainer: true, sameContainer: false },
      { valueType: 'polyline', label: '折線圖', hasContainer: true, sameContainer: false }
    ]
  },

  B02: { sn: 'B02', launcher: groupedBar, title: '產品售價分析', toggleChartTypes: numType },
  B03: { sn: 'B03', launcher: groupedBar, title: '市場好感度', toggleChartTypes: numType },

  B04: { sn: 'B04', launcher: groupedBar, title: '市場分佈概況', toggleChartTypes: numType },
  B05: { sn: 'B05', launcher: groupedBar, title: '產品配件', toggleChartTypes: numType },
  B06: { sn: 'B06', launcher: groupedBar, title: '銷售方案分析(momo)', toggleChartTypes: numType },

  B07: { sn: 'B07', launcher: switchBarType, title: '產品使用情境', toggleChartTypes: withPercent },
  B08: { sn: 'B08', launcher: switchBarType, title: '產品適用環境', toggleChartTypes: withPercent },
  B09: { sn: 'B09', launcher: switchBarType, title: '產品主打訴求分析', toggleChartTypes: withPercent },
  B10: { sn: 'B10', launcher: switchBarType, title: '產品功能分析', toggleChartTypes: withPercent },
  B11: { sn: 'B11', launcher: switchBarType, title: '產品效能分析', toggleChartTypes: withPercent },
  B12: { sn: 'B12', launcher: switchBarType, title: '產品風格分析', toggleChartTypes: withPercent },
  B13: { sn: 'B13', launcher: switchBarType, title: '產品色彩分析', toggleChartTypes: withPercent },
  B14: { sn: 'B14', launcher: switchBarType, title: '產品材質分析', toggleChartTypes: withPercent },
  B15: { sn: 'B15', launcher: switchBarType, title: '產品尺寸分析', toggleChartTypes: withPercent },
  B16: { sn: 'B16', launcher: switchBarType, title: '產品重量分析', toggleChartTypes: withPercent },
  B17: { sn: 'B17', launcher: switchBarType, title: '產品容量分析', toggleChartTypes: withPercent },
  B19: { sn: 'B19', launcher: switchBarType, title: '使用者喜歡的原因', toggleChartTypes: withPercent },
  B20: { sn: 'B20', launcher: switchBarType, title: '使用者不喜歡的原因', toggleChartTypes: withPercent },
  // B18: { sn: 'B18', launcher: switchBarType, title: '熱門募資區間*僅子類、台灣市場', factor: ['產品數量占比', '募資人數占比'], filterable: true, sortable: true },

  W01: { sn: 'W01', launcher: wordCloud, title: '產品族群分析' },

  R01: { sn: 'R01', launcher: radar, title: '使用者喜歡的原因', toggleChartTypes: numType },
  R02: { sn: 'R02', launcher: radar, title: '使用者不喜歡的原因', toggleChartTypes: numType },

  M01: { sn: 'M01', launcher: bubble, title: '募資市場概況*僅子類、台灣市場' },
  M02: { sn: 'M02', launcher: bubble, title: '產品尺寸二維分析', toggleChartTypes: numType },

  M03: { sn: 'M03', launcher: bubble2, title: '產品使用情境/售價分析', toggleChartTypes: numType },
  M04: { sn: 'M04', launcher: bubble2, title: '產品功能/售價分析', toggleChartTypes: numType },
  M05: { sn: 'M05', launcher: bubble2, title: '產品效能/售價分析', toggleChartTypes: numType },
  M06: { sn: 'M06', launcher: bubble2, title: '產品尺寸/售價分析', toggleChartTypes: numType },
  M07: { sn: 'M07', launcher: bubble2, title: '產品重量容量/售價分析', toggleChartTypes: numType },
  M08: { sn: 'M08', launcher: bubble2, title: '產品外觀風格/售價分析', toggleChartTypes: numType },

  M09: { sn: 'M09', launcher: heatmap, title: '產品訴求/材質分析', toggleChartTypes: heatmapRep },
  M10: { sn: 'M10', launcher: heatmap, title: '產品訴求/尺寸分析', toggleChartTypes: heatmapRep },
  M11: { sn: 'M11', launcher: heatmap, title: '產品訴求/重量容量分析', toggleChartTypes: heatmapRep },
  M12: { sn: 'M12', launcher: heatmap, title: '產品訴求/功能分析', toggleChartTypes: heatmapRep },
  M13: { sn: 'M13', launcher: heatmap, title: '產品訴求/效能分析', toggleChartTypes: heatmapRep },
  M14: { sn: 'M14', launcher: heatmap, title: '產品使用情境/風格分析', toggleChartTypes: heatmapRep },
  M15: { sn: 'M15', launcher: heatmap, title: '產品使用情境/尺寸分析', toggleChartTypes: heatmapRep },
  M16: { sn: 'M16', launcher: heatmap, title: '產品使用情境/重量容量分析', toggleChartTypes: heatmapRep },
  M17: { sn: 'M17', launcher: heatmap, title: '產品風格/功能分析', toggleChartTypes: heatmapRep },
  M18: { sn: 'M18', launcher: heatmap, title: '產品尺寸/功能分析', toggleChartTypes: heatmapRep },
  M19: { sn: 'M19', launcher: heatmap, title: '產品重量容量/功能分析', toggleChartTypes: heatmapRep },
  M20: { sn: 'M20', launcher: heatmap, title: '產品色彩/材質分析', toggleChartTypes: heatmapRep },
  M21: { sn: 'M21', launcher: heatmap, title: '產品材質/尺寸分析', toggleChartTypes: heatmapRep },
  M22: { sn: 'M22', launcher: heatmap, title: '產品色彩/尺寸分析', toggleChartTypes: heatmapRep },

  D01: { sn: 'D01', launcher: donut, title: '線上銷售概況(momo)' },

  // T01: { sn: 'T01', launcher: '', title: '線上銷售概況(amazon)' },
  // RE01: { sn: 'RE01', launcher: '', title: '產品最新消息' },
  // RE02: { sn: 'RE02', launcher: '', title: '相關技術趨勢' },
  // RE03: { sn: 'RE03', launcher: '', title: '相關製程' },
  // RE04: { sn: 'RE04', launcher: '', title: '相關法規' },
  // G01: { sn: 'G01', launcher: '', title: '產品使用情境/風格圖片' },
  // G02: { sn: 'G02', launcher: '', title: '同風格的產品' },
  TA1: {
    sn: 'TA1',
    // launcher () {
    //   return {
    //     update () {
    //       console.log(selectedBrands, res)
    //     }
    //   }
    // },
    title: '競品分析表'
  }
}
/* filename => chartTypes.js */
