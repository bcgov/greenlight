/* global $, moment */

const FORM_HANDLERS = {};

$(function() {
  // override forms to submit json
  $("form").submit(function(event) {
    const form = this;
    event.preventDefault();

    // serialize data as json
    const data = {};
    $(form)
      .serializeArray()
      .forEach(input => {
        data[input.name] = input.value;
      });

    // Convert checkboxes to booleans
    $(this)
      .find("input[type=checkbox]")
      .each((i, input) => {
        data[input.name]
          ? (data[input.name] = true)
          : (data[input.name] = false);
      });

    // Convert checkboxes to booleans
    $(this)
      .find("input[type=date]")
      .each((i, input) => {
        data[input.name] = String(moment(input.value).unix());
      });

    // Convert multi select to array
    $(this)
      .find("select[multiple]")
      .each(function(i, select) {
        data[select.name] = [];
        $(this)
          .find("option")
          .each(function(i, option) {
            if (option.selected) {
              data[select.name].push(option.value);
            }
          });

        // Convert array into comma delimited string
        data[select.name] = data[select.name].join(",");
      });

    $(form)
      .find("button[type=submit]")
      .toggleClass("loading");

    $.ajax({
      method: "POST",
      url: $(form).attr("action"),
      data: JSON.stringify({ attributes: data }),
      contentType: "application/json"
    }).done(function(response) {
      $(form)
        .find("button[type=submit]")
        .toggleClass("loading");
      console.log("Result: ", response);
      console.log("TheOrgBook URL: ", THE_ORG_BOOK_APP_URL);
      const walletId = response.result;
      $.ajax({
        method: "GET",
        url: `${THE_ORG_BOOK_APP_URL}/api/credential/${walletId}`,
        contentType: "application/json"
      }).done(function(response) {
        window.location = `/demo?topic=${response.topic}`
      });
    });
  });
});
