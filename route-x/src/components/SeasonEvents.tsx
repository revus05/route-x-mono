import { cn } from "lib/cn";
import Image from "next/image";
import chequeredFlag from "../../public/chequered-flag.png";
import oval from "../../public/oval.svg";
import trophy from "../../public/trophy.png";

type SeasonEvent = {
  id: string;
  date: string;
  format: string;
  configuration: string;
  location: string;
};

export const SeasonEvents = async () => {
  async function fetchSeasonEvents(): Promise<SeasonEvent[]> {
    const res = await fetch(
      `${process.env.GOOGLE_SHEET_URL}Календарь+мероприятий`,
      {
        next: { revalidate: 30 }, // 30 sec
      },
    );

    if (!res.ok) {
      throw new Error("Failed to fetch season events");
    }

    return res.json();
  }

  const seasonEvents = await fetchSeasonEvents();

  return (
    <section className={"px-2 2xl:px-0 "}>
      <div className="relative w-fit mx-auto">
        <Image
          src={oval}
          alt={"oval"}
          className="absolute -top-6 -right-32 -z-1 select-none"
        />
        <div
          className={
            "2xl:w-7xl w-full mx-auto bg-black/50 backdrop-blur-lg md:px-8 md:py-6 sm:px-4 px-2 py-3 flex-col flex gap-8 rounded-2xl relative overflow-hidden"
          }
        >
          <h2 className={"font-semibold text-2xl text-center"}>
            Сезонный календарь мероприятий
          </h2>
          <table className={"w-full min-w-0 table-fixed"}>
            <tbody>
              {seasonEvents.map((seasonEvent, index) => (
                <tr
                  key={seasonEvent.id}
                  className={cn(
                    "border-b border-white/30",
                    index % 2 !== 0 && `text-accent`,
                  )}
                >
                  <td
                    className={
                      "lg:text-xl md:text-base sm:text-sm text-[11px] md:pr-1 px-1 font-semibold py-1.5 uppercase"
                    }
                  >
                    <div className={"line-clamp-3"}>
                      {seasonEvent.date || "—"}
                    </div>
                  </td>
                  <td
                    className={
                      "lg:text-xl md:text-base sm:text-sm text-[11px] px-1 font-semibold py-1.5 uppercase md:px-2"
                    }
                  >
                    <div className={"line-clamp-3 flex gap-2"}>
                      {seasonEvent.format.startsWith("🏆") && (
                          <Image src={trophy.src} width={24} height={24} alt="trophy" className="h-fit shrink-0 md:size-6 sm:size-5 size-4" />
                      )}
                      {seasonEvent.format.startsWith("🏁") && (
                          <Image src={chequeredFlag.src} width="24" height="24" alt="chequeredFlag" className="h-fit shrink-0 md:size-6 sm:size-5 size-4" />
                      )}
                      {[...(seasonEvent.format || "")].slice(1).join("") || "—"}
                    </div>
                  </td>
                  <td
                    className={
                      "lg:text-xl md:text-base sm:text-sm text-[11px] px-1 font-semibold py-1.5 uppercase md:px-2"
                    }
                  >
                    <div className={"line-clamp-3"}>
                      {seasonEvent.configuration || "—"}
                    </div>
                  </td>
                  <td
                    className={
                      "lg:text-xl md:text-base sm:text-sm text-[11px] pl-1 font-semibold py-1.5 uppercase md:pl-2"
                    }
                  >
                    <div className={"line-clamp-3"}>
                      {seasonEvent.location || "—"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div
            className={
              "w-89.5 h-57.5 -rotate-130 bg-accent blur-[100px] absolute opacity-20 -left-16 -bottom-16"
            }
          />
          <div
            className={
              "w-92.25 h-59.25 bg-accent blur-[100px] absolute opacity-20 left-64 top-full rotate-180 -translate-y-1/2"
            }
          />
          <div
            className={
              "w-89.5 h-57.5 bg-accent blur-[100px] absolute opacity-20 right-0 -top-16 rotate-30"
            }
          />
          <div
            className={
              "w-108.5 h-46.5 bg-[#FF8D28] blur-[100px] absolute opacity-20 right-0 top-32 rotate-160"
            }
          />
        </div>
      </div>
    </section>
  );
};
