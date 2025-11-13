import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all boards for the authenticated user
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const boards = await prisma.board.findMany({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        _count: {
          select: {
            lists: true,
          },
        },
      },
    });

    return NextResponse.json(boards);
  } catch (error) {
    console.error("[BOARDS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST create a new board
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, description } = body;

    if (!title) {
      return new NextResponse("Title is required", { status: 400 });
    }

    const board = await prisma.board.create({
      data: {
        title,
        description: description || null,
        userId,
      },
    });

    return NextResponse.json(board);
  } catch (error) {
    console.error("[BOARDS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}