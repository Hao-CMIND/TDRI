const { createApp, onMounted, reactive, ref, watch, computed, nextTick } = Vue
const app = createApp({
  setup () {
    const structure = ref({})
    const sidemenu = ref(null)
    const domain = 'https://tdri2024.cmind.com.tw/api/PDE/'
    console.log('PDE API dashboard Domain↑↑↑↑↑↑↑↑↑')
    const selectChartLimited = 4
    const source = ref(0)
    const selectBrand = ref([])
    const selectFactor = ref([])
    const tpls = ref([
      { Type: 0, limited: 2, selected: true },
      { Type: 1, limited: 2, selected: false },
      { Type: 2, limited: 3, selected: true },
      { Type: 3, limited: 3, selected: false },
      { Type: 4, limited: 4, selected: true }
    ])
    function reset () {
      selectedChartIds.value = []
      selectBrand.value = []
      selectFactor.value = []
    }
    async function getProject () {
      const project = await (await fetch(domain + 'Project/' + dashboard.value.ProjectID)).json()
      // console.log(20, 'getProject撈取加入專案的圖表', project)
      return project
    }
    async function getDashboard (id) {
      const dashboard = await (await fetch(domain + 'Dashboard/' + id)).json()
      // console.log(25, 'getDashboard', dashboard)
      return dashboard
    }
    function fetchOpt (json) {
      return { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(json) }
    }
    async function postDashboard () {
      const reqBody = {
        Name: dashboard.value.Name,
        ID: dashboard.value.ID,
        Type: selectedTemplate.value.Type,
        ChartID: selectedChartIds.value
      }
      // POST Body：{ "ID": 1, "Type": 0, "ChartID": [209, 208] }
      // ID：儀錶板ID，int
      // Type：儀錶板版型，int，default 0
      // ChartID：使用專案圖表API傳回的Chart[i].ID，int array

      const res = await (await fetch(domain + 'Dashboard', fetchOpt(reqBody))).json()
      // console.log(45, 'postDashboard', res)
    }
    async function getDataset (reqBody) {
      const res = await (await fetch(domain + 'Data', fetchOpt(reqBody))).json()
      // console.log(49, 'getDataset', res)
      return res
    }

    const projectList = ref({ Chart: [], Icon: 'User-Blue.svg', Name: '專案P_01' })

    const filterList = computed(() => {
      let filtered = projectList.value.Chart.filter(({ Source }) => Source === source.value)
      if (selectBrand.value.length) {
        filtered = filtered.filter(({ Brand }) => Brand.some(b => selectBrand.value.includes(b)))
      }
      if (selectFactor.value.length) {
        filtered = filtered.filter(({ FilterName }) => selectFactor.value.includes(FilterName))
      }

      return filtered
    })
    const filterBrand = computed(() => projectList.value.Chart.flatMap(chart => chart.Brand).filter((el, i, arr) => arr.indexOf(el) === i))
    const filterFactor = computed(() => projectList.value.Chart.filter(chart => chart.FilterName).flatMap(chart => chart.FilterName.split('|')))
    const selectedChartIds = ref([])
    const selectedTemplate = ref(0)

    const filterTpls = computed(() =>
      tpls.value.filter(({ limited }) => [false, 2, 2, 3, 4][selectedChartIds.value.length] === limited)
    )
    const tplClassList = computed(() => {
      // console.log(selectedTemplate.value)
      const tplType = selectedTemplate.value
      return { ['drop-tpl-' + tplType]: tplType !== -1, 'drop-tpl': true }
    })

    // 選取上次的版型
    watch(selectedChartIds, newIds => {
      if (newIds.length) {
        selectedTemplate.value = filterTpls.value.find(tpl => tpl.selected).Type
        return
      }
      selectedTemplate.value = -1
    })
    // 紀錄選取版型
    watch(selectedTemplate, newTplType => {
      if (filterTpls.value.length) {
        filterTpls.value.forEach(tpl => { tpl.selected = tpl.Type === newTplType })
      }
    })

    function findQueueIndex (ID) {
      const index = selectedChartIds.value.indexOf(ID)
      return index === -1 ? '' : index + 1
    }
    function disabledChart (ID) {
      const indice = selectedChartIds.value
      return indice.length === selectChartLimited && !indice.includes(ID)
    }

    const dashboard = ref({})
    const dashboardDataset = ref([])
    async function getProjectSelectDataset () {
      if (selectedChartIds.value.length === 0) return
      const charts = projectList.value.Chart.filter(chart => selectedChartIds.value.includes(chart.ID))
      const filterNoDatasset = charts.filter(chart => chart.dataset === undefined) // 篩選還沒有取回資料的圖表
      const reqBody = filterNoDatasset.reduce((body, chart) => {
        // 不重複參數
        if (body.ID.includes(chart.Categories) && body.Chart.includes(chart.ChartID) && body.Source.includes(chart.Source)) { return body }
        body.ID.push(chart.Categories)
        body.Chart.push(chart.ChartID)
        body.Source.push(chart.Source)
        return body
      }, { ID: [], Chart: [], Source: [] })
      const result = await getDataset(reqBody)
      // console.log(116, result)
      filterNoDatasset.forEach(chart => {
        chart.dataset = result.filter(({ id, filter }) => id === chart.ChartID && filter === chart.structure.filterDefault)
      })
      // console.log(116, 'filterNoDatasset', filterNoDatasset)
      // console.log(121, 'getProjectSelectDataset', charts)
      dashboardDataset.value = charts
    }
    function getLaunchers () {
      dashboardDataset.value.forEach((chart, i) => {
        const { Brand, FilterName } = chart
        const chartType = chartTypes[chart.structure.sn]
        let toggleType = null
        if (chartType.toggleChartTypes) {
          ;([toggleType] = chartType.toggleChartTypes.filter((type, i) => i === 0))// 圖表類型
        }
        const sortedIndex = selectedChartIds.value.indexOf(chart.ID)
        const instantChart = chartType.launcher({ divEl: '#chart-' + sortedIndex, ...chart.structure, res: chart.dataset, dashboard: 0 })
        if (instantChart.update && Brand.length > 0) {
          const updateVm = { selectedBrands: Brand, selectedChartType: toggleType.valueType, struct: chart.structure }
          setTimeout(() => {
            instantChart.update(updateVm)
          }, 800)
        }
      })
    }

    return { selectBrand, selectFactor, filterBrand, filterFactor, getProject, getDashboard, postDashboard, structure, findQueueIndex, domain, tplClassList, source, projectList, filterList, sidemenu, getDataset, dashboard, dashboardDataset, disabledChart, selectChartLimited, selectedChartIds, selectedTemplate, filterTpls, tpls, getProjectSelectDataset, getLaunchers, reset }
  },
  async mounted () {
    const { dashboardid } = Object.fromEntries(new URL(location).searchParams)
    this.structure = structure // 帶入stroe資料或fetch api

    this.dashboard = await this.getDashboard(dashboardid) // 帶入dashboard id

    const { Chart } = this.dashboard
    $(this.sidemenu).on('hide.bs.offcanvas', async (e) => {
      $('.drop-zone').forEach(el => $(el).children('svg').remove())
      await this.getProjectSelectDataset()
      this.getLaunchers()
    })

    console.log(this.dashboard.Chart.length === 0 ? '新儀錶板' : '已建立儀錶板')

    this.projectList = await this.getProject(this.dashboard.ProjectID)

    // projectList.Chart拷貝一份 structure & 紀錄圖片索引
    this.projectList.Chart.forEach(chart => {
      chart.structure = this.structure.chart.find(struct => struct.id === chart.ChartID)
      chart.imgIndex = imgIndice[chart.structure.sn] || 0
      chart.Brand = chart.Brand ? chart.Brand.split('|') : []
      chart.Filter = +chart.Filter
    })
    console.log('Chart', Chart)
    console.log('dashboard', this.dashboard)
    console.log('projectList', this.projectList)
    if (Chart.length) {
      this.selectedChartIds = this.dashboard.Chart.map(c => c.ID)
      this.selectedTemplate = this.tpls.find(tpl => tpl.Type === this.dashboard.Type)
      await this.getProjectSelectDataset()
      this.getLaunchers()
      // console.log(171, this.dashboardDataset)
    // } else {
    //   $(this.sidemenu).offcanvas('show')
    }
    // console.log('this', this)
  }
})
let vm
document.addEventListener('DOMContentLoaded', function () {
  vm = app.mount('#app')
})
