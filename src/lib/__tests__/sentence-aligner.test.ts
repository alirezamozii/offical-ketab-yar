import { describe, it, expect } from 'vitest'
import {
  splitSentences,
  alignBilingualSentences,
} from '@/lib/reader/sentence-aligner'

describe('sentence-aligner', () => {
  it('protects English abbreviations like Mr. and Dr.', () => {
    const text = 'Mr. Smith and Dr. Watson arrived at 3.14 pm. They were very happy.'
    const sentences = splitSentences(text, 'english')
    expect(sentences).toHaveLength(2)
    expect(sentences[0]).toBe('Mr. Smith and Dr. Watson arrived at 3.14 pm.')
    expect(sentences[1]).toBe('They were very happy.')
  })

  it('splits Persian sentences correctly with Persian punctuation', () => {
    const text = 'آسمان آبی بود. آیا پرنده‌ای دیدی؟ بله! همه چیز آرام بود.'
    const sentences = splitSentences(text, 'farsi')
    expect(sentences).toHaveLength(4)
    expect(sentences[0]).toBe('آسمان آبی بود.')
    expect(sentences[1]).toBe('آیا پرنده‌ای دیدی؟')
    expect(sentences[2]).toBe('بله!')
    expect(sentences[3]).toBe('همه چیز آرام بود.')
  })

  it('correctly aligns the user-provided Steinbeck paragraph', () => {
    const en =
      'A FEW MILES south of Soledad, the Salinas River drops in close to the hillside bank and runs deep and green. ' +
      'The water is warm too, for it has slipped twinkling over the yellow sands in the sunlight before reaching the narrow pool. ' +
      'On one side of the river the golden foothill slopes curve up to the strong and rocky Gabilan mountains, but on the valley side the water is lined with trees. ' +
      'Evening of a hot day started the little wind to moving among the leaves.'

    const fa =
      'چند مایلی جنوب سولِداد، رود سالیناس به دامنه تپه نزدیک میشود و عمیق و سبز روان است. ' +
      'آب گرم است، چون پیش از رسیدن به برکه باریک، با درخششی از روی ماسههای زرد در آفتاب میلغزد. ' +
      'در یک سوی رود، دامنههای طلایی پیشکوهها تا کوههای سنگی و استوار گابیلان بالا میروند، اما در سوی دره، کنار آب درختصفایی است. ' +
      'غروب روز داغ، نسیم کوچکی را میان برگها به حرکت درآورد.'

    const aligned = alignBilingualSentences(en, fa, 'english')
    expect(aligned).toHaveLength(4)
    expect(aligned[0].primary).toContain('A FEW MILES')
    expect(aligned[0].secondary).toContain('چند مایلی جنوب سولِداد')
    expect(aligned[3].primary).toContain('Evening of a hot day')
    expect(aligned[3].secondary).toContain('غروب روز داغ')
  })

  it('handles unequal sentence counts gracefully', () => {
    const en = 'Hello world. How are you today?'
    const fa = 'سلام دنیا.'
    const aligned = alignBilingualSentences(en, fa, 'english')
    expect(aligned.length).toBeGreaterThanOrEqual(1)
    // No text should be lost
    const allEn = aligned.map((a) => a.primary).join(' ')
    const allFa = aligned.map((a) => a.secondary).join(' ')
    expect(allEn).toContain('Hello world')
    expect(allEn).toContain('How are you today')
    expect(allFa).toContain('سلام دنیا')
  })

  it('correctly aligns the exact full Steinbeck page from user prompt', () => {
    const en = `A FEW MILES south of Soledad, the Salinas River drops in close to the hillside bank and runs deep and green. The water is warm too, for it has slipped twinkling over the yellow sands in the sunlight before reaching the narrow pool. On one side of the river the golden foothill slopes curve up to the strong and rocky Gabilan mountains, but on the valley side the water is lined with trees - willows fresh and green with every spring, carrying in their lower leaf junctures the debris of the winter's flooding; and sycamores with mottled, white, recumbent limbs and branches that arch over the pool. On the sandy bank under the trees the leaves lie deep and so crisp that a lizard makes a great skittering if he runs among them. Rabbits come out of the brush to sit on the sand in the evening, and the damp flats are covered with the night tracks of 'coons, and with the spread pads of dogs from the ranches, and with the split-wedge tracks of deer that come to drink in the dark. There is a path through the willows and among the sycamores, a path beaten hard by boys coming down from the ranches to swim in the deep pool, and beaten hard by tramps who come wearily down from the highway in the evening to jungle-up near water. In front of the low horizontal limb of a giant sycamore there is an ash pile made by many fires; the limb is worn smooth by men who have sat on it. Evening of a hot day started the little wind to moving among the leaves. The shade climbed up the hills toward the top. On the sand banks the rabbits sat as quietly as little gray, sculptured stones. And then from the direction of the state highway came the sound of footsteps on crisp sycamore leaves. The rabbits hurried noiselessly for cover. A stilted heron labored up into the air and pounded down river. For a moment the place was lifeless, and then two men emerged from the path and came into the opening by the green pool.`

    const fa = `چند مایلی جنوب سولِداد، رود سالیناس به دامنه تپه نزدیک میشود و عمیق و سبز روان است. آب گرم است، چون پیش از رسیدن به برکه باریک، با درخششی از روی ماسههای زرد در آفتاب میلغزد. در یک سوی رود، دامنههای طلایی پیشکوهها تا کوههای سنگی و استوار گابیلان بالا میروند، اما در سوی دره، کنار آب درختصفایی است: بیدهایی که هر بهار تازه و سبز میشوند و در گره برگهای پایینشان بازمانده سیلاب زمستان را با خود دارند، و چنارهایی با تنههای خالدار، سفید و افتاده که شاخههایشان بر فراز برکه قوس میزند. روی کرانه شنی، زیر سایه درختها، برگها چنان ژرف و خشک انباشتهاند که اگر مارمولکی میانشان بدود، خشخشی بزرگ برمیخیزد. غروبها خرگوشها از لابهلای بوتهها بیرون میآیند تا روی ماسه بنشینند، و زمینهای نمدار با ردپای شبانه راکونها پوشیده است، با رد کف پهن سگهایی که از مزرعهها میآیند و ردپای شکافته گوزنهایی که در تاریکی میآیند آب بنوشند. از میان بیدها و چنارها راهی هست، راهی که رفتوآمد پسرکهایی که از مزرعهها میآیند تا در برکه عمیق شنا کنند آن را سخت کوبیده، و ولگردانی که غروبها خسته از جاده شاهی میآیند تا کنار آب منزل کنند آن را نرم کرده است. پیش از شاخه افقی و کوتاه یک چنار غولپیکر، تودهای خاکستر از آتشهای بسیار باقی مانده است. شاخه از نشستن آدمها صیقل خورده و لیسه شده. غروب روز داغ، نسیم کوچکی را میان برگها به حرکت درآورد. سایه از تپهها بالا رفت و به قله نزدیک شد. روی کرانههای شنی، خرگوشها چون سنگهای خاکستری منقور بیحرکت نشسته بودند. و بعد از سوی جاده شاهی، صدای گامها روی برگهای خشک چنار آمد. خرگوشها بیصدا به پناهگاه شتافتند. حواصیلی پادراز نفسنفسزنان به آسمان برخاست و پایینتر در دل رود فرود آمد. برای لحظهای مکان بیجان ماند، و بعد دو مرد از دل راه بیرون آمدند و به گشادگی کنار برکه سبز رسیدند.`

    const aligned = alignBilingualSentences(en, fa, 'english')
    expect(aligned.length).toBeGreaterThanOrEqual(13)
    // First sentence matches
    expect(aligned[0].primary).toContain('A FEW MILES')
    expect(aligned[0].secondary).toContain('چند مایلی جنوب')
    // Last sentence matches
    expect(aligned[aligned.length - 1].primary).toContain('two men emerged from the path')
    expect(aligned[aligned.length - 1].secondary).toContain('دو مرد از دل راه بیرون آمدند')
  })

  it('correctly matches paragraphs with \\n\\n for Page 3', () => {
    const en = `George unslung his bindle and dropped it gently on the bank. "I ain't sure it's good water," he said. "Looks kinda scummy."\n\nLennie dabb1ed his big paw in the water and wiggled his fingers so the water arose in little splashes; rings widened across the pool to the other side and came back again. Lennie watched them go. "Look, George. Look what I done."`
    const fa = `جرج بند لختش را باز کرد و آرام بر کرانه گذاشت. «مطمئن نیستم این آب سالم باشد،» گفت. «یهجورهایی کفآلوده به نظر میرسه.»\n\nلنی پنجه بزرگش را در آب چرخاند و انگشتانش را جنباند؛ آب به موجهای کوچک برمیخاست. حلقهها روی برکه گسترده میشدند تا آن سوی آب و برمیگشتند. لنی تماشایشان میکرد. «ببین جرج. ببین من چیکار کردم.»`

    const aligned = alignBilingualSentences(en, fa, 'english')
    expect(aligned[0].primary).toContain('George unslung his bindle')
    expect(aligned[0].secondary).toContain('جرج بند لختش')
    expect(aligned[aligned.length - 1].primary).toContain('Look what I done')
    expect(aligned[aligned.length - 1].secondary).toContain('ببین من چیکار کردم')
  })

  it('correctly matches dialog lines with \\n\\n for Page 4', () => {
    const en = `Lennie looked timidly over to him. "George?"\n\n"Yeah, what ya want?"\n\n"Where we goin', George?"`
    const fa = `لنی با خجالت به او نگاه کرد. «جرج؟»\n\n«بله، چیکار داری؟»\n\n«کجا میریم، جرج؟»`

    const aligned = alignBilingualSentences(en, fa, 'english')
    expect(aligned).toHaveLength(4)
    expect(aligned[0].primary).toContain('Lennie looked timidly')
    expect(aligned[0].secondary).toContain('لنی با خجالت')
    expect(aligned[1].primary).toContain('George?')
    expect(aligned[1].secondary).toContain('جرج؟')
    expect(aligned[2].primary).toContain('what ya want')
    expect(aligned[2].secondary).toContain('چیکار داری')
    expect(aligned[3].primary).toContain('Where we goin')
    expect(aligned[3].secondary).toContain('کجا میریم')
  })
})
