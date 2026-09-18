import { cn } from "@/lib/utils";

export function OrganizerLink({
  organizerId,
  name,
  className,
}: {
  organizerId?: string | undefined;
  name: string;
  className?: string | undefined;
}) {
  if (!organizerId) return <span className={className}>{name}</span>;

  return (
    <a
      href={`/kontakte?kunde=${encodeURIComponent(organizerId)}`}
      title={`Kundendatensatz öffnen: ${name}`}
      className={cn(
        "rounded-sm text-inherit underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        className,
      )}
    >
      {name}
    </a>
  );
}
