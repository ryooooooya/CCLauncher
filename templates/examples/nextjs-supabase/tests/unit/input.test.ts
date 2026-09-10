import { describe, expect, it } from "vitest";
import { documentBody, validId } from "../../src/lib/input";

describe("document input boundary", () => {
  it("accepts only an editable body", () => {
    expect(documentBody({ body: "private" })).toBe("private");
  });
  it.each([
    null,
    [],
    {},
    { body: "" },
    { body: 1 },
    { body: "x".repeat(2001) },
    { body: "private", owner_id: "forged" },
  ])("rejects invalid fields or limits: %j", (input) => {
    expect(documentBody(input)).toBeNull();
  });
  it("rejects path and query strings as IDs", () => {
    expect(validId("../other?id=1")).toBe(false);
    expect(validId(crypto.randomUUID())).toBe(true);
  });
});
