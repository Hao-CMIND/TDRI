const { createApp, onMounted, reactive, ref, watch, computed, nextTick } = Vue
const app = createApp({
  setup () {
    const cols = ref(['投入待洗衣物', '投入待洗衣物', '投入待洗衣物'])
    const rowTypes = { input: [], img: '', svg: 5 }
    const rows = ref([
      { type: 'input', title: '顧客行為分析', value: [[], [], []] },
      { type: 'img', title: '接觸點識別與追蹤', value: ['', '', ''] },
      { type: 'svg', title: '情感與思考追蹤', value: [5, 5, 5] },
      { type: 'input', title: '期望與目標設定', value: [[], [], []] },
      { type: 'input', title: '使用者需求', value: [[], [], []] },
      { type: 'input', title: '機會', value: [[], [], []] },
      { type: 'input', title: '痛點', value: [['忙碌到深夜洗衣服'], [], []] }

    ])
    function addRow (type) {
      rows.value.push({
        type,
        title: '',
        value: Array.from({ length: cols.value.length }, (v, i) => rowTypes[type])
      })
    }

    const scores = Array.from({ length: 10 }, (v, i) => i * 24 + 24)

    function getMousePosition (evt) {
      const CTM = evt.currentTarget.getScreenCTM()
      return {
        x: (evt.clientX - CTM.e) / CTM.a,
        y: (evt.clientY - CTM.f) / CTM.d
      }
    }
    let selectedElement, offset, transform
    const target = { x: 0, y: 0 }
    function setDragEl (e, r, c) {
      selectedElement = e.currentTarget
      target.row = r.value
      target.col = c
    }

    function handleMousedown (e) {
      if (selectedElement) {
        const svg = e.currentTarget
        offset = getMousePosition(e)
        const transforms = selectedElement.transform.baseVal
        if (transforms.length === 0 ||
            transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
          const translate = svg.createSVGTransform()
          translate.setTranslate(0, 0)
          selectedElement.transform.baseVal.insertItemBefore(translate, 0)
        }
        transform = transforms.getItem(0)
        offset.y -= transform.matrix.f
      }
    }
    function handleMousemove (e) {
      if (selectedElement) {
        e.preventDefault()
        const coord = getMousePosition(e)
        target.y = coord.y - offset.y
        transform.setTranslate(0, target.y)
      }
    }
    function handleMouseup (e) {
      const result = target.row[target.col] - Math.round(transform.matrix.f / 24)
      target.row[target.col] = result > 10 ? 10 : result < 1 ? 1 : result
      transform.setTranslate(0, 0)
      selectedElement = null
    }
    function getX (col, offset = 0) {
      return 112 + 224 * col + offset
    }
    function getY (row, col) {
      return (10 - row.value[col]) * 24 + 24
    }
    function getPath (row) {
      return row.value.slice(0, -1).map((v, col) => {
        const p0 = { x: getX(col), y: getY(row, col) }
        const p1 = { x: getX(col + 1), y: getY(row, col + 1) }
        const midX = (p1.x + p0.x) / 2
        const isEq = row.value[col] === row.value[col + 1]
        const isGt = row.value[col] > row.value[col + 1]
        return `M${p0.x + 12} ${p0.y}L${midX - 12} ${p0.y}Q${midX} ${p0.y} ${midX} ${p0.y + (isEq ? 0 : isGt ? 12 : -12)}L${midX} ${p1.y + (isEq ? 0 : isGt ? -12 : 12)}Q${midX} ${p1.y} ${midX + 12} ${p1.y}L${p1.x - 16} ${p1.y}`
      }).join(' ')
    }
    function circlePath (cx, cy, r) {
      return `M${cx} ${cy}A${r} ${r} 0 1 1 ${cx} ${cy + 1}Z`
    }
    function rectPath (x, y, w, h) {
      return `M${x} ${y}h${w}v${h}h${-w}Z`
    }
    function getBlockBg (row) {
      return row.value.filter((v, i) => i % 2 === 1).map((v, i) => rectPath(i * 2 * 224 + 224, 0, 224, 266)).join('')
    }
    function getScoreCircle () {
      return scores.map((y, i) => circlePath(10, (24 * i) + 24, 6)).join('')
    }
    function getLines () {
      return scores.map(y => `M64 ${y}H${224 * cols.value.length}`).join('')
    }
    function getSourcePoints (row) {
      return row.value
        .slice(0, -1)
        .map((v, i) => circlePath(getX(i, 12), getY(row, i), 4))
        .join('')
    }
    function getTargetPoints (row) {
      return row.value.slice(-row.value.length + 1).map((v, i) => {
        const x = getX(i + 1, -16)
        const y = getY(row, i + 1)
        return `M${x - 8} ${y - 6}L${x} ${y}L${x - 8} ${6 + y}Z`
      }).join('')
    }

    function getColor (v) {
      const fills = ['#7DB1FF', '#6FCF97', '#F2C94C', '#F2994A', '#FF897D']
      const i = Math.ceil((9 - v) / 2)
      return fills[i]
    }
    function autoTextareaHeight (e) {
      $(e.target).attr('rows', $(e.target).parent().hasClass('bg-tag') ? 1 : 5)
    }
    function textHeight (e) {
      $(e.target)
        .attr('rows', 1)
        .attr('rows', Math.floor(e.target.scrollHeight / 18))
    }
    function colOptionHTML (i) {
      return `<menu class="list-unstyled my-0">${i === 0 ? '' : '<li><button class="btn btn-block t-left" type="button" data-action="moveprev">移至前一欄</button></li>'}${cols.value.length - 1 === i ? '' : '<li><button class="btn btn-block t-left" type="button" data-action="movenext">移至後一欄</button></li>'}<li><button class="btn btn-block t-left" type="button" data-action="clone">複製</button></li><li><button class="btn btn-block t-left t-red" type="button" data-action="delete">刪除</button></li></menu>`
    }
    function rowOptionHTML (i) {
      return `<menu class="list-unstyled my-0">${i === 0 ? '' : '<li><button class="btn btn-block t-left" type="button" data-action="moveprev">移至前一列</button></li>'}${rows.value.length - 1 === i ? '' : '<li><button class="btn btn-block t-left" type="button" data-action="movenext">移至後一列</button></li>'}<li><button class="btn btn-block t-left" type="button" data-action="clone">複製</button></li><li><button class="btn t-red" type="button" data-action="delete">刪除</button></li></menu>`
    }

    return { addRow, rowOptionHTML, colOptionHTML, autoTextareaHeight, textHeight, getBlockBg, getScoreCircle, scores, getLines, getColor, getPath, getSourcePoints, getTargetPoints, setDragEl, rows, cols, getX, getY, handleMousedown, handleMousemove, handleMouseup }
  },
  async mounted () {
    function popoverClickHandler (e) {
      const card = this
      const btn = e.target
      if (e.target.nodeName === 'BUTTON') {
        const actions = {
          moveprev () {
            console.log('移至前')
          },
          movenext () {
            console.log('移至後')
          },
          delete () {
            console.log('刪除')
          },
          clone () {
            console.log('複製')
          }
        }
        actions[btn.dataset.action]?.()
      }
    }

    await nextTick()
    $('.js-auto-height').forEach(el => {
      $(el).attr('rows', Math.floor(el.scrollHeight / 18))
    })
    let popoverClickBinding = null
    const popovers = $('.js-popovers-option').on('click', function (e) {
      e.stopPropagation()
    })
      .on('inserted.bs.popover', function (e) {
        popoverClickBinding = popoverClickHandler.bind($(this).parents('.card'))
        $('.popover').on('click', popoverClickBinding)
      }).on('hidden.bs.popover', function (e) {
        $('.popover').off('click', popoverClickBinding)
      }).map(btn => new $.bootstrap.Popover(btn))
  }
})
const vm = app.mount('#app')
