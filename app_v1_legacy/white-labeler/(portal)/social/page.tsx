import { WhiteLabelerSocialSettings } from "@/components/sections/white-labeler-social-settings"

export const metadata = {
  title: "Social Media Management - StatXEO",
  description: "Manage your agency's social media connections and publishing.",
}

export default function WhiteLabelerSocialPage() {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <WhiteLabelerSocialSettings />
    </div>
  )
}
