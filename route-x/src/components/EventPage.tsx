import { RegisterButton } from "components/RegisterButton";
import Image from "next/image";
import type { FC } from "react";
import type { Event } from "types/event";

type EventPageProps = {
  event: Event;
};

export const EventPage: FC<EventPageProps> = ({ event }) => {
  return (
    <section className="lg:w-240 lg:px-0 px-2 w-full mx-auto">
      <div className={"grid md:grid-cols-2 grid-cols-1 gap-6"}>
        <h1 className={"md:hidden block font-bold text-2xl truncate"}>
          {event.title}
        </h1>
        <Image
          src={event.image}
          width={405}
          height={514}
          alt="event image"
          className="rounded-3xl w-full"
        />
        <div className={"flex flex-col gap-4"}>
          <h1 className="md:block hidden font-bold text-3xl">{event.title}</h1>
          <span className={"text-white/70"}>
            Дата проведения: <span className={"text-white"}>{event.date}</span>
          </span>
          <span className={"whitespace-pre-line"}>{event.description}</span>
          {event.status === "active" && <RegisterButton />}
        </div>
      </div>
    </section>
  );
};
