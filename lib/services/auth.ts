import "server-only";
import { getDb } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { ValidationError } from "@/lib/api-errors";

export async function authenticate(email: string, password: string) {
  const db = getDb();
  const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    throw new ValidationError("Invalid email or password.");
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new ValidationError("Invalid email or password.");
  }
  return user;
}
