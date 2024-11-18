import * as ghpages from "gh-pages";
import consola from "consola";
import path from "node:path";

async function deploy() {
  return new Promise((resolve, reject) => {
    consola.start(`[gh-pages] 开始部署...`);
    ghpages.publish(
      path.resolve(process.cwd(), "dist"),
      {
        branch: "gh-pages",
        repo: "https://github.com/sutras/solid-draggable-docs.git",
      },
      (err) => {
        if (err) {
          consola.error(`[gh-pages] 部署失败`);
          reject(err);
        } else {
          consola.success(`[gh-pages] 部署成功`);
          resolve();
        }
      },
    );
  });
}

deploy();
