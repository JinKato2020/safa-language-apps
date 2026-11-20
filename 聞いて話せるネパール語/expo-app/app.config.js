module.exports = ({ config }) => {
  const ios = process.env.NEPALI_IOS_PUSH === '1';
  const googleServicesFile = process.env.NEPALI_GOOGLE_SERVICES_FILE;
  const android = Boolean(googleServicesFile);
  return {
    ...config,
    android: {
      ...config.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
    },
    plugins: [
      ...(config.plugins ?? []),
      ...((ios || android) ? [['expo-notifications', { mode: ios ? 'production' : 'development', defaultChannel: 'announcements' }]] : []),
    ],
    extra: { ...config.extra, nepaliNoticePushPlatforms: { ios, android } },
  };
};
