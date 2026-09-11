import { describe, expect, it } from "vitest";
import { sessionCookieOptions } from "../../src/lib/session-cookies";

describe("session transport configuration", () => {
  it("requires HTTPS by default, even for loopback", () => {
    for (const origin of [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://example.com",
    ])
      for (const flag of [undefined, "false"])
        expect(() => sessionCookieOptions(origin, flag)).toThrow();
  });
  it("permits HTTP only with explicit local opt-in and a loopback origin", () => {
    expect(sessionCookieOptions("http://127.0.0.1:3000", "true").secure).toBe(
      false,
    );
    expect(sessionCookieOptions("http://localhost:3000", "true").httpOnly).toBe(
      true,
    );
    for (const origin of [
      "http://example.com",
      "http://localhost.example.com",
      "http://127.0.0.1:3000/path",
    ])
      expect(() => sessionCookieOptions(origin, "true")).toThrow();
  });
  it("retains secure attributes over HTTPS regardless of local opt-in", () => {
    for (const flag of [undefined, "false", "true"])
      expect(sessionCookieOptions("https://example.com", flag)).toEqual({
        secure: true,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
  });
  it("rejects malformed origin and opt-in values", () => {
    for (const origin of [
      undefined,
      "not a URL",
      "ftp://localhost",
      "https://example.com/path",
    ])
      expect(() => sessionCookieOptions(origin, undefined)).toThrow();
    expect(() => sessionCookieOptions("https://example.com", "yes")).toThrow();
  });
});
