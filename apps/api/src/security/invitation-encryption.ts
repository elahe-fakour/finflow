import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const FORMAT_VERSION = "v1";

export function encryptInvitationToken(token: string, key = readInvitationEncryptionKey()): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    FORMAT_VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptInvitationToken(
  encryptedToken: string,
  key = readInvitationEncryptionKey(),
): string {
  const [version, encodedIv, encodedTag, encodedCiphertext] = encryptedToken.split(".");
  if (version !== FORMAT_VERSION || !encodedIv || !encodedTag || !encodedCiphertext) {
    throw new Error("Invalid encrypted invitation token format.");
  }

  try {
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(encodedIv, "base64url"));
    decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encodedCiphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error("Unable to decrypt invitation token.");
  }
}

function readInvitationEncryptionKey(): Buffer {
  const value = process.env.INVITATION_ENCRYPTION_KEY?.trim();
  if (!value || !/^[a-f0-9]{64}$/iu.test(value)) {
    throw new Error("INVITATION_ENCRYPTION_KEY must be a 32-byte hexadecimal secret.");
  }
  return Buffer.from(value, "hex");
}

export { KEY_BYTES };
