/**
 * DomainAction接口契约测试
 * 验证DomainAction接口的结构和类型约束
 */

import { describe, test, expectTypeOf } from 'vitest';

import type { DomainAction, DomainActionContext, DomainArgumentDefinition, DomainOptionDefinition } from '../../../types/DomainAction';

describe('DomainAction Interface Contract', () => {
  // CT-TYPE-DACT-01: DomainAction接口应维持结构稳定性
  test('CT-TYPE-DACT-01: DomainAction接口应维持结构稳定性', () => {
    // 验证接口的必要属性存在
    expectTypeOf<DomainAction>().toHaveProperty('name');
    expectTypeOf<DomainAction>().toHaveProperty('description');
    expectTypeOf<DomainAction>().toHaveProperty('args');
    expectTypeOf<DomainAction>().toHaveProperty('options');
    expectTypeOf<DomainAction>().toHaveProperty('action');

    // 验证属性的类型
    expectTypeOf<DomainAction['name']>().toMatchTypeOf<string>();
    expectTypeOf<DomainAction['description']>().toMatchTypeOf<string>();
    expectTypeOf<DomainAction['args']>().toMatchTypeOf<Array<DomainArgumentDefinition> | undefined>();
    expectTypeOf<DomainAction['options']>().toMatchTypeOf<Array<DomainOptionDefinition> | undefined>();
    expectTypeOf<DomainAction['action']>().toMatchTypeOf<(actionContext: DomainActionContext, ...args: any[]) => Promise<void> | void>();

    // 验证实例类型兼容性
    const action: DomainAction = {
      name: 'test-action',
      description: 'Test Action',
      action: (actionContext) => {
        // 使用上下文方法
        const compiler = actionContext.getCompiler();
        const domain = actionContext.getDomain();
      }
    };

    expectTypeOf(action).toMatchTypeOf<DomainAction>();

    const actionWithArgsAndOptions: DomainAction = {
      name: 'test-action',
      description: 'Test Action',
      args: [
        {
          name: 'arg1',
          description: 'Argument 1',
          required: true
        }
      ],
      options: [
        {
          flags: '-o, --option',
          description: 'Option 1',
          defaultValue: 'default'
        }
      ],
      action: async (actionContext, arg1, optionParams) => {
        // 使用上下文方法
        const compileOptions = actionContext.getOptions();
        const description = actionContext.getDescription();
      }
    };

    expectTypeOf(actionWithArgsAndOptions).toMatchTypeOf<DomainAction>();
  });

  // CT-TYPE-DACT-02: DomainAction.action应接收DomainActionContext
  test('CT-TYPE-DACT-02: DomainAction.action应接收DomainActionContext', () => {
    // 验证action函数第一个参数为DomainActionContext类型
    expectTypeOf<DomainAction['action']>().parameters.toMatchTypeOf<[DomainActionContext, ...any[]]>();

    // 验证action函数可以是同步的
    const syncExecutor: DomainAction['action'] = (actionContext) => {
      // 使用上下文方法
      const compiler = actionContext.getCompiler();
    };

    expectTypeOf(syncExecutor).toMatchTypeOf<DomainAction['action']>();

    // 验证action函数可以是异步的
    const asyncExecutor: DomainAction['action'] = async (actionContext) => {
      // 使用上下文方法
      const domain = actionContext.getDomain();
    };

    expectTypeOf(asyncExecutor).toMatchTypeOf<DomainAction['action']>();

    // 验证action函数可以接收额外参数
    const executorWithArgs: DomainAction['action'] = (actionContext, arg1, optParams) => {
      // 使用上下文方法
      const compiler = actionContext.getCompiler();
      const result = compiler.getSchema();
    };

    expectTypeOf(executorWithArgs).toMatchTypeOf<DomainAction['action']>();
  });

  // 验证DomainArgumentDefinition接口
  test('DomainArgumentDefinition接口应维持结构稳定性', () => {
    // 验证接口的必要属性存在
    expectTypeOf<DomainArgumentDefinition>().toHaveProperty('name');
    expectTypeOf<DomainArgumentDefinition>().toHaveProperty('description');
    expectTypeOf<DomainArgumentDefinition>().toHaveProperty('required');
    expectTypeOf<DomainArgumentDefinition>().toHaveProperty('defaultValue');
    expectTypeOf<DomainArgumentDefinition>().toHaveProperty('choices');

    // 验证属性的类型
    expectTypeOf<DomainArgumentDefinition['name']>().toMatchTypeOf<string>();
    expectTypeOf<DomainArgumentDefinition['description']>().toMatchTypeOf<string>();
    expectTypeOf<DomainArgumentDefinition['required']>().toMatchTypeOf<boolean | undefined>();
    expectTypeOf<DomainArgumentDefinition['defaultValue']>().toMatchTypeOf<string | undefined>();
    expectTypeOf<DomainArgumentDefinition['choices']>().toMatchTypeOf<string[] | undefined>();
  });

  // 验证DomainOptionDefinition接口
  test('DomainOptionDefinition接口应维持结构稳定性', () => {
    // 验证接口的必要属性存在
    expectTypeOf<DomainOptionDefinition>().toHaveProperty('flags');
    expectTypeOf<DomainOptionDefinition>().toHaveProperty('description');
    expectTypeOf<DomainOptionDefinition>().toHaveProperty('defaultValue');
    expectTypeOf<DomainOptionDefinition>().toHaveProperty('required');
    expectTypeOf<DomainOptionDefinition>().toHaveProperty('choices');

    // 验证属性的类型
    expectTypeOf<DomainOptionDefinition['flags']>().toMatchTypeOf<string>();
    expectTypeOf<DomainOptionDefinition['description']>().toMatchTypeOf<string>();
    expectTypeOf<DomainOptionDefinition['defaultValue']>().toMatchTypeOf<string | boolean | number | undefined>();
    expectTypeOf<DomainOptionDefinition['required']>().toMatchTypeOf<boolean | undefined>();
    expectTypeOf<DomainOptionDefinition['choices']>().toMatchTypeOf<string[] | undefined>();
  });
});
