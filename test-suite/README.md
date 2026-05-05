# Test Suite Reference

This folder is for executable verification references only. Keep analysis reports and stale recommendations out of this directory.

## Baseline Commands

From the repository root:

```bash
npm run lint
npm run build
```

If Prisma types or schema-adjacent code changed:

```bash
npx prisma generate
```

## Browser QA

Use browser QA for user-visible flows:

- Explore map and list views
- Live performance page
- Singer dashboard
- Payments and redirects
- Theme and language switching

Record results using `docs/handoff-template.md`.

## Adding Tests

- Add tests next to the behavior they protect when the project already has an appropriate test pattern.
- Do not add one-off generated reports here.
- Do not weaken or delete failing tests to pass CI.