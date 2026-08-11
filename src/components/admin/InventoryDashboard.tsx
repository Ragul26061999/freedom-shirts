'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, XCircle, ArrowUpFromLine, Clock } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { adminProductService, ProductWithDetails } from '@/services/admin/adminProductService';
import { formatCurrency } from '@/utils/formatCurrency';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ProductStockHistoryModal } from './ProductStockHistoryModal';

interface DashboardStats {
  totalProducts: number;
  totalStockUnits: number;
  lowStock: number;
  outOfStock: number;
  reservedStock: number;
  availableStock: number;
  inventoryValue: number;
}

export default function InventoryDashboard() {
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithDetails | null>(null);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      
      const [allProducts, analytics] = await Promise.all([
        adminProductService.getAllProducts(),
        adminProductService.getProductAnalytics()
      ]);

      setProducts(allProducts);

      let outOfStockCount = 0;
      let totalStockUnits = 0;

      allProducts.forEach(p => {
        if (p.stock <= 0) outOfStockCount++;
        totalStockUnits += p.stock;
      });

      setStats({
        totalProducts: analytics.totalProducts,
        totalStockUnits: totalStockUnits,
        lowStock: analytics.lowStockCount,
        outOfStock: outOfStockCount,
        reservedStock: 0, // In full ERP, this comes from product_warehouse_stock
        availableStock: totalStockUnits, // In full ERP, this comes from product_warehouse_stock
        inventoryValue: analytics.totalInventoryValue,
      });

    } catch (error) {
      console.error('Failed to fetch inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!stats) {
    return <div>Failed to load inventory stats.</div>;
  }

  // Calculate expiring products
  const expiringProducts = products
    .filter((p) => p.expiry_date)
    .map((p) => {
      const days = Math.ceil(
        (new Date(p.expiry_date!).getTime() - Date.now()) / (1000 * 3600 * 24)
      );
      return { ...p, daysToExpiry: days };
    })
    .filter((p) => p.daysToExpiry <= 90)
    .sort((a, b) => a.daysToExpiry - b.daysToExpiry);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableStock}</div>
            <p className="text-xs text-muted-foreground">
              Total value: {formatCurrency(stats.inventoryValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reserved Stock</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reservedStock}</div>
            <p className="text-xs text-muted-foreground">
              Pending order shipments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStock}</div>
            <p className="text-xs text-muted-foreground">
              Products near reorder level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.outOfStock}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate purchase
            </p>
          </CardContent>
        </Card>
      </div>

      {expiringProducts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <Clock className="mr-2 h-5 w-5" />
              Expiring Products Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-orange-200">
                  <TableHead className="text-orange-900">Product</TableHead>
                  <TableHead className="text-orange-900">SKU</TableHead>
                  <TableHead className="text-orange-900">Stock</TableHead>
                  <TableHead className="text-orange-900">Expiry Date</TableHead>
                  <TableHead className="text-orange-900">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiringProducts.map((product) => (
                  <TableRow 
                    key={`exp-${product.product_id}`} 
                    className="border-orange-100 cursor-pointer hover:bg-orange-100/50"
                    onClick={() => {
                      setSelectedProduct(product);
                      setIsHistoryOpen(true);
                    }}
                  >
                    <TableCell className="font-medium text-orange-950">{product.title}</TableCell>
                    <TableCell className="text-orange-900">{product.sku || 'N/A'}</TableCell>
                    <TableCell className="text-orange-900">{product.stock}</TableCell>
                    <TableCell className="text-orange-900">
                      {new Date(product.expiry_date!).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {product.daysToExpiry < 0 ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : product.daysToExpiry <= 30 ? (
                        <Badge variant="destructive">Expiring in {product.daysToExpiry} days</Badge>
                      ) : product.daysToExpiry <= 60 ? (
                        <Badge variant="secondary" className="bg-orange-500 hover:bg-orange-600 text-white">Expiring in {product.daysToExpiry} days</Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-700 border-orange-300">Expiring in {product.daysToExpiry} days</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Live Product Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow 
                  key={product.product_id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedProduct(product);
                    setIsHistoryOpen(true);
                  }}
                >
                  <TableCell className="font-medium">{product.title}</TableCell>
                  <TableCell>{product.sku || 'N/A'}</TableCell>
                  <TableCell>{product.category?.name || 'Uncategorized'}</TableCell>
                  <TableCell>{formatCurrency(product.price)}</TableCell>
                  <TableCell className="font-semibold">{product.stock}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {product.expiry_date ? new Date(product.expiry_date).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {product.stock <= 0 ? (
                      <Badge variant="destructive">Out of Stock</Badge>
                    ) : product.stock < 10 ? (
                      <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Low Stock</Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">In Stock</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ProductStockHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
}
