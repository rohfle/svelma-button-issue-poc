import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
// import copy from 'rollup-plugin-copy'
import livereload from 'rollup-plugin-livereload';
import {
  terser
} from 'rollup-plugin-terser';
import autoPreprocess from 'svelte-preprocess';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/main.js',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: 'public/static/js/bundle.js'
  },
  plugins: [
    svelte({
      preprocess: autoPreprocess({
        postcss: true
      }),
      // enable run-time checks when not in production
      dev: !production,
      css: css => {
        css.write('public/static/css/components.css');
      }
    }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration —
    // consult the documentation for details:
    // https://github.com/rollup/rollup-plugin-commonjs
    resolve({
      browser: true
    }),
    commonjs(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload('public'),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
    // Copy compiled assets to backend for serving
  ],
  watch: {
    clearScreen: false
  }
};
