import { createLoginPath, getSafeRedirectPath } from "./redirects";
import { describe, expect, it } from "vitest";

describe("authentication redirects", () => {
  it("keeps an internal path so a user returns to the page they requested", () => {
    expect(getSafeRedirectPath("/customers/customer-acme/edit?tab=contacts")).toBe(
      "/customers/customer-acme/edit?tab=contacts",
    );
    expect(createLoginPath("/customers")).toBe("/login?next=%2Fcustomers");
  });

  it("rejects external and malformed redirect destinations", () => {
    expect(getSafeRedirectPath("https://malicious.example")).toBe("/");
    expect(getSafeRedirectPath("//malicious.example")).toBe("/");
    expect(getSafeRedirectPath("/\\malicious.example")).toBe("/");
    expect(getSafeRedirectPath(["/customers"])).toBe("/");
  });
});
