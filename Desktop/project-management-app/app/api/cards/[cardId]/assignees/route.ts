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

// GET assignees for a card
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { cardId } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const assignees = await prisma.cardAssignee.findMany({
      where: { cardId },
      orderBy: { assignedAt: "asc" },
    });

    return NextResponse.json(assignees);
  } catch (error) {
    console.error("[CARD_ASSIGNEES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST assign a member to a card
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    const { cardId } = await params;

    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { assigneeUserId, assigneeUserName, assigneeUserEmail, assigneeUserImage } = body;

    if (!assigneeUserId) {
      return new NextResponse("Assignee user ID is required", { status: 400 });
    }

    // Verify card exists and get board ID
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

    const boardId = card.list.board.id;

    // Check if already assigned
    const existing = await prisma.cardAssignee.findUnique({
      where: {
        cardId_userId: {
          cardId,
          userId: assigneeUserId,
        },
      },
    });

    if (existing) {
      return new NextResponse("Already assigned", { status: 400 });
    }

    // Create assignee
    const assignee = await prisma.cardAssignee.create({
      data: {
        cardId,
        userId: assigneeUserId,
        userName: assigneeUserName,
        userEmail: assigneeUserEmail,
        userImage: assigneeUserImage || null,
      },
    });

    // Create activity
    await createActivity({
      action: "UPDATED",
      entityId: cardId,
      entityType: "CARD",
      userId,
      userName: user.firstName || user.emailAddresses[0].emailAddress,
      userImage: user.imageUrl,
      boardId,
      cardId,
      metadata: { assignedTo: assigneeUserName },
    });

    // Trigger Pusher
    await pusherServer.trigger(`private-board-${boardId}`, "card-updated", {
      cardId,
      userId,
    });

    return NextResponse.json(assignee);
  } catch (error) {
    console.error("[CARD_ASSIGNEES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE remove assignee
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { cardId } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const assigneeUserId = searchParams.get("userId");

    if (!assigneeUserId) {
      return new NextResponse("Assignee user ID is required", { status: 400 });
    }

    await prisma.cardAssignee.delete({
      where: {
        cardId_userId: {
          cardId,
          userId: assigneeUserId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CARD_ASSIGNEES_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}