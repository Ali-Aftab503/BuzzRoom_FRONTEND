import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BoardContainer } from "@/components/kanban/BoardContainer";
import { notFound } from "next/navigation";

interface BoardPageProps {
  params: Promise<{
    boardId: string;
  }>;
}

export async function generateMetadata({ params }: BoardPageProps) {
  const { boardId } = await params;
  
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { title: true },
  });

  return {
    title: board?.title || "Board",
  };
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { userId } = await auth();
  const { boardId } = await params;

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch the board with all its lists and cards
  const board = await prisma.board.findUnique({
    where: {
      id: boardId,
      userId, // Ensure the board belongs to the current user
    },
    include: {
      lists: {
        orderBy: {
          order: "asc",
        },
        include: {
          cards: {
            orderBy: {
              order: "asc",
            },
          },
        },
      },
    },
  });

  if (!board) {
    notFound();
  }

  return (
    <div className="h-full">
      <BoardContainer board={board} />
    </div>
  );
}