import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{
    cardId: string;
  }>;
}

// POST add a link to a card
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { cardId } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, url } = body;

    if (!title || !url) {
      return new NextResponse("Title and URL are required", { status: 400 });
    }

    const link = await prisma.cardLink.create({
      data: {
        cardId,
        title,
        url,
      },
    });

    return NextResponse.json(link);
  } catch (error) {
    console.error("[CARD_LINKS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}