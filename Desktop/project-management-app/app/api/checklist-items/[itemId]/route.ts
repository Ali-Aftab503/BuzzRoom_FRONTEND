import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{
    itemId: string;
  }>;
}

// PATCH update checklist item (toggle completion or update details)
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { itemId } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { completed, title, assigneeId, assigneeName, assigneeImage, dueDate } = body;

    const item = await prisma.checklistItem.update({
      where: { id: itemId },
      data: {
        completed: completed !== undefined ? completed : undefined,
        title: title !== undefined ? title : undefined,
        assigneeId: assigneeId !== undefined ? assigneeId : undefined,
        assigneeName: assigneeName !== undefined ? assigneeName : undefined,
        assigneeImage: assigneeImage !== undefined ? assigneeImage : undefined,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("[CHECKLIST_ITEM_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE checklist item
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { itemId } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await prisma.checklistItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CHECKLIST_ITEM_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}