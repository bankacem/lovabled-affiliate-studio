let appPromise;

function isHealthRequest(req) {
  const requestUrl = new URL(req.url || "/", "https://aiprintverse.com");
  return requestUrl.pathname === "/api/healthz" || requestUrl.pathname === "/healthz";
}

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function loadApp() {
  appPromise ??= import("./artifacts/api-server/dist/app.mjs").then((module) => module.default);
  return appPromise;
}

export default async function handler(req, res) {
  if (isHealthRequest(req)) {
    sendJson(res, 200, { status: "ok" });
    return;
  }

  if (!process.env.DATABASE_URL) {
    sendJson(res, 503, {
      error: "API database is not configured",
      code: "DATABASE_URL_MISSING",
    });
    return;
  }

  try {
    const app = await loadApp();
    return app(req, res);
  } catch (error) {
    console.error("Vercel API initialization failed", error);
    sendJson(res, 500, { error: "API initialization failed" });
  }
}
