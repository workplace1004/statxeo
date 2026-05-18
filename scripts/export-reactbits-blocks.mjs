import { execFileSync } from "node:child_process";
import {
  closeSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const projectRoot = resolve(process.cwd());
const outputDir = join(projectRoot, "docs", "reactbits-pro-blocks");

const categories = [
  ["hero", "hero-sections.md", "Hero Sections"],
  ["features", "features.md", "Features"],
  ["social-proof", "social-proof.md", "Social Proof"],
  ["footer", "footer.md", "Footer"],
  ["navigation", "navigation.md", "Navigation"],
  ["cta", "call-to-action.md", "Call To Action"],
  ["faq", "faq.md", "FAQ"],
  ["about", "about.md", "About"],
  ["showcase", "showcase.md", "Showcase"],
  ["blog", "blog.md", "Blog"],
];

function runShadcn(args) {
  const tempDir = mkdtempSync(join(tmpdir(), "reactbits-export-"));
  const outputPath = join(tempDir, "stdout.json");
  const outputFd = openSync(outputPath, "w");

  try {
    execFileSync("npx", ["shadcn@latest", ...args], {
      cwd: projectRoot,
      stdio: ["ignore", outputFd, "inherit"],
      maxBuffer: 1024 * 1024 * 100,
    });

    return readFileSync(outputPath, "utf8");
  } finally {
    closeSync(outputFd);
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function pascalCaseFromSlug(slug) {
  return slug
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
}

function normalizeContent(content) {
  return content.replace(/\r\n/g, "\n").trimEnd();
}

function ensureLicenseIsConfigured() {
  const envPath = join(projectRoot, ".env.local");
  const envText = readFileSync(envPath, "utf8");

  if (!/REACTBITS_LICENSE_KEY\s*=\s*.+/.test(envText)) {
    throw new Error("REACTBITS_LICENSE_KEY is missing from .env.local");
  }
}

function getRegistryIndex() {
  return JSON.parse(runShadcn(["search", "@reactbits-pro", "--limit", "200"]));
}

function getBlockData(slug) {
  const result = JSON.parse(runShadcn(["view", `@reactbits-pro/${slug}`]));
  const item = result[0];

  if (!item) {
    throw new Error(`No registry item returned for ${slug}`);
  }

  const componentFile = item.files.find((file) => file.path.endsWith(`/${slug}.tsx`));

  if (!componentFile) {
    throw new Error(`No component source file returned for ${slug}`);
  }

  return {
    slug,
    name: pascalCaseFromSlug(slug),
    description: item.description ?? "",
    docs: item.docs ?? "",
    dependencies: item.dependencies ?? [],
    code: normalizeContent(componentFile.content),
  };
}

function buildMarkdown(title, blocks) {
  const lines = [
    `# ${title}`,
    "",
    `Source: live React Bits Pro registry (@reactbits-pro).`,
    "",
    `Total blocks: ${blocks.length}`,
    "",
    "## Blocks",
    "",
    ...blocks.map((block) => `- ${block.slug}${block.description ? `: ${block.description}` : ""}`),
    "",
  ];

  for (const block of blocks) {
    lines.push(`## ${block.name}`);
    lines.push("");
    lines.push(`Block: ${block.slug}`);
    lines.push("");

    if (block.description) {
      lines.push(`Description: ${block.description}`);
      lines.push("");
    }

    if (block.docs) {
      lines.push(`Docs: ${block.docs}`);
      lines.push("");
    }

    lines.push("Install:");
    lines.push("");
    lines.push("```bash");
    lines.push(`npx shadcn@latest add @reactbits-pro/${block.slug}`);
    lines.push("```");
    lines.push("");

    if (block.dependencies.length > 0) {
      lines.push(`Dependencies: ${block.dependencies.join(", ")}`);
      lines.push("");
    }

    lines.push("Usage:");
    lines.push("");
    lines.push("```tsx");
    lines.push(`import { ${block.name} } from \"./${block.slug}\";`);
    lines.push("");
    lines.push("export default function Page() {");
    lines.push(`  return <${block.name} />;`);
    lines.push("}");
    lines.push("```");
    lines.push("");

    lines.push("Code:");
    lines.push("");
    lines.push("```tsx");
    lines.push(block.code);
    lines.push("```");
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function main() {
  ensureLicenseIsConfigured();
  mkdirSync(outputDir, { recursive: true });

  const registry = getRegistryIndex();
  const slugs = registry.items.map((item) => item.name);

  for (const [prefix, fileName, title] of categories) {
    const matchingSlugs = slugs
      .filter((slug) => new RegExp(`^${prefix}-\\d+$`).test(slug))
      .sort((left, right) => Number(left.split("-").at(-1)) - Number(right.split("-").at(-1)));

    const blocks = matchingSlugs.map(getBlockData);
    const filePath = join(outputDir, fileName);
    const markdown = buildMarkdown(title, blocks);

    writeFileSync(filePath, markdown, "utf8");
    console.log(`wrote ${fileName} (${blocks.length} blocks)`);
  }
}

main();