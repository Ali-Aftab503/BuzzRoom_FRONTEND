import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{
    cardId: string;
  }>;
}

// GET checklists for a card
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { cardId } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const checklists = await prisma.checklist.findMany({
      where: { cardId },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(checklists);
  } catch (error) {
    console.error("[CHECKLISTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST create a checklist
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { cardId } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title } = body;

    if (!title) {
      return new NextResponse("Title is required", { status: 400 });
    }

    // Get current checklist count for order
    const count = await prisma.checklist.count({
      where: { cardId },
    });

    const checklist = await prisma.checklist.create({
      data: {
        cardId,
        title,
        order: count,
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(checklist);
  } catch (error) {
    console.error("[CHECKLISTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}