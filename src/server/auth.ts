import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { db } from "./db.js";
import { User } from "../types.js";

const JWT_SECRET = process.env.JWT_SECRET || "flowforge-premium-saas-hmac-secret-signature-2026";

// Token encoder/decoder using native hmac
export function signToken(payload: { userId: string; email: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString("base64url");
  
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
    
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const [header, body, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");
      
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    
    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}

// Express Auth Middleware
export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization token" });
    return;
  }
  
  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Token is expired or invalid" });
    return;
  }
  
  const users = db.getUsers();
  const currentUser = users.find((u) => u.id === payload.userId);
  if (!currentUser) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  
  req.user = currentUser;
  next();
}
