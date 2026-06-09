import type { Configuration, ModuleOptions } from 'webpack';

import { plugins } from './webpack.plugins';

// The renderer runs in the browser context (no Node integration), so it must
// NOT use the native-module loaders from webpack.rules.ts. Those pull in the
// asset-relocator runtime (`__webpack_require__.ab = __dirname + ...`), and
// `__dirname` is undefined in the renderer — which throws at load and leaves a
// blank window. The renderer only needs TypeScript + CSS.
const rendererRules: Required<ModuleOptions>['rules'] = [
  {
    test: /\.tsx?$/,
    exclude: /(node_modules|\.webpack)/,
    use: {
      loader: 'ts-loader',
      options: {
        transpileOnly: true,
      },
    },
  },
  {
    test: /\.css$/,
    use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
  },
];

export const rendererConfig: Configuration = {
  module: {
    rules: rendererRules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
};
