"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/feed");
    }
  }, [status, router]);

  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="text-center max-w-lg animate-fade-in">
        <div className="mb-6 flex justify-center">
          <Logo size={96} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-teal mb-3">
          أهلاً بيك في شقة سيدي بشر
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          بيت أصحاب، شاي، وذكريات ما تتنسيش.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto">
              ادخل
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              انضم كـرائد
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
