// Info.plist から NSMicrophoneUsageDescription を強制削除する config plugin。
// 本アプリはマイクを一切使用しない（録音機能なし・再生のみ）が、一部の依存が
// prebuild時にマイク権限文字列を自動付与するため、App審査(5.1.1/placeholder)で弾かれる。
// plugins 配列の最後に置き、最終的な Info.plist から当該キーを除去する。
const { withInfoPlist } = require('@expo/config-plugins');

module.exports = function withNoMicrophone(config) {
  return withInfoPlist(config, (cfg) => {
    delete cfg.modResults.NSMicrophoneUsageDescription;
    return cfg;
  });
};
