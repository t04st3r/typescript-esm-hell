# How to survive TypeScript ESM hell: Bundler vs Native Node approach

## Introduction

This presentation explores the differences between running a TypeScript project with a **bundler (Vite)** versus using **Node.js directly**. We'll examine why bundlers hide ESM complexity and what configuration changes are needed to run TypeScript natively with Node.

---

## Historical Context: Why Do We Have ESM and CJS?

### The Early Days: No Module System (Pre-2009)

JavaScript was created in 1995 for simple browser scripts. It had **no module system** - everything lived in the global scope. Developers used patterns like IIFEs (Immediately Invoked Function Expressions) to avoid polluting the global namespace.

```javascript
// The "module pattern" - a workaround, not a real solution
var MyModule = (function() {
  var privateVar = 'secret';
  return {
    publicMethod: function() { return privateVar; }
  };
})();
```

### 2009: Node.js and CommonJS (CJS)

When **Ryan Dahl** created Node.js in 2009, JavaScript needed a module system for server-side development. Node.js adopted **CommonJS**, a synchronous module format:

```javascript
// CommonJS (CJS) - Node.js style
const fs = require('fs');           // Synchronous import
module.exports = { myFunction };    // Export
```

**Key characteristics of CJS:**
- **Synchronous loading** - `require()` blocks execution until the module is loaded
- **Dynamic** - You can `require()` inside conditionals or loops
- **Designed for servers** - Synchronous loading is fine when reading from local disk

### 2015: ECMAScript 2015 (ES6) and ESM

The JavaScript standards committee (TC39) finally added an **official module system** to the language in **ECMAScript 2015** (also known as ES6). This is **ESM (ECMAScript Modules)**:

```javascript
// ESM - The official standard
import fs from 'fs';                // Static import
export const myFunction = () => {}; // Named export
```

**Key characteristics of ESM:**
- **Static analysis** - Imports/exports are determined at parse time, not runtime
- **Asynchronous** - Designed for the web where network loading is async
- **Tree-shakeable** - Bundlers can remove unused code because imports are static
- **The official standard** - Part of the JavaScript language specification

### The Problem: Two Incompatible Systems

Now JavaScript has **two module systems** that don't naturally interoperate:

| Aspect | CommonJS (CJS) | ECMAScript Modules (ESM) |
|--------|----------------|--------------------------|
| **Born** | 2009 (Node.js) | 2015 (ES6 Standard) |
| **Syntax** | `require()` / `module.exports` | `import` / `export` |
| **Loading** | Synchronous | Asynchronous |
| **Analysis** | Dynamic (runtime) | Static (parse time) |
| **File extension** | `.js` or `.cjs` | `.js` or `.mjs` |
| **Ecosystem** | Millions of npm packages | Growing adoption |

### Node.js ESM Support Timeline

| Year | Node Version | ESM Status |
|------|--------------|------------|
| 2009-2017 | v0.x - v8.x | CJS only |
| 2017 | v8.5 | ESM behind `--experimental-modules` flag |
| 2019 | v12 | ESM unflagged but still experimental |
| 2020 | v14 | ESM stable, but CJS remains default |
| 2021+ | v16+ | Full ESM support, `"type": "module"` in package.json |

### Where TypeScript Fits In

**TypeScript** (created by Microsoft in 2012) uses ESM-style `import`/`export` syntax, but it **compiles to whatever module format you configure**:

```typescript
// You write this (ESM syntax)
import { something } from './module';
export const value = 42;

// TypeScript can compile to CJS
const { something } = require('./module');
exports.value = 42;

// Or to ESM
import { something } from './module';
export const value = 42;
```

The `module` and `moduleResolution` settings in `tsconfig.json` control this behavior:

| Setting | Output | Use Case |
|---------|--------|----------|
| `"module": "commonjs"` | CJS (`require`) | Legacy Node.js |
| `"module": "esnext"` | ESM (`import`) | Bundlers |
| `"module": "nodenext"` | ESM with Node semantics | Native Node.js ESM |

### The "ESM Hell" We Face Today

The coexistence of CJS and ESM creates friction:

1. **Extension ambiguity** - Is `.js` a CJS or ESM file? (Depends on `package.json` `"type"`)
2. **Interop complexity** - CJS can `require()` ESM only via dynamic `import()`. ESM can import CJS but with caveats.
3. **Tooling fragmentation** - Some tools expect CJS, others ESM, some handle both
4. **The `.js` paradox** - TypeScript files are `.ts` but Node ESM requires `.js` in imports

**Bundlers like Vite** abstract away this complexity. **Native Node** requires you to understand and configure it explicitly.

This presentation shows both approaches using a practical example.

---

## The Project Structure

A simple TypeScript class with getter/setter methods:

```
src/
├── example.ts       # TypeScript class
└── example.test.ts  # Test file
```

---

## Part 1: The Bundler Approach (Vite + Vitest)

### How It Works

```
┌─────────────────┐     ┌─────────────┐     ┌──────────────┐
│  TypeScript     │ ──▶ │   Bundler   │ ──▶ │  Executable  │
│  Source Code    │     │   (Vite)    │     │  JavaScript  │
└─────────────────┘     └─────────────┘     └──────────────┘
```

### Project Setup

```bash
# Scaffold Vite TypeScript project
npm create vite@latest . -- --template vanilla-ts

# Install dependencies
npm install

# Install Vitest for testing
npm install -D vitest
```

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm test         # Run tests in watch mode
npm test -- --run # Run tests once
```

### Why It "Just Works"

1. **Vite handles module resolution** - You write `import { X } from './file'` without extensions
2. **Vitest uses oxc-resolver** - A Rust-based resolver that automatically handles ESM/CJS path resolution
3. **Build-time transpilation** - TypeScript is compiled during the build process
4. **Abstracted complexity** - The bundler hides all ESM-related issues from the developer

### Minimal Configuration

```json
// package.json
{
  "type": "module",
  "scripts": {
    "build": "tsc && vite build",
    "test": "vitest"
  }
}
```

### Import Syntax (Relaxed)

```typescript
// No extension needed - bundler figures it out
import { Example } from './example'
```

---

## Part 2: The Native Node Approach (Node + Mocha)

### How It Works

```
┌─────────────────┐     ┌─────────────┐     ┌──────────────┐
│  TypeScript     │ ──▶ │   ts-node   │ ──▶ │    Node.js   │
│  Source Code    │     │  (runtime)  │     │   Execution  │
└─────────────────┘     └─────────────┘     └──────────────┘
```

### The Three Challenges

#### Challenge 1: Node ESM Requires Explicit Extensions

Node.js in ESM mode **requires file extensions** in import statements. But here's the paradox:

| You Write | Node Executes | Import Must Be |
|-----------|---------------|----------------|
| `.ts` files | `.js` files | `./file.js` |

```typescript
// WRONG - Node will fail
import { Example } from './example'

// CORRECT - Use .js even for .ts files!
import { Example } from './example.js'
```

**Why `.js` in TypeScript code?**
- TypeScript compiles `.ts` → `.js`
- The import path is preserved as-is during compilation
- At runtime, Node looks for the `.js` file

#### Challenge 2: TypeScript Configuration for Node ESM

```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext"
  }
}
```

| Option | Purpose |
|--------|---------|
| `module: "nodenext"` | Generate output compatible with Node's native ESM |
| `moduleResolution: "nodenext"` | Resolve modules like Node does: require explicit extensions, respect `"type": "module"` |

**Comparison with Bundler Mode:**

| Setting | Bundler (Vite) | Native Node |
|---------|----------------|-------------|
| `module` | `"ESNext"` | `"nodenext"` |
| `moduleResolution` | `"bundler"` | `"nodenext"` |
| Extension in imports | Optional | Required (`.js`) |

#### Challenge 3: Runtime TypeScript Transpilation

Node.js cannot execute TypeScript directly. We need **ts-node** to transpile on-the-fly, but ts-node has its own ESM complications.

---

## Part 3: The ESM Loader Solution

### The Custom Loader File

```javascript
// node-loader-esm.mjs
import { register } from "node:module";

register("ts-node/esm", import.meta.url);
```

### What Each Line Does

| Code | Explanation |
|------|-------------|
| `import { register } from "node:module"` | Import Node's built-in module registration API (Node 20+) |
| `register("ts-node/esm", ...)` | Register ts-node as an ESM loader hook |
| `import.meta.url` | Provide the base URL for resolving the loader |

### Why a Separate `.mjs` File?

1. **Load order matters** - The loader must be registered BEFORE any TypeScript code runs
2. **Guaranteed ESM** - The `.mjs` extension ensures the file is treated as ESM regardless of project settings
3. **Node's `--import` flag** - Requires a module path, not inline code

### The Loading Sequence

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Node starts with --import=./node-loader-esm.mjs          │
├─────────────────────────────────────────────────────────────┤
│ 2. node-loader-esm.mjs registers ts-node/esm as loader      │
├─────────────────────────────────────────────────────────────┤
│ 3. Mocha loads test files (*.test.ts)                       │
├─────────────────────────────────────────────────────────────┤
│ 4. ts-node intercepts .ts imports and transpiles them       │
├─────────────────────────────────────────────────────────────┤
│ 5. Tests execute with transpiled JavaScript                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 4: Mocha Configuration

### Full Configuration in package.json

```json
{
  "mocha": {
    "extensions": ["ts"],
    "require": ["ts-node/register"],
    "recursive": true,
    "spec": ["src/**/*.test.ts"],
    "node-option": ["import=./node-loader-esm.mjs"]
  }
}
```

### Configuration Breakdown

| Option | Value | Purpose |
|--------|-------|---------|
| `extensions` | `["ts"]` | Recognize `.ts` files as test files |
| `require` | `["ts-node/register"]` | Register ts-node for CJS compatibility |
| `recursive` | `true` | Search for tests in subdirectories |
| `spec` | `["src/**/*.test.ts"]` | Glob pattern to find test files |
| `node-option` | `["import=./node-loader-esm.mjs"]` | Pass `--import` flag to Node |

### Equivalent Command Line

```bash
node --import=./node-loader-esm.mjs \
     ./node_modules/.bin/mocha \
     --recursive \
     'src/**/*.test.ts'
```

---

## Part 5: Dependencies Comparison

### Bundler Approach (Vite)

```json
{
  "devDependencies": {
    "typescript": "~5.9.3",
    "vite": "^7.2.4",
    "vitest": "^4.0.17"
  }
}
```

### Native Node Approach

```json
{
  "devDependencies": {
    "typescript": "~5.9.3",
    "@types/chai": "^5.2.3",
    "@types/mocha": "^10.0.10",
    "@types/node": "^25.0.10",
    "chai": "^6.2.2",
    "mocha": "^11.7.5",
    "ts-node": "^10.9.2"
  }
}
```

### Why More Dependencies?

| Dependency | Reason |
|------------|--------|
| `mocha` | Test runner (Vitest is built into Vite ecosystem) |
| `chai` | Assertion library (Vitest includes its own) |
| `ts-node` | Runtime TypeScript transpilation |
| `@types/*` | Type definitions for Node, Mocha, Chai |

---

## Part 6: Side-by-Side Comparison

### Configuration Files

| Aspect | Vite/Vitest | Node/Mocha |
|--------|-------------|------------|
| **tsconfig.json** | `moduleResolution: "bundler"` | `moduleResolution: "nodenext"` |
| **package.json** | Minimal scripts | Mocha config block + loader |
| **Extra files** | None | `node-loader-esm.mjs` |

### Import Syntax

```typescript
// Vite/Vitest - extension optional
import { Example } from './example'
import { expect } from 'vitest'

// Node/Mocha - extension required
import { Example } from './example.js'
import { expect } from 'chai'
```

### Build & Test Commands

```bash
# Vite approach
npm run build    # tsc && vite build
npm test         # vitest

# Node approach
npm run build       # tsc
npm run test-mocha  # mocha
```

### Error Messages

**Missing extension with Node ESM:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/path/to/example'
imported from /path/to/example.test.ts
Did you mean to import "./example.js"?
```

**Missing loader registration:**
```
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts"
```

---

## Part 7: When to Use Each Approach

### Use Bundler (Vite) When:

- Building **frontend applications** (SPAs, websites)
- You want **minimal configuration**
- You need **Hot Module Replacement** (HMR)
- You prefer **abstracted complexity**
- Your team is less experienced with ESM intricacies

### Use Native Node When:

- Building **server-side applications** or **CLI tools**
- Creating **npm libraries** that must work without bundlers
- You need **lighter CI/CD pipelines** (no build step for tests)
- You want **deeper understanding** of the module system
- You need **faster test startup** (no bundler overhead)
- **Debugging** bundler-related issues

---

## Part 8: Key Takeaways

### The "ESM Hell" Problem

1. **ESM in Node is strict** - Extensions required, no implicit resolution
2. **TypeScript adds complexity** - `.ts` source vs `.js` output mismatch
3. **Bundlers hide this** - They resolve everything at build time
4. **Native Node exposes it** - You must handle it explicitly

### The Solution Components

```
┌─────────────────────────────────────────────────────────┐
│                    Native Node ESM                       │
├─────────────────────────────────────────────────────────┤
│  tsconfig.json         │  module: "nodenext"            │
│                        │  moduleResolution: "nodenext"  │
├─────────────────────────────────────────────────────────┤
│  node-loader-esm.mjs   │  Registers ts-node ESM loader  │
├─────────────────────────────────────────────────────────┤
│  package.json          │  Mocha config with node-option │
├─────────────────────────────────────────────────────────┤
│  Import statements     │  Use .js extension for .ts     │
└─────────────────────────────────────────────────────────┘
```

### Final Thought

> Bundlers don't solve ESM problems - they hide them. Understanding native Node ESM gives you the knowledge to debug issues when bundler magic fails.

---

## References

- [Node.js ESM Documentation](https://nodejs.org/api/esm.html)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/modules/theory.html)
- [ts-node ESM Support](https://typestrong.org/ts-node/docs/imports/)
- [Vitest Features](https://vitest.dev/guide/features.html)
