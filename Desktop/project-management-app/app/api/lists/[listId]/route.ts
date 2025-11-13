import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher-server";

interface RouteParams {
  params: Promise<{
    listId: string;
  }>;
}

// DELETE a list
// DELETE a list
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { listId } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch the list with board info
    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: {
        board: true,
      },
    });

    if (!list) {
      return new NextResponse("List not found", { status: 404 });
    }

    // Check ownership
    if (list.board.userId !== userId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const boardId = list.board.id;

    // Delete the list
    await prisma.list.delete({
      where: { id: listId },
    });

    // Trigger Pusher event
    await pusherServer.trigger(`private-board-${boardId}`, "list-deleted", {
      listId,
      userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LIST_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}