/**
 * 协议处理器工厂函数
 *
 * 提供创建各种协议处理器实例的工厂函数
 */

import { FileProtocolHandler } from './fileProtocolHandler';
import { HttpProtocolHandler } from './httpProtocolHandler';
import { IdProtocolHandler } from './idProtocolHandler';

import type { FileProtocolHandlerOptions } from './fileProtocolHandler';
import type { HttpProtocolHandlerOptions } from './httpProtocolHandler';
import type { IdProtocolHandlerContext } from './idProtocolHandler';

/**
 * 创建HTTP协议处理器
 * @param options HTTP协议处理器选项
 * @returns HTTP协议处理器实例
 */
export function createHttpProtocolHandler(
  options?: HttpProtocolHandlerOptions
): HttpProtocolHandler {
  return new HttpProtocolHandler(options);
}

/**
 * 创建ID协议处理器
 * @param context ID协议处理器上下文
 * @returns ID协议处理器实例
 */
export function createIdProtocolHandler(
  context?: IdProtocolHandlerContext
): IdProtocolHandler {
  const handler = new IdProtocolHandler();

  if (context) {
    handler.setContext(context);
  }

  return handler;
}

/**
 * 创建文件协议处理器
 * @param options 文件协议处理器选项
 * @returns 文件协议处理器实例
 */
export function createFileProtocolHandler(
  options?: FileProtocolHandlerOptions
): FileProtocolHandler {
  return new FileProtocolHandler(options);
}
