import { cn } from "@/lib/utils";

export function PageShell({
  title,
  description,
  children,
  className
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("mx-auto w-full max-w-6xl px-4 py-10", className)}>
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-amber-600">ChessArbiter Polska</p>
        <h1 className="text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-slate-600">{description}</p> : null}
      </div>
      {children}
    </main>
  );
}
