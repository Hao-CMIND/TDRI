/* filename => main.js */
function mainThread ({ majorId, source, portName }) {
  // console.log(sw)
  const { port } = new SharedWorker(sw, portName)

  port.addEventListener('message', function (e) {
    const commands = {
      async ready ({ chart, roles, category, tags, tagsMarket, tagsProduct }) {
        productsDataReady({ chart, sharedWorker: port, roles, category, tags, tagsMarket, tagsProduct })
      },
      setHeight ({ height, iframeIndex }) {
        if (iframeIndex) {
          $('iframe').nth(iframeIndex).height(height)
        }
        $('iframe').height(height)
      }

    }

    const { data: { action } } = e
    if (commands[action]) {
      // console.log(action, e.data)
      commands[action](e.data)
      return
    }
    console.log('debug =>', e.data)
  })
  port.start()
  // console.log('majorId, source', majorId, source)
  port.postMessage({ action: 'main', majorId, source })

  let productsDataReady

  return new Promise((resolve, reject) => {
    productsDataReady = resolve
  })
}
/* filename => main.js */
