// import '../demo.pug'
import '../sass/demo.scss'
import { $, on, parent, next, nextAll, each, map, prev, prop, txt, val } from './$.js'
$.use(on, parent, next, nextAll, each, map, prev, prop, txt, val)

const cusWidth = $('#customize-width')
const cusHeight = $('#customize-height')
const cusSelect = $('#select-device')
const hr = $('#horizontal')
const vr = $('#vertical')
const browsers = {}
let cacheSize = []
$('.table').on('click', function (e) {
  const { dataset: { action, bp, width, height }, href } = e.target
  if (!action) return

  if (action !== 'rotate') e.preventDefault()

  const actions = {
    copy () {
      navigator.clipboard.writeText(href)
    },
    open () {
      const top = (screen.height - height) / 2
      const left = (screen.width - width) / 2
      const config = `width=${width},height=${height}`
      browsers[bp] = open(href, bp, config)
    },
    close () {
      if (!browsers[bp]) return
      browsers[bp] = browsers[bp].close()
    },
    rotate () {
      if (cusSelect.val() === 'customize*customize') return
      const [min, max] = cusSelect
        .val()
        .split('*')
        .sort((a, b) => +a - +b)
      const { value: checkedVal } = e.target
      cusWidth.val(checkedVal === 'h' ? max : min)
      cusHeight.val(checkedVal === 'v' ? max : min)
    },
    selectSize () {
      const [min, max] = e.target.value.split('*').sort((a, b) => +a - +b)
      cusWidth.prop('disabled', min !== 'customize')
      cusHeight.prop('disabled', max !== 'customize')

      if (min === 'customize') {
        if (cacheSize.length) {
          cusWidth.val(cacheSize[0])
          cusHeight.val(cacheSize[1])
          return
        }
        cusWidth.val('')
        cusHeight.val('')
        return
      }

      cusWidth.val(hr.prop('checked') ? max : min)
      cusHeight.val(vr.prop('checked') ? max : min)
    },
    openAll () {
      $(e.target)
        .parent()
        .nextAll()
        .filter(el => el.classList.contains('css-all-device'))
        .forEach(td => {
          td.children[0].dispatchEvent(new Event('click'))
        })
    },
    closeAll () {
      $.each(browsers, browser => browser.close())
    },
    customize () {
      if (browsers[bp]) {
        browsers[bp].close()
      }
      const inputVal = [cusWidth.val(), cusHeight.val()]
      if (inputVal.every(val => !+val)) {
        alert('請填入裝置尺寸')
        return
      }
      if (cusSelect.val().includes('customize')) {
        cacheSize = inputVal
      }

      const [min, max] = inputVal.sort((a, b) => +a - +b)
      const width = vr.prop('checked') ? min : max
      const height = hr.prop('checked') ? min : max

      const config = `width=${width},height=${height}`
      browsers[bp] = open(href, bp, config)
    }
  }
  actions[action]()
},
true
)
$('#download').on('click', function (e) {
  // e.preventDefault()
  const seo = {
    demo: {
      title: 'Sitemap',
      desc: 'Sitemap'
    },
    layout: {
      title: '請套入title資料',
      desc: '請套入description資料'
    }
  }
  $('[name=pageTitle]').forEach(title => {
    const [lang, page] = title.id.split('-')
    if (!seo[lang]) { seo[lang] = {} }
    console.log(seo[lang], title)
    seo[lang][page] = {/*  title: $(title).prev().txt()  */}
    if (title.value) {
      seo[lang][page].title = title.value
    }
  })

  $('[name=pageDescription]').forEach(desc => {
    const [lang, page] = desc.id.split('-')
    if (desc.value) {
      seo[lang][page].desc = desc.value
    }
  })

  let seoStr = `- const officialDomain = '${$('#officialurl').val()}'\n`
  seoStr += `-
  const seo = {${$.map(seo, (head, lang) => {
    if (['layout', 'demo'].includes(lang)) {
      return `
    ${lang}: {${$.map(head, (text, meta) => `
      ${meta}: '${text}'`).join(',')}
    }`
  }
  return `
    ${lang}: {${$.map(seo[lang], (head, basename) => `
      ${basename}: {${$.map(head, (text, meta) => `
        ${meta}: '${text}'`).join(',')}
      }`)}
    }`
}).join(',')}
  }`
  localStorage.setItem('seo', JSON.stringify(seo))
  this.href = `data:txt/plain;charset=utf-8,${encodeURIComponent(seoStr)}`
})

const seo = JSON.parse(localStorage.getItem('seo'))
if (seo) {
  $.each(seo, (head, basename) => {
    $.each(head, (text, meta) => {
      $(`#${meta}-${basename}`).val(text)
    })
  })
}
