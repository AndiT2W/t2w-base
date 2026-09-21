import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

/**
 * Zwei Formen für Reiterleisten:
 *
 * - `segmentiert` ist die bisherige Pille auf grauem Grund.
 * - `unterstrich` folgt dem freigegebenen Artboard — Unterkante am Balken,
 *   grüner Unterstrich am aktiven Reiter, keine eigene Fläche.  Dieselbe Form
 *   trägt `Segment` für die Ansichtsleisten; hier ist sie für Radix-Reiter
 *   nachgebaut, weil der aktive Zustand dort erst zur Laufzeit als
 *   `data-state` ankommt und nicht beim Zeichnen bekannt ist.
 */
type TabsVariante = "segmentiert" | "unterstrich";

const LISTE: Record<TabsVariante, string> = {
  segmentiert:
    "inline-flex items-center justify-center rounded-lg border border-border bg-muted p-1 text-muted-foreground",
  unterstrich: "inline-flex items-center gap-0.5 border-b border-border text-muted-foreground",
};

const REITER: Record<TabsVariante, string> = {
  segmentiert:
    "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm md:min-h-8",
  unterstrich:
    "relative inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap px-3.5 text-sm font-medium ring-offset-background cursor-pointer transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:inset-x-2 data-[state=active]:after:-bottom-px data-[state=active]:after:h-[2.5px] data-[state=active]:after:rounded-full data-[state=active]:after:bg-primary data-[state=active]:after:content-[''] md:min-h-9",
};

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { variante?: TabsVariante }
>(({ className, variante = "segmentiert", ...props }, ref) => (
  <TabsPrimitive.List ref={ref} className={cn(LISTE[variante], className)} {...props} />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { variante?: TabsVariante }
>(({ className, variante = "segmentiert", ...props }, ref) => (
  <TabsPrimitive.Trigger ref={ref} className={cn(REITER[variante], className)} {...props} />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
