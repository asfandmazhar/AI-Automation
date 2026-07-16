interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage = ({ message, onRetry }: ErrorMessageProps) => (
  <div className="flex flex-col items-center gap-3 text-center">
    <p className="text-lg text-red-500">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
      >
        Retry
      </button>
    )}
  </div>
);
