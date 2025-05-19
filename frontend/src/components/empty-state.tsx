"use client";

import { AlertCircle } from "lucide-react";

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ 
  message, 
  icon = <AlertCircle className="h-5 w-5" />,
  className 
}: EmptyStateProps) {
  return (
    <div className={`flex h-full min-h-[150px] flex-col items-center justify-center gap-3 text-center ${className}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
