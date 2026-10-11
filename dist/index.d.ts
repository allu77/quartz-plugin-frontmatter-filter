import { QuartzFilterPlugin } from '@quartz-community/types';
export { QuartzFilterPlugin } from '@quartz-community/types';

type Ops = {
    equals: unknown;
    notEquals: unknown;
    in: unknown[];
    notIn: unknown[];
    exists: boolean;
    matches: string;
    contains: unknown;
    gt: number | string;
    gte: number | string;
    lt: number | string;
    lte: number | string;
};
type OpName = keyof Ops;
type Condition = {
    key: string;
} & {
    [K in OpName]?: Ops[K];
};
type Rule = {
    all: Rule[];
} | {
    any: Rule[];
} | {
    not: Rule;
} | Condition;

interface FrontmatterFilterOptions {
    /** Result when neither `exclude` nor `include` decides. Default: true. */
    defaultPublish?: boolean;
    /** Notes matching this rule are never published. */
    exclude?: Rule;
    /** Notes matching this rule are published (unless excluded). */
    include?: Rule;
}
declare const FrontmatterFilter: QuartzFilterPlugin<FrontmatterFilterOptions>;

export { type Condition, FrontmatterFilter, type FrontmatterFilterOptions, type Rule };
