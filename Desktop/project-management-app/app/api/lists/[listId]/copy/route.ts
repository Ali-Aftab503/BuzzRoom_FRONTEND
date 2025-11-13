import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher-server";

interface RouteParams {
  params: Promise<{
    listId: string;
  }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { listId } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch the list with all its cards
    const listToCopy = await prisma.list.findUnique({
      where: { id: listId },
      include: {
        board: true,
        cards: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!listToCopy) {
      return new NextResponse("List not found", { status: 404 });
    }

    // Check ownership
    if (listToCopy.board.userId !== userId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Get the last list order
    const lastList = await prisma.list.findFirst({
      where: {
        boardId: listToCopy.boardId,
      },
      orderBy: {
        order: "desc",
      },
      select: {
        order: true,
      },
    });

    const newOrder = lastList ? lastList.order + 1 : 0;

    // Create the new list with copied cards
    const newList = await prisma.list.create({
      data: {
        title: `${listToCopy.title} (Copy)`,
        boardId: listToCopy.boardId,
        order: newOrder,
        cards: {
          create: listToCopy.cards.map((card, index) => ({
            title: card.title,
            description: card.description,
            order: index,
            priority: card.priority,
            dueDate: card.dueDate,
          })),
        },
      },
      include: {
        cards: true,
      },
    });

    // Trigger Pusher event
    await pusherServer.trigger(
      `private-board-${listToCopy.boardId}`,
      "list-copied",
      {
        list: newList,
        userId,
      }
    );

    return NextResponse.json(newList);
  } catch (error) {
    console.error("[LIST_COPY]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}