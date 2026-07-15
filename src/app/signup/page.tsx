"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { Loading } from "@/components/loading";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const fullEmail = email.includes("@") ? email : `${email}@sidibishr-apartment.live`;
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: fullEmail, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "حصل خطأ، حاول تاني.");
        setLoading(false);
        return;
      }

      // Auto sign-in after signup
      const result = await signIn("credentials", {
        email: fullEmail,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("اتسجّل بس الدخول فشل، حاول تدخل يدوي.");
        setLoading(false);
      } else {
        router.replace("/feed");
      }
    } catch {
      setError("حصل خطأ، حاول تاني.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={64} />
          </div>
          <h1 className="text-2xl font-bold text-teal">نوّرت</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">الاسم</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">الإيميل</Label>
            <div className="flex items-stretch" dir="ltr">
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                dir="ltr"
                placeholder="name"
                className="rounded-l-lg rounded-r-none"
              />
              <span className="inline-flex items-center rounded-r-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                @sidibishr-apartment.live
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              الإيميل لازم ينتهي بـ @sidibishr-apartment.live
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">كلمة السر</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              dir="ltr"
              className="text-right"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loading /> : "يلا ندخل"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          عندك حساب؟{" "}
          <Link href="/login" className="text-teal hover:underline">
            ادخل
          </Link>
        </p>
      </div>
    </div>
  );
}
