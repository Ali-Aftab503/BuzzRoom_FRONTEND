import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{
    boardId: string;
  }>;
}

// GET all members of a board
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { boardId } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const members = await prisma.boardMember.findMany({
      where: { boardId },
      orderBy: { addedAt: "asc" },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("[BOARD_MEMBERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST add a member to a board
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    const { boardId } = await params;

    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { userEmail, role } = body;

    if (!userEmail) {
      return new NextResponse("Email is required", { status: 400 });
    }

    // Verify board ownership
    const board = await prisma.board.findUnique({
      where: { id: boardId, userId },
    });

    if (!board) {
      return new NextResponse("Board not found or unauthorized", { status: 404 });
    }

    // For now, we'll create a member with the email
    // In production, you'd look up the user in Clerk first
    const member = await prisma.boardMember.create({
      data: {
        boardId,
        userId: `clerk_${userEmail}`, // Placeholder - you'd get real Clerk ID
        userName: userEmail.split("@")[0],
        userEmail,
        role: role || "MEMBER",
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error("[BOARD_MEMBERS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}