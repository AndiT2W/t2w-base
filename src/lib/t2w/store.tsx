import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { ColumnKey, Settings, T2WEvent } from "./types";
import { ALL_COLUMNS } from "./types";
import {
  configureApiAccess,
  createHttpEventTransport,
  apiCurrentUser,
  apiEvents,
  apiLogout,
  apiSettings,
  apiUpdateSettings,
  type CurrentUser,
} from "./api";
import {
  createEventWorkspace,
  type CreateEventInput,
  type EventEditingSession,
} from "./event-workspace";
import { LoginView } from "@/components/t2w/LoginView";
import {
  createSelectionListWorkspace,
  type SelectionListKind,
  type SelectionListSnapshot,
} from "./selection-list-workspace";
import { createHttpSelectionListAdapter } from "./selection-list-adapter";
import { configureCrmAccess } from "@/lib/crm/module";

type State = {
  settings: Settings;
  spalten: ColumnKey[];
};

type Ctx = State & {
  currentUser: CurrentUser;
  logout: () => Promise<void>;
  events: T2WEvent[];
  bereit: boolean;
  ladefehler: string | null;
  neuesEvent: (input: CreateEventInput) => Promise<T2WEvent>;
  loescheEvent: (id: string) => Promise<void>;
  kopiereEvent: (
    id: string,
    input: {
      name: string;
      eventcode: string;
      start: string;
      ende: string;
      createRelationship: boolean;
      version?: number;
    },
  ) => Promise<T2WEvent>;
  uebernehmeEvents: (events: T2WEvent[]) => void;
  openEventSession: (id: string) => EventEditingSession;
  setSettings: (s: Settings) => Promise<Settings>;
  setSpalten: (c: ColumnKey[]) => void;
  selectionLists: SelectionListSnapshot;
  createSelectionValue: (kind: SelectionListKind, name: string) => Promise<void>;
  updateSelectionValue: (
    kind: SelectionListKind,
    id: string,
    patch: {
      name?: string;
      active?: boolean;
      icon?: string | null;
      color?: string | null;
      sortOrder?: number;
    },
  ) => Promise<void>;
  reorderSelectionValues: (kind: SelectionListKind, id: string, beforeId: string) => Promise<void>;
};

const StoreContext = createContext<Ctx | null>(null);

const initial: State = {
  settings: { outlookJahresordner: [], jahresSites: [], outlookMailbox: null },
  spalten: ALL_COLUMNS,
};

export function T2WProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [bereit, setBereit] = useState(false);
  const [ladefehler, setLadefehler] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const workspace = useMemo(() => createEventWorkspace(createHttpEventTransport()), []);
  const selectionWorkspace = useMemo(
    () => createSelectionListWorkspace(createHttpSelectionListAdapter()),
    [],
  );
  const events = useSyncExternalStore(workspace.subscribe, workspace.events, workspace.events);
  const selectionLists = useSyncExternalStore(
    selectionWorkspace.subscribe,
    selectionWorkspace.snapshot,
    selectionWorkspace.snapshot,
  );
  const authFlow =
    typeof window !== "undefined" &&
    ["invite", "reset", "emailChange"].some((parameter) =>
      new URLSearchParams(window.location.search).has(parameter),
    );

  useEffect(() => {
    void (async () => {
      try {
        const user = await apiCurrentUser();
        configureApiAccess(user);
        configureCrmAccess(user);
        setCurrentUser(user);
        if (user.role !== "ORGANIZER") {
          const [events, settings] = await Promise.all([apiEvents(), apiSettings()]);
          workspace.load(events);
          setState((current) => ({ ...current, settings }));
          await selectionWorkspace.load().catch(() => undefined);
        }
      } catch (error) {
        if (error instanceof Error && error.message !== "AUTH_REQUIRED")
          setLadefehler("Die zentrale Datenquelle konnte nicht geladen werden.");
      } finally {
        setAuthChecked(true);
        setBereit(true);
      }
    })();
  }, [workspace, selectionWorkspace]);

  const neuesEvent: Ctx["neuesEvent"] = useCallback(
    (input) => workspace.create(input),
    [workspace],
  );
  const kopiereEvent: Ctx["kopiereEvent"] = useCallback(
    (id, input) => workspace.copy(id, input),
    [workspace],
  );
  const loescheEvent: Ctx["loescheEvent"] = useCallback((id) => workspace.remove(id), [workspace]);
  const uebernehmeEvents: Ctx["uebernehmeEvents"] = useCallback(
    (changedEvents) => workspace.apply(changedEvents),
    [workspace],
  );

  const setSettings = useCallback(async (settings: Settings) => {
    const saved = await apiUpdateSettings(settings);
    setState((current) => ({ ...current, settings: saved }));
    return saved;
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      currentUser: currentUser!,
      logout: async () => {
        await apiLogout();
        setCurrentUser(null);
      },
      events,
      bereit,
      ladefehler,
      neuesEvent,
      loescheEvent,
      kopiereEvent,
      uebernehmeEvents,
      openEventSession: workspace.openSession,
      setSettings,
      setSpalten: (c) => setState((p) => ({ ...p, spalten: c })),
      selectionLists,
      createSelectionValue: async (kind, name) => {
        await selectionWorkspace.create(kind, name);
      },
      updateSelectionValue: async (kind, id, patch) => {
        await selectionWorkspace.update(kind, id, patch);
      },
      reorderSelectionValues: async (kind, id, beforeId) => {
        await selectionWorkspace.reorder(kind, id, beforeId);
      },
    }),
    [
      state,
      currentUser,
      events,
      bereit,
      ladefehler,
      neuesEvent,
      loescheEvent,
      kopiereEvent,
      uebernehmeEvents,
      setSettings,
      workspace.openSession,
      selectionLists,
      selectionWorkspace,
    ],
  );

  if (!authChecked) return null;
  if (authFlow || !currentUser) return <LoginView onLogin={() => window.location.reload()} />;
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useT2W() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useT2W muss innerhalb von T2WProvider verwendet werden");
  return ctx;
}
