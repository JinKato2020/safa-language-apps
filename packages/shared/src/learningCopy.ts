export function learningCopy(lang: string) { return lang === 'en' ? {
  start: 'Start here', path: 'Your learning path', resume: 'Continue where you left off', review: 'Review 5 or fewer', due: 'Ready for review', none: 'No reviews due. Try a lesson or come back tomorrow.',
  guide: 'Read the guide', practice: 'Start this step', intro: 'First: sounds and reading', introDone: 'Reviewed — start learning', completed: 'Explored', next: 'Recommended next', again: 'Try again', known: 'I could do it',
  rating: 'Check the answer, then rate yourself.', saved: 'Saved on this device', error: 'Progress could not be saved or loaded. Please retry.', retry: 'Retry', loading: 'Loading progress…',
  finish: 'This practice set is complete', finishBody: '“Try again” stays in your review list. Sentences you could do return after 1, 3 and 7 days as you practise.', back: 'Back to learning',
  reveal: 'Show answer', doneCount: 'steps explored', session: 'Short practice', unavailable: 'These sentences have changed. Open a new practice set.', saving: 'Saving…',
  progressNote: 'Supported practice and independent recall are recorded separately.', refresh: 'Refresh review list', continueLabel: 'Continue',
} : {
  start: 'はじめての方へ', path: '学習の道案内', resume: '前回の続きから', review: '5問ずつ復習する', due: 'いま復習できる例題', none: 'いま復習する例題はありません。新しい教材に進むか、明日また確認しましょう。',
  guide: '教材を読む', practice: 'このステップを始める', intro: 'はじめに：音と文字の読み方', introDone: '確認して、学習を始める', completed: '確認済み', next: '次のおすすめ', again: 'もう一度', known: 'できた',
  rating: '答えを確かめて、自分で振り返ろう。', saved: 'この端末に保存', error: '学習記録を保存・読み込みできませんでした。再試行してください。', retry: '再試行', loading: '学習記録を読み込み中…',
  finish: '今回の練習はここまで', finishBody: '「もう一度」は復習に残ります。「できた」は練習を重ねると、1日後・3日後・7日後に再び出題されます。', back: '学習の道案内に戻る',
  reveal: '答えを見る', doneCount: 'ステップ確認済み', session: '短い練習', unavailable: '例題が更新されています。学習の道案内から練習を開き直してください。', saving: '保存中…',
  progressNote: '見本つきの学習と、自力で思い出せた記録を分けています。', refresh: '復習一覧を更新', continueLabel: '続ける',
}; }
