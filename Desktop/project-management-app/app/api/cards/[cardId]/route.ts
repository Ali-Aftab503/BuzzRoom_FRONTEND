import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createActivity } from "@/lib/create-activity";
import { pusherServer } from "@/lib/pusher-server";

interface RouteParams {
  params: Promise<{
    cardId: string;
  }>;
}

// GET card details
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { cardId } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: {
            board: true,
          },
        },
        comments: {
          orderBy: {
            createdAt: "desc",
          },
        },
        attachments: {
          orderBy: {
            createdAt: "desc",
          },
        },
        activities: {
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
        },
      },
    });

    if (!card) {
      return new NextResponse("Card not found", { status: 404 });
    }

    // Check ownership
    if (card.list.board.userId !== userId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error("[CARD_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// PATCH card (update description, title, priority, dueDate)
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    const { cardId } = await params;

    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, description, priority, dueDate } = body;

    // Fetch the card with board info
    const existingCard = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: {
            board: true,
          },
        },
      },
    });

    if (!existingCard) {
      return new NextResponse("Card not found", { status: 404 });
    }

    // Check ownership
    if (existingCard.list.board.userId !== userId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const boardId = existingCard.list.board.id;

    // Update the card
    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: {
        title: title !== undefined ? title : existingCard.title,
        description: description !== undefined ? description : existingCard.description,
        priority: priority !== undefined ? priority : existingCard.priority,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existingCard.dueDate,
      },
    });

    // Create activity log
    await createActivity({
      action: "UPDATED",
      entityId: cardId,
      entityType: "CARD",
      userId,
      userName: user.firstName || user.emailAddresses[0].emailAddress,
      userImage: user.imageUrl,
      boardId,
      cardId,
      metadata: {
        changes: {
          title: title !== undefined,
          description: description !== undefined,
          priority: priority !== undefined,
          dueDate: dueDate !== undefined,
        },
      },
    });

    // Trigger Pusher event
    await pusherServer.trigger(`private-board-${boardId}`, "card-updated", {
      card: updatedCard,
      userId,
    });

    return NextResponse.json(updatedCard);
  } catch (error) {
    console.error("[CARD_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE card
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    const { cardId } = await params;

    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: {
            board: true,
          },
        },
      },
    });

    if (!card) {
      return new NextResponse("Card not found", { status: 404 });
    }

    if (card.list.board.userId !== userId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const boardId = card.list.board.id;

    await prisma.card.delete({
      where: { id: cardId },
    });

    // Create activity log
    await createActivity({
      action: "DELETED",
      entityId: cardId,
      entityType: "CARD",
      userId,
      userName: user.firstName || user.emailAddresses[0].emailAddress,
      userImage: user.imageUrl,
      boardId,
      metadata: { title: card.title },
    });

    // Trigger Pusher event
    await pusherServer.trigger(`private-board-${boardId}`, "card-deleted", {
      cardId,
      userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CARD_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}