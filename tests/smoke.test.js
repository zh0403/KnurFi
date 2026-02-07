const fs = require("fs");
const path = require("path");
const assert = require("assert");

function read(relPath) {
  const abs = path.join(__dirname, "..", relPath);
  return fs.readFileSync(abs, "utf8");
}

function expectIncludes(text, fragment, label) {
  assert(
    text.includes(fragment),
    `Missing ${label}: ${fragment}`
  );
}

function run() {
  const html = read("docs/dashboard.html");
  const js = read("docs/dashboard.js");

  expectIncludes(html, "id=\"tab-profile\"", "Profile tab");
  expectIncludes(html, "id=\"tab-payouts\"", "Payouts tab");
  expectIncludes(html, "id=\"tab-bridge\"", "Bridge tab");
  expectIncludes(html, "id=\"bridge-widget-frame\"", "LI.FI iframe");
  expectIncludes(html, "id=\"bridge-memo\"", "Bridge memo input");
  expectIncludes(html, "id=\"payouts-batches-toggle\"", "Batches toggle");
  expectIncludes(html, "id=\"ens-record-input\"", "ENS input");

  expectIncludes(js, "initializeBridge()", "Bridge init");
  expectIncludes(js, "saveBridgeRecord()", "Bridge save handler");
  expectIncludes(js, "loadRecentBatches()", "Batch history loader");
  expectIncludes(js, "ENS_RECORD_KEY", "ENS record key");

  console.log("✅ KnurFi smoke checks passed.");
}

run();
