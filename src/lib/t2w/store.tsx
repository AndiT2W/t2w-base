import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ColumnKey, Settings, T2WEvent } from "./types";
import { ALL_COLUMNS } from "./types";
import {
  apiCreateEvent,
  apiEvents,
  apiOutlookFolderPlan,
  apiSettings,
  apiSyncOutlookFolder,
  apiUpdateEvent,
  apiUpdateSettings,
} from "./api";
import {
  createEventWorkspace,
  type OutlookFolderPlan,
  type SaveResult,
  type SyncResult,
} from "./event-workspace";
import { LoginView } from "@/components/t2w/LoginView";

type State = {
  events: T2WEvent[];
  settings: Settings;
  spalten: ColumnKey[];
};

type Ctx = State & {
  bereit: boolean;
  ladefehler: string | null;
  neuesEvent: (input: {
    name: string;
    eventcode?: string;
    veranstalter: string;
    ort: string;
    start: string;
    ende?: string;
    status: T2WEvent["status"];
    verantwortlicher?: string;
    teilnehmer?: number;
    teilnehmerprognose?: number | null;
    sportart?: string;
    notizen: string;
  }) => Promise<T2WEvent>;
  updateEvent: (id: string, patch: Partial<T2WEvent>) => Promise<SaveResult>;
  syncOutlookFolder: (id: string) => Promise<SyncResult>;
  getOutlookFolderPlan: (id: string) => Promise<OutlookFolderPlan>;
  setSettings: (s: Settings) => Promise<void>;
  setSpalten: (c: ColumnKey[]) => void;
};

const StoreContext = createContext<Ctx | null>(null);

const initial: State = {
  events: [],
  settings: { outlookJahresordner: [], jahresSites: [], outlookMailbox: null },
  spalten: ALL_COLUMNS,
};

export function T2WProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [bereit, setBereit] = useState(false);
  const [ladefehler, setLadefehler] = useState<string | null>(null);
  const [angemeldet, setAngemeldet] = useState(true);
  const workspace = useMemo(
    () =>
      createEventWorkspace({
        save: apiUpdateEvent,
        syncOutlook: apiSyncOutlookFolder,
        outlookPlan: apiOutlookFolderPlan,
      }),
    [],
  );

  useEffect(() => {
    void (async () => {
      try {
        const [events, settings] = await Promise.all([apiEvents(), apiSettings()]);
        setState((current) => ({ ...current, events, settings }));
      } catch {
        setLadefehler("Die zentrale Eventquelle konnte nicht geladen werden.");
        setAngemeldet(false);
      } finally {
        setBereit(true);
      }
    })();
  }, []);

  const neuesEvent: Ctx["neuesEvent"] = useCallback(async (input) => {
    const ende = input.ende && input.ende.length ? input.ende : input.start;
    const created = await apiCreateEvent({
      name: input.name,
      eventcode: input.eventcode ?? "",
      veranstalter: input.veranstalter,
      start: input.start,
      ende,
      ort: input.ort,
      verantwortlicher: input.verantwortlicher ?? "",
      teilnehmerprognose: input.teilnehmerprognose ?? input.teilnehmer ?? 0,
      notizen: input.notizen,
      status: input.status,
    });
    setState((prev) => ({ ...prev, events: [...prev.events, created] }));
    return created;
  }, []);

  const updateEvent = useCallback(
    async (id: string, patch: Partial<T2WEvent>) => {
      const current = state.events.find((event) => event.id === id);
      if (!current) return { kind: "failed", error: new Error("EVENT_NOT_FOUND") } as const;
      const result = await workspace.save(current, patch);
      if (result.kind === "saved")
        setState((prev) => ({
          ...prev,
          events: prev.events.map((event) => (event.id === id ? result.event : event)),
        }));
      else
        setLadefehler(
          result.kind === "conflict"
            ? "Das Event wurde zwischenzeitlich geändert."
            : "Änderungen konnten nicht dauerhaft gespeichert werden.",
        );
      return result;
    },
    [state.events, workspace],
  );

  const syncOutlookFolder = useCallback(
    async (id: string) => {
      const result = await workspace.syncOutlook(id);
      if (result.kind === "synced")
        setState((prev) => ({
          ...prev,
          events: prev.events.map((event) => (event.id === id ? result.event : event)),
        }));
      return result;
    },
    [workspace],
  );

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      bereit,
      ladefehler,
      neuesEvent,
      updateEvent,
      syncOutlookFolder,
      getOutlookFolderPlan: workspace.outlookPlan,
      setSettings: async (s) => {
        const saved = await apiUpdateSettings(s);
        setState((p) => ({ ...p, settings: saved }));
      },
      setSpalten: (c) => setState((p) => ({ ...p, spalten: c })),
    }),
    [state, bereit, ladefehler, neuesEvent, updateEvent, syncOutlookFolder, workspace.outlookPlan],
  );

  if (!angemeldet)
    return (
      <LoginView
        onLogin={() => {
          setAngemeldet(true);
          setBereit(false);
          window.location.reload();
        }}
      />
    );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useT2W() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useT2W muss innerhalb von T2WProvider verwendet werden");
  return ctx;
}
