const { withEntitlementsPlist, withPlugins, withRunOnce } = require('expo/config-plugins');

module.exports = function withNoticePush(config, { ios, android }) {
  if (!ios) {
    // Config mods run in reverse registration order. Remove the iOS entitlement
    // after the notification plugin when only Android is enabled.
    config = withEntitlementsPlist(config, mod => {
      delete mod.modResults['aps-environment'];
      return mod;
    });
  }
  if (ios || android) {
    return withPlugins(config, [['expo-notifications', {
      mode: ios ? 'production' : 'development',
      defaultChannel: 'announcements',
    }]]);
  }
  // Expo would otherwise invoke the installed plugin automatically during prebuild.
  return withRunOnce(config, { name: 'expo-notifications', plugin: config => config });
};
