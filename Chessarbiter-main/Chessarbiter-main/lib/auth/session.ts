import "server-only";

import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

const sessionCookieName = "chessarbiter_session";
const encoder = new TextEncoder();

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET, NEXTAUTH_SECRET, or SESSION_SECRET must contain at least 32 characters.");
  }

  return encoder.encode(secret);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = payload.userId;

    if (typeof userId !== "string") {
      return null;
    }

    return prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/logowanie");
  }

  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireUser();

  if (!roles.includes(user.role)) {
    redirect("/");
  }

  return user;
}
