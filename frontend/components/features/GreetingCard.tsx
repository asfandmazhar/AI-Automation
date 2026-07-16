"use client";

import { SiNextdotjs } from "react-icons/si";
import { useGreeting } from "@/hooks/useGreeting";
import { Loader } from "@/components/ui/Loader";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

/**
 * Feature component for the greeting card: orchestrates the
 * `useGreeting` hook and renders the appropriate UI state.
 */
export const GreetingCard = () => {
  const { greeting, isLoading, error, refetch } = useGreeting();

  return (
    <div className="flex flex-col items-center gap-4">
      <SiNextdotjs className="h-12 w-12 text-zinc-900 dark:text-zinc-50" />

      {isLoading && <Loader />}
      {!isLoading && error && <ErrorMessage message={error} onRetry={refetch} />}
      {!isLoading && !error && greeting && (
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {greeting.message}
        </h1>
      )}

      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Next.js + Tailwind + Axios + React Hot Toast → Express + MongoDB
      </p>
    </div>
  );
};
