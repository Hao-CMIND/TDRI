// createUDE.js
$('form').on('change', function (e) {
  const target = $(e.target)
  console.log(target)
  if (target.attr('type') === 'checkbox') {
    const selectedBadge = target.parents('.js-dropdown-option').prev()
    if (target.prop('checked')) {
      $('#badge-label-template').forEach(temp => {
        const htmlStr = temp.content.cloneNode(true).children[0].outerHTML.replace('{{htmlFor}}', $(e.target).attr('id')).replace('{{val}}', target.val())
        selectedBadge[0].insertAdjacentHTML('beforeend', htmlStr)
      })
      return
    }
    selectedBadge.children().filter(child => $(child).txt() === $(e.target).val()).remove()
  }

  if (e.target.closest('.db-focus')) {
    $(e.target.closest('.db-focus')).css('width', ($(e.target.closest('.db-focus')).val().length * 1.5) + 'em')
  }
})
  .on('click', function (e) {
    $(e.target.closest('.js-rm-badge-input')).parent().remove()

    $(e.target.closest('.js-dropdown-cancel')).parents('.badge-group, .badge-group-lg').toggleClass('show')
  })
  .on('dblclick', function (e) {
    getSelection().removeAllRanges()
    $(e.target.closest('.db-focus'))
      .prop('readOnly', false)
      .one('blur', function () {
        $(this).prop('readOnly', true)
      })
  })

$('.dropdown-tab-content').on('click', function (e) {
  const target = e.target.closest('.badge')
  const id = $(this).attr('id')
  const selectedBadge = $(target).parents('.js-dropdown-option').prev()
  $('#readonly-input-temp').forEach(temp => {
    const htmlStr = temp.content.cloneNode(true).children[0].outerHTML
      .replace('{{id}}', id)
      .replace('{{value}}', $(target).txt())
    selectedBadge[0].insertAdjacentHTML('beforeend', htmlStr)
  })
})

$('.js-btn-dropdown-option').on('click', function (e) {
  $(this).parents('.badge-group, .badge-group-lg').toggleClass('show')
})
