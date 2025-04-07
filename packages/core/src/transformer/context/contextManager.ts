import { TransformContext } from '../interfaces/transformContext';
import { ProcessedDocument } from '../../processor/interfaces/processor';
import { TransformOptions } from '../interfaces/transformOptions';

/**
 * 上下文管理器，负责创建和管理转换上下文
 */
export class ContextManager {
  /**
   * 创建根上下文
   * @param document 处理后的文档
   * @param options 转换选项
   * @returns 根上下文
   */
  createRootContext(document: ProcessedDocument, options: TransformOptions): TransformContext {
    return {
      document,
      options,
      output: {},
      variables: { ...options.variables },
      path: [],
      parentResults: []
    };
  }
  
  /**
   * 创建子上下文
   * @param parentContext 父上下文
   * @param pathElement 路径元素
   * @param variables 变量覆盖
   * @returns 子上下文
   */
  createChildContext(
    parentContext: TransformContext,
    pathElement: string,
    variables?: Record<string, any>
  ): TransformContext {
    return {
      ...parentContext,
      path: [...parentContext.path, pathElement],
      variables: {
        ...parentContext.variables,
        ...(variables || {})
      },
      parentResults: [...parentContext.parentResults]
    };
  }
  
  /**
   * 添加结果到上下文
   * @param context 上下文
   * @param result 结果
   * @returns 更新后的上下文
   */
  addResult(context: TransformContext, result: any): TransformContext {
    return {
      ...context,
      parentResults: [...context.parentResults, result]
    };
  }
  
  /**
   * 获取当前路径位置
   * @param context 上下文
   * @returns 当前路径位置名称
   */
  getCurrentPathElement(context: TransformContext): string | undefined {
    if (context.path.length === 0) {
      return undefined;
    }
    
    return context.path[context.path.length - 1];
  }
  
  /**
   * 获取父路径位置
   * @param context 上下文
   * @returns 父路径位置名称
   */
  getParentPathElement(context: TransformContext): string | undefined {
    if (context.path.length < 2) {
      return undefined;
    }
    
    return context.path[context.path.length - 2];
  }
  
  /**
   * 获取路径标识符
   * @param context 上下文
   * @param separator 分隔符
   * @returns 路径标识符
   */
  getPathIdentifier(context: TransformContext, separator: string = '/'): string {
    return context.path.join(separator);
  }
  
  /**
   * 检查上下文路径是否包含指定元素
   * @param context 上下文
   * @param element 路径元素
   * @returns 是否包含
   */
  pathContains(context: TransformContext, element: string): boolean {
    return context.path.includes(element);
  }
  
  /**
   * 获取路径元素的索引
   * @param pathElement 路径元素
   * @returns 索引或undefined
   */
  getElementIndex(pathElement: string): number | undefined {
    const matches = pathElement.match(/\[(\d+)\]/);
    if (matches && matches.length > 1) {
      return parseInt(matches[1], 10);
    }
    return undefined;
  }
  
  /**
   * 获取路径元素的名称（不含索引或标识符）
   * @param pathElement 路径元素
   * @returns 名称
   */
  getElementName(pathElement: string): string {
    return pathElement.replace(/\[[^\]]*\]/, '');
  }
  
  /**
   * 获取路径元素的标识符
   * @param pathElement 路径元素
   * @returns 标识符或undefined
   */
  getElementIdentifier(pathElement: string): string | undefined {
    const matches = pathElement.match(/\[([^\d][^\]]*)\]/);
    if (matches && matches.length > 1) {
      return matches[1];
    }
    return undefined;
  }
  
  /**
   * 设置变量
   * @param context 上下文
   * @param name 变量名
   * @param value 变量值
   * @returns 更新后的上下文
   */
  setVariable(context: TransformContext, name: string, value: any): TransformContext {
    return {
      ...context,
      variables: {
        ...context.variables,
        [name]: value
      }
    };
  }
  
  /**
   * 获取变量
   * @param context 上下文
   * @param name 变量名
   * @param defaultValue 默认值
   * @returns 变量值
   */
  getVariable(context: TransformContext, name: string, defaultValue?: any): any {
    return name in context.variables
      ? context.variables[name]
      : defaultValue;
  }
  
  /**
   * 批量设置变量
   * @param context 上下文
   * @param variables 变量映射
   * @returns 更新后的上下文
   */
  setVariables(context: TransformContext, variables: Record<string, any>): TransformContext {
    return {
      ...context,
      variables: {
        ...context.variables,
        ...variables
      }
    };
  }
  
  /**
   * 创建新的上下文副本
   * @param context 原上下文
   * @returns 上下文副本
   */
  cloneContext(context: TransformContext): TransformContext {
    return {
      ...context,
      variables: { ...context.variables },
      path: [...context.path],
      parentResults: [...context.parentResults],
      output: { ...context.output }
    };
  }
} 