import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WorkloadDashboard } from "@/components/analytics/WorkloadDashboard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface AnalyticsPageProps {
  params: Promise<{
    boardId: string;
  }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { userId } = await auth();
  const { boardId } = await params;

  if (!userId) {
    redirect("/sign-in");
  }

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { title: true },
  });

  if (!board) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href={`/board/${boardId}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Board
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold">{board.title} - Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Real-time workload visibility and project reporting
            </p>
          </div>
        </div>

        <WorkloadDashboard boardId={boardId} />
      </div>
    </div>
  );
}