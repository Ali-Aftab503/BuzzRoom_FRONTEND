import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify ownership
    const integration = await prisma.integration.findUnique({
      where: { id },
    });

    if (!integration || integration.userId !== userId) {
      return new NextResponse("Not found", { status: 404 });
    }

    await prisma.integration.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[INTEGRATION_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}