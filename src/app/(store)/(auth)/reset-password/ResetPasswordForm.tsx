"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { toast } from "sonner";

export function ResetPasswordForm({ message }: { message: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email) {
      setError("Email is required");
      return;
    }

    try {
      setLoading(true);

      await sendPasswordResetEmail(auth, email.trim(), {
        url: `${window.location.origin}/reset-password/update`,
        handleCodeInApp: false,
      });

      setSuccess(true);
      toast.success("Password reset email sent! Check your inbox.");

      setTimeout(() => {
        router.push("/reset-password/confirmation");
      }, 1500);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while sending the password reset email";
      setError(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-destructive/15 text-destructive rounded-md p-3 text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-primary/15 text-primary rounded-md p-3 text-sm">
            {message}
          </div>
        )}
        {success && (
          <div className="rounded-md bg-green-100 p-3 text-sm text-green-800">
            We&apos;ve sent you an email with a link to reset your password.
            Please check your inbox.
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading || success}
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col">
        <Button
          type="submit"
          className="hover:bg-primary/90 w-full cursor-pointer"
          disabled={loading || success}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
        <div className="mt-4 text-center text-sm">
          Remember your password?{" "}
          <Link
            href="/signin"
            className="text-primary hover:text-primary/90 cursor-pointer underline"
          >
            Sign in
          </Link>
        </div>
      </CardFooter>
    </form>
  );
}
