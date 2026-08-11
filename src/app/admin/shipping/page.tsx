"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Edit } from "lucide-react";
import { shippingService, ShippingRateType } from "@/services/admin/shippingService";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ShippingManagementPage() {
  const [rates, setRates] = useState<ShippingRateType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ShippingRateType | null>(null);

  const [formData, setFormData] = useState({
    state: "",
    district: "",
    charge: "",
  });

  const loadRates = async () => {
    setLoading(true);
    try {
      const data = await shippingService.getShippingRates();
      setRates(data);
    } catch (error) {
      toast.error("Failed to load shipping rates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
  }, []);

  const handleOpenModal = (rate?: ShippingRateType) => {
    if (rate) {
      setEditingRate(rate);
      setFormData({
        state: rate.state,
        district: rate.district || "",
        charge: rate.charge.toString(),
      });
    } else {
      setEditingRate(null);
      setFormData({ state: "", district: "", charge: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRate(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.state || !formData.charge) {
      toast.error("State and Charge are required.");
      return;
    }

    try {
      const chargeAmount = parseFloat(formData.charge);
      if (isNaN(chargeAmount) || chargeAmount < 0) {
        toast.error("Charge must be a valid positive number.");
        return;
      }

      if (editingRate) {
        await shippingService.updateShippingRate(editingRate.id, {
          state: formData.state,
          district: formData.district || undefined,
          charge: chargeAmount,
        });
        toast.success("Shipping rate updated.");
      } else {
        await shippingService.createShippingRate({
          state: formData.state,
          district: formData.district || undefined,
          charge: chargeAmount,
        });
        toast.success("Shipping rate created.");
      }

      loadRates();
      handleCloseModal();
    } catch (error) {
      toast.error("Failed to save shipping rate.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this shipping rate?")) return;
    try {
      await shippingService.deleteShippingRate(id);
      toast.success("Shipping rate deleted.");
      loadRates();
    } catch (error) {
      toast.error("Failed to delete shipping rate.");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shipping Management</h1>
          <p className="text-muted-foreground mt-1">
            Configure dynamic delivery charges based on state and district locations.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" /> Add Shipping Rate
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Shipping Zones</CardTitle>
          <CardDescription>
            Rules with a specific district take priority over state-wide rules.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <LoadingSpinner />
            </div>
          ) : rates.length === 0 ? (
            <div className="text-center p-8 border rounded bg-muted/20">
              <p className="text-muted-foreground">No shipping rates configured. Default is free shipping.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>State</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead className="text-right">Charge (₹)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell className="font-medium">{rate.state}</TableCell>
                      <TableCell>
                        {rate.district ? rate.district : <span className="text-muted-foreground italic">All Districts</span>}
                      </TableCell>
                      <TableCell className="text-right">₹{(rate.charge || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(rate)}
                          className="mr-2 cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(rate.id)}
                          className="text-destructive hover:text-destructive/90 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRate ? "Edit Shipping Rate" : "Add Shipping Rate"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="state">State / Province *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g. Tamil Nadu"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="district">District / City (Optional)</Label>
              <Input
                id="district"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="Leave empty for entire state"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="charge">Delivery Charge (₹) *</Label>
              <Input
                id="charge"
                type="number"
                step="0.01"
                min="0"
                value={formData.charge}
                onChange={(e) => setFormData({ ...formData, charge: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit">
                {editingRate ? "Save Changes" : "Add Rate"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
