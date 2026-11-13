# Fanation client

Nigerian creator subscription platform. One React SPA holding both the public marketing site and the fan and creator app. Vite, React 19, TypeScript, deployed on Vercel.

`README.md` covers the route map and deploy. `CONTRIBUTING.md` is the workflow and is binding, read it before your first branch. This file carries only what you get wrong without it.

## Commands

All verified working on a clean `npm ci` as of 2026-11-13.

```
npm ci            install, exit 0
npm run typecheck tsc --noEmit, exit 0
npm run build     tsc --noEmit then vite build, exit 0
npm run dev       vite dev server
npm run preview   serve the production build
```

There is no test runner and no lint script in this repo. Do not invent `npm test` or `npm run lint`. The type-check is the static gate.

## Definition of done in this repo

`npm run build` exits 0. It runs the type-check first, so a passing build means types are clean and the bundle built.

CI runs exactly `npm ci` then `npm run build` on every PR into `main` and every merge to `main`. A red build blocks the merge. If your build is green locally it will be green in CI.

## Never push to main

`main` is protected and the team rule is explicit in `CONTRIBUTING.md`: nobody commits to it directly, including you.

Every change is a branch and a pull request, one review and a green build to merge. Branch naming is `feat/...`, `fix/...` or `chore/...`, one branch per task, kept small. Squash and merge, then delete the branch.

This is a shared repo with a product designer in it. The rule is not ceremony.

## The upstream is the source of truth, and it is not configured

This repo is Timmy's fork. The product designer's repo, `ekpess-dollar/Fanationapp`, branch `design`, is the canonical trunk and the most active one.

`git remote -v` shows only `origin` pointing at this fork. There is no `upstream` remote set up. Before any work that needs to be current, add it and pull:

```
git remote add upstream https://github.com/ekpess-dollar/Fanationapp
git fetch upstream
```

Work on branches from the fork, and PR up to the designer's repo so neither side falls behind. Starting a feature from a stale fork `main` is the most likely way to waste a day here.

## The design system is vendored on purpose

`src/lib/ui` and `src/lib/brand` are vendored, not a package. The admin console keeps its own separate copy.

A change to the design system has to be made in both places deliberately, so neither project depends on the other. `src/lib/ui/styles.css` says so at the top. Do not "fix it in one place" and do not extract it into a shared package without that being the actual task.

## This is a UI shell on mock data, by design

The client is deliberately built against mock and seed data. Backend developers wire the real APIs later. Do not treat missing API integration as a bug, and do not build a backend to fill the gap.

`src/data/` holds the seed data. `src/services/` holds the API layer that will be wired.

## Stack notes that are not obvious

- State is split deliberately: Redux Toolkit with redux-persist for persisted app state, Zustand for local UI state, TanStack Query for server state. Use the one that matches the kind of state, do not consolidate them.
- Firebase handles auth and messaging only. All `VITE_FIREBASE_*` variables, plus `VITE_FIREBASE_VAPID_KEY` for push.
- Tailwind is configured but used on the landing surface. The app surfaces use the vendored design system in `src/lib/ui`. Check which surface you are in before reaching for a utility class.
- `src/routes/` and `src/router/` both exist. Read both before adding a route.
- The mobile app is Flutter and lives elsewhere. Nothing here is shared with it.

## Known and accepted

The main bundle is around 824 kB, over Vite's 500 kB warning threshold. It is a known warning, not your regression. Do not open an unrequested code-splitting effort because you saw it.

## Do not

- Do not push to `main`. Branch protection will refuse it.
- Do not force-push a shared branch.
- Do not add a dependency without flagging it. The runtime dependency list is deliberately short.
- Do not put Firebase keys or any secret in the repo. They are `VITE_` environment variables in the host.
- Do not let a branch drift for days. Pull `main` in often.

## Deploy

Vercel, with a preview URL per pull request. `vercel.json` and `netlify.toml` both exist; Vercel is the live one. Point a reviewer at the preview link for anything touching a screen.
