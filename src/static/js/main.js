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

    console.log(data)

    $.ajax({
      method: 'POST',
      url: $(that).attr('action'),
      data: JSON.stringify(data),
      contentType: 'application/json'
    })
  })
})
