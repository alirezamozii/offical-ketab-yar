import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  linterOptions: {
    reportUnusedDisableDirectives: "error",
  },
  rules: {
    // TypeScript rules — fully enforced as errors.
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/ban-ts-comment": "error",
    "@typescript-eslint/prefer-as-const": "error",
    "@typescript-eslint/no-unused-disable-directive": "off", // handled by linterOptions
    
    // React rules — exhaustive-deps fully enforced as error (surfaces real bugs).
    "react-hooks/exhaustive-deps": "error",
    "react-hooks/purity": "off",
    // set-state-in-effect is disabled because this SSR app reads from
    // localStorage/sessionStorage in effects (reading during render would
    // cause hydration mismatches). The rule has a high false-positive rate
    // with this legitimate pattern. Each effect was reviewed — the setState
    // calls are intentional external-system syncs (localStorage, matchMedia,
    // IntersectionObserver), not cascading-render anti-patterns.
    "react-hooks/set-state-in-effect": "off",
    // Allow dynamic icon components (looked up from a static map of
    // LucideIcon references) to be rendered. This is the documented
    // pattern for genre/feature-specific icons.
    "react-hooks/static-components": "off",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    "react-compiler/react-compiler": "off",
    
    // Next.js rules
    "@next/next/no-img-element": "error",
    "@next/next/no-html-link-for-pages": "error",
    
    // General JavaScript rules — fully enforced as errors.
    "prefer-const": "error",
    "no-unused-vars": "off", // handled by @typescript-eslint version
    "no-console": ["error", { allow: ["warn", "error"] }],
    "no-debugger": "error",
    "no-empty": ["error", { allowEmptyCatch: true }],
    "no-irregular-whitespace": "error",
    "no-case-declarations": "error",
    "no-fallthrough": "error",
    "no-mixed-spaces-and-tabs": "error",
    "no-redeclare": "error",
    "no-undef": "off", // TS handles this
    "no-unreachable": "error",
    "no-useless-escape": "error",
  },
}, {
  // Seed scripts and build scripts legitimately use console.log for progress output.
  files: ["prisma/**/*.ts", "scripts/**/*.mjs"],
  rules: {
    "no-console": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "examples/**", "skills", "upload/**", "ketab2_extract/**", "tool-results/**", "scripts/**", "prisma/seed-content.ts", "prisma/seed-prod.ts", "public/sw.js", "public/swe-worker-*.js", "public/**/*.js"]
}];

export default eslintConfig;
