import { Copy, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function FolderLink({ label, href, available, children }: { label: string; href: string | null; available: boolean; children: ReactNode }) {
  async function kopieren() {
    if (!href) return;
    await navigator.clipboard.writeText(href);
    toast.success(`${label}-Link kopiert.`);
  }
  if (!available || !href) return <span className="text-muted-foreground">nicht verknüpft</span>;
  return <span className="flex min-w-0 items-center gap-1.5">
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-1 truncate text-primary hover:underline" title={href}>
      <span className="truncate">{children}</span><ExternalLink className="size-3 shrink-0" />
    </a>
    <Button type="button" variant="ghost" size="icon" className="size-6 shrink-0" title={`${label}-Link kopieren`} aria-label={`${label}-Link kopieren`} onClick={kopieren}>
      <Copy className="size-3" />
    </Button>
  </span>;
}
