let main, chart, category, tags, roles, tagsMarket, tagsProduct
let branch = null
let iframeReady = null

const enumUsers = ['TW', 'US']
const domain = 'https://tdri2024.cmind.com.tw/api/PDE/' // 'https://datatools.rdlab.tw/api/PDE/' //
console.info('PDE API Domain↑↑↑↑↑↑↑↑↑', domain)
function iframeInit (frameIndex) {
  return new Promise((resolve) => {
    if (typeof iframeReady === 'object' && iframeReady !== null) {
      iframeReady[frameIndex] = resolve
      return
    }
    iframeReady = resolve
  })
}
async function fetchStructure (params = '') {
  try {
    const res = await (await fetch(domain + 'Structure' + params)).json() // staticStructure//
    ;({ chart, category, tags, roles, tagsMarket, tagsProduct } = res)
    chart.forEach(({ category: cIndice, tag: tIndice, role: rIndice, tagMarket: tMIndice, tagProduct: tPIndice }) => {
      cIndice.forEach((index, i) => cIndice.splice(i, 1, category[index]))
      tIndice.forEach((index, i) => tIndice.splice(i, 1, tags[index]))
      rIndice.forEach((index, i) => rIndice.splice(i, 1, roles[index]))
      tMIndice.forEach((index, i) => tMIndice.splice(i, 1, tagsMarket[index]))
      tPIndice.forEach((index, i) => tPIndice.splice(i, 1, tagsProduct[index]))
    })
    return res
  } catch (err) {
    console.error(err)
  }
}
async function fetchData (ID, Chart, Source) {
  const res = await (await fetch(domain + 'Data/' + ID, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Chart, Source })
  })).json()
  res.forEach(r => {
    r.legendsEnum.forEach((legend, i) => {
      if (!legend) {
        r.legendsEnum[i] = 'anonymous' + i
      }
    })
    r.labelsEnum.forEach((label, i) => {
      if (!label) {
        r.labelsEnum[i] = 'anonymous' + i
      }
    })
    if (chart.find(c => c.id === r.id).sn === 'G01') {
      r.dataset.forEach(([labels, legends]) => {
        labels.forEach((label, i) => {
          labels[i] = r.labelsEnum[label]
        })
        legends.forEach((legend, i) => {
          legends[i] = r.legendsEnum[legend]
        })
      })
    }
  })
  console.log(res)
  return res
}

addEventListener('connect', function ({ ports }) {
  const [port] = ports
  port.start()
  port.addEventListener('message', async function (e) {
    const commands = {
      async main ({ majorId, source }) {
        const params = `?ID=${majorId}&Source=${source}`
        await fetchStructure(params)
        port.postMessage({ action: 'ready', chart, roles, category, tags, tagsMarket, tagsProduct })
        main = port
      },
      /*  async channels ({ majorId, channelsId, source }) {
        branch = {}
        iframeReady = {}
        let structures // []
        fetchStructure().then((structure) => {
          console.log('structure done')
          structures = channelsId.map((id, i) => {
            const task = { action: 'getStructure', structure: structure.chart.find(({ id: chartId }) => chartId === id) }
            if (branch[i]) {
              branch[i].postMessage(task)
            } else {
              iframeInit(i).then(port => {
                port.postMessage(task)
                iframeReady[i] = null
              })
            }

            return task.structure
          })
          console.log(structures)
        })
        fetchData(majorId, channelsId, source).then(async (res) => {
          console.log('data done')
          res.forEach((res, i) => {
            structures[i].datum ??= {}
            structures[i].datum = { [enumUsers[source]]: res }
          })
          console.log(structures)
        })
        // await Promise.all([fetchStructure(), fetchData(majorId, channelsId, source)]).then(([fetchStructures, data]) => {
        //   ({ chart, category, tags } = fetchStructures)

        //   const channelsStructures = channelsId.map((id, i) => {
        //     const findedStructure = chart.find(({ id: chartId }) => id === chartId)
        //     findedStructure.datum ??= {}
        //     const user = enumUsers[source]
        //     findedStructure.datum[user] = data[i]
        //     return findedStructure
        //   })

        //   console.log(channelsStructures)
        // })

        // main = port
      }, */

      branch ({ iframeIndex: i }) {
        //       branch[i]?.postMessage({ action: 'resChartData', res })
        /* if (typeof branch === 'object' && branch !== null) {
          branch[i] = port
          if (iframeReady[i]) {
            iframeReady[i](port)
          }
          return
        } */
        iframeReady && iframeReady(port)
        branch = port
      },
      async sendId ({ majorId, id: branchId, source, filename }) {
        branch?.postMessage({ action: 'close' })
        branch?.close()
        branch = null
        console.log({ chart, branchId })
        const structure = chart.find(({ id }) => +branchId === +id)

        let resChartData
        iframeInit().then(iframe => {
          iframe.postMessage({ action: 'getStructure', structure })
          if (resChartData) {
            iframe.postMessage(resChartData)
          }
          iframeReady = null
        })
        this.getChartData(structure, majorId, branchId, source, filename).then(res => {
          resChartData = res
        })
      },
      async getChartData (structure, majorId, id, source, filename) {
        const user = enumUsers[source]
        structure.datum ??= {}
        structure.datum[user] ??= await fetchData(majorId, [id], source)
        const task = { action: 'errorResChartData', res: structure.datum[user], filename, reqBody: { ID: majorId, ChartID: [id], source } }
        if (Array.isArray(structure.datum[user])) {
          task.action = 'resChartData'
        }
        branch?.postMessage(task)
        return task
      },

      toMain ({ do: action, emit = {} }) {
        main.postMessage({ action, ...emit })
      },
      toBranch ({ do: action, emit = {} }) {
        branch.postMessage({ action, ...emit })
      }
    }
    const { data: { action } } = e
    if (commands[action]) {
      await commands[action](e.data)
      if (port === main) console.log('main', action, e.data)
      else console.log('branch', action, e.data)

      return
    }
    console.log('debug =>', e.data)
  })
})
