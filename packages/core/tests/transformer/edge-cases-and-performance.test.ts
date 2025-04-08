import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DefaultTransformer } from '../../src/transformer/defaultTransformer';
import { DefaultTransformerFactory } from '../../src/transformer/defaultTransformerFactory';
import { DefaultOutputAdapterFactory } from '../../src/transformer/adapters/defaultOutputAdapterFactory';
import { TransformerVisitor } from '../../src/transformer/interfaces/transformerVisitor';
import { OutputAdapter } from '../../src/transformer/interfaces/outputAdapter';
import { Document, Element, SourcePosition } from '../../src/types/node';
import { NodeType } from '../../src/types/node';
import { Content } from '../../src/types/node';
import { TransformContext } from '../../src/transformer/interfaces/transformContext';
import { performance } from 'perf_hooks';

/**
 * 创建一个大文档，包含指定数量的元素
 */
function createLargeDocument(elementCount: number): Document {
  const document: Document = {
    type: NodeType.DOCUMENT,
    children: [],
    position: {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 1, column: 1, offset: 0 }
    }
  };

  for (let i = 0; i < elementCount; i++) {
    const element: Element = {
      type: NodeType.ELEMENT,
      tagName: `element-${i}`,
      attributes: { id: `element-${i}` },
      children: [],
      position: {
        start: { line: i + 1, column: 1, offset: i * 10 },
        end: { line: i + 1, column: 10, offset: i * 10 + 10 }
      }
    };

    // 每个元素添加一个内容节点
    const content: Content = {
      type: NodeType.CONTENT,
      value: `Content for element ${i}`,
      position: {
        start: { line: i + 1, column: 2, offset: i * 10 + 1 },
        end: { line: i + 1, column: 9, offset: i * 10 + 9 }
      }
    };

    element.children.push(content);
    document.children.push(element);
  }

  return document;
}

/**
 * 创建一个深度嵌套的文档，嵌套深度为指定的级别
 */
function createDeepNestedDocument(depth: number): Document {
  const document: Document = {
    type: NodeType.DOCUMENT,
    children: [],
    position: {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: depth + 1, column: 1, offset: depth * 10 }
    }
  };

  let currentElement: Element = {
    type: NodeType.ELEMENT,
    tagName: 'level-0',
    attributes: { level: 0 },
    children: [],
    position: {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: depth + 1, column: 1, offset: depth * 10 }
    }
  };

  document.children.push(currentElement);

  // 创建嵌套结构
  for (let i = 1; i < depth; i++) {
    const nestedElement: Element = {
      type: NodeType.ELEMENT,
      tagName: `level-${i}`,
      attributes: { level: i },
      children: [],
      position: {
        start: { line: i + 1, column: 1, offset: i * 10 },
        end: { line: depth + 1, column: 1, offset: depth * 10 }
      }
    };

    currentElement.children.push(nestedElement);
    currentElement = nestedElement;
  }

  // 在最深层添加一个内容节点
  const content: Content = {
    type: NodeType.CONTENT,
    value: `Deepest content at level ${depth}`,
    position: {
      start: { line: depth, column: 1, offset: depth * 10 },
      end: { line: depth, column: 10, offset: depth * 10 + 10 }
    }
  };

  currentElement.children.push(content);

  return document;
}

/**
 * 计数访问者，用于统计各类节点访问次数
 */
class CountingVisitor implements TransformerVisitor {
  name = 'CountingVisitor';
  priority = 100;
  documentCount = 0;
  elementCount = 0;
  contentCount = 0;

  visitDocument(document: Document, context: TransformContext) {
    this.documentCount++;
    return document;
  }

  visitElement(element: Element, context: TransformContext) {
    this.elementCount++;
    return element;
  }

  visitContent(content: Content, context: TransformContext) {
    this.contentCount++;
    return content;
  }

  reset() {
    this.documentCount = 0;
    this.elementCount = 0;
    this.contentCount = 0;
  }
}

describe('边界和性能测试', () => {
  let transformerFactory: DefaultTransformerFactory;
  let adapterFactory: DefaultOutputAdapterFactory;
  let transformer: DefaultTransformer;
  let countingVisitor: CountingVisitor;

  beforeEach(() => {
    adapterFactory = new DefaultOutputAdapterFactory();
    transformerFactory = new DefaultTransformerFactory();
    transformer = transformerFactory.createTransformer({}, adapterFactory) as DefaultTransformer;
    countingVisitor = new CountingVisitor();
    transformer.registerVisitor(countingVisitor);
  });

  it('大文档转换性能测试 - 应该在可接受的时间内转换大文档', async () => {
    // 创建一个包含1000个元素的大文档
    const largeDocument = createLargeDocument(1000);
    
    // 记录开始时间
    const startTime = performance.now();
    
    // 执行转换
    const result = transformer.transform(largeDocument);
    
    // 计算执行时间
    const executionTime = performance.now() - startTime;
    
    console.log(`大文档转换执行时间: ${executionTime}ms`);
    
    // 验证结果
    expect(result).toBeDefined();
    expect(countingVisitor.documentCount).toBe(1);
    expect(countingVisitor.elementCount).toBe(1000);
    expect(countingVisitor.contentCount).toBe(1000);
    
    // 验证执行时间在可接受范围内 (5秒)
    expect(executionTime).toBeLessThan(5000);
  });

  it('深度嵌套结构测试 - 应该能处理深度嵌套的结构', async () => {
    // 创建一个深度为500级的嵌套文档
    const deepDocument = createDeepNestedDocument(500);
    
    // 记录开始时间
    const startTime = performance.now();
    
    // 执行转换
    const result = transformer.transform(deepDocument);
    
    // 计算执行时间
    const executionTime = performance.now() - startTime;
    
    console.log(`深度嵌套文档转换执行时间: ${executionTime}ms`);
    
    // 验证结果
    expect(result).toBeDefined();
    expect(countingVisitor.documentCount).toBe(1);
    expect(countingVisitor.elementCount).toBe(500);
    expect(countingVisitor.contentCount).toBe(1);
    
    // 验证执行时间在可接受范围内 (5秒)
    expect(executionTime).toBeLessThan(5000);
  });

  it('内存使用监控测试 - 应该在转换大文档时内存使用在合理范围', async () => {
    // 创建更大的文档 (5000个元素)
    const veryLargeDocument = createLargeDocument(5000);
    
    // 记录内存使用前
    const beforeMemory = process.memoryUsage().heapUsed;
    
    // 执行转换
    const result = transformer.transform(veryLargeDocument);
    
    // 记录内存使用后
    const afterMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = (afterMemory - beforeMemory) / 1024 / 1024; // MB
    
    console.log(`内存增长: ${memoryGrowth.toFixed(2)} MB`);
    
    // 验证结果
    expect(result).toBeDefined();
    expect(countingVisitor.documentCount).toBe(1);
    expect(countingVisitor.elementCount).toBe(5000);
    expect(countingVisitor.contentCount).toBe(5000);
    
    // 验证内存增长在合理范围内 (100MB)
    expect(memoryGrowth).toBeLessThan(100);
  });

  it('并发转换测试 - 应该能同时处理多个转换请求', async () => {
    // 创建不同大小的文档
    const smallDocument = createLargeDocument(100);
    const mediumDocument = createLargeDocument(500);
    const largeDocument = createLargeDocument(1000);
    
    // 记录开始时间
    const startTime = performance.now();
    
    // 并发执行多个转换
    const results = await Promise.all([
      transformer.transform(smallDocument),
      transformer.transform(mediumDocument),
      transformer.transform(largeDocument),
      transformer.transform(createDeepNestedDocument(200))
    ]);
    
    // 计算执行时间
    const executionTime = performance.now() - startTime;
    
    console.log(`并发转换执行时间: ${executionTime}ms`);
    
    // 验证结果
    expect(results.length).toBe(4);
    results.forEach(result => {
      expect(result).toBeDefined();
    });
    
    // 验证总执行时间在可接受范围内 (10秒)
    expect(executionTime).toBeLessThan(10000);
  });
}); 