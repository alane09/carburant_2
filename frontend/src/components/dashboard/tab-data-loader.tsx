"use client";

import { buildApiUrl } from "@/lib/api";
import { useEffect, useState } from "react";

// Tab data loader component
// This component helps optimize API data loading based on which tab is active
interface TabDataLoaderProps<T> {
  activeTab: string;
  tabId: string;
  dataEndpoint: string;
  queryParams?: Record<string, string>;
  children: (data: T | null, isLoading: boolean, error: string | null) => React.ReactNode;
  initialData?: T | null;
}

export default function TabDataLoader<T>({
  activeTab,
  tabId,
  dataEndpoint,
  queryParams = {},
  children,
  initialData = null
}: TabDataLoaderProps<T>) {
  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  // Only fetch data when this tab is active, and do it once
  useEffect(() => {
    // If this tab is not active or data has already been loaded, skip fetching
    if (activeTab !== tabId || hasLoaded) return;

    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        // Build the URL with query parameters
        const queryString = Object.entries(queryParams)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join("&");
        
        const url = buildApiUrl(`${dataEndpoint}${queryString ? `?${queryString}` : ""}`);
        
        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error(`API request failed with status: ${response.status}`);
        }

        const responseData = await response.json();
        setData(responseData);
        setHasLoaded(true);
      } catch (err: any) {
        console.error("Error fetching tab data:", err);
        setError(err.message || "Error loading data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [activeTab, tabId, dataEndpoint, hasLoaded, queryParams]);

  // Render the children function with the current state
  return <>{children(data, isLoading, error)}</>;
}
