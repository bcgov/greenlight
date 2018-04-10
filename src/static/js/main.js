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
      data[input.name] = String(moment(input.value).unix())
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
     

      console.log('submit function works')


      if (response.result == null) {
        
                // $(".message").append(" <b>Your request is being processed by one of our representative</b>.");

                alert('Your request has been flagged as requiring additional review by the BC Registries Service Team. You will be notified when the review process is complete and informed of any further steps needed to complete the process.')
                
                var delay=2000;
                var url = THE_ORG_BOOK_APP_URL + '/en/recipe/start_a_restaurant?record=';
                var timeoutID = setTimeout(function(){
                  window.location.href = url;
                }, delay);
        }
      if (response.result != null) {
            window.location.replace(
          THE_ORG_BOOK_APP_URL + '/en/recipe/start_a_restaurant?record=' +
          response.result.id) 
        }    
    })
  })

  $('.approve').click(function (event) {
      
      
     var selected_keys = $('#ckbox:checked').map(function() { return $(this).val(); }).get()
      $.ajax({
        method: 'POST',
        url: "/process_request",
        data: JSON.stringify(selected_keys),
        contentType: 'application/json'
      })
      .done(function (response) { 
        $('.approve').find('button[class=approve]').toggleClass('loading')

        console.log('approve function works')

        if (response.result != null){
                var delay=0;
                var url = '/admin';
                var timeoutID = setTimeout(function(){
                  window.location.href = url;
                }, delay);

            console.log('response returns value')
        }
      })
        

      
  })
})
