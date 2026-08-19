import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEMO_EVENTS, DEMO_SETTINGS } from "./demo";
import { buildEventcode } from "./eventcode";
import type { ColumnKey, Settings, T2WEvent } from "./types";
import { ALL_COLUMNS } from "./types";

const KEY = "t2w-demo-state-v1";

type State = {
  events: T2WEvent[];
  settings: Settings;
  spalten: ColumnKey[];
};

type Ctx = State & {
  bereit: boolean;
  neuesEvent: (input: {
    name: string;
    veranstalter: string;
    ort: string;
    start: string;
    ende?: string;
    status: T2WEvent["status"];
    verantwortlicher: string;
    risiko: T2WEvent["risiko"];
    teilnehmer: number;
    notizen: string;
  }) => T2WEvent;
  updateEvent: (id: string, patch: Partial<T2WEvent>) => void;
  setSettings: (s: Settings) => void;
  setSpalten: (c: ColumnKey[]) => void;
  zuruecksetzen: () => void;
};

const StoreContext = createContext<Ctx | null>(null);

const initial: State = {
  events: DEMO_EVENTS,
  settings: DEMO_SETTINGS,
  spalten: ALL_COLUMNS,
};

export function T2WProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [bereit, setBereit] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setState({ ...initial, ...(JSON.parse(raw) as State) });
    } catch {
      /* Demo-Zustand ignorieren */
    }
    setBereit(true);
  }, []);

  useEffect(() => {
    if (!bereit) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* Speicher nicht verfügbar */
    }
  }, [state, bereit]);

  const neuesEvent: Ctx["neuesEvent"] = useCallback((input) => {
    const ende = input.ende && input.ende.length ? input.ende : input.start;
    let created: T2WEvent | null = null;
    setState((prev) => {
      const code = buildEventcode(
        input.name,
        input.start,
        prev.events.map((e) => e.eventcode),
      );
      const ev: T2WEvent = {
        id: `e-${Date.now()}`,
        eventcode: code,
        name: input.name,
        veranstalter: input.veranstalter,
        ort: input.ort,
        start: input.start,
        ende,
        status: input.status,
        verantwortlicher: input.verantwortlicher,
        risiko: input.risiko,
        teilnehmer: input.teilnehmer,
        archiviert: false,
        notizen: input.notizen,
        outlookOrdner: null,
        sharepointOrdner: null,
        kontakte: [],
        aufgaben: [],
        dateien: [],
        kommunikation: [],
      };
      created = ev;
      return { ...prev, events: [...prev.events, ev] };
    });
    return created as unknown as T2WEvent;
  }, []);

  const updateEvent = useCallback((id: string, patch: Partial<T2WEvent>) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.map((e) =>
        e.id === id ? { ...e, ...patch, eventcode: e.eventcode } : e,
      ),
    }));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      bereit,
      neuesEvent,
      updateEvent,
      setSettings: (s) => setState((p) => ({ ...p, settings: s })),
      setSpalten: (c) => setState((p) => ({ ...p, spalten: c })),
      zuruecksetzen: () => setState(initial),
    }),
    [state, bereit, neuesEvent, updateEvent],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useT2W() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useT2W muss innerhalb von T2WProvider verwendet werden");
  return ctx;
}
