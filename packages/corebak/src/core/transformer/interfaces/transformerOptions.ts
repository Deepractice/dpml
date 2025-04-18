/**
 * 转换器选项接口
 */
export interface TransformerOptions {
  /**
   * 运行模式
   * - strict: 严格模式，出现错误立即抛出异常
   * - lenient: 宽松模式，尝试恢复并继续处理
   * - ignore: 忽略模式，忽略错误并继续处理
   * - loose: 松散模式，与lenient类似但允许更多的格式变化
   */
  mode?: 'strict' | 'lenient' | 'ignore' | 'loose';

  /**
   * 最大错误数量
   * 超过此数量时，即使在宽松模式下也会停止处理
   */
  maxErrorCount?: number;

  /**
   * 是否启用缓存
   */
  enableCache?: boolean;

  /**
   * 缓存过期时间（毫秒）
   */
  cacheExpiry?: number;

  /**
   * 访问者错误阈值
   * 单个访问者达到此错误次数时将被自动禁用
   * 默认为3
   */
  visitorErrorThreshold?: number;

  /**
   * 访问者自动恢复时间（毫秒）
   * 被禁用的访问者在此时间后自动恢复
   * 设置为0表示不自动恢复，默认为0
   */
  visitorAutoRecoveryTime?: number;

  /**
   * 自定义选项
   */
  [key: string]: any;
}
