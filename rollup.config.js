import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const production = process.env.NODE_ENV === 'production';

export default {
  input: 'dist/esm/index.js',
  output: [
    {
      file: 'dist/plugin.js',
      format: 'iife',
      name: 'CapacitorNativeUpdate',
      globals: {
        '@capacitor/core': 'capacitorExports',
        '@capacitor/filesystem': 'capacitorFilesystem',
        '@capacitor/preferences': 'capacitorPreferences',
      },
      sourcemap: true,
      inlineDynamicImports: true,
      banner: '/*! Capacitor Native Update Plugin v1.0.0 | MIT License */',
    },
    {
      file: 'dist/plugin.cjs.js',
      format: 'cjs',
      sourcemap: true,
      inlineDynamicImports: true,
      exports: 'named',
    },
    {
      file: 'dist/plugin.esm.js',
      format: 'es',
      sourcemap: true,
      inlineDynamicImports: true,
    },
  ],
  external: [
    '@capacitor/core',
    '@capacitor/filesystem',
    '@capacitor/preferences',
  ],
  plugins: [
    resolve({
      // Resolve modules from node_modules
      preferBuiltins: false,
      browser: true,
    }),
    // Minify production builds
    production && terser({
      ecma: 2020,
      module: true,
      compress: {
        pure_getters: true,
        passes: 2,
      },
      format: {
        comments: false,
        // Preserve license comment
        comments: /^!/,
      },
    }),
  ].filter(Boolean),
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
  },
};
