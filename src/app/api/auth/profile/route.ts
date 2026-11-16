import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";
import { isAdminEmail, requireUser } from "@/lib/auth/server";

export async function POST(request: Request) {
  try {
    // The client must send a Firebase ID token. Never trust a uid from the body.
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!db || typeof db.collection !== "function") {
      return NextResponse.json(
        { error: "Server configuration error: database not connected." },
        { status: 500 },
      );
    }

    const docRef = db.collection("profiles").doc(user.uid);
    const docSnap = await docRef.get();
    const email = user.email ?? "";

    if (docSnap.exists) {
      const existingProfile = docSnap.data();
      if (!existingProfile?.email && email) {
        await docRef.set({ email }, { merge: true });
      }
      return NextResponse.json({ success: true });
    }

    await docRef.set({
      profile_id: user.uid,
      username: isAdminEmail(email) ? "Admin" : "",
      avatar_url: "",
      email,
      role: isAdminEmail(email) ? "admin" : "user",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in profile API:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
