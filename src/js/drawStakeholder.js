const { createApp, onMounted, reactive, ref, watch, computed, nextTick } = Vue

const app = createApp({
  setup () {
    function openAdv (e) {
      $('.js-base-edit').addClass('hidden')
      $('.js-edit-adv').removeClass('hidden')
      $('.js-canvas-area').addClass('hidden').next().addClass('sp-8')
      $('.js-character-preview-info').removeClass(['sp-12', 'js-character-preview-info']).addClass(['sp-4', 'js-character-preview-info'])
      $('.js-edit-column').removeClass(['side-column-w', 'ml-auto', 'bg-fa']).addClass(['bg-white'])
      $('.js-bg-fb').addClass(['card-fb'])
      $('.js-show-popover').popover('show')
    }
    async function closeAdv (e) {
      saveBasicEdit()
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          $('.js-show-popover').popover('hide')
          resolve()
        }, 100)
      })

      $('.js-base-edit').removeClass('hidden')
      $('.js-edit-adv').addClass('hidden')
      $('.js-canvas-area').removeClass('hidden').next().removeClass('sp-8')
      $('.js-character-preview-info').removeClass(['sp-4', 'js-character-preview-info']).addClass(['sp-12', 'js-character-preview-info'])
      $('.js-edit-column').addClass(['side-column-w', 'ml-auto', 'bg-fa']).removeClass(['bg-white'])
      $('.js-bg-fb').removeClass(['card-fb'])
    }
    function closeDetail (e) {
      $('.js-list-character').removeClass('hidden')
      $('.js-edit-character').addClass('hidden')
    }
    const cCtx = ref({})
    function handleMouseLeave (event) {
      const { action, node } = state
      if (action === 'move') {
        const pos = getPosition(cCtx.value, event)
        outOfCanvas(node, pos)
      }
      state.reset()
      cCtx.value.scaling(() => {
        cCtx.value.draw(nodesRef.value, linksRef.value)
      })
      cCtx.value.el.style.cursor = 'default'
    }

    function handleMouseMove (event) {
      cCtx.value.scaling(() => {
        const pos = getPosition(cCtx.value, event)
        const { action, node: source, dir: from, link: hoverLink } = state

        // // 移動節點
        if (action === 'move' && source) {
        // 檢查是否有移動
          if (source.x === pos.x && source.y === pos.y) return

          // 更新被移動節點的位置
          source.x = pos.x
          source.y = pos.y

          // 重繪背景和所有節點（不包括連接線）
          cCtx.value.ctx.clearRect(0, 0, cCtx.value.w, cCtx.value.h)

          cCtx.value.drawCharacter(nodesRef.value)
          console.log(`${source.title} 移動中`, `${source.title} 移動中`, `${pos.x},${pos.y}`)
        }

        if (!source) {
          const pointingLinks = linksRef.value.filter(link => cCtx.value.ctx.isPointInStroke(link.path, pos.x, pos.y))
          if (pointingLinks.length === 1 && !hoverLink) {
            cCtx.value.ctx.save()
            state.link = pointingLinks[0]

            cCtx.value.drawLinks(pointingLinks, '#7a59ff')

            cCtx.value.ctx.restore()
            return
          }

          if (pointingLinks.length !== 1 && hoverLink) {
            state.reset()
            cCtx.value.draw(nodesRef.value, linksRef.value)
          }
        }

        const node = getActionNode(nodesRef.value, pos)
        // 開始連接節點
        // console.log('移動超過10才開始繪圖')
        if (action === 'connection') {
          cCtx.value.draw(nodesRef.value, linksRef.value)
          cCtx.value.drawDeparturePoints(source, from)

          if (distance(source, pos) < 35) {
            return
          }

          let to = getArrivalDir(state.node, pos)

          if (node) {
            const dir = getDirPoint(node, pos)
            if (dir) {
              cCtx.value.drawDeparturePoints(node)
              to = dir
              console.log(`${source.title}, ${from} 靠近 ${node.title}, ${dir}`)
            }
          }
          cCtx.value.ctx.save()
          cCtx.value.ctx.lineWidth = 1
          cCtx.value.ctx.setLineDash([2])
          const route = cCtx.value.drawRoute({ source, from, to, target: { left: pos.x - 1, top: pos.y - 1, width: 2, height: 2 } })
          cCtx.value.ctx.restore()
          if (route?.length) {
            cCtx.value.drawArrivalPoint(pos, to, 'cursor')
            console.log(`${source.title}, ${from} 連線中`)
          }
          return
        }

        if (action === 'none' && node && !source) {
          console.log(`Enter node: ${node.title}`)
          cCtx.value.drawDeparturePoints(node)

          Object.assign(state, { action: 'enter', node })
        }
        if (action === 'enter' && !node && source) {
          console.log(`Leave node: ${source.title}`)
          cCtx.value.draw(nodesRef.value, linksRef.value)
          state.reset()
        }
      })
    }

    function animateFrame (event) {
      requestAnimationFrame(handleMouseMove.bind(null, event))
    }

    function handleMouseDown (event) {
      const pos = getPosition(cCtx.value, event)

      // 初始化操作狀態
      state.reset()

      // 檢查滑鼠是否按下在節點上
      const node = getActionNode(nodesRef.value, pos)
      if (!node) return
      openEdit(node)

      // // 優先檢查是否在四周圓點上
      const dir = getDirPoint(node, pos)
      if (dir) {
        Object.assign(state, { action: 'connection', node, dir })
        cCtx.value.el.style.cursor = 'none'

        console.log(`${node.title} ${dir}`)
      }

      // // 如果不在四周圓點上，檢查是否在節點中心
      if (distance(node, pos) < 25) {
        const uuid = getNodeUUID(nodesRef.value, node)
        delete nodesRef.value[uuid]
        nodesRef.value[uuid] = node
        // 距離節點中心小於 25，記錄為移動節點
        Object.assign(state, { action: 'move', node, initPos: { x: node.x, y: node.y } })
        console.log(`${node.title} 移動`)
      }
    }
    async function setup ({ nodes, links }) {
      console.log(vm)
      await Promise.all(Object.entries(nodes)
        .map(([uuid, node]) => {
          nodes[uuid] = new Node(node)
          return nodes[uuid].loadImg()
        })
      )

      links.forEach(link => {
        link.source = nodes[link.source]
        link.target = nodes[link.target]
        updateLinkData(link)
      })
      nodesRef.value = nodes
      linksRef.value = links
      Node.cCtx = cCtx.value
      Node.links = linksRef.value
      Node.nodes = nodesRef.value
    }
    function updateLinkData (link) {
      const route = getRoute(link, cCtx.value.w + 100, cCtx.value.h + 100)
      link.path = roundCornersPath(route)
      link.tagCenter = getActionPositon(route)
      return link
    }
    function outOfCanvas (node, pos) {
      const avatar = 45
      const boundary = { right: cCtx.value.w / cCtx.value.scaleRatio, bottom: cCtx.value.h / cCtx.value.scaleRatio }
      if (pos.x <= avatar) {
        node.x = avatar
      }
      if (pos.y <= avatar) {
        node.y = avatar
      }
      if (pos.x >= boundary.right - avatar) {
        node.x = boundary.right - avatar
      }
      if (pos.y >= boundary.bottom - avatar) {
        node.y = boundary.bottom - avatar
      }
    }
    async function handleMouseUp (event) {
      cCtx.value.scaling(() => {
        const { action, node: source, dir: from, initPos } = state
        console.log(state)
        if (action === 'none') return
        const pos = getPosition(cCtx.value, event)
        cCtx.value.el.style.cursor = 'default'
        state.reset()

        if (action === 'move') {
          const isOverlapping = Object.values(nodesRef.value).some(node => node !== source && distance(node, pos) < 45)
          if (isOverlapping) {
            Object.assign(source, initPos)
          }
          outOfCanvas(source, pos)

          linksRef.value.filter(({ source: s, target: t }) => s === source || t === source).forEach(link => {
            updateLinkData(link)
          })

          cCtx.value.draw(nodesRef.value, linksRef.value)
          return
        }

        const node = getActionNode(nodesRef.value, pos)
        if (node && node !== source) {
          const to = getDirPoint(node, pos)
          if (to) {
            vm.newLink({ source, target: node, from, to })
          }
        }
        cCtx.value.draw(nodesRef.value, linksRef.value)
      })
    }
    function handleDblclick (event) {
      const pos = getPosition(cCtx.value, event)
      const node = getActionNode(nodesRef.value, pos)

      if (node) {
        if (distance(node, pos) < 25) {
          console.log(`${node.title} 連續點擊`)
          vm.editCharacter(node)
        }
        return
      }
      const pointingLinks = linksRef.value.filter(link => cCtx.value.ctx.isPointInStroke(link.path, pos.x, pos.y))
      if (pointingLinks.length === 1) {
        vm.editLink(pointingLinks)
      }
    }
    const verbatim = ref('')
    const editCharacterTitle = ref('')
    const editLinkAction = ref('')
    const nodesRef = ref({})
    const linksRef = ref([])
    const selectedUUID = ref('')
    const selectedNode = ref({
      title: '',
      radius:
      {
        benefits: '',
        desc: ['', '', ''],
        group: '',
        rights: ''
      }
    })
    function changeNodePosition (e, type) {
      const pos = selectedNode.value.getPosition({ type, value: e.target.value })

      if (pos === undefined) return
      selectedNode.value.x = pos.x
      selectedNode.value.y = pos.y
      linksRef.value.filter(({ source: s, target: t }) => s === selectedNode.value || t === selectedNode.value).forEach(link => {
        updateLinkData(link)
      })

      cCtx.value.draw(nodesRef.value, linksRef.value)
    }

    const editTarget = ref({})
    const base64 = ref('')
    const getRelLinks = computed(() => {
      return {
        from: selectedNode.value.fromLinks || [],
        to: selectedNode.value.toLinks || []
      }
    })
    const canvasRef = ref(null)

    const bgRef = ref(null)
    const bgfill = ref([])
    function uploadVerbatim (modalId) {
      $('#' + modalId).modal('hide')
      console.log(verbatim.value)
      $('#select-aisample').modal('show')
    }

    function selectSample (modalId, sample) {
      $('#' + modalId).modal('hide')
      console.log(sample)
    }
    function selectDesign (modalId, sample) {
      $('#' + modalId).modal('hide')
      console.log(sample)
    }

    function uploadExcel (e, modalId) {
      $('#' + modalId).modal('hide')
      console.log(e.target.files)
    }
    const newUUID = ref('')
    function openEdit (node) {
      selectedNode.value = node
      $('.js-edit-character').removeClass('hidden')
      $('.js-list-character').addClass('hidden')
    }
    async function addCharacter (modalId) {
      // $('#' + modalId).modal('hide')
      // const title = editCharacterTitle.value.trim()
      // console.log(title)
      // if (title) {

      const node = new Node({ title: '' })
      await node.loadImg()
      selectedNode.value = node
      openEdit(node)
      console.log(node)
      // nodesRef.value[uuid] = node
      // cCtx.value.drawCharacter(node)
      // editCharacterTitle.value = ''
      // }
    }
    function saveBasicEdit () {
      console.log('儲存人物', selectedNode.value)
      const { title, radius: { rights, benefits, group } } = selectedNode.value
      if (title.trim() && rights && benefits && group) {
        const uuid = _uuid()
        newUUID.value = uuid

        nodesRef.value[newUUID.value] = selectedNode.value
        cCtx.value.drawCharacter(selectedNode.value)
      }
    }

    function newLink (link) {
      editTarget.value = link
      $('#create-link').modal('show')
    }

    function addLink (modalId) {
      $('#' + modalId).modal('hide')
      const action = editLinkAction.value.trim()
      if (action) {
        const { source, target } = editTarget.value
        editTarget.value.action = action
        const existingLink = linkExists(linksRef.value, source, target)
        const newLink = updateLinkData(editTarget.value)

        linksRef.value.splice(linksRef.value.indexOf(existingLink), +Boolean(existingLink), newLink)
        cCtx.value.draw(nodesRef.value, linksRef.value)
        editLinkAction.value = ''
      }
    }
    function closeModal (modalId) {
      $('#' + modalId).modal('hide')
    }
    function removeLink (link) {
      const i = linksRef.value.indexOf(link)
      linksRef.value.splice(i, 1)
      cCtx.value.draw(nodesRef.value, linksRef.value)
    }
    function editCharacter (node) {
      $('#edit-character').modal('show')
      editCharacterTitle.value = node.title
      editTarget.value = node
    }
    function finishedEdittingCharacter (modalId) {
      $('#' + modalId).modal('hide')
      const title = editCharacterTitle.value.trim()
      if (title) {
        editTarget.value.title = title
        cCtx.value.draw(nodesRef.value, linksRef.value)
      }
    }
    function deleteCharacter (modalId) {
      $('#' + modalId).modal('hide')
      const uuid = getNodeUUID(nodesRef.value, editTarget.value)
      const getIndex = () => linksRef.value.findIndex(link => link.source === editTarget.value || link.target === editTarget.value)
      let index = getIndex()
      while (index > 0) {
        linksRef.value.splice(index, 1)
        index = getIndex()
      }
      delete nodesRef.value[uuid]
      cCtx.value.draw(nodesRef.value, linksRef.value)
    }
    function editLink (link) {
      $('#edit-link').modal('show')
      editTarget.value = link[0]
      editLinkAction.value = link[0].action
    }
    function finishedEdittingLink (modalId) {
      $('#' + modalId).modal('hide')
      const newAction = editLinkAction.value.trim()
      if (newAction && newAction !== editTarget.value.action) {
        editTarget.value.action = newAction
        cCtx.value.draw(nodesRef.value, linksRef.value)
      }
    }
    function deleteLink (modalId) {
      $('#' + modalId).modal('hide')
      const findedLink = editTarget.value
      const index = linksRef.value.findIndex(link => {
        return link === findedLink
      })
      linksRef.value.splice(index, 1)
      cCtx.value.draw(nodesRef.value, linksRef.value)
    }
    function saveCanvasData () {
      const req = {
        nodes: postNodesJSON(nodesRef.value),
        links: postLinksJSON(nodesRef.value, linksRef.value)
      }
      console.log(req)
      console.log(JSON.stringify(req, null, 2))
    }
    function downloadCanvas () {
      console.log(cCtx)
      cCtx.value.ctx.clearRect(0, 0, cCtx.value.w, cCtx.value.h)
      cCtx.value.drawBackground()
      cCtx.value.scaling(() => {
        cCtx.value.drawCharacter(nodesRef.value)
        cCtx.value.drawLinks(linksRef.value, '#bdbdbd')
        cCtx.value.ctx.lineWidth = 8
      })
      // const img = document.createElement('canvas')
      // img.width = cCtx.value.el.width
      // img.height = cCtx.value.el.height
      // const imgCtx = img.getContext('2d')
      // imgCtx.drawImage(cCtx.value.el, 0, 0, img.width, img.height)
      base64.value = cCtx.value.el.toDataURL('image/png', 1.0)
    }
    function popoverClickHandler (e) {
      const card = this
      const btn = e.target
      if (e.target.nodeName === 'BUTTON') {
        const actions = {
          saveAs () {
            $('#alert-modal').modal('show')
          },
          delete () {
            $('#alert-modal').modal('show')
          },
          edit () {
            openEdit(nodesRef.value[selectedUUID.value])
          },
          editAdv () {
            openEdit(nodesRef.value[selectedUUID.value])
            openAdv()
          }
        }
        actions[btn.dataset.action]?.()
      }
    }
    function showBg (img) {
      $(img).removeClass('invisible')
    }
    function hideBg (img) {
      $(img).addClass('invisible')
    }
    return { saveBasicEdit, newUUID, popoverClickHandler, changeNodePosition, selectDesign, selectSample, uploadVerbatim, uploadExcel, verbatim, base64, downloadCanvas, saveCanvasData, cCtx, setup, handleMouseLeave, handleDblclick, animateFrame, handleMouseDown, handleMouseUp, bgRef, bgfill, canvasRef, openAdv, editTarget, closeAdv, closeDetail, nodesRef, linksRef, selectedUUID, selectedNode, getRelLinks, removeLink, editLinkAction, editCharacterTitle, closeModal, addCharacter, addLink, editCharacter, editLink, finishedEdittingCharacter, deleteCharacter, finishedEdittingLink, deleteLink, newLink, showBg, hideBg }
  },
  async updated () {
    const vm = this
    await nextTick()
    let popoverClickBinding = null
    if (vm.newUUID) {
      const popovers = $(`[data-uuid="${vm.newUUID}"]`).on('click', function (e) {
        e.stopPropagation()
        vm.selectedUUID = this.dataset.uuid
      })
        .on('inserted.bs.popover', function (e) {
          popoverClickBinding = vm.popoverClickHandler.bind($(this).parents('.card'))
          $('.popover').on('click', popoverClickBinding)
        }).on('hidden.bs.popover', function (e) {
          $('.popover').off('click', popoverClickBinding)
        }).map(btn => new $.bootstrap.Popover(btn))

      vm.newUUID = ''
    }
  },
  async mounted () {
    const vm = this
    console.log('↓↓↓↓↓↓↓↓↓靜態站測試用 有vue會把原有元素移除重新渲染')
    $('.btn-toggle-aside').on('click', function (e) {
      $('#pde-aside').toggleClass('minimize')
    })
    console.log('↑↑↑↑↑↑↑↑靜態站測試用 有vue會把原有元素移除重新渲染')

    console.log('進入頁面先new 出canvas，畫背景存入Img')
    vm.cCtx = new CanvasContext(vm.canvasRef)

    await vm.cCtx.imgBg(vm.bgRef)
    await vm.cCtx.imgBg(vm.bgfill[3], { fill1: '#828282', fill2: '#828282', fill3: '#828282' })
    await vm.cCtx.imgBg(vm.bgfill[0], { fill1: '#828282', fill2: '#828282', rect: '#828282' })
    await vm.cCtx.imgBg(vm.bgfill[1], { fill1: '#828282', fill3: '#828282', rect: '#828282' })
    await vm.cCtx.imgBg(vm.bgfill[2], { fill2: '#828282', fill3: '#828282', rect: '#828282' })

    state.reset()

    const { action } = Object.fromEntries(new URLSearchParams(location.search))
    const actions = {
      blank () {
        console.log('空白範本')
        return true
      },
      sample () {
        console.log('範本')

        $('#create-sample').modal('show')
        return true
      },
      excel () {
        console.log('excel')
        $('#upload-excel').modal('show')
        return true
      },
      aisample () {
        console.log('ai範本')
        $('#select-built-modal').modal('show')
        return true
      },
      aitext () {
        console.log('ai逐字稿')
        $('#upload-textcontent').modal('show')
        return true
      }
    }
    console.log('執行actions.', action ?? 'default', '()')
    if (!actions[action]?.()) {
      console.log('default')
      console.log('getData 模擬fetch資料回傳後，初始化資料，再匯出節點、連接線')
      await vm.setup(await getData())
      vm.cCtx.scaling(() => { vm.cCtx.draw(vm.nodesRef, vm.linksRef) })

      let popoverClickBinding = null
      await nextTick()
      const popovers = $('.js-popovers-option').on('click', function (e) {
        e.stopPropagation()
        vm.selectedUUID = this.dataset.uuid
      })
        .on('inserted.bs.popover', function (e) {
          popoverClickBinding = vm.popoverClickHandler.bind($(this).parents('.card'))
          $('.popover').on('click', popoverClickBinding)
        }).on('hidden.bs.popover', function (e) {
          $('.popover').off('click', popoverClickBinding)
        }).map(btn => new $.bootstrap.Popover(btn))
    }
  }
})
const vm = app.mount('#app')
