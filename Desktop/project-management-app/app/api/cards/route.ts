import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher-server";
import { sendSlackCardNotification } from "@/lib/slack";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, listId, order, description, priority, dueDate } = body;

    if (!title || !listId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Verify the list belongs to a board owned by the user
    const list = await prisma.list.findFirst({
      where: {
        id: listId,
        board: {
          userId,
        },
      },
    });

    if (!list) {
      return new NextResponse("List not found", { status: 404 });
    }

    const card = await prisma.card.create({
      data: {
        title,
        listId,
        order: order ?? 0,
        description: description || null,
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });
// Send Slack notification
await sendSlackCardNotification({
  action: "created",
  cardTitle: card.title,
  userName: "User", // You can get from Clerk
  boardTitle: list.board.title || "Board",
  cardUrl: `${process.env.NEXTAUTH_URL}/board/${list.board.id}/card/${card.id}`,
});
    return NextResponse.json(card);
  } catch (error) {
    console.error("[CARDS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}