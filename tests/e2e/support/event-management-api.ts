import type { Page } from "@playwright/test";

export const event = {
  id: "11111111-1111-4111-8111-111111111111",
  eventCode: "260820_demo_event",
  name: "Bestehendes Event",
  status: "ANFRAGE",
  startAt: "2026-08-20T00:00:00.000Z",
  endAt: "2026-08-20T00:00:00.000Z",
  location: "Wien",
  responsible: "Andi",
  participantForecast: 10,
  participantCurrent: null,
  clickUpId: null as string | null,
  t2wEventId: null,
  time2winSyncStatus: "NEVER",
  time2winLastSuccessAt: null,
  time2winLastError: null,
  time2winSnapshot: null,
  seriesId: null as string | null,
  notes: "",
  services: [] as { service: { id: string; name: string } }[],
  archived: false,
  organizer: { id: "c1", name: "Alter Veranstalter" },
  sport: null,
  outlookFolder: null,
  outlookWebUrl: null,
  outlookFolderId: null,
  outlookFolderSyncStatus: "NEVER",
  outlookFolderLastSuccessAt: null,
  outlookFolderLastError: null,
  outlookMessageSyncStatus: "NEVER",
  outlookMessageLastSuccessAt: null,
  outlookMessageLastError: null,
  communicationMessages: [] as {
    id: string;
    direction: "INCOMING" | "OUTGOING";
    author: string;
    recipients: string;
    subject: string;
    preview: string;
    occurredAt: string;
    hasAttachments: boolean;
    webUrl: string | null;
    conversationId?: string | null;
    topicId?: string | null;
  }[],
  sharepointFolder: null,
  contacts: [] as {
    role: string;
    contact: { id: string; name: string; email: string | null; phone: string | null };
  }[],
};

/**
 * Die Fixtures liegen fest im August 2026 — das Demo-Event am 20.08., der
 * Feiertag am 15.08., der Folgetermin 2027.  Ohne feste Uhr laufen alle
 * Erwartungen weg, sobald der Kalender einen anderen Monat aufschlägt oder
 * "Nächste 14 Tage" ins Leere greift.  Gemessen wird deshalb immer vom
 * 20.08.2026, dem Tag des Demo-Events.
 *
 * `setFixedTime` friert nur `Date.now()` ein; Zeitgeber laufen weiter, anders
 * als bei `clock.install()`.  Muss vor dem ersten `goto` gesetzt sein.
 */
export const TESTZEIT = new Date("2026-08-20T09:00:00.000Z");

export async function mockEventManagementApi(
  page: Page,
  eventOverride: Partial<typeof event> = {},
  relatedEventOverride: Partial<typeof event> = {},
  additionalEventOverrides: Partial<typeof event>[] = [],
) {
  await page.clock.setFixedTime(TESTZEIT);
  const requests: { method: string; url: string; body?: string }[] = [];
  let mockedEvent = { ...event, ...eventOverride };
  let relatedEvent = {
    ...event,
    id: "33333333-3333-4333-8333-333333333333",
    eventCode: "270821_demo_event",
    name: "Folgetermin",
    startAt: "2027-08-21T00:00:00.000Z",
    endAt: "2027-08-21T00:00:00.000Z",
    ...relatedEventOverride,
  };
  let additionalEvents = additionalEventOverrides.map((override) => ({ ...event, ...override }));
  let copiedEvents: (typeof mockedEvent)[] = [];
  let eventDeleted = false;
  let settings = {
    outlookJahresordner: [{ jahr: "2026", url: "06_auftraege_26" }],
    jahresSites: [{ jahr: "2026", url: "https://old.example.com/sites/old" }],
    outlookMailbox: "info@time2win.at",
  };
  let contacts = [
    {
      id: "p1",
      name: "Marion Kessler",
      firstName: "Marion",
      lastName: "Kessler",
      email: "m.kessler@nordwerk.de",
      phone: "+49 40",
      note: "",
      organizers: [{ organizer: { id: "c1" } }],
      customerProfile: null,
      eventRoles: [
        { role: "Anmeldung", event: { eventCode: "260820_demo_event", name: "Bestehendes Event" } },
        { role: "Finanz", event: { eventCode: "260820_demo_event", name: "Bestehendes Event" } },
      ],
    },
    {
      id: "p3",
      name: "Jonas Feld",
      firstName: "Jonas",
      lastName: "Feld",
      email: "jonas@feld.at",
      phone: "+43 664",
      note: "",
      organizers: [{ organizer: { id: "c1" } }, { organizer: { id: "c2" } }],
      customerProfile: { id: "c2" },
      eventRoles: [],
    },
    {
      id: "p4",
      name: "Eva Beispiel",
      firstName: "Eva",
      lastName: "Beispiel",
      email: "eva@example.at",
      phone: "",
      note: "",
      organizers: [],
      customerProfile: null,
      eventRoles: [],
    },
  ];
  let organizers = [
    {
      id: "c1",
      name: "Nordwerk GmbH",
      type: "ORGANISATION",
      active: true,
      uid: "DE1",
      contacts: [{ contact: { id: "p1" } }, { contact: { id: "p3" } }],
      events: [{ eventCode: "260820_demo_event", name: "Bestehendes Event" }],
      payoutEvents: [{ eventCode: "260820_demo_event", name: "Bestehendes Event" }],
      personId: null,
    },
    {
      id: "c2",
      name: "Jonas Feld",
      type: "PERSON",
      active: true,
      uid: "ATU1",
      iban: "AT611904300234573201",
      bic: "BKAUATWW",
      street: "Hauptstraße 4",
      postalCode: "1010",
      city: "Wien",
      country: "Österreich",
      contacts: [{ contact: { id: "p3" } }],
      personId: "p3",
    },
  ];
  let sports = [
    { id: "s1", name: "Triathlon", active: true },
    { id: "s2", name: "Laufen", active: true },
  ];
  let hardwareObjects = [
    { id: "hardware-1", name: "Active Transponder (T2W)", active: true },
    { id: "hardware-2", name: "GPS Tracker (T2W)", active: true },
    { id: "hardware-3", name: "Active Transponder (Lindinger)", active: true },
    { id: "hardware-4", name: "Active Transponder (BRV)", active: true },
  ];
  let eventRoles = [
    { id: "r1", name: "Anmeldung", active: true },
    { id: "r2", name: "Finanz", active: true },
  ];
  let communicationChannels = [
    { id: "channel-1", name: "E-Mail", icon: "mail", color: "slate", active: true },
    { id: "channel-2", name: "Telefon", icon: "phone", color: "slate", active: true },
    { id: "channel-3", name: "Notiz", icon: "sticky-note", color: "slate", active: true },
  ];
  let communicationTopics = [
    { id: "topic-1", name: "Teilnehmer", icon: "users", color: "sky", active: true },
    { id: "topic-2", name: "Rechnung", icon: "euro", color: "emerald", active: true },
  ];
  let services = [
    { id: "service-1", name: "UHF", active: true },
    { id: "service-2", name: "Active", active: true },
    { id: "service-3", name: "Streaming", active: true },
    { id: "service-4", name: "Foto", active: true },
    { id: "service-5", name: "Video (iRewind)", active: true },
    { id: "service-6", name: "GPS", active: true },
    { id: "service-7", name: "Virtuell", active: true },
    { id: "service-8", name: "Anmeldung (only)", active: true },
    { id: "service-9", name: "App", active: true },
    { id: "service-10", name: "Jörg", active: true },
  ];
  await page.route("**/api/v1/settings", async (route) => {
    const request = route.request();
    requests.push({
      method: request.method(),
      url: request.url(),
      body: request.postData() ?? undefined,
    });
    if (request.method() === "GET")
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(settings),
      });
    if (request.method() === "PATCH") {
      settings = JSON.parse(request.postData() ?? "{}");
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(settings),
      });
    }
    return route.continue();
  });
  await page.route("**/api/v1/events**", async (route) => {
    const request = route.request();
    requests.push({
      method: request.method(),
      url: request.url(),
      body: request.postData() ?? undefined,
    });
    if (request.method() === "GET" && request.url().endsWith("/outlook-folder/plan"))
      return route.fulfill({
        json: {
          year: "2026",
          yearFolderName: "06_auftraege_26",
          quarter: "Q3",
          eventFolderName: mockedEvent.eventCode,
          path: `06_auftraege_26/Q3/${mockedEvent.eventCode}`,
          drifted: mockedEvent.outlookFolder?.includes("/Q2/") ?? false,
          existence: mockedEvent.outlookFolderId ? "EXISTS" : "MISSING",
        },
      });
    if (request.method() === "GET")
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          ...(eventDeleted ? [] : [mockedEvent]),
          relatedEvent,
          ...additionalEvents,
          ...copiedEvents,
        ]),
      });
    if (request.method() === "DELETE") {
      eventDeleted = true;
      return route.fulfill({ status: 204 });
    }
    const topicAssignment = /\/communication\/([^/]+)\/topic$/.exec(request.url());
    if (topicAssignment && request.method() === "PATCH") {
      const entryId = topicAssignment[1];
      const assigned = JSON.parse(request.postData() ?? "{}").topicId ?? null;
      mockedEvent = {
        ...mockedEvent,
        communicationMessages: (mockedEvent.communicationMessages ?? []).map((message) =>
          message.id === entryId ? { ...message, topicId: assigned } : message,
        ),
      };
      return route.fulfill({ json: mockedEvent });
    }
    if (request.method() === "POST") {
      const body = JSON.parse(request.postData() ?? "{}");
      if (request.url().endsWith("/copy")) {
        mockedEvent = body.createRelationship
          ? { ...mockedEvent, seriesId: "series-1" }
          : mockedEvent;
        const copied = {
          ...mockedEvent,
          id: "22222222-2222-4222-8222-222222222222",
          eventCode: body.eventCode,
          name: body.name,
          startAt: `${body.startAt}T00:00:00.000Z`,
          endAt: `${body.endAt}T00:00:00.000Z`,
          seriesId: body.createRelationship ? "series-1" : null,
          t2wEventId: null,
          participantCurrent: null,
          tasks: [],
          files: [],
          activities: [],
          communicationMessages: [],
          outlookFolder: null,
          outlookFolderId: null,
          sharepointFolder: null,
        };
        copiedEvents = [...copiedEvents, copied];
        return route.fulfill({ status: 201, json: copied });
      }
      if (request.url().endsWith("/outlook-messages/sync")) {
        mockedEvent = {
          ...mockedEvent,
          outlookMessageSyncStatus: "SUCCESS",
          outlookMessageLastSuccessAt: "2026-08-30T08:20:00.000Z",
          outlookMessageLastError: null,
          communicationMessages: [
            {
              id: "message-1",
              direction: "INCOMING",
              author: "Eva Beispiel <eva@example.at>",
              recipients: "TIME2WIN <info@time2win.at>",
              subject: "Startzeit bestätigt",
              preview:
                "Der Start bleibt um 09:00 Uhr. Bitte gebt den aktualisierten Ablauf auch an das Helferteam weiter, damit alle rechtzeitig informiert sind. Diese ausführliche Nachricht dient als Regressionstest für die aufklappbare Vorschau.",
              occurredAt: "2026-08-30T08:15:00.000Z",
              hasAttachments: true,
              webUrl: "https://outlook.office.com/mail/deeplink/read/mail-1",
              conversationId: "conversation-1",
            },
            {
              id: "message-2",
              direction: "OUTGOING",
              author: "TIME2WIN <info@time2win.at>",
              recipients: "Eva Beispiel <eva@example.at>",
              subject: "Zeitplan an das Team gesendet",
              preview: "Im Anhang findet ihr den aktuellen Zeitplan.",
              occurredAt: "2026-08-30T08:18:00.000Z",
              hasAttachments: true,
              webUrl: "https://outlook.office.com/mail/deeplink/read/mail-2",
              conversationId: "conversation-1",
            },
          ],
        };
        return route.fulfill({ status: 200, json: mockedEvent });
      }
      if (request.url().endsWith("/time2win/sync")) {
        mockedEvent = {
          ...mockedEvent,
          participantCurrent: 300,
          time2winSyncStatus: "SUCCESS",
          time2winLastSuccessAt: "2026-08-28T12:00:00.000Z",
          time2winLastError: null,
          time2winSnapshot: {
            eventId: 1082,
            name: "OstseeMan Triathlon 2027",
            sportName: "Triathlon",
            races: [{ id: 7709, name: "OstseeMan Langdistanz", participantCount: 300 }],
          },
        };
        return route.fulfill({ status: 200, json: { kind: "synced", event: mockedEvent } });
      }
      if (request.url().endsWith("/outlook-folder/sync")) {
        mockedEvent = {
          ...mockedEvent,
          outlookFolder: `06_auftraege_26/Q3/${mockedEvent.eventCode}`,
          outlookWebUrl: "https://outlook.cloud.microsoft/mail/info%40time2win.at/event-folder-id",
          outlookFolderId: "event-folder-id",
          outlookFolderSyncStatus: "SUCCESS",
          outlookFolderLastSuccessAt: "2026-08-28T12:00:00.000Z",
          outlookFolderLastError: null,
        };
        return route.fulfill({ status: 200, json: mockedEvent });
      }
      const eventContact = request.url().match(/\/events\/[^/]+\/contacts\/([^/?]+)$/);
      if (eventContact) {
        const contact = contacts.find((candidate) => candidate.id === eventContact[1]);
        mockedEvent = {
          ...mockedEvent,
          contacts: contact
            ? [
                ...(mockedEvent.contacts ?? []),
                {
                  role: body.role,
                  contact: {
                    id: contact.id,
                    name: contact.name,
                    email: contact.email,
                    phone: contact.phone,
                  },
                },
              ]
            : mockedEvent.contacts,
        };
        return route.fulfill({ status: 201, json: mockedEvent });
      }
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ...mockedEvent,
          id: "22222222-2222-4222-8222-222222222222",
          eventCode: body.eventCode,
          name: body.name,
          organizer: { name: body.organizerName },
        }),
      });
    }
    if (request.method() === "PATCH") {
      const body = JSON.parse(request.postData() ?? "{}");
      if (request.url().endsWith("/series")) {
        const targetEventIds = new Set<string>(
          body.targetEventIds ?? (body.targetEventId ? [body.targetEventId] : []),
        );
        const previousSeriesId = mockedEvent.seriesId;
        const targetSeriesId = previousSeriesId ?? "series-1";
        const affectedIds = new Set(
          [relatedEvent, ...additionalEvents, ...copiedEvents]
            .filter(
              (candidate) =>
                targetEventIds.has(candidate.id) ||
                (previousSeriesId && candidate.seriesId === previousSeriesId),
            )
            .map((candidate) => candidate.id),
        );
        const applySeriesSelection = (candidate: typeof mockedEvent) => ({
          ...candidate,
          seriesId: targetEventIds.has(candidate.id)
            ? targetSeriesId
            : previousSeriesId && candidate.seriesId === previousSeriesId
              ? null
              : candidate.seriesId,
        });
        relatedEvent = applySeriesSelection(relatedEvent);
        additionalEvents = additionalEvents.map(applySeriesSelection);
        copiedEvents = copiedEvents.map(applySeriesSelection);
        mockedEvent = {
          ...mockedEvent,
          seriesId: targetEventIds.size ? targetSeriesId : null,
          version: (mockedEvent.version ?? 0) + 1,
        };
        return route.fulfill({
          status: 200,
          json: [
            mockedEvent,
            ...[relatedEvent, ...additionalEvents, ...copiedEvents].filter((candidate) =>
              affectedIds.has(candidate.id),
            ),
          ],
        });
      }
      const eventContact = request.url().match(/\/events\/[^/]+\/contacts\/([^/]+)\/([^/?]+)$/);
      if (eventContact) {
        const contactId = eventContact[1];
        const previousRole = decodeURIComponent(eventContact[2]);
        mockedEvent = {
          ...mockedEvent,
          contacts: mockedEvent.contacts.map((entry) =>
            entry.contact.id === contactId && entry.role === previousRole
              ? { ...entry, role: body.role }
              : entry,
          ),
        };
        return route.fulfill({ status: 200, json: mockedEvent });
      }
      const sport = sports.find((candidate) => candidate.id === body.sportId);
      const selectedServices = services.filter((candidate) =>
        body.serviceIds?.includes(candidate.id),
      );
      mockedEvent = {
        ...mockedEvent,
        ...body,
        sport: sport ? { id: sport.id, name: sport.name } : mockedEvent.sport,
        services: body.serviceIds
          ? selectedServices.map((service) => ({ service }))
          : mockedEvent.services,
      };
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...mockedEvent,
          organizer: body.organizerId
            ? organizers.find((candidate) => candidate.id === body.organizerId)
            : mockedEvent.organizer,
        }),
      });
    }
    return route.continue();
  });
  await page.route("**/api/v1/contacts**", async (route) => {
    const request = route.request();
    const id = request.url().match(/\/contacts\/([^/]+)$/)?.[1];
    if (request.method() === "GET") return route.fulfill({ json: contacts });
    const body = JSON.parse(request.postData() ?? "{}");
    if (request.method() === "POST") {
      const created = {
        id: `p-created-${contacts.length + 1}`,
        ...body,
        organizers: [],
        customerProfile: null,
        eventRoles: [],
      };
      contacts = [...contacts, created];
      return route.fulfill({ status: 201, json: created });
    }
    if (request.method() === "PATCH" && id) {
      contacts = contacts.map((contact) => (contact.id === id ? { ...contact, ...body } : contact));
      return route.fulfill({ json: contacts.find((contact) => contact.id === id) });
    }
    return route.continue();
  });
  await page.route("**/api/v1/organizers**", async (route) => {
    const request = route.request();
    requests.push({
      method: request.method(),
      url: request.url(),
      body: request.postData() ?? undefined,
    });
    const link = request.url().match(/\/organizers\/([^/]+)\/contacts\/([^/]+)$/);
    if (link && (request.method() === "PUT" || request.method() === "DELETE")) {
      const [, customerId, personId] = link;
      const adding = request.method() === "PUT";
      organizers = organizers.map((customer) =>
        customer.id === customerId
          ? {
              ...customer,
              contacts: adding
                ? [
                    ...customer.contacts.filter(({ contact }) => contact.id !== personId),
                    { contact: { id: personId } },
                  ]
                : customer.contacts.filter(({ contact }) => contact.id !== personId),
            }
          : customer,
      );
      contacts = contacts.map((person) =>
        person.id === personId
          ? {
              ...person,
              organizers: adding
                ? [
                    ...person.organizers.filter(({ organizer }) => organizer.id !== customerId),
                    { organizer: { id: customerId } },
                  ]
                : person.organizers.filter(({ organizer }) => organizer.id !== customerId),
            }
          : person,
      );
      return route.fulfill({ status: 204 });
    }
    const id = request.url().match(/\/organizers\/([^/]+)$/)?.[1];
    if (request.method() === "GET") return route.fulfill({ json: organizers });
    const body = JSON.parse(request.postData() ?? "{}");
    if (request.method() === "POST") {
      const created = {
        id: `c${organizers.length + 1}`,
        ...body,
        type: body.personId ? "PERSON" : "ORGANISATION",
        active: true,
        contacts: [],
        personId: body.personId ?? null,
      };
      organizers = [...organizers, created];
      return route.fulfill({ status: 201, json: created });
    }
    if (request.method() === "PATCH" && id) {
      organizers = organizers.map((customer) =>
        customer.id === id ? { ...customer, ...body } : customer,
      );
      return route.fulfill({ json: organizers.find((customer) => customer.id === id) });
    }
    return route.continue();
  });
  await page.route("**/api/v1/sports**", async (route) => {
    const request = route.request();
    if (request.method() === "GET")
      return route.fulfill({
        json: request.url().includes("includeInactive=true")
          ? sports
          : sports.filter((sport) => sport.active),
      });
    const body = JSON.parse(request.postData() ?? "{}");
    if (request.method() === "POST") {
      const sport = { id: `s${sports.length + 1}`, name: body.name, active: true };
      sports = [...sports, sport];
      return route.fulfill({ status: 201, json: sport });
    }
    const id = request.url().match(/\/sports\/([^/?]+)/)?.[1];
    if (request.method() === "PATCH" && id) {
      sports = sports.map((sport) => (sport.id === id ? { ...sport, ...body } : sport));
      return route.fulfill({ json: sports.find((sport) => sport.id === id) });
    }
    return route.continue();
  });
  await page.route("**/api/v1/hardware-objects**", async (route) => {
    const request = route.request();
    if (request.method() === "GET")
      return route.fulfill({
        json: request.url().includes("includeInactive=true")
          ? hardwareObjects
          : hardwareObjects.filter((value) => value.active),
      });
    const body = JSON.parse(request.postData() ?? "{}");
    if (request.method() === "POST") {
      const value = {
        id: `hardware-${hardwareObjects.length + 1}`,
        name: body.name,
        active: true,
      };
      hardwareObjects = [...hardwareObjects, value];
      return route.fulfill({ status: 201, json: value });
    }
    const id = request.url().match(/\/hardware-objects\/([^/?]+)/)?.[1];
    if (request.method() === "PATCH" && id) {
      hardwareObjects = hardwareObjects.map((value) =>
        value.id === id ? { ...value, ...body } : value,
      );
      return route.fulfill({ json: hardwareObjects.find((value) => value.id === id) });
    }
    return route.continue();
  });
  await page.route("**/api/v1/event-roles**", async (route) => {
    const request = route.request();
    if (request.method() === "GET")
      return route.fulfill({
        json: request.url().includes("includeInactive=true")
          ? eventRoles
          : eventRoles.filter((role) => role.active),
      });
    const body = JSON.parse(request.postData() ?? "{}");
    if (request.method() === "POST") {
      const role = { id: `r${eventRoles.length + 1}`, name: body.name, active: true };
      eventRoles = [...eventRoles, role];
      return route.fulfill({ status: 201, json: role });
    }
    const id = request.url().match(/\/event-roles\/([^/?]+)/)?.[1];
    if (request.method() === "PATCH" && id) {
      eventRoles = eventRoles.map((role) => (role.id === id ? { ...role, ...body } : role));
      return route.fulfill({ json: eventRoles.find((role) => role.id === id) });
    }
    return route.continue();
  });
  await page.route("**/api/v1/communication-topics**", async (route) => {
    const request = route.request();
    if (request.method() === "GET")
      return route.fulfill({
        json: request.url().includes("includeInactive=true")
          ? communicationTopics
          : communicationTopics.filter((topic) => topic.active),
      });
    const body = JSON.parse(request.postData() ?? "{}");
    if (request.method() === "POST") {
      const topic = {
        id: `topic-${communicationTopics.length + 1}`,
        name: body.name,
        icon: null as string | null,
        color: null as string | null,
        active: true,
      };
      communicationTopics = [...communicationTopics, topic];
      return route.fulfill({ status: 201, json: topic });
    }
    const id = request.url().match(/\/communication-topics\/([^/?]+)/)?.[1];
    if (request.method() === "PATCH" && id) {
      communicationTopics = communicationTopics.map((topic) =>
        topic.id === id ? { ...topic, ...body } : topic,
      );
      return route.fulfill({ json: communicationTopics.find((topic) => topic.id === id) });
    }
    return route.continue();
  });
  await page.route("**/api/v1/communication-channels**", async (route) => {
    const request = route.request();
    if (request.method() === "GET")
      return route.fulfill({
        json: request.url().includes("includeInactive=true")
          ? communicationChannels
          : communicationChannels.filter((channel) => channel.active),
      });
    const body = JSON.parse(request.postData() ?? "{}");
    if (request.method() === "POST") {
      const channel = {
        id: `channel-${communicationChannels.length + 1}`,
        name: body.name,
        icon: null as string | null,
        color: null as string | null,
        active: true,
      };
      communicationChannels = [...communicationChannels, channel];
      return route.fulfill({ status: 201, json: channel });
    }
    const id = request.url().match(/\/communication-channels\/([^/?]+)/)?.[1];
    if (request.method() === "PATCH" && id) {
      communicationChannels = communicationChannels.map((channel) =>
        channel.id === id ? { ...channel, ...body } : channel,
      );
      return route.fulfill({ json: communicationChannels.find((channel) => channel.id === id) });
    }
    return route.continue();
  });
  await page.route("**/api/v1/services**", async (route) => {
    const request = route.request();
    if (request.method() === "GET")
      return route.fulfill({
        json: request.url().includes("includeInactive=true")
          ? services
          : services.filter((service) => service.active),
      });
    const body = JSON.parse(request.postData() ?? "{}");
    if (request.method() === "POST") {
      const service = { id: `service-${services.length + 1}`, name: body.name, active: true };
      services = [...services, service];
      return route.fulfill({ status: 201, json: service });
    }
    const id = request.url().match(/\/services\/([^/?]+)/)?.[1];
    if (request.method() === "PATCH" && id) {
      services = services.map((service) => (service.id === id ? { ...service, ...body } : service));
      return route.fulfill({ json: services.find((service) => service.id === id) });
    }
    return route.continue();
  });
  return requests;
}
