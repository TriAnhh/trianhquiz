import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/useWebSocket";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Clock, 
  Play, 
  Square, 
  Users, 
  BarChart3, 
  RefreshCw, 
  Download,
  ArrowRight,
  LogOut,
  Home
} from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const [quizDuration, setQuizDuration] = useState(5);
  const [questionNumber, setQuestionNumber] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { sendMessage } = useWebSocket({
    onMessage: (data: any) => {
      if (data.type === 'answer_submitted') {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/quiz-sessions", data.sessionId, "questions", data.questionNumber, "stats"] 
        });
      }
    }
  });

  const { data: currentSession } = useQuery<any>({
    queryKey: ["/api/quiz-sessions/current"],
    refetchInterval: 5000,
  });

  const { data: activeStudents } = useQuery<any[]>({
    queryKey: ["/api/students/active"],
    refetchInterval: 3000,
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/quiz-sessions", currentSession?.id, "questions", currentSession?.currentQuestionNumber, "stats"],
    enabled: !!currentSession?.id && !!currentSession?.currentQuestionNumber,
    refetchInterval: 2000,
  });

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/quiz-sessions", {
        title: "Quiz Session",
        duration: quizDuration,
      });
      return response.json();
    },
    onSuccess: (session) => {
      toast({
        title: "Tạo phiên thành công",
        description: "Đã tạo phiên trắc nghiệm mới",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-sessions/current"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Lỗi tạo phiên",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startQuizMutation = useMutation({
    mutationFn: async () => {
      if (!currentSession) {
        await createSessionMutation.mutateAsync();
        const newSession = queryClient.getQueryData(["/api/quiz-sessions/current"]);
        if (newSession) {
          const response = await apiRequest("POST", `/api/quiz-sessions/${(newSession as any).id}/start`);
          return response.json();
        }
      } else {
        const response = await apiRequest("POST", `/api/quiz-sessions/${currentSession.id}/start`);
        return response.json();
      }
    },
    onSuccess: () => {
      sendMessage({ type: 'quiz_started' });
      toast({
        title: "Bài trắc nghiệm đã bắt đầu",
        description: "Học sinh có thể bắt đầu làm bài",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-sessions/current"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Lỗi bắt đầu quiz",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const stopQuizMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/quiz-sessions/${currentSession.id}/stop`);
      return response.json();
    },
    onSuccess: () => {
      sendMessage({ type: 'quiz_stopped' });
      toast({
        title: "Bài trắc nghiệm đã dừng",
        description: "Học sinh không thể làm bài nữa",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-sessions/current"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Lỗi dừng quiz",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (newQuestionNumber: number) => {
      const response = await apiRequest("PATCH", `/api/quiz-sessions/${currentSession.id}`, {
        currentQuestionNumber: newQuestionNumber,
      });
      return response.json();
    },
    onSuccess: () => {
      sendMessage({ 
        type: 'question_changed', 
        questionNumber: questionNumber 
      });
      toast({
        title: "Đã chuyển câu hỏi",
        description: `Chuyển sang câu hỏi số ${questionNumber}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-sessions/current"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Lỗi chuyển câu hỏi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calculatePercentages = (stats: any) => {
    if (!stats || stats.total === 0) return { A: 0, B: 0, C: 0, D: 0 };
    
    return {
      A: ((stats.A / stats.total) * 100).toFixed(1),
      B: ((stats.B / stats.total) * 100).toFixed(1),
      C: ((stats.C / stats.total) * 100).toFixed(1),
      D: ((stats.D / stats.total) * 100).toFixed(1),
    };
  };

  const percentages = calculatePercentages(stats);

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
            <div className="flex gap-2">
              <Button variant="outline" asChild data-testid="button-home">
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Trang chủ
                </Link>
              </Button>
              <Button variant="destructive" asChild data-testid="button-logout-admin">
                <a href="/api/logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Đăng xuất
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        
        {/* Quiz Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Timer Control */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                <Clock className="h-5 w-5 text-accent inline mr-2" />
                Điều khiển Thời gian
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="quizDuration" className="text-sm font-medium text-foreground">
                    Thời gian (phút)
                  </Label>
                  <Input
                    id="quizDuration"
                    type="number"
                    min="1"
                    max="60"
                    value={quizDuration}
                    onChange={(e) => setQuizDuration(parseInt(e.target.value))}
                    className="mt-1"
                    data-testid="input-quiz-duration"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => startQuizMutation.mutate()}
                    disabled={startQuizMutation.isPending || currentSession?.isActive}
                    data-testid="button-start-quiz"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Bắt đầu
                  </Button>
                  <Button 
                    variant="destructive"
                    className="flex-1"
                    onClick={() => stopQuizMutation.mutate()}
                    disabled={stopQuizMutation.isPending || !currentSession?.isActive}
                    data-testid="button-stop-quiz"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Dừng
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Control */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                <BarChart3 className="h-5 w-5 text-primary inline mr-2" />
                Câu hỏi hiện tại
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="questionNumber" className="text-sm font-medium text-foreground">
                    Số câu hỏi
                  </Label>
                  <Input
                    id="questionNumber"
                    type="number"
                    min="1"
                    value={questionNumber}
                    onChange={(e) => setQuestionNumber(parseInt(e.target.value))}
                    className="mt-1"
                    data-testid="input-question-number"
                  />
                </div>
                
                <Button 
                  className="w-full"
                  variant="secondary"
                  onClick={() => updateQuestionMutation.mutate(questionNumber)}
                  disabled={updateQuestionMutation.isPending || !currentSession}
                  data-testid="button-next-question"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Câu tiếp theo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Live Status */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                <Users className="h-5 w-5 text-secondary inline mr-2" />
                Trạng thái trực tiếp
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Học sinh online:</span>
                  <span className="font-semibold text-foreground" data-testid="text-active-students">
                    {activeStudents?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Đã trả lời:</span>
                  <span className="font-semibold text-foreground" data-testid="text-answered-students">
                    {stats?.total || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Trạng thái:</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    currentSession?.isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-muted text-muted-foreground'
                  }`} data-testid="text-quiz-status">
                    {currentSession?.isActive ? 'Đang diễn ra' : 'Chưa bắt đầu'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Statistics */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-foreground">
                <BarChart3 className="h-6 w-6 text-accent inline mr-2" />
                Thống kê câu trả lời trực tiếp
              </h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => queryClient.invalidateQueries()}
                  data-testid="button-refresh-stats"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Làm mới
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => toast({ title: "Xuất dữ liệu", description: "Tính năng sắp có!" })}
                  data-testid="button-export-stats"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Xuất dữ liệu
                </Button>
              </div>
            </div>

            {/* Answer Distribution Chart */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[
                { option: 'A', color: 'primary', count: stats?.A || 0 },
                { option: 'B', color: 'secondary', count: stats?.B || 0 },
                { option: 'C', color: 'accent', count: stats?.C || 0 },
                { option: 'D', color: 'destructive', count: stats?.D || 0 },
              ].map(({ option, color, count }) => (
                <div key={option} className="text-center">
                  <div className={`bg-${color}/10 border border-${color}/20 rounded-lg p-4 mb-2`}>
                    <div className={`text-3xl font-bold text-${color} mb-1`} data-testid={`text-option-${option.toLowerCase()}-count`}>
                      {count}
                    </div>
                    <div className="text-sm text-muted-foreground">người chọn</div>
                  </div>
                  <div className={`w-12 h-12 bg-${color} text-${color}-foreground rounded-full flex items-center justify-center font-bold text-lg mx-auto`}>
                    {option}
                  </div>
                </div>
              ))}
            </div>

            {/* Percentage Bars */}
            <div className="space-y-3">
              {[
                { option: 'A', color: 'primary', percent: percentages.A },
                { option: 'B', color: 'secondary', percent: percentages.B },
                { option: 'C', color: 'accent', percent: percentages.C },
                { option: 'D', color: 'destructive', percent: percentages.D },
              ].map(({ option, color, percent }) => (
                <div key={option} className="flex items-center gap-4">
                  <div className={`w-8 h-8 bg-${color} text-${color}-foreground rounded flex items-center justify-center font-bold text-sm`}>
                    {option}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Đáp án {option}</span>
                      <span className={`text-sm font-medium text-${color}`} data-testid={`text-option-${option.toLowerCase()}-percent`}>
                        {percent}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`bg-${color} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
