const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const SAFE_LINEAR_GRADIENT = path.resolve(__dirname, 'src/theme/safeLinearGradient.js');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'react-native-linear-gradient') {
        return {
          filePath: SAFE_LINEAR_GRADIENT,
          type: 'sourceFile',
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
  server: {
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Keep-Alive', 'timeout=600');
        return middleware(req, res, next);
      };
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
