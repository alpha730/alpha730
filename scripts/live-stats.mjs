// Regenerates assets/{streak,languages,activity}.svg from the GitHub API.
// Auth: GITHUB_TOKEN from the environment only (the Action's built-in token).
// With that token, contribution data covers PUBLIC contributions only.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { streakSvg, langSvg, activitySvg } from "./lib/live.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cfg = JSON.parse(await readFile(path.join(root, "profile.config.json"), "utf8"));
const login = process.env.GITHUB_REPOSITORY_OWNER || cfg.person.github;
const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("GITHUB_TOKEN is not set; refusing to overwrite live assets.");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "User-Agent": "profile-stats",
};

async function rest(url) {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}

async function gql(query, variables) {
  const r = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (!r.ok || j.errors) throw new Error("GraphQL: " + JSON.stringify(j.errors ?? r.status));
  return j.data;
}

const today = new Date().toISOString().slice(0, 10);

// --- contributions: streak + activity ---
const data = await gql(
  `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{
     totalContributions weeks{contributionDays{date contributionCount}}}}}}`,
  { login },
);
const cal = data.user.contributionsCollection.contributionCalendar;
const days = cal.weeks.flatMap((w) => w.contributionDays).filter((d) => d.date <= today);

let longest = 0, run = 0;
for (const d of days) {
  run = d.contributionCount > 0 ? run + 1 : 0;
  longest = Math.max(longest, run);
}
let current = 0;
for (let i = days.length - 1; i >= 0; i--) {
  if (days[i].contributionCount > 0) current++;
  else if (i === days.length - 1) continue; // today may not be done yet
  else break;
}
const weekly = cal.weeks.map((w) => w.contributionDays.reduce((a, d) => a + d.contributionCount, 0)).slice(-26);

// --- languages across public, non-fork repos ---
const repos = (await rest(`https://api.github.com/users/${login}/repos?per_page=100&type=owner`)).filter((r) => !r.fork);
const bytes = {};
for (const r of repos) {
  const langs = await rest(r.languages_url);
  for (const [k, v] of Object.entries(langs)) bytes[k] = (bytes[k] ?? 0) + v;
}
const sum = Object.values(bytes).reduce((a, b) => a + b, 0) || 1;
const rows = Object.entries(bytes)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 6)
  .map(([name, v]) => ({ name, pct: (v / sum) * 100 }));

const out = path.join(root, "assets");
await mkdir(out, { recursive: true });
// Raw numbers are kept beside the SVGs so a theme rebuild (build.mjs) can re-render them offline.
const live = {
  streak: { current, longest, total: cal.totalContributions, date: today },
  languages: { rows, date: today },
  activity: { weeks: weekly, total: weekly.reduce((a, b) => a + b, 0), date: today },
};
await writeFile(path.join(out, "live-data.json"), JSON.stringify(live, null, 2) + "\n");
await writeFile(path.join(out, "streak.svg"), streakSvg(live.streak));
await writeFile(path.join(out, "languages.svg"), langSvg(live.languages));
await writeFile(path.join(out, "activity.svg"), activitySvg(live.activity));
console.log(`live stats refreshed for ${login}: streak ${current}/${longest}, ${rows.length} languages`);
