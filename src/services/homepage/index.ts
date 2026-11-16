"use server";

import { db } from "@/lib/firebase/admin";

/**
 * Read a homepage section from Firestore.
 * Document shape: homepage_settings/{sectionName} -> { content_json: unknown }
 */
export async function getHomepageSettings(sectionName: string) {
  try {
    if (!db || typeof db.collection !== "function") return null;

    const snap = await db.collection("homepage_settings").doc(sectionName).get();
    if (!snap.exists) return null;

    return snap.data()?.content_json ?? null;
  } catch (err) {
    console.error(`[getHomepageSettings] Failed to fetch ${sectionName}:`, err);
    return null;
  }
}
