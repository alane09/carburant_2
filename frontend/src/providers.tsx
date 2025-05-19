"use client"

import { DataProvider } from "@/context/data-context"
import { LayoutProvider } from "@/context/layout-context"
import { ThemeProvider } from "next-themes"
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <DataProvider>
          <LayoutProvider>
            {children}
          </LayoutProvider>
        </DataProvider>
        </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
