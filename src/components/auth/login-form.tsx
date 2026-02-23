"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { NeuralButton } from "@/components/ui/neural-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Resend verification email state
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const message = searchParams.get("message");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Handle different NextAuth error codes
        if (result.error === "CredentialsSignin") {
          setError("Invalid email or password");
        } else if (result.error === "Configuration") {
          // Configuration error usually means email verification failed
          setError("Please verify your email before signing in");
        } else {
          setError(result.error);
        }
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    setResendMessage("");

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (response.status === 429) {
        setResendMessage(`Rate limited. Please wait ${data.retryAfter} minute${data.retryAfter > 1 ? 's' : ''} before trying again.`);
      } else if (response.ok) {
        setResendMessage("Verification email sent! Please check your inbox.");
        setResendCooldown(60);
      } else {
        setResendMessage(data.error || "Failed to send verification email. Please try again.");
      }
    } catch (error) {
      setResendMessage("An error occurred. Please try again later.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-neural-primary">
            Sign In
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Access your BCS e-textbook platform
          </p>
        </div>

        <Card className="cognitive-card">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {message && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              {error && (
                <div className="space-y-2">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>

                  {/* Show resend button only if error is about email verification */}
                  {error.toLowerCase().includes('verify') && (
                    <div className="space-y-2">
                      <NeuralButton
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResendVerification}
                        disabled={resendCooldown > 0 || !email}
                        className="w-full"
                      >
                        {resendCooldown > 0
                          ? `Wait ${resendCooldown}s`
                          : "Resend Verification Email"
                        }
                      </NeuralButton>
                      {resendMessage && (
                        <p className={`text-xs text-center ${resendMessage.includes('sent') ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {resendMessage}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@university.edu"
                  required
                  disabled={isLoading}
                  className="border-neural-light/30 focus:border-neural-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                    className="border-neural-light/30 focus:border-neural-primary pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-neural-primary hover:text-neural-deep transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>

              <NeuralButton
                type="submit"
                variant="neural"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </NeuralButton>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/register"
                  className="text-neural-primary hover:text-neural-deep transition-colors font-medium"
                >
                  Register here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
