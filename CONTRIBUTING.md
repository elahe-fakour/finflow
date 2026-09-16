# Contributing to FinFlow

FinFlow is developed incrementally. Keep each change small, focused, and easy to
review.

## Before You Start

1. Read the [README](./README.md) for local setup and available commands.
2. Review [plan.md](./plan.md) to understand the current phase, milestone, and
   task.
3. Do not introduce a dependency, service, or architectural pattern unless the
   current task requires it.
4. Never commit secrets, credentials, or real financial data.

## Branches

For collaborative work, create one branch per task from `main`:

```text
<type>/<short-description>
```

Examples:

```text
feat/application-sidebar
fix/invoice-total-rounding
docs/architecture-overview
chore/update-tooling
```

The current single-contributor learning workflow may use a reviewed, focused commit
on `main`. When another contributor is involved, use a branch and pull request.

## Commits

Each commit should represent one cohesive task. Use a Conventional Commits-style
subject in the imperative mood:

```text
<type>: <concise description>
```

Common types:

- `feat`: a user-facing capability
- `fix`: a bug correction
- `docs`: documentation only
- `test`: test coverage only
- `refactor`: internal restructuring without behavior change
- `chore`: tooling, setup, or maintenance

Examples:

```text
feat: add application sidebar
test: cover invoice total calculation
chore: add Prettier formatting conventions
```

Avoid mixing unrelated changes in a single commit.

## Review Checklist

Before committing, review the change deliberately:

1. Confirm the change matches the agreed task and contains no unrelated edits.
2. Inspect `git status` and `git diff`.
3. Run the checks relevant to the task:

   ```bash
   npm run format:check
   npm run lint
   npm run typecheck
   npm run build
   ```

4. For UI work, verify the page manually at desktop and mobile widths, including
   loading, empty, and error states when applicable.
5. For financial logic, add focused automated tests and review precision,
   validation, authorization, and audit requirements.

## Pull Requests

When working with others, open a pull request with:

- A concise summary of the problem and solution
- The checks that were run and their results
- Screenshots or a short recording for visual changes
- Any known limitations or follow-up work

Keep pull requests limited to one task whenever possible.
