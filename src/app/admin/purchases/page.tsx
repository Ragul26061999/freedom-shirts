import PurchaseManagement from '@/components/admin/PurchaseManagement';

export const metadata = {
  title: 'Purchase Management - ERP',
  description: 'Manage purchase orders and receive stock batches',
};

export default function PurchasesPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Purchase Management</h2>
      </div>
      <PurchaseManagement />
    </div>
  );
}
