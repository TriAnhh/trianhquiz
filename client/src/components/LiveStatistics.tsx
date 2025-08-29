import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart3, X, RefreshCw } from "lucide-react";

interface LiveStatisticsProps {
  isOpen: boolean;
  onClose: () => void;
  stats: any;
}

export default function LiveStatistics({ isOpen, onClose, stats }: LiveStatisticsProps) {
  if (!stats) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <BarChart3 className="h-6 w-6 text-accent mr-2" />
              Thống kê trực tiếp
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Chưa có dữ liệu thống kê</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart3 className="h-6 w-6 text-accent mr-2" />
              Thống kê trực tiếp
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-statistics">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Live Answer Distribution */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { option: 'A', color: 'primary', count: stats.A || 0 },
            { option: 'B', color: 'secondary', count: stats.B || 0 },
            { option: 'C', color: 'accent', count: stats.C || 0 },
            { option: 'D', color: 'destructive', count: stats.D || 0 },
          ].map(({ option, color, count }) => (
            <div key={option} className="text-center">
              <div className={`bg-${color}/10 border border-${color}/20 rounded-lg p-4 mb-2`}>
                <div className={`text-2xl font-bold text-${color} mb-1`} data-testid={`text-live-option-${option.toLowerCase()}`}>
                  {count}
                </div>
                <div className="text-xs text-muted-foreground">lượt chọn</div>
              </div>
              <div className={`w-10 h-10 bg-${color} text-${color}-foreground rounded-full flex items-center justify-center font-bold mx-auto`}>
                {option}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 inline mr-1" />
          Thống kê được cập nhật theo thời gian thực
        </div>
      </DialogContent>
    </Dialog>
  );
}
