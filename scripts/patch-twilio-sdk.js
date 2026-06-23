const fs = require('fs')
const path = require('path')

const files = [
  'node_modules/@twilio/voice-react-native-sdk/lib/module/common.js',
  'node_modules/@twilio/voice-react-native-sdk/lib/commonjs/common.js',
]

const moduleGuard = `export const NativeEventEmitter = NativeModule
  ? new ReactNative.NativeEventEmitter(NativeModule)
  : {
      addListener: () => ({ remove: () => {} }),
      removeAllListeners: () => {},
    };`

const commonjsGuard = `const NativeEventEmitter = NativeModule
  ? new ReactNative.NativeEventEmitter(NativeModule)
  : {
      addListener: () => ({ remove: () => {} }),
      removeAllListeners: () => {},
    };
exports.NativeEventEmitter = NativeEventEmitter;`

for (const relativePath of files) {
  const filePath = path.join(__dirname, '..', relativePath)
  if (!fs.existsSync(filePath)) continue

  const source = fs.readFileSync(filePath, 'utf8')
  if (source.includes('removeAllListeners')) continue

  let next = source
  if (relativePath.includes('lib/module/')) {
    next = source.replace(
      'export const NativeEventEmitter = new ReactNative.NativeEventEmitter(NativeModule);',
      moduleGuard,
    )
  } else {
    next = source.replace(
      /const NativeEventEmitter = new ReactNative\.NativeEventEmitter\(NativeModule\);\nexports\.NativeEventEmitter = NativeEventEmitter;/,
      commonjsGuard,
    )
  }

  if (next !== source) {
    fs.writeFileSync(filePath, next)
    console.log(`[patch-twilio-sdk] patched ${relativePath}`)
  }
}
