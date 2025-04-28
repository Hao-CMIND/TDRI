import '../dashboard.pug'
import '../dataAnalysis2.pug'
import '../dataVisualize.pug'
import '../productSelect2.pug'
/* injectImportScript */
import '../sass/index.js'
import '../img/spriteSVG/index.js'
import ShuffleText from './ShuffleText.js'
import $ from './$import.js'

import { throttle } from 'lodash-es'
// import html2canvas from 'html2canvas'
// import { jsPDF } from 'jspdf'
// Popover.Default.allowList.button = ['data-action', 'type']
// $.bootstrap(['Collapse', Collapse], ['Dropdown', Dropdown], ['Carousel', Carousel], ['Modal', Modal], ['Popover', Popover], ['ScrollSpy', ScrollSpy], ['Tab', Tab], ['Tooltip', Tooltip], ['Toast', Toast])

function ww () {
  return new Worker(/* webpackChunkName:'sharedworker' */new URL('./sw/sharedworker.js', import.meta.url))
}

window.$ = $

// window.mainThread = mainThread

// window.html2canvas = html2canvas
// window.PDF = jsPDF

let scrolled = 0

// const { slide = $(window).height() * 0.75 } = $('body')[0].dataset
$(window).on('scroll', throttle(function () {
  navbarDropdowns.children('.nav-link').dropdown('hide')

  // console.log(navbarDropdowns)
  const scrollTop = $(this).scrollTop()

  $('body').toggleClass('slide-down', scrollTop > innerHeight * 0.25)
  $('body').toggleClass('scroll-up', scrollTop < scrolled && scrollTop > 50)
  if ($('.js-parallax').length) {
    const parallaxTop = $('.bg-histogram').bounding('top')
    const parallaxEl = $('.js-parallax')

    parallaxEl.css({ '--ease': Math.round(100 + (parallaxTop - 800) / 5) / 100 })
  }
  // $('header .dropdown').dropdown('hide')
  if ($('.popover, .info-tip').length) {
    $('.js-popovers-option, .info-tip').popover('hide')
  }

  if ($('#mobile-menu').hasClass('show')) {
    $('#mobile-menu').collapse('hide')
  }

  // const jsSticky = $('.card-header-stick')
  // jsSticky.toggleClass('active', jsSticky.bounding('top') === 0)

  if (shuffleTexts) {
    shuffleTexts(this)
  }

  if (useVideo.length) {
    const { y, top, bottom, height } = useVideo.bounding()
    if (innerHeight > bottom && top > height / 2) {
      useVideo[0].play()
    } else {
      useVideo[0].pause()
    }
  }

  // $('.pde-index-video').forEach((e, i) => {
  //   if (i === 0) {
  //     console.log($('#tab-use').nth(i).tab('show'))
  //     const { y, top, bottom, height } = $(e).bounding()
  //     console.log(innerHeight, { y, top, bottom, height })
  //     if (innerHeight > bottom && top > height / 2) {
  //       console.log('play')
  //     }
  //   }
  // })

  scrolled = scrollTop
}, 300, { trailing: true }))

$(window).on('click', function () {
  if ($('.popover, .info-tip').length) {
    $('.js-popovers-option, .info-tip').popover('hide')
  }
})

const navbarDropdowns = $('.navbar-nav .dropdown')
function mousemoveHdl (e) {
  if (e.target.nodeName === 'BUTTON') {
    $(e.target.dataset.bsTarget).collapse('show')
  }
}
$('.navbar-nav .nav-item').on('mouseenter', function () {
  const links = $(this).siblings().filter(el => $(el).hasClass('dropdown')).find('.nav-link.show')
  if (links.length) {
    links.dropdown('hide')
  }
  $(this).filter(el => $(el).hasClass('dropdown')).children('.nav-link').dropdown('show')
})

$('.navbar-nav .dropdown').children('.dropdown-menu').on('mouseleave', function () {
  $(this).prev().dropdown('hide')
  $(this).off('mousemove', mousemoveHdl).find('.collapse').collapse('hide')
})

let shuffleTexts = (_ => {
  const texts = $('.js-shuffle').map(el => new ShuffleText(el))
  if (!texts.length) return null
  return win => {
    const content = $('#suffle-content')
    if (content.bounding('top') >= $(win).height() - content.height()) {
      return
    }
    shuffleTexts = null
    texts.forEach(text => { text.start() })
  }
})()

$('.js-toggle-readoly').on('click', function (e) {
  const btn = $(this)
  btn.parent().prev().prop('readOnly', false).one('blur', function () {
    $(this).prop('readOnly', true)
  }).trigger('focus').trigger('select')
})
function popoverClickHandler (e) {
  const card = this
  const btn = e.target
  if (e.target.nodeName === 'BUTTON') {
    console.log(btn.dataset.action, card)
    const actions = {
      saveAs () {
        $('#alert-modal').modal('show')
      },
      delete () {
        $('#alert-modal').modal('show')
      },
      edit () {
        // $('.toolbar-edit').toggleClass('show')
        // $('.list-character').addClass('invisible')
      }
    }

    actions[btn.dataset.action]?.()
  }
}
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

const infoTips = $('.info-tip').map(tip => new $.bootstrap.Popover(tip))

$('#select-product').on('show.bs.dropdown', function (hiddenEvt) {
  const dropdown = $(this)
  dropdown.children('.dropdown-menu').one('click', function (e) {
    if (e.target.nodeName === 'SPAN') { return }
    dropdown.children('.btn').txt(e.target.textContent)
  })
})

if (location.hash.match(/nav/)) {
  $(location.hash).tab('show')
  $(window).on('hashchange', function (e) {
    console.log('change')
    const { hash: newHash, pathname: newPath } = new URL(e.newURL)
    const { pathname: oldPath } = new URL(e.oldURL)
    if (newPath === oldPath) {
      $(newHash).tab('show')
    }
  })
}

$('.btn-layout-toggle').on('click', function (e) {
  const preLayout = 'card-' + $('.btn-layout-toggle.active').data('layout')
  const currentLayout = 'card-' + $(this).data('layout')

  if (preLayout === currentLayout) return

  $('.btn-layout-toggle').removeClass('active')
  $(this).addClass('active')

  $('.' + preLayout).addClass(currentLayout).removeClass(preLayout)
})

$('.btn-toggle-aside').on('click', function (e) {
  $('#pde-aside').toggleClass('minimize')
})

$('.js-open-card-tutorial').on('click', function (e) {
  $('.card-tutorial').toggleClass('invisible')
})

function YTready () {
  if (YT.Player) {
    const players = $('.js-yt-player').map((yt, i) => {
      const videoId = $(yt).data('video')
      const player = new YT.Player(yt.id, {
        width: 1264,
        height: 799,
        videoId,
        playerVars: {
          playsinline: 1,
          mute: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0
        },
        events: {
          onReady () {
            card.css({ '--duration': player.getDuration() + 's' })
          },

          onStateChange (event) {
            switch (event.data) {
              case YT.PlayerState.PLAYING:
                card.addClass('playing')
                card.removeClass('pause')
                break
              case YT.PlayerState.PAUSED:
                card.addClass('pause')
                break
              case YT.PlayerState.ENDED:
                $('#carousel-use').carousel('next')
                card.removeClass('playing', 'pause')
                break
              default:
                console.log('其他狀態：' + event.data)
                break
            }
          }
        }
      })
      const card = $($(player.getIframe()).data('card'))

      return player
    })

    $('#carousel-use').on('slide.bs.carousel', function (e) {
      const prePlayer = players[e.from]
      prePlayer.stopVideo()
      $(prePlayer.getIframe().dataset.card).removeClass('playing', 'pause')
      players[e.to].playVideo()
    })
    return
  }
  setTimeout(YTready, 200)
}

$('#carousel-use').forEach(() => {
  setTimeout(YTready, 200)
})

let useTab = $($('#v-pills-center-tab').data('bsTarget'))
let useTabIndex = 0
let useVideo = useTab.find('video')

$('#tab-use').on('show.bs.tab', function (e) {
  const preTab = $($(e.relatedTarget).data('bsTarget'))

  const preVideo = preTab.find('video')[0]
  preVideo.pause()
  preVideo.currentTime = 0

  useTab = $($(e.target).data('bsTarget'))
  useVideo = useTab.find('video')
  useVideo[0].play()

  useTabIndex = useTab.nth()[0]
})

$('#v-pills-tabContent video').on('ended', function (e) {
  this.currentTime = 0
  $('#tab-use').children().nth((useTabIndex + 1) % 3).tab('show')
})
