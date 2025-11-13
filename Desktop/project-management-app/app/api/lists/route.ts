import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher-server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, boardId, order } = body;

    if (!title || !boardId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Verify the board belongs to the user
    const board = await prisma.board.findUnique({
      where: { id: boardId, userId },
    });

    if (!board) {
      return new NextResponse("Board not found", { status: 404 });
    }

    const list = await prisma.list.create({
      data: {
        title,
        boardId,
        order: order ?? 0,
      },
    });

    // Trigger Pusher event
    await pusherServer.trigger(`private-board-${boardId}`, "list-created", {
      list,
      userId,
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error("[LISTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}