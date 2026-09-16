# How we work on Fanation

Short version: nobody pushes to `main`. Every change is a branch and a pull request, one review and a green build to merge. That is the whole rule. The detail below is so a new person can start on day one without asking.

## The trunk

`main` is the trunk. It is protected, always builds, and is what deploys. You never commit to it directly, and neither does anyone else. It only changes through a merged pull request.

## Start a branch

Cut every piece of work from the latest `main`.

```bash
git checkout main
git pull
git checkout -b feat/wallet-coins
```

Name the branch so anyone can see what it is and match it to the tracker:

- `feat/...` a new feature or screen, for example `feat/wallet-coins`, `feat/search`
- `fix/...` a bug fix, for example `fix/live-mobile-agora`
- `chore/...` setup, tooling, dependencies, for example `chore/ci-build-check`

One branch is one task. Keep it small. A branch that lives for a week and touches thirty files is painful to review and easy to break. Break big work into several branches and several PRs.

## Open a pull request

Push the branch and open a PR into `main`.

```bash
git push -u origin feat/wallet-coins
```

In the PR, say what changed and how to test it. If it touches a screen, the Vercel or Netlify preview link on the PR is the fastest way for the reviewer to see it live, so point them at the relevant page.

## Review and merge

- The build check has to be green. A red build blocks the merge, so fix it before asking for review.
- One teammate reviews and approves. The lane owner reviews their own lane where it makes sense (backend reviews backend, and so on).
- Once approved and green, squash and merge, then delete the branch. Squash keeps `main` history one clean line per task.

## What not to do

- Do not push to `main`. Branch protection will refuse it anyway.
- Do not force-push shared branches other people are using.
- Do not let a branch drift for days. Pull `main` into it often, or rebase, so the final merge is boring.
- Do not merge your own PR without a review, unless it is the initial setup and everyone has agreed.

## The design system, a repo quirk to know

`src/lib/ui` and `src/lib/brand` are vendored, not a package, and the admin console keeps its own copy. A change to the design system has to be made in both places on purpose, so neither project depends on the other. `src/lib/ui/styles.css` says so at the top. Keep that in mind before you "fix it in one place."
