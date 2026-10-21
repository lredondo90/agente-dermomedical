import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// Comprueba "Authorization: Bearer <secreto>" contra una variable de entorno. Sin la variable, siempre falla.
export function bearerOk(req: Request, envName: string) {
  const secret = process.env[envName];
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return !!secret && safeEqual(given, secret);
}

// Firma de Meta: X-Hub-Signature-256 = "sha256=" + HMAC-SHA256(cuerpo, app secret).
export function metaSignatureOk(rawBody: string, header: string | null, appSecret: string) {
  if (!header) return false;
  const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
  return safeEqual(header, expected);
}
