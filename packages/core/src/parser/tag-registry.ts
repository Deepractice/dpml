import { TagDefinition } from './tag-definition';

/**
 * 标签注册表
 * 管理所有标签定义的注册和获取
 */
export class TagRegistry {
  /**
   * 存储标签定义的映射表
   * 键为标签名，值为标签定义
   */
  private tags: Map<string, TagDefinition>;
  
  /**
   * 构造函数
   */
  constructor() {
    this.tags = new Map<string, TagDefinition>();
  }
  
  /**
   * 注册标签定义
   * @param tagName 标签名称
   * @param definition 标签定义
   */
  registerTagDefinition(tagName: string, definition: TagDefinition): void {
    if (!tagName) {
      throw new Error('标签名不能为空');
    }
    
    // 标准化标签名称（小写）
    const normalizedName = tagName.toLowerCase();
    
    // 存储标签定义
    this.tags.set(normalizedName, { ...definition });
  }
  
  /**
   * 获取标签定义
   * @param tagName 标签名称
   * @returns 标签定义，如果不存在则返回undefined
   */
  getTagDefinition(tagName: string): TagDefinition | undefined {
    if (!tagName) {
      return undefined;
    }
    
    // 标准化标签名称（小写）
    const normalizedName = tagName.toLowerCase();
    
    // 返回标签定义
    return this.tags.get(normalizedName);
  }
  
  /**
   * 检查标签是否已注册
   * @param tagName 标签名称
   * @returns 如果标签已注册则返回true，否则返回false
   */
  isTagRegistered(tagName: string): boolean {
    if (!tagName) {
      return false;
    }
    
    // 标准化标签名称（小写）
    const normalizedName = tagName.toLowerCase();
    
    // 检查标签是否存在
    return this.tags.has(normalizedName);
  }
  
  /**
   * 获取所有已注册的标签名称
   * @returns 标签名称数组
   */
  getAllTagNames(): string[] {
    return Array.from(this.tags.keys());
  }
  
  /**
   * 移除标签定义
   * @param tagName 标签名称
   * @returns 如果标签存在并被移除则返回true，否则返回false
   */
  removeTagDefinition(tagName: string): boolean {
    if (!tagName) {
      return false;
    }
    
    // 标准化标签名称（小写）
    const normalizedName = tagName.toLowerCase();
    
    // 移除标签定义
    return this.tags.delete(normalizedName);
  }
  
  /**
   * 清空所有标签定义
   */
  clear(): void {
    this.tags.clear();
  }
} 