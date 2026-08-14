"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPolarCheckout, getShippingRatesAction } from "./actions";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export default function CheckoutRedirect() {
  const router = useRouter();
  const { user } = useAuth();
  const { subtotal } = useCart();
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

  const [ratesData, setRatesData] = useState<Array<{state: string, district?: string, charge: number}>>([]);

  useEffect(() => {
    async function fetchAvailableStates() {
      try {
        const rates = await getShippingRatesAction();
        setRatesData(rates);
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
        const userState = (address.state || "").trim().toLowerCase();
        const userDistrict = (address.district || address.city || "").trim().toLowerCase();
        
        // Find exact match (state + district/city)
        const exactMatch = ratesData.find(r => 
          r.state?.trim().toLowerCase() === userState && 
          r.district?.trim().toLowerCase() === userDistrict
        );
        
        if (exactMatch) {
          setShippingCost(exactMatch.charge);
        } else {
          // Find state-only match (where admin left district blank)
          const stateMatch = ratesData.find(r => 
            r.state?.trim().toLowerCase() === userState && 
            (!r.district || r.district.trim() === "")
          );
          if (stateMatch) {
            setShippingCost(stateMatch.charge);
          } else {
            setShippingCost(0); // Free or default if unlisted, typically 0
          }
        }
      } catch (error) {
        console.error("Error calculating shipping:", error);
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
      console.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createPolarCheckout({
        userId: user?.id || user?.uid,
        userEmail: user?.email,
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
      console.error(err instanceof Error ? err.message : "Failed to start checkout. Please try again.");
    }
  };

  const total = subtotal + shippingCost;

  return (
    <div className="bg-background min-h-screen py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Left Column - Address Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Shipping Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    required
                    value={address.street}
                    onChange={e => setAddress({ ...address, street: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      required
                      value={address.city}
                      onChange={e => setAddress({ ...address, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip_code">Zip/Postal Code *</Label>
                    <Input
                      id="zip_code"
                      required
                      value={address.zip_code}
                      onChange={e => setAddress({ ...address, zip_code: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State / Province *</Label>
                    <Select
                      required
                      value={address.state}
                      onValueChange={(value) => setAddress({ ...address, state: value || "" })}
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
                      onChange={e => setAddress({ ...address, district: e.target.value })}
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
                    onChange={e => setAddress({ ...address, phone: e.target.value })}
                  />
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
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
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>₹{(subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span className="flex items-center gap-2">
                  Shipping
                  {isCalculating && <Loader2 className="h-3 w-3 animate-spin" />}
                </span>
                <span>
                  {address.state ? (
                    shippingCost === 0 ? "Free" : `₹${(shippingCost || 0).toFixed(2)}`
                  ) : (
                    "Enter address to calculate"
                  )}
                </span>
              </div>

              <div className="border-t pt-4 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{(total || 0).toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                form="checkout-form"
                className="w-full h-12 text-lg"
                disabled={isLoading || isCalculating || subtotal === 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
                  </>
                ) : (
                  `Proceed to Payment`
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push("/cart")}
              >
                Return to Cart
              </Button>
            </CardFooter>
          </Card>
        </div>

      </div>
    </div>
  );
}
