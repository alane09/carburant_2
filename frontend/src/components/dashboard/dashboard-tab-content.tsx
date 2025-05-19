"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface DashboardTabContentProps {
  title: string;
  showContent: boolean;
  noDataMessage: ReactNode;
  children: ReactNode;
}

export default function DashboardTabContent({
  title,
  showContent,
  noDataMessage,
  children,
}: DashboardTabContentProps) {
  if (!showContent) {
    return (
      <div className="flex h-[300px] w-full flex-col items-center justify-center gap-4">
        <div className="flex items-center justify-center rounded-full bg-warning/10 p-3">
          <AlertTriangle className="h-6 w-6 text-warning" />
        </div>
        <p className="text-muted-foreground">{noDataMessage}</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {children || noDataMessage}
      </CardContent>
    </Card>
  );
}
