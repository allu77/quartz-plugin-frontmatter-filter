# quartz-plugin-frontmatter-filter

A [Quartz v5](https://github.com/jackyzha0/quartz) filter plugin that decides which notes are published, based on declarative rules over their frontmatter.

## Install

```bash
npx quartz plugin add github:allu77/quartz-plugin-frontmatter-filter
```

## Configure

```yaml
plugins:
  - source: github:allu77/quartz-plugin-frontmatter-filter
    enabled: true
    options:
      defaultPublish: true   # result when no rule decides (default true)
      exclude:               # matching notes are never published
        any:
          - { key: draft, equals: true }
          - { key: tags, contains: private }
      include:               # matching notes are published (unless excluded)
        key: publish
        equals: true
```

Evaluation order: `exclude` match → hidden; `include` match → published; otherwise `defaultPublish`.
Set `defaultPublish: false` with an `include` rule for allowlist mode.

## Rules

A rule is `{ all: [...] }`, `{ any: [...] }`, `{ not: rule }`, or a condition `{ key, <operator>: value }`.
Several operators in one condition must all hold. `key` may be a dotted path (`meta.level`).
A missing key makes a condition false, except `exists: false`, `notEquals` and `notIn`.

| Operator | Meaning |
|---|---|
| `equals` / `notEquals` | loose equality (`"true"` equals `true`) |
| `in` / `notIn` | value is (not) one of the list |
| `exists` | key is present and non-null (`true`) or absent (`false`) |
| `matches` | regex, tested against the value or any array item |
| `contains` | array has the item, or string includes the text |
| `gt` `gte` `lt` `lte` | numeric or date comparison |

Invalid options throw at startup with a descriptive error.

## Develop

`npm run check` (typecheck + tests), `npm run build`. **Commit `dist/`**: Quartz loads the built output directly.
