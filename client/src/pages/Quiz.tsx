import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import StudentLogin from "@/components/StudentLogin";
import QuizInterface from "@/components/QuizInterface";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export default function Quiz() {
  const [currentStudent, setCurrentStudent] = useState<{id: string, name: string} | null>(null);
  
  const { data: currentSession } = useQuery({
    queryKey: ["/api/quiz-sessions/current"],
    refetchInterval: 5000, // Poll every 5 seconds
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Toggle Button */}
      <div className="fixed top-5 right-5 z-50">
        <Button variant="outline" asChild data-testid="button-admin-access">
          <a href="/api/login">
            <Settings className="h-4 w-4 mr-2" />
            Quản trị
          </a>
        </Button>
      </div>

      {!currentStudent ? (
        <StudentLogin onStudentLogin={setCurrentStudent} />
      ) : (
        <QuizInterface 
          student={currentStudent} 
          session={currentSession}
          onLogout={() => setCurrentStudent(null)}
        />
      )}
    </div>
  );
}
