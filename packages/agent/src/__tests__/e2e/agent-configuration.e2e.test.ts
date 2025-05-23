/**
 * Agent配置端到端测试
 */
import { of, firstValueFrom } from 'rxjs';
import { describe, test, expect, vi, beforeEach, beforeAll } from 'vitest';

import { createAgent } from '../../api';
import * as llmFactory from '../../core/llm/llmFactory';
import { OpenAIClient } from '../../core/llm/OpenAIClient';
import type { AgentConfig } from '../../types';
import { AgentError, AgentErrorType } from '../../types';
import { extractTextContent } from '../../utils/contentHelpers';

import { isLLMConfigValid, getLLMConfig } from './env-helper';

// 导入OpenAIClient和llmFactory以便模拟

// 检查是否使用真实API
const useOpenAIRealAPI = isLLMConfigValid('openai');
const useAnthropicRealAPI = isLLMConfigValid('anthropic');

// 只有在需要模拟时才进行模拟
if (!useOpenAIRealAPI) {
  console.info('ℹ️ OpenAI测试使用模拟模式');

  // 模拟OpenAI客户端
  vi.spyOn(OpenAIClient.prototype, 'sendRequest').mockImplementation((request) => {
    // 查找系统提示
    const systemMessage = request.messages.find(msg => msg.role === 'system');
    const systemPrompt = systemMessage?.content && !Array.isArray(systemMessage.content)
      ? systemMessage.content.type === 'text' ? systemMessage.content.value : ''
      : '';

    // 返回Observable，包含配置的模型名称
    return of({
      content: {
        type: 'text' as const,
        value: `使用API类型: openai, 模型: ${request.model || 'gpt-4'}, 提示词: ${systemPrompt}`
      }
    });
  });
}

// 模拟llmFactory.createClient
vi.spyOn(llmFactory, 'createClient').mockImplementation((config) => {
  // 处理无效API类型
  if (config.apiType === 'unsupported') {
    throw new AgentError(
      `不支持的API类型: ${config.apiType}`,
      AgentErrorType.CONFIG,
      'UNSUPPORTED_LLM_TYPE'
    );
  }

  // 如果是OpenAI且有真实API，使用真实客户端
  if (config.apiType === 'openai' && useOpenAIRealAPI) {
    console.info('使用真实OpenAI客户端');

    // 直接创建OpenAIClient实例
    return new OpenAIClient(config);
  }

  // 其他情况使用模拟
  console.info(`使用模拟${config.apiType}客户端`);

  return {
    sendRequest: vi.fn().mockImplementation((request) => {
      // 查找系统提示
      const systemMessage = request.messages.find(msg => msg.role === 'system');
      const systemPrompt = systemMessage?.content && !Array.isArray(systemMessage.content)
        ? systemMessage.content.type === 'text' ? systemMessage.content.value : ''
        : '';

      // 返回Observable而不是Promise
      return of({
        content: {
          type: 'text',
          value: `使用API类型: ${config.apiType}, 模型: ${config.model}, 提示词: ${systemPrompt}`
        }
      });
    })
  };
});

// 显示测试模式
beforeAll(() => {
  console.info('===== 配置测试模式 =====');
  if (useOpenAIRealAPI) {
    console.info('ℹ️ OpenAI测试使用真实API');
    console.info(`OpenAI模型: ${getLLMConfig('openai').model}`);
    console.info(`OpenAI API URL: ${getLLMConfig('openai').apiUrl}`);
  } else {
    console.info('ℹ️ OpenAI测试使用模拟模式');
  }

  if (useAnthropicRealAPI) {
    console.info('ℹ️ Anthropic测试使用真实API');
    console.info(`Anthropic模型: ${getLLMConfig('anthropic').model}`);
  } else {
    console.info('ℹ️ Anthropic测试使用模拟模式');
  }

  console.info('=========================');
});

describe('E2E-Config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('E2E-Config-01: Agent应使用配置的系统提示词', async () => {
    // 准备
    const customPrompt = '你是一个专业的编程助手';
    const config: AgentConfig = {
      llm: {
        apiType: 'openai',
        model: useOpenAIRealAPI ? getLLMConfig('openai').model : 'gpt-4',
        apiKey: useOpenAIRealAPI ? getLLMConfig('openai').apiKey : 'test-key',
        apiUrl: useOpenAIRealAPI ? getLLMConfig('openai').apiUrl : undefined
      },
      prompt: customPrompt
    };

    // 执行
    const agent = createAgent(config);
    const sessionId = agent.createSession();
    const response = await firstValueFrom(agent.chat(sessionId, '测试提示词'));

    // 根据运行模式验证
    if (useOpenAIRealAPI) {
      // 真实API只能验证响应存在
      expect(response).toBeTruthy();
      console.info('使用真实API的响应:', extractTextContent(response.content));
    } else {
      // 模拟环境中验证提示词包含
      expect(extractTextContent(response.content)).toContain(customPrompt);
    }
  });

  test.skip('E2E-Config-02: Agent应连接配置的LLM服务', async () => {
    // 注意：此测试已被跳过，因为它需要访问真实的Anthropic API
    // 在模拟模式下会尝试创建AnthropicClient实例，这会导致403错误
    // 在有真实API密钥的环境中，可以移除skip标记运行此测试

    // 准备
    const config: AgentConfig = {
      llm: {
        apiType: 'anthropic', // 不同的API类型
        model: 'claude-3',
        apiKey: 'test-key'
      },
      prompt: '测试提示词'
    };

    // 执行
    const agent = createAgent(config);
    const sessionId = agent.createSession();
    const response = await firstValueFrom(agent.chat(sessionId, '测试API类型'));

    // 验证
    expect(extractTextContent(response.content)).toContain('API类型: anthropic');
    expect(extractTextContent(response.content)).toContain('模型: claude-3');
  });

  test('E2E-Config-03: Agent应使用配置的模型名称', async () => {
    // 准备
    const modelName = useOpenAIRealAPI ? getLLMConfig('openai').model : 'gpt-4-turbo';
    const config: AgentConfig = {
      llm: {
        apiType: 'openai',
        model: modelName, // 特定模型名称
        apiKey: useOpenAIRealAPI ? getLLMConfig('openai').apiKey : 'test-key',
        apiUrl: useOpenAIRealAPI ? getLLMConfig('openai').apiUrl : undefined
      },
      prompt: '测试提示词'
    };

    // 执行
    const agent = createAgent(config);
    const sessionId = agent.createSession();
    const response = await firstValueFrom(agent.chat(sessionId, '测试模型'));

    // 根据运行模式验证
    if (useOpenAIRealAPI) {
      // 真实API只能验证响应存在
      expect(response).toBeTruthy();
      console.info('使用特定模型的响应:', extractTextContent(response.content));
    } else {
      // 模拟环境中验证模型名称包含
      expect(extractTextContent(response.content)).toContain(`模型: ${modelName}`);
    }
  });

  test('E2E-Config-04: Agent应验证配置并拒绝无效配置', async () => {
    // 准备
    const invalidConfig = {
      llm: {
        apiType: 'unsupported', // 不支持的API类型
        model: 'unknown-model'
      },
      prompt: '测试提示词'
    } as AgentConfig;

    // 执行和验证
    expect(() => createAgent(invalidConfig)).toThrow(AgentError);
    expect(() => createAgent(invalidConfig)).toThrow(/不支持的API类型/);
  });

  test('E2E-Config-05: 空提示词应被正确处理', async () => {
    // 准备
    const config: AgentConfig = {
      llm: {
        apiType: 'openai',
        model: useOpenAIRealAPI ? getLLMConfig('openai').model : 'gpt-4',
        apiKey: useOpenAIRealAPI ? getLLMConfig('openai').apiKey : 'test-key',
        apiUrl: useOpenAIRealAPI ? getLLMConfig('openai').apiUrl : undefined
      },
      prompt: '' // 空提示词
    };

    // 执行
    const agent = createAgent(config);
    const sessionId = agent.createSession();
    const response = await firstValueFrom(agent.chat(sessionId, '测试空提示词'));

    // 根据运行模式验证
    if (useOpenAIRealAPI) {
      // 真实API只能验证响应存在
      expect(response).toBeTruthy();
      console.info('空提示词的响应:', extractTextContent(response.content));
    } else {
      // 模拟环境中验证空提示词处理
      expect(extractTextContent(response.content)).toContain('提示词:');
    }
  });
});
