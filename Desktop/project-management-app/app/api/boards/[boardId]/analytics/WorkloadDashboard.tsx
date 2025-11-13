"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  BarChart3,
} from "lucide-react";

interface WorkloadDashboardProps {
  boardId: string;
}

export function WorkloadDashboard({ boardId }: WorkloadDashboardProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch(`/api/boards/${boardId}/analytics`);
        if (!response.ok) throw new Error("Failed to fetch analytics");
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [boardId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load analytics</p>
      </div>
    );
  }

  const { boardMetrics, workloads } = analytics;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Cards"
          value={boardMetrics.totalCards}
          icon={<BarChart3 className="h-4 w-4" />}
          description={`${boardMetrics.completedCards} completed`}
        />
        <MetricCard
          title="Completion Rate"
          value={`${Math.round(boardMetrics.completionRate)}%`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          description="Overall progress"
        />
        <MetricCard
          title="Overdue Cards"
          value={boardMetrics.overdueCards}
          icon={<AlertCircle className="h-4 w-4" />}
          variant={boardMetrics.overdueCards > 0 ? "destructive" : "default"}
          description="Need attention"
        />
        <MetricCard
          title="Velocity"
          value={boardMetrics.velocityScore}
          icon={<TrendingUp className="h-4 w-4" />}
          description="Cards/week"
        />
      </div>

      {/* Team Workload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Workload
          </CardTitle>
          <CardDescription>
            Current workload distribution across team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {workloads.map((workload: any) => (
              <WorkloadItem key={workload.userId} workload={workload} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priority Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <PriorityBar
              label="Urgent"
              count={boardMetrics.priorityDistribution.URGENT}
              total={boardMetrics.totalCards}
              color="bg-red-600"
            />
            <PriorityBar
              label="High"
              count={boardMetrics.priorityDistribution.HIGH}
              total={boardMetrics.totalCards}
              color="bg-orange-600"
            />
            <PriorityBar
              label="Medium"
              count={boardMetrics.priorityDistribution.MEDIUM}
              total={boardMetrics.totalCards}
              color="bg-yellow-600"
            />
            <PriorityBar
              label="Low"
              count={boardMetrics.priorityDistribution.LOW}
              total={boardMetrics.totalCards}
              color="bg-blue-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Cards Created</span>
              <span className="font-semibold">
                {boardMetrics.cardsCreatedToday}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Cards Completed</span>
              <span className="font-semibold">
                {boardMetrics.cardsCompletedToday}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Active Members</span>
              <span className="font-semibold">{boardMetrics.activeMembers}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Average Card Age
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.round(boardMetrics.averageCardAge)}
            </div>
            <p className="text-sm text-muted-foreground">days</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  description,
  variant = "default",
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  variant?: "default" | "destructive";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-bold ${
            variant === "destructive" ? "text-red-600" : ""
          }`}
        >
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function WorkloadItem({ workload }: { workload: any }) {
  const getWorkloadColor = (score: number) => {
    if (score >= 75) return "text-red-600";
    if (score >= 50) return "text-yellow-600";
    return "text-green-600";
  };

  const getWorkloadBg = (score: number) => {
    if (score >= 75) return "bg-red-600";
    if (score >= 50) return "bg-yellow-600";
    return "bg-green-600";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {workload.userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{workload.userName}</p>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>{workload.totalCards} cards</span>
              {workload.overdueCards > 0 && (
                <span className="text-red-600">
                  {workload.overdueCards} overdue
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <Badge
            variant={workload.workloadScore >= 75 ? "destructive" : "secondary"}
          >
            {workload.workloadScore}/100
          </Badge>
          {workload.estimatedHours > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {workload.estimatedHours}h est.
            </p>
          )}
        </div>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getWorkloadBg(workload.workloadScore)} transition-all`}
          style={{ width: `${workload.workloadScore}%` }}
        />
      </div>
    </div>
  );
}

function PriorityBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold">
          {count} ({Math.round(percentage)}%)
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}