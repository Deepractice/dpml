/**
 * 标准命令单元测试
 */
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { describe, it, expect, vi, beforeEach, afterEach, assert } from 'vitest';

import { parse } from '../../../../../api/parser';
import { processDocument } from '../../../../../api/processing';
import { processSchema } from '../../../../../api/schema';
import { standardActions } from '../../../../../core/framework/cli/standardActions';
import { createStandardActionTestFixture } from '../../../../fixtures/framework/cliFixtures';

// 模拟依赖模块
vi.mock('fs/promises');
vi.mock('../../../../../api/parser');
vi.mock('../../../../../api/processing');
vi.mock('../../../../../api/schema');

// 简化的测试文档结构
interface TestDocument {
  rootNode: {
    tagName: string;
    attributes: Map<string, string>;
    children: any[];
    content: string;
    parent: any;
  };
  metadata: Record<string, any>;
}

describe('UT-STDACT: 标准命令测试', () => {
  // 测试夹具
  const fixture = createStandardActionTestFixture();
  let tempDir: string;
  let testFilePath: string;

  // 模拟函数
  let mockReadFile: any;
  let mockWriteFile: any;
  let mockParse: any;
  let mockProcessDocument: any;
  let mockProcessSchema: any;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(async () => {
    // 重置模拟
    vi.resetAllMocks();

    // 创建临时目录路径
    tempDir = path.join(os.tmpdir(), 'dpml-test-' + Math.random().toString(36).substring(2, 10));
    testFilePath = path.join(tempDir, 'test.dpml');

    // 设置模拟函数
    mockReadFile = vi.mocked(fs.readFile).mockResolvedValue(fixture.fileContent);
    mockWriteFile = vi.mocked(fs.writeFile).mockResolvedValue();

    // 创建简化的测试文档
    const testDoc: TestDocument = {
      rootNode: {
        tagName: 'test',
        attributes: new Map([['id', '123']]),
        children: [],
        content: 'Test content',
        parent: null
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    };

    mockParse = vi.mocked(parse).mockResolvedValue(testDoc as any);
    mockProcessDocument = vi.mocked(processDocument).mockReturnValue({
      document: testDoc as any,
      isValid: true,
      validation: {
        isValid: true,
        errors: [],
        warnings: []
      }
    });
    mockProcessSchema = vi.mocked(processSchema).mockReturnValue({
      schema: fixture.context.schema,
      isValid: true
    });

    // 监听控制台输出
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('UT-STDACT-01: standardActions应定义validate命令', () => {
    // 验证validate命令存在
    const validateCommand = standardActions.find(cmd => cmd.name === 'validate');

    expect(validateCommand).toBeDefined();
    expect(validateCommand?.description).toContain('Validate DPML document');

    // 验证参数定义
    expect(validateCommand?.args).toHaveLength(1);
    expect(validateCommand?.args?.[0].name).toBe('file');
    expect(validateCommand?.args?.[0].required).toBe(true);

    // 验证选项定义
    expect(validateCommand?.options).toHaveLength(1);
    expect(validateCommand?.options?.[0].flags).toBe('--strict');

    // 验证执行器函数
    expect(validateCommand?.action).toBeTypeOf('function');
  });

  it('UT-STDACT-02: standardActions应定义parse命令', () => {
    // 验证parse命令存在
    const parseCommand = standardActions.find(cmd => cmd.name === 'parse');

    expect(parseCommand).toBeDefined();
    expect(parseCommand?.description).toContain('Parse DPML document');

    // 验证参数定义
    expect(parseCommand?.args).toHaveLength(1);
    expect(parseCommand?.args?.[0].name).toBe('file');
    expect(parseCommand?.args?.[0].required).toBe(true);

    // 验证选项定义
    expect(parseCommand?.options).toHaveLength(2);
    expect(parseCommand?.options?.[0].flags).toBe('--output <file>');
    expect(parseCommand?.options?.[1].flags).toBe('--format <format>');
    expect(parseCommand?.options?.[1].defaultValue).toBe('json');

    // 验证执行器函数
    expect(parseCommand?.action).toBeTypeOf('function');
  });

  it('UT-STDACT-04: validate命令executor应正确执行验证', async () => {
    // 获取validate命令
    const validateCommand = standardActions.find(cmd => cmd.name === 'validate');

    expect(validateCommand).toBeDefined();

    if (!validateCommand) return; // TypeScript类型保护

    // 执行命令
    await validateCommand.action(
      fixture.actionContext,
      testFilePath,
      { strict: true }
    );

    // 验证文件读取
    expect(mockReadFile).toHaveBeenCalledWith(testFilePath, 'utf-8');

    // 验证Schema处理
    expect(mockProcessSchema).toHaveBeenCalled();

    // 验证解析调用
    expect(mockParse).toHaveBeenCalledWith(fixture.fileContent);

    // 验证文档处理
    expect(mockProcessDocument).toHaveBeenCalled();

    // 验证日志输出
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Validation status'));
  });

  it('validate命令应处理验证失败的情况', async () => {
    // 获取validate命令
    const validateCommand = standardActions.find(cmd => cmd.name === 'validate');

    expect(validateCommand).toBeDefined();

    if (!validateCommand) return; // TypeScript类型保护

    // 模拟验证失败
    const invalidDoc: TestDocument = {
      rootNode: {
        tagName: 'test',
        attributes: new Map(),
        children: [],
        content: 'Test content',
        parent: null
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    };

    mockProcessDocument.mockReturnValue({
      document: invalidDoc as any,
      isValid: false,
      validation: {
        isValid: false,
        errors: [{ message: '缺少必需的id属性' }],
        warnings: []
      }
    });

    // 执行命令 - 非严格模式
    await validateCommand.action(
      fixture.actionContext,
      testFilePath,
      { strict: false }
    );

    // 验证错误日志
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Validation failed'));

    // 重置模拟
    vi.clearAllMocks();

    // 执行命令 - 严格模式，应该抛出错误
    // 使用try/catch来捕获错误
    try {
      await validateCommand.action(
        fixture.actionContext,
        testFilePath,
        { strict: true }
      );
      // 如果执行到这里，说明没有抛出错误
      assert.fail('应该抛出错误，但没有');
    } catch (error) {
      // 验证错误消息
      expect(error.message).toBe('Document validation failed');
    }
  });

  it('parse命令executor应正确执行解析', async () => {
    // 获取parse命令
    const parseCommand = standardActions.find(cmd => cmd.name === 'parse');

    expect(parseCommand).toBeDefined();

    if (!parseCommand) return; // TypeScript类型保护

    // 创建测试文档
    const testDoc: TestDocument = {
      rootNode: {
        tagName: 'test',
        attributes: new Map([['id', '123']]),
        children: [],
        content: 'Test content',
        parent: null
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    };

    // 重置模拟并设置有效返回值
    vi.clearAllMocks();

    // 明确使用mockImplementation模拟异步返回
    mockParse = vi.mocked(parse).mockImplementation(async () => {
      return testDoc as any;
    });

    mockProcessDocument.mockReturnValue({
      document: testDoc as any,
      isValid: true,
      validation: {
        isValid: true,
        errors: [],
        warnings: []
      }
    });

    mockProcessSchema.mockReturnValue({
      schema: fixture.context.schema,
      isValid: true
    });

    // 执行命令 - 输出到控制台
    await parseCommand.action(
      fixture.actionContext,
      testFilePath,
      { format: 'json' }
    );

    // 验证文件读取
    expect(mockReadFile).toHaveBeenCalledWith(testFilePath, 'utf-8');

    // 验证解析调用
    expect(mockParse).toHaveBeenCalledWith(fixture.fileContent);

    // 验证Schema处理
    expect(mockProcessSchema).toHaveBeenCalled();

    // 验证文档处理
    expect(mockProcessDocument).toHaveBeenCalled();

    // 验证日志输出
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Parsed result'));

    // 重置模拟
    vi.clearAllMocks();

    // 重新设置模拟
    mockParse = vi.mocked(parse).mockImplementation(async () => {
      return testDoc as any;
    });

    mockProcessDocument.mockReturnValue({
      document: testDoc as any,
      isValid: true,
      validation: {
        isValid: true,
        errors: [],
        warnings: []
      }
    });

    mockProcessSchema.mockReturnValue({
      schema: fixture.context.schema,
      isValid: true
    });

    // 执行命令 - 输出到文件
    await parseCommand.action(
      fixture.actionContext,
      testFilePath,
      { format: 'json', output: 'output.json' }
    );

    // 验证文件写入
    expect(mockWriteFile).toHaveBeenCalledWith('output.json', expect.any(String), 'utf-8');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Results saved to'));
  });

  it('parse命令应处理不支持的格式', async () => {
    // 获取parse命令
    const parseCommand = standardActions.find(cmd => cmd.name === 'parse');

    expect(parseCommand).toBeDefined();

    if (!parseCommand) return; // TypeScript类型保护

    // 确保mockParse返回有效的文档结构
    const testDoc: TestDocument = {
      rootNode: {
        tagName: 'test',
        attributes: new Map([['id', '123']]),
        children: [],
        content: 'Test content',
        parent: null
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    };

    // 重置模拟并设置有效返回值
    vi.clearAllMocks();
    mockParse = vi.mocked(parse).mockImplementation(async () => {
      return testDoc as any;
    });
    mockProcessSchema.mockReturnValue({
      schema: fixture.context.schema,
      isValid: true
    });

    // 执行命令 - 不支持的格式
    await expect(parseCommand.action(
      fixture.actionContext,
      testFilePath,
      { format: 'unsupported' }
    )).rejects.toThrow('Unsupported output format');
  });

  it('命令应处理文件读取错误', async () => {
    // 获取validate命令
    const validateCommand = standardActions.find(cmd => cmd.name === 'validate');

    expect(validateCommand).toBeDefined();

    if (!validateCommand) return; // TypeScript类型保护

    // 模拟文件读取错误
    mockReadFile.mockRejectedValue(new Error('文件不存在'));

    // 执行命令
    await expect(validateCommand.action(
      fixture.actionContext,
      testFilePath,
      { strict: true }
    )).rejects.toThrow('文件不存在');

    // 验证错误日志
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error validating document'));
  });
});
