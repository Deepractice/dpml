import { ProcessedDocument } from '../processor/interfaces/processor';
import { isDocument, isElement, isContent, isReference } from '../types/node';
import { OutputAdapter } from './interfaces/outputAdapter';
import { Transformer } from './interfaces/transformer';
import { TransformContext } from './interfaces/transformContext';
import { TransformOptions } from './interfaces/transformOptions';
import { TransformerVisitor } from './interfaces/transformerVisitor';
import { ContextManager } from './context/contextManager';
import { Node, Document, Element, Content, Reference } from '../types/node';
// 导入模式配置功能
import { getModeConfig, handleModeError, ModeConfigOptions } from './utils/modeConfig';
// 导入变量配置功能
import { getVariables, resolveVariables, applyVariablesToContext } from './utils/variableConfig';
import { VisitorManager } from './visitor/visitorManager';
import { TransformerOptions } from './interfaces/transformerOptions';
import { OutputProcessor } from './interfaces/outputProcessor';
import { DefaultOutputAdapter } from './adapters/defaultOutputAdapter';
import { OutputAdapterFactory } from './interfaces/outputAdapterFactory';
// 导入合并功能
import { mergeVisitorResults, MergeOptions } from './utils/mergeUtils';

/**
 * 简单的默认输出处理器实现
 */
class NoopOutputProcessor implements OutputProcessor {
  process(data: any, context: TransformContext): any {
    return data;
  }
}

// 定义节点类型枚举
enum NodeType {
  DOCUMENT = 'document',
  ELEMENT = 'element',
  CONTENT = 'content',
  REFERENCE = 'reference'
}

// 缓存项定义
interface CacheItem {
  /**
   * 节点标识符
   */
  nodeId: string;
  
  /**
   * 内容哈希，用于验证内容是否变更
   */
  contentHash?: string;
  
  /**
   * 缓存的转换结果
   */
  result: any;
  
  /**
   * 缓存时间
   */
  timestamp?: number;
}

/**
 * 默认转换器实现
 */
export class DefaultTransformer implements Transformer {
  /**
   * 访问者数组
   * 按照优先级排序，优先级高的先被调用
   * @private
   */
  private _visitorManager: VisitorManager;
  
  /**
   * 获取访问者管理器
   * @returns 访问者管理器实例
   */
  get visitorManager(): VisitorManager {
    return this._visitorManager;
  }
  
  /**
   * 输出适配器
   * @private
   */
  private outputAdapter: OutputAdapter;
  
  /**
   * 输出处理器
   * @private
   */
  private outputProcessor: OutputProcessor;
  
  /**
   * 上下文管理器
   * @private
   */
  private contextManager: ContextManager;
  
  /**
   * 选项
   * @private
   */
  private options: TransformerOptions;
  
  /**
   * 模式配置
   * @private
   */
  private modeConfig: any;
  
  /**
   * 缓存映射
   * @private
   */
  private cache: Map<string, CacheItem> = new Map();
  
  /**
   * 输出适配器工厂
  /**
   * 构造函数
   * @param options 转换器选项
   * @param adapterFactory 输出适配器工厂
   */
  constructor(
    options: TransformerOptions = { mode: 'strict', maxErrorCount: 10 },
    private adapterFactory?: OutputAdapterFactory
  ) {
    this._visitorManager = new VisitorManager(3);
    this.outputAdapter = new DefaultOutputAdapter();
    this.outputProcessor = new NoopOutputProcessor();
    this.contextManager = new ContextManager();
    this.options = options;
    
    // 初始化模式配置
    this.modeConfig = getModeConfig(this.options);
  }
  
  /**
   * 注册访问者
   * @param visitor 转换访问者
   */
  registerVisitor(visitor: TransformerVisitor): void {
    if (!visitor) {
      console.warn('尝试注册空访问者');
      return;
    }
    
    this._visitorManager.registerVisitor(visitor);
  }
  
  /**
   * 设置输出适配器
   * @param adapter 适配器
   */
  setOutputAdapter(adapter: OutputAdapter): void {
    this.outputAdapter = adapter;
  }
  
  /**
   * 设置输出适配器工厂
   * @param adapterFactory 适配器工厂
   */
  setOutputAdapterFactory(adapterFactory: OutputAdapterFactory): void {
    this.adapterFactory = adapterFactory;
    
    // 如果有默认适配器，也可以在这里设置
    const defaultAdapter = adapterFactory.getAdapter('default');
    if (defaultAdapter) {
      this.outputAdapter = defaultAdapter;
    }
  }
  
  /**
   * 转换文档
   * @param document 文档
   * @param options 转换选项
   * @returns 转换结果
   */
  transform(document: Document, options?: TransformOptions): any {
    // 合并选项
    const mergedOptions = { ...this.options, ...options };
    
    // 检查缓存
    if (mergedOptions.enableCache !== false) {
      const cacheKey = this.getCacheKey(document);
      if (cacheKey) {
        const cachedItem = this.cache.get(cacheKey);
        
        if (cachedItem) {
          // 检查内容哈希是否匹配（确保节点内容未变）
          const currentContentHash = this.generateContentHash(document);
          if (cachedItem.contentHash && cachedItem.contentHash !== currentContentHash) {
            // 内容已变更，缓存无效
            this.cache.delete(cacheKey);
          } else {
            return cachedItem.result;
          }
        }
      }
    }
    
    try {
      // 创建根上下文
      const context = this.contextManager.createRootContext(document, mergedOptions);
      
      // 转换文档
      const result = this.transformNode(document, context);
      
      // 应用适配器
      const adaptedResult = this.applyAdapter(result, context);
      
      // 缓存结果
      if (mergedOptions.enableCache !== false) {
        const cacheKey = this.getCacheKey(document);
        if (cacheKey) {
          const contentHash = this.generateContentHash(document);
          this.cache.set(cacheKey, {
            nodeId: cacheKey,
            contentHash,
            result: adaptedResult,
            timestamp: Date.now()
          });
        }
      }
      
      return adaptedResult;
    } catch (error) {
      // 增强错误信息
      const enhancedError = this.enhanceError(error, {
        operation: 'transform',
        document: document?.type,
        mode: mergedOptions.mode
      });
      
      // 处理错误
      this.handleTransformError(enhancedError, mergedOptions);
      
      // 在严格模式下抛出错误
      if (mergedOptions.mode === 'strict') {
        throw enhancedError; // 确保抛出增强后的错误
      }
      
      // 在非严格模式下返回尽可能好的结果
      return { error: enhancedError, partial: true, errorMessage: enhancedError.message };
    }
  }
  
  /**
   * 配置转换器
   * @param options 转换选项
   */
  configure(options: TransformOptions): void {
    // 合并新选项与现有选项
    this.options = {
      ...this.options,
      ...options
    };
    
    // 更新模式配置
    this.modeConfig = getModeConfig(this.options);
    
    // 如果提供了自定义合并函数，确保它能正确处理
    if (this.options.customMergeFn) {
      this.options.mergeReturnValues = true; // 自动启用返回值合并
    }
  }
  
  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * 转换节点
   * @param node 节点
   * @param context 上下文
   * @returns 转换结果
   */
  private transformNode(node: any, context: TransformContext): any {
    if (!node) return null;
    
    let transformResult;
    
    // 根据节点类型调用不同的转换方法
    switch (node.type) {
      case 'document':
        transformResult = this.transformDocument(node as Document, context);
        break;
      case 'element':
        transformResult = this.transformElement(node as Element, context);
        break;
      case 'content':
        transformResult = this.transformContent(node as Content, context);
        break;
      case 'reference':
        transformResult = this.transformReference(node as Reference, context);
        break;
      default:
        transformResult = null;
    }
    
    return transformResult;
  }
  
  /**
   * 获取节点的缓存键
   * @param node 节点
   * @returns 缓存键
   * @private
   */
  private getCacheKey(node: any): string | undefined {
    // 如果节点有ID，直接使用
    if (node.id) {
      return `id:${node.id}`;
    }
    
    // 生成内容哈希作为键
    return this.generateContentHash(node);
  }
  
  /**
   * 生成节点内容哈希
   * @param node 节点
   * @returns 内容哈希
   * @private
   */
  private generateContentHash(node: any): string | undefined {
    if (!node) return undefined;
    
    // 根据节点类型和内容生成简单哈希
    const hashParts: string[] = [];
    
    // 添加节点类型
    hashParts.push(`type:${node.type}`);
    
    // 添加标签名（如果是元素）
    if (node.tagName) {
      hashParts.push(`tag:${node.tagName}`);
    }
    
    // 添加内容（如果有）
    if (node.content) {
      hashParts.push(`content:${node.content}`);
    }
    
    // 添加引用协议（如果是引用）
    if (node.protocol) {
      hashParts.push(`protocol:${node.protocol}`);
    }
    
    // 添加位置信息
    if (node.position) {
      hashParts.push(`pos:${node.position.start.line}-${node.position.end.line}`);
    }
    
    // 添加元数据的版本信息（如果有）
    if (node.meta && node.meta.version) {
      hashParts.push(`ver:${node.meta.version}`);
    }
    
    // 合并所有部分
    return hashParts.join('|');
  }
  
  /**
   * 从缓存获取结果
   * @param node 节点
   * @returns 缓存的结果或undefined（未命中）
   * @private
   */
  private getCachedResult(node: any): any {
    const cacheKey = this.getCacheKey(node);
    if (!cacheKey) return undefined;
    
    const cachedItem = this.cache.get(cacheKey);
    if (!cachedItem) return undefined;
    
    // 检查内容哈希是否匹配（确保节点内容未变）
    const currentContentHash = this.generateContentHash(node);
    if (cachedItem.contentHash && cachedItem.contentHash !== currentContentHash) {
      // 内容已变更，缓存无效
      this.cache.delete(cacheKey);
      return undefined;
    }
    
    return cachedItem.result;
  }
  
  /**
   * 缓存转换结果
   * @param node 节点
   * @param result 转换结果
   * @private
   */
  private cacheResult(node: any, result: any): void {
    const cacheKey = this.getCacheKey(node);
    if (!cacheKey) return;
    
    const contentHash = this.generateContentHash(node);
    
    // 存储缓存项
    this.cache.set(cacheKey, {
      nodeId: cacheKey,
      contentHash,
      result
    });
  }
  
  /**
   * 转换文档节点
   * @param document 文档节点
   * @param context 上下文
   * @returns 转换结果
   * @private
   */
  private transformDocument(document: Document, context: TransformContext): any {
    const documentType = document.type || 'document';
    
    // 检查是否有文档访问者
    const visitors = this.visitorManager.getVisitorsByMethod('visitDocument');
    if (visitors.length === 0) {
      console.warn(`No document visitors found for type: ${documentType}`);
    }
    
    const options = getModeConfig(this.options);
    const shouldMergeResults = this.options.mergeReturnValues === true;
    
    let defaultResult: any = {
      type: documentType,
      children: [] as any, // 声明为any类型
      attributes: (document as any).attributes ? { ...(document as any).attributes } : {}
    };
    
    // 访问document并处理结果
    let result: any = null;
    
    // 检查是否启用了返回值合并
    if (this.options.mergeReturnValues === true) {
      // 收集所有非空访问者结果
      const visitorResults: any[] = [];
      
      for (const visitor of visitors) {
        try {
          const visitorContext = this.contextManager.cloneContext(context);
          const visitResult = visitor.visitDocument?.(document, visitorContext);
          
          // 访问者成功执行，重置错误计数
          if (visitor.name) {
            this._visitorManager.resetErrorCount(visitor.name);
          }
          
          // 收集非空结果
          if (visitResult != null) {
            visitorResults.push(visitResult);
          }
        } catch (error) {
          this.handleTransformError(error, this.options);
        }
      }
      
      // 如果有非空结果，进行合并
      if (visitorResults.length > 0) {
        // 创建合并选项
        const mergeOptions: MergeOptions = {
          deepMerge: this.options.deepMerge === true,
          mergeArrays: this.options.mergeArrays === true,
          conflictStrategy: this.options.conflictStrategy || 'last-wins',
          customMergeFn: this.options.customMergeFn
        };
        
        // 确保自定义合并函数能够被正确应用
        if (mergeOptions.customMergeFn && typeof mergeOptions.customMergeFn === 'function') {
          console.log('使用自定义合并函数:', mergeOptions.customMergeFn.toString().substring(0, 100));
        }
        
        // 合并访问者结果
        result = mergeVisitorResults(visitorResults, mergeOptions);
        
        // 将合并后的结果添加到父结果
        context.parentResults.push(result);
      }
    } else {
      for (const visitor of visitors) {
        try {
          const visitorContext = this.contextManager.cloneContext(context);
          result = visitor.visitDocument?.(document, visitorContext);
          
          if (result !== null) {
            break;
          }
        } catch (error) {
          this.handleTransformError(error, this.options);
        }
      }
    }

    // 如果没有访问者返回结果，返回默认结果
    if (result === null) {
      return defaultResult;
    }

    // 处理子节点
    if (document.children && document.children.length > 0 && result.children) {
      const childResults = [];
      
      for (const child of document.children) {
        const childContext = this.contextManager.createChildContext(
          context,
          `${child.type}[${(child as any).id || childResults.length}]`
        );
        
        const childResult = this.transformNode(child, childContext);
        if (childResult !== null) {
          childResults.push(childResult);
        }
      }
      
      // 如果开启合并返回值，应用自定义合并函数或默认合并
      if (this.options.mergeReturnValues) {
        result.children = childResults.filter(r => r !== null) as any[];
      }
    }

    return result;
  }
  
  /**
   * 转换元素节点
   * @param element 元素节点
   * @param context 上下文
   * @returns 转换结果
   * @private
   */
  private transformElement(element: Element, context: TransformContext): any {
    const elementType = element.type || 'element';
    const tagName = element.tagName || '';
    
    // 检查是否有元素访问者
    const visitors = this.visitorManager.getVisitorsByMethod('visitElement');
    if (visitors.length === 0) {
      console.warn(`No element visitors found for tag: ${tagName}`);
    }
    
    let defaultResult: any = {
      type: elementType,
      tagName,
      children: [] as any, // 声明为any类型
      attributes: element.attributes ? { ...element.attributes } : {}
    };
    
    // 访问element并处理结果
    let result: any = null;
    
    // 检查是否启用了返回值合并
    if (this.options.mergeReturnValues === true) {
      // 收集所有非空访问者结果
      const visitorResults: any[] = [];
      
      for (const visitor of visitors) {
        try {
          const visitorContext = this.contextManager.cloneContext(context);
          const visitResult = visitor.visitElement?.(element, visitorContext);
          
          // 访问者成功执行，重置错误计数
          if (visitor.name) {
            this._visitorManager.resetErrorCount(visitor.name);
          }
          
          // 收集非空结果
          if (visitResult != null) {
            visitorResults.push(visitResult);
          }
        } catch (error) {
          this.handleTransformError(error, this.options);
        }
      }
      
      // 如果有非空结果，进行合并
      if (visitorResults.length > 0) {
        // 创建合并选项
        const mergeOptions: MergeOptions = {
          deepMerge: this.options.deepMerge === true,
          mergeArrays: this.options.mergeArrays === true,
          conflictStrategy: this.options.conflictStrategy || 'last-wins',
          customMergeFn: this.options.customMergeFn
        };
        
        // 确保自定义合并函数能够被正确应用
        if (mergeOptions.customMergeFn && typeof mergeOptions.customMergeFn === 'function') {
          console.log('使用自定义合并函数:', mergeOptions.customMergeFn.toString().substring(0, 100));
        }
        
        // 合并访问者结果
        result = mergeVisitorResults(visitorResults, mergeOptions);
        
        // 将合并后的结果添加到父结果
        context.parentResults.push(result);
      }
    } else {
      for (const visitor of visitors) {
        try {
          const visitorContext = this.contextManager.cloneContext(context);
          result = visitor.visitElement?.(element, visitorContext);
          
          if (result !== null) {
            break;
          }
        } catch (error) {
          this.handleTransformError(error, this.options);
        }
      }
    }
    
    // 如果没有访问者返回结果，返回默认结果
    if (result === null) {
      return defaultResult;
    }
    
    // 处理子节点
    if (element.children && element.children.length > 0 && result.children) {
      const childResults = [];
      
      for (const child of element.children) {
        const childContext = this.contextManager.createChildContext(
          context,
          `${child.type}[${(child as any).id || childResults.length}]`
        );
        
        const childResult = this.transformNode(child, childContext);
        if (childResult !== null) {
          childResults.push(childResult);
        }
      }
      
      // 如果开启合并返回值，应用自定义合并函数或默认合并
      if (this.options.mergeReturnValues) {
        result.children = childResults.filter(r => r !== null) as any[];
      }
    }
    
    return result;
  }
  
  /**
   * 转换内容节点
   * @param content 内容节点
   * @param context 上下文
   * @returns 转换结果
   * @private
   */
  private transformContent(content: Content, context: TransformContext): any {
    // 更新上下文路径
    const newContext = this.contextManager.createChildContext(
      context,
      'content'
    );
    
    // 获取所有内容访问者
    const contentVisitors = this._visitorManager.getVisitorsByMethod('visitContent');
    
    if (contentVisitors.length === 0) {
      // 如果没有内容访问者，返回内容本身
      return content;
    }

    // 检查是否启用了返回值合并
    const shouldMergeResults = this.options.mergeReturnValues === true;
    
    if (shouldMergeResults) {
      // 收集所有非空访问者结果
      const visitorResults: any[] = [];
      
      for (const visitor of contentVisitors) {
        try {
          // 为每个访问者克隆一个干净的上下文
          const visitorContext = this.contextManager.cloneContext(newContext);
          
          // 调用访问者处理内容
          const visitResult = visitor.visitContent!(content, visitorContext);
          
          // 访问者成功执行，重置错误计数
          if (visitor.name) {
            this._visitorManager.resetErrorCount(visitor.name);
          }
          
          // 收集非空结果
          if (visitResult != null) {
            visitorResults.push(visitResult);
          }
        } catch (error) {
          // 处理访问者错误
          this.handleVisitorError(error, visitor, 'content', content.position);
          
          // 在严格模式下，错误应该向上传播
          if (context.options.mode === 'strict') {
            throw error;
          }
        }
      }
      
      // 如果有非空结果，进行合并
      if (visitorResults.length > 0) {
        // 创建合并选项
        const mergeOptions: MergeOptions = {
          deepMerge: context.options.deepMerge === true,
          mergeArrays: context.options.mergeArrays === true,
          conflictStrategy: context.options.conflictStrategy || 'last-wins',
          customMergeFn: context.options.customMergeFn
        };
        
        // 确保自定义合并函数能够被正确应用
        if (mergeOptions.customMergeFn && typeof mergeOptions.customMergeFn === 'function') {
          console.log('使用自定义合并函数:', mergeOptions.customMergeFn.toString().substring(0, 100));
        }
        
        // 合并访问者结果
        const mergedResult = mergeVisitorResults(visitorResults, mergeOptions);
        
        // 将合并后的结果添加到父结果
        newContext.parentResults.push(mergedResult);
        return mergedResult;
      }
    } else {
      // 原有逻辑：尝试使用访问者处理内容，返回第一个非空结果
      for (const visitor of contentVisitors) {
        try {
          // 为每个访问者克隆一个干净的上下文
          const visitorContext = this.contextManager.cloneContext(newContext);
          
          // 调用访问者处理内容
          const visitResult = visitor.visitContent!(content, visitorContext);
          
          // 访问者成功执行，重置错误计数
          if (visitor.name) {
            this._visitorManager.resetErrorCount(visitor.name);
          }
          
          // 一旦有一个访问者返回非空结果，使用该结果并停止处理
          if (visitResult != null) {
            // 保存访问者结果到父结果
            newContext.parentResults.push(visitResult);
            return visitResult;
          }
          
          // 否则继续下一个访问者
        } catch (error) {
          // 处理访问者错误
          this.handleVisitorError(error, visitor, 'content', content.position);
          
          // 在严格模式下，错误应该向上传播
          if (context.options.mode === 'strict') {
            throw error;
          }
        }
      }
    }
    
    // 如果所有访问者都未返回结果，返回内容本身
    return content;
  }
  
  /**
   * 转换引用节点
   * @param reference 引用节点
   * @param context 上下文
   * @returns 转换结果
   * @private
   */
  private transformReference(reference: Reference, context: TransformContext): any {
    // 更新上下文路径
    const newContext = this.contextManager.createChildContext(
      context,
      'reference'
    );
    
    // 获取所有引用访问者
    const referenceVisitors = this._visitorManager.getVisitorsByMethod('visitReference');
    
    if (referenceVisitors.length === 0) {
      // 如果没有引用访问者，返回引用本身
      return reference;
    }

    // 检查是否启用了返回值合并
    const shouldMergeResults = this.options.mergeReturnValues === true;
    
    if (shouldMergeResults) {
      // 收集所有非空访问者结果
      const visitorResults: any[] = [];
      
      for (const visitor of referenceVisitors) {
        try {
          // 为每个访问者克隆一个干净的上下文
          const visitorContext = this.contextManager.cloneContext(newContext);
          
          // 调用访问者处理引用
          const visitResult = visitor.visitReference!(reference, visitorContext);
          
          // 访问者成功执行，重置错误计数
          if (visitor.name) {
            this._visitorManager.resetErrorCount(visitor.name);
          }
          
          // 收集非空结果
          if (visitResult != null) {
            visitorResults.push(visitResult);
          }
        } catch (error) {
          // 处理访问者错误
          this.handleVisitorError(error, visitor, 'reference', reference.position);
          
          // 在严格模式下，错误应该向上传播
          if (context.options.mode === 'strict') {
            throw error;
          }
        }
      }
      
      // 如果有非空结果，进行合并
      if (visitorResults.length > 0) {
        // 创建合并选项
        const mergeOptions: MergeOptions = {
          deepMerge: context.options.deepMerge === true,
          mergeArrays: context.options.mergeArrays === true,
          conflictStrategy: context.options.conflictStrategy || 'last-wins',
          customMergeFn: context.options.customMergeFn
        };
        
        // 确保自定义合并函数能够被正确应用
        if (mergeOptions.customMergeFn && typeof mergeOptions.customMergeFn === 'function') {
          console.log('使用自定义合并函数:', mergeOptions.customMergeFn.toString().substring(0, 100));
        }
        
        // 合并访问者结果
        const mergedResult = mergeVisitorResults(visitorResults, mergeOptions);
        
        // 将合并后的结果添加到父结果
        newContext.parentResults.push(mergedResult);
        return mergedResult;
      }
    } else {
      // 原有逻辑：尝试使用访问者处理引用，返回第一个非空结果
      for (const visitor of referenceVisitors) {
        try {
          // 为每个访问者克隆一个干净的上下文
          const visitorContext = this.contextManager.cloneContext(newContext);
          
          // 调用访问者处理引用
          const visitResult = visitor.visitReference!(reference, visitorContext);
          
          // 访问者成功执行，重置错误计数
          if (visitor.name) {
            this._visitorManager.resetErrorCount(visitor.name);
          }
          
          // 一旦有一个访问者返回非空结果，使用该结果并停止处理
          if (visitResult != null) {
            // 保存访问者结果到父结果
            newContext.parentResults.push(visitResult);
            return visitResult;
          }
          
          // 否则继续下一个访问者
        } catch (error) {
          // 处理访问者错误
          this.handleVisitorError(error, visitor, 'reference', reference.position);
          
          // 在严格模式下，错误应该向上传播
          if (context.options.mode === 'strict') {
            throw error;
          }
        }
      }
    }
    
    // 如果所有访问者都未返回结果，返回引用本身
    return reference;
  }
  
  /**
   * 应用输出适配器
   * @param result 转换结果
   * @param context 转换上下文
   * @returns 适配后的结果
   * @private
   */
  private applyAdapter(result: any, context: TransformContext): any {
    if (!this.outputAdapter) {
      return result;
    }
    
    try {
      return this.outputAdapter.adapt(result, context);
    } catch (error) {
      console.error('输出适配器错误:', error);
      
      // 在严格模式下抛出错误
      if (context.options.mode === 'strict') {
        throw error;
      }
      
      // 在非严格模式下返回原始结果
      return result;
    }
  }
  
  /**
   * 处理访问者错误
   * @param error 错误
   * @param visitor 访问者
   * @param nodeType 节点类型
   * @param position 位置信息
   * @private
   */
  private handleVisitorError(
    error: any, 
    visitor: TransformerVisitor, 
    nodeType: string, 
    position?: any
  ): void {
    // 提取访问者名称用于错误信息
    const visitorName = visitor.name || '匿名访问者';
    
    // 增强错误信息
    const enhancedError = this.enhanceError(error, {
      visitor: visitorName,
      nodeType,
      position,
      timestamp: new Date().toISOString()
    });
    
    // 增加访问者错误计数
    if (visitor.name) {
      const errorCount = this._visitorManager.incrementErrorCount(visitor.name);
      console.warn(`访问者 ${visitorName} 错误计数: ${errorCount}/${this.modeConfig.errorThreshold}`);
    }
    
    // 在非严格模式下才记录错误
    if (this.options.mode !== 'strict') {
      // 记录错误
      console.error(`转换错误: 访问者 ${visitorName} 处理 ${nodeType} 节点时出错:`, enhancedError.message, enhancedError);
    }
  }
  
  /**
   * 处理转换错误
   * @param error 错误
   * @param options 转换选项
   * @private
   */
  private handleTransformError(error: any, options: TransformOptions): void {
    // 在严格模式下，我们不需要输出到控制台，因为错误会被直接抛出
    if (options.mode !== 'strict') {
      console.error('转换过程中发生错误:', error);
    }
    
    // 应用模式配置中的错误处理逻辑
    const modeConfig = getModeConfig(options);
    handleModeError(error, modeConfig, 0);
  }
  
  /**
   * 增强错误信息
   * @param error 原始错误
   * @param info 附加信息
   * @returns 增强后的错误
   * @private
   */
  private enhanceError(error: any, info: any): Error {
    if (error instanceof Error) {
      (error as any).visitorInfo = info;
      return error;
    }
    
    const newError = new Error(error?.message || String(error));
    (newError as any).visitorInfo = info;
    (newError as any).originalError = error;
    
    return newError;
  }
  
  /**
   * 生成缓存键
   * @param document 文档
   * @param options 选项
   * @returns 缓存键
   * @private
   */
  private generateCacheKey(document: any, options: TransformOptions): string {
    // 首先尝试使用节点的缓存键
    const nodeKey = this.getCacheKey(document);
    if (nodeKey) {
      return nodeKey;
    }
    
    // 如果没有节点缓存键，使用简单的会话键
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
  
  /**
   * 禁用指定名称的访问者
   * @param visitorName 访问者名称
   * @returns 是否成功禁用
   */
  disableVisitorByName(visitorName: string): boolean {
    if (!this._visitorManager) {
      console.warn('访问者管理器未初始化');
      return false;
    }
    return this._visitorManager.disableVisitor(visitorName);
  }
  
  /**
   * 启用指定名称的访问者
   * @param visitorName 访问者名称
   * @returns 是否成功启用
   */
  enableVisitorByName(visitorName: string): boolean {
    if (!this._visitorManager) {
      console.warn('访问者管理器未初始化');
      return false;
    }
    return this._visitorManager.enableVisitor(visitorName);
  }

  /**
   * 异步转换文档
   * @param document 文档
   * @param options 转换选项
   * @returns 转换结果的Promise
   */
  async transformAsync(document: Document, options?: TransformOptions): Promise<any> {
    // 合并选项
    const mergedOptions = { ...this.options, ...options };
    
    // 检查缓存
    if (mergedOptions.enableCache !== false) {
      const cacheKey = this.getCacheKey(document);
      if (cacheKey) {
        const cachedItem = this.cache.get(cacheKey);
        
        if (cachedItem) {
          // 检查内容哈希是否匹配（确保节点内容未变）
          const currentContentHash = this.generateContentHash(document);
          if (cachedItem.contentHash && cachedItem.contentHash !== currentContentHash) {
            // 内容已变更，缓存无效
            this.cache.delete(cacheKey);
          } else {
            return cachedItem.result;
          }
        }
      }
    }
    
    try {
      // 创建根上下文
      const context = this.contextManager.createRootContext(document, mergedOptions);
      
      // 转换文档
      const result = await this.transformNodeAsync(document, context);
      
      // 应用适配器
      const adaptedResult = this.applyAdapter(result, context);
      
      // 缓存结果
      if (mergedOptions.enableCache !== false) {
        const cacheKey = this.getCacheKey(document);
        if (cacheKey) {
          const contentHash = this.generateContentHash(document);
          this.cache.set(cacheKey, {
            nodeId: cacheKey,
            contentHash,
            result: adaptedResult,
            timestamp: Date.now()
          });
        }
      }
      
      return adaptedResult;
    } catch (error) {
      // 增强错误信息
      const enhancedError = this.enhanceError(error, {
        operation: 'transformAsync',
        document: document?.type,
        mode: mergedOptions.mode
      });
      
      // 处理错误
      this.handleTransformError(enhancedError, mergedOptions);
      
      // 在严格模式下抛出错误
      if (mergedOptions.mode === 'strict') {
        throw enhancedError; // 确保抛出增强后的错误
      }
      
      // 在非严格模式下返回尽可能好的结果
      return { error: enhancedError, partial: true, errorMessage: enhancedError.message };
    }
  }

  /**
   * 异步转换节点
   * @param node 节点
   * @param context 上下文
   * @returns 转换结果Promise
   * @private
   */
  private async transformNodeAsync(node: Node, context: TransformContext): Promise<any> {
    if (!node) {
      return null;
    }

    // 根据节点类型选择相应的转换方法
    switch (node.type) {
      case 'document':
        return this.transformDocumentAsync(node as Document, context);
      case 'element':
        return this.transformElementAsync(node as Element, context);
      case 'content':
        return this.transformContentAsync(node as Content, context);
      case 'reference':
        return this.transformReferenceAsync(node as Reference, context);
      default:
        if (context.options.mode === 'strict') {
          throw new Error(`无法识别的节点类型: ${node.type}`);
        }
        return null;
    }
  }

  /**
   * 异步转换文档节点
   * @param document 文档节点
   * @param context 上下文
   * @returns 转换结果Promise
   * @private
   */
  private async transformDocumentAsync(document: Document, context: TransformContext): Promise<any> {
    // 更新上下文路径
    const newContext = this.contextManager.createChildContext(
      context,
      'document'
    );
    
    // 获取所有异步文档访问者
    const documentVisitors = this._visitorManager.getVisitorsByMethod('visitDocumentAsync');
    
    if (documentVisitors.length === 0) {
      // 如果没有异步文档访问者，默认返回一个包含子节点的结构
      const result: { type: string, children: any[] } = { type: 'document', children: [] };
      
      // 处理子节点
      if (document.children && document.children.length > 0) {
        const childrenContext = this.contextManager.createChildContext(
          newContext, 
          'children',
          { parentResults: [...newContext.parentResults, result] }
        );
        
        const childPromises = document.children.map(child => 
          this.transformNodeAsync(child, childrenContext)
        );
        
        // 等待所有子节点转换完成
        const childResults = await Promise.all(childPromises);
        
        // 过滤掉null和undefined结果
        result.children = childResults.filter(r => r != null) as any[];
      }
      
      return result;
    }
    
    // 尝试使用异步访问者处理文档
    for (const visitor of documentVisitors) {
      try {
        const visitResult = await visitor.visitDocumentAsync!(document, this.contextManager.cloneContext(newContext));
        
        // 访问者成功执行，重置错误计数
        if (visitor.name) {
          this._visitorManager.resetErrorCount(visitor.name);
        }
        
        // 一旦有一个访问者返回非空结果，使用该结果并停止处理
        if (visitResult != null) {
          // 将访问者结果添加到父结果
          newContext.parentResults.push(visitResult);
          
          // 处理子节点 (如果结果中有children属性)
          if (visitResult.children && document.children && document.children.length > 0) {
            const childrenContext = this.contextManager.createChildContext(
              newContext, 
              'children'
            );
            
            const childPromises = document.children.map(child => 
              this.transformNodeAsync(child, childrenContext)
            );
            
            // 等待所有子节点转换完成
            const childResults = await Promise.all(childPromises);
            
            // 更新子节点结果
            return {
              ...visitResult,
              children: childResults.filter(r => r != null) as any[]
            };
          }
          
          return visitResult;
        }
      } catch (error) {
        // 处理访问者错误
        this.handleVisitorError(error, visitor, 'document', document.position);
        
        // 在严格模式下，错误应该向上传播
        if (context.options.mode === 'strict') {
          throw error;
        }
      }
    }
    
    // 如果没有异步访问者返回结果，尝试使用同步方法
    return this.transformDocument(document, context);
  }

  /**
   * 异步转换元素节点
   * @param element 元素节点
   * @param context 上下文
   * @returns 转换结果Promise
   * @private
   */
  private async transformElementAsync(element: Element, context: TransformContext): Promise<any> {
    // 更新上下文路径
    const newContext = this.contextManager.createChildContext(
      context,
      `element[${element.tagName}]`
    );
    
    // 获取所有异步元素访问者
    const elementVisitors = this._visitorManager.getVisitorsByMethod('visitElementAsync');
    
    if (elementVisitors.length === 0) {
      // 如果没有异步元素访问者，默认返回一个包含子节点的结构
      const result: { type: string, tagName: string, children: any[] } = {
        type: 'element',
        tagName: element.tagName,
        children: []
      };
      
      // 处理子节点
      if (element.children && element.children.length > 0) {
        const childrenContext = this.contextManager.createChildContext(
          newContext, 
          'children',
          { parentResults: [...newContext.parentResults, result] }
        );
        
        const childPromises = element.children.map(child => 
          this.transformNodeAsync(child, childrenContext)
        );
        
        // 等待所有子节点转换完成
        const childResults = await Promise.all(childPromises);
        
        // 过滤掉null和undefined结果
        result.children = childResults.filter(r => r != null) as any[];
      }
      
      return result;
    }
    
    // 尝试使用异步访问者处理元素
    for (const visitor of elementVisitors) {
      try {
        const visitResult = await visitor.visitElementAsync!(element, this.contextManager.cloneContext(newContext));
        
        // 访问者成功执行，重置错误计数
        if (visitor.name) {
          this._visitorManager.resetErrorCount(visitor.name);
        }
        
        // 一旦有一个访问者返回非空结果，使用该结果并停止处理
        if (visitResult != null) {
          // 将访问者结果添加到父结果
          newContext.parentResults.push(visitResult);
          
          // 处理子节点 (如果结果中有children属性和元素有子节点)
          if (visitResult.children && element.children && element.children.length > 0) {
            const childrenContext = this.contextManager.createChildContext(
              newContext, 
              'children'
            );
            
            const childPromises = element.children.map(child => 
              this.transformNodeAsync(child, childrenContext)
            );
            
            // 等待所有子节点转换完成
            const childResults = await Promise.all(childPromises);
            
            // 更新子节点结果
            return {
              ...visitResult,
              children: childResults.filter(r => r != null) as any[]
            };
          }
          
          return visitResult;
        }
      } catch (error) {
        // 处理访问者错误
        this.handleVisitorError(error, visitor, 'element', element.position);
        
        // 在严格模式下，错误应该向上传播
        if (context.options.mode === 'strict') {
          throw error;
        }
      }
    }
    
    // 如果没有异步访问者返回结果，尝试使用同步方法
    return this.transformElement(element, context);
  }

  /**
   * 异步转换内容节点
   * @param content 内容节点
   * @param context 上下文
   * @returns 转换结果Promise
   * @private
   */
  private async transformContentAsync(content: Content, context: TransformContext): Promise<any> {
    // 更新上下文路径
    const newContext = this.contextManager.createChildContext(
      context,
      'content'
    );
    
    // 获取所有异步内容访问者
    const contentVisitors = this._visitorManager.getVisitorsByMethod('visitContentAsync');
    
    if (contentVisitors.length === 0) {
      // 如果没有异步内容访问者，返回简单的内容结构
      return {
        type: 'content',
        value: content.value || ''
      };
    }
    
    // 尝试使用异步访问者处理内容
    for (const visitor of contentVisitors) {
      try {
        const visitResult = await visitor.visitContentAsync!(content, this.contextManager.cloneContext(newContext));
        
        // 访问者成功执行，重置错误计数
        if (visitor.name) {
          this._visitorManager.resetErrorCount(visitor.name);
        }
        
        // 一旦有一个访问者返回非空结果，使用该结果并停止处理
        if (visitResult != null) {
          // 将访问者结果添加到父结果
          newContext.parentResults.push(visitResult);
          return visitResult;
        }
      } catch (error) {
        // 处理访问者错误
        this.handleVisitorError(error, visitor, 'content', content.position);
        
        // 在严格模式下，错误应该向上传播
        if (context.options.mode === 'strict') {
          throw error;
        }
      }
    }
    
    // 如果没有异步访问者返回结果，尝试使用同步方法
    return this.transformContent(content, context);
  }

  /**
   * 异步转换引用节点
   * @param reference 引用节点
   * @param context 上下文
   * @returns 转换结果Promise
   * @private
   */
  private async transformReferenceAsync(reference: Reference, context: TransformContext): Promise<any> {
    // 更新上下文路径
    const newContext = this.contextManager.createChildContext(
      context,
      `reference[${reference.path}]`
    );
    
    // 获取所有异步引用访问者
    const referenceVisitors = this._visitorManager.getVisitorsByMethod('visitReferenceAsync');
    
    if (referenceVisitors.length === 0) {
      // 如果没有异步引用访问者，返回简单的引用结构
      return {
        type: 'reference',
        protocol: reference.protocol,
        path: reference.path
      };
    }
    
    // 尝试使用异步访问者处理引用
    for (const visitor of referenceVisitors) {
      try {
        const visitResult = await visitor.visitReferenceAsync!(reference, this.contextManager.cloneContext(newContext));
        
        // 访问者成功执行，重置错误计数
        if (visitor.name) {
          this._visitorManager.resetErrorCount(visitor.name);
        }
        
        // 一旦有一个访问者返回非空结果，使用该结果并停止处理
        if (visitResult != null) {
          // 将访问者结果添加到父结果
          newContext.parentResults.push(visitResult);
          return visitResult;
        }
      } catch (error) {
        // 处理访问者错误
        this.handleVisitorError(error, visitor, 'reference', reference.position);
        
        // 在严格模式下，错误应该向上传播
        if (context.options.mode === 'strict') {
          throw error;
        }
      }
    }
    
    // 如果没有异步访问者返回结果，尝试使用同步方法
    return this.transformReference(reference, context);
  }
} 