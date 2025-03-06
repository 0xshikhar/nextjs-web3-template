import { SiteConfig } from "@/types"

import { env } from "@/env.mjs"

export const siteConfig: SiteConfig = {
  name: "Next Web3 Template",
  author: "0xShikhar",
  description:
    "Next.js 14+ starter template with app router, shadcn/ui, typesafe env, icons and configs setup.",
  keywords: ["Next.js", "React", "Tailwind CSS", "RainbowKit", "wagmi", "Radix UI", "shadcn/ui"],
  url: {
    base: env.NEXT_PUBLIC_APP_URL,
    author: "https://shikhar.xyz",
  },
  links: {
    github: "https://github.com/0xshikhar/next-web3-template",
  },
  ogImage: `${env.NEXT_PUBLIC_APP_URL}/og.jpg`,
}
