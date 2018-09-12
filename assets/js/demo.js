$(() => {
  const params = new URL(location).searchParams;
  const topicId = params.get("topic");

  if (!topicId) {
    window.location = "/demo/start";
  }

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
  $.get("/bcreg/assets/html/snippets/content.html").done(response => {
    const snippet = $(response);
    $("#content").html(snippet);
    inflateOrgInfo(topic);
    inflatePanels(topic);
  });
}

function inflateOrgInfo(topic) {
  $.get("/bcreg/assets/html/snippets/org-info.html").done(response => {
    const snippet = $(response);

    // TODO: figure out a way to redirect to external host
    snippet.find("#canonical-url").attr("href", "");

    name = topic.names[0].text;
    id = topic.source_id;
    orgType = topic.categories[0].value;

    addressee = topic.addresses[0].addressee;
    civic_address = topic.addresses[0].civic_address;
    city = topic.addresses[0].city;
    province = topic.addresses[0].province;
    postal_code = topic.addresses[0].postal_code;
    country = topic.addresses[0].country;

    snippet.find("#org-name").text(name);
    snippet.find("#org-id").text(id);
    snippet.find("#org-type").text(orgType);

    snippet.find("#addressee").text(addressee);
    snippet.find("#civic_address").text(civic_address);
    snippet.find("#city").text(city);
    snippet.find("#province").text(province);
    snippet.find("#postal_code").text(postal_code);
    snippet.find("#country").text(country);

    $("#org-info").html(snippet);
  });
}

function inflatePanels(topic) {
  console.log(topic);
  $.get("/bcreg/assets/html/snippets/cert-panel.html").done(response => {
    const snippet = $(response);

    $("#cert-panels").append(snippet);
  });
}

function showError(message) {
  $.get("/bcreg/assets/html/snippets/error.html").done(response => {
    const snippet = $(response);
    snippet.html(message);
    $("#content").html(snippet);
  });
}
