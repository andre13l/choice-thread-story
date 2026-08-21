/**
 * Pre-launch smoke check.
 *
 * Run: bun scripts/prelaunch-smoke.ts [baseUrl]      (default http://localhost:8080)
 *
 * Verifies that everything a first-time visitor can reach actually answers:
 * the homepage, the daily hub, all five dailies, Hollywood, the utility pages
 * and the sitemap. Also asserts the daily backend server functions return a
 * usable payload, and that nothing in the public product still advertises the
 * retired "More games" catalogue.
 */
const base = (process.argv[2] ?? "http://localhost:8080").replace(/\/$/, "");

const PUBLIC_ROUTES = [
  "/",
  "/daily",
  "/connect/daily",
  "/daily/top-10",
  "/daily/person",
  "/daily/timeline",
  "/daily/up-down",
  "/hollywood",
  "/about",
  "/contact",
  "/auth",
  "/privacy",
  "/terms",
  "/sitemap.xml",
];

let failures = 0;
function check(ok: boolean, message: string) {
  console.log(`${ok ? "ok   " : "FAIL "} ${message}`);
  if (!ok) failures++;
}

for (const path of PUBLIC_ROUTES) {
  try {
    const res = await fetch(`${base}${path}`);
    const body = await res.text();
    check(res.ok, `${path} -> ${res.status}`);
    if (path === "/sitemap.xml") {
      check(!body.includes("/higher-lower"), "sitemap no longer lists unlimited Higher or Lower");
      check(!body.includes("<loc>https://nircosi.com/connect</loc>"), "sitemap no longer lists unlimited Connect");
    } else {
      check(!/More games/i.test(body), `${path} does not advertise "More games"`);
      check(!/mailto:/i.test(body), `${path} has no mailto fallback`);
    }
  } catch (error) {
    check(false, `${path} threw ${(error as Error).message}`);
  }
}

// Every daily must render its own shell server-side (no blank/error page) and
// must not depend on ranking or auth to get there.
const DAILY_ROUTES: [string, RegExp][] = [
  ["/connect/daily", /Connect/i],
  ["/daily/top-10", /Top 10/i],
  ["/daily/person", /Person/i],
  ["/daily/timeline", /Timeline/i],
  ["/daily/up-down", /Up . Down|Box Office/i],
];

for (const [path, marker] of DAILY_ROUTES) {
  const body = await fetch(`${base}${path}`).then((r) => r.text());
  check(marker.test(body), `${path} renders its daily shell`);
  check(
    !/backend didn.t answer/i.test(body),
    `${path} does not render the backend failure state`,
  );
}

if (failures > 0) {
  console.error(`\n${failures} failing smoke check(s)`);
  process.exit(1);
}
console.log("\nPre-launch smoke passed.");
