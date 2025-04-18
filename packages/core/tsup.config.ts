import * as path from 'path';
import { defineConfig } from 'tsup';
import { baseConfig } from '../../tsup.base.config';

export default defineConfig({
  ...baseConfig,
  entry: ['src/index.ts'],
  noExternal: ['fast-xml-parser'],
  dts: true,
  target: 'es2020',
  outDir: 'dist',
  clean: true,
  esbuildOptions(options) {
    options.alias = {
      '@core': path.resolve(__dirname, './src')
    };
    options.preserveSymlinks = true;
    options.resolveExtensions = ['.tsx', '.ts', '.jsx', '.js', '.css', '.json'];
  },
}); 