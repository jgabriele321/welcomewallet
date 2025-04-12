# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Lint/Test Commands
- Build: `cd welcomewallet-vite && npm run build`
- Dev server: `cd welcomewallet-vite && npm run dev`
- Lint: `cd welcomewallet-vite && npm run lint`
- API tests: `cd welcomewallet-vite && node api-test.js`

## Code Style Guidelines
- TypeScript is preferred over JavaScript
- Use functional components with React FC type annotations
- Prefer hooks over class components
- Use interface for type definitions
- Format imports: React first, then libraries, then local imports
- Error handling: use try/catch with specific error logging
- Follow strict TypeScript rules (noUnusedLocals, noUnusedParameters)
- Use TailwindCSS for styling with className approach
- Consistent file naming: PascalCase for components, camelCase for utilities
- Document functions and complex operations with JSDoc comments
- Async/await preferred over Promise chains
- Maintain 2-space indentation