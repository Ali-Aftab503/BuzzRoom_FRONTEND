"use client";

import { useState, useRef } from "react"; // Added useRef here
import { List, Card } from "@prisma/client";
import { CardItem } from "./CardItem";
import { Plus, MoreHorizontal, Trash2, Copy, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type ListWithCards = List & {
  cards: Card[];
};

interface ListContainerProps {
  list: ListWithCards;
}

export function ListContainer({ list }: ListContainerProps) {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>(list.cards);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const deletingRef = useRef(false); // Add this line

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list.id,
    data: {
      type: "list",
      list,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCardTitle.trim()) return;

    setIsCreating(true);

    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newCardTitle.trim(),
          listId: list.id,
          order: cards.length,
        }),
      });

      if (!response.ok) throw new Error("Failed to create card");

      const newCard = await response.json();
      setCards([...cards, newCard]);
      setNewCardTitle("");
      setIsAddingCard(false);
      router.refresh();
    } catch (error) {
      console.error("Error creating card:", error);
      alert("Failed to create card");
    } finally {
      setIsCreating(false);
    }
  };

 const handleDeleteList = async () => {
  // Check ref first to prevent duplicate calls
  if (deletingRef.current) {
    console.log("Delete already in progress, ignoring");
    return;
  }

  if (
    !confirm(
      `Are you sure you want to delete "${list.title}"? This will delete all cards in this list.`
    )
  ) {
    return;
  }

  if (isDeleting) return;

  deletingRef.current = true;
  setIsDeleting(true);

  try {
    const response = await fetch(`/api/lists/${list.id}`, {
      method: "DELETE",
    });

    if (response.status === 404) {
      console.log("List already deleted");
      // Force a hard refresh instead of soft refresh
      window.location.reload();
      return;
    }

    if (!response.ok) {
      throw new Error("Failed to delete list");
    }

    console.log("List deleted successfully");
    // Force a hard refresh to ensure the list is removed
    window.location.reload();
  } catch (error: any) {
    console.error("Error deleting list:", error);
    if (!error.message?.includes("404")) {
      alert("Failed to delete list");
    } else {
      window.location.reload();
    }
  }
  // Don't reset deletingRef - component will unmount
};

  const handleCopyList = async () => {
    setIsCopying(true);

    try {
      const response = await fetch(`/api/lists/${list.id}/copy`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      router.refresh();
    } catch (error) {
      console.error("Error copying list:", error);
      alert("Failed to copy list");
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-72 flex flex-col max-h-full"
    >
      {/* List Header */}
      <div className="bg-white rounded-t-lg p-3 flex items-center justify-between border-b">
        <div className="flex items-center gap-2 flex-1">
          <button
            className="cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </button>
          <h3 className="font-semibold text-gray-900">{list.title}</h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={isDeleting || isCopying}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsAddingCard(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add card
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyList} disabled={isCopying}>
              <Copy className="h-4 w-4 mr-2" />
              {isCopying ? "Copying..." : "Copy list"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDeleteList}
              className="text-red-600"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? "Deleting..." : "Delete list"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Cards Container */}
      <div className="bg-gray-50 p-2 flex-1 overflow-y-auto space-y-2">
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <CardItem key={card.id} card={card} />
          ))}
        </SortableContext>

        {/* Add Card Button/Form */}
        {isAddingCard ? (
          <div className="bg-white rounded-lg p-2 shadow-sm">
            <form onSubmit={handleCreateCard}>
              <Textarea
                autoFocus
                placeholder="Enter a title for this card..."
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                disabled={isCreating}
                className="mb-2 min-h-[60px] resize-none"
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isCreating || !newCardTitle.trim()}
                >
                  Add Card
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAddingCard(false);
                    setNewCardTitle("");
                  }}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <Button
            onClick={() => setIsAddingCard(true)}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-gray-600 hover:bg-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add a card
          </Button>
        )}
      </div>
    </div>
  );
}