import type { QuartzFilterPlugin } from "@quartz-community/types";
import { evaluate, validateRule, type Frontmatter, type Rule } from "./rules";

export interface FrontmatterFilterOptions {
  /** Result when neither `exclude` nor `include` decides. Default: true. */
  defaultPublish?: boolean;
  /** Notes matching this rule are never published. */
  exclude?: Rule;
  /** Notes matching this rule are published (unless excluded). */
  include?: Rule;
}

export const FrontmatterFilter: QuartzFilterPlugin<FrontmatterFilterOptions> = (opts) => {
  const defaultPublish = opts?.defaultPublish ?? true;
  if (typeof defaultPublish !== "boolean")
    throw new Error("frontmatter-filter: defaultPublish must be a boolean");
  const exclude = opts?.exclude === undefined ? undefined : validateRule(opts.exclude, "exclude");
  const include = opts?.include === undefined ? undefined : validateRule(opts.include, "include");

  return {
    name: "FrontmatterFilter",
    shouldPublish(_ctx, [_tree, vfile]) {
      const fm = (vfile.data?.frontmatter ?? {}) as Frontmatter;
      if (exclude && evaluate(exclude, fm)) return false;
      if (include && evaluate(include, fm)) return true;
      return defaultPublish;
    },
  };
};
