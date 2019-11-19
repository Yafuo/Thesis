const PROXY_CONFIG = [
  {
    context: [
      "/login",
      "/signup"
    ],
    target: "http://localhost:3000",
    secure: true
  }
];
module.exports = PROXY_CONFIG;
