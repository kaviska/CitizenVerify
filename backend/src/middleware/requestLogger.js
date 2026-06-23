const requestLogger = (req, res, next) => {
  const start = Date.now();

  console.log(`\n[REQUEST] --> ${req.method} ${req.originalUrl}`);

  if (Object.keys(req.body || {}).length) {
    // Mask client_secret if it appears in body
    const safeBody = { ...req.body };
    if (safeBody.client_secret) safeBody.client_secret = "***";
    console.log(`[REQUEST]     body:`, JSON.stringify(safeBody));
  }

  res.on("finish", () => {
    const ms = Date.now() - start;
    const symbol = res.statusCode < 400 ? "✓" : "✗";
    console.log(`[REQUEST] <-- ${symbol} ${res.statusCode} ${req.method} ${req.originalUrl} (${ms}ms)`);
  });

  next();
};

module.exports = requestLogger;
