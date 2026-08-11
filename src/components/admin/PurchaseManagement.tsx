'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { adminProductService, ProductWithDetails } from '@/services/admin/adminProductService';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { logStockHistory } from '@/services/admin/erpService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Truck, Plus } from 'lucide-react';

export default function PurchaseManagement() {
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [manufacturingDate, setManufacturingDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const allProducts = await adminProductService.getAllProducts();
      setProducts(allProducts);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !quantity) {
      toast.error('Please select a product and quantity');
      return;
    }

    setIsSubmitting(true);
    try {
      const product = products.find(p => p.product_id === selectedProductId);
      if (!product) throw new Error('Product not found');

      const addQuantity = parseInt(quantity);
      if (isNaN(addQuantity) || addQuantity <= 0) {
        throw new Error('Quantity must be positive');
      }

      // Update product stock and dates
      const newStock = product.stock + addQuantity;
      
      const updateData: any = {};
      if (manufacturingDate) updateData.manufacturing_date = new Date(manufacturingDate).toISOString();
      if (expiryDate) updateData.expiry_date = new Date(expiryDate).toISOString();

      await adminProductService.updateProduct(selectedProductId, updateData);
      await adminProductService.updateStock(selectedProductId, newStock);
      
      await logStockHistory({
        product_id: selectedProductId,
        action: 'purchase_received',
        previous_quantity: product.stock,
        new_quantity: newStock,
        difference: addQuantity,
        reason: 'Received new stock batch',
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : undefined,
        batch_number: batchNumber || undefined,
        manufacturing_date: updateData.manufacturing_date,
        expiry_date: updateData.expiry_date,
      });

      toast.success(`Successfully added ${addQuantity} units to stock!`);
      
      // Reset form
      setQuantity('');
      setPurchasePrice('');
      setBatchNumber('');
      setManufacturingDate('');
      setExpiryDate('');
      setSelectedProductId('');
      
      // Refresh products list
      await fetchProducts();

    } catch (error: any) {
      toast.error(error.message || 'Failed to receive stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="mr-2 h-5 w-5" />
            Receive New Stock Batch
          </CardTitle>
          <CardDescription>
            Add new inventory to existing products. This will immediately increase the available stock count.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReceiveStock} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Product Selection */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="product">Select Product</Label>
                <Select value={selectedProductId} onValueChange={(val) => setSelectedProductId(val || '')}>
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Select a product to receive stock" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.product_id} value={p.product_id}>
                        {p.title} (Current Stock: {p.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity Received *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 100"
                />
              </div>

              {/* Purchase Price */}
              <div className="space-y-2">
                <Label htmlFor="price">Purchase Price (Per Unit)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="₹ 0.00"
                />
              </div>

              <div className="space-y-2 md:col-span-2 border-t pt-4">
                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Batch Details (Optional)</h3>
              </div>

              {/* Batch Number */}
              <div className="space-y-2">
                <Label htmlFor="batch_number">Batch Number</Label>
                <Input
                  id="batch_number"
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g. BATCH-2026-07"
                />
              </div>

              {/* Batch Dates */}
              <div className="space-y-2">
                <Label htmlFor="mfg_date">Batch Manufacturing Date</Label>
                <Input
                  id="mfg_date"
                  type="date"
                  value={manufacturingDate}
                  onChange={(e) => setManufacturingDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exp_date">Batch Expiry Date</Label>
                <Input
                  id="exp_date"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>

            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
              {isSubmitting ? <div className="mr-2 h-4 w-4"><LoadingSpinner /></div> : <Plus className="mr-2 h-4 w-4" />}
              Receive Stock & Update Inventory
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
