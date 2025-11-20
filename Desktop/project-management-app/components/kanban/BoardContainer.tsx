"use client";

import { useState } from "react";
import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { useAuth } from "@clerk/nextjs";
import { Board, List, Card } from "@prisma/client";
import { ListContainer } from "./ListContainer";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import { CardItem } from "./CardItem";
import { BarChart3 } from "lucide-react";
import Link from "next/link";
type ListWithCards = List & {
  cards: Card[];
};

type BoardWithLists = Board & {
  lists: ListWithCards[];
};

interface BoardContainerProps {
  board: BoardWithLists;
}

export function BoardContainer({ board }: BoardContainerProps) {
  const router = useRouter();
  const [lists, setLists] = useState<ListWithCards[]>(board.lists);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [activeList, setActiveList] = useState<ListWithCards | null>(null);

  const { userId } = useAuth();

// Pusher real-time subscription
useEffect(() => {
  const channel = pusherClient.subscribe(`private-board-${board.id}`);

  // Listen for card reorder events
  channel.bind("cards-reorder", (data: { cards: any[]; userId: string }) => {
    if (data.userId === userId) return;

    const updatedLists = lists.map((list) => {
      const listCards = data.cards
        .filter((card) => card.listId === list.id)
        .sort((a, b) => a.order - b.order)
        .map((cardData) => {
          const existingCard = lists
            .flatMap((l) => l.cards)
            .find((c) => c.id === cardData.id);
          return existingCard ? { ...existingCard, ...cardData } : cardData;
        });

      return {
        ...list,
        cards: listCards,
      };
    });

    setLists(updatedLists);
  });

  // Listen for list reorder events
  channel.bind("lists-reorder", (data: { lists: any[]; userId: string }) => {
    if (data.userId === userId) return;

    const reorderedLists = [...lists].sort((a, b) => {
      const aOrder = data.lists.find((l) => l.id === a.id)?.order ?? 0;
      const bOrder = data.lists.find((l) => l.id === b.id)?.order ?? 0;
      return aOrder - bOrder;
    });

    setLists(reorderedLists);
  });

  // Listen for new card events
  channel.bind("card-created", () => {
    router.refresh();
  });

  // Listen for new list events
  channel.bind("list-created", () => {
    router.refresh();
  });

  // Listen for list deleted events - UPDATED
  channel.bind("list-deleted", (data: { listId: string; userId: string }) => {
    console.log("List deleted via Pusher:", data.listId);
    // Remove the list from state immediately
    setLists((prevLists) => prevLists.filter((l) => l.id !== data.listId));
    // Also refresh the page data
    router.refresh();
  });

  // Listen for list copied events
  channel.bind("list-copied", () => {
    router.refresh();
  });

  return () => {
    channel.unbind_all();
    channel.unsubscribe();
  };
}, [board.id, lists, userId, router]);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newListTitle.trim()) return;

    setIsCreating(true);

    try {
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newListTitle.trim(),
          boardId: board.id,
          order: lists.length,
        }),
      });

      if (!response.ok) throw new Error("Failed to create list");

      const newList = await response.json();
      setLists([...lists, { ...newList, cards: [] }]);
      setNewListTitle("");
      setIsAddingList(false);
      router.refresh();
    } catch (error) {
      console.error("Error creating list:", error);
      alert("Failed to create list");
    } finally {
      setIsCreating(false);
    }
  };

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.type === "card") {
      const card = lists
        .flatMap((list) => list.cards)
        .find((c) => c.id === active.id);
      setActiveCard(card || null);
    } else if (activeData?.type === "list") {
      const list = lists.find((l) => l.id === active.id);
      setActiveList(list || null);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Only handle card dragging over lists or other cards
    if (activeData?.type !== "card") return;

    const activeCardId = active.id as string;
    const overCardId = over.id as string;

    // Find source and destination lists
    const activeList = lists.find((list) =>
      list.cards.some((card) => card.id === activeCardId)
    );
    const overList = lists.find(
      (list) =>
        list.id === overCardId ||
        list.cards.some((card) => card.id === overCardId)
    );

    if (!activeList || !overList) return;

    // Same list - just reorder
    if (activeList.id === overList.id) {
      const updatedLists = lists.map((list) => {
        if (list.id === activeList.id) {
          const oldIndex = list.cards.findIndex((c) => c.id === activeCardId);
          const newIndex =
            overData?.type === "card"
              ? list.cards.findIndex((c) => c.id === overCardId)
              : list.cards.length;

          return {
            ...list,
            cards: arrayMove(list.cards, oldIndex, newIndex),
          };
        }
        return list;
      });

      setLists(updatedLists);
    } else {
      // Different lists - move card
      const updatedLists = lists.map((list) => {
        // Remove from source list
        if (list.id === activeList.id) {
          return {
            ...list,
            cards: list.cards.filter((card) => card.id !== activeCardId),
          };
        }
        // Add to destination list
        if (list.id === overList.id) {
          const cardToMove = activeList.cards.find((c) => c.id === activeCardId);
          if (!cardToMove) return list;

          const newIndex =
            overData?.type === "card"
              ? list.cards.findIndex((c) => c.id === overCardId)
              : list.cards.length;

          const newCards = [...list.cards];
          newCards.splice(newIndex, 0, { ...cardToMove, listId: list.id });

          return {
            ...list,
            cards: newCards,
          };
        }
        return list;
      });

      setLists(updatedLists);
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;
  setActiveCard(null);
  setActiveList(null);

  if (!over) return;

  const activeData = active.data.current;

  // Handle list reordering
  if (activeData?.type === "list") {
    const oldIndex = lists.findIndex((l) => l.id === active.id);
    const newIndex = lists.findIndex((l) => l.id === over.id);

    if (oldIndex !== newIndex) {
      const reorderedLists = arrayMove(lists, oldIndex, newIndex);
      setLists(reorderedLists);

      // Persist to backend with boardId
      try {
        await fetch("/api/lists/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lists: reorderedLists.map((list, index) => ({
              id: list.id,
              order: index,
            })),
            boardId: board.id, // Add this
          }),
        });
      } catch (error) {
        console.error("Error reordering lists:", error);
        setLists(lists);
      }
    }
    return;
  }

  // Handle card reordering/moving
  if (activeData?.type === "card") {
    const allCards = lists.flatMap((list) =>
      list.cards.map((card, index) => ({
        id: card.id,
        order: index,
        listId: list.id,
      }))
    );

    // Persist to backend with boardId
    try {
      await fetch("/api/cards/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          cards: allCards,
          boardId: board.id, // Add this
        }),
      });
    } catch (error) {
      console.error("Error reordering cards:", error);
      setLists(board.lists);
    }
  }
};

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Board Header */}
        
        <div className="p-4 bg-white/80 backdrop-blur-sm border-b">
          <div className="container mx-auto">
            <h1 className="text-2xl font-bold text-gray-900">{board.title}</h1>
            {board.description && (
              <p className="text-gray-600 mt-1">{board.description}</p>
            )}
          </div>
        </div>
        <div className="p-4 bg-white/80 backdrop-blur-sm border-b">
  <div className="container mx-auto flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{board.title}</h1>
      {board.description && (
        <p className="text-gray-600 mt-1">{board.description}</p>
      )}
    </div>
    <Link href={`/board/${board.id}/analytics`}>
      <Button variant="outline" size="sm">
        <BarChart3 className="h-4 w-4 mr-2" />
        Analytics
      </Button>
    </Link>
  </div>
</div>

        {/* Lists Container */}
        <div className="p-4 h-[calc(100vh-12rem)] overflow-x-auto">
          <div className="flex gap-4 h-full">
            <SortableContext
              items={lists.map((l) => l.id)}
              strategy={horizontalListSortingStrategy}
            >
              {lists.map((list) => (
                <ListContainer key={list.id} list={list} />
              ))}
            </SortableContext>

            {/* Add List Button/Form */}
            <div className="flex-shrink-0 w-72">
              {isAddingList ? (
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <form onSubmit={handleCreateList}>
                    <Input
                      autoFocus
                      placeholder="Enter list title..."
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      disabled={isCreating}
                      className="mb-2"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isCreating || !newListTitle.trim()}
                      >
                        Add List
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsAddingList(false);
                          setNewListTitle("");
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
                  onClick={() => setIsAddingList(true)}
                  variant="ghost"
                  className="w-full justify-start bg-white/50 hover:bg-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add a list
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Drag Overlays */}
      {typeof window !== "undefined" &&
        createPortal(
          <DragOverlay>
            {activeCard && (
              <div className="rotate-3 opacity-80">
                <CardItem card={activeCard} />
              </div>
            )}
            {activeList && (
              <div className="w-72 opacity-80 rotate-2">
                <ListContainer list={activeList} />
              </div>
            )}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  );
}