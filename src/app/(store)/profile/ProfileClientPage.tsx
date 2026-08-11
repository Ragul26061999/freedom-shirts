"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ProfileCard } from "@/components/ProfileCard";
import { OrderCard } from "@/components/OrderCard";
import { EmptyOrdersState } from "@/components/EmptyOrdersState";
import { auth, db } from "@/lib/firebase/client";
import { updateEmail, sendEmailVerification } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";
import { OrderType, ProfileType } from "@/types";
import { updateProfile } from "@/services/profile/profileServerService";

interface ProfileClientPageProps {
  initialProfile: ProfileType | null;
  initialOrders: OrderType[];
  user: any;
}

export default function ProfileClientPage({
  initialProfile,
  initialOrders,
  user,
}: ProfileClientPageProps) {
  const { signOut } = useAuth();
  const router = useRouter();

  // Initialize state with server-fetched data
  const [username, setUsername] = useState(initialProfile?.username || "");
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatar_url || "");
  const [email, setEmail] = useState(initialProfile?.email || user.email || "");
  const [orders, setOrders] = useState<OrderType[]>(initialOrders);
  const [isSaving, setIsSaving] = useState(false);

  // Handle saving profile data
  const handleSaveProfile = async (
    usernameInput: string,
    emailInput: string,
    avatarUrlInput: string,
  ) => {
    try {
      setIsSaving(true);

      const updatedProfile = await updateProfile(user.id, {
        username: usernameInput,
        email: emailInput,
        avatar_url: avatarUrlInput,
      });

      if (!updatedProfile) throw new Error("Failed to update profile");

      setUsername(updatedProfile.username || "");
      setEmail(updatedProfile.email || "");
      setAvatarUrl(updatedProfile.avatar_url || "");

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Add a handler for auth email updates
  const handleUpdateEmail = async (newEmail: string) => {
    try {
      if (!auth.currentUser) throw new Error("Not authenticated");
      
      await updateEmail(auth.currentUser, newEmail);
      await sendEmailVerification(auth.currentUser);
      
      toast.success(
        "Verification email sent! Please check your inbox and click the verification link.",
      );
    } catch (error) {
      console.error("Error updating email:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update email",
      );
      throw error;
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // Update order in state immediately after status change (optimistic UI)
  const handleOrderUpdated = (updatedOrder: OrderType) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
    );
  };

  // Subscribe to realtime updates using Firebase
  useEffect(() => {
    let unsubscribeProfile: () => void;
    // Real-time listener for profile changes
    if (user.id) {
      const docRef = doc(db, 'profiles', user.id);
      unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUsername(data.username || "");
          setEmail(data.email || "");
          setAvatarUrl(data.avatar_url || "");
        }
      });
    }

    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [user.id]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: Profile */}
        <div className="w-full lg:w-1/3">
          <ProfileCard
            user={user}
            username={username}
            setUsername={setUsername}
            avatarUrl={avatarUrl}
            setAvatarUrl={setAvatarUrl}
            email={email}
            setEmail={setEmail}
            createdAt={initialProfile?.created_at || null}
            isSaving={isSaving}
            onSaveProfile={handleSaveProfile}
            onSignOut={handleSignOut}
            onUpdateEmail={handleUpdateEmail}
          />
        </div>

        {/* Right Side: Orders */}
        <div className="w-full lg:w-2/3">
          <h2 className="mb-4 text-2xl font-bold">My Orders</h2>

          {orders.length === 0 ? (
            <EmptyOrdersState onBrowseProducts={() => router.push("/")} />
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdate={handleOrderUpdated}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
