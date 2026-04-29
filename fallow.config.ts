import { defineConfig } from 'fallow';

export default defineConfig({
    // Entry points for your Next.js application
    entry: [
        'app/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}',
        'utils/**/*.{ts,tsx}',
        'types/**/*.ts',
        'middleware.ts',
        'next.config.js',
    ],

    // Ignore patterns
    ignore: [
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/build/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/studio/**', // Sanity Studio
    ],

    // TypeScript configuration
    tsconfig: './tsconfig.json',

    // Next.js specific settings
    nextjs: {
        // Recognize Next.js special files as entry points
        includeAppRouter: true,
        includePages: true,
        includeApi: true,
    },

    // Dead code detection settings
    deadCode: {
        // Consider these as used even if not explicitly imported
        exclude: [
            // Next.js special files
            '**/layout.{ts,tsx}',
            '**/page.{ts,tsx}',
            '**/loading.{ts,tsx}',
            '**/error.{ts,tsx}',
            '**/not-found.{ts,tsx}',
            '**/template.{ts,tsx}',
            '**/route.{ts,tsx}',
            '**/middleware.{ts,tsx}',
            // Config files
            '*.config.{js,ts}',
            // Type definitions
            '**/*.d.ts',
        ],
    },

    // Duplication detection settings
    duplication: {
        minLines: 5, // Minimum lines to consider as duplication
        minTokens: 50, // Minimum tokens to consider as duplication
    },

    // Health/complexity settings
    health: {
        // Thresholds for complexity warnings
        cyclomaticComplexity: 10,
        cognitiveComplexity: 15,
        maxFileLines: 500,
    },
});
