const PANEL_ISSUER_DATA = [
  // BC Reg
  {
    did: "6qnvgJtqwK44D8LFYnV5Yf",
    credentialName: "BC Registries Business Incorporation",
    dependencies: [
      {
        credentialId: "",
        name: ""
      }
    ]
  },
  // Ministry Finance
  {
    did: "CYnWiuEtJJuhpWvVz3kY9D",
    credentialName: "BC Provincial Sales Tax Number",
    dependencies: [
      {
        credentialId: "",
        name: ""
      }
    ]
  },
  // Worksafe BC
  {
    did: "MAcounf9HxhgnqqhzReTLC",
    credentialName: "Worksafe BC Clearance Letter",
    dependencies: [
      {
        credentialId: "",
        name: ""
      }
    ]
  },
  // Fraser Valley
  {
    did: "L6SJy7gNRCLUp8dV94hfex",
    credentialName: "Fraser Valley Health Operating Permit",
    dependencies: [
      {
        credentialId: "",
        name: ""
      }
    ]
  },
  // Liquor
  {
    did: "ScrMddP9C426QPrp1KViZB",
    credentialName: "BC Liquor License",
    dependencies: [
      {
        credentialId: "",
        name: ""
      }
    ]
  },
  // Surrey
  {
    did: "A9Rsuu7FNquw8Ne2Smu5Nr",
    credentialName: "City of Surrey Business License",
    dependencies: [
      {
        credentialId: "",
        name: ""
      }
    ]
  }
];

let credentials = null;
function getCredentialsByTopic(topicId) {
  return new Promise((resolve, reject) => {
    if (credentials) return resolve(credentials);
    $.ajax({
      method: "GET",
      url: `/bc-tob/topic/${topicId}/credential/active`,
      contentType: "application/json"
    })
      .done(response => {
        credentials = response;
        return resolve(credentials);
      })
      .fail(reject);
  });
}

function getCredentialByDid(credentials, did) {
  for (cred of credentials) {
    if (cred.issuer.did === did) {
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

let issuers = null;
function getIssuers(id) {
  return new Promise((resolve, reject) => {
    if (issuers) return resolve(issuers);
    $.ajax({
      method: "GET",
      url: `/bc-tob/issuer`,
      contentType: "application/json"
    })
      .done(response => {
        issuers = response;
        return resolve(issuers);
      })
      .fail(reject);
  });
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
  $.get("/bcreg/assets/html/snippets/cert-panel.html").done(response => {
    let promise = null;
    getIssuers().then(issuers => {
      for (data of PANEL_ISSUER_DATA) {
        let did = data.did;
        let credentialName = data.credentialName;
        (promise || (promise = getCredentialsByTopic(topic.id))).then(function(
          credentials
        ) {
          const issuer = getIssuerByDid(issuers, did);
          const cred = getCredentialByDid(credentials, did);

          const snippet = inflatePanel(
            issuer,
            cred,
            credentialName,
            $(response)
          );
          $("#cert-panels").append(snippet);
        });
      }
    });
  });
}

function inflatePanel(issuer, credential, credentialName, panel) {
  panel.find("#credential-name").text(credentialName);

  if (credential) {
    panel.find("#issuer-link").attr("href", issuer.url);
    panel.find("#issuer-link").text(issuer.name);
    panel.find("#effective-date").text(credential.effective_date);
  } else {
    panel.find("#cert-body").html($("<i>Certificate not found</i>"));
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
