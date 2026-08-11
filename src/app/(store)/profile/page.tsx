'use client';

import { Suspense, useEffect, useState } from "react";
import ProfileClientPage from "./ProfileClientPage";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getProfileById } from "@/services/profile/profileServerService";
import { getOrders } from "@/services/order/orderServerService";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    } else if (user) {
      // Fetch initial data
      Promise.all([
        getProfileById(user.id),
        getOrders(user.id),
      ]).then(([profileData, ordersData]) => {
        setProfile(profileData);
        setOrders(ordersData);
        setDataLoading(false);
      });
    }
  }, [user, loading, router]);

  if (loading || dataLoading) {
    return <LoadingSpinner />;
  }

  if (!user) return null;

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProfileClientPage
        initialProfile={profile}
        initialOrders={orders || []}
        user={user}
      />
    </Suspense>
  );
}
