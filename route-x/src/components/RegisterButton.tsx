import { Icons } from "components/ui/Icons";
import { cn } from "lib/cn";

export const RegisterButton = () => {
  return (
    <a
      href="https://t.me/GymkhanaraceBot"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center justify-center gap-2.5 rounded-2xl whitespace-nowrap px-8 py-3 cursor-pointer font-bold w-fit active:scale-[0.98]",
        "bg-accent hover:bg-accent/70 text-black [&_svg]:fill-black",
        "hover:[&_svg]:ml-1.5 [&_svg]:transition-[margin] relative before:h-16 before:w-2",
        "before:bg-gray-400/70 before:rotate-30 before:absolute before:z-2 before:-left-4",
        "hover:before:translate-x-80 before:transition-transform hover:scale-[1.03] overflow-hidden"
      )}
    >
      Зарегистрироваться
      <Icons.chevronRight className="ml-0 shrink-0" />
    </a>
  );
};
