"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase/admin";
import { isAdminEmail, verifyIdToken } from "@/lib/auth/server";

/**
 * Persist a homepage section after verifying the caller's Firebase ID token.
 * The client passes the current user's token so this action never trusts a
 * client-supplied email/role.
 */
export async function updateHomepageSettings(
  sectionName: string,
  contentJson: unknown,
  idToken: string
) {
  const user = await verifyIdToken(idToken);
  if (!user || !isAdminEmail(user.email)) {
    throw new Error("Unauthorized: Only admins can edit this.");
  }

  if (!db || typeof db.collection !== "function") {
    throw new Error("Database is not available.");
  }

  await db
    .collection("homepage_settings")
    .doc(sectionName)
    .set({ content_json: contentJson, updated_at: new Date() }, { merge: true });

  revalidatePath("/");
  return { success: true };
}
