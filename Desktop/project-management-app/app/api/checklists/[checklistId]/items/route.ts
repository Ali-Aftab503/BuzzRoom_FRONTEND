import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{
    checklistId: string;
  }>;
}

// POST create a checklist item
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { checklistId } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, assigneeId, assigneeName, assigneeImage, dueDate } = body;

    if (!title) {
      return new NextResponse("Title is required", { status: 400 });
    }

    // Get current item count for order
    const count = await prisma.checklistItem.count({
      where: { checklistId },
    });

    const item = await prisma.checklistItem.create({
      data: {
        checklistId,
        title,
        order: count,
        assigneeId: assigneeId || null,
        assigneeName: assigneeName || null,
        assigneeImage: assigneeImage || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("[CHECKLIST_ITEMS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}