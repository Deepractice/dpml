/**
 * CLI模块API
 * 提供创建命令行界面的功能
 */

import { createCLI as coreCreateCLI } from '../core/cli/cliService';
import type { CLI, CLIOptions, CommandDefinition } from '../types/CLI';

/**
 * 创建命令行界面
 *
 * @param options CLI选项
 * @param commands 命令定义数组
 * @returns CLI实例
 *
 * @example
 * ```typescript
 * // 创建基本CLI
 * const cli = createCLI(
 *   {
 *     name: 'dpml',
 *     version: '1.0.0',
 *     description: 'DPML命令行工具'
 *   },
 *   [
 *     {
 *       name: 'parse',
 *       description: '解析DPML文档',
 *       arguments: [
 *         { name: 'file', description: 'DPML文件路径', required: true }
 *       ],
 *       options: [
 *         { flags: '-o, --output <file>', description: '输出文件路径' }
 *       ],
 *       action: (file, options) => {
 *
 *
 *       }
 *     }
 *   ]
 * );
 *
 * // 执行CLI
 * await cli.execute(process.argv);
 * ```
 */
export function createCLI(
  options: CLIOptions,
  commands: CommandDefinition[]
): CLI {
  return coreCreateCLI(options, commands);
}
