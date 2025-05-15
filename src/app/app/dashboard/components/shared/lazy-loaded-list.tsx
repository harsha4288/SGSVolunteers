"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export interface LazyLoadedListProps<T> {
  fetchData: (page: number, pageSize: number) => Promise<{ 
    data: T[] | null; 
    error: string | null;
    count?: number;
  }>;
  renderItem: (item: T) => React.ReactNode;
  pageSize?: number;
  emptyMessage?: string;
  loadingMessage?: string;
  className?: string;
}

export function LazyLoadedList<T extends { id: string | number }>({
  fetchData,
  renderItem,
  pageSize = 10,
  emptyMessage = "No items found",
  loadingMessage = "Loading items...",
  className
}: LazyLoadedListProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const loadItems = async (pageNum: number, append = false) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error, count } = await fetchData(pageNum, pageSize);
      
      if (error) {
        setError(error);
        return;
      }
      
      if (data) {
        if (append) {
          setItems(prev => [...prev, ...data]);
        } else {
          setItems(data);
        }
        
        if (count !== undefined) {
          setTotalCount(count);
          setHasMore(items.length + data.length < count);
        } else {
          setHasMore(data.length === pageSize);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems(1);
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadItems(nextPage, true);
  };

  if (items.length === 0 && !loading && !error) {
    return <div className="text-center py-8 text-muted-foreground">{emptyMessage}</div>;
  }

  return (
    <div className={className}>
      {items.map(item => (
        <div key={item.id} className="mb-4">
          {renderItem(item)}
        </div>
      ))}
      
      {loading && (
        <div className="flex justify-center py-4">
          <Skeleton className="h-10 w-full max-w-xs" />
        </div>
      )}
      
      {error && (
        <div className="text-center py-4 text-destructive">
          Error: {error}
        </div>
      )}
      
      {hasMore && !loading && (
        <div className="flex justify-center py-4">
          <Button onClick={loadMore} variant="outline">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Load More ({items.length} of {totalCount || "?"})
          </Button>
        </div>
      )}
    </div>
  );
}
