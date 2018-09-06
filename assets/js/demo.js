$(() => {
  const params = new URL(location).searchParams;
  const topicId = params.get("topic");

  $.ajax({
    method: "GET",
    url: `/bc-tob/api/topic/${topicId}`,
    contentType: "application/json"
  }).done(function(response) {
    console.log(response);
  });
});
