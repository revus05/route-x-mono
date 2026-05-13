import type { FC, HTMLAttributes } from "react";

type IconProps = HTMLAttributes<SVGElement>;

export type IconComponents = Record<string, FC<IconProps>>;

export const Icons: IconComponents = {
  chevronRight: (props) => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>chevron right</title>
      <path d="M19.4141 12L12.707 18.707L11.293 17.293L15.5859 13H6V11H15.5859L11.293 6.70703L12.707 5.29297L19.4141 12Z" />
    </svg>
  ),
  burgerMenu: (props) => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>burger menu</title>
      <path d="M19 17H9V15H19V17ZM19 9H5V7H19V9Z" fill="#B8FF01" />
    </svg>
  ),
  cross: (props) => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>cross</title>
      <path
        d="M21 5.07715L14.0771 12L21 18.9229L18.9229 21L12 14.0771L5.07715 21L3 18.9229L9.92285 12L3 5.07715L5.07715 3L12 9.92285L18.9229 3L21 5.07715Z"
        fill="white"
      />
    </svg>
  ),
  chevronRightTop: (props) => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>chevron right top</title>
      <path d="M17.6279 17.6855L15.3594 17.6914L15.3789 10.2217L7.14258 18.457L5.54297 16.8574L13.7783 8.62109L6.30859 8.64062L6.31445 6.37207L17.6562 6.34375L17.6279 17.6855Z" />
    </svg>
  ),
  chevronLeft: (props) => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>chevron left</title>
      <path d="M14.1211 6.70703L9.82812 11H19.4141V13H9.82812L14.1211 17.293L12.707 18.707L6 12L12.707 5.29297L14.1211 6.70703Z" />
    </svg>
  ),
  listMark: (props) => (
    <svg
      width="25"
      height="25"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>list mark</title>
      <rect width="25" height="25" rx="12.5" fill="#B8FF01" />
      <path
        d="M11.3781 15.875L8.78438 13.2812C8.62813 13.125 8.62813 12.8594 8.78438 12.7031L9.34688 12.1406C9.50313 11.9844 9.75313 11.9844 9.90938 12.1406L11.675 13.8906L15.425 10.1406C15.5813 9.98438 15.8313 9.98438 15.9875 10.1406L16.55 10.7031C16.7063 10.8594 16.7063 11.125 16.55 11.2812L11.9563 15.875C11.8 16.0312 11.5344 16.0312 11.3781 15.875Z"
        fill="black"
      />
    </svg>
  ),
  openExternal: (props) => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>open external</title>
      <path d="M10 8H6V18H16V14H18V20H4V6H10V8ZM21 11H19V6.41406L10.707 14.707L9.29297 13.293L17.5859 5H13V3H21V11Z" />
    </svg>
  ),
  search: (props) => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>Search</title>
      <path
        d="M15.7955 15.8111L21 21M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};
