require("dotenv").config();

module.exports = {
  port:        process.env.PORT || 5000,
  env:         process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  thunder: {
    url:         process.env.THUNDER_URL,
    clientId:    process.env.THUNDER_CLIENT_ID,
    redirectUri: process.env.THUNDER_REDIRECT_URI,
  },
};
