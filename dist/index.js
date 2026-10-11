// src/rules.ts
var OP_NAMES = [
  "equals",
  "notEquals",
  "in",
  "notIn",
  "exists",
  "matches",
  "contains",
  "gt",
  "gte",
  "lt",
  "lte"
];
var isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
function getPath(fm, key) {
  if (key in fm) return fm[key];
  let cur = fm;
  for (const part of key.split(".")) {
    if (!isObject(cur) || !(part in cur)) return void 0;
    cur = cur[part];
  }
  return cur;
}
function looseEquals(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => looseEquals(x, b[i]));
  }
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a === "object" || typeof b === "object") return false;
  return String(a) === String(b);
}
function compare(a, b) {
  if (a instanceof Date) a = a.getTime();
  if (typeof b === "string" && typeof a !== "number" && !Number.isNaN(Date.parse(b))) {
    const t = a instanceof Date ? a.getTime() : Date.parse(String(a));
    if (!Number.isNaN(t)) return t - Date.parse(b);
  }
  const n = typeof a === "number" ? a : typeof a === "string" ? Number(a) : NaN;
  const m = typeof b === "number" ? b : Number(b);
  if (Number.isNaN(n) || Number.isNaN(m)) return void 0;
  return n - m;
}
function evalCondition(c, fm) {
  const value = getPath(fm, c.key);
  const present = value !== void 0 && value !== null;
  for (const op of OP_NAMES) {
    const arg = c[op];
    if (arg === void 0) continue;
    let ok;
    switch (op) {
      case "exists":
        ok = present === arg;
        break;
      case "equals":
        ok = present && looseEquals(value, arg);
        break;
      case "notEquals":
        ok = !present || !looseEquals(value, arg);
        break;
      case "in":
        ok = present && arg.some((x) => looseEquals(value, x));
        break;
      case "notIn":
        ok = !present || !arg.some((x) => looseEquals(value, x));
        break;
      case "matches": {
        const re = new RegExp(arg);
        ok = present && (Array.isArray(value) ? value : [value]).some((v) => re.test(String(v)));
        break;
      }
      case "contains":
        ok = Array.isArray(value) ? value.some((x) => looseEquals(x, arg)) : typeof value === "string" && value.includes(String(arg));
        break;
      default: {
        const d = present ? compare(value, arg) : void 0;
        ok = d !== void 0 && (op === "gt" ? d > 0 : op === "gte" ? d >= 0 : op === "lt" ? d < 0 : d <= 0);
      }
    }
    if (!ok) return false;
  }
  return true;
}
function evaluate(rule, fm) {
  if ("all" in rule) return rule.all.every((r) => evaluate(r, fm));
  if ("any" in rule) return rule.any.some((r) => evaluate(r, fm));
  if ("not" in rule) return !evaluate(rule.not, fm);
  return evalCondition(rule, fm);
}
function validateRule(rule, path = "rule") {
  if (!isObject(rule)) throw new Error(`frontmatter-filter: ${path} must be an object`);
  const keys = Object.keys(rule);
  for (const comb of ["all", "any"]) {
    if (comb in rule) {
      if (keys.length !== 1) throw new Error(`frontmatter-filter: ${path} mixes "${comb}" with other keys`);
      const list = rule[comb];
      if (!Array.isArray(list) || list.length === 0)
        throw new Error(`frontmatter-filter: ${path}.${comb} must be a non-empty array`);
      const checked = list.map((r, i) => validateRule(r, `${path}.${comb}[${i}]`));
      return comb === "all" ? { all: checked } : { any: checked };
    }
  }
  if ("not" in rule) {
    if (keys.length !== 1) throw new Error(`frontmatter-filter: ${path} mixes "not" with other keys`);
    return { not: validateRule(rule.not, `${path}.not`) };
  }
  if (typeof rule.key !== "string" || rule.key === "")
    throw new Error(`frontmatter-filter: ${path} needs a "key" string (or all/any/not)`);
  const ops = keys.filter((k) => k !== "key");
  if (ops.length === 0) throw new Error(`frontmatter-filter: ${path} has no operator`);
  for (const op of ops) {
    if (!OP_NAMES.includes(op))
      throw new Error(`frontmatter-filter: ${path} has unknown operator "${op}"`);
  }
  if ("in" in rule && !Array.isArray(rule.in) || "notIn" in rule && !Array.isArray(rule.notIn))
    throw new Error(`frontmatter-filter: ${path} "in"/"notIn" need an array`);
  if ("exists" in rule && typeof rule.exists !== "boolean")
    throw new Error(`frontmatter-filter: ${path} "exists" must be a boolean`);
  if ("matches" in rule) {
    if (typeof rule.matches !== "string")
      throw new Error(`frontmatter-filter: ${path} "matches" must be a string`);
    try {
      new RegExp(rule.matches);
    } catch {
      throw new Error(`frontmatter-filter: ${path} has invalid regex "${rule.matches}"`);
    }
  }
  for (const op of ["gt", "gte", "lt", "lte"]) {
    if (op in rule && typeof rule[op] !== "number" && typeof rule[op] !== "string")
      throw new Error(`frontmatter-filter: ${path} "${op}" must be a number or string`);
  }
  return rule;
}

// src/filter.ts
var FrontmatterFilter = (opts) => {
  const defaultPublish = opts?.defaultPublish ?? true;
  if (typeof defaultPublish !== "boolean")
    throw new Error("frontmatter-filter: defaultPublish must be a boolean");
  const exclude = opts?.exclude === void 0 ? void 0 : validateRule(opts.exclude, "exclude");
  const include = opts?.include === void 0 ? void 0 : validateRule(opts.include, "include");
  return {
    name: "FrontmatterFilter",
    shouldPublish(_ctx, [_tree, vfile]) {
      const fm = vfile.data?.frontmatter ?? {};
      if (exclude && evaluate(exclude, fm)) return false;
      if (include && evaluate(include, fm)) return true;
      return defaultPublish;
    }
  };
};

export { FrontmatterFilter };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map