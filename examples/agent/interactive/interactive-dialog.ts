/**
 * 交互式对话代理示例
 * 
 * 本示例展示了如何创建一个支持多轮对话的交互式代理，包含状态管理和错误处理
 */

// @ts-ignore - 忽略类型定义错误
import { createAgent, AgentState } from '../../../packages/agent';
// @ts-ignore - 忽略类型定义错误
import { EventType } from '../../../packages/agent/src/events/EventTypes';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

// 创建命令行交互界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 提示用户输入
function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// 确保会话目录存在
const sessionsDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

async function main() {
  try {
    console.log('=== 交互式对话代理示例 ===');
    console.log('创建交互式对话代理...');
    
    // 初始化代理
    const agent = await createAgent({
      id: 'interactive-assistant',
      version: '1.0.0',
      stateManagerType: 'filesystem',
      stateManagerConfig: {
        basePath: sessionsDir
      },
      memoryType: 'conversational', // 使用会话记忆类型
      executionConfig: {
        defaultModel: 'gpt-3.5-turbo',
        apiType: 'openai',
        systemPrompt: `你是一个友好的助手，能够进行多轮对话并记住之前的交互内容。
你应该用中文回答问题，保持对话的连贯性。
如果你遇到技术问题，请尝试解释问题并提供解决方案。`,
        maxResponseTokens: 800,
        temperature: 0.7,
        defaultTimeout: 30000
      }
    });
    
    console.log(`创建成功: ${agent.getId()} v${agent.getVersion()}`);
    
    // 创建一个会话ID
    const sessionId = `interactive-session-${Date.now()}`;
    console.log(`会话ID: ${sessionId}`);
    
    // 监听状态变化事件
    agent.on(EventType.STATE_CHANGED, (data: any) => {
      console.log(`\n状态变化: ${data.from} -> ${data.to}`);
    });
    
    // 监听错误事件
    agent.on(EventType.ERROR_OCCURRED, (data: any) => {
      console.error(`\n错误发生: ${data.message}`);
    });
    
    console.log('\n开始交互式对话 (输入"退出"结束对话, "重置"重置会话, "状态"查看当前状态):');
    
    let userInput = '';
    
    do {
      // 获取用户输入
      userInput = await prompt('\n你: ');
      
      // 检查特殊命令
      if (userInput.toLowerCase() === '退出') {
        break;
      } else if (userInput.toLowerCase() === '重置') {
        try {
          await agent.reset(sessionId);
          console.log('会话已重置');
          continue;
        } catch (error) {
          console.error('重置会话失败:', error);
          continue;
        }
      } else if (userInput.toLowerCase() === '状态') {
        try {
          const state = await agent.getSessionState(sessionId);
          console.log('\n当前会话状态:');
          console.log(JSON.stringify(state, null, 2));
          continue;
        } catch (error) {
          console.error('获取状态失败:', error);
          continue;
        }
      }
      
      try {
        // 检查当前状态，如果是错误状态，先重置
        try {
          const currentState = await agent.getSessionState(sessionId);
          if (currentState?.state === AgentState.ERROR) {
            console.log('\n检测到错误状态，正在重置会话...');
            await agent.reset(sessionId);
            console.log('会话已重置');
          }
        } catch (e) {
          // 如果会话不存在，不需要特殊处理
        }
        
        console.log('\n代理思考中...');
        
        // 执行代理，获取回答
        const response = await agent.execute({
          text: userInput,
          sessionId
        });
        
        // 显示代理回答
        console.log(`\n代理: ${response.text}`);
        
      } catch (error) {
        console.error('执行错误:', error);
        
        // 尝试重置会话
        try {
          console.log('\n尝试重置会话状态...');
          await agent.reset(sessionId);
          console.log('会话已重置，请重试');
        } catch (resetError) {
          console.error(`重置会话失败: ${resetError}`);
        }
      }
    } while (userInput.toLowerCase() !== '退出');
    
    // 关闭命令行界面
    rl.close();
    console.log('\n对话已结束');
    
  } catch (error) {
    console.error('初始化错误:', error);
    rl.close();
  }
}

// 运行示例
main().catch(console.error); 