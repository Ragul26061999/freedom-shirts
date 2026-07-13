import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignInForm } from "./SignInForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type SignInProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SignIn({ searchParams }: SignInProps) {
  const params = await searchParams;
  const message = params.message ? String(params.message) : null;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-secondary/30 blur-[100px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md px-4 py-8">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors group">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </Link>
        
        <div className="animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-700">
          <Card className="w-full border-white/20 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden rounded-[2rem]">
            <CardHeader className="space-y-2 pb-6 pt-10 text-center">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-lg">
                <span className="text-2xl font-bold">in</span>
              </div>
              <CardTitle className="text-3xl font-extrabold tracking-tight">Welcome Back</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Sign in to your innova e-Commerce account
              </CardDescription>
            </CardHeader>
            <SignInForm message={message} />
          </Card>
        </div>
      </div>
    </div>
  );
}
