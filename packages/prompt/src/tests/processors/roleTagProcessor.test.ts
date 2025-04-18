import { NodeType } from '@dpml/core';
import { RoleTagProcessor } from '@prompt/processors/roleTagProcessor';
import { describe, it, expect, vi } from 'vitest';

import type { Element, Content, ProcessingContext } from '@dpml/core';

describe('RoleTagProcessor', () => {
  // 创建一个模拟的 ProcessingContext
  const createMockContext = (): ProcessingContext => {
    return {
      document: {
        type: NodeType.DOCUMENT,
        children: [],
        position: {
          start: { line: 0, column: 0, offset: 0 },
          end: { line: 0, column: 0, offset: 0 },
        },
      },
      currentPath: '/test/path',
      filePath: '/test/path',
      resolvedReferences: new Map(),
      parentElements: [],
      variables: {},
      idMap: new Map(),
    } as ProcessingContext;
  };

  // 创建一个内容节点
  const createContentNode = (text: string): Content => {
    return {
      type: NodeType.CONTENT,
      value: text,
      position: {
        start: { line: 0, column: 0, offset: 0 },
        end: { line: 0, column: text.length, offset: text.length },
      },
    };
  };

  // UT-RP-001: 测试角色属性和内容提取
  it('UT-RP-001: 应该正确提取角色属性和内容', async () => {
    const processor = new RoleTagProcessor();
    const context = createMockContext();

    // 创建一个带属性的 role 元素
    const roleElement: Element = {
      type: NodeType.ELEMENT,
      tagName: 'role',
      attributes: {
        id: 'assistant',
        type: 'ai',
      },
      children: [createContentNode('你是一个专业的AI助手，擅长回答各类问题。')],
      position: {
        start: { line: 0, column: 0, offset: 0 },
        end: { line: 0, column: 0, offset: 0 },
      },
    };

    const result = await processor.process(roleElement, context);

    // 验证元数据是否正确生成
    expect(result.metadata).toBeDefined();
    expect(result.metadata!.role.id).toBe('assistant');
    expect(result.metadata!.role.roleType).toBe('ai');

    expect(result.metadata!.processed).toBe(true);
    expect(result.metadata!.processorName).toBe('RoleTagProcessor');
  });

  // UT-RP-002: 测试复杂内容提取
  it('UT-RP-002: 应该正确处理复杂角色描述', async () => {
    const processor = new RoleTagProcessor();
    const context = createMockContext();

    // 创建复杂角色描述元素
    const roleElement: Element = {
      type: NodeType.ELEMENT,
      tagName: 'role',
      attributes: { id: 'developer' },
      children: [
        createContentNode('你是一个专业的开发者助手，需要遵循以下原则：\n'),
        createContentNode('1. 提供简洁清晰的代码\n'),
        createContentNode('2. 解释核心概念和原理\n'),
        createContentNode('3. 预测可能的问题和解决方案\n'),
        createContentNode('4. 遵循最佳实践和设计模式'),
      ],
      position: {
        start: { line: 0, column: 0, offset: 0 },
        end: { line: 0, column: 0, offset: 0 },
      },
    };

    const result = await processor.process(roleElement, context);

    // 验证多行内容是否被正确组合
    expect(result.metadata).toBeDefined();
    expect(result.metadata!.role.description).toBe(
      '你是一个专业的开发者助手，需要遵循以下原则：\n' +
        '1. 提供简洁清晰的代码\n' +
        '2. 解释核心概念和原理\n' +
        '3. 预测可能的问题和解决方案\n' +
        '4. 遵循最佳实践和设计模式'
    );
  });

  // 测试canProcess方法和优先级
  it('应该正确识别role标签并设置适当的优先级', () => {
    const processor = new RoleTagProcessor();

    // 创建一个 role 元素
    const roleElement: Element = {
      type: NodeType.ELEMENT,
      tagName: 'role',
      attributes: {},
      children: [],
      position: {
        start: { line: 0, column: 0, offset: 0 },
        end: { line: 0, column: 0, offset: 0 },
      },
    };

    // 创建一个非 role 元素
    const otherElement: Element = {
      type: NodeType.ELEMENT,
      tagName: 'other',
      attributes: {},
      children: [],
      position: {
        start: { line: 0, column: 0, offset: 0 },
        end: { line: 0, column: 0, offset: 0 },
      },
    };

    expect(processor.canProcess(roleElement)).toBe(true);
    expect(processor.canProcess(otherElement)).toBe(false);
    expect(processor.priority).toBeGreaterThan(0); // 确保优先级大于0
  });
});
