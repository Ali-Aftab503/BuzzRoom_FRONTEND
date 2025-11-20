"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TiptapEditor } from "@/components/kanban/TiptapEditor";
import { CommentFeed } from "@/components/kanban/CommentFeed";
import { Calendar, Clock, Tag, Trash2, Paperclip, Download } from "lucide-react";
import { format } from "date-fns";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, CheckSquare, Link as LinkIcon } from "lucide-react";

interface CardModalPageProps {
  params: Promise<{
    boardId: string;
    cardId: string;
  }>;
}

export default function CardModalPage({ params }: CardModalPageProps) {
  const router = useRouter();
  const [card, setCard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [boardId, setBoardId] = useState("");
  const [cardId, setCardId] = useState("");
  const [assignees, setAssignees] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setBoardId(resolvedParams.boardId);
      setCardId(resolvedParams.cardId);
    }
    loadParams();
  }, [params]);

  useEffect(() => {
    if (!cardId) return;

    async function fetchCard() {
      try {
        const response = await fetch(`/api/cards/${cardId}`);
        if (!response.ok) throw new Error("Failed to fetch card");
        const data = await response.json();
        setCard(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setPriority(data.priority);
        setDueDate(
          data.dueDate ? format(new Date(data.dueDate), "yyyy-MM-dd") : ""
        );
        // Fetch assignees
        const assigneesRes = await fetch(`/api/cards/${cardId}/assignees`);
        const assigneesData = await assigneesRes.json();
        setAssignees(assigneesData);

        // Fetch checklists
        const checklistsRes = await fetch(`/api/cards/${cardId}/checklists`);
        const checklistsData = await checklistsRes.json();
        setChecklists(checklistsData);
      } catch (error) {
        console.error("Error fetching card:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCard();
  }, [cardId]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          priority,
          dueDate: dueDate || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to update card");

      router.refresh();
    } catch (error) {
      console.error("Error updating card:", error);
      alert("Failed to update card");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this card?")) return;

    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete card");

      router.back();
      router.refresh();
    } catch (error) {
      console.error("Error deleting card:", error);
      alert("Failed to delete card");
    }
  };

  const handleClose = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!card) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="flex-1">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-semibold border-none px-0 focus-visible:ring-0"
              />
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            in list <span className="font-medium">{card.list.title}</span>
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Priority and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Priority
              </Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Due Date
              </Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          {/* Assignees */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assigned To
            </Label>
            <div className="flex flex-wrap gap-2">
              {assignees.map((assignee) => (
                <div
                  key={assignee.id}
                  className="flex items-center gap-2 px-3 py-1 bg-accent rounded-full"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={assignee.userImage || undefined} />
                    <AvatarFallback>
                      {assignee.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{assignee.userName}</span>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  // Open assign member dialog
                  alert("Assign member feature - connect to your board members");
                }}
              >
                + Assign
              </Button>
            </div>
          </div>
          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <TiptapEditor
              content={description}
              onChange={setDescription}
              editable={true}
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Attachments
            </Label>

            <UploadButton<OurFileRouter, "cardAttachment">
              endpoint="cardAttachment"
              onClientUploadComplete={async (res) => {
                if (res && res[0]) {
                  const file = res[0];

                  await fetch(`/api/cards/${cardId}/attachments`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: file.name,
                      url: file.url,
                      size: file.size,
                      type: file.type,
                    }),
                  });

                  const response = await fetch(`/api/cards/${cardId}`);
                  const data = await response.json();
                  setCard(data);
                }
              }}
              onUploadError={(error: Error) => {
                alert(`Upload failed: ${error.message}`);
              }}
              appearance={{
                button:
                  "ut-ready:bg-blue-600 ut-uploading:cursor-not-allowed bg-blue-600 bg-none after:bg-blue-500",
                allowedContent: "text-sm opacity-70",
              }}
            />

            {card.attachments && card.attachments.length > 0 && (
              <div className="space-y-2 mt-3">
                {card.attachments.map((attachment: any) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      <Paperclip className="h-4 w-4 opacity-70" />
                      <div>
                        <p className="text-sm font-medium">{attachment.name}</p>
                        <p className="text-xs opacity-70">
                          {(attachment.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>

                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  </div>
            ))}
          </div>
            )}
        </div>
        {/* Checklists */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Checklists
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                const title = prompt("Checklist title:");
                if (title) {
                  await fetch(`/api/cards/${cardId}/checklists`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title }),
                  });
                  // Refresh
                  const res = await fetch(`/api/cards/${cardId}/checklists`);
                  const data = await res.json();
                  setChecklists(data);
                }
              }}
            >
              + Add Checklist
            </Button>
          </div>

          {checklists.map((checklist) => (
            <div key={checklist.id} className="border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold">{checklist.title}</h4>
              <div className="space-y-2">
                {checklist.items.map((item: any) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={async (checked) => {
                        await fetch(`/api/checklist-items/${item.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ completed: checked }),
                        });
                        // Refresh
                        const res = await fetch(`/api/cards/${cardId}/checklists`);
                        const data = await res.json();
                        setChecklists(data);
                      }}
                    />
                    <div className="flex-1">
                      <p
                        className={`text-sm ${item.completed ? "line-through opacity-50" : ""
                          }`}
                      >
                        {item.title}
                      </p>
                      {item.assigneeName && (
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={item.assigneeImage || undefined} />
                            <AvatarFallback className="text-xs">
                              {item.assigneeName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs opacity-70">{item.assigneeName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    const title = prompt("Item title:");
                    if (title) {
                      await fetch(`/api/checklists/${checklist.id}/items`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ title }),
                      });
                      // Refresh
                      const res = await fetch(`/api/cards/${cardId}/checklists`);
                      const data = await res.json();
                      setChecklists(data);
                    }
                  }}
                >
                  + Add Item
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Links */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Links
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                const title = prompt("Link title:");
                const url = prompt("URL:");
                if (title && url) {
                  await fetch(`/api/cards/${cardId}/links`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title, url }),
                  });
                  // Refresh card
                  const res = await fetch(`/api/cards/${cardId}`);
                  const data = await res.json();
                  setCard(data);
                }
              }}
            >
              + Add Link
            </Button>
          </div>
  {card.links && card.links.length > 0 && (
    <div className="space-y-2">
      {card.links.map((link: any) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 border rounded hover:bg-accent"
        >
          <LinkIcon className="h-4 w-4 opacity-70" />
          <span className="text-sm">{link.title}</span>
        </a>
      ))}
    </div>
  )}
      </div>
      {/* Save Button */}
      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>

      {/* Comments */}
      <CommentFeed
        cardId={cardId}
        comments={card.comments || []}
        onCommentAdded={() => {
          fetch(`/api/cards/${cardId}`)
            .then((res) => res.json())
            .then((data) => setCard(data));
        }}
      />

      {/* Activity Log */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <h3 className="font-semibold">Activity</h3>
        </div>
        <div className="space-y-2">
          {!card.activities || card.activities.length === 0 ? (
            <p className="text-sm opacity-70">No activity yet</p>
          ) : (
            card.activities.map((activity: any) => (
              <div
                key={activity.id}
                className="text-sm opacity-70 flex flex-wrap items-start gap-1"
              >
                <span className="font-medium">{activity.userName}</span>
                <span>{activity.action.toLowerCase()}</span>
                <span className="opacity-50">
                  {format(new Date(activity.createdAt), "MMM d 'at' h:mm a")}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
    </DialogContent >
    </Dialog >
  );
}