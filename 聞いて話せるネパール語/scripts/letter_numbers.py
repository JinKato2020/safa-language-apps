"""Nepali cardinal-number facts, with our own consistent learner romanization.

Cross-checked against Unicode CLDR Nepali RBNF and BCcampus's Nepali appendix.
Spellings use the course's existing forms (तीन, बीस, चालीस, etc.).
These are number names, not recordings of individual digits in a telephone number.
"""

SMALL = """
शून्य|śūnya
एक|ek
दुई|duī
तीन|tīn
चार|cār
पाँच|pā̃c
छ|cha
सात|sāt
आठ|āṭh
नौ|nau
दस|das
एघार|eghār
बाह्र|bāhra
तेह्र|tehra
चौध|caudh
पन्ध्र|pandhra
सोह्र|sohra
सत्र|satra
अठार|aṭhār
उन्नाइस|unnāis
बीस|bīs
एक्काइस|ekkāis
बाइस|bāis
तेइस|teis
चौबीस|caubīs
पच्चीस|paccīs
छब्बीस|chabbīs
सत्ताइस|sattāis
अट्ठाइस|aṭṭhāis
उनन्तीस|unantīs
तीस|tīs
एकतीस|ekatīs
बत्तीस|battīs
तेत्तीस|tettīs
चौँतीस|caũtīs
पैँतीस|paĩtīs
छत्तीस|chattīs
सैँतीस|saĩtīs
अठतीस|aṭhatīs
उनन्चालीस|unancālīs
चालीस|cālīs
एकचालीस|ekacālīs
बयालीस|bayālīs
त्रिचालीस|tricālīs
चवालीस|cavālīs
पैँतालीस|paĩtālīs
छयालीस|chayālīs
सतचालीस|satacālīs
अठचालीस|aṭhacālīs
उनन्चास|unancās
पचास|pacās
एकाउन्न|ekāunna
बाउन्न|bāunna
त्रिपन्न|tripanna
चवन्न|cavanna
पचपन्न|pacapanna
छपन्न|chapanna
सन्ताउन्न|santāunna
अन्ठाउन्न|anṭhāunna
उनन्साठी|unansāṭhī
साठी|sāṭhī
एकसट्ठी|ekasaṭṭhī
बयसट्ठी|bayasaṭṭhī
त्रिसट्ठी|trisaṭṭhī
चौसट्ठी|causaṭṭhī
पैँसट्ठी|paĩsaṭṭhī
छयसट्ठी|chayasaṭṭhī
सतसट्ठी|satasaṭṭhī
अठसट्ठी|aṭhasaṭṭhī
उनन्सत्तरी|unansattarī
सत्तरी|sattarī
एकहत्तर|ekahattar
बहत्तर|bahattar
त्रिहत्तर|trihattar
चौहत्तर|cauhattar
पचहत्तर|pacahattar
छयहत्तर|chayahattar
सतहत्तर|satahattar
अठहत्तर|aṭhahattar
उनासी|unāsī
असी|asī
एकासी|ekāsī
बयासी|bayāsī
त्रियासी|triyāsī
चौरासी|caurāsī
पचासी|pacāsī
छयासी|chayāsī
सतासी|satāsī
अठासी|aṭhāsī
उनान्नब्बे|unānnabbe
नब्बे|nabbe
एकानब्बे|ekānabbe
बयानब्बे|bayānabbe
त्रियानब्बे|triyānabbe
चौरानब्बे|caurānabbe
पन्चानब्बे|pancānabbe
छयानब्बे|chayānabbe
सन्तानब्बे|santānabbe
अन्ठानब्बे|anṭhānabbe
उनान्सय|unānsay
एक सय|ek say
""".strip().splitlines()

LARGE = [
    (1_000, 'एक हजार', 'ek hajār', '1,000（千）', '1,000 · one thousand'),
    (10_000, 'दस हजार', 'das hajār', '10,000（1万）', '10,000 · ten thousand'),
    (100_000, 'एक लाख', 'ek lākh', '100,000（10万）', '100,000 · one lakh'),
    (1_000_000, 'दस लाख', 'das lākh', '1,000,000（100万）', '1,000,000 · ten lakh'),
    (10_000_000, 'एक करोड', 'ek karoḍ', '10,000,000（1,000万）', '10,000,000 · one crore'),
]


def number_rows():
    assert len(SMALL) == 101
    rows = [(i, *entry.split('|'), str(i), str(i)) for i, entry in enumerate(SMALL)] + LARGE
    assert len({r[0] for r in rows}) == len(rows) == 106
    return rows


def nepali_digits(value):
    return str(value).translate(str.maketrans('0123456789', '०१२३४५६७८९'))
