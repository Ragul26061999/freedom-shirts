"use client";

import Link from "next/link";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Minus, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useCart } from "@/context/CartContext";
import ShoppingSkeleton from "@/components/ShoppingSkeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

export default function CartShoppingPage() {
  const { cartItems, removeFromCart, updateQuantity, subtotal, isLoading } =
    useCart();
  const { user } = useAuth();

  const totalOriginalPrice = cartItems.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);
  const totalDiscount = cartItems.reduce((acc, item) => {
    const isOnSale = !!item.discount_price && item.discount_price > 0 && item.discount_price <= 100;
    const discountAmount = isOnSale ? ((item.price || 0) * (item.discount_price! / 100)) * item.quantity : 0;
    return acc + discountAmount;
  }, 0);

  if (isLoading) {
    return <ShoppingSkeleton />;
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-6 flex items-center">
          <Link href="/" className="text-primary flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shopping
          </Link>
          <h1 className="ml-4 text-3xl font-bold">Your Shopping Cart</h1>
        </div>
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Please Log In</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">You need to be logged in to view your cart.</p>
            <Link href="/signin">
              <Button className="w-full">Log In</Button>
            </Link>
          </CardContent>
          <CardFooter>
            <p className="text-muted-foreground text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center">
        <Link href="/" className="text-primary flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shopping
        </Link>
        <h1 className="ml-4 text-3xl font-bold">Your Shopping Cart</h1>
      </div>

      {cartItems.length === 0 ? (
        <div className="p-8 text-center">
          <h2 className="mb-4 text-xl">Your cart is empty</h2>
          <Link href="/">
            <Button className="cursor-pointer">Continue Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            {cartItems.map((item) => (
              <Card key={item.product_id} className="mb-2">
                <div className="flex flex-row items-center py-2 px-3 gap-3">
                  <div className="w-14 h-14 shrink-0 bg-white rounded-md overflow-hidden border">
                    <Image
                      src={item.image || "/placeholder.png"}
                      alt={item.title || "Product image"}
                      width={56}
                      height={56}
                      className="h-full w-full object-contain p-1"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">{item.title}</h3>
                    {(item.selectedColor || item.selectedSize) && (
                      <div className="flex gap-2 text-xs font-medium text-primary mt-0.5 mb-0.5">
                        {item.selectedColor && <span className="bg-primary/10 px-1.5 py-0.5 rounded">{item.selectedColor}</span>}
                        {item.selectedSize && <span className="bg-primary/10 px-1.5 py-0.5 rounded">Size: {item.selectedSize}</span>}
                      </div>
                    )}
                    <p className="text-muted-foreground text-xs line-clamp-1">
                      {item.description}
                    </p>
                  </div>
                  
                  <div className="text-base font-bold whitespace-nowrap">
                    ₹{(item.price || 0).toFixed(2)}
                  </div>
                  
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="flex items-center border rounded-md h-8 bg-background">
                      <Button
                        type="button"
                        className="h-8 w-8 rounded-none border-0 p-0 cursor-pointer text-muted-foreground hover:text-foreground"
                        variant="ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          updateQuantity(item.product_id, -1);
                        }}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <Button
                        type="button"
                        className="h-8 w-8 rounded-none border-0 p-0 cursor-pointer text-muted-foreground hover:text-foreground"
                        variant="ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          updateQuantity(item.product_id, 1);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      className="h-8 w-8 p-0 ml-2 cursor-pointer text-destructive hover:bg-destructive/10"
                      variant="ghost"
                      onClick={(e) => {
                        e.preventDefault();
                        removeFromCart(item.product_id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span>Original Price</span>
                    <span>₹{totalOriginalPrice.toFixed(2)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-green-600 text-sm">
                      <span>Offers & Discounts</span>
                      <span>-₹{totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium">
                    <span>Subtotal</span>
                    <span>₹{(subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>₹5.99</span>
                  </div>
                  <div className="flex justify-between border-t pt-4 text-lg font-bold">
                    <span>Total</span>
                    <span>₹{((subtotal || 0) + 5.99).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/checkout">
                  <Button className="w-full cursor-pointer">
                    Proceed to Checkout
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
