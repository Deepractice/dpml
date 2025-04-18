import { expect, describe, it } from 'vitest';

import type {
  TagDefinition,
  ValidationResult,
  AttributeDefinition,
} from '../../parser/tag-definition';

describe('TagDefinition', () => {
  describe('接口定义', () => {
    it('应该支持基本属性定义', () => {
      const tagDef: TagDefinition = {
        attributes: ['id', 'class', 'style'],
        requiredAttributes: ['id'],
        allowedChildren: ['p', 'div', 'span'],
        selfClosing: false,
      };

      expect(tagDef.attributes).toHaveLength(3);
      expect(tagDef.requiredAttributes).toHaveLength(1);
      expect(tagDef.allowedChildren).toHaveLength(3);
      expect(tagDef.selfClosing).toBe(false);
    });

    it('应该支持对象格式的属性定义', () => {
      const tagDef: TagDefinition = {
        name: 'test-tag',
        attributes: {
          id: {
            type: 'string',
            required: true,
          },
          class: {
            type: 'string',
            required: false,
          },
          count: {
            type: 'number',
            default: 0,
          },
        },
        allowedChildren: ['child-1', 'child-2'],
        contentFormat: 'markdown',
      };

      expect(tagDef.name).toBe('test-tag');
      expect(typeof tagDef.attributes).toBe('object');
      expect(Array.isArray(tagDef.attributes)).toBe(false);

      const attrs = tagDef.attributes as Record<string, AttributeDefinition>;

      expect(attrs.id.required).toBe(true);
      expect(attrs.class.required).toBe(false);
      expect(attrs.count.default).toBe(0);

      expect(tagDef.allowedChildren).toHaveLength(2);
      expect(tagDef.contentFormat).toBe('markdown');
    });

    it('应该支持布尔值简化的属性定义', () => {
      const tagDef: TagDefinition = {
        attributes: {
          id: true, // 简化的必需属性
          class: false, // 简化的可选属性
        },
      };

      const attrs = tagDef.attributes as Record<string, boolean>;

      expect(attrs.id).toBe(true);
      expect(attrs.class).toBe(false);
    });

    it('应该支持可选属性', () => {
      // 所有属性都是可选的
      const minimalTagDef: TagDefinition = {};

      expect(minimalTagDef.attributes).toBeUndefined();
      expect(minimalTagDef.requiredAttributes).toBeUndefined();
      expect(minimalTagDef.allowedChildren).toBeUndefined();
      expect(minimalTagDef.selfClosing).toBeUndefined();
    });

    it('应该支持自定义验证函数', () => {
      const element = {
        tagName: 'custom',
        attributes: { max: '10', min: '5' },
      };

      const context = {};

      const validator = (el: any, ctx: any): ValidationResult => {
        const max = parseInt(el.attributes.max, 10);
        const min = parseInt(el.attributes.min, 10);

        if (min >= max) {
          return {
            valid: false,
            errors: [
              {
                code: 'invalid-range',
                message: 'min属性值必须小于max属性值',
              },
            ],
          };
        }

        return { valid: true };
      };

      const tagDef: TagDefinition = {
        attributes: ['min', 'max'],
        requiredAttributes: ['min', 'max'],
        validate: validator,
      };

      // 验证函数应该能被调用并返回结果
      const result = tagDef.validate!(element, context);

      expect(result.valid).toBe(true);
    });
  });

  describe('ValidationResult', () => {
    it('应该支持错误和警告信息', () => {
      const validationResult: ValidationResult = {
        valid: false,
        errors: [
          { code: 'missing-attr', message: '缺少必需的属性' },
          { code: 'invalid-value', message: '属性值无效' },
        ],
        warnings: [{ code: 'deprecated-attr', message: '属性已废弃' }],
      };

      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors).toHaveLength(2);
      expect(validationResult.warnings).toHaveLength(1);

      expect(validationResult.errors![0].code).toBe('missing-attr');
      expect(validationResult.warnings![0].message).toBe('属性已废弃');
    });
  });
});
