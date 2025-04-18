import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  readFile,
  writeFile,
  readJsonFile,
  writeJsonFile,
  copyFile,
  removeFile,
  fileExists,
  processTemplate,
  createTempDirectory,
  removeTempDirectory,
  atomicWriteFile,
} from '../../utils/fs';

// 模拟模块
vi.mock('fs', async importOriginal => {
  const actual = await importOriginal();

  return {
    ...actual,
    existsSync: vi.fn(),
    constants: {
      ...actual.constants,
    },
    promises: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      copyFile: vi.fn(),
      unlink: vi.fn(),
      mkdir: vi.fn(),
      rmdir: vi.fn(),
      access: vi.fn(),
      stat: vi.fn(),
    },
  };
});

vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  copyFile: vi.fn(),
  unlink: vi.fn(),
  mkdir: vi.fn(),
  rmdir: vi.fn(),
  access: vi.fn(),
  stat: vi.fn(),
}));

vi.mock('path', () => ({
  join: vi.fn((...args) => args.join('/')),
  dirname: vi.fn(p => p.split('/').slice(0, -1).join('/') || '.'),
  basename: vi.fn(p => p.split('/').pop() || ''),
  resolve: vi.fn((...args) => args.join('/')),
}));

vi.mock('os', () => ({
  tmpdir: vi.fn(),
}));

describe('文件系统工具测试', () => {
  // 在每个测试前重置模拟
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // 在每个测试后清理模拟
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('readFile', () => {
    it('应成功读取文件', async () => {
      // 模拟fs.promises.readFile返回值
      vi.mocked(fsPromises.readFile).mockResolvedValue('file content');

      // 测试函数
      const result = await readFile('/path/to/file.txt');

      // 验证结果
      expect(result).toBe('file content');
      expect(fsPromises.readFile).toHaveBeenCalledWith(
        '/path/to/file.txt',
        'utf-8'
      );
    });

    it('应处理读取文件错误', async () => {
      // 模拟fs.promises.readFile抛出错误
      vi.mocked(fsPromises.readFile).mockRejectedValue(
        new Error('读取文件失败')
      );

      // 测试函数
      await expect(readFile('/path/to/file.txt')).rejects.toThrow(
        '读取文件失败'
      );
      expect(fsPromises.readFile).toHaveBeenCalledWith(
        '/path/to/file.txt',
        'utf-8'
      );
    });
  });

  describe('writeFile', () => {
    it('应成功写入文件', async () => {
      // 模拟fs.promises.writeFile返回值
      vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);
      vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined);
      vi.mocked(path.dirname).mockReturnValue('/path/to');

      // 测试函数
      await writeFile('/path/to/file.txt', 'file content');

      // 验证结果
      expect(fsPromises.mkdir).toHaveBeenCalledWith('/path/to', {
        recursive: true,
      });
      expect(fsPromises.writeFile).toHaveBeenCalledWith(
        '/path/to/file.txt',
        'file content',
        'utf-8'
      );
    });

    it('应处理写入文件错误', async () => {
      // 模拟fs.promises.writeFile抛出错误
      vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined);
      vi.mocked(fsPromises.writeFile).mockRejectedValue(
        new Error('写入文件失败')
      );
      vi.mocked(path.dirname).mockReturnValue('/path/to');

      // 测试函数
      await expect(
        writeFile('/path/to/file.txt', 'file content')
      ).rejects.toThrow('写入文件失败');
      expect(fsPromises.mkdir).toHaveBeenCalledWith('/path/to', {
        recursive: true,
      });
      expect(fsPromises.writeFile).toHaveBeenCalledWith(
        '/path/to/file.txt',
        'file content',
        'utf-8'
      );
    });
  });

  describe('readJsonFile', () => {
    it('应成功读取并解析JSON文件', async () => {
      // 模拟fs.promises.readFile返回值
      vi.mocked(fsPromises.readFile).mockResolvedValue('{"key":"value"}');

      // 测试函数
      const result = await readJsonFile('/path/to/file.json');

      // 验证结果
      expect(result).toEqual({ key: 'value' });
      expect(fsPromises.readFile).toHaveBeenCalledWith(
        '/path/to/file.json',
        'utf-8'
      );
    });

    it('应处理无效的JSON内容', async () => {
      // 模拟fs.promises.readFile返回值
      vi.mocked(fsPromises.readFile).mockResolvedValue('invalid json');

      // 测试函数
      await expect(readJsonFile('/path/to/file.json')).rejects.toThrow();
      expect(fsPromises.readFile).toHaveBeenCalledWith(
        '/path/to/file.json',
        'utf-8'
      );
    });
  });

  describe('writeJsonFile', () => {
    it('应成功序列化并写入JSON文件', async () => {
      // 模拟fs.promises.writeFile返回值
      vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);
      vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined);
      vi.mocked(path.dirname).mockReturnValue('/path/to');

      // 测试函数
      await writeJsonFile('/path/to/file.json', { key: 'value' });

      // 验证结果
      expect(fsPromises.mkdir).toHaveBeenCalledWith('/path/to', {
        recursive: true,
      });
      expect(fsPromises.writeFile).toHaveBeenCalledWith(
        '/path/to/file.json',
        '{\n  "key": "value"\n}',
        'utf-8'
      );
    });
  });

  describe('copyFile', () => {
    it('应成功复制文件', async () => {
      // 模拟fs.promises.copyFile返回值
      vi.mocked(fsPromises.copyFile).mockResolvedValue(undefined);
      vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined);
      vi.mocked(path.dirname).mockReturnValue('/dest');

      // 测试函数
      await copyFile('/source/file.txt', '/dest/file.txt');

      // 验证结果
      expect(fsPromises.mkdir).toHaveBeenCalledWith('/dest', {
        recursive: true,
      });
      expect(fsPromises.copyFile).toHaveBeenCalledWith(
        '/source/file.txt',
        '/dest/file.txt'
      );
    });
  });

  describe('removeFile', () => {
    it('应成功删除文件', async () => {
      // 模拟fs.promises.unlink返回值
      vi.mocked(fsPromises.unlink).mockResolvedValue(undefined);

      // 测试函数
      await removeFile('/path/to/file.txt');

      // 验证结果
      expect(fsPromises.unlink).toHaveBeenCalledWith('/path/to/file.txt');
    });

    it('应忽略不存在的文件', async () => {
      // 模拟fs.promises.unlink抛出错误
      const error = new Error('文件不存在');

      (error as any).code = 'ENOENT';
      vi.mocked(fsPromises.unlink).mockRejectedValue(error);

      // 测试函数
      await removeFile('/path/to/file.txt');

      // 验证结果
      expect(fsPromises.unlink).toHaveBeenCalledWith('/path/to/file.txt');
    });
  });

  describe('fileExists', () => {
    it('当文件存在时应返回true', async () => {
      // 模拟fs.promises.access不抛出错误
      vi.mocked(fsPromises.access).mockResolvedValue(undefined);

      // 测试函数
      const result = await fileExists('/path/to/file.txt');

      // 验证结果
      expect(result).toBe(true);
      expect(fsPromises.access).toHaveBeenCalledWith(
        '/path/to/file.txt',
        fs.constants.F_OK
      );
    });

    it('当文件不存在时应返回false', async () => {
      // 模拟fs.promises.access抛出错误
      vi.mocked(fsPromises.access).mockRejectedValue(new Error('文件不存在'));

      // 测试函数
      const result = await fileExists('/path/to/file.txt');

      // 验证结果
      expect(result).toBe(false);
      expect(fsPromises.access).toHaveBeenCalledWith(
        '/path/to/file.txt',
        fs.constants.F_OK
      );
    });
  });

  describe('processTemplate', () => {
    it('应替换模板中的变量', () => {
      const template = 'Hello, {{name}}!';
      const vars = { name: 'World' };

      const result = processTemplate(template, vars);

      expect(result).toBe('Hello, World!');
    });

    it('应替换多个变量', () => {
      const template = '{{greeting}}, {{name}}!';
      const vars = { greeting: 'Hello', name: 'World' };

      const result = processTemplate(template, vars);

      expect(result).toBe('Hello, World!');
    });
  });

  describe('createTempDirectory', () => {
    it('应创建临时目录', async () => {
      // 模拟os.tmpdir返回值
      vi.mocked(require('os').tmpdir).mockImplementation(() => '/tmp');

      // 模拟fs.promises.mkdir返回值
      vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined);

      // 模拟path.join返回值
      vi.mocked(path.join).mockReturnValue('/tmp/dpml-12345');

      // 测试函数
      const result = await createTempDirectory('dpml-');

      // 验证结果
      expect(result).toBe('/tmp/dpml-12345');
      expect(fsPromises.mkdir).toHaveBeenCalledWith('/tmp/dpml-12345', {
        recursive: true,
      });
    });
  });

  describe('removeTempDirectory', () => {
    it('应移除临时目录', async () => {
      // 模拟fs.promises.rmdir返回值
      vi.mocked(fsPromises.rmdir).mockResolvedValue(undefined);

      // 测试函数
      await removeTempDirectory('/tmp/dpml-12345');

      // 验证结果
      expect(fsPromises.rmdir).toHaveBeenCalledWith('/tmp/dpml-12345', {
        recursive: true,
      });
    });
  });

  describe('atomicWriteFile', () => {
    it('应原子方式写入文件', async () => {
      // 模拟函数
      vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);
      vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined);
      vi.mocked(fsPromises.copyFile).mockResolvedValue(undefined);
      vi.mocked(fsPromises.unlink).mockResolvedValue(undefined);
      vi.mocked(path.dirname).mockReturnValue('/path/to');

      // 测试函数
      await atomicWriteFile('/path/to/file.txt', 'file content');

      // 验证结果
      expect(fsPromises.mkdir).toHaveBeenCalledWith('/path/to', {
        recursive: true,
      });
      expect(fsPromises.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/^\/path\/to\/file\.txt\./),
        'file content',
        'utf-8'
      );
      expect(fsPromises.copyFile).toHaveBeenCalled();
      expect(fsPromises.unlink).toHaveBeenCalled();
    });
  });
});
