import { EventsList } from "components/events/EventsList";
import type { Event } from "types/event";

export const Events = async () => {
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

  return (
    <section id="events_section" className="scroll-mt-36">
      <EventsList events={events} />
    </section>
  );
};
