"use client";

import { useState, useEffect } from "react";
import { BoardContainer } from "./BoardContainer";

export function BoardContainerWrapper({ board }: any) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return <BoardContainer board={board} />;
}