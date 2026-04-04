import jwt from "jsonwebtoken";
import type { StringValue } from "ms";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as StringValue;

interface TokenPayload {
  userId: number;
  role: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
