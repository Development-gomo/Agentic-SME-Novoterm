/**
 * Offline unit tests — no network, no real contact submissions.
 *   node scripts/test.mjs
 *
 * 1. htmlToText: structure and literal characters survive CMS HTML.
 * 2. validateContent: refuses snapshots with content loss (incl. nested data).
 * 3. publishSnapshot: both data files are replaced together or not at all.
 * 4. Contact response handling (lib/agent/contact.ts, transpiled on the fly
 *    with a stubbed fetch): only explicit, consistent confirmation is "sent".
 */
import { readFile, mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import { htmlToText, publishSnapshot, validateContent } from "./refresh-content.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let failures = 0;

function check(name, condition, detail = "") {
  if (!condition) failures++;
  console.log(`${condition ? "ok  " : "FAIL"} ${name}${!condition && detail ? ` — ${detail}` : ""}`);
}

// 1. htmlToText ---------------------------------------------------------------
console.log("\n# htmlToText");
const html = [
  ["First<br>Second", "First\nSecond"],
  ["Line one<br />\nLine two", "Line one\nLine two"],
  ["<h2>Heading</h2><p>Paragraph</p>", "Heading\n\nParagraph"],
  ['<p class="x">One</p><p class="x">Two</p>', "One\n\nTwo"],
  ["A &lt; B &gt; C", "A < B > C"],
  ["Tom &amp;lt;tag&amp;gt;", "Tom &lt;tag&gt;"],
  ["<p>Intro:</p><ul><li>a</li><li class=\"y\">b</li></ul><p>End</p>", "Intro:\n- a\n- b\n\nEnd"],
  ["Pris &#91;ca&#93; [gallery ids=1] 5&nbsp;kr", "Pris [ca] 5 kr"],
  ['Se <a href="https://backend.novoterm.se/om-oss/">oss</a>', "Se oss (https://www.novoterm.se/om-oss/)"],
  ["Word​join﻿", "Wordjoin"],
];
for (const [input, expected] of html) {
  const got = htmlToText(input);
  check(`${JSON.stringify(input)} → ${JSON.stringify(expected)}`, got === expected, `got ${JSON.stringify(got)}`);
}

// 2. validateContent -----------------------------------------------------------
console.log("\n# validateContent");
const snapshot = JSON.parse(await readFile(path.join(root, "data/novoterm-content.json"), "utf8"));
const clone = () => structuredClone(snapshot);
const rejects = (name, mutate) => {
  const c = clone();
  mutate(c);
  let threw = false;
  try {
    validateContent(c, snapshot, false);
  } catch {
    threw = true;
  }
  check(`rejects: ${name}`, threw);
};
let current = true;
try {
  validateContent(clone(), snapshot, false);
} catch (err) {
  current = false;
  console.log(err.message);
}
check("accepts the current snapshot", current);
rejects("one of the landing pages removed", (c) => c.pages.splice(1, 1));
rejects("languages reduced to one", (c) => (c.languages = c.languages.slice(0, 1)));
rejects("all service FAQs removed", (c) => c.services.forEach((s) => (s.faqs = [])));
rejects("all industry FAQs removed", (c) => c.industries.forEach((i) => (i.faqs = [])));
rejects("CEO message emptied", (c) => (c.about.ceo.message = ""));
rejects("history text emptied", (c) => (c.about.history.text = ""));
rejects("a video loses its description", (c) => (c.videos[0].description = ""));
rejects("articles cut by half", (c) => (c.articles = c.articles.slice(0, 30)));
rejects("client testimonials gone", (c) => (c.testimonials.clients = []));
rejects("footer email missing", (c) => (c.contact.email = ""));
{
  const c = clone();
  c.articles = c.articles.slice(0, 30);
  let ok = true;
  try {
    validateContent(c, snapshot, true);
  } catch {
    ok = false;
  }
  check("accepts a deliberate shrink with --allow-shrink", ok);
}

// 3. publishSnapshot ------------------------------------------------------------
console.log("\n# publishSnapshot");
{
  const dataDir = await mkdtemp(path.join(tmpdir(), "snapshot-test-"));
  const contentFile = path.join(dataDir, "novoterm-content.json");
  const indexFile = path.join(dataDir, "novoterm-site-index.json");
  await writeFile(contentFile, '{"meta":{"generatedAt":"old"}}');
  await writeFile(indexFile, '{"meta":{"generatedAt":"old"},"siteIndex":[]}');
  await publishSnapshot(dataDir, { meta: { crawledAt: "x" }, a: 1 }, { siteIndex: [] });
  const c = JSON.parse(await readFile(contentFile, "utf8"));
  const i = JSON.parse(await readFile(indexFile, "utf8"));
  check("both files written with the same generatedAt", c.meta.generatedAt === i.meta.generatedAt && c.meta.generatedAt !== "old");

  // Second write fails (target is a non-empty directory): the first file must be restored.
  await rm(indexFile, { force: true });
  await mkdir(indexFile);
  await writeFile(path.join(indexFile, "blocker"), "x");
  const before = await readFile(contentFile, "utf8");
  let threw = false;
  try {
    await publishSnapshot(dataDir, { meta: { crawledAt: "y" }, a: 2 }, { siteIndex: [] });
  } catch {
    threw = true;
  }
  check("failed second write throws and restores the first file", threw && (await readFile(contentFile, "utf8")) === before);

  // Backup cannot be created (.bak is a non-empty directory): stop before changing anything.
  await rm(indexFile, { recursive: true, force: true });
  await writeFile(indexFile, '{"meta":{"generatedAt":"kept"},"siteIndex":[]}');
  await mkdir(`${contentFile}.bak`);
  await writeFile(path.join(`${contentFile}.bak`, "blocker"), "x");
  const contentBefore = await readFile(contentFile, "utf8");
  const indexBefore = await readFile(indexFile, "utf8");
  let backupError = "";
  try {
    await publishSnapshot(dataDir, { meta: { crawledAt: "z" }, a: 3 }, { siteIndex: [] });
  } catch (err) {
    backupError = err.message;
  }
  check(
    "backup failure stops the run with both files unchanged",
    /Could not back up/.test(backupError) &&
      (await readFile(contentFile, "utf8")) === contentBefore &&
      (await readFile(indexFile, "utf8")) === indexBefore,
    backupError,
  );
  await rm(dataDir, { recursive: true, force: true });
}

// 4. Contact response handling (and the optional backend key header) -------------------------------------------------
console.log("\n# contact response handling (mocked backend)");
const source = (await readFile(path.join(root, "lib/agent/contact.ts"), "utf8")).replace(
  /import \{ WP_BACKEND_ORIGIN \} from "@\/config\/site-origin";/,
  'const WP_BACKEND_ORIGIN = "https://mock.invalid";',
);
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const dir = await mkdtemp(path.join(tmpdir(), "contact-test-"));
const modulePath = path.join(dir, "contact.mjs");
await writeFile(modulePath, js);
const { submitContactInquiry } = await import(pathToFileURL(modulePath).href);

const input = { inquiryType: "private", fullName: "Test", email: "t@example.com", phone: "1", serviceArea: "other" };
const realFetch = globalThis.fetch;
const cases = [
  ["status mail_sent", 200, '{"status":"mail_sent","message":"Tack"}', "sent", true],
  ["success true", 200, '{"success":true}', "sent", true],
  ["mail_sent and success true", 200, '{"status":"mail_sent","success":true}', "sent", true],
  ["success false", 200, '{"success":false,"message":"Rejected"}', "rejected", false],
  ["status spam", 200, '{"status":"spam"}', "rejected", false],
  ["CONFLICT mail_sent + success false", 200, '{"status":"mail_sent","success":false}', "unconfirmed", false],
  ["CONFLICT success true + status spam", 200, '{"status":"spam","success":true}', "unconfirmed", false],
  ["mail_sent on HTTP 500", 500, '{"status":"mail_sent"}', "unconfirmed", false],
  ["unrecognised 2xx JSON", 200, '{"foo":1}', "unconfirmed", false],
  ["2xx HTML", 200, "<html>ok</html>", "unconfirmed", false],
  ["500 HTML body kept", 500, "<h1>Error</h1>", "unconfirmed", false],
];
for (const [name, code, body, status, submitted] of cases) {
  globalThis.fetch = async () => new Response(body, { status: code });
  const r = await submitContactInquiry(input);
  const bodyKept = code < 500 || body.startsWith("{") || r.raw === body;
  check(`${name} → ${status}`, r.status === status && r.submitted === submitted && bodyKept, `got ${r.status}/${r.submitted}`);
}
{
  // Timeout: a backend that never answers is reported as unconfirmed.
  globalThis.fetch = (_url, opts) => new Promise((_, reject) => opts.signal.addEventListener("abort", () => reject(opts.signal.reason)));
  const realTimeout = AbortSignal.timeout;
  AbortSignal.timeout = () => realTimeout.call(AbortSignal, 50);
  const keepAlive = setInterval(() => {}, 1000); // AbortSignal.timeout timers do not keep Node alive
  const r = await submitContactInquiry(input);
  clearInterval(keepAlive);
  AbortSignal.timeout = realTimeout;
  check("timeout → unconfirmed", r.status === "unconfirmed" && !r.submitted);
}
for (const [field, value] of [["fullName", "x".repeat(201)], ["message", "x".repeat(5001)], ["phone", "1".repeat(41)]]) {
  let threw = false;
  globalThis.fetch = async () => {
    throw new Error("must not be called");
  };
  try {
    await submitContactInquiry({ ...input, [field]: value });
  } catch (err) {
    threw = /at most/.test(err.message);
  }
  check(`over-long ${field} rejected before any request`, threw);
}
{
  // Without CONTACT_BACKEND_KEY no key header is sent; with it, the header goes to the backend.
  let seen = "unset";
  globalThis.fetch = async (_url, opts) => {
    seen = new Headers(opts.headers).get("x-novoterm-agent-key");
    return new Response('{"status":"mail_sent"}', { status: 200 });
  };
  await submitContactInquiry(input);
  check("no backend key header when CONTACT_BACKEND_KEY is unset", seen === null);
  process.env.CONTACT_BACKEND_KEY = "k-test";
  const withKey = await import(`${pathToFileURL(modulePath).href}?key`);
  await withKey.submitContactInquiry(input);
  check("backend key header sent when CONTACT_BACKEND_KEY is set", seen === "k-test");
  delete process.env.CONTACT_BACKEND_KEY;
}
globalThis.fetch = realFetch;
await rm(dir, { recursive: true, force: true });

console.log(failures ? `\n${failures} test(s) FAILED` : "\nAll tests passed.");
process.exit(failures ? 1 : 0);
