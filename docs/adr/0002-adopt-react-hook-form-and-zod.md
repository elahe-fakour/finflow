# ADR 0002: Adopt React Hook Form and Zod for Client-Side Form Validation

- Status: Accepted
- Date: 2026-09-22

## Context

FinFlow's first create and edit workflows begin with customer records. Forms need
predictable field state, accessible validation feedback, and TypeScript types that
remain aligned with their validation rules. Managing these concerns with separate
`useState` values and handwritten validation would duplicate logic as the product
adds customers, vendors, invoices, and expenses.

## Decision

Use React Hook Form for interactive client-side form state and Zod for declarative
validation schemas. Use `@hookform/resolvers` to connect a Zod schema to a React
Hook Form instance.

Keep each feature schema close to the feature UI. The initial customer schema lives
in `src/components/customers/customer-form-schema.ts` and exports both inferred
form values and explicit default values.

Server-side validation will be added when the API exists. Client-side validation
improves the user experience but is not an authorization or data-integrity boundary.

## Consequences

- Forms can display consistent field-level validation messages without duplicating
  rules in each component.
- TypeScript derives form value types from the Zod schema.
- Interactive form components will be Client Components; pages can remain Server
  Components and render those smaller interactive boundaries.
- Future backend endpoints must validate their input independently of these schemas.

## Alternatives Considered

- **Local `useState` with handwritten validation:** no dependency, but validation
  and error-state logic would be repeatedly implemented.
- **Formik with Yup:** established alternative, but adds more form machinery and
  separates validation types from the schema more easily.
- **Native browser validation only:** useful baseline behavior, but insufficient for
  the consistent, composable validation UX planned for FinFlow.
