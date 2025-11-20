import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      console.error("[CARDS_POST] No userId");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    console.log("[CARDS_POST] Request body:", body);

    const { title, listId, order, description, priority, dueDate } = body;

    if (!title || !listId) {
      console.error("[CARDS_POST] Missing title or listId");
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
      include: {
        board: true,
      },
    });

    if (!list) {
      console.error("[CARDS_POST] List not found or unauthorized");
      return new NextResponse("List not found", { status: 404 });
    }

    console.log("[CARDS_POST] Creating card...");

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

    console.log("[CARDS_POST] Card created:", card.id);

    // Try Pusher (optional)
    try {
      const { pusherServer } = await import("@/lib/pusher-server");
      await pusherServer.trigger(
        `private-board-${list.board.id}`,
        "card-created",
        {
          card,
          userId,
        }
      );
      console.log("[CARDS_POST] Pusher event sent");
    } catch (pusherError) {
      console.error("[CARDS_POST] Pusher error:", pusherError);
      // Continue even if Pusher fails
    }

    // Try Slack (optional)
    try {
      const webhookUrl = process.env.SLACK_WEBHOOK_URL;
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `New card created: *${card.title}* in board *${list.board.title}*`,
            username: "TaskFlow Bot",
            icon_emoji: ":clipboard:",
          }),
        });
        console.log("[CARDS_POST] Slack notification sent");
      }
    } catch (slackError) {
      console.error("[CARDS_POST] Slack error:", slackError);
      // Continue even if Slack fails
    }

    console.log("[CARDS_POST] Success, returning card");
    return NextResponse.json(card);
  } catch (error) {
    console.error("[CARDS_POST] Error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Error", details: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}