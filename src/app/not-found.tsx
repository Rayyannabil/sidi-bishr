import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        <h1 className="text-6xl font-bold text-teal mb-4">٤٠٤</h1>
        <p className="text-lg text-muted-foreground mb-6">الصفحة دي مش موجودة</p>
        <Link href="/">
          <Button>ارجع للرئيسية</Button>
        </Link>
      </div>
    </div>
  );
}
