# 【引き継ぎ】ネパール語 文法教材「英語版」作成のお願い（ChatGPT向け）

このファイルを ChatGPT に渡し、**日本語マスター `文法教材_v2_ja_ドラフト.md` も一緒に添付**してください。

---

## 1. 目的・背景
- iOSアプリ「聞いて話せるネパール語」の**文法モードに「教材（文法解説）」**を載せます。
- すでに**日本語版（マスター）**が完成しています：`文法教材_v2_ja_ドラフト.md`
  - **全34テーマ ＋ 付録A（動詞 गर्नु の全人称活用）＋ 付録B（繋辞 हो/छ/थियो の全人称活用）**
  - 市販書籍 **CDエクスプレス ネパール語** の構成・用語・例を参考に作成。
- アプリは**英語UIにも対応**しているため、**同じ内容の英語版**が必要です（英語話者がネパール語を学ぶための解説）。

## 2. お願いしたいこと（ゴール）
**日本語マスターと同じ構成・同じネパール語で、解説だけを英語にした「英語版」**を作ってください。
- 対象読者：**英語話者のネパール語初学者**。
- 成果物：**Markdown 1ファイル**（ファイル名例 `grammar_guide_v2_en.md`）。

## 3. 必須ルール
1. **構成は完全に同じ**：テーマ1〜34 ＋ 付録A ＋ 付録B。順番・区切りを変えない。
2. **ネパール語（デーヴァナーガリー）はマスターのまま一字一句維持**。例文・活用形・単語を勝手に変えない。
3. **メタ言語（説明・見出し・表の「意味」列）だけを英語**にする。日本語の意味は**自然な英語**に（例：「これはミカンです」→ "This is an orange."）。
4. **ローマ字読みはそのまま維持**（ā/ī/ū＝長母音、ã/ũ/ẽ/õ＝鼻母音）。
5. **人称は省略しない**：तँ / तिमी / तपाईं / उ / उनी / उहाँ / हामी / उनीहरू など、マスターにある人称をすべて残す。
6. **CDエクスプレス準拠の要点を保持**（下記）：
   - 繋辞は3分割：**हो（同定）／छ（存在・状態）／हुन्छ（習慣・変化）**。否定は **होइन／छैन**。
   - **過去はहोもछも थियो に統合**（否定 थिएन）。尊称は現在 हुनुहुन्छ・過去 हुनुहुन्थ्यो で共通。
   - 場所の副詞 **यहाँ/त्यहाँ/कहाँ は -मा を付けない**。
   - 所有は「持つ」動詞がなく **-सँग ＋ छ**。
   - 過去の他動詞の主語に **能格 -ले**（自動詞は付けない。習慣過去・進行・使役などでは付けない）。
   - 推量は **जस्तो लाग्छ（〜と思う）／होला（〜だろう）／हुनु पर्छ（〜に違いない）／सायद（おそらく）**。
   - 進行は **-दै＋छ**（खाँदैछ）。「〜し続ける」の -इरहनु とは別。
7. **初学者に平易な英語**で（専門用語は噛み砕く）。日本語版と同じ「噛み砕き」トーン。

## 4. フォーマット仕様（厳守・後でJSON化します）
マスターと同じマーカーを使ってください。数字・記号を変えないこと。
- テーマ見出し：`## Theme N「English Title」`（N＝1〜34。かぎ括弧「」も残す）
- 付録見出し：`## Appendix A「…」` / `## Appendix B「…」`
- ゴール行：`🎯 **Goal**: …`
- 小見出し：`### …`
- 表：Markdownの表（`| … |`）。強調は `**…**`。
- 注意：`⚠️ …`
- 例（1テーマの骨格）：
```
## Theme 1「हो: A is B (identity)」

🎯 **Goal**: Say "A is B" about a person or thing (and "is not").

### 1. ...
| Nepali | Romanized | Meaning |
|---|---|---|
| यो सुन्तला **हो**। | yo suntalā ho | This is an orange |

⚠️ ...
```

## 5. テーマ英語タイトル一覧（この順・この訳で）
1. हो: A is B (identity / equation)
2. छ: there is / have (existence, location, possession)
3. छ: is ~ (adjective / state)
4. हुन्छ: becomes / generally is (habitual, change)
5. Postpositions (the "particles")
6. Question words
7. Pronouns & politeness (three levels)
8. Action verbs: present (do ~)
9. Present negative (don't ~)
10. Present progressive (~ing)
11. The ergative ले & the past (did ~)
12. Past negative (didn't ~)
13. Future (will ~)
14. Habitual past (used to ~)
15. Present perfect / experience (have done ~)
16. Past perfect (had done ~)
17. Requests & commands (three politeness levels)
18. Hortative / volitional (let's ~ / shall I ~)
19. Prohibition (must not ~ / don't ~)
20. Ability (can ~)
21. Obligation & permission (must ~ / may ~)
22. Desire (want to ~)
23. Adjective agreement & position
24. Adverbs & exclamations
25. Comparison & superlative
26. Conjunctions (and / so / but)
27. While ~ (-दै) / after ~ (-एपछि)
28. In order to ~ (-नको लागि)
29. Relative clauses: the one who ~ (-ने)
30. Conditionals (if ~)
31. Inference / opinion / possibility (I think / probably / might / must be)
32. Passive (be ~ed)
33. Causative (make someone ~)
34. Reported speech (said that ~)
- Appendix A: Full verb conjugation (गर्नु, all persons)
- Appendix B: Copula conjugation (हो / छ / थियो, all persons)

## 6. 品質上の注意
- **ネパール語文法の正確さを最優先**（マスターの形を変えないこと）。
- 英語は自然で平易に。固有名詞や文化語（例 सुन्तला＝orange, नमस्ते＝Namaste）は英語話者に分かる説明を添えてよい。
- 完成後、**ネパール語話者による確認**を推奨（マスターもAI作成のため）。

## 7. 納品
- Markdown 1ファイル（`grammar_guide_v2_en.md` など）。
- これを受け取ったら、こちら（Claude側）で**アプリ用JSONに変換**し、英語UIの「Guide」ボタンに載せます。
