import { ChildProcess, spawn, SpawnOptions } from "node:child_process";

type ExecAsyncOptions = SpawnOptions & {
  shouldUnref?: boolean;
};

export const execAsync = (
  command: string,
  args: string[] = [],
  options: ExecAsyncOptions = {}
): Promise<{ output: string }> => {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, options);
    if (options.shouldUnref) {
      childProcess.unref();
    }

    let output = "";
    let errorOutput = "";

    childProcess.stdout?.on("data", (data: Buffer) => {
      output += data.toString();
      // TODO remove next line of code
      const appiumRegex = /(\x1B\[[0-9;]*m)?\[Appium\](.*?)(\x1B\[0m)?/g;
      if (output.match(appiumRegex)) {
        console.log("resolving...");
        resolve({ output });
      }
      console.log(output);
    });

    childProcess.stderr?.on("data", (data: Buffer) => {
      errorOutput += data.toString();
    });

    childProcess.on("close", (code: number) => {
      if (code === 0) {
        resolve({ output });
      } else {
        reject(
          new Error(
            `Command failed with code ${code}: ${errorOutput || output}`
          )
        );
      }
    });

    childProcess.on("error", (err: Error) => {
      reject(err);
    });
  });
};
