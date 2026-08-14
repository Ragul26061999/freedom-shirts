'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, XCircle, ArrowUpFromLine, Clock, Search, Filter } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [valueFilter, setValueFilter] = useState('all');

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

  const categories = Array.from(new Set(products.map(p => p.category?.name).filter(Boolean))) as string[];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    if (statusFilter !== 'all') {
      if (statusFilter === 'in_stock' && product.stock < 10) return false;
      if (statusFilter === 'low_stock' && (product.stock <= 0 || product.stock >= 10)) return false;
      if (statusFilter === 'out_of_stock' && product.stock > 0) return false;
    }

    if (categoryFilter !== 'all' && product.category?.name !== categoryFilter) return false;

    if (valueFilter !== 'all') {
      if (valueFilter === 'under_500' && product.price >= 500) return false;
      if (valueFilter === '500_1000' && (product.price < 500 || product.price > 1000)) return false;
      if (valueFilter === 'over_1000' && product.price <= 1000) return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Available Stock - Pastel Sky/Blue */}
        <Card className="relative overflow-hidden border border-sky-500/20 bg-gradient-to-br from-sky-50/90 via-blue-50/50 to-indigo-100/40 dark:from-sky-950/40 dark:via-sky-900/20 dark:to-indigo-950/30 shadow-xs hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-sky-950 dark:text-sky-200">
              Available Stock
            </CardTitle>
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-sky-950 dark:text-sky-100 tracking-tight">
              {stats.availableStock}
            </div>
            <p className="text-xs font-medium text-sky-700/80 dark:text-sky-300/80 mt-1">
              Total value: {formatCurrency(stats.inventoryValue)}
            </p>
          </CardContent>
        </Card>

        {/* Reserved Stock - Pastel Purple/Violet */}
        <Card className="relative overflow-hidden border border-purple-500/20 bg-gradient-to-br from-purple-50/90 via-fuchsia-50/50 to-violet-100/40 dark:from-purple-950/40 dark:via-purple-900/20 dark:to-violet-950/30 shadow-xs hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-950 dark:text-purple-200">
              Reserved Stock
            </CardTitle>
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <ArrowUpFromLine className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-950 dark:text-purple-100 tracking-tight">
              {stats.reservedStock}
            </div>
            <p className="text-xs font-medium text-purple-700/80 dark:text-purple-300/80 mt-1">
              Pending order shipments
            </p>
          </CardContent>
        </Card>

        {/* Low Stock Alerts - Pastel Amber/Orange */}
        <Card className="relative overflow-hidden border border-amber-500/20 bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-yellow-100/40 dark:from-amber-950/40 dark:via-amber-900/20 dark:to-orange-950/30 shadow-xs hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-amber-950 dark:text-amber-200">
              Low Stock Alerts
            </CardTitle>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-950 dark:text-amber-100 tracking-tight">
              {stats.lowStock}
            </div>
            <p className="text-xs font-medium text-amber-700/80 dark:text-amber-300/80 mt-1">
              Products near reorder level
            </p>
          </CardContent>
        </Card>

        {/* Out of Stock - Pastel Rose/Red */}
        <Card className="relative overflow-hidden border border-rose-500/20 bg-gradient-to-br from-rose-50/90 via-red-50/50 to-pink-100/40 dark:from-rose-950/40 dark:via-rose-900/20 dark:to-pink-950/30 shadow-xs hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-rose-950 dark:text-rose-200">
              Out of Stock
            </CardTitle>
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <XCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-950 dark:text-rose-100 tracking-tight">
              {stats.outOfStock}
            </div>
            <p className="text-xs font-medium text-rose-700/80 dark:text-rose-300/80 mt-1">
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
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 pb-6">
          <CardTitle>Live Product Inventory</CardTitle>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products or SKU..."
                className="pl-8 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val || 'all')}>
              <SelectTrigger className="w-full sm:w-[160px] bg-background">
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Category" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={valueFilter} onValueChange={(val) => setValueFilter(val || 'all')}>
              <SelectTrigger className="w-full sm:w-[160px] bg-background">
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Value" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="under_500">Under ₹500</SelectItem>
                <SelectItem value="500_1000">₹500 - ₹1000</SelectItem>
                <SelectItem value="over_1000">Over ₹1000</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'all')}>
              <SelectTrigger className="w-full sm:w-[160px] bg-background">
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
              {filteredProducts.map((product) => (
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
              {filteredProducts.length === 0 && (
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
