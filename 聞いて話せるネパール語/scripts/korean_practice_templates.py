"""Authored Korean equivalents for the finite practice sentence matrix.

No translation service or fuzzy matching. Only complete, exact English sentences
generated from the reviewed vocabulary below qualify. Preview before recording.
"""
import json
from record_korean import WORK


def candidates():
    out = {}

    def put(en, ko):
        if en in out and out[en] != ko:
            raise ValueError(f'Conflicting authored translation: {en}')
        out[en] = ko

    people = [('I', '저는', 'am', False), ('We', '우리는', 'are', False),
              ('You', '당신은', 'are', True), ('That person', '그분은', 'is', True)]
    identities = [('friend', 'friends', '친구'), ('coworker', 'coworkers', '동료'),
                  ('teacher', 'teachers', '선생님'), ('traveller', 'travellers', '여행자'),
                  ('artist', 'artists', '예술가'), ('journalist', 'journalists', '기자'),
                  ('nurse', 'nurses', '간호사'), ('student', 'students', '학생')]
    for one, many, ko in identities:
        for en, subject, be, honor in people:
            pred = ('이세요' if (ord(ko[-1])-0xAC00) % 28 else '세요') if honor else ('이에요' if (ord(ko[-1])-0xAC00) % 28 else '예요')
            put(f'{en} {be} {many if en == "We" else "a " + one}.', f'{subject} {ko}{pred}.')
        pred = '이에요' if (ord(ko[-1])-0xAC00) % 28 else '예요'
        put(f'Here we are {many}.', f'여기서 우리는 {ko}{pred}.')
        put(one, ko)

    places = {'home': '집', 'the room': '방', 'the library': '도서관',
              'the school': '학교', 'school': '학교', 'the shop': '가게',
              'the market': '시장', 'the park': '공원', 'the office': '사무실'}
    for place, ko in places.items():
        prep = 'in' if place == 'the room' else 'at'
        for en, subject, be, honor in people:
            put(f'{en} {be} {prep} {place} now.', f'{subject} 지금 {ko}에 {"계세요" if honor else "있어요"}.')
            put(f'{en} used to stay at {place}.', f'{subject} 예전에 {ko}에 {"머무시곤 했어요" if honor else "머물곤 했어요"}.')
        put(f'I am at {place}.', f'저는 {ko}에 있어요.')
        put(f'I come from {place}.', f'저는 {ko}에서 와요.')
        put(f'I go as far as {place}.', f'저는 {ko}까지 가요.')
        put(f'I am always at {place} in the morning.', f'저는 아침에 항상 {ko}에 있어요.')
        put(f'at {place}', ko + '에')
        put(f'from {place}', ko + '에서')
        put(f'as far as {place}', ko + '까지')
    put('in the room', '방 안에')
    put('I go all the way home.', '저는 집까지 가요.')
    put('all the way home', '집까지')
    for person, ko in [('friend', '친구'), ('coworker', '동료'), ('teacher', '선생님'),
                       ('student', '학생'), ('traveller', '여행자')]:
        particle = '과' if (ord(ko[-1])-0xAC00) % 28 else '와'
        phrase = ko + particle + ' 함께'
        put(f'I go with a {person}.', f'저는 {phrase} 가요.')
        put(f'with a {person}', phrase)

    states = {
        'happy': ('행복', '행복해요', '행복하세요', '행복하', '행복한', '행복하지 않은'),
        'busy': ('바쁜', '바빠요', '바쁘세요', '바쁘', '바쁜', '바쁘지 않은'),
        'healthy': ('건강한', '건강해요', '건강하세요', '건강하', '건강한', '건강하지 않은'),
        'ill': ('아픈', '아파요', '아프세요', '아프', '아픈', '아프지 않은'),
        'ready': ('준비된', '준비됐어요', '준비되셨어요', '준비되', '준비된', '준비되지 않은'),
        'tired': ('피곤한', '피곤해요', '피곤하세요', '피곤하', '피곤한', '피곤하지 않은'),
        'calm': ('차분한', '차분해요', '차분하세요', '차분하', '차분한', '차분하지 않은'),
    }
    for state, (gloss, plain, honorific, stem, modifier, negative) in states.items():
        put(state, '행복한' if state == 'happy' else gloss)
        for en, subject, be, honor in people:
            for when, when_ko in [('today', '오늘'), ('now', '지금')]:
                put(f'{en} {be} {state} {when}.', f'{subject} {when_ko} {honorific if honor else plain}.')
            if honor:
                prediction = {'happy': '행복하실', 'busy': '바쁘실', 'healthy': '건강하실',
                              'ill': '아프실', 'ready': '준비되셨을', 'tired': '피곤하실', 'calm': '차분하실'}[state]
                put(f'{en} {be} probably {state} today.', f'{subject} 오늘 아마 {prediction} 거예요.')
                for neg in [False, True]:
                    reported = negative if neg else modifier
                    pronoun = 'they' if en == 'That person' else 'you'
                    put(f'{en} said {pronoun} were {"not " if neg else ""}{state}.',
                        f'{subject} 자신이 {reported} 상태라고 말씀하셨어요.')
        for en, subject, be, form, label in [
                ('He/she (familiar)', '그 사람은', 'is', plain, '친근한 말'),
                ('He/she (mid-level respect)', '그 사람은', 'is', plain, '중간 존대'),
                ('You (familiar)', '너는', 'are', plain, '친근한 말'),
                ('That person (respectful)', '그분은', 'is', honorific, '높임')]:
            put(f'{en} {be} {state}.', f'{subject} {form}. ({label})')

    foods = {'tea': ('차', '뜨거워요'), 'coffee': ('커피', '뜨거워요'),
             'soup': ('수프', '뜨거워요'), 'water': ('물', '차가워요'),
             'juice': ('주스', '차가워요'), 'milk': ('우유', '뜨거워요'),
             'meal': ('음식', '맛있어요')}
    for en, (ko, pred) in foods.items():
        adjective = 'cold' if en in ['water', 'juice'] else 'tasty' if en == 'meal' else 'hot'
        topic = ko + ('은' if (ord(ko[-1])-0xAC00) % 28 else '는')
        for when, when_ko in [('in the morning', '아침에'), ('in the evening', '저녁에')]:
            put(f'Here, the {en} is {adjective} {when}.', f'이곳에서 {topic} {when_ko} {pred}.')
        put(f'Here, the {en} is always {adjective}.', f'이곳에서 {topic} 항상 {pred}.')
        negative = {'hot': '뜨거운', 'cold': '차가운', 'tasty': '맛있는'}[adjective]
        put(f'Here, the {en} is not always {adjective}.', f'이곳에서 {topic} 항상 {negative} 것은 아니에요.')
        put(f'This {en} is probably {adjective}.', f'이 {topic} 아마 {negative} 것 같아요.')
        put(en, ko)

    # English base, third person, past, participle, -ing; Korean object, stem,
    # present, past, completed modifier, future/adnominal, present honorific.
    actions = [
        ('read a book', 'reads a book', 'read a book', 'read a book', 'reading a book', '책을', '읽', '읽어요', '읽었어요', '읽은', '읽을', '읽으세요'),
        ('write a letter', 'writes a letter', 'wrote a letter', 'written a letter', 'writing a letter', '편지를', '쓰', '써요', '썼어요', '쓴', '쓸', '쓰세요'),
        ('drink milk', 'drinks milk', 'drank milk', 'drunk milk', 'drinking milk', '우유를', '마시', '마셔요', '마셨어요', '마신', '마실', '마시세요'),
        ('eat an apple', 'eats an apple', 'ate an apple', 'eaten an apple', 'eating an apple', '사과를', '먹', '먹어요', '먹었어요', '먹은', '먹을', '먹으세요'),
        ('buy a bag', 'buys a bag', 'bought a bag', 'bought a bag', 'buying a bag', '가방을', '사', '사요', '샀어요', '산', '살', '사세요'),
        ('learn Nepali', 'learns Nepali', 'learnt Nepali', 'learnt Nepali', 'learning Nepali', '네팔어를', '배우', '배워요', '배웠어요', '배운', '배울', '배우세요'),
        ('play a game', 'plays a game', 'played a game', 'played a game', 'playing a game', '게임을', '하', '해요', '했어요', '한', '할', '하세요'),
        ('read Nepali', 'reads Nepali', 'read Nepali', 'read Nepali', 'reading Nepali', '네팔어를', '읽', '읽어요', '읽었어요', '읽은', '읽을', '읽으세요'),
        ('sing a song', 'sings a song', 'sang a song', 'sung a song', 'singing a song', '노래를', '부르', '불러요', '불렀어요', '부른', '부를', '부르세요'),
        ('cook a meal', 'cooks a meal', 'cooked a meal', 'cooked a meal', 'cooking a meal', '음식을', '만들', '만들어요', '만들었어요', '만든', '만들', '만드세요'),
        ('ride a bicycle', 'rides a bicycle', 'rode a bicycle', 'ridden a bicycle', 'riding a bicycle', '자전거를', '타', '타요', '탔어요', '탄', '탈', '타세요'),
        ('take a photo', 'takes a photo', 'took a photo', 'taken a photo', 'taking a photo', '사진을', '찍', '찍어요', '찍었어요', '찍은', '찍을', '찍으세요'),
        ('speak English', 'speaks English', 'spoke English', 'spoken English', 'speaking English', '영어를', '말하', '말해요', '말했어요', '말한', '말할', '말하세요'),
    ]
    for base, third, past_en, perfect_en, ing, obj, stem, present, past, complete, future, honorific in actions:
        for en, subject, be, honor in people:
            present_ko = honorific if honor else present
            past_ko = honorific.removesuffix('세요') + '셨어요' if honor else past
            future_ko = (honorific.removesuffix('세요') + '실') if honor else future
            put(f'{en} {third if en == "That person" else base} in the morning.', f'{subject} 아침에 {obj} {present_ko}.')
            put(f'{en} {"does" if en == "That person" else "do"} not {base} in the morning.', f'{subject} 아침에 {obj} {stem}지 {"않으세요" if honor else "않아요"}.')
            put(f'{en} {be} {ing} now.', f'{subject} 지금 {obj} {stem}고 {"계세요" if honor else "있어요"}.')
            put(f'{en} {past_en} yesterday.', f'{subject} 어제 {obj} {past_ko}.')
            put(f'{en} did not {base} yesterday.', f'{subject} 어제 {obj} {stem}지 {"않으셨어요" if honor else "않았어요"}.')
            put(f'{en} will {base} tomorrow.', f'{subject} 내일 {obj} {future_ko} 거예요.')
            put(f'{en} can {base}.', f'{subject} {obj} {future} 수 {"있으세요" if honor else "있어요"}.')
            desire = '싶어 하세요' if en == 'That person' else '싶으세요' if honor else '싶어요'
            put(f'{en} {"wants" if en == "That person" else "want"} to {base}.', f'{subject} {obj} {stem}고 {desire}.')
            put(f'{en} {"has" if en == "That person" else "have"} {perfect_en}.', f'{subject} {obj} {past_ko} (완료·경험).')
            for gender, gender_ko in [('male', '남성'), ('female', '여성')]:
                put(f'I ({gender} speaker) have {perfect_en}.', f'저는({gender_ko}) {obj} {past} (완료·경험).')
                put(f'By yesterday evening, I ({gender} speaker) had {perfect_en}.', f'저는({gender_ko}) 어제 저녁까지 이미 {obj} {past}.')
                put(f'I ({gender} speaker) came here to {base}.', f'저는({gender_ko}) {obj} {future} 목적으로 여기 왔어요.')
            put(f'By yesterday evening, {en if en == "I" else en.lower()} had {perfect_en}.', f'{subject} 어제 저녁까지 이미 {obj} {past_ko}.')
            put(f'{en} came here to {base}.', f'{subject} {obj} {future} 목적으로 여기 {"오셨어요" if honor else "왔어요"}.')
        for adv, ko in [('slowly', '천천히'), ('quickly', '빨리'), ('again', '다시')]:
            put(f'That person {third} {adv}.', f'그분은 {ko} {obj} {honorific}.')
        for when, when_ko in [('today', '오늘'), ('tomorrow', '내일')]:
            for time, time_ko in [('time', '시간'), ('free time', '여유 시간')]:
                put(f'If there is {time} {when}, I will {base}.', f'{when_ko} {time_ko}이 있으면 저는 {obj} {future} 거예요.')
        for mode, end in [('are allowed to', '도 돼요'), ('are not allowed to', '면 안 돼요'), ('must', '야 해요')]:
            if mode == 'are allowed to': verb = present.removesuffix('요') + end
            elif mode == 'are not allowed to':
                conditional = {'읽': '읽으면', '쓰': '쓰면', '마시': '마시면', '먹': '먹으면',
                               '사': '사면', '배우': '배우면', '하': '하면', '부르': '부르면',
                               '만들': '만들면', '타': '타면', '찍': '찍으면', '말하': '말하면'}[stem]
                verb = conditional + ' 안 돼요'
            else: verb = present.removesuffix('요') + end
            put(f'You {mode} {base} here.', f'여기서 {obj} {verb}.')
        put(f'Whoever {third} learns.', f'{obj} {stem}는 사람은 배워요.' if stem != '만들' else f'{obj} 만드는 사람은 배워요.')
        put(f'When that person {third}, we learn.', f'그분이 {obj} {honorific.removesuffix("세요")}실 때 우리는 배워요.')
        put(base, f'{obj} {stem}다')
        put('to ' + base, f'{obj} {stem}다(-न형)')
        put('to ' + base + ' (before लागि)', f'{obj} {stem}기 위해(लागि 앞)')
        put(base + ' (respectful)', f'{obj} {honorific}(높임)')
        put('will ' + base, f'{obj} {future} 것이다')
        put('do not ' + base, f'{obj} {stem}지 않다')
        put('did not ' + base, f'{obj} {stem}지 않았다')
        put('ongoing ' + base, f'{obj} {stem}고 있다')
        # Some forms such as read have identical present/past spelling; the
        # individual requests' context decides these and is reviewed manually.
        if past_en != base:
            put(past_en, f'{obj} {past.removesuffix("어요").removesuffix("아요")}다')

    return out


if __name__ == '__main__':
    plan = json.loads((WORK / 'korean_translation_requests.json').read_text(encoding='utf-8'))
    cache = json.loads((WORK / 'korean_translations.json').read_text(encoding='utf-8'))['items']
    keys = {d['key'] for d in plan['destinations'] if d['path'][1] == 'learningPathV3'}
    authored = candidates()
    for i, (key, req) in enumerate(plan['requests'].items()):
        if key in keys and not cache.get(key, {}).get('reviewed') and req['en'] in authored:
            print(f'{i}|{req["en"]}|{authored[req["en"]]}')
