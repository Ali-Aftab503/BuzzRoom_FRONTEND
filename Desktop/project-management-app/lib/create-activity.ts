import { prisma } from "@/lib/prisma";
import { ActivityType, EntityType } from "@prisma/client";

interface CreateActivityParams {
  action: ActivityType;
  entityId: string;
  entityType: EntityType;
  userId: string;
  userName: string;
  userImage?: string;
  boardId?: string;
  cardId?: string;
  metadata?: any;
}

export async function createActivity(params: CreateActivityParams) {
  try {
    const activity = await prisma.activity.create({
      data: {
        action: params.action,
        entityId: params.entityId,
        entityType: params.entityType,
        userId: params.userId,
        userName: params.userName,
        userImage: params.userImage || null,
        boardId: params.boardId || null,
        cardId: params.cardId || null,
        metadata: params.metadata || null,
      },
    });

    return activity;
  } catch (error) {
    console.error("Error creating activity:", error);
    return null;
  }
}