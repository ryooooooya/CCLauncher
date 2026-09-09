# Application security tests

Implement executable *.test.* or *.spec.* files here and a package.json
script named test:security that runs them with the application's test runner.
The generated security-check command fails until both exist.

Use actual application boundaries and synthetic guest / user A / user B fixtures.
Verify permitted owner operations and rejected cross-user access, direct IDs,
lists, updates and deletes, including response data and persistent side effects.
Include selected authentication, CSRF, upload, webhook and admin boundaries.
Record intentionally inapplicable cases in docs/SECURITY.md.

This README is not an executable test. The runnable provider-specific baseline
is developed in CCLauncher Issue #6; do not replace missing tests with passing mocks.
