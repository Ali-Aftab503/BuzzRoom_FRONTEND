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
    const { lists, boardId } = body;

    if (!lists || !Array.isArray(lists)) {
      return new NextResponse("Invalid lists data", { status: 400 });
    }

    // Update all lists in a transaction
    await prisma.$transaction(
      lists.map((list: { id: string; order: number }) =>
        prisma.list.update({
          where: { id: list.id },
          data: {
            order: list.order,
          },
        })
      )
    );

    // Trigger Pusher event if boardId is provided
    if (boardId) {
      await pusherServer.trigger(`private-board-${boardId}`, "lists-reorder", {
        lists,
        userId, // Send userId so clients can ignore their own updates
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LISTS_REORDER]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}