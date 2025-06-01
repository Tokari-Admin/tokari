import type { SVGProps } from 'react';

export default function AppLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50"
      aria-label="Tokari Logo"
      {...props}
    >
      <text
        x="10"
        y="40"
        fontFamily="var(--font-poppins), Poppins, sans-serif"
        fontSize="40"
        fontWeight="bold"
        fill="currentColor"
      >
        Tokar
        <tspan fill="hsl(var(--accent))">i</tspan>
      </text>
    </svg>
  );
}
