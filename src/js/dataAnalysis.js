/* filename => dataAnalysis.js */
const { createApp, onMounted, reactive, ref, watch, computed, nextTick } = Vue
const app = createApp({
  setup () {
    const data = reactive({
      portName: { name: 'pde-dev' /* + new Date().getTime()  */ }, // .replace(/-|:|\./g, '-')
      majorId: 98,
      source: 0
    })

    //
    const search = ref('')
    const productAnchor = ref('')
    const majorName = ref('')
    const minorName = ref('')
    const productName = ref('')
    const flow = ref('全部')
    const role = ref(['設計師', '產品經理', '設計主管'])
    const keywords = ref([])
    const chartId = ref(0)
    const iframe = ref(null)
    const iframeSrc = ref(null)
    const chartModal = ref(null)
    const structures = ref([])
    const roles = ref([])
    const category = ref([])

    const spyPage = ref(1)
    const showAllCharts = ref(false)

    const flowDesc = computed(() => {
      return category.value.find((c) => c[0] === flow.value)?.[1]
    })
    const filterStruct = computed(() => {
      let result
      if (flow.value === '全部') {
        result = structures.value
      } else {
        result = structures.value.filter(({ category }) =>
          category.map(([flow]) => flow).includes(flow.value))
      }

      result = result.filter(chart => chart.role.some(r => {
        return role.value.includes(r)
      }))

      return result.filter(({ title, descr, exp, tag, tagMarket, tagProduct }) => [title, descr, exp, ...tag, ...tagMarket, ...tagProduct].some(text => text?.match(search.value)))
    })
    // const spyNavStructures = computed(() => {
    //   return filterStruct.value.slice((spyPage.value - 1) * 10, spyPage.value * 10)
    // })

    function chartChange (e) {
      const chartCard = e.target.closest('.chart-card')
      const btnId = +e.target.closest('.btn').dataset.id
      const preBtnId = +iframe.value.dataset.chartId
      if (btnId !== preBtnId) {
        chartId.value = +chartId.value

        $('.chart-card').removeClass('active')
        $(chartCard).addClass('active')
        iframe.value.dataset.chartId = btnId
        iframe.value.contentWindow.location.reload()
        port.value.postMessage({ action: 'sendId', majorId: data.majorId, id: btnId, source: data.source })
      }
    }

    const port = ref(null)

    watch(() => data.source, (newValue, oldValue) => {
      if (oldValue.source !== newValue.source) {
        port.value.postMessage({ action: 'switchSource', source: newValue.source })
      }
    })
    function spyPageChange (num) {
      const page = spyPage.value + num
      const maxPages = Math.ceil(structures.value.length / 10)
      if (page > 0 && page < maxPages + 1) {
        spyPage.value = page
      }
    }
    const showOverlay = ref(true)
    function toggleOverlay () {
      console.log(showOverlay.value)
      showOverlay.value = !showOverlay.value
    }
    return { showAllCharts, showOverlay, toggleOverlay, chartModal, chartChange, data, search, majorName, spyPage, minorName, productName, spyPageChange, roles, keywords, category, flow, flowDesc, role, filterStruct, structures, productAnchor, chartId, iframe, iframeSrc, port }
  },

  updated () {
    $('#charts').scrollspy('refresh')
  },
  async  mounted () {
    const { searchParams } = new URL(location)
    ;({
      majorID: this.productAnchor,
      majorName: this.majorName,
      minorName: this.minorName,
      productName: this.productName,
      ID: this.data.majorId = 98
    } = Object.fromEntries(searchParams))
    // this.data.filename = this.majorName + '-' + this.minorName + '-' + (this.productName ?? this.minorName)
    console.log(this.data)
    mainThread(this.data).then(({ chart, sharedWorker, roles, category, tags, tagsMarket, tagsProduct }) => {
      this.roles = roles
      this.category = category
      this.structures = chart.map(c => {
        c.imgIndex = imgIndice[c.sn] ?? 0
        return c
      }).sort((x, y) => {
        return (x.empty === y.empty) ? 0 : x.empty ? 1 : -1
      })

      this.keywords = [...tags, ...tagsMarket, ...tagsProduct].filter((el, i, arr) => arr.indexOf(el) === i).sort((a, b) => a.length - b.length)
      this.port = sharedWorker
    })

    const filename = this.majorName + '-' + this.minorName + '-' + (this.productName ?? this.minorName)
    $(this.chartModal).on('show.bs.modal', e => {
      $('body').addClass('iframe-modal-open')
      this.iframeSrc ??= './dataVisualize.html?sharedworker=' + this.data.portName.name
      const { relatedTarget } = e
      this.chartId.value = relatedTarget.dataset.id
      $(relatedTarget.closest('.chart-card')).addClass(['active'])
      const btnId = +relatedTarget.dataset.id
      const btnIndex = +relatedTarget.dataset.index
      const preBtnId = +this.iframe.dataset.chartId
      if (btnId !== preBtnId) {
        this.iframe.dataset.chartId = btnId
        this.iframe.dataset.chartIndex = btnIndex
        if (this.iframe.src) {
          this.iframe.contentWindow.location.reload()
        }

        console.log({ action: 'sendId', majorId: this.data.majorId, id: btnId, source: this.data.source, filename })
        this.port.postMessage({ action: 'sendId', majorId: this.data.majorId, id: btnId, source: this.data.source, filename })
      }
    })
      .on('shown.bs.modal', e => {
        const modalContainer = $('.modal-open-container')[0]
        modalContainer.scrollTo(0, 0)
        const { left } = $(e.relatedTarget).parents('.chart-card').bounding()
        const { scrollWidth } = modalContainer

        if (left <= innerWidth / 2) {
          modalContainer.scrollTo(0, 0)
        }
        if (left > innerWidth / 2 && left < scrollWidth - innerWidth / 2) {
          modalContainer.scrollTo(left - innerWidth / 2 + 100, 0)
        }
        if (left >= scrollWidth - innerWidth / 2) {
          modalContainer.scrollTo(scrollWidth, 0)
        }
      })
      .on('hide.bs.modal', e => {
        $('body').removeClass('iframe-modal-open')
        $('.chart-card').removeClass(['active'])

        vm.showOverlay = true
      })
  }
})

const vm = app.mount('#app')
/* filename => dataAnalysis.js */
