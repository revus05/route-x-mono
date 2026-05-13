import Link from "next/link";
import { Icons } from "./ui/Icons";

type Document = {
  id: string;
  label: string;
  link: string;
};

const DocumentsPage = async () => {
  async function fetchDocuments(): Promise<Document[]> {
    const res = await fetch(`${process.env.GOOGLE_SHEET_URL}Документация`, {
      next: { revalidate: 30 }, // 30 sec
    });

    if (!res.ok) {
      throw new Error("Failed to fetch documents");
    }

    return res.json();
  }

  const documents = await fetchDocuments();

  return (
    <section
      className={"md:w-170 w-full 2xl:px-0 px-2 mx-auto flex flex-col gap-4"}
    >
      <h1 className="sm:text-[40px] text-[30px] font-bold">Документация</h1>
      <div className={"flex flex-col gap-4"}>
        <h2 className={"sm:text-2xl text-xl font-semibold"}>
          РЕГЛАМЕНТИРУЮЩИЕ ДОКУМЕНТЫ СЕЗОНА 2026
        </h2>
        <div className={"flex flex-col gap-2"}>
          {documents.map((document) => (
            <Link
              key={document.id}
              download
              href={document.link}
              target="_blank"
              className="text-accent hover:underline w-fit flex items-center gap-2"
            >
              <Icons.openExternal className="fill-white" />
              <span>{document.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DocumentsPage;
