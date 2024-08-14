import type { BunPlugin, JavaScriptLoader } from "bun";
import { join } from "node:path";

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export function AllowMacros(
  resolve: (input: string) => string,
  ...prefixes: string[]
): BunPlugin {
  return {
    name: "AllowMacros",
    setup(build) {
      const names = prefixes.map((name) => escapeRegExp(name)).join("|");
      const regex = new RegExp(`^(${names})`);
      build.onResolve({ filter: regex }, ({ path }) => {
        return { path, namespace: "allow-macros" };
      });
      build.onLoad(
        { filter: /.*/, namespace: "allow-macros" },
        async ({ path }) => {
          const final = Bun.fileURLToPath(resolve(path));
          const fixIndex =
            !path.endsWith("/index") && !!final.match(/\/index\.[tj]sx?$/);
          const basedir = fixIndex ? path : path + "/..";
          let contents = await Bun.file(final).text();
          const loader = final.slice(
            final.lastIndexOf(".") + 1
          ) as JavaScriptLoader;
          const imports = new Bun.Transpiler({ loader }).scanImports(contents);
          for (const imp of imports) {
            if (imp.path.startsWith(".")) {
              contents = contents.replaceAll(imp.path, join(basedir, imp.path));
            }
          }
          return { contents, loader };
        }
      );
    },
  };
}

export function AllowMacrosRuntime(
  resolve: (input: string) => string,
  ...packages: string[]
): BunPlugin {
  return {
    name: "AllowMacrosRuntime",
    target: "bun",
    setup(build) {
      const names = packages.map((name) => escapeRegExp(name)).join("|");
      const regex = new RegExp(`\\/node_modules\\/((?:${names})\\/?.+$)`);
      build.onLoad({ filter: regex }, async ({ path, loader }) => {
        const relative = path.match(regex)![1];
        const final = JSON.stringify("allow-macros:" + relative);
        return { contents: `export * from ${final}` };
      });
      build.onResolve(
        { filter: /.*/, namespace: "allow-macros" },
        ({ path }) => ({ path, namespace: "allow-macros" })
      );
      build.onLoad(
        { namespace: "allow-macros", filter: /.*/ },
        async ({ path }) => {
          const final = Bun.fileURLToPath(resolve(path));
          const fixIndex =
            !path.endsWith("/index") && !!final.match(/\/index\.[tj]sx?$/);
          const basedir = fixIndex ? path : path + "/..";
          let contents = await Bun.file(final).text();
          const loader = final.slice(
            final.lastIndexOf(".") + 1
          ) as JavaScriptLoader;
          const imports = new Bun.Transpiler({ loader }).scanImports(contents);
          for (const imp of imports) {
            if (imp.path.startsWith(".")) {
              contents = contents.replaceAll(imp.path, join(basedir, imp.path));
            }
          }
          return { contents };
        }
      );
    },
  };
}
