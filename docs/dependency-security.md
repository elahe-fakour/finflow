# Dependency updates and security checks

FinFlow uses the root `package-lock.json` as the lockfile for the npm workspaces.
Dependabot checks npm packages and GitHub Actions weekly and opens update pull
requests. Review each update with the normal CI checks before merging; major
version changes need a compatibility review.

The Dependency Audit workflow runs for pushes and pull requests targeting `main`
and on a weekly schedule. It installs from the lockfile and runs
`npm audit --audit-level=high`; high and critical advisories fail the workflow.
The audit covers the locked dependency tree, including development dependencies
used by the build and test toolchains.

Enable **Dependabot alerts** and **Dependabot security updates** in the GitHub
repository settings so known vulnerable dependencies also produce security
update pull requests. The committed Dependabot configuration enables scheduled
version updates, while those security settings are managed by GitHub outside
the repository.
