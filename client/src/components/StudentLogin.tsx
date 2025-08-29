import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { GraduationCap, ArrowRight, Users } from "lucide-react";

interface StudentLoginProps {
  onStudentLogin: (student: {id: string, name: string}) => void;
}

export default function StudentLogin({ onStudentLogin }: StudentLoginProps) {
  const [name, setName] = useState("");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (studentName: string) => {
      const response = await apiRequest("POST", "/api/students", {
        name: studentName.trim(),
      });
      return response.json();
    },
    onSuccess: (student) => {
      onStudentLogin(student);
      toast({
        title: "Đăng nhập thành công",
        description: `Chào mừng ${student.name}!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi đăng nhập",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      loginMutation.mutate(name);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="text-primary text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Hệ thống Trắc nghiệm</h1>
            <p className="text-muted-foreground">Vui lòng nhập tên để bắt đầu làm bài</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="studentName" className="block text-sm font-medium text-foreground mb-2">
                Họ và tên <span className="text-destructive">*</span>
              </Label>
              <Input
                id="studentName"
                type="text"
                required
                placeholder="Nhập họ và tên của bạn..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
                data-testid="input-student-name"
              />
            </div>
            
            <Button 
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending || !name.trim()}
              data-testid="button-enter-quiz"
            >
              {loginMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"></div>
                  Đang vào...
                </div>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Vào làm bài
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 inline mr-1" />
            Sẵn sàng cho bài trắc nghiệm
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
