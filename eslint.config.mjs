import {FlatCompat} from "@eslint/eslintrc";
import {dirname} from "node:path";
import {fileURLToPath} from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({baseDirectory: __dirname});

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["src/app/api/site-projects/**/*.ts", "src/app/api/ai/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/lib/supabase/*",
                "@/lib/statxai/*",
                "@supabase/*",
              ],
              message:
                "API routes must call @/server/site-projects/service only (no Supabase or direct lib).",
            },
          ],
        },
      ],
    },
  },
];

export default config;
