import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FSC – Freedom Shirt Company",
    short_name: "FSC",
    description:
      "Premium shirts, custom tailoring and timeless fashion for the modern gentleman.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1c1917",
    icons: [
      {
        src: "/images/freedom%201.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
