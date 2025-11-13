export const RoomCardSkeleton = () => {
  return (
    <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 bg-zinc-800 rounded-xl"></div>
        <div className="w-20 h-6 bg-zinc-800 rounded-full"></div>
      </div>
      <div className="h-6 bg-zinc-800 rounded mb-2 w-3/4"></div>
      <div className="h-4 bg-zinc-800 rounded mb-2 w-full"></div>
      <div className="h-4 bg-zinc-800 rounded w-2/3"></div>
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-800">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-zinc-800 rounded-full"></div>
          <div className="h-4 bg-zinc-800 rounded w-20"></div>
        </div>
        <div className="w-8 h-8 bg-zinc-800 rounded-lg"></div>
      </div>
    </div>
  );
};

export const MessageSkeleton = () => {
  return (
    <div className="flex items-end space-x-2 mb-4 animate-pulse">
      <div className="w-8 h-8 bg-zinc-800 rounded-full flex-shrink-0"></div>
      <div className="flex flex-col items-start">
        <div className="h-3 bg-zinc-800 rounded w-20 mb-2"></div>
        <div className="bg-zinc-800 rounded-2xl p-4 space-y-2">
          <div className="h-4 bg-zinc-700 rounded w-48"></div>
          <div className="h-4 bg-zinc-700 rounded w-36"></div>
        </div>
      </div>
    </div>
  );
};

export const ChatRoomSkeleton = () => {
  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f]">
      {/* Header Skeleton */}
      <div className="bg-[#18181b] border-b border-zinc-800 shadow-lg animate-pulse">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-zinc-800 rounded-xl"></div>
              <div className="w-12 h-12 bg-zinc-800 rounded-xl"></div>
              <div className="space-y-2">
                <div className="h-5 bg-zinc-800 rounded w-32"></div>
                <div className="h-3 bg-zinc-800 rounded w-20"></div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-zinc-800 rounded-xl"></div>
              <div className="w-10 h-10 bg-zinc-800 rounded-xl"></div>
              <div className="w-32 h-10 bg-zinc-800 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Skeleton */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
        <MessageSkeleton />
        <MessageSkeleton />
        <MessageSkeleton />
        <MessageSkeleton />
        <MessageSkeleton />
      </div>

      {/* Input Skeleton */}
      <div className="bg-[#18181b] border-t border-zinc-800 animate-pulse">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-zinc-800 rounded-xl"></div>
            <div className="flex-1 h-12 bg-zinc-800 rounded-xl"></div>
            <div className="w-10 h-10 bg-zinc-800 rounded-xl"></div>
            <div className="w-20 h-12 bg-zinc-800 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};