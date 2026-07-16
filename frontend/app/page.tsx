import { GreetingCard } from "@/components/features/GreetingCard";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-black">
      <GreetingCard />
    </main>
  );
}
