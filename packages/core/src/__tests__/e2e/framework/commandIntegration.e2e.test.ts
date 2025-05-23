/**
 * 命令集成端到端测试
 * 测试领域命令的集成与执行
 */
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

import { createDomainDPML } from '../../../api/framework';
import { getAllRegisteredCommands, resetCommandRegistry } from '../../../core/framework/domainService';
import type { DomainActionContext } from '../../../types/DomainAction';
import type { DomainConfig } from '../../../types/DomainConfig';
import type { Transformer } from '../../../types/Transformer';
import { createDomainActionContextFixture } from '../../fixtures/framework/cliFixtures';

// 创建通用转换器夹具
const createDummyTransformer = (): Transformer<unknown, unknown> => ({
  name: 'DummyTransformer',
  transform: (data: unknown) => ({ result: 'transformed' })
});

describe('命令集成端到端测试', () => {
  // 创建临时文件目录
  let tempDir: string;
  // 创建一个命令上下文模拟对象，用于测试命令执行
  const testActionContext = createDomainActionContextFixture();

  beforeAll(async () => {
    // 设置测试环境
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dpml-cli-test-'));
  });

  afterAll(async () => {
    // 清理测试环境
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  // 每个测试前后重置命令注册表
  beforeEach(() => {
    resetCommandRegistry();
  });

  afterEach(() => {
    resetCommandRegistry();
  });

  test('E2E-CMDINT-01: 用户应能在DomainConfig中配置领域命令', () => {
    // 准备测试数据
    const config: DomainConfig = {
      domain: 'test-domain',
      description: '测试领域',
      schema: {
        root: {
          element: 'test',
          attributes: [
            { name: 'id', type: 'string', required: true }
          ],
          children: {
            elements: []
          }
        }
      },
      transformers: [createDummyTransformer()],
      commands: {
        includeStandard: true,
        actions: [
          {
            name: 'custom-action',
            description: '自定义命令',
            args: [{ name: 'input', description: '输入文件', required: true }],
            options: [{ flags: '--format <type>', description: '输出格式' }],
            action: async (actionContext: DomainActionContext, input, options) => {
              // 仅打印信息，不返回值以符合void类型要求
              console.log(`处理输入: ${input} 格式: ${options?.format || 'default'}`);
            }
          }
        ]
      }
    };

    // 创建领域编译器并验证命令注册
    createDomainDPML(config);
    const commands = getAllRegisteredCommands();

    // 验证标准命令和自定义命令都已注册
    expect(commands.some(cmd => cmd.name === `${config.domain}:validate`)).toBe(true);
    expect(commands.some(cmd => cmd.name === `${config.domain}:parse`)).toBe(true);
    expect(commands.some(cmd => cmd.name === `${config.domain}:custom-action`)).toBe(true);

    // 验证命令包含正确的领域信息
    const customCommand = commands.find(cmd => cmd.name === `${config.domain}:custom-action`);

    expect(customCommand?.category).toBe(config.domain);
    expect(customCommand?.description).toBe('自定义命令');
  });

  test('E2E-CMDINT-02: 用户应能获取并注册领域命令到CLI', () => {
    // 准备：创建两个不同领域的配置
    const domain1Config: DomainConfig = {
      domain: 'domain1',
      description: '领域1',
      schema: {
        root: {
          element: 'test',
          attributes: [{ name: 'id', type: 'string', required: true }],
          children: { elements: [] }
        }
      },
      transformers: [createDummyTransformer()],
      commands: {
        includeStandard: true
      }
    };

    const domain2Config: DomainConfig = {
      domain: 'domain2',
      description: '领域2',
      schema: {
        root: {
          element: 'test',
          attributes: [{ name: 'id', type: 'string', required: true }],
          children: { elements: [] }
        }
      },
      transformers: [createDummyTransformer()],
      commands: {
        includeStandard: true,
        actions: [
          {
            name: 'special-command',
            description: '领域2特殊命令',
            action: async (actionContext: DomainActionContext) => {
              // 仅打印信息，不返回值以符合void类型要求
              console.log(`执行领域特殊命令: ${actionContext.getDomain()}`);
            }
          }
        ]
      }
    };

    // 执行：创建两个领域的编译器
    createDomainDPML(domain1Config);
    createDomainDPML(domain2Config);

    // 验证：获取所有注册的命令
    const commands = getAllRegisteredCommands();

    // 应该有7个命令而不是5个（因为DomainDPML接口的变化）
    expect(commands.length).toBe(7);

    // 每个领域应该有自己的命令
    const domain1Commands = commands.filter(cmd => cmd.category === 'domain1');
    const domain2Commands = commands.filter(cmd => cmd.category === 'domain2');

    expect(domain1Commands.length).toBe(2); // validate, parse
    expect(domain2Commands.length).toBe(3); // validate, parse, special-command

    // 命令名称应该包含领域前缀
    expect(domain1Commands.every(cmd => cmd.name.startsWith('domain1:'))).toBe(true);
    expect(domain2Commands.every(cmd => cmd.name.startsWith('domain2:'))).toBe(true);

    // 应该有领域2的特殊命令
    expect(domain2Commands.some(cmd => cmd.name === 'domain2:special-command')).toBe(true);
  });

  test('E2E-CMDINT-03: 标准命令应能正确执行', async () => {
    // 准备：创建测试文件
    const testFilePath = path.join(tempDir, 'test.dpml');
    const testContent = '<test id="123">Test content</test>';

    await fs.writeFile(testFilePath, testContent, 'utf-8');

    // 创建领域配置和编译器
    const config: DomainConfig = {
      domain: 'validation-test',
      description: '验证测试领域',
      schema: {
        root: {
          element: 'test',
          attributes: [
            { name: 'id', type: 'string', required: true }
          ],
          children: {
            elements: []
          },
          // content与children是并列的属性
          content: { type: 'text', required: false }
        }
      },
      transformers: [createDummyTransformer()],
      commands: {
        includeStandard: true
      }
    };

    createDomainDPML(config);
    const commands = getAllRegisteredCommands();

    // 查找validate命令
    const validateCmd = commands.find(cmd => cmd.name === `${config.domain}:validate`);

    expect(validateCmd).toBeDefined();

    // 执行命令并验证结果
    if (validateCmd) {
      // 传递测试上下文和参数
      await validateCmd.action(testActionContext, testFilePath, { strict: true });
      // 由于现在标准命令不返回结果，我们只验证命令执行成功（不抛出错误）
    }
  });

  test('E2E-CMDINT-CMP-01: 验证自定义命令中可以访问编译器', async () => {
    // 准备：定义一个需要访问编译器的命令
    let compilerAccessed = false;
    let compilerCompileMethod = false;

    const config: DomainConfig = {
      domain: 'compiler-test',
      description: '编译器测试领域',
      schema: {
        root: {
          element: 'test',
          attributes: [{ name: 'id', type: 'string', required: true }],
          children: { elements: [] }
        }
      },
      transformers: [createDummyTransformer()],
      commands: {
        includeStandard: false,
        actions: [
          {
            name: 'access-compiler',
            description: '验证编译器访问',
            action: async (actionContext: DomainActionContext) => {
              // 尝试访问编译器
              try {
                const compiler = actionContext.getCompiler();

                compilerAccessed = true;

                // 验证编译器上的方法
                if (typeof compiler.compile === 'function') {
                  compilerCompileMethod = true;
                }

                // 尝试编译一个简单的DPML字符串
                await compiler.compile('<test id="compiler-check" />');
              } catch (error) {
                // 如果编译器未初始化，这里会捕获错误
                console.error('访问编译器失败:', error);
                throw error; // 重新抛出错误让测试失败
              }
            }
          }
        ]
      }
    };

    // 创建领域DPML实例
    const dpml = createDomainDPML(config);
    const commands = getAllRegisteredCommands();

    // 查找访问编译器的命令
    const compilerCmd = commands.find(cmd => cmd.name === `${config.domain}:access-compiler`);

    expect(compilerCmd).toBeDefined();

    // 执行命令
    if (compilerCmd) {
      await compilerCmd.action(testActionContext);

      // 验证编译器被正确访问
      expect(compilerAccessed).toBe(true);
      expect(compilerCompileMethod).toBe(true);
    }
  });

  test('E2E-CMDINT-04: 自定义领域命令应能正确执行', async () => {
    // 准备：创建测试文件
    const testFilePath = path.join(tempDir, 'custom.dpml');
    const testContent = '<test id="456">Custom test</test>';

    await fs.writeFile(testFilePath, testContent, 'utf-8');

    // 定义测试过程中存储结果的变量
    let processResult = '';

    // 创建带自定义命令的领域配置
    const config: DomainConfig = {
      domain: 'custom-test',
      description: '自定义命令测试领域',
      schema: {
        root: {
          element: 'test',
          attributes: [
            { name: 'id', type: 'string', required: true }
          ],
          children: {
            elements: []
          },
          // content与children是并列的属性
          content: { type: 'text', required: false }
        }
      },
      transformers: [createDummyTransformer()],
      commands: {
        includeStandard: true,
        actions: [
          {
            name: 'process',
            description: '自定义处理命令',
            args: [
              { name: 'file', description: '输入文件', required: true }
            ],
            options: [
              { flags: '--format <type>', description: '输出格式', defaultValue: 'json' }
            ],
            action: async (actionContext: DomainActionContext, file, options) => {
              // 读取文件内容，确保文件存在
              const content = await fs.readFile(file, 'utf-8');

              expect(content).toBe(testContent);

              // 存储结果，但不返回值以符合void类型要求
              processResult = `Processed file: ${file} with format: ${options.format || 'json'}`;
            }
          }
        ]
      }
    };

    // 创建领域编译器并执行自定义命令
    createDomainDPML(config);
    const commands = getAllRegisteredCommands();

    // 查找并验证自定义命令
    const processCmd = commands.find(cmd => cmd.name === `${config.domain}:process`);

    expect(processCmd).toBeDefined();

    // 执行命令并验证结果
    if (processCmd) {
      // 传递测试上下文和参数
      await processCmd.action(testActionContext, testFilePath, { format: 'json' });
      const expectedOutput = `Processed file: ${testFilePath} with format: json`;

      expect(processResult).toBe(expectedOutput);
    }
  });
});
