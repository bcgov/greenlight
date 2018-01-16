/* global $, moment */

const FORM_HANDLERS = {}

$(function () {
  // override forms to submit json
  $('form').submit(function (event) {
    const form = this
    event.preventDefault()

    // serialize data as json
    const data = {}
    $(form).serializeArray().forEach(input => {
      data[input.name] = input.value
    })

    // Convert checkboxes to booleans
    $(this).find('input[type=checkbox]').each((i, input) => {
      data[input.name] ? data[input.name] = true : data[input.name] = false
    })

    // Convert checkboxes to booleans
    $(this).find('input[type=date]').each((i, input) => {
      // data[input.name] = moment(input.value).unix()
      data[input.name] = moment(input.value).unix()
    })

    // Convert multi select to array
    $(this).find('select[multiple]').each(function (i, select) {
      data[select.name] = []
      $(this).find('option').each(function (i, option) {
        if (option.selected) {
          data[select.name].push(option.value)
        }
      })

      // Convert array into comma delimited string
      data[select.name] = data[select.name].join(',')
    })

    $(form).find('button[type=submit]').toggleClass('loading')

    $.ajax({
      method: 'POST',
      url: $(form).attr('action'),
      data: JSON.stringify(data),
      contentType: 'application/json'
    }).done(function (response) {
      $(form).find('button[type=submit]').toggleClass('loading')
      // This is used allow each template to implement its own response handler
      // if (FORM_HANDLERS[$(form).attr('name')]) {
      //   FORM_HANDLERS[$(form).attr('name')](form, response)
      // }

      window.location.replace(
        'https://devex-von-dev.pathfinder.gov.bc.ca/roadmap?record=' +
        response.result.id
      )
    })
  })
})
