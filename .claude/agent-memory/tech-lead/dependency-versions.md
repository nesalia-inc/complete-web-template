---
name: dependency-versions-2026-05-27
description: Current dependency versions and pending major updates
type: reference
---

# Dependency Versions (2026-05-27)

## Recently Updated (2026-05-27)

| Package | From | To |
|---------|------|-----|
| @tanstack/react-query | 5.100.11 | 5.100.14 |
| react-hook-form | 7.76.0 | 7.76.1 |
| react-resizable-panels | 4.11.1 | 4.11.2 |
| date-fns | 4.2.1 | 4.3.0 |
| shadcn | 4.7.0 | 4.8.1 |
| turbo | 2.9.14 | 2.9.15 |
| eslint-config-next | 16.1.7 | 16.2.6 |
| next | 16.1.7 | 16.2.6 |
| prettier-plugin-tailwindcss | 0.7.4 | 0.8.0 |

## Pending Major Updates

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| conf | 12.0.0 | 15.1.0 | **Safe**: No breaking changes |
| open | 10.2.0 | 11.0.0 | **Safe**: Only Node 20+ required |
| @types/node | 22.19.19 | 25.9.1 | **Blocked**: Needs TS6 first |
| typescript | 5.9.3 | 6.0.3 | **Complex**: tsconfig changes needed |
| eslint | 9.39.4 | 10.4.0 | **Ready**: Config already flat ✅ |

## tsconfig.json (apps/web) - Changes Needed for TS6

```jsonc
{
  "compilerOptions": {
    "target": "ES2017"    // ⚠️ Must change to "ES2025"
    "moduleResolution": "bundler"  // ✅ Already correct
    "strict": true        // ✅ Already correct
    "baseUrl": "."        // ⚠️ MUST REMOVE (deprecated in TS6)
    // Add: "types": ["node"]  // Auto-discovery removed in TS6
  }
}
```

## eslint.config.mjs Status

- **Already flat config** ✅
- No `.eslintrc` legacy files found
- Uses `eslint-config-next/core-web-vitals` + `typescript`

## Plan Location

`temp/major-deps-update-plan.md`

## Key Findings

1. **conf v15**: No breaking changes, just refactor
2. **open v11**: Requires Node 20+, already on Node 20 so OK
3. **TS6 migration**:
   - Change `target` to ES2025
   - Remove `baseUrl`
   - Add `"types": ["node"]`
   - Automated tool: `npx ts5to6`
4. **ESLint v10**:
   - Config already migrated to flat format
   - May get new rule violations from `eslint:recommended`
   - `eslint-env` comments must be removed if any exist
5. **CI**: Node 20 ✅ — compatible with all updates