# bun-allow-macros

Due to bun doesn't allow run macros from node_modules, I created a plugin to disable this check.

However, the bun handle plugin differently in runtime and build, I have to made two different api for runtime and build.

For build:

```js
import { AllowMacros } from "bun-allow-macros"

Bun.build({
  // other props
  plugins: [AllowMacros(path => import.meta.resolve(path), "you-library")]
})
```

For runtime:

```js
import { AllowMacrosRuntime } from "bun-allow-macros"

Bun.plugin(AllowMacrosRuntime(path => import.meta.resolve(path), "you-library"))
```

## Caveats

1. this library use some special logic for relative import, it may not work well.
2. for build plugin, the package name needs to be the name used for the actual import (this may be changed by the paths in tsconfig.json)