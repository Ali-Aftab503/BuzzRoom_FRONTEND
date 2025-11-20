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
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const resolvedParams = await params;
    const listId = resolvedParams.listId;

    console.log("[LIST_DELETE] userId:", userId);
    console.log("[LIST_DELETE] listId:", listId);

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

    console.log("[LIST_DELETE] Found list:", list?.id);

    if (!list) {
      console.error("[LIST_DELETE] List not found");
      return new NextResponse("List not found", { status: 404 });
    }

    // Check ownership
    if (list.board.userId !== userId) {
      console.error("[LIST_DELETE] Unauthorized - wrong user");
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const boardId = list.board.id;

    // Delete the list (this will cascade delete all cards)
    await prisma.list.delete({
      where: { id: listId },
    });

    console.log("[LIST_DELETE] List deleted successfully");

    // Trigger Pusher event
    try {
      await pusherServer.trigger(`private-board-${boardId}`, "list-deleted", {
        listId,
        userId,
      });
    } catch (pusherError) {
      console.error("[LIST_DELETE] Pusher error:", pusherError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LIST_DELETE] Error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Error", details: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}