import { EventPage } from "components/EventPage";
import type { Event } from "types/event";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  async function fetchEvents(): Promise<Event[]> {
    const res = await fetch(`${process.env.GOOGLE_SHEET_URL}Мероприятия`, {
      next: { revalidate: 30 }, // 30 sec
    });

    if (!res.ok) {
      throw new Error("Failed to fetch events");
    }

    return res.json();
  }

  const events = await fetchEvents();

  const event = events.find((e) => e.id === id);

  if (!event) {
    return <span>Нет мероприятия с таким id</span>;
  }

  return <EventPage event={event} />;
}
