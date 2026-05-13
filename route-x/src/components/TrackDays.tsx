import { RegisterButton } from "components/RegisterButton";
import Image from "next/image";
import poster from "../../public/poster.jpg";
import trainsBackground from "../../public/trains-background.png";
import trainsBackgroundGraffiti from "../../public/trains-background-graffiti.svg";
import trainsGraffiti from "../../public/trains-graffiti.svg";

type TrackDaysInfo = {
  leftPoster: string;
  text: string;
  rightPoster: string;
};

export const TrackDays = async () => {
  async function fetchTrackDaysUrl(): Promise<TrackDaysInfo[]> {
    const res = await fetch(`${process.env.GOOGLE_SHEET_URL}Трек+дни`, {
      next: { revalidate: 30 }, // 30 sec
    });

    if (!res.ok) {
      throw new Error("Failed to fetch events");
    }

    return res.json();
  }

  const trackDaysInfo = await fetchTrackDaysUrl();

  return (
    <section>
      <div
        className={
          "lg:w-214.5 w-full xl:px-0 px-2 mx-auto flex xl:gap-12 gap-6 lg:flex-row flex-col relative"
        }
      >
        <Image
          src={trainsBackground}
          alt="background"
          className="absolute top-88 left-10 -z-10 select-none"
        />
        <Image
          src={trainsGraffiti}
          alt="background"
          className="absolute bottom-12 -right-60 -z-10 select-none"
        />
        <Image
          src={trainsBackgroundGraffiti}
          alt="background"
          className="absolute bottom-12 -left-48 -z-10 select-none"
        />
        <div className={"grid md:grid-cols-3 grid-cols-2 md:gap-6 gap-4"}>
          <Image
            src={trackDaysInfo[0].leftPoster}
            alt="poster"
            width={poster.width}
            height={poster.height}
            className={
              "rounded-2xl w-[clamp(250px,100%,400px)] h-full mx-auto justify-self-end object-cover md:order-1 order-2"
            }
          />
          <div
            className={
              "flex flex-col gap-6 w-full col-span-2 md:col-span-1 md:order-2"
            }
          >
            <div className={"border-b-3 border-accent w-fit px-4 py-3 "}>
              <h2
                className={
                  "sm:text-[48px] text-[36px] font-semibold leading-7.5 whitespace-nowrap"
                }
              >
                Трек-дни
              </h2>
            </div>
            <div className={"flex flex-col gap-4"}>
              <span className={"whitespace-pre-line md:block hidden"}>
                {trackDaysInfo[0].text}
              </span>
              <div className={"md:block hidden"}>
                <RegisterButton />
              </div>
            </div>
          </div>
          <Image
            src={trackDaysInfo[0].rightPoster}
            alt="poster"
            width={poster.width}
            height={poster.height}
            className={
              "rounded-2xl w-[clamp(250px,100%,400px)] h-full mx-auto justify-self-end object-cover md:order-3 order-2"
            }
          />
          <div
            className={
              "md:hidden order-4 flex flex-col col-span-2 md:col-span-1 gap-4"
            }
          >
            <span className={"whitespace-pre-line md:hidden block"}>
              {trackDaysInfo[0].text}
            </span>
            <RegisterButton />
          </div>
        </div>
      </div>
    </section>
  );
};
