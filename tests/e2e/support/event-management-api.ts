import type { Page } from "@playwright/test";

const event = {
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
  notes: "",
  archived: false,
  organizer: { id: "c1", name: "Alter Veranstalter" },
  sport: null,
  outlookFolder: null,
  sharepointFolder: null,
};

export async function mockEventManagementApi(
  page: Page,
  eventOverride: Partial<typeof event> = {},
) {
  const requests: { method: string; url: string; body?: string }[] = [];
  let mockedEvent = { ...event, ...eventOverride };
  let settings = {
    outlookJahresordner: [{ jahr: "2026", url: "06_auftraege_26" }],
    jahresSites: [{ jahr: "2026", url: "https://old.example.com/sites/old" }],
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
      eventRoles: [],
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
  let eventRoles = [
    { id: "r1", name: "Anmeldung", active: true },
    { id: "r2", name: "Finanz", active: true },
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
          drifted: false,
        },
      });
    if (request.method() === "GET")
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([mockedEvent]),
      });
    if (request.method() === "POST") {
      const body = JSON.parse(request.postData() ?? "{}");
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
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...mockedEvent,
          organizer: { name: body.organizerName },
          name: body.name,
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
  return requests;
}
