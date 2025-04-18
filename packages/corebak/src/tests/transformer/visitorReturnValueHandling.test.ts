import { describe, it, expect } from 'vitest';

import { DefaultTransformer } from '../../transformer/defaultTransformer';
import { TransformContext } from '../../transformer/interfaces/transformContext';
import { TransformOptions } from '../../transformer/interfaces/transformOptions';
import { NodeType, Node } from '../../types/node';

import type { ProcessedDocument } from '../../processor/interfaces/processor';
import type { TransformerVisitor } from '../../transformer/interfaces/transformerVisitor';
import type { Element, Content } from '../../types/node';

describe('访问者返回值处理机制', () => {
  // 创建一个测试文档
  const createTestDocument = (): ProcessedDocument => {
    // 创建内容节点
    const contentNode: Content = {
      type: NodeType.CONTENT,
      value: '测试内容',
      position: {
        start: { line: 2, column: 6, offset: 15 },
        end: { line: 2, column: 16, offset: 25 },
      },
    };

    // 创建元素节点
    const elementNode: Element = {
      type: NodeType.ELEMENT,
      tagName: 'div',
      attributes: {},
      children: [contentNode],
      position: {
        start: { line: 2, column: 1, offset: 10 },
        end: { line: 2, column: 22, offset: 31 },
      },
    };

    // 创建文档
    return {
      type: NodeType.DOCUMENT,
      children: [elementNode],
      position: {
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 3, column: 1, offset: 32 },
      },
    };
  };

  it('应该能够合并多个访问者的返回值', () => {
    // 创建返回不同属性的访问者
    const visitor1: TransformerVisitor = {
      name: 'visitor1-合并多个访问者',
      priority: 100,
      visitDocument: () => ({
        type: 'document',
        meta: { title: '测试文档' },
      }),
    };

    const visitor2: TransformerVisitor = {
      name: 'visitor2-合并多个访问者',
      priority: 90,
      visitDocument: () => ({
        stats: { wordCount: 100 },
      }),
    };

    const transformer = new DefaultTransformer();

    transformer.configure({
      mergeReturnValues: true, // 启用返回值合并
    });
    transformer.registerVisitor(visitor1);
    transformer.registerVisitor(visitor2);

    const result = transformer.transform(createTestDocument());

    // 验证结果包含两个访问者的属性
    expect(result).toEqual({
      type: 'document',
      meta: { title: '测试文档' },
      stats: { wordCount: 100 },
    });
  });

  it('应该支持深度合并对象返回值', () => {
    // 创建返回嵌套对象的访问者
    const visitor1: TransformerVisitor = {
      name: 'visitor1-深度合并',
      priority: 100,
      visitDocument: () => ({
        meta: {
          title: '测试文档',
          author: '张三',
        },
      }),
    };

    const visitor2: TransformerVisitor = {
      name: 'visitor2-深度合并',
      priority: 90,
      visitDocument: () => ({
        meta: {
          version: '1.0',
          author: '李四', // 重复的属性
        },
      }),
    };

    const transformer = new DefaultTransformer();

    transformer.configure({
      mergeReturnValues: true, // 启用返回值合并
      deepMerge: true, // 启用深度合并
    });
    transformer.registerVisitor(visitor1);
    transformer.registerVisitor(visitor2);

    const result = transformer.transform(createTestDocument());

    // 验证深度合并结果
    expect(result).toEqual({
      meta: {
        title: '测试文档',
        author: '李四', // 后面访问者的值应覆盖前面的
        version: '1.0',
      },
    });
  });

  it('对于数组类型的返回值应该进行连接而非覆盖', () => {
    // 创建返回包含数组的访问者
    const visitor1: TransformerVisitor = {
      name: 'visitor1-数组合并',
      priority: 100,
      visitDocument: () => ({
        tags: ['文档', '重要'],
      }),
    };

    const visitor2: TransformerVisitor = {
      name: 'visitor2-数组合并',
      priority: 90,
      visitDocument: () => ({
        tags: ['参考'],
      }),
    };

    const transformer = new DefaultTransformer();

    transformer.configure({
      mergeReturnValues: true,
      mergeArrays: true, // 启用数组合并
    });
    transformer.registerVisitor(visitor1);
    transformer.registerVisitor(visitor2);

    const result = transformer.transform(createTestDocument());

    // 验证数组已合并
    expect(result).toEqual({
      tags: ['文档', '重要', '参考'],
    });
  });

  it('对于树结构应该递归处理每个节点的返回值', () => {
    // 文档节点访问者
    const documentVisitor: TransformerVisitor = {
      name: 'document-visitor-树结构递归',
      priority: 100,
      visitDocument: () => ({
        type: 'document',
        title: '测试文档',
        children: [], // 添加children数组以支持子节点处理
      }),
    };

    // 元素节点访问者
    const elementVisitor: TransformerVisitor = {
      name: 'element-visitor-树结构递归',
      priority: 100,
      visitElement: (element: Element) => ({
        type: 'element',
        name: element.tagName,
        customAttr: 'test',
        children: [], // 添加children数组以支持子节点处理
      }),
    };

    // 内容节点访问者
    const contentVisitor: TransformerVisitor = {
      name: 'content-visitor-树结构递归',
      priority: 100,
      visitContent: (content: Content) => ({
        type: 'content',
        text: content.value,
        format: 'plain',
      }),
    };

    const transformer = new DefaultTransformer();

    transformer.registerVisitor(documentVisitor);
    transformer.registerVisitor(elementVisitor);
    transformer.registerVisitor(contentVisitor);

    const result = transformer.transform(createTestDocument());

    // 验证树结构处理结果
    expect(result).toEqual({
      type: 'document',
      title: '测试文档',
      children: [
        {
          type: 'element',
          name: 'div',
          customAttr: 'test',
          children: [
            {
              type: 'content',
              text: '测试内容',
              format: 'plain',
            },
          ],
        },
      ],
    });
  });

  it('当设置了冲突解决策略时应该按照策略处理冲突', () => {
    // 创建返回冲突属性的访问者
    const visitor1: TransformerVisitor = {
      name: 'visitor1-冲突解决',
      priority: 100,
      visitDocument: () => ({
        type: 'doc',
        version: 1,
      }),
    };

    const visitor2: TransformerVisitor = {
      name: 'visitor2-冲突解决',
      priority: 90,
      visitDocument: () => ({
        type: 'document',
        version: 2,
      }),
    };

    // 使用"先胜"冲突解决策略
    const transformer1 = new DefaultTransformer();

    transformer1.configure({
      mergeReturnValues: true,
      conflictStrategy: 'first-wins',
    });
    transformer1.registerVisitor(visitor1);
    transformer1.registerVisitor(visitor2);

    const result1 = transformer1.transform(createTestDocument());

    // 验证使用第一个访问者的值
    expect(result1).toEqual({
      type: 'doc',
      version: 1,
    });

    // 使用"后胜"冲突解决策略
    const transformer2 = new DefaultTransformer();

    transformer2.configure({
      mergeReturnValues: true,
      conflictStrategy: 'last-wins',
    });
    transformer2.registerVisitor(visitor1);
    transformer2.registerVisitor(visitor2);

    const result2 = transformer2.transform(createTestDocument());

    // 验证使用第二个访问者的值
    expect(result2).toEqual({
      type: 'document',
      version: 2,
    });
  });

  it('应该能够使用自定义合并函数处理返回值', () => {
    // 创建返回重复键的访问者
    const visitor1: TransformerVisitor = {
      name: 'visitor1',
      priority: 100,
      visitDocument: () => ({
        count: 5,
      }),
    };

    const visitor2: TransformerVisitor = {
      name: 'visitor2',
      priority: 90,
      visitDocument: () => ({
        count: 10,
      }),
    };

    // 自定义合并函数 - 固定返回特殊值以方便测试
    const customMerge = (key: string, value1: any, value2: any) => {
      if (key === 'count') {
        return 15; // 固定结果
      }

      return value2; // 默认后者覆盖前者
    };

    // 创建一个转换器并启用返回值合并
    const transformer = new DefaultTransformer();

    transformer.configure({
      mergeReturnValues: true,
      customMergeFn: customMerge,
    });

    // 注册访问者
    transformer.registerVisitor(visitor1);
    transformer.registerVisitor(visitor2);

    // 执行转换
    const result = transformer.transform(createTestDocument());

    // 验证结果
    expect(result).toEqual({
      count: 15,
    });
  });
});
