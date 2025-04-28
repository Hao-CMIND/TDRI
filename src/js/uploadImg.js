$('.croppie-input').on('change', async function (e) {
  const croppie = new Croppie($('.croppie-upload')[0], {
    viewport: { width: 350, height: 350, type: 'circle' },
    boundary: { width: '100%', height: 500 }

    // - enableOrientation: true
  })

  const base64 = await new Promise((resolve) => {
    const reader = new FileReader()
    reader.addEventListener('load', function (e) {
      $('.croppie-input-area').removeClass('active')
        .next().removeClass('hidden')
      $('.croppie-title').txt('編輯圖片')
      resolve(e.target.result)
    }, { once: true })
    reader.readAsDataURL(e.target.files[0])
  })
  croppie.bind({ url: base64 })

  function cancel () {
    $('.js-croppie-save').off(save)
    croppie.destroy()
    $('.croppie-input-area').addClass('active')
      .next().addClass('hidden')
  }
  async function save (e) {
    const blob = await croppie.result('blob')
    // post到後端儲存
    $('.js-croppie-cancel').off(cancel)
    croppie.destroy()
    $('.croppie-input-area').addClass('active')
      .next().addClass('hidden')
  }

  $('.js-croppie-cancel').one('click', cancel)
  $('.js-croppie-save').one('click', save)
})
