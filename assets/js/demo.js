const PANEL_ISSUER_DATA = [
  // BC Reg
  {
    did: "6qnvgJtqwK44D8LFYnV5Yf",
    credentialName: "BC Registries Business Incorporation",
    dependencies: []
  },
  // Ministry Finance
  {
    did: "CYnWiuEtJJuhpWvVz3kY9D",
    credentialName: "BC Provincial Sales Tax Number",
    dependencies: [
      // BC Reg
      "6qnvgJtqwK44D8LFYnV5Yf"
    ]
  },
  // Worksafe BC
  {
    did: "MAcounf9HxhgnqqhzReTLC",
    credentialName: "Worksafe BC Clearance Letter",
    dependencies: [
      // BC Reg
      "6qnvgJtqwK44D8LFYnV5Yf"
    ]
  },
  // Fraser Valley
  {
    did: "L6SJy7gNRCLUp8dV94hfex",
    credentialName: "Fraser Valley Health Operating Permit",
    dependencies: [
      // BC Reg
      "6qnvgJtqwK44D8LFYnV5Yf",
      // Worksafe BC
      "MAcounf9HxhgnqqhzReTLC"
    ]
  },
  // Liquor
  {
    did: "ScrMddP9C426QPrp1KViZB",
    credentialName: "BC Liquor License",
    dependencies: [
      // BC Reg
      "6qnvgJtqwK44D8LFYnV5Yf",
      // Ministry Finance,
      "CYnWiuEtJJuhpWvVz3kY9D",
      // Worksafe BC
      "MAcounf9HxhgnqqhzReTLC",
      // Fraser Valley
      "L6SJy7gNRCLUp8dV94hfex"
    ]
  },
  // Surrey
  {
    did: "A9Rsuu7FNquw8Ne2Smu5Nr",
    credentialName: "City of Surrey Business License",
    dependencies: [
      // BC Reg
      "6qnvgJtqwK44D8LFYnV5Yf",
      // Ministry Finance,
      "CYnWiuEtJJuhpWvVz3kY9D",
      // Worksafe BC
      "MAcounf9HxhgnqqhzReTLC",
      // Fraser Valley
      "L6SJy7gNRCLUp8dV94hfex",
      // Liquor
      "ScrMddP9C426QPrp1KViZB"
    ]
  }
];

function getCredentialsByTopic(topicId) {
  return loadRecordList(`/bc-tob/topic/${topicId}/credential/active`, true);
}

function getCredentialByDid(credentials, did) {
  for (cred of credentials) {
    if (cred.credential_type.issuer.did === did) {
      return cred;
    }
  }
  return null;
}

function getTopicById(id) {
  return new Promise((resolve, reject) => {
    $.ajax({
      method: "GET",
      url: `/bc-tob/topic/${id}/formatted`,
      contentType: "application/json"
    })
      .done(resolve)
      .fail(reject);
  });
}

var recordCache = {};
function loadRecordList(url, cache, prevLoad) {
  if(cache && recordCache[url])
    return recordCache[url];
  var pageNum = prevLoad ? prevLoad.page + 1 : 1;
  var results = prevLoad && prevLoad.results;
  return new Promise((resolve, reject) => {
    $.ajax({
      method: "GET",
      url: url,
      data: {
        page: pageNum,
      },
      contentType: "application/json"
    })
      .done(response => {
        if($.isArray(response)) {
          if(cache)
            recordCache[url] = results;
          resolve(response);
        }
        else if(response["page"] && response["results"]) {
          if(results) {
            results = results.concat(response["results"]);
          } else {
            results = response["results"];
          }
          if(response["last_index"] < response["total"]) {
            resolve(loadRecordList(url, cache, {page: pageNum, results: results}));
          }
          if(cache)
            recordCache[url] = results;
          resolve(results);
        }
        else {
          console.error("Unexpected result from API: ", response);
          resolve(null);
        }
      })
      .fail(reject);
  });
}

function getIssuers(id) {
  return loadRecordList("/bc-tob/issuer", true);
}

function getIssuerByDid(issuers, did) {
  for (issuer of issuers) {
    if (issuer.did === did) {
      return issuer;
    }
  }
  return null;
}

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
    snippet.find("#canonical-url").attr("href", `/topic/${topic.id}`);

    id = topic.source_id;
    name = topic.names.length ? topic.names[0].text : '';
    orgType = topic.categories.length ? topic.categories[0].value : '';

    var address = topic.addresses.length ? topic.addresses[0] : {};
    addressee = address.addressee || '';
    civic_address = address.civic_address || '';
    city = address.city || '';
    province = address.province || '';
    postal_code = address.postal_code || '';
    country = address.country || '';

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
  $.get("/bcreg/assets/html/snippets/cert-panel.html").done(response => {
    let promise = null;
    getIssuers().then(issuers => {
      for (data of PANEL_ISSUER_DATA) {
        let did = data.did;
        let credentialName = data.credentialName;
        let dependencies = data.dependencies;
        (promise || (promise = getCredentialsByTopic(topic.id))).then(function(
          credentials
        ) {
          const issuer = getIssuerByDid(issuers, did);
          const cred = getCredentialByDid(credentials, did);

          const snippet = inflatePanel(
            topic,
            credentials,
            issuers,
            issuer,
            cred,
            credentialName,
            dependencies,
            $(response)
          );
          $("#cert-panels").append(snippet);
        });
      }
    });
  });
}

function inflatePanel(
  topic,
  credentials,
  issuers,
  issuer,
  credential,
  credentialName,
  dependencies,
  panel
) {
  panel.find("#credential-name").text(credentialName);

  if (credential) {
    panel.find("#issuer-link").attr("href", issuer.url);
    panel.find("#issuer-link").text(issuer.name);
    panel.find("#effective-date").text(credential.effective_date);
    panel.find("#cta").attr("href", `/topic/${topic.id}/cred/${credential.id}`);
  } else {
    $.get("/bcreg/assets/html/snippets/cert-dependencies.html").done(
      response => {
        const depsSnippet = $(response);

        let buttonDisabled = false;
        let credIds = ""

        for (dep of dependencies) {
          const depName = getIssuerByDid(issuers, dep).name;
          const cred = getCredentialByDid(credentials, dep);

          let certExistsClass = "found";
          let certIconClass = "fa-check-circle";

          if (!cred) {
            certExistsClass = "missing";
            certIconClass = "fa-times";
            buttonDisabled = true;
          } else {
            console.log(cred)
            // TODO: use all credential ids once von-anchor has been fixed
            if (!credIds) credIds = cred.wallet_id
            // credIds += `${cred.wallet_id},`
          }

          const snippet = `
            <li class="depends-item ${certExistsClass}">
              <span class="fa ${certIconClass} icon"></span>
              ${depName}
            </li>
          `;
          depsSnippet.find(".depends-items").append(snippet);
        }

        panel.find("#cert-body").html(depsSnippet);

        panel.find("#cta").text(`Enroll with ${issuer.name}`);
        panel.find("#cta").attr("href", `${issuer.url}?credential_ids=${credIds}`);
        panel.find("#cta").attr("target", null);

        if (buttonDisabled) {
          panel.find("#cta").attr("href", null);
          panel.find("#cta").attr("disabled", true);
          panel.find("#cta").addClass("disabled");
          panel.find("#cta").text("Dependencies Not Met");
        }
      }
    );
  }

  return panel;
}

function showError(err) {
  let errorMessage = "Error";
  try {
    errorMessage = err.responseJSON.detail;
  } catch (e) {}

  $.get("/bcreg/assets/html/snippets/error.html").done(response => {
    const snippet = $(response);
    snippet.html(errorMessage);
    $("#content").html(snippet);
  });
}

$(() => {
  const params = new URL(location).searchParams;
  const topicId = params.get("topic");
  if (!topicId) window.location = "/demo/start";

  getTopicById(topicId)
    .then(inflateUI)
    .catch(showError);
});
