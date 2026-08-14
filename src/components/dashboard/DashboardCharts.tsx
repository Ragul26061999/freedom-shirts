"use client";

import { useMemo, useState } from "react";
import { OrderType } from "@/types";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import { format } from "date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardChartsProps {
  orders: OrderType[];
}

export function DashboardCharts({ orders }: DashboardChartsProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [selectedYear, setSelectedYear] = useState<number | "all">(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | "all">(currentMonth);

  // Available years from orders
  const years = useMemo(() => {
    const orderYears = orders
      .map((o) => (o.created_at ? new Date(o.created_at).getFullYear() : currentYear))
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => b - a);
    if (!orderYears.includes(currentYear)) {
      orderYears.push(currentYear);
    }
    return orderYears.sort((a, b) => b - a);
  }, [orders, currentYear]);

  // Available months
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!order.created_at) return false;
      const date = new Date(order.created_at);
      const yearMatch = selectedYear === "all" || date.getFullYear() === selectedYear;
      const monthMatch = selectedMonth === "all" || date.getMonth() === selectedMonth;
      return yearMatch && monthMatch;
    });
  }, [orders, selectedYear, selectedMonth]);

  // Prepare Bar Chart Data (Spending)
  const barChartData = useMemo(() => {
    const dataMap: Record<string, { date: Date; total: number }> = {};
    
    filteredOrders.forEach((order) => {
      if (!order.created_at) return;
      const date = new Date(order.created_at);
      
      let key = "";
      let sortDate = date;
      
      if (selectedYear !== "all" && selectedMonth !== "all") {
        key = format(date, "MMM dd");
        sortDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      } else if (selectedYear !== "all" && selectedMonth === "all") {
        key = format(date, "MMM yyyy");
        sortDate = new Date(date.getFullYear(), date.getMonth(), 1);
      } else {
        key = format(date, "yyyy");
        sortDate = new Date(date.getFullYear(), 0, 1);
      }
      
      if (!dataMap[key]) {
        dataMap[key] = { date: sortDate, total: 0 };
      }
      dataMap[key].total += (order.total || 0);
    });

    const sortedData = Object.values(dataMap).sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      labels: sortedData.map(d => {
        if (selectedYear !== "all" && selectedMonth !== "all") return format(d.date, "MMM dd");
        if (selectedYear !== "all" && selectedMonth === "all") return format(d.date, "MMM yyyy");
        return format(d.date, "yyyy");
      }),
      datasets: [
        {
          label: "Amount Spent (₹)",
          data: sortedData.map(d => d.total),
          backgroundColor: "rgba(59, 130, 246, 0.7)", // blue-500
          borderColor: "rgba(37, 99, 235, 1)", // blue-600
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [filteredOrders, selectedYear, selectedMonth]);

  // Prepare Pie Chart Data (Product Breakdown)
  const pieChartData = useMemo(() => {
    const productMap: Record<string, number> = {};
    
    filteredOrders.forEach(order => {
      order.order_items?.forEach(item => {
        const title = item.product?.title || "Unknown Product";
        productMap[title] = (productMap[title] || 0) + (item.quantity || 1);
      });
    });

    const sortedProducts = Object.entries(productMap)
      .sort((a, b) => b[1] - a[1]) // Sort by quantity descending
      .slice(0, 8); // Top 8 products

    const labels = sortedProducts.map(p => p[0]);
    const data = sortedProducts.map(p => p[1]);

    if (labels.length === 0) {
      labels.push("No data");
      data.push(1);
    }

    const backgroundColors = [
      "rgba(249, 115, 22, 0.8)", // orange-500
      "rgba(16, 185, 129, 0.8)", // emerald-500
      "rgba(139, 92, 246, 0.8)", // violet-500
      "rgba(236, 72, 153, 0.8)", // pink-500
      "rgba(59, 130, 246, 0.8)", // blue-500
      "rgba(234, 179, 8, 0.8)",  // yellow-500
      "rgba(20, 184, 166, 0.8)", // teal-500
      "rgba(244, 63, 94, 0.8)",  // rose-500
    ];

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors.slice(0, labels.length),
          borderColor: "#ffffff",
          borderWidth: 2,
        },
      ],
    };
  }, [filteredOrders]);

  const totalSpent = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalProducts = filteredOrders.reduce((sum, order) => {
    return sum + (order.order_items?.reduce((itemSum, item) => itemSum + (item.quantity || 1), 0) || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Filters and Stats */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground font-medium">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground font-medium">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value === "all" ? "all" : Number(e.target.value))}
              disabled={selectedYear === "all"}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            >
              <option value="all">All Months</option>
              {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="flex flex-col items-end">
            <span className="text-sm text-muted-foreground">Total Spent</span>
            <span className="text-2xl font-bold text-primary">₹{totalSpent.toFixed(2)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm text-muted-foreground">Products Bought</span>
            <span className="text-2xl font-bold text-primary">{totalProducts}</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      {filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Bar Chart */}
          <div className="rounded-xl border bg-card p-6 shadow-sm bg-white">
            <h3 className="mb-4 text-lg font-semibold text-card-foreground">Spending Overview</h3>
            <div className="h-[300px] w-full">
              <Bar 
                data={barChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: (value) => '₹' + value,
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>

          {/* Pie Chart */}
          <div className="rounded-xl border bg-card p-6 shadow-sm bg-white">
            <h3 className="mb-4 text-lg font-semibold text-card-foreground">Products Breakdown</h3>
            <div className="h-[300px] w-full flex items-center justify-center">
              {pieChartData.labels.length > 0 && pieChartData.labels[0] !== "No data" ? (
                <Pie 
                  data={pieChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'right' },
                    }
                  }} 
                />
              ) : (
                <p className="text-muted-foreground">No product data available</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border bg-gray-50/50">
          <p className="text-lg font-medium text-gray-500">No orders found for this period</p>
          <p className="text-sm text-gray-400">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
