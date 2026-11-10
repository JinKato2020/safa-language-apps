export function learningCopy(lang: string) { return lang === 'ko' ? {
  start: '처음 시작하기', path: '학습 길잡이', resume: '이어서 학습하기', review: '최대 5문제 복습', due: '지금 복습할 문장', none: '지금 복습할 문장이 없어요. 새 단원을 공부하거나 내일 다시 확인해 보세요.',
  guide: '설명 읽기', practice: '이 단계 시작하기', intro: '먼저: 소리와 읽는 법', introDone: '확인하고 학습 시작', completed: '학습한 단계', next: '다음 추천', again: '다시 연습', known: '할 수 있어요',
  rating: '답을 확인하고 스스로 점검해 보세요.', saved: '이 기기에 저장됨', error: '학습 기록을 저장하거나 불러오지 못했어요. 다시 시도해 주세요.', retry: '다시 시도', loading: '학습 기록을 불러오는 중…',
  finish: '이번 연습을 마쳤어요', finishBody: '「다시 연습」을 선택한 문장은 복습 목록에 남아요. 「할 수 있어요」를 선택한 문장은 연습을 거듭하면 1일, 3일, 7일 뒤에 다시 나와요.', back: '학습으로 돌아가기',
  reveal: '답 보기', doneCount: '개 단계 학습', session: '짧은 연습', unavailable: '예문이 변경되었어요. 새 연습을 열어 주세요.', saving: '저장 중…',
  progressNote: '도움을 받으며 연습한 기록과 스스로 떠올린 기록을 따로 저장해요.', refresh: '복습 목록 새로고침', continueLabel: '계속',
} : lang === 'en' ? {
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
  finish: '今回の練習はここまで', finishBody: '「もう一度」は復習に残ります。「できた」は練習を重ねると、1日後・3日後・7日後に再び出題されます。', back: 'もとの画面に戻る',
  reveal: '答えを見る', doneCount: 'ステップ確認済み', session: '短い練習', unavailable: '例題が更新されています。教材から練習を開き直してください。', saving: '保存中…',
  progressNote: '見本つきの学習と、自力で思い出せた記録を分けています。', refresh: '復習一覧を更新', continueLabel: '続ける',
}; }
