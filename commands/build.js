import * as babel from "@babel/core";
import solid from "babel-preset-solid";
import fs from "node:fs/promises";
import path from "node:path";
import child_process from "node:child_process";
import { glob } from "glob";

const srcDir = path.resolve(process.cwd(), "src/components/Draggable");
const tempDir = path.resolve(process.cwd(), "temp");
const libDir = path.resolve(process.cwd(), "lib");

async function generateDeclare() {
  const tsconfig = {
    include: [`${srcDir}/**/*`],
    compilerOptions: {
      strict: true,
      target: "ESNext",
      module: "ESNext",
      moduleResolution: "Bundler",
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      jsx: "preserve",
      jsxImportSource: "solid-js",
      isolatedModules: true,
      declaration: true,
      emitDeclarationOnly: true,
      outDir: libDir,
    },
  };

  const tsconfigFile = path.resolve(tempDir, "tsconfig.json");

  await fs.mkdir(path.dirname(tsconfigFile), {
    recursive: true,
  });
  await fs.writeFile(tsconfigFile, JSON.stringify(tsconfig));

  await new Promise((resolve, reject) => {
    const subProcess = child_process.spawn("tsc", ["-p", tsconfigFile], {
      stdio: "inherit",
    });
    subProcess.on("exit", (code) => {
      if (code) {
        reject();
      } else {
        resolve();
      }
    });
  });
}

async function compileSolid(filePath, source) {
  const babelOptions = {
    root: process.cwd(),
    filename: filePath,
    sourceFileName: filePath,
    presets: [
      [
        solid,
        {
          generate: "dom",
          hydratable: false,
          moduleName: "solid-js/web",
        },
      ],
      ["@babel/preset-typescript"],
    ],
    plugins: [],
    ast: false,
    sourceMaps: true,
    configFile: false,
    babelrc: false,
    parserOpts: {
      plugins: ["jsx", "typescript"],
    },
  };

  const { code } = await babel.transformAsync(source, babelOptions);
  return code;
}

async function compileTs() {
  const files = await glob(srcDir + "/**/*.{tsx,ts}");

  await Promise.all(
    files.map(async (file) => {
      const src = path.resolve(process.cwd(), file);
      const source = (await fs.readFile(src)).toString();
      const compiledSource = await compileSolid(file, source);
      const dest = file.replace(srcDir, libDir).replace(/\.(tsx|ts)/, ".js");
      await fs.mkdir(path.dirname(dest), {
        recursive: true,
      });
      await fs.writeFile(dest, compiledSource);
    })
  );
}

async function copyOthers() {
  const files = await glob(srcDir + "/**/*", {
    ignore: {
      ignored(p) {
        return p.isDirectory() || /\.(?:tsx|ts)$/.test(p.fullpath());
      },
    },
  });
  console.log(files);

  await Promise.all(
    files.map(async (file) => {
      const src = path.resolve(process.cwd(), file);
      const dest = file.replace(srcDir, libDir);
      await fs.mkdir(path.dirname(dest), {
        recursive: true,
      });
      await fs.copyFile(src, dest);
    })
  );

  const pkgSrc = path.resolve(process.cwd(), "package.json");
  await fs.copyFile(pkgSrc, pkgSrc.replace(process.cwd(), libDir));

  const readmeSrc = path.resolve(process.cwd(), "README.md");
  await fs.copyFile(readmeSrc, readmeSrc.replace(process.cwd(), libDir));

  const tsconfigSrc = path.resolve(process.cwd(), "tsconfig.json");
  await fs.copyFile(tsconfigSrc, tsconfigSrc.replace(process.cwd(), libDir));
}

async function build() {
  await fs.rm(tempDir, {
    recursive: true,
    force: true,
  });
  await fs.rm(libDir, {
    recursive: true,
    force: true,
  });
  await generateDeclare();
  await compileTs();
  await copyOthers();
}

build();
