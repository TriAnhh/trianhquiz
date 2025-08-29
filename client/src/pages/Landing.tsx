import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { GraduationCap, Users, BarChart3 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Admin Toggle Button */}
      <div className="fixed top-5 right-5 z-50">
        <Button variant="outline" asChild data-testid="button-admin-toggle">
          <a href="/api/login">
            <BarChart3 className="h-4 w-4 mr-2" />
            Quản trị
          </a>
        </Button>
      </div>

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="text-primary text-4xl" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
              Hệ thống Trắc nghiệm ABCD
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Nền tảng trắc nghiệm trực tiếp cho học sinh với thống kê theo thời gian thực
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="text-primary text-2xl" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Giao diện đơn giản</h3>
                <p className="text-muted-foreground">
                  Chỉ cần nhập tên và chọn A, B, C, hoặc D
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="text-secondary text-2xl" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Hỗ trợ nhiều học sinh</h3>
                <p className="text-muted-foreground">
                  Lên đến 40 học sinh cùng tham gia một lúc
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="text-accent text-2xl" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Thống kê trực tiếp</h3>
                <p className="text-muted-foreground">
                  Xem kết quả ngay lập tức theo thời gian thực
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <Button size="lg" asChild data-testid="button-start-quiz">
              <Link href="/quiz">
                <GraduationCap className="h-5 w-5 mr-2" />
                Bắt đầu làm bài
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              <Users className="h-4 w-4 inline mr-1" />
              Sẵn sàng cho việc học tập hiệu quả
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
