"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { toast } from "sonner";

export function UpdatePasswordForm({
  message,
  oobCode,
}: {
  message: string | null;
  oobCode: string | null;
}) {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState<string | null>(null);
  const [codeState, setCodeState] = useState<"checking" | "valid" | "invalid">(
    "checking"
  );

  useEffect(() => {
    let cancelled = false;

    const verifyCode = async () => {
      if (!oobCode) {
        setCodeState("invalid");
        setError(
          "This reset link is invalid or has expired. Please request a new password reset email."
        );
        return;
      }

      try {
        const email = await verifyPasswordResetCode(auth, oobCode);
        if (cancelled) return;
        setResetEmail(email);
        setCodeState("valid");
      } catch (err) {
        if (cancelled) return;
        setCodeState("invalid");
        setError(
          err instanceof Error
            ? err.message
            : "This reset link is invalid or has expired."
        );
      }
    };

    verifyCode();
    return () => {
      cancelled = true;
    };
  }, [oobCode]);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword(!showConfirmPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!oobCode || codeState !== "valid") {
      setError("This reset link is invalid or has expired.");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await confirmPasswordReset(auth, oobCode, password);
      toast.success("Password updated successfully!");

      setTimeout(() => {
        router.push(
          "/signin?message=Your password has been updated successfully. Please sign in with your new password."
        );
      }, 1500);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while updating your password";
      setError(errorMessage);
      console.error("Password update error:", error);
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
          <div className="bg-primary/15 rounded-md p-3 text-sm text-green-500">
            {message}
          </div>
        )}
        {resetEmail && (
          <div className="mb-2 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
            Resetting password for <strong>{resetEmail}</strong>.
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••"
              disabled={codeState !== "valid" || loading}
            />
            <button
              type="button"
              className="hover:bg-accent hover:text-accent-foreground absolute top-0 right-0 inline-flex h-full cursor-pointer items-center justify-center px-3"
              onClick={togglePasswordVisibility}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="sr-only">
                {showPassword ? "Hide password" : "Show password"}
              </span>
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••"
              disabled={codeState !== "valid" || loading}
            />
            <button
              type="button"
              className="hover:bg-accent hover:text-accent-foreground absolute top-0 right-0 inline-flex h-full cursor-pointer items-center justify-center px-3"
              onClick={toggleConfirmPasswordVisibility}
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="sr-only">
                {showConfirmPassword ? "Hide password" : "Show password"}
              </span>
            </button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col">
        <Button
          type="submit"
          className="hover:bg-primary/90 w-full cursor-pointer"
          disabled={loading || codeState !== "valid"}
        >
          {loading
            ? "Updating..."
            : codeState === "checking"
              ? "Verifying link..."
              : "Update Password"}
        </Button>
        {codeState === "invalid" && (
          <Link href="/reset-password" className="mt-3 text-sm underline">
            Request a new reset link
          </Link>
        )}
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
