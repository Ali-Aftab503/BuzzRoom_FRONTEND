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

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    const { cardId } = await params;

    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, url, size, type } = body;

    if (!name || !url) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Verify card exists and user has access
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

    // Create the attachment
    const attachment = await prisma.attachment.create({
      data: {
        name,
        url,
        size: size || 0,
        type: type || "unknown",
        cardId,
        userId,
      },
    });

    // Create activity log
    await createActivity({
      action: "ATTACHMENT_ADDED",
      entityId: cardId,
      entityType: "CARD",
      userId,
      userName: user.firstName || user.emailAddresses[0].emailAddress,
      userImage: user.imageUrl,
      boardId,
      cardId,
      metadata: { fileName: name },
    });

    // Trigger Pusher event
    await pusherServer.trigger(`private-board-${boardId}`, "attachment-added", {
      attachment,
      cardId,
      userId,
    });

    return NextResponse.json(attachment);
  } catch (error) {
    console.error("[ATTACHMENTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}