/* global $ */

$(function () {
  // override forms to submit json
  $('form').submit(function (event) {
    const that = this
    event.preventDefault()

    // serialize data as json
    const data = {}
    $(that).serializeArray().forEach(input => {
      data[input.name] = input.value
    })

    // Convert checkboxes to booleans
    $(this).find('input[type=checkbox]').each((i, input) => {
      data[input.name] ? data[input.name] = true : data[input.name] = false
    })

    // Convert multi select to array
    $(this).find('select[multiple]').each(function (i, select) {
      data[select.name] = []
      $(this).find('option').each(function (i, option) {
        if (option.selected) {
          data[select.name].push(option.value)
        }
      })
    })

    $.ajax({
      method: 'POST',
      url: $(that).attr('action'),
      data: JSON.stringify(data),
      contentType: 'application/json'
    })
  })
})
