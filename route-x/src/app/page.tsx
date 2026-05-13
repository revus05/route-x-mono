import { Events } from "components/events/Events";
import { HeroSection } from "components/HeroSection";
import { MediaSection } from "components/media/Media";
import { Partners } from "components/Partners";
import { PilotsHomePage } from "components/pilots-home-page/PilotsHomePage";
import { SeasonEvents } from "components/SeasonEvents";
import { TrackDays } from "components/TrackDays";
import { Trains } from "components/Trains";

export default function Home() {
  return (
    <>
      <HeroSection />
      <SeasonEvents />
      <Events />
      <TrackDays />
      <Trains />
      <PilotsHomePage />
      <MediaSection />
      <Partners />
    </>
  );
}
