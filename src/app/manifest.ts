import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ruban Rouge",
    short_name: "Ruban Rouge",
    description: "Boulangerie et pâtisserie à Meknès",
    start_url: "/fr",
    display: "standalone",
    background_color: "#FBF4E8",
    theme_color: "#B3202A",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
