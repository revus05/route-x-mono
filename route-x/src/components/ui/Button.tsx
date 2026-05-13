"use client";

import { cva } from "class-variance-authority";
import { Icons } from "components/ui/Icons";
import { cn } from "lib/cn";
import { useRouter } from "next/navigation";
import React, { type ComponentProps, createElement, type FC } from "react";
import type { VariantProps } from "tailwind-variants";

const buttonVariants = cva(
  "flex items-center justify-center gap-2.5 rounded-2xl whitespace-nowrap px-8 py-3 cursor-pointer font-bold w-fit active:scale-[0.98] active:outline-4 disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-accent hover:bg-accent/70 outline-accent/30 text-black [&_svg]:fill-black",
        ghost:
          "bg-transparent hover:bg-white/10 hover:backdrop-blur-lg outline-white/30 text-accent [&_svg]:fill-accent",
        hover:
          "bg-white/10 hover:bg-accent outline-accent/30 text-white [&_svg]:fill-white hover:text-black hover:[&_svg]:fill-black",
        icon: "bg-black/50 backdrop-blur-lg p-4 rounded-full [&_svg]:fill-white",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    endIcon?: string;
    href?: string;
  };

export const Button: FC<ButtonProps> = ({
  variant,
  className,
  children,
  endIcon,
  onClick,
  href,
  type = "button",
  ...props
}) => {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (href) {
      void router.push(href);
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      className={cn(buttonVariants({ variant }), className)}
      onClick={handleClick}
      type={type}
      {...props}
    >
      {children}
      {endIcon && createElement(Icons[endIcon], { className: "ml-0 shrink-0" })}
    </button>
  );
};
