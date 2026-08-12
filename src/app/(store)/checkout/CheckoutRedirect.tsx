"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPolarCheckout } from "./actions";
import { shippingService } from "@/services/admin/shippingService";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export default function CheckoutRedirect() {
  const router = useRouter();
  const { subtotal } = useCart();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Polar / Credit Card");

  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    district: "",
    zip_code: "",
    phone: "",
  });
  
  const [availableStates, setAvailableStates] = useState<string[]>([]);

  useEffect(() => {
    async function fetchAvailableStates() {
      try {
        const rates = await shippingService.getShippingRates();
        // Extract unique state names (filter out nulls)
        const uniqueStates = Array.from(new Set(rates.map(r => r.state).filter(Boolean))) as string[];
        setAvailableStates(uniqueStates);
      } catch (err) {
        console.error("Failed to load shipping regions", err);
      }
    }
    fetchAvailableStates();
  }, []);

  // Calculate shipping cost whenever state or district changes
  useEffect(() => {
    async function updateShipping() {
      if (!address.state) {
        setShippingCost(0);
        return;
      }
      setIsCalculating(true);
      try {
        const cost = await shippingService.calculateShippingCharge(
          address.state, 
          address.district || address.city
        );
        setShippingCost(cost);
      } catch (err) {
        console.error("Error calculating shipping:", err);
      } finally {
        setIsCalculating(false);
      }
    }
    
    // Debounce slightly to avoid too many requests
    const timeoutId = setTimeout(() => {
      updateShipping();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [address.state, address.district, address.city]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!address.street || !address.city || !address.state || !address.zip_code || !address.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createPolarCheckout({
        userId: user?.uid || user?.id || "guest",
        userEmail: user?.email || undefined,
        shippingCharge: shippingCost,
        address: address,
        paymentMethod: paymentMethod
      });

      if (!result.success || !result.checkoutUrl) {
        throw new Error(result.error || "Failed to create checkout session");
      }

      // Redirect to Polar hosted checkout
      window.location.href = result.checkoutUrl;
    } catch (err) {
      console.error("Error creating checkout session:", err);
      setIsLoading(false);
      toast.error(err instanceof Error ? err.message : "Failed to start checkout. Please try again.");
    }
  };

  const total = subtotal + shippingCost;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white py-16 px-4 sm:px-6 font-sans">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-extrabold text-stone-900 mb-8 tracking-tight text-center md:text-left font-serif">Complete Your Order</h1>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column - Address Form */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-stone-100/50 border-b border-stone-100 pb-4">
                <CardTitle className="text-xl font-semibold text-stone-800">1. Shipping Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address *</Label>
                  <Input 
                    id="street" 
                    required 
                    value={address.street} 
                    onChange={e => setAddress({...address, street: e.target.value})} 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input 
                      id="city" 
                      required 
                      value={address.city} 
                      onChange={e => setAddress({...address, city: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip_code">Zip/Postal Code *</Label>
                    <Input 
                      id="zip_code" 
                      required 
                      value={address.zip_code} 
                      onChange={e => setAddress({...address, zip_code: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State / Province *</Label>
                    <Select 
                      required
                      value={address.state} 
                      onValueChange={(value) => setAddress({...address, state: value || ""})}
                    >
                      <SelectTrigger id="state">
                        <SelectValue placeholder="Select a state" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStates.map(state => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">District (Optional)</Label>
                    <Input 
                      id="district" 
                      value={address.district} 
                      onChange={e => setAddress({...address, district: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    required 
                    value={address.phone} 
                    onChange={e => setAddress({...address, phone: e.target.value})} 
                  />
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-stone-100/50 border-b border-stone-100 pb-4">
              <CardTitle className="text-xl font-semibold text-stone-800">2. Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="payment-method">Select Payment Option</Label>
                <Select 
                  required
                  value={paymentMethod} 
                  onValueChange={(val) => setPaymentMethod(val || "Polar / Credit Card")}
                >
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Select a payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Polar / Credit Card">Polar / Credit Card</SelectItem>
                    <SelectItem value="Cash on Delivery">Cash on Delivery</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-5 xl:col-span-4 relative">
          <Card className="sticky top-8 border-0 shadow-2xl rounded-2xl overflow-hidden bg-stone-900 text-stone-50">
            <CardHeader className="border-b border-stone-800 pb-6 pt-8">
              <CardTitle className="text-2xl font-bold tracking-wide">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex justify-between text-stone-300 text-lg">
                <span>Subtotal</span>
                <span className="font-medium text-white">₹{(subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-300 text-lg">
                <span className="flex items-center gap-2">
                  Shipping
                  {isCalculating && <Loader2 className="h-4 w-4 animate-spin text-stone-400" />}
                </span>
                <span className="font-medium text-white">
                  {address.state ? (
                    shippingCost === 0 ? "Free" : `₹${(shippingCost || 0).toFixed(2)}`
                  ) : (
                    <span className="text-sm text-stone-400 italic">Enter address</span>
                  )}
                </span>
              </div>
              
              <div className="border-t border-stone-700 pt-6 mt-6 flex justify-between font-bold text-2xl items-center">
                <span>Total</span>
                <span className="text-amber-400">₹{(total || 0).toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pb-8">
              <Button 
                type="submit" 
                form="checkout-form" 
                className="w-full h-14 text-lg font-bold bg-amber-500 hover:bg-amber-600 text-stone-900 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1" 
                disabled={isLoading || isCalculating || subtotal === 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Processing...
                  </>
                ) : (
                  `Proceed to Payment (₹${(total || 0).toFixed(2)})`
                )}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full text-stone-400 hover:text-white hover:bg-stone-800"
                onClick={() => router.push("/cart")}
              >
                Return to Cart
              </Button>
            </CardFooter>
          </Card>
        </div>

      </div>
    </div>
    </div>
  );
}
