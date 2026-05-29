import type { Metadata } from "next"
import Footer7 from "@/components/blocks/footer-7"
import { ClientsGalleryShowcase } from "@/components/brand/clients-gallery-showcase"

export const metadata: Metadata = {
  title: "Client Gallery | Statxeo Website Work",
  description:
    "Explore a live gallery of public-facing client websites built by Statxeo, with real previews of service-business sites and platform work now live on the web.",
}

export default function GalleryPage() {
  return (
    <>
      <ClientsGalleryShowcase />
      <Footer7 />
    </>
  )
}
