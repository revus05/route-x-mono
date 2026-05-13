export type Event = {
  id: string;
  image: string;
  title: string;
  date: string;
  status: "active" | "completed";
  description: string;
};
