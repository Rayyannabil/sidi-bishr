import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Users, Award } from "lucide-react";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-tea-50 to-background">
      <section className="relative overflow-hidden py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex justify-center mb-8 animate-fade-in">
            <Image
              src="/logo.png"
              alt="شقة سيدي بشر"
              width={120}
              height={120}
              className="rounded-2xl shadow-lg"
              priority
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-teal mb-4 animate-fade-in">
            أهلاً بيك في شقة سيدي بشر
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            بيت أصحاب، شاي، وذكريات ما تتنسيش.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/login">
              <Button size="lg">ادخل</Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="accent">انضم كـرائد</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="p-6 text-center hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-tea-100 flex items-center justify-center">
                  <Calendar className="h-7 w-7 text-tea-600" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">مناسبات</h3>
              <p className="text-muted-foreground text-sm">لمة الأسبوع وإفطار رمضان السنوي</p>
            </Card>
            <Card className="p-6 text-center hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-tea-100 flex items-center justify-center">
                  <Users className="h-7 w-7 text-tea-600" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">أصحاب</h3>
              <p className="text-muted-foreground text-sm">أعضاء ورواد في مكان واحد</p>
            </Card>
            <Card className="p-6 text-center hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-tea-100 flex items-center justify-center">
                  <Award className="h-7 w-7 text-tea-600" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">أوسمة</h3>
              <p className="text-muted-foreground text-sm">وسام أحسن صانع شاي وغيره</p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
