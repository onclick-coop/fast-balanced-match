# fast-balanced-match

`@onclick/fast-balanced-match`, a faster take on `balanced-match` whose one export, `matcher`, finds the first balanced pair of delimiters in a string, published to npm as built `dist` and to JSR as TypeScript source.
`package.json` defines its exports and scripts, and `jsr.json` what JSR publishes.

Top-level directories: `src/` (`balanced.ts` and its legacy, oracle, rule, real-world and bug-hunt test suites), `scripts/ci/` (the release and publish steps `.github/workflows/release.yaml` runs), and `.github/workflows/` (checks, then publishing and tagging each new version).

## Checks

Run `vp run check`, `vp run lint`, `vp run typecheck`, `vp run test`, and `vp run build` from the repo root.

## Rules

Read [AGENTS.md](../../AGENTS.md) and its topic imports unless already loaded.
