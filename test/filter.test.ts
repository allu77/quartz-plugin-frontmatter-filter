import { describe, expect, it } from "vitest";
import { FrontmatterFilter, type FrontmatterFilterOptions } from "../src";
import { evaluate, validateRule } from "../src/rules";

const publish = (opts: FrontmatterFilterOptions, frontmatter?: Record<string, unknown>) =>
  FrontmatterFilter(opts).shouldPublish!({} as never, [{}, { data: { frontmatter } }] as never);

describe("operators", () => {
  const fm = {
    draft: "true",
    n: 5,
    tags: ["private", "wip"],
    meta: { level: "secret" },
    date: "2026-01-02",
  };
  const t = (r: object) => evaluate(r as never, fm);
  it("equals/notEquals", () => {
    expect(t({ key: "draft", equals: true })).toBe(true);
    expect(t({ key: "missing", equals: 1 })).toBe(false);
    expect(t({ key: "missing", notEquals: 1 })).toBe(true);
  });
  it("in/notIn/exists", () => {
    expect(t({ key: "n", in: [4, 5] })).toBe(true);
    expect(t({ key: "n", notIn: [5] })).toBe(false);
    expect(t({ key: "missing", exists: false })).toBe(true);
    expect(t({ key: "n", exists: true })).toBe(true);
  });
  it("contains/matches on arrays and strings", () => {
    expect(t({ key: "tags", contains: "private" })).toBe(true);
    expect(t({ key: "tags", matches: "^wi" })).toBe(true);
    expect(t({ key: "draft", contains: "ru" })).toBe(true);
  });
  it("dotted paths", () => {
    expect(t({ key: "meta.level", equals: "secret" })).toBe(true);
  });
  it("comparisons incl. dates", () => {
    expect(t({ key: "n", gt: 4, lte: 5 })).toBe(true);
    expect(t({ key: "date", lt: "2026-06-01" })).toBe(true);
    expect(t({ key: "date", gte: "2026-06-01" })).toBe(false);
  });
  it("combinators", () => {
    expect(t({ all: [{ key: "n", equals: 5 }, { not: { key: "x", exists: true } }] })).toBe(true);
    expect(t({ any: [{ key: "n", equals: 1 }, { key: "n", equals: 2 }] })).toBe(false);
  });
});

describe("plugin", () => {
  const exclude = { any: [{ key: "draft", equals: true }, { key: "tags", contains: "private" }] };
  it("excludes by default-publish", () => {
    expect(publish({ exclude }, { draft: true })).toBe(false);
    expect(publish({ exclude }, { tags: ["private"] })).toBe(false);
    expect(publish({ exclude }, { title: "x" })).toBe(true);
    expect(publish({ exclude }, undefined)).toBe(true);
  });
  it("allowlist mode", () => {
    const opts = { defaultPublish: false, include: { key: "publish", equals: true } };
    expect(publish(opts, { publish: true })).toBe(true);
    expect(publish(opts, {})).toBe(false);
    expect(publish({ ...opts, exclude: { key: "draft", equals: true } }, { publish: true, draft: true })).toBe(false);
  });
});

describe("validation", () => {
  it.each([
    [{ key: "a" }],
    [{ key: "a", bogus: 1 }],
    [{ all: [] }],
    [{ key: "a", matches: "(" }],
    [{ key: "a", in: 3 }],
    [{ all: [{ key: "a", equals: 1 }], key: "b" }],
  ])("rejects %j", (rule) => {
    expect(() => validateRule(rule)).toThrow(/frontmatter-filter/);
  });
});
