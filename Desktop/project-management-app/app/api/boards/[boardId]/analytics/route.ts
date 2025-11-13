import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateBoardMetrics, calculateUserWorkload } from "@/lib/workload-calculator";

interface RouteParams {
  params: Promise<{
    boardId: string;
  }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { boardId } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify board access
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        OR: [
          { userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        members: true,
      },
    });

    if (!board) {
      return new NextResponse("Board not found", { status: 404 });
    }

    // Calculate board metrics
    const boardMetrics = await calculateBoardMetrics(boardId);

    // Calculate workload for each member
    const memberIds = [
      board.userId,
      ...board.members.map((m) => m.userId),
    ];
    const uniqueMemberIds = [...new Set(memberIds)];

    const workloads = await Promise.all(
      uniqueMemberIds.map((uid) => calculateUserWorkload(uid, boardId))
    );

    // Get historical data (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const historicalReports = await prisma.boardReport.findMany({
      where: {
        boardId,
        reportDate: { gte: thirtyDaysAgo },
      },
      orderBy: { reportDate: "asc" },
    });

    return NextResponse.json({
      boardMetrics,
      workloads,
      historicalReports,
    });
  } catch (error) {
    console.error("[BOARD_ANALYTICS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}