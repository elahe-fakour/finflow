# ADR 0003: Adopt Vitest for Financial Calculation Tests

- Status: Accepted
- Date: 2026-09-23

## Context

FinFlow now has pure money and invoice calculation functions. Financial rules
such as minor-unit rounding, tax order, discount limits, currency matching, and
safe-integer boundaries can be syntactically valid while still producing an
incorrect business result. They need fast, deterministic tests that run without
the browser, database, or API.

## Decision

Use Vitest for unit tests of pure business logic. Tests are colocated with the
code they protect using the `*.test.ts` convention. The initial Vitest setup uses
the Node environment because money and invoice calculations do not require a DOM.

The `test` script runs Vitest in watch mode for local development. The `test:run`
script runs the suite once for local verification and future CI. The consolidated
`check` script now includes the one-time test run.

React Testing Library, jsdom, and browser testing are intentionally deferred.
They become useful when FinFlow needs component behavior or end-to-end workflow
coverage rather than pure financial-rule tests.

## Consequences

- Financial calculation behavior is protected before editable invoice line items
  are introduced.
- Tests can run quickly in Node and do not need backend infrastructure.
- The Vitest config resolves FinFlow's `@/` TypeScript path alias for tested
  modules.
- Future changes to money, totals, payments, reconciliation scoring, and reports
  should add regression tests alongside the affected pure logic.

## Alternatives Considered

- **Jest:** mature and capable, but would require a separate setup without a
  benefit for these TypeScript-only pure functions.
- **Node's built-in test runner:** removes a dependency, but provides a less
  consistent assertion and developer experience for the test strategy planned
  across FinFlow.
- **Playwright only:** valuable for complete browser workflows, but too slow and
  broad for calculation edge cases.
- **No tests until the backend exists:** risks making unverified financial rules
  the foundation for later persistence and payment workflows.
