# typescript-esm-hell

A TypeScript project using Vite and Vitest.

## Project Setup steps I have done

```bash
# Scaffold Vite TypeScript project
npm create vite@latest . -- --template vanilla-ts

# Install dependencies
npm install

# Install Vitest for testing
npm install -D vitest
```

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm test         # Run tests in watch mode
npm test -- --run # Run tests once
```

## ESM POC
I have created an example Typescript class with a simple
getter and setter methods. The class is defined in `src/example.ts`.
I have also created a test file `src/example.test.ts` to test this class using Vitest and I didn't face any ESM related issues. This is because Vitest is designed to work seamlessly with ESM modules (see [Vitest Features](https://vitest.dev/guide/features.html)). Vitest use under the hood [oxc](https://oxc.rs/) that is a collection of high-performance JavaScript tools written in Rust. In particular the [oxc-resolver](https://oxc.rs/docs/guide/usage/resolver.html) that automatically handles the cjs and esm path resolution.