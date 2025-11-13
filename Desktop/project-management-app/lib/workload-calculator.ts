import { prisma } from "./prisma";

export interface UserWorkload {
  userId: string;
  userName: string;
  totalCards: number;
  completedCards: number;
  inProgressCards: number;
  overdueCards: number;
  upcomingCards: number;
  estimatedHours: number;
  workloadScore: number; // 0-100
}

export interface BoardMetrics {
  totalLists: number;
  totalCards: number;
  completedCards: number;
  inProgressCards: number;
  overdueCards: number;
  cardsCreatedToday: number;
  cardsCompletedToday: number;
  activeMembers: number;
  averageCardAge: number;
  velocityScore: number;
  priorityDistribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    URGENT: number;
  };
  completionRate: number;
}

export async function calculateUserWorkload(
  userId: string,
  boardId: string
): Promise<UserWorkload> {
  // Get all cards assigned to user
  const assignedCards = await prisma.cardAssignee.findMany({
    where: {
      userId,
      card: {
        list: {
          boardId,
        },
      },
    },
    include: {
      card: {
        include: {
          list: true,
        },
      },
    },
  });

  const cards = assignedCards.map((a) => a.card);
  const now = new Date();

  const totalCards = cards.length;
  const completedCards = cards.filter((c) => c.completedAt).length;
  const inProgressCards = cards.filter(
    (c) => !c.completedAt && c.list.title.toLowerCase().includes("progress")
  ).length;
  const overdueCards = cards.filter(
    (c) => !c.completedAt && c.dueDate && new Date(c.dueDate) < now
  ).length;
  const upcomingCards = cards.filter(
    (c) =>
      !c.completedAt &&
      c.dueDate &&
      new Date(c.dueDate) > now &&
      new Date(c.dueDate) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  ).length;

  const estimatedHours = cards
    .filter((c) => !c.completedAt)
    .reduce((sum, c) => sum + (c.estimatedHours || 0), 0);

  // Calculate workload score (0-100)
  // Factors: number of cards, overdue cards, estimated hours
  const cardLoad = Math.min((totalCards / 10) * 30, 30);
  const overdueLoad = Math.min((overdueCards / 5) * 40, 40);
  const hoursLoad = Math.min((estimatedHours / 40) * 30, 30);
  const workloadScore = Math.round(cardLoad + overdueLoad + hoursLoad);

  return {
    userId,
    userName: assignedCards[0]?.userName || "Unknown",
    totalCards,
    completedCards,
    inProgressCards,
    overdueCards,
    upcomingCards,
    estimatedHours,
    workloadScore,
  };
}

export async function calculateBoardMetrics(
  boardId: string
): Promise<BoardMetrics> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      lists: {
        include: {
          cards: {
            include: {
              assignees: true,
            },
          },
        },
      },
      members: true,
    },
  });

  if (!board) {
    throw new Error("Board not found");
  }

  const now = new Date();
  const today = new Date(now.setHours(0, 0, 0, 0));

  const allCards = board.lists.flatMap((list) => list.cards);
  const totalLists = board.lists.length;
  const totalCards = allCards.length;
  const completedCards = allCards.filter((c) => c.completedAt).length;
  const inProgressCards = allCards.filter(
    (c) =>
      !c.completedAt &&
      board.lists
        .find((l) => l.id === c.listId)
        ?.title.toLowerCase()
        .includes("progress")
  ).length;
  const overdueCards = allCards.filter(
    (c) => !c.completedAt && c.dueDate && new Date(c.dueDate) < now
  ).length;

  const cardsCreatedToday = allCards.filter(
    (c) => new Date(c.createdAt) >= today
  ).length;
  const cardsCompletedToday = allCards.filter(
    (c) => c.completedAt && new Date(c.completedAt) >= today
  ).length;

  const uniqueAssignees = new Set(
    allCards.flatMap((c) => c.assignees.map((a) => a.userId))
  );
  const activeMembers = uniqueAssignees.size;

  // Calculate average card age (in days)
  const cardAges = allCards
    .filter((c) => !c.completedAt)
    .map((c) => (now.getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const averageCardAge =
    cardAges.length > 0
      ? cardAges.reduce((sum, age) => sum + age, 0) / cardAges.length
      : 0;

  // Calculate velocity (cards completed per week)
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const cardsCompletedThisWeek = allCards.filter(
    (c) => c.completedAt && new Date(c.completedAt) >= oneWeekAgo
  ).length;
  const velocityScore = cardsCompletedThisWeek;

  // Priority distribution
  const priorityDistribution = {
    LOW: allCards.filter((c) => c.priority === "LOW").length,
    MEDIUM: allCards.filter((c) => c.priority === "MEDIUM").length,
    HIGH: allCards.filter((c) => c.priority === "HIGH").length,
    URGENT: allCards.filter((c) => c.priority === "URGENT").length,
  };

  const completionRate = totalCards > 0 ? (completedCards / totalCards) * 100 : 0;

  return {
    totalLists,
    totalCards,
    completedCards,
    inProgressCards,
    overdueCards,
    cardsCreatedToday,
    cardsCompletedToday,
    activeMembers,
    averageCardAge,
    velocityScore,
    priorityDistribution,
    completionRate,
  };
}

export async function generateBoardReport(boardId: string) {
  const metrics = await calculateBoardMetrics(boardId);

  const report = await prisma.boardReport.create({
    data: {
      boardId,
      totalLists: metrics.totalLists,
      totalCards: metrics.totalCards,
      completedCards: metrics.completedCards,
      inProgressCards: metrics.inProgressCards,
      overdueCards: metrics.overdueCards,
      cardsCreatedToday: metrics.cardsCreatedToday,
      cardsCompletedToday: metrics.cardsCompletedToday,
      activeMembers: metrics.activeMembers,
      averageCardAge: metrics.averageCardAge,
      velocityScore: metrics.velocityScore,
      metrics: {
        priorityDistribution: metrics.priorityDistribution,
        completionRate: metrics.completionRate,
      },
    },
  });

  return report;
}