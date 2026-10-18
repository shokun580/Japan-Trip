import type { MetadataRoute } from "next";

// What "Add to Home Screen" reads. iOS takes the home-screen icon from apple-icon.png
// instead, so the PNGs here are for Android, rendered square from app/icon.svg with:
//   rsvg-convert -w 512 -h 512 -o public/icons/icon-512.png <square source>
// Colours are the paper and ink of the :root palette in globals.css.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Japan Trip 2026",
    short_name: "Japan Trip",
    description: "แผนเที่ยวญี่ปุ่นสำหรับทุกคนในทริป",
    lang: "th",
    start_url: "/",
    display: "standalone",
    background_color: "#bdd5ea",
    theme_color: "#bdd5ea",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
