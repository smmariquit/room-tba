/**
 * Fail the build on identifiers that resolve to nothing.
 *
 * v2.20.0 shipped a map page that threw on load: `Entry.svelte` used
 * `mapViewStore` without importing it. `bun run build`, the unit suite, and the
 * component tests all passed, because Svelte templates are not type-checked and
 * no test renders the app root. `svelte-check` catches exactly this, so this
 * script runs it and fails on the one diagnostic that always means a runtime
 * crash: "Cannot find name".
 *
 * ponytail: the repo has ~1.3k other svelte-check errors (implicit any, index
 * signatures). Gating on all of them means a cleanup nobody has time for, so
 * this greps the crash-class subset only. Widen the filter when the rest are
 * fixed.
 */

const CRASH_DIAGNOSTIC = /Cannot find name|Cannot find namespace/;

const proc = Bun.spawn(
  ["bunx", "svelte-check", "--threshold", "error", "--output", "human"],
  { stdout: "pipe", stderr: "pipe" },
);
const [stdout, stderr] = await Promise.all([
  new Response(proc.stdout).text(),
  new Response(proc.stderr).text(),
]);
await proc.exited;

const lines = `${stdout}\n${stderr}`.split("\n");
// svelte-check prints the location line, then the diagnostic on the next line.
const findings: string[] = [];
lines.forEach((line, i) => {
  if (!CRASH_DIAGNOSTIC.test(line)) return;
  const location = (lines[i - 1] ?? "").trim().replace(`${process.cwd()}/`, "");
  findings.push(`${location}\n  ${line.trim()}`);
});

if (findings.length > 0) {
  console.error(
    `\nFound ${findings.length} identifier(s) that resolve to nothing:\n`,
  );
  for (const finding of findings) console.error(`${finding}\n`);
  console.error(
    "Each one throws at runtime when that code path executes. Import the name, or delete the dead reference.\n",
  );
  process.exit(1);
}

console.log("No undefined identifiers.");
