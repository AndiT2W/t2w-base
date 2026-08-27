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
  apiCreateEvent,
  apiAddEventContact,
  apiRemoveEventContact,
  apiUpdateEventContactRole,
  apiCreateEventTask,
  apiUpdateEventTask,
  apiCreateEventFile,
  apiCreateEventActivity,
  apiEvents,
  apiOutlookFolderPlan,
  apiSettings,
  apiSyncOutlookFolder,
  apiUpdateEvent,
  apiUpdateSettings,
  apiManageSports,
  apiManageEventRoles,
  apiCreateSport,
  apiCreateEventRole,
  apiUpdateSport,
  apiUpdateEventRole,
} from "./api";
import {
  createEventWorkspace,
  type CreateEventInput,
  type OutlookFolderPlan,
  type SaveResult,
  type SyncResult,
} from "./event-workspace";
import { LoginView } from "@/components/t2w/LoginView";
import {
  createSelectionListWorkspace,
  type SelectionListKind,
  type SelectionListSnapshot,
} from "./selection-list-workspace";

type State = {
  settings: Settings;
  spalten: ColumnKey[];
};

type Ctx = State & {
  bereit: boolean;
  ladefehler: string | null;
  neuesEvent: (input: CreateEventInput) => Promise<T2WEvent>;
  updateEvent: (id: string, patch: Partial<T2WEvent>) => Promise<SaveResult>;
  syncOutlookFolder: (id: string) => Promise<SyncResult>;
  getOutlookFolderPlan: (id: string) => Promise<OutlookFolderPlan>;
  addEventContact: (id: string, contactId: string, role: string) => Promise<SaveResult>;
  removeEventContact: (id: string, contactId: string, role: string) => Promise<SaveResult>;
  updateEventContactRole: (
    id: string,
    contactId: string,
    role: string,
    nextRole: string,
  ) => Promise<SaveResult>;
  createEventTask: (id: string, input: { title: string }) => Promise<SaveResult>;
  updateEventTask: (
    id: string,
    taskId: string,
    input: { completed?: boolean },
  ) => Promise<SaveResult>;
  createEventFile: (id: string, input: { name: string }) => Promise<SaveResult>;
  createEventActivity: (
    id: string,
    input: { channel: string; subject: string },
  ) => Promise<SaveResult>;
  setSettings: (s: Settings) => Promise<Settings>;
  setSpalten: (c: ColumnKey[]) => void;
  selectionLists: SelectionListSnapshot;
  createSelectionValue: (kind: SelectionListKind, name: string) => Promise<void>;
  updateSelectionValue: (
    kind: SelectionListKind,
    id: string,
    patch: { name?: string; active?: boolean },
  ) => Promise<void>;
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
  const [angemeldet, setAngemeldet] = useState(true);
  const workspace = useMemo(
    () =>
      createEventWorkspace({
        create: apiCreateEvent,
        save: apiUpdateEvent,
        syncOutlook: apiSyncOutlookFolder,
        outlookPlan: apiOutlookFolderPlan,
        addContact: apiAddEventContact,
        removeContact: apiRemoveEventContact,
        updateContactRole: apiUpdateEventContactRole,
        createTask: apiCreateEventTask,
        updateTask: apiUpdateEventTask,
        createFile: apiCreateEventFile,
        createActivity: apiCreateEventActivity,
      }),
    [],
  );
  const selectionWorkspace = useMemo(
    () =>
      createSelectionListWorkspace({
        load: (kind) => (kind === "sports" ? apiManageSports() : apiManageEventRoles()),
        create: (kind, name) =>
          kind === "sports" ? apiCreateSport(name) : apiCreateEventRole(name),
        update: (kind, id, patch) =>
          kind === "sports" ? apiUpdateSport(id, patch) : apiUpdateEventRole(id, patch),
      }),
    [],
  );
  const events = useSyncExternalStore(workspace.subscribe, workspace.events, workspace.events);
  const selectionLists = useSyncExternalStore(
    selectionWorkspace.subscribe,
    selectionWorkspace.snapshot,
    selectionWorkspace.snapshot,
  );

  useEffect(() => {
    void (async () => {
      try {
        const [events, settings] = await Promise.all([apiEvents(), apiSettings()]);
        workspace.load(events);
        setState((current) => ({ ...current, settings }));
      } catch {
        setLadefehler("Die zentrale Eventquelle konnte nicht geladen werden.");
        setAngemeldet(false);
      } finally {
        setBereit(true);
      }
    })();
    void selectionWorkspace.load().catch(() => undefined);
  }, [workspace, selectionWorkspace]);

  const neuesEvent: Ctx["neuesEvent"] = useCallback(
    (input) => workspace.create(input),
    [workspace],
  );

  const updateEvent = useCallback(
    async (id: string, patch: Partial<T2WEvent>) => {
      const result = await workspace.save(id, patch);
      if (result.kind !== "saved")
        setLadefehler(
          result.kind === "conflict"
            ? "Das Event wurde zwischenzeitlich geändert."
            : "Änderungen konnten nicht dauerhaft gespeichert werden.",
        );
      return result;
    },
    [workspace],
  );

  const syncOutlookFolder = useCallback(
    async (id: string) => {
      const result = await workspace.syncOutlook(id);
      return result;
    },
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
      events,
      bereit,
      ladefehler,
      neuesEvent,
      updateEvent,
      syncOutlookFolder,
      getOutlookFolderPlan: workspace.outlookPlan,
      addEventContact: workspace.addContact,
      removeEventContact: workspace.removeContact,
      updateEventContactRole: workspace.updateContactRole,
      createEventTask: workspace.createTask,
      updateEventTask: workspace.updateTask,
      createEventFile: workspace.createFile,
      createEventActivity: workspace.createActivity,
      setSettings,
      setSpalten: (c) => setState((p) => ({ ...p, spalten: c })),
      selectionLists,
      createSelectionValue: async (kind, name) => {
        await selectionWorkspace.create(kind, name);
      },
      updateSelectionValue: async (kind, id, patch) => {
        await selectionWorkspace.update(kind, id, patch);
      },
    }),
    [
      state,
      events,
      bereit,
      ladefehler,
      neuesEvent,
      updateEvent,
      syncOutlookFolder,
      setSettings,
      workspace.outlookPlan,
      selectionLists,
      selectionWorkspace,
    ],
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
