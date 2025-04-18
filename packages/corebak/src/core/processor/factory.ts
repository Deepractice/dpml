/**
 * ProcessorFactory
 *
 * 提供创建处理器实例的工厂函数
 */

import { DefaultProcessor } from 'packages/corebak/src/core/processor/defaultProcessor';
import { DefaultReferenceResolver } from 'packages/corebak/src/core/processor/defaultReferenceResolver';
import {
  createHttpProtocolHandler,
  createIdProtocolHandler,
  createFileProtocolHandler,
} from 'packages/corebak/src/core/processor/protocols';
import {
  createIdValidationVisitor,
  createReferenceVisitor,
  createDocumentMetadataVisitor,
  DocumentMode,
} from 'packages/corebak/src/core/processor/visitors';
import { DomainTagVisitor } from 'packages/corebak/src/core/processor/visitors/domainTagVisitor';

import type { ProcessorOptions, ProcessorFactoryOptions } from 'packages/corebak/src/types/processor';

/**
 * 创建默认处理器
 * @param options 处理器选项
 * @returns 处理器实例
 */
export function createProcessor(
  options?: ProcessorFactoryOptions
): DefaultProcessor {
  const processor = new DefaultProcessor(options);

  // 创建默认引用解析器
  const referenceResolver = new DefaultReferenceResolver();

  // 设置引用解析器
  processor.setReferenceResolver(referenceResolver);

  // 注册基础访问者
  if (options?.registerBaseVisitors !== false) {
    // 注册文档元数据访问者
    processor.registerVisitor(
      createDocumentMetadataVisitor({
        defaultMode: options?.strictMode
          ? DocumentMode.STRICT
          : DocumentMode.LOOSE,
      })
    );

    // 注册ID验证访问者
    processor.registerVisitor(
      createIdValidationVisitor({
        strictMode: options?.strictMode,
      })
    );

    // 注册引用访问者
    processor.registerVisitor(
      createReferenceVisitor({
        referenceResolver,
      })
    );
  }

  // 注册标签处理器访问者
  if (options?.registerTagProcessorVisitor !== false) {
    // 创建标签处理器访问者并注册
    processor.registerVisitor(
      new DomainTagVisitor(processor.getTagProcessorRegistry())
    );
  }

  // 注册基础协议处理器
  if (options?.registerBaseProtocolHandlers !== false) {
    // 注册ID协议处理器
    processor.registerProtocolHandler(createIdProtocolHandler());

    // 注册文件协议处理器
    processor.registerProtocolHandler(createFileProtocolHandler());

    // 注册HTTP协议处理器
    processor.registerProtocolHandler(createHttpProtocolHandler());
  }

  return processor;
}
