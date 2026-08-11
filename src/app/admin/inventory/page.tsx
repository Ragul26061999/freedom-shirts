import InventoryDashboard from '@/components/admin/InventoryDashboard';

export const metadata = {
  title: 'Inventory Management - ERP',
  description: 'Manage real-time inventory and stock levels',
};

export default function InventoryPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
      </div>
      <InventoryDashboard />
    </div>
  );
}
