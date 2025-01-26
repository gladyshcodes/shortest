import { exec, ExecOptions } from "node:child_process";

type ExecAsyncOptions = ExecOptions & {
  resolveWhenStdout?: (data: string) => boolean;
  resolveWhenStderr?: (data: string) => boolean;
};

/**
 * Utility function to execute a command with options and return its output as a promise.
 *
 * @param command The command to execute.
 * @param options The options to customize the execution, such as cwd.
 * @returns A promise that resolves with the command's output (stdout and stderr).
 */
export function execAsync(
  command: string,
  options: ExecAsyncOptions
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const process = exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Command failed with error: ${error.message}`));
        return;
      }
      resolve({ stdout, stderr });
    });

    process.stdout?.on("data", (data) => {
      if (options.resolveWhenStdout?.(data.toString())) {
        resolve({ stdout: data.toString(), stderr: "" });
      }
    });

    process.stderr?.on("data", (data) => {
      if (options.resolveWhenStderr?.(data.toString())) {
        resolve({ stdout: "", stderr: data.toString() });
      }
    });

    return process;
  });
}
