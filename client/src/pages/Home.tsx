import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BarChart3, Users, Settings, LogOut } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Bảng điều khiển Quản trị</h1>
              <p className="text-muted-foreground">Quản lý bài trắc nghiệm và xem thống kê</p>
            </div>
            <Button variant="destructive" asChild data-testid="button-logout">
              <a href="/api/logout">
                <LogOut className="h-4 w-4 mr-2" />
                Đăng xuất
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Quản lý Quiz</h3>
                  <p className="text-sm text-muted-foreground">Tạo và điều khiển bài trắc nghiệm</p>
                </div>
              </div>
              <Button asChild className="w-full mt-4" data-testid="button-manage-quiz">
                <Link href="/admin">
                  Vào quản lý
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-secondary/10 p-3 rounded-full">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Giao diện Học sinh</h3>
                  <p className="text-sm text-muted-foreground">Xem giao diện từ góc độ học sinh</p>
                </div>
              </div>
              <Button variant="secondary" asChild className="w-full mt-4" data-testid="button-student-view">
                <Link href="/quiz">
                  Xem như học sinh
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-accent/10 p-3 rounded-full">
                  <Settings className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Cài đặt</h3>
                  <p className="text-sm text-muted-foreground">Cấu hình hệ thống</p>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" disabled data-testid="button-settings">
                Sắp có
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Thống kê nhanh</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary" data-testid="text-active-sessions">-</div>
                <div className="text-sm text-muted-foreground">Phiên hoạt động</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary" data-testid="text-active-students">-</div>
                <div className="text-sm text-muted-foreground">Học sinh online</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent" data-testid="text-total-answers">-</div>
                <div className="text-sm text-muted-foreground">Câu trả lời hôm nay</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive" data-testid="text-completion-rate">-</div>
                <div className="text-sm text-muted-foreground">Tỷ lệ hoàn thành</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
