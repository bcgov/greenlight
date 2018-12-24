const PROXY_CONFIG = [
  {
      context: [
          "/bc-tob",
          "/bcreg",
          "/finance",
          "/fraser-valley",
          "/liquor",
          "/surrey",
          "/worksafe",
          "/topic"
      ],
      target: "http://proxy-dev:8080",
      secure: false,
          logLevel: "debug"
  }
]

module.exports = PROXY_CONFIG;
