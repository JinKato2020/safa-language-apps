# ネパール語アプリの運営お知らせ

ホームの「お知らせ」から、アプリの表示言語に合った本文を読めます。新しい本文を開くと、その端末の未読マークが消えます。対応ビルドでプッシュ通知をオンにした端末には、同じお知らせを通知欄にも送れます。タップすると、その本文が開きます。

## 運営から配信する

GitHub Actions の **Nepali announcements** を開き、`action: preview` で内容を確認します。配信時は同じ入力を `action: publish` で実行します。`push: false` はアプリ内への掲載、`push: true` はアプリ内掲載とプッシュ通知です。ID は再利用できません。`action: status` で Expo が受け付けた件数と、後から判明した配信エラーを確認できます。端末への着信はテスト端末で確認します。

```json
{
  "id": "course-update-2026-11",
  "push": false,
  "translations": {
    "ja": { "title": "教材を追加しました", "body": "ホームから新しい教材をご覧ください。", "pushBody": "新しい教材を追加しました。" },
    "en": { "title": "New lessons", "body": "Open the home tab to explore the new lessons.", "pushBody": "New lessons are available." },
    "ko": { "title": "새 교재가 추가됐어요", "body": "홈에서 새 교재를 확인해 보세요.", "pushBody": "새 교재가 추가됐어요." },
    "ar": { "title": "دروس جديدة", "body": "افتح الصفحة الرئيسية للاطلاع على الدروس الجديدة.", "pushBody": "أضفنا دروسًا جديدة." }
  }
}
```

## 初回のプッシュ通知設定

- Expoプロジェクトに Apple Push Notification service（APNs）キーと Android の FCM v1 認証情報を登録します。Expoのプッシュ通知の追加セキュリティを有効にし、送信専用のExpoアクセスキーを Worker の `EXPO_ACCESS_TOKEN` シークレットに保存します。詳しくは [Expoの初期設定](https://docs.expo.dev/push-notifications/push-notifications-setup/) と [送信ガイド](https://docs.expo.dev/push-notifications/sending-notifications/) を参照してください。
- iOSでは `com.safa.nepali.jp` の Push Notifications を有効にした配布用プロビジョニングプロファイルを用意し、既存の `IOS_PROVISIONING_PROFILE_BASE64` に設定します。ビルドはプロファイルに本番用APNs権限があるときだけ受信を有効にします。
- Androidでは `com.safa.nepali.jp` を登録したFirebaseの `google-services.json` を Base64 にし、GitHub Actionsの `NEPALI_GOOGLE_SERVICES_JSON_BASE64` に登録します。
- 送信キーを配置したら、GitHub Actionsのリポジトリ変数 `NEPALI_PUSH_BROADCAST_READY` を `true` にして、対応プラットフォームのビルドで受信を有効にします。
- 受信に対応したネイティブビルドをテスト端末に入れ、Expoのテスト送信ツールで一台ずつ、起動中・バックグラウンド・アプリ終了時の受信とタップを確認します。実際の一斉配信はこの確認後に運用開始します。

Worker は本文と配信状態、通知をオンにした端末のトークンと言語のみを保存します。運営用APIは `ADMIN_TOKEN` が必要です。端末登録を取り消したり、無効なトークンが通知サービスから返ったりした場合は、その登録を削除します。
