const express = require("express");
const cors    = require("cors");
const config  = require("../config");
const apiRoutes     = require("./routes/api");
const requestLogger = require("./middleware/requestLogger");
const errorHandler  = require("./middleware/errorHandler");

const app = express();

app.use(cors({ origin: config.frontendUrl }));
app.use(express.json());
app.use(requestLogger);

app.use("/api", apiRoutes);

app.use((req, res) => {
  console.warn(`[404] No route matched: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, error: "Route not found" });
});

app.use(errorHandler);

app.listen(config.port, () => {
  console.log("=".repeat(50));
  console.log(`  GovVerify API  |  http://localhost:${config.port}`);
  console.log(`  Environment    |  ${config.env}`);
  console.log(`  Frontend URL   |  ${config.frontendUrl}`);
  console.log(`  Thunder URL    |  ${config.thunder.url}`);
  console.log(`  Redirect URI   |  ${config.thunder.redirectUri ?? "NOT SET ⚠"}`);
  console.log(
    `  Client ID      |  ${config.thunder.clientId ? config.thunder.clientId.slice(0, 8) + "..." : "NOT SET ⚠"}`
  );
  console.log(`  Auth           |  public client (PKCE, no secret)`);
  console.log("=".repeat(50));
});

module.exports = app;
