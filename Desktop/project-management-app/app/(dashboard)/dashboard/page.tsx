import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, LayoutDashboard } from "lucide-react";
import { CreateBoardModal } from "@/components/modals/CreateBoardModal";
import { formatDistanceToNow } from "date-fns";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch all boards for this user
  const boards = await prisma.board.findMany({
    where: {
      userId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      _count: {
        select: {
          lists: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Boards</h1>
            <p className="text-gray-600 mt-1">
              Manage your projects and tasks
            </p>
          </div>
          <CreateBoardModal />
        </div>

        {/* Boards Grid */}
        {boards.length === 0 ? (
          <div className="text-center py-20">
            <LayoutDashboard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No boards yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first board to get started
            </p>
            <CreateBoardModal />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {boards.map((board) => (
              <Link
                key={board.id}
                href={`/board/${board.id}`}
                className="group"
              >
                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-blue-500 transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
                      {board.title}
                    </h3>
                  </div>
                  
                  {board.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {board.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{board._count.lists} lists</span>
                    <span>
                      Updated {formatDistanceToNow(new Date(board.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {/* Create New Board Card */}
            <CreateBoardModal>
              <div className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[180px]">
                <Plus className="h-12 w-12 text-gray-400 mb-2" />
                <span className="text-gray-600 font-medium">Create New Board</span>
              </div>
            </CreateBoardModal>
          </div>
        )}
      </div>
    </div>
  );
}