import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all integrations for user
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const integrations = await prisma.integration.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        // Don't send tokens to client
      },
    });

    return NextResponse.json(integrations);
  } catch (error) {
    console.error("[INTEGRATIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST create integration
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { type, accessToken, refreshToken, metadata } = body;

    if (!type) {
      return new NextResponse("Type is required", { status: 400 });
    }

    // Check if integration already exists
    const existing = await prisma.integration.findFirst({
      where: {
        userId,
        type,
      },
    });

    if (existing) {
      // Update existing
      const updated = await prisma.integration.update({
        where: { id: existing.id },
        data: {
          accessToken: accessToken || existing.accessToken,
          refreshToken: refreshToken || existing.refreshToken,
          metadata: metadata || existing.metadata,
        },
        select: {
          id: true,
          type: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return NextResponse.json(updated);
    }

    // Create new
    const integration = await prisma.integration.create({
      data: {
        userId,
        type,
        accessToken: accessToken || null,
        refreshToken: refreshToken || null,
        metadata: metadata || null,
      },
      select: {
        id: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(integration);
  } catch (error) {
    console.error("[INTEGRATIONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}