import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/useWebSocket";
import LiveStatistics from "./LiveStatistics";
import { Check, BarChart3, LogOut, Clock } from "lucide-react";

interface QuizInterfaceProps {
  student: {id: string, name: string};
  session: any;
  onLogout: () => void;
}

export default function QuizInterface({ student, session, onLogout }: QuizInterfaceProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { sendMessage } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'quiz_started' || data.type === 'quiz_stopped' || data.type === 'question_changed') {
        queryClient.invalidateQueries({ queryKey: ["/api/quiz-sessions/current"] });
      }
    }
  });

  // Timer effect
  useEffect(() => {
    if (!session?.isActive || !session?.startTime) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const startTime = new Date(session.startTime).getTime();
      const duration = session.duration * 60 * 1000; // Convert to milliseconds
      const elapsed = now - startTime;
      const remaining = Math.max(0, duration - elapsed);

      setTimeRemaining(Math.floor(remaining / 1000));

      if (remaining <= 0) {
        clearInterval(interval);
        toast({
          title: "Hết thời gian",
          description: "Bài trắc nghiệm đã kết thúc!",
          variant: "destructive",
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, toast]);

  const { data: stats } = useQuery({
    queryKey: ["/api/quiz-sessions", session?.id, "questions", session?.currentQuestionNumber, "stats"],
    enabled: !!session?.id && !!session?.currentQuestionNumber,
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async (answer: string) => {
      const response = await apiRequest("POST", "/api/answers", {
        studentId: student.id,
        quizSessionId: session.id,
        questionNumber: session.currentQuestionNumber,
        selectedOption: answer,
      });
      return response.json();
    },
    onSuccess: () => {
      sendMessage({
        type: 'answer_submitted',
        studentId: student.id,
        sessionId: session.id,
        questionNumber: session.currentQuestionNumber,
        answer: selectedAnswer
      });
      toast({
        title: "Đã gửi câu trả lời",
        description: `Bạn đã chọn đáp án ${selectedAnswer}`,
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/quiz-sessions", session?.id, "questions", session?.currentQuestionNumber, "stats"] 
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi gửi câu trả lời",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAnswerSelect = (answer: string) => {
    if (!session?.isActive) {
      toast({
        title: "Bài trắc nghiệm chưa bắt đầu",
        description: "Vui lòng chờ giáo viên bắt đầu bài thi",
        variant: "destructive",
      });
      return;
    }

    setSelectedAnswer(answer);
    submitAnswerMutation.mutate(answer);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = session?.duration ? 
    Math.max(0, (timeRemaining / (session.duration * 60)) * 100) : 0;

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Chưa có bài trắc nghiệm</h2>
            <p className="text-muted-foreground mb-4">Vui lòng chờ giáo viên tạo bài trắc nghiệm</p>
            <Button variant="outline" onClick={onLogout} data-testid="button-logout-student">
              <LogOut className="h-4 w-4 mr-2" />
              Thoát
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header with Timer */}
        <Card className="shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Chào <span className="text-primary">{student.name}</span>
                </h2>
                <p className="text-muted-foreground">Câu hỏi trắc nghiệm ABCD</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent" data-testid="text-countdown-timer">
                  <Clock className="h-6 w-6 inline mr-2" />
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-sm text-muted-foreground">Thời gian còn lại</div>
              </div>
              <Button variant="outline" onClick={onLogout} data-testid="button-logout-student">
                <LogOut className="h-4 w-4 mr-2" />
                Thoát
              </Button>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4 bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Question Section */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-foreground mb-4">
                Câu hỏi số <span className="text-primary">{session.currentQuestionNumber}</span>
              </h3>
              <p className="text-lg text-muted-foreground">Chọn một đáp án A, B, C hoặc D</p>
              
              {!session.isActive && (
                <div className="mt-4 p-4 bg-muted/50 border border-border rounded-lg">
                  <p className="text-muted-foreground">
                    Bài trắc nghiệm chưa bắt đầu. Vui lòng chờ giáo viên.
                  </p>
                </div>
              )}
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {['A', 'B', 'C', 'D'].map((option, index) => {
                const colors = ['primary', 'secondary', 'accent', 'destructive'];
                const color = colors[index];
                const isSelected = selectedAnswer === option;
                
                return (
                  <Button
                    key={option}
                    variant={isSelected ? "default" : "outline"}
                    size="lg"
                    className={`h-auto p-6 justify-start transition-all hover:scale-105 ${
                      isSelected 
                        ? `bg-${color} text-${color}-foreground border-${color}` 
                        : `hover:bg-${color}/10 border-2 hover:border-${color}/50`
                    }`}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={submitAnswerMutation.isPending || !session.isActive}
                    data-testid={`button-answer-${option.toLowerCase()}`}
                  >
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mr-4 ${
                        isSelected 
                          ? `bg-${color}-foreground text-${color}` 
                          : `bg-${color}/10 text-${color}`
                      }`}>
                        {option}
                      </div>
                      <span className="text-lg font-medium">Đáp án {option}</span>
                    </div>
                  </Button>
                );
              })}
            </div>

            {/* Selected Answer Display */}
            {selectedAnswer && (
              <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
                <p className="text-primary font-medium">
                  <Check className="h-4 w-4 inline mr-2" />
                  Bạn đã chọn đáp án: <span className="font-bold text-lg">{selectedAnswer}</span>
                </p>
              </div>
            )}

            {/* Live Statistics Button */}
            <div className="mt-8 text-center">
              <Button 
                variant="secondary"
                onClick={() => setShowStats(true)}
                data-testid="button-view-statistics"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Xem thống kê trực tiếp
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Statistics Modal */}
      <LiveStatistics 
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        stats={stats}
      />
    </div>
  );
}
