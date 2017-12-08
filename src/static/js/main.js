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

    $.ajax({
      method: 'POST',
      url: $(that).attr('action'),
      data: JSON.stringify(data),
      dataType: 'application/json'
    })
  })
})
