"use client";

import { OrderType } from "@/types";

interface DashboardChartsProps {
  orders: OrderType[];
}

export function DashboardCharts({ orders }: DashboardChartsProps) {
  return (
    <div className="flex flex-col h-64 items-center justify-center border rounded-lg bg-gray-50 gap-2">
      <p className="text-muted-foreground">Analytics charts will be displayed here.</p>
      <p className="text-xs text-muted-foreground">Total Orders: {orders?.length || 0}</p>
    </div>
  );
}
