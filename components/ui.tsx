import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("min-h-screen px-4 py-6 sm:px-6 lg:px-8", className)}>
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </main>
  );
}

export function Panel({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-panel",
        className
      )}
    >
      {children}
    </section>
  );
}

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold transition",
        variant === "primary" &&
          "bg-clinic text-white hover:bg-clinic/90 active:bg-clinic/80",
        variant === "secondary" &&
          "border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-muted))]",
        variant === "danger" &&
          "bg-coral text-white hover:bg-coral/90 active:bg-coral/80",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-[rgb(var(--text-muted))]">
      {label}
      <input
        className={cn(
          "focus-ring h-10 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-[rgb(var(--text))] placeholder:text-[rgb(var(--placeholder))]",
          className
        )}
        {...props}
      />
    </label>
  );
}

export function Select({
  label,
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-[rgb(var(--text-muted))]">
      {label}
      <select
        className={cn(
          "focus-ring h-10 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-[rgb(var(--text))]",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Textarea({
  label,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-[rgb(var(--text-muted))]">
      {label}
      <textarea
        className={cn(
          "focus-ring min-h-24 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2 text-[rgb(var(--text))] placeholder:text-[rgb(var(--placeholder))]",
          className
        )}
        {...props}
      />
    </label>
  );
}

export function Stat({
  label,
  value,
  tone = "clinic"
}: {
  label: string;
  value: string | number;
  tone?: "clinic" | "leaf" | "amber" | "coral";
}) {
  const tones = {
    clinic: "border-clinic/20 bg-clinic/10 text-clinic",
    leaf: "border-leaf/20 bg-leaf/10 text-leaf",
    amber: "border-amber/20 bg-amber/10 text-amber",
    coral: "border-coral/20 bg-coral/10 text-coral"
  };

  return (
    <div className={cn("rounded-lg border p-4", tones[tone])}>
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold text-[rgb(var(--text))]">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">{subtitle}</p> : null}
    </div>
  );
}
