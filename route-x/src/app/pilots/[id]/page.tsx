import { PilotPage } from "components/pilots/PilotPage";
import { notFound } from "next/navigation";
import type { Car } from "types/car";
import type { Pilot } from "types/pilot";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  async function fetchPilots(): Promise<Pilot[]> {
    const res = await fetch(`${process.env.GOOGLE_SHEET_URL}Пилоты`, {
      next: { revalidate: 30 }, // 30 sec
    });

    if (!res.ok) {
      throw new Error("Failed to fetch pilots");
    }

    return res.json();
  }

  async function fetchCars(): Promise<Car[]> {
    const res = await fetch(`${process.env.GOOGLE_SHEET_URL}Машины+пилотов`, {
      next: { revalidate: 30 }, // 30 sec
    });

    if (!res.ok) {
      throw new Error("Failed to fetch cars");
    }

    return res.json();
  }

  const pilots = await fetchPilots();
  const cars = await fetchCars();

  const pilot = pilots.find((pilot) => pilot.id === id);

  if (!pilot) {
    notFound();
  }

  const pilotCarsIds = JSON.parse(pilot.cars) as number[];

  const pilotCars = cars.filter((car) => pilotCarsIds.includes(+car.id));

  return <PilotPage pilot={pilot} cars={pilotCars} />;
}
