// membership.js
function run (cb, { fps = 30, dur = Infinity }) {
  return new Promise((resolve) => {
    const interval = 1000 / fps
    let then = Date.now()
    let startTime = null
    function update (timestamp) {
      const now = Date.now()
      const delta = now - then
      let tick = 0
      if (startTime === null) {
        startTime = timestamp
      }
      if (delta > interval) {
        then = now - (delta % interval)
        tick = timestamp - startTime
        cb(tick)
      }
      frame = requestAnimationFrame(update)
      if (startTime !== null && dur < tick) {
        cancelAnimationFrame(frame)
        resolve(false)
      }
    }
    let frame = requestAnimationFrame(update)
  })
}

function register (e/* event */, formData) {
  const carousel = $(e.target).parents('.carousel')
  if (carousel.length) {
    if (this.checkValidity()) {
      const { step } = e.target.dataset
      $('.step-list').children().nth(+step).addClass('done').next().addClass('active')

      const steps = [
        () => {
          console.log('submit-設定帳號')
          e.preventDefault() // 避免導頁
          run(
            tick => {
              const seconds = (3000 - tick) / 1000
              const mins = (seconds) / 60 | 0
              const secs = ('0' + Math.ceil(seconds % 60)).slice(-2)
              $('.js-counter').txt(mins + ':' + secs)
            },
            { fps: 1, dur: 3000 }
          ).then(isDisabled => {
            $('.js-resend').prop('disabled', isDisabled)
          })
          $(e.target).parents('.carousel').carousel('next')
        },
        () => {
          console.log('submit-信箱驗證')
          e.preventDefault() // 避免導頁
          $(e.target).parents('.carousel').carousel('next')
        },
        () => {
          console.log('submit-資本資料')
        }
      ]

      steps[+step]()
    }
  }
}
function verifyPassword (password, checkpw) {
  const checklist = $(this).find('.js-pw-check')
  const patterns = [
    /^(?=.*[A-Z])(?=.*[a-z])/g, // 含一大一小寫
    /^(?=.*\d|[#?!@$%^&*-])/g, // 含數字或符號
    /.{12,}/ // 至少12碼
  ]
  const isPass = patterns.every((reg, i) => { // 密碼正則式
    const isMatch = reg.test(password)
    checklist.nth(i).toggleClass('t-success', isMatch)
    return isMatch
  })

  const isSamePW = checkpw && checkpw !== password

  $(this).find('.js-same-ps').toggleClass('hidden', !isSamePW) // 驗證密碼相同

  return isPass && isSamePW
}
function submitHandler (e) {
  const formData = Object.fromEntries(new FormData(this))
  if (!this.checkValidity()) { // 驗證必填
    e.preventDefault()
    e.stopPropagation()
  }
  $(this).addClass('was-validated')

  const { password, checkpw } = formData // 先取出form資料

  if (checkpw === undefined && password) {
    return
  }

  const isQualified = verifyPassword.bind(this)(password, checkpw)

  if (!isQualified) {
    e.preventDefault()
  }

  /* 註冊流程 */
  register.bind(this, e)(formData)
}
let { hash, search } = location
let step = +new URLSearchParams(search).get('step')
if (!$(hash).length) hash = '#login'
if (hash === '#register' && step === 2) {
  $('#register-carousel')
    .find('.carousel-item')
    .removeClass('active')
    .nth(step)
    .addClass('active')
  while (step--) {
    $('.step-list')
      .children()
      .nth(+step)
      .addClass('done')
      .next()
      .addClass('active')
  }
}

$(hash).removeClass('hidden').addClass('maximize')
  .one('animationend', function () {
    $(this).removeClass('maximize')
  })

$(this).on('hashchange', async function (e) {
  const { newURL, oldURL } = e
  let { hash: oldHash = '#login' } = new URL(oldURL)
  let { hash: newHash = '#login' } = new URL(newURL)
  if (!$(oldHash).length) oldHash = '#login'
  if (!$(newHash).length) newHash = '#login'

  await new Promise((resolve) => {
    $(oldHash).one('animationend', function (e) {
      $(this).addClass(['hidden', 'maximize']).removeClass('minimize')
      resolve()
    }).addClass('minimize')
  })

  $(newHash).one('animationend', function (e) {
    $(this).removeClass('maximize')
  }).removeClass('hidden')
})

$('.js-membership').on('submit', submitHandler)
$('.js-toggle-password').on('click', function (e) {
  const { toggle } = this.dataset
  const isPassword = $(toggle).attr('type') === 'password'
  $(this).children().toggleClass('fi-invis', !isPassword).toggleClass('fi-vis', isPassword)
  const type = isPassword ? 'text' : 'password'

  $(toggle).attr('type', type)
})
