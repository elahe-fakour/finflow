import { describe, expect, it } from "vitest";
import {
  decryptInvitationToken,
  encryptInvitationToken,
} from "../src/security/invitation-encryption.js";

const key = Buffer.alloc(32, 7);

describe("invitation encryption", () => {
  it("round-trips a token with authenticated encryption", () => {
    const encrypted = encryptInvitationToken("invite-token", key);
    expect(encrypted).not.toContain("invite-token");
    expect(decryptInvitationToken(encrypted, key)).toBe("invite-token");
  });

  it("rejects tampered ciphertext", () => {
    const encrypted = encryptInvitationToken("invite-token", key);
    const tampered = `${encrypted.slice(0, -1)}${encrypted.endsWith("a") ? "b" : "a"}`;
    expect(() => decryptInvitationToken(tampered, key)).toThrow(
      "Unable to decrypt invitation token.",
    );
  });

  it("rejects an invalid key length", () => {
    expect(() => encryptInvitationToken("invite-token", Buffer.alloc(16))).toThrow();
  });
});
