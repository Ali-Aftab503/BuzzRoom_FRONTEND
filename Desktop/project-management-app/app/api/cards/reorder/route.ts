import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher-server";

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { cards, boardId } = body;

    if (!cards || !Array.isArray(cards)) {
      return new NextResponse("Invalid cards data", { status: 400 });
    }

    // Update all cards in a transaction
    await prisma.$transaction(
      cards.map((card: { id: string; order: number; listId: string }) =>
        prisma.card.update({
          where: { id: card.id },
          data: {
            order: card.order,
            listId: card.listId,
          },
        })
      )
    );

    // Trigger Pusher event if boardId is provided
    if (boardId) {
      await pusherServer.trigger(`private-board-${boardId}`, "cards-reorder", {
        cards,
        userId, // Send userId so clients can ignore their own updates
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CARDS_REORDER]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}