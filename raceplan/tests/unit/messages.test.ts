/**
 * Every locale must define exactly the same keys, with the same ICU
 * placeholders, so adding a language = adding one messages file.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";

const dir = join(__dirname, "../../messages");
type Tree = { [k: string]: string | Tree };

function flatten(tree: Tree, prefix = ""): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") acc[key] = v;
    else Object.assign(acc, flatten(v, key));
    return acc;
  }, {});
}

const load = (locale: string) =>
  flatten(JSON.parse(readFileSync(join(dir, `${locale}.json`), "utf8")));
/** ICU argument names (`{name}` or `{name, plural, …}`), ignoring plural branch text. */
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)(?=[,}])/g)].map((m) => m[1]).sort();

describe("messages", () => {
  const en = load("en");

  it("has a file per configured locale", () => {
    const files = readdirSync(dir).map((f) => f.replace(".json", ""));
    expect(files.sort()).toEqual([...routing.locales].sort());
  });

  it.each(routing.locales.filter((l) => l !== "en"))("%s has the same keys as en", (locale) => {
    const other = load(locale);
    expect(Object.keys(other).sort()).toEqual(Object.keys(en).sort());
  });

  it.each(routing.locales.filter((l) => l !== "en"))("%s uses the same placeholders", (locale) => {
    const other = load(locale);
    for (const [key, value] of Object.entries(en)) {
      expect(placeholders(other[key] ?? ""), key).toEqual(placeholders(value));
    }
  });

  it("has no empty strings", () => {
    for (const locale of routing.locales) {
      for (const [key, value] of Object.entries(load(locale)))
        expect(value.trim(), `${locale}:${key}`).not.toBe("");
    }
  });
});
