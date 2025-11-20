"use client";

import { Card } from "@prisma/client";
import { Calendar, MessageSquare, Paperclip } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useParams } from "next/navigation";

interface CardItemProps {
  card: Card;
}

export function CardItem({ card }: CardItemProps) {
  const params = useParams();
  const boardId = params.boardId as string;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: "card",
      card,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColors = {
    LOW: "bg-blue-100 text-blue-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    HIGH: "bg-orange-100 text-orange-800",
    URGENT: "bg-red-100 text-red-800",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing border border-gray-200 hover:border-blue-400"
    >
      <Link 
        href={`/board/${boardId}/card/${card.id}`}
        onClick={(e) => e.stopPropagation()}
        className="block"
      >
        <div>
          <h4 className="font-medium text-gray-900 mb-2">{card.title}</h4>

          {card.priority && (
            <span
              className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${
                priorityColors[card.priority]
              }`}
            >
              {card.priority}
            </span>
          )}

          {card.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {card.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-gray-500">
            {card.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(card.dueDate), "MMM d")}</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>0</span>
            </div>

            <div className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              <span>0</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}