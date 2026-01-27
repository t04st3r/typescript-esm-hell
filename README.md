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

## Version without Bundler (Vite)
Moved to a vanilla JS module definition, using node and mocha

### Packages
added dependencies (devDependencies):

```
    "@types/chai": "^5.2.3",
    "@types/mocha": "^10.0.10",
    "@types/node": "^25.0.10",
    "chai": "^6.2.2",
    "mocha": "^11.7.5",
    "ts-node": "^10.9.2",
````

### Configuration for typescript

Changed tsconfig:

```
  "module": "nodenext",
  "moduleResolution": "nodenext",
  "types": ["mocha"],
```

### Configuration for mocha (in package.json)

Added "mocha" stanza in package.json

```
  "mocha": {
    "extensions": [
      "ts"
    ],
    "require": [
      "ts-node/register"
    ],
    "recursive": true,
    "spec": [
      "src/**/*.test.ts"
    ],
    "node-option": [
      "import=./node-loader-esm.mjs"
    ]
  }
````
and added a custom node loader defined in node-loader-esm.mjs

```
import { register } from "node:module";

register("ts-node/esm", import.meta.url);
```

### Test files
Removed dpendencies from vite (vitetest) and moved to chai

 ``` import { expect } from 'chai' ```


### Run scripts (in package.json)

Added run scripts
```
  "build": "tsc",
  "test-mocha": "mocha"
```

### Build & run tests

Valid for node version 22.x


```
$>npm run build && npm run test-mocha

> typescript-esm-hell@0.0.0 build
> tsc


> typescript-esm-hell@0.0.0 test-mocha
> mocha

(node:19638) [DEP0180] DeprecationWarning: fs.Stats constructor is deprecated.
(Use `node --trace-deprecation ...` to show where the warning was created)


  Example
    ✔ should initialize with the provided name
    ✔ should update name via setter
    ✔ should handle empty string


  3 passing (4ms)

```
