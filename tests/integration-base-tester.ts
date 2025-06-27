import { spawnSync } from "child_process";

export function hasCmd(cmd: string) {
  return spawnSync("which", [cmd]).status === 0;
}

export function runScript(
  scriptPath: string,
  args: string[] = [],
  opts: { env?: any; requiredCmds?: string[] } = {}
) {
  if (opts.requiredCmds) {
    for (const cmd of opts.requiredCmds) {
      if (!hasCmd(cmd)) {
        return {
          stdout: '',
          stderr: `Missing required dependency: ${cmd}`,
          exitCode: 127,
        };
      }
    }
  }
  const result = spawnSync(scriptPath, args, {
    encoding: "utf-8",
    ...opts,
  });
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.status,
  };
} 