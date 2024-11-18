import child_process from "node:child_process";
import path from "node:path";

const npmRegistry = "https://registry.npmjs.org/";

async function release() {
  return new Promise((resolve, reject) => {
    const subProcess = child_process.spawn(
      `npm`,
      ["publish", "--access", "public", "--registry", npmRegistry],
      {
        stdio: "inherit",
        cwd: path.resolve(process.cwd(), "lib"),
      },
    );

    subProcess.on("exit", (code) => {
      if (code) {
        reject();
      } else {
        resolve();
      }
    });
  });
}

release();
