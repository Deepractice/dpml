/**
 * 处理器模块
 */

// 暂时导出空对象，后续实现
export {};

// 导出标签处理器
export * from '@prompt/processors/promptTagProcessor';
export * from '@prompt/processors/roleTagProcessor';
export * from '@prompt/processors/contextTagProcessor';
export * from '@prompt/processors/thinkingTagProcessor';
export * from '@prompt/processors/executingTagProcessor';
export * from '@prompt/processors/testingTagProcessor';
export * from '@prompt/processors/protocolTagProcessor';
export * from '@prompt/processors/customTagProcessor';

// 导出处理器注册表
export * from '@prompt/processors/registry';
