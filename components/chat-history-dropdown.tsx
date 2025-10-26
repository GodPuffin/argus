"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listChats, deleteChat } from "@/lib/chat-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { IconPlus, IconClock, IconHistory, IconTrash } from "@tabler/icons-react";

interface ChatHistoryDropdownProps {
  currentChatId?: string;
}

export function ChatHistoryDropdown({ currentChatId }: ChatHistoryDropdownProps) {
  const router = useRouter();
  const [chats, setChats] = useState<Array<{
    id: string;
    title: string;
    updated_at: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const chatList = await listChats(10);
      setChats(chatList);
    } catch (error) {
      console.error("Error loading chat history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (chatId: string, title: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setChatToDelete({ id: chatId, title });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!chatToDelete) return;
    
    try {
      await deleteChat(chatToDelete.id);
      setChats(chats.filter(c => c.id !== chatToDelete.id));
      setDeleteDialogOpen(false);
      setChatToDelete(null);
      
      // If deleting current chat, redirect to new chat
      if (chatToDelete.id === currentChatId) {
        router.push("/ai-chat");
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <IconHistory className="size-4" />
            <span className="hidden sm:inline">History</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Chat History</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* New Chat Button */}
          <DropdownMenuItem asChild>
            <Link href="/ai-chat" className="flex items-center gap-2 cursor-pointer">
              <IconPlus className="size-4" />
              <span className="font-medium">New Chat</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Chat List */}
          {loading ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              Loading chats...
            </div>
          ) : chats.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              No chat history yet
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {chats.map((chat) => (
                <DropdownMenuItem
                  key={chat.id}
                  className={chat.id === currentChatId ? "bg-accent" : ""}
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Link
                      href={`/ai-chat/${chat.id}`}
                      className="flex flex-col items-start gap-1 flex-1 min-w-0 cursor-pointer py-1"
                    >
                      <span className="truncate w-full text-sm font-medium">
                        {chat.title || "Untitled Chat"}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <IconClock className="size-3" />
                        <span>{formatTimestamp(chat.updated_at)}</span>
                      </div>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDeleteClick(chat.id, chat.title || "Untitled Chat", e)}
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{chatToDelete?.title}"? This will permanently delete the conversation and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

