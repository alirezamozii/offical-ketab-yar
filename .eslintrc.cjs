// name=.eslintrc.cjs
module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2024: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    }
    // If you want rules that require project information (like certain type-aware rules),
    // set "project" to your tsconfig path. This enables type-aware linting but is slower.
    // project: ["./tsconfig.json"]
  },
  plugins: [
    "@typescript-eslint",
    "react",
    "react-hooks",
    "jsx-a11y"
  ],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "next/core-web-vitals"
  ],
  settings: {
    react: {
      version: "detect"
    }
  },
  ignorePatterns: [
    "node_modules/",
    ".next/",
    "out/",
    "build/",
    "dist/",
    ".turbo/",
    "public/",
    "next-env.d.ts",
    "tsconfig.tsbuildinfo",
    "**/*.config.js",
    "**/*.config.mjs",
    "**/*.config.ts"
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",

    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "no-unused-vars": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/consistent-type-imports": ["warn", { "prefer": "type-imports" }],

    "eqeqeq": ["error", "always"],
    "no-console": ["warn", { allow: ["warn", "error", "info"] }]
  }
};
