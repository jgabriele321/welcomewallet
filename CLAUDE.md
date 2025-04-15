# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Lint/Test Commands
- Build: `cd welcomewallet && npm run build`
- Dev server: `cd welcomewallet && npm run dev`
- Lint: `cd welcomewallet && npm run lint`
- API tests: `cd welcomewallet && node api-test.js`

## Important Workflow Notes
- ALWAYS run the build command (`npm run build`) before testing and reporting that a fix is working
- After making code changes, the build step is required for changes to take effect
- Without building, source code changes won't be reflected when testing

## Privy Integration Guidelines
- ALWAYS import chain definitions from viem/chains: `import { base } from 'viem/chains';`
- Configure chain properties in PrivyProvider using the chain objects:
  ```javascript
  <PrivyProvider
    config={{
      defaultChain: base,
      supportedChains: [base]
    }}
  >
  ```
- Use the useSendTransaction hook for all transactions
- Don't manually specify chainId in transactions if defaultChain is configured properly
- For any issues with wallet connection or transaction errors, check chain configuration first

## Vercel Deployment Notes
- For successful builds on Vercel, be strict about TypeScript types
- Don't use string chainIds with sendTransaction (e.g., 'eip155:8453')
- Don't use properties in Privy config that aren't defined in TypeScript definitions
- Add all required environment variables in Vercel project settings

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