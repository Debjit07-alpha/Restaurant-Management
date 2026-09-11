// Vercel serverless entry point.
//
// The Express app is defined and configured in ../server.js (shared with
// local development). Vercel invokes the exported app per request instead
// of calling app.listen(), which is skipped when this file imports it.
const app = require("../server");

module.exports = app;
