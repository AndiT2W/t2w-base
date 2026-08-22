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
import { apiCreateEvent, apiEvents, apiSettings, apiUpdateEvent, apiUpdateSettings } from "./api";
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
  updateEvent: (id: string, patch: Partial<T2WEvent>) => void;
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

  const updateEvent = useCallback((id: string, patch: Partial<T2WEvent>) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.map((e) =>
        e.id === id ? { ...e, ...patch, eventcode: e.eventcode } : e,
      ),
    }));
    void apiUpdateEvent(id, patch).catch(() =>
      setLadefehler("Änderungen konnten nicht dauerhaft gespeichert werden."),
    );
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      bereit,
      ladefehler,
      neuesEvent,
      updateEvent,
      setSettings: async (s) => {
        const saved = await apiUpdateSettings(s);
        setState((p) => ({ ...p, settings: saved }));
      },
      setSpalten: (c) => setState((p) => ({ ...p, spalten: c })),
    }),
    [state, bereit, ladefehler, neuesEvent, updateEvent],
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
