"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchGreeting } from "@/services/greeting.service";
import type { Greeting } from "@/types/greeting.types";

interface UseGreetingResult {
  greeting: Greeting | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Encapsulates fetching + loading/error state + toast notifications
 * for the greeting feature, keeping page components declarative.
 */
export const useGreeting = (): UseGreetingResult => {
  const [greeting, setGreeting] = useState<Greeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchIndex, setRefetchIndex] = useState(0);

  const refetch = useCallback(() => setRefetchIndex((n) => n + 1), []);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchGreeting();
        if (!isMounted) return;
        setGreeting(result);
        toast.success("Fetched message from backend!");
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : "Failed to reach backend API";
        setError(message);
        toast.error(message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [refetchIndex]);

  return { greeting, isLoading, error, refetch };
};
