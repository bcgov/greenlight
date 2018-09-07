$(() => {
  const params = new URL(location).searchParams;
  const topicId = params.get("topic");

  // TODO: handle error case
  $.ajax({
    method: "GET",
    url: `/bc-tob/topic/${topicId}/formatted`,
    contentType: "application/json"
  })
    .done(function(response) {
      inflateUI(response);
    })
    .fail(response => {
      try {
        showError(response.responseJSON.detail);
      } catch (err) {
        console.error(err);
        showError("Error");
      }
    });
});

function inflateUI(topic) {
  // Inflate or info snippet
  $.get("/assets/html/snippets/org-info.html").done(response => {
    const snippet = $(response);
    $("#content").html(snippet);

    $.get("/assets/html/snippets/address.html").done(response => {
      const snippet = $(response);
      $("#address-content").html(snippet);
    });

    $.get("/assets/html/snippets/cert-panel.html").done(response => {
      const snippet = $(response);
      $("#address-content").html(snippet);
    });
  });
}

function showError(message) {
  $.get("/assets/html/snippets/error.html").done(response => {
    const snippet = $(response);
    snippet.html(message);
    $("#content").html(snippet);
  });
}
