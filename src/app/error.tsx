"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-teal mb-2">حصل خطأ</h2>
        <p className="text-muted-foreground mb-6">حصل خطأ، حاول تاني.</p>
        <button
          onClick={reset}
          className="rounded-xl bg-teal text-white px-6 py-2.5 text-sm font-medium hover:opacity-90"
        >
          حاول تاني
        </button>
      </div>
    </div>
  );
}
