'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getProductStockHistory } from '@/services/admin/erpService';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { ProductWithDetails } from '@/services/admin/adminProductService';
import { Clock, IndianRupee, PackageOpen, CalendarDays } from 'lucide-react';

interface ProductStockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductWithDetails | null;
}

export function ProductStockHistoryModal({
  isOpen,
  onClose,
  product,
}: ProductStockHistoryModalProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && product?.product_id) {
      loadHistory();
    }
  }, [isOpen, product]);

  const loadHistory = async () => {
    if (!product) return;
    setLoading(true);
    try {
      const res = await getProductStockHistory(product.product_id);
      if (res.success && res.data) {
        setHistory(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeForAction = (action: string) => {
    switch (action) {
      case 'purchase_received':
        return <Badge className="bg-green-500">Received Batch</Badge>;
      case 'customer_order':
        return <Badge variant="secondary">Sold</Badge>;
      case 'customer_return':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Return</Badge>;
      case 'damaged':
        return <Badge variant="destructive">Damaged</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] bg-slate-50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <PackageOpen className="h-6 w-6 text-primary" />
            Stock Details: {product.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
          {/* Product Batch Details */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Current Stock</span>
            <span className="text-2xl font-black text-slate-800">{product.stock} units</span>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Selling Price</span>
            <span className="text-2xl font-black text-slate-800 flex items-center">
              <IndianRupee className="h-5 w-5 mr-1 text-slate-400" />
              {product.price.toLocaleString()}
            </span>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Mfg Date</span>
            <span className="text-lg font-bold text-slate-700 flex items-center mt-1">
              <CalendarDays className="h-4 w-4 mr-2 text-slate-400" />
              {product.manufacturing_date ? new Date(product.manufacturing_date).toLocaleDateString() : 'N/A'}
            </span>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Expiry Date</span>
            <span className="text-lg font-bold text-slate-700 flex items-center mt-1">
              <Clock className="h-4 w-4 mr-2 text-orange-400" />
              {product.expiry_date ? new Date(product.expiry_date).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Stock History Ledger</h3>
          
          {loading ? (
            <div className="flex justify-center p-8">
              <LoadingSpinner />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-lg border border-slate-100 text-muted-foreground">
              No stock history found for this product.
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3">
              {history.map((record) => (
                <div key={record.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-primary/30 hover:shadow-md">
                  
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Action</span>
                      {getBadgeForAction(record.action)}
                    </div>
                    
                    <div className="h-10 w-px bg-slate-100 mx-2 hidden md:block"></div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Date</span>
                      <span className="font-medium text-slate-700">{new Date(record.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto bg-slate-50 px-4 py-2 rounded-lg">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Change</span>
                      <span className={`text-lg font-black ${record.difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {record.difference > 0 ? '+' : ''}{record.difference}
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-center border-l pl-6 border-slate-200">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">New Total</span>
                      <span className="text-lg font-black text-slate-800">{record.new_quantity}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 w-full md:w-1/3">
                    {record.purchase_price != null && (
                      <div className="flex items-center text-sm font-semibold text-slate-700 bg-green-50 px-2 py-1 rounded-md border border-green-100 self-start">
                        <IndianRupee className="h-3 w-3 mr-1" /> 
                        {record.purchase_price} / unit
                      </div>
                    )}
                    {record.batch_number && (
                      <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 self-start">
                        Batch: {record.batch_number}
                      </div>
                    )}
                    {(record.manufacturing_date || record.expiry_date) && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md self-start flex flex-col">
                        {record.manufacturing_date && <span>Mfg: {new Date(record.manufacturing_date).toLocaleDateString()}</span>}
                        {record.expiry_date && <span>Exp: {new Date(record.expiry_date).toLocaleDateString()}</span>}
                      </div>
                    )}
                    {record.reason && (
                      <div className="text-sm text-slate-500 italic bg-slate-50/50 p-2 rounded-md mt-1">
                        "{record.reason}"
                      </div>
                    )}
                  </div>
                  
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
