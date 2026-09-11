import { test as base } from "@playwright/test";

// Count declarations before Playwright discards empty describe groups.
const scopes: { count: number; title: string }[] = [];
function declared() {
  for (const scope of scopes) scope.count++;
}
function wrapDescribe<T extends Function>(describe: T): T {
  return new Proxy(describe, {
    apply(target, receiver, args) {
      const callback = args.at(-1);
      if (typeof callback !== "function")
        return Reflect.apply(target, receiver, args);
      return Reflect.apply(target, receiver, [
        ...args.slice(0, -1),
        () => {
          const scope = { count: 0, title: String(args[0]) };
          scopes.push(scope);
          try {
            callback();
          } finally {
            scopes.pop();
          }
          if (!scope.count)
            throw new Error(`Required test suite is empty: ${scope.title}`);
        },
      ]);
    },
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver);
      return typeof value === "function" && key !== "configure"
        ? wrapDescribe(value)
        : value;
    },
  });
}
function required(source: typeof base): typeof base {
  return new Proxy(source, {
    apply(target, receiver, args) {
      declared();
      return Reflect.apply(target, receiver, args);
    },
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver);
      if (key === "describe") return wrapDescribe(value);
      if (key === "extend")
        return (...args: unknown[]) =>
          required(Reflect.apply(value, target, args));
      if (["only", "skip", "fixme", "fail"].includes(String(key))) {
        return (...args: unknown[]) => {
          if (typeof args.at(-1) === "function") declared();
          return Reflect.apply(value, target, args);
        };
      }
      return value;
    },
  });
}
export const test = required(base);
