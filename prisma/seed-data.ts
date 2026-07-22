// Seed content for Ketab-Yar. English excerpts are from public-domain works.
// Persian (Farsi) translations are faithful adaptations for bilingual reading.

export interface SeedPage {
  english: string
  farsi: string
  type?: 'text' | 'heading'
}

export interface SeedBook {
  slug: string
  title: string
  author: string
  description: string
  coverFrom: string
  coverTo: string
  coverAccent: string
  genres: string[]
  level: string
  rating: number
  reviewCount: number
  viewCount: number
  isPremium: boolean
  publishedYear: number
  pages: SeedPage[]
}

export const SEED_BOOKS: SeedBook[] = [
  {
    slug: 'alice-in-wonderland',
    title: "Alice's Adventures in Wonderland",
    author: 'Lewis Carroll',
    description:
      'A curious girl named Alice falls through a rabbit hole into a fantasy world populated by peculiar, anthropomorphic creatures. A timeless classic of nonsense literature.',
    coverFrom: '#b8956a',
    coverTo: '#6d523a',
    coverAccent: '#f4d35e',
    genres: ['Fantasy', 'Classic', 'Children'],
    level: 'B1',
    rating: 4.7,
    reviewCount: 1284,
    viewCount: 15420,
    isPremium: false,
    publishedYear: 1865,
    pages: [
      {
        type: 'heading',
        english: 'Chapter 1 — Down the Rabbit-Hole',
        farsi: 'فصل اول — پایینِ سوراخِ خرگوش',
      },
      {
        english:
          'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice, "without pictures or conversations?" So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her. There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!" But when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and, burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.',
        farsi:
          'آلیس داشت از نشستن کنار خواهرش کنار رودخانه و نداشتن کاری برای انجام دادن بسیار خسته می‌شد. یک‌بار یا دو بار به کتابی که خواهرش می‌خواند نگاهی انداخت، اما در آن نه تصویری بود نه گفت‌وگوهایی. «و فایده‌ی کتابی که در آن تصویر و گفت‌وگو نیست چیست؟» به خود اندیشید آلیس. پس در ذهن خود اندیشید (تا جایی که می‌توانست، چون روز گرم او را خواب‌آلود و کند کرده بود) که آیا لذتِ ساختن یک گردنبند گل بابونه، ارزشِ زحمتِ بلند شدن و چیدن بابونه‌ها را دارد یا نه، که ناگهان یک خرگوشِ سفید با چشمان صورتی از کنارش دوید. چیز بسیار عجیبی در این نبود؛ و آلیس هم که خرگوش به خودش می‌گفت «آه پدر! آه پدر! دیر می‌کنم!» چندان غیرعادی نیافت. اما وقتی خرگوش واقعاً یک ساعت از جیب جلیقۀ خود بیرون آورد، به آن نگاه کرد و سپس عجله کرد و رفت، آلیس روی پایش پرید، چون ناگهان به ذهنش خطور کرد که هرگز خرگوشی با جیب جلیقه یا ساعتی که از آن بیرون بیاورد ندیده بود، و با کنجکاویِ فراوان، میدان را به دنبالش دوید و خوشبختانه همین که رسید دید که خرگوش زیر یک بوته، درون یک سوراخِ بزرگ خرگوش فرو رفت.',
      },
      {
        english:
          'In another moment down went Alice after it, never once considering how in the world she was to get out again. The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well. Either the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look about her, and to wonder what was going to happen next. First, she tried to look down and make out what she was coming to, but it was too dark to see anything; then she looked at the sides of the well, and noticed that they were filled with cupboards and book-shelves; here and there she saw maps and pictures hung upon pegs. She took down a jar from one of the shelves as she passed; it was labelled "ORANGE MARMALADE", but to her great disappointment it was empty: she did not like to drop the jar for fear of killing somebody underneath, so managed to put it into one of the cupboards as she fell past it.',
        farsi:
          'در لحظه‌ای دیگر آلیس هم به دنبالش رفت، بدون آنکه حتی یک لحظه بیندیشد چگونه از آنجا بیرون خواهد آمد. سوراخِ خرگوش مانند یک تونل مستقیم می‌رفت، آن‌گاه ناگهان به پایین متمایل می‌شد، آن‌قدر ناگهانی که آلیس لحظه‌ای برای فکر کردن به توقف خود نیافت پیش از آنکه خود را در حالِ افتادن در چاهی بسیار عمیق بیابد. یا چاه بسیار عمیق بود، یا او بسیار آرام می‌افتاد، چون وقتِ کافی داشت تا هنگامِ افتادن به اطراف نگاه کند و بیندیشد که بعد چه خواهد شد. نخست کوشید به پایین نگاه کند و ببیند به کجا می‌رسد، اما آن‌جا تاریک بود و چیزی دیده نمی‌شد؛ سپس به دیوارهای چاه نگاه کرد و دید که پر از کمد و کتابخانه بود؛ این‌جا و آن‌جا نقشه و تصویری بر میخ‌ها آویزان بود. هنگام گذر، یک شیشه از یکی از طاقچه‌ها برداشت؛ روی آن نوشته بود «مارمالاد پرتقال»، اما به نومیدیِ بزرگش خالی بود: دوست نداشت شیشه را بیندازد مبادا کسی زیرش کشته شود، پس وقتی از کنار یکی از کمدها می‌گذشت، موفق شد آن را در آن بگذارد.',
      },
      {
        english:
          '"Well!" thought Alice to herself. "After such a fall as this, I shall think nothing of tumbling down stairs! How brave they will all think me at home! Why, I would not say anything about it, even if I fell off the top of the house!" (Which was very likely true.) Down, down, down. Would the fall never come to an end? "I wonder how many miles I have fallen by this time?" she said aloud. "I must be getting somewhere near the centre of the earth. Let me see: that would be four thousand miles down, I think—" (for, you see, Alice had learnt several things of this sort in her lessons in the schoolroom, and though this was not a very good opportunity for showing off her knowledge, as there was no one to listen to her, still it was good practice to say it over).',
        farsi:
          '«خب!» آلیس با خود اندیشید. «بعد از چنین افتادنی، دیگر افتادن از پله‌ها برایم مهم نخواهد بود! در خانه همه فکر خواهند کرد چقدر شجاعم! بله، حتی اگر از بام خانه بیفتم چیزی نخواهم گفت!» (که بسیار محتمل بود درست باشد.) پایین، پایین، پایین. آیا این افتادن هیچ‌گاه تمام نمی‌شد؟ «می‌بینم تا حالا چند مایل افتاده‌ام؟» با صدای بلند گفت. «باید جایی نزدیک مرکز زمین برسم. بگذارید ببینم: آن‌جا چهار هزار مایل پایین‌تر است، فکر کنم—» (چون، می‌بینید، آلیس چیزهای چندی از این دست را در درس‌های مدرسه آموخته بود، و گرچه این فرصت خوبی برای نشان دادن دانشش نبود، چون کسی نبود به او گوش دهد، باز هم تمرین خوبی بود که آن را تکرار کند).',
      },
      {
        english:
          'Suddenly she came upon a little three-legged table, all made of solid glass; there was nothing on it except a tiny golden key, and Alice\'s first thought was that it might belong to one of the doors of the hall; but, alas! either the locks were too large, or the key was too small, but at any rate it would not open any of them. However, on the second time round, she came upon a low curtain she had not noticed before, and behind it was a little door about fifteen inches high: she tried the little golden key in the lock, and to her great delight it fitted! Alice opened the door and found that it led into a small passage, not much larger than a rat-hole: she knelt down and looked along the passage into the loveliest garden you ever saw. How she longed to get out of that dark hall, and wander about among those beds of bright flowers and those cool fountains, but she could not even get her head through the doorway; "and even if my head would go through," thought poor Alice, "it would be of very little use without my shoulders. Oh, how I wish I could shut up like a telescope! I think I could, if I only knew how to begin."',
        farsi:
          'ناگهان به یک میز کوچک سه‌پایه رسید، تماماً از شیشه‌ی یک‌تکه؛ چیزی روی آن نبود جز یک کلید طلایی کوچک، و نخستین اندیشۀ آلیس این بود که شاید متعلق به یکی از درهای این تالار باشد؛ اما، وای! یا قفل‌ها بیش از حد بزرگ بودند، یا کلید بیش از حد کوچک، اما به هر حال هیچ‌یک را باز نمی‌کرد. با این حال، در بار دوم چرخیدن، به پرده‌ی کوتاهی رسید که پیش‌تر ندیده بود، و پشت آن دری کوچک حدود پانزده اینچ بلندا بود: کلید طلایی کوچک را در قفل امتحان کرد، و به شادیِ بزرگش جور شد! آلیس در را باز کرد و دید که به راهروی کوچکی منتهی می‌شود، نه خیلی بزرگ‌تر از سوراخ موش: زانو زد و به راهرو نگاه کرد و زیباترین باغی را که تا به حال دیده بودید دید. چقدر آرزو می‌کرد از آن تالار تاریک بیرون برود و در میان آن بسترهای گل‌های درخشان و آن فواره‌های خنک بگردد، اما حتی نمی‌توانست سرش را از در راهرو عبور دهد؛ «و حتی اگر سرم عبور کند،» آلیسِ بیچاره اندیشید، «بدون شانه‌هایم چندان به درد نمی‌خورد. آه، کاش می‌توانستم مثل تلسکوپ جمع شوم! فکر می‌کنم می‌توانستم، اگر فقط می‌دانستم چگونه شروع کنم.»',
      },
      {
        english:
          'For a moment she found herself falling through what seemed to be a jar of orange marmalade, which had somehow been suspended in mid-air, but the jar was empty, as she had already discovered. She continued to fall, and the walls of the well were lined with cupboards and book-shelves — here and there she saw maps and pictures hung upon pegs. She took down a jar from one of the shelves as she passed; it was labelled "ORANGE MARMALADE," but to her great disappointment it was empty. Presently she began again. "I wonder if I shall fall right through the earth! How funny it will seem to come out among the people that walk with their heads downward! The Antipathies, I think—" She was rather glad there was no one listening, this time, as it did not sound at all the right word. "But I shall have to ask them what the name of the country is, you know. Please, Ma\'am, is this New Zealand or Australia?" And she tried to curtsey as she spoke — fancy curtseying as you are falling through the air! Do you think you could manage it? "And what an ignorant little girl she will think me for asking! No, it will never do to ask: perhaps I shall see it written up somewhere."',
        farsi:
          'برای لحظه‌ای خود را در حال افتادن از میان چیزی یافت که به نظر می‌آمد یک شیشه مارمالاد پرتقال است که به‌نحوی در هوا معلق بود، اما شیشه خالی بود، همان‌گونه که پیش‌تر کشف کرده بود. به افتادن ادامه داد، و دیوارهای چاه پر از کمد و کتابخانه بود — این‌جا و آن‌جا نقشه و تصویری بر میخ‌ها آویزان دید. هنگام گذر، یک شیشه از یکی از طاقچه‌ها برداشت؛ روی آن نوشته بود «مارمالاد پرتقال»، اما به نومیدیِ بزرگش خالی بود. به‌زودی دوباره آغاز کرد. «می‌بینم اگر مستقیم از میان زمین عبور کنم چگونه خواهد شد! چقدر خنده‌دار خواهد بود که در میان مردمى بیرون بیایم که با سر به پایین راه می‌روند! پاداهل‌ها، فکر کنم—» خوشحال بود که این بار کسی گوش نمی‌داد، چون اصلاً کلمۀ درستی به نظر نمی‌آمد. «اما باید از آن‌ها بپرسم نام کشور چیست، می‌دانید. خواهش می‌کنم خانم، این نیوزیلند است یا استرالیا؟» و هنگام صحبت کوشید تعظیم کند — تصور کنید هنگام افتادن از هوا تعظیم کنید! فکر می‌کنید می‌توانید انجام دهید؟ «و چه دختر نادانی خواهم بود که می‌پرسد! نه، اصلاً درست نیست بپرسم: شاید somewhere نوشته‌اش را ببینم.»',
      },
      {
        english:
          'Down, down, down. There was nothing else to do, so Alice soon began talking again. "Dinah will miss me very much to-night, I should think!" (Dinah was the cat.) "I hope they will remember her saucer of milk at tea-time. Dinah, my dear! I wish you were down here with me! There are no mice in the air, I am afraid, but you might catch a bat, and that is very like a mouse, you know. But do cats eat bats, I wonder?" And here Alice began to get rather sleepy, and went on saying to herself, in a dreamy sort of way, "Do cats eat bats? Do cats eat bats?" and sometimes, "Do bats eat cats?" for, you see, as she could not answer either question, it did not much matter which way she put it. She felt that she was dozing off, and had just begun to dream that she was walking hand in hand with Dinah, and saying to her very earnestly, "Now, Dinah, tell me the truth: did you ever eat a bat?" when suddenly, thump! thump! down she came upon a heap of sticks and dry leaves, and the fall was over.',
        farsi:
          'پایین، پایین، پایین. کار دیگری نبود، پس آلیس به‌زودی دوباره شروع به صحبت کرد. «داینا امشب خیلی دلم‌خواهیِ من را حس می‌کند، فکر کنم!» (داینا گربه بود.) «امیدوارم وقت چای، نعلبکیِ شیرش را یادشان باشد. داینا، عزیزم! کاش اینجا با من بودی! در هوا موشی نیست، می‌ترسم، اما شاید یک خفاش بگیری، و خفاش خیلی شبیه موش است، می‌دانید. اما آیا گربه‌ها خفاش می‌خورند، می‌بینم؟» و اینجا آلیس شروع به خواب‌آلود شدن کرد، و به خود گفت، به‌طور خواب‌آلوده، «آیا گربه‌ها خفاش می‌خورند؟ آیا گربه‌ها خفاش می‌خورند؟» و گاهی، «آیا خفاش‌ها گربه می‌خورند؟» چون، می‌بینید، چون نمی‌توانست هیچ‌یک از سؤال‌ها را جواب دهد، فرقی نمی‌کرد کدام راه بگذارد. احساس کرد داشت خوابش می‌برد، و تازه شروع کرد به خوابیدن که با داینا دست‌به‌دست راه می‌رفت، و بسیار جدی به او می‌گفت، «حالا، داینا، حقیقت را بگو: آیا تا به حال خفاش خورده‌ای؟» که ناگهان، بام! بام! روی توده‌ای از چوب‌ها و برگ‌های خشک افتاد، و افتادن تمام شد.',
      },
      {
        english:
          'Alice was not a bit hurt, and she jumped up on to her feet in a moment: she looked up, but it was all dark overhead; before her was another long passage, and the White Rabbit was still in sight, hurrying down it. There was not a moment to be lost: away went Alice like the wind, and was just in time to hear it say, as it turned a corner, "Oh my ears and whiskers, how late it is getting!" She was close behind it when she turned the corner, but the Rabbit was no longer to be seen: she found herself in a long, low hall, which was lit up by a row of lamps hanging from the roof. There were doors all round the hall, but they were all locked; and when Alice had been all the way down one side and up the other, trying every door, she walked sadly down the middle, wondering how she was ever to get out again.',
        farsi:
          'آلیس هیچ آسیب ندیده بود، و در لحظه‌ای روی پایش پرید: به بالا نگاه کرد، اما همه‌جا تاریک بود؛ پیش از او راهروی طولانی دیگری بود، و خرگوشِ سفید هنوز دیده می‌شد، که در آن عجله می‌کرد. لحظه‌ای برای از دست دادن نبود: آلیس مثل باد رفت، و همین رسید که شنید گفت، هنگام گردش به گوشه‌ای، «اوه گوش‌ها و سبیل‌هایم، چقدر دیر شده!» وقتی به گوشه رسید پشت سرش بود، اما خرگوش دیگر دیده نمی‌شد: خود را در تالارِ طولانی و کوتاهی یافت که با ردیفی از چراغ‌های آویزان از سقف روشن شده بود. درها در اطراف تالار بودند، اما همۀ قفل بودند؛ و وقتی آلیس یک طرف را تا انتها رفت و طرف دیگر را برگشت و هر در را امتحان کرد، با اندوه از وسط گذشت و اندیشید که چگونه همیشه از آنجا بیرون خواهد آمد.',
      },
      {
        english:
          'Suddenly she came upon a little three-legged table, all made of solid glass; there was nothing on it except a tiny golden key, and Alice\'s first thought was that it might belong to one of the doors of the hall; but, alas! either the locks were too large, or the key was too small, but at any rate it would not open any of them. However, on the second time round, she came upon a low curtain she had not noticed before, and behind it was a little door about fifteen inches high: she tried the little golden key in the lock, and to her great delight it fitted! Alice opened the door and found that it led into a small passage, not much larger than a rat-hole: she knelt down and looked along the passage into the loveliest garden you ever saw. How she longed to get out of that dark hall, and wander about among those beds of bright flowers and those cool fountains, but she could not even get her head through the doorway. "Oh," said Alice, "how I wish I could shut up like a telescope! I think I could, if I only knew how to begin." For, you see, so many out-of-the-way things had happened lately, that Alice had begun to think that very few things indeed were really impossible.',
        farsi:
          'ناگهان به یک میز کوچک سه‌پایه رسید، تماماً از شیشه‌ی یک‌تکه؛ چیزی روی آن نبود جز یک کلید طلایی کوچک، و نخستین اندیشۀ آلیس این بود که شاید متعلق به یکی از درهای این تالار باشد؛ اما، وای! یا قفل‌ها بیش از حد بزرگ بودند، یا کلید بیش از حد کوچک، اما به هر حال هیچ‌یک را باز نمی‌کرد. با این حال، در بار دوم چرخیدن، به پرده‌ی کوتاهی رسید که پیش‌تر ندیده بود، و پشت آن دری کوچک حدود پانزده اینچ بلندا بود: کلید طلایی کوچک را در قفل امتحان کرد، و به شادیِ بزرگش جور شد! آلیس در را باز کرد و دید که به راهروی کوچکی منتهی می‌شود، نه خیلی بزرگ‌تر از سوراخ موش: زانو زد و به راهرو نگاه کرد و زیباترین باغی را که تا به حال دیده بودید دید. چقدر آرزو می‌کرد از آن تالار تاریک بیرون برود و در میان آن بسترهای گل‌های درخشان و آن فواره‌های خنک بگردد، اما حتی نمی‌توانست سرش را از در راهرو عبور دهد. «اوه،» آلیس گفت، «کاش می‌توانستم مثل تلسکوپ جمع شوم! فکر می‌کنم می‌توانستم، اگر فقط می‌دانستم چگونه شروع کنم.» چون، می‌بینید، اخیراً چنان چیزهای عجیبِ فراوانی اتفاق افتاده بود که آلیس شروع کرده بود به فکر کردن که واقعاً چیزهای بسیار کمی غیرممکن هستند.',
      },
    ],
  },
  {
    slug: 'tale-of-two-cities',
    title: 'A Tale of Two Cities',
    author: 'Charles Dickens',
    description:
      'Set in London and Paris before and during the French Revolution, this novel depicts the plight of the French peasantry and the brutality of the revolutionaries.',
    coverFrom: '#7c2d12',
    coverTo: '#1c1917',
    coverAccent: '#fbbf24',
    genres: ['Historical', 'Classic', 'Drama'],
    level: 'B2',
    rating: 4.5,
    reviewCount: 968,
    viewCount: 11230,
    isPremium: false,
    publishedYear: 1859,
    pages: [
      {
        type: 'heading',
        english: 'Book the First — Recalled to Life',
        farsi: 'کتابِ نخست — بازخوانده به زندگی',
      },
      {
        english:
          'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness.',
        farsi:
          'آن بهترینِ دوران‌ها بود، آن بدترینِ دوران‌ها بود؛ آن عصرِ خرد بود، آن عصرِ خفت بود؛ آن عصرِ باور بود، آن عصرِ بی‌باوری بود؛ آن فصلِ نور بود، آن فصلِ تاریکی بود.',
      },
      {
        english:
          'It was the spring of hope, it was the winter of despair, we had everything before us, we had nothing before us, we were all going direct to Heaven, we were all going direct the other way.',
        farsi:
          'آن بهارِ امید بود، آن زمستانِ ناامیدی بود؛ همه‌چیز را در پیشِ خود داشتیم، هیچ‌چیز را در پیشِ خود نداشتیم؛ همگی مستقیم به سوی بهشت می‌رفتیم، همگی مستقیم به سوی راهی دیگر می‌رفتیم.',
      },
      {
        english:
          'In short, the period was so far like the present period, that some of its noisiest authorities insisted on its being received, for good or for evil, in the superlative degree of comparison only.',
        farsi:
          'به‌اختصار، آن دوران تا آن‌حد به دورانِ کنونی شباهت داشت که برخی از پرسر‌وصداترین مراجع اصرار داشتند آن را، چه به خیر و چه به شر، تنها با درجۀ عالیِ مقایسه بپذیرند.',
      },
      {
        english:
          'There were a king with a large jaw and a queen with a plain face, on the throne of England; there were a king with a large jaw and a queen with a fair face, on the throne of France.',
        farsi:
          'پادشاهی با فکّی بزرگ و ملکه‌ای با چهره‌ای ساده بر تختِ پادشاهیِ انگلستان بود؛ پادشاهی با فکّی بزرگ و ملکه‌ای با چهره‌ای زیبا بر تختِ پادشاهیِ فرانسه بود.',
      },
    ],
  },
  {
    slug: 'pride-and-prejudice',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    description:
      'The story follows Elizabeth Bennet as she navigates issues of manners, upbringing, morality, and marriage in the society of the landed gentry of the British Regency.',
    coverFrom: '#831843',
    coverTo: '#4c0519',
    coverAccent: '#fbcfe8',
    genres: ['Romance', 'Classic', 'Drama'],
    level: 'B2',
    rating: 4.8,
    reviewCount: 2104,
    viewCount: 19870,
    isPremium: false,
    publishedYear: 1813,
    pages: [
      {
        type: 'heading',
        english: 'Chapter 1',
        farsi: 'فصلِ نخست',
      },
      {
        english:
          'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
        farsi:
          'حقیقتی است که همه آن را می‌پذیرند: مردی مجرد که ثروتِ خوبی دارد، بی‌گمان در آرزوی همسری است.',
      },
      {
        english:
          'However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.',
        farsi:
          'هرچند احساس‌ها و دیدگاه‌های چنین مردی هنگامِ نخستین ورودش به یک محله چندان شناخته نباشد، این حقیقت آن‌قدر در ذهنِ خانواده‌های اطراف ریشه دارد که او را مالِ مشروعِ یکی از دخترانشان می‌دانند.',
      },
      {
        english:
          '"My dear Mr. Bennet," said his lady to him one day, "have you heard that Netherfield Park is let at last?" Mr. Bennet replied that he had not.',
        farsi:
          '«آقای بِنِتِ عزیزم» روزی همسرش به او گفت، «شنیده‌ای که ندرفیلد پارک بالاخره اجاره داده شده؟» آقای بِنِت پاسخ داد که نه.',
      },
      {
        english:
          '"But it is," returned she; "for Mrs. Long has just been here, and she told me all about it." Mr. Bennet made no answer.',
        farsi:
          '«ولی شده» او بازگفت؛ «چون خانم لانگ تازه اینجا بود و همه‌چیز را برایم تعریف کرد.» آقای بِنِت پاسخی نداد.',
      },
    ],
  },
  {
    slug: 'sherlock-holmes-scandal',
    title: 'A Scandal in Bohemia',
    author: 'Arthur Conan Doyle',
    description:
      'Sherlock Holmes is hired by the King of Bohemia to retrieve a compromising photograph from Irene Adler, the only woman to ever outwit him.',
    coverFrom: '#1e293b',
    coverTo: '#0f172a',
    coverAccent: '#94a3b8',
    genres: ['Mystery', 'Classic', 'Detective'],
    level: 'B2',
    rating: 4.6,
    reviewCount: 845,
    viewCount: 9870,
    isPremium: false,
    publishedYear: 1891,
    pages: [
      {
        type: 'heading',
        english: 'I. To Sherlock Holmes she is always THE woman',
        farsi: '۱. برای شرلوک هولمز او همیشه «آن زن» است',
      },
      {
        english:
          'To Sherlock Holmes she is always the woman. I have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex.',
        farsi:
          'برای شرلوک هولمز او همیشه «آن زن» است. کمتر شنیده‌ام که او را با نامی دیگر یاد کند. در نگاهِ او، او بر تمامِ زنانِ جنسِ خود برتری و برتری می‌یابد.',
      },
      {
        english:
          'It was not that he felt any emotion akin to love for Irene Adler. All emotions were abhorrent to his cold, precise but admirably balanced mind.',
        farsi:
          'از این جهت نبود که او احساسی نزدیک به عشق نسبت به آیرن آدلر داشت. همه‌ی احساس‌ها برای ذهنِ سرد، دقیق، اما به‌طرزِ شگفت‌انگیزی متعادلِ او ناپسند بود.',
      },
      {
        english:
          'He was, I take it, the most perfect reasoning and observing machine that the world has seen, but as a lover he would have placed himself in a false position.',
        farsi:
          'او، به گمانِ من، کامل‌ترین ماشینِ استدلال و مشاهده‌ای بود که جهان دیده است، اما به‌عنوانِ یک عاشق خود را در موضعی نادرست می‌نهاد.',
      },
      {
        english:
          'Grit in a sensitive instrument, or a crack in one of his own high-power lenses, would not be more disturbing than a strong emotion in a nature such as his.',
        farsi:
          'ذره‌ای شن در دستگاهی حساس، یا ترکی در یکی از عدسی‌های پرقدرتِ خودش، بیشتر از یک احساسِ قوی در سرشتی چون سرشتِ او آشفته‌کننده نبود.',
      },
    ],
  },
  {
    slug: 'treasure-island',
    title: 'Treasure Island',
    author: 'Robert Louis Stevenson',
    description:
      'A tale of pirates, buried treasure, and adventure on the high seas, narrated by young Jim Hawkins, whose life is changed by the arrival of a mysterious old sailor.',
    coverFrom: '#0c4a6e',
    coverTo: '#082f49',
    coverAccent: '#38bdf8',
    genres: ['Adventure', 'Classic', 'Young Adult'],
    level: 'B1',
    rating: 4.4,
    reviewCount: 712,
    viewCount: 8430,
    isPremium: false,
    publishedYear: 1883,
    pages: [
      {
        type: 'heading',
        english: 'Part One — The Old Buccaneer',
        farsi: 'بخشِ یکم — دزدِ دریاییِ پیر',
      },
      {
        english:
          'Squire Trelawney, Dr. Livesey, and the rest of these gentlemen having asked me to write down the whole particulars about Treasure Island, from the beginning to the end, keeping nothing back but the bearings of the island, and that only because there is still treasure not yet lifted.',
        farsi:
          'اسکوایر تِرِلاونی، دکتر لایوسی و بقیه‌ی اینان از من خواستند که تمامِ جزئیاتِ ماجرا را درباره‌ی جزیره‌ی گنج، از آغاز تا پایان، بنویسم و چیزی را فرونگذارم، جز موقعیتِ جزیره، و آن هم فقط به این سبب که هنوز گنجی است که برنداشته‌اند.',
      },
      {
        english:
          'I take up my pen in the year of grace 17—, and go back to the time when my father kept the Admiral Benbow inn and the brown old seaman with the sabre cut first took up his lodging under our roof.',
        farsi:
          'قلم به دست می‌گیرم در سالِ فضلِ ۱۷—، و به آن زمان بازمی‌گردم که پدرم مهمان‌خانه‌ی «آدمیرال بن‌بو» را نگه می‌داشت و آن ملوانِ پیرِ سمرنگ با زخمِ شمشیر نخستین‌بار زیرِ سقفِ ما منزل گرفت.',
      },
      {
        english:
          'I remember him as if it were yesterday, as he came plodding to the inn door, his sea-chest following behind him in a hand-barrow; a tall, strong, heavy, nut-brown man.',
        farsi:
          'او را چنان به یاد دارم که گویی دیروز بود؛ چون با قدم‌هایی سنگین به درِ مهمان‌خانه آمد، و صندوقِ دریایی‌اش در یک دست‌چرخِ دستی پشتِ سرش می‌آمد؛ مردی بلندقامت، نیرومند، سنگین و سمرنگ.',
      },
      {
        english:
          'His tarry pigtail falling over the shoulders of his soiled blue coat; his hands ragged and scarred, with black, broken nails; and the sabre cut across one cheek, a dirty, livid white.',
        farsi:
          'گیسویِ قیراندودش بر شانه‌های کتِ آبیِ کثیفش می‌افتاد؛ دست‌هایش پینه‌بسته و زخمی بود، با ناخن‌های سیاهِ شکسته؛ و زخمِ شمشیر بر یک گونه، کثیف و به رنگِ سفیدِ مایل به کبودی.',
      },
    ],
  },
  {
    slug: 'call-of-the-wild',
    title: 'The Call of the Wild',
    author: 'Jack London',
    description:
      'Buck, a domesticated dog, is stolen from his home and sold into the brutal life of a sled dog in the Yukon during the Klondike Gold Rush.',
    coverFrom: '#422006',
    coverTo: '#1c1917',
    coverAccent: '#f59e0b',
    genres: ['Adventure', 'Classic', 'Nature'],
    level: 'B1',
    rating: 4.5,
    reviewCount: 690,
    viewCount: 7210,
    isPremium: true,
    publishedYear: 1903,
    pages: [
      {
        type: 'heading',
        english: 'Chapter 1 — Into the Primitive',
        farsi: 'فصلِ نخست — به درونِ بدوی',
      },
      {
        english:
          'Buck did not read the newspapers, or he would have known that trouble was brewing, not alone for himself, but for every tidewater dog, strong of muscle and with warm, long hair, from Puget Sound to San Diego.',
        farsi:
          'باک روزنامه نمی‌خواند، وگرنه می‌دانست که دردسر در راه است، نه فقط برای خودش، بلکه برای هر سگِ کنارِ دریای مدّ و جزر، با عضلاتی قوی و مویی بلند و گرم، از پاوجِت ساند تا سن‌دی‌یگو.',
      },
      {
        english:
          'Because men, groping in the Arctic darkness, had found a yellow metal, and because steamship and transportation companies were booming the find, thousands of men were rushing into the Northland.',
        farsi:
          'چون مردان، در تاریکیِ قطبیِ در جست‌وجو، فلزِ زردی یافته بودند، و چون شرکت‌های کشتی و حمل‌ونقل این کشف را تبلیغ می‌کردند، هزاران مرد به سرزمینِ شمال هجوم می‌بردند.',
      },
      {
        english:
          'These men wanted dogs, and the dogs they wanted were heavy dogs, with strong muscles by which to toil, and furry coats to protect them from the frost.',
        farsi:
          'این مردان سگ می‌خواستند، و سگ‌هایی که می‌خواستند سگ‌های سنگین بودند، با عضلاتی قوی برای کشیدنِ بار، و پوششی پشمی برای نگه‌داشتنِ آنان از سرما.',
      },
      {
        english:
          'Buck lived at a big house in the sun-kissed Santa Clara Valley. Judge Miller\'s place, it was called. It stood back from the road, half hidden among the trees.',
        farsi:
          'باک در خانه‌ای بزرگ در دره‌ی آفتاب‌گرفته‌ی سانتا کلارا زندگی می‌کرد. محلِ قاضی میلر نامیده می‌شد. از جاده فاصله داشت، نیمه‌پنهان میانِ درختان.',
      },
    ],
  },
  {
    slug: 'wizard-of-oz',
    title: 'The Wonderful Wizard of Oz',
    author: 'L. Frank Baum',
    description:
      'Dorothy is swept away by a cyclone to the magical Land of Oz, where she befriends a Scarecrow, a Tin Woodman, and a Cowardly Lion on a quest to find her way home.',
    coverFrom: '#166534',
    coverTo: '#052e16',
    coverAccent: '#4ade80',
    genres: ['Fantasy', 'Classic', 'Children'],
    level: 'A2',
    rating: 4.6,
    reviewCount: 1120,
    viewCount: 13450,
    isPremium: false,
    publishedYear: 1900,
    pages: [
      {
        type: 'heading',
        english: 'Chapter 1 — The Cyclone',
        farsi: 'فصلِ نخست — گردباد',
      },
      {
        english:
          'Dorothy lived in the midst of the great Kansas prairies, with Uncle Henry, who was a farmer, and Aunt Em, who was the farmer\'s wife. Their house was small, for the lumber to build it had to be hauled by wagon many miles.',
        farsi:
          'دوروتی در میانِ دشت‌های بزرگِ کانزاس زندگی می‌کرد، با عمو هنری که کشاورز بود، و عمه اِم که همسرِ کشاورز بود. خانه‌شان کوچک بود، چون چوبِ ساختنِ آن باید با ارابه‌ای چندها مایل آورده می‌شد.',
      },
      {
        english:
          'There were four walls, a floor and a roof, which made one room; and this room contained a rusty looking cooking stove, a cupboard for the dishes, a table, three or four chairs, and the beds.',
        farsi:
          'چهار دیوار، یک کف و یک سقف بود، که یک اتاق می‌ساخت؛ و این اتاق دربردارنده‌ی یک اجاقِ پخت‌وپزِ زنگ‌زده، یک کابینت برای ظرف‌ها، یک میز، سه‌چهار صندلی، و تخت‌ها بود.',
      },
      {
        english:
          'When Dorothy stood in the doorway and looked around, she could see nothing but the great gray prairie on every side. Not a tree nor a house broke the broad sweep of flat country that reached the edge of the sky in all directions.',
        farsi:
          'وقتی دوروتی در چهارچوبِ در ایستاد و به اطراف نگاه کرد، جز دشتِ بزرگِ خاکستری از هر سو چیزی نمی‌دید. نه درختی نه خانه‌ای گستره‌ی پهناورِ سرزمینِ هموار را که از هر جهت به لبه‌ی آسمان می‌رسید نمی‌شکست.',
      },
      {
        english:
          'It was reached by a strange and sudden cyclone that carried the house, with Dorothy inside it, high into the air and away to the marvelous Land of Oz.',
        farsi:
          'این سرزمین با گردبادی عجیب و ناگهانی در دسترس قرار گرفت که خانه را، با دوروتی در درونش، به بالا در هوا برد و به سرزمینِ شگفت‌انگیزِ اُز برد.',
      },
    ],
  },
  {
    slug: 'anne-of-green-gables',
    title: 'Anne of Green Gables',
    author: 'L. M. Montgomery',
    description:
      'Anne Shirley, an imaginative orphan girl, is mistakenly sent to live with two middle-aged siblings on Prince Edward Island, and transforms their lives with her spirit.',
    coverFrom: '#9d174d',
    coverTo: '#500724',
    coverAccent: '#f9a8d4',
    genres: ['Classic', 'Coming of Age', 'Drama'],
    level: 'B1',
    rating: 4.7,
    reviewCount: 1530,
    viewCount: 14210,
    isPremium: false,
    publishedYear: 1908,
    pages: [
      {
        type: 'heading',
        english: 'Chapter 1 — Mrs. Rachel Lynde is Surprised',
        farsi: 'فصلِ نخست — خانم ریچل لیند غافلگیر می‌شود',
      },
      {
        english:
          'Mrs. Rachel Lynde lived just where the Avonlea main road dipped down into a little hollow, fringed with alders and ladies\' eardrops, and traversed by a brook.',
        farsi:
          'خانم ریچل لیند دقیقاً آنجا زندگی می‌کرد که جاده‌ی اصلیِ آون‌لیا به یک فرورفتگیِ کوچک پایین می‌رفت، که با بیدِ سمر و گلِ گوشواره‌ی بانوان حاشیه شده بود، و نهرِ کوچکی از آن می‌گذشت.',
      },
      {
        english:
          'By the time Mrs. Rachel had gotten as far as the foot of the hollow, she was out of breath, for she was not given to walking except to go to meetings.',
        farsi:
          'تا زمانی که خانم ریچل به پایینِ فرورفتگی رسید، نفس‌نفس می‌زد، چون او به راه‌رفتن عادت نداشت مگر برای رفتن به جلسات.',
      },
      {
        english:
          'She was a notoriety for asking questions, and she prided herself on always speaking her mind. She was a handy woman, and had a genius for managing things.',
        farsi:
          'او به پرسیدنِ سؤال بدنام بود، و بر این می‌نازید که همیشه هرچه در دل دارد بگوید. زنی کارکُن بود، و استعدادی برای چیدنِ کارها داشت.',
      },
      {
        english:
          'Matthew Cuthbert ought to be sowing his late turnip seed on the big red brook field away over by Green Gables. Mrs. Rachel pondered the reason for his unusual journey.',
        farsi:
          'متیو کاتبِرت باید تخمِ شلغمِ دیرکاشتِ خود را در زمینِ بزرگِ سرخِ کنارِ نهر، آن‌ورِ گرین گیبلز می‌کاشت. خانم ریچل بر دلیلِ سفرِ غیرعادیِ او اندیشید.',
      },
    ],
  },
  {
    slug: 'secret-garden',
    title: 'The Secret Garden',
    author: 'Frances Hodgson Burnett',
    description:
      'Mary Lennox, a spoiled and unloved girl, discovers a neglected garden and, through nurturing it back to life, heals herself and those around her.',
    coverFrom: '#14532d',
    coverTo: '#052e16',
    coverAccent: '#86efac',
    genres: ['Classic', 'Children', 'Drama'],
    level: 'B1',
    rating: 4.5,
    reviewCount: 880,
    viewCount: 9100,
    isPremium: false,
    publishedYear: 1911,
    pages: [
      {
        type: 'heading',
        english: 'Chapter 1 — There is No One Left',
        farsi: 'فصلِ نخست — کسی نمانده',
      },
      {
        english:
          'When Mary Lennox was sent to Misselthwaite Manor to live with her uncle, everybody said she was the most disagreeable-looking child ever seen.',
        farsi:
          'وقتی مری لِنوکس را به عمارتِ میسِلث‌ویت فرستادند تا با عمویش زندگی کند، همه گفتند که او بدترین‌منظره‌ترین کودکی است که تا به حال دیده شده.',
      },
      {
        english:
          'It was true, too. Her face was yellow, because she had been born in India and had always been ill in one way or another. Her hair was yellow, and her face was yellow, and she was as thin as a reed.',
        farsi:
          'این هم راست بود. چهره‌اش زرد بود، چون در هند به دنیا آمده بود و همیشه به شکلی بیمار بود. موهایش زرد بود، و چهره‌اش زرد، و به باریکیِ نی باریک بود.',
      },
      {
        english:
          'Her father had held a position under the English Government and had always been busy and ill himself. Her mother had been a great beauty who cared only to go to parties.',
        farsi:
          'پدرش تحتِ دولتِ انگلیسی مقامی داشت و همیشه سرگرم و خود بیمار بود. مادرش زنی بسیار زیبا بود که تنها به رفتن به مهمانی‌ها اهمیت می‌داد.',
      },
      {
        english:
          'When a cholera epidemic killed both her parents, Mary was forgotten entirely, until soldiers found her alone in the empty bungalow.',
        farsi:
          'وقتی وبا پدر و مادرش را کشت، مری کاملاً فراموش شد، تا آنکه سربازان او را تنها در بنگالویِ خالی یافتند.',
      },
    ],
  },
  {
    slug: 'peter-pan',
    title: 'Peter Pan',
    author: 'J. M. Barrie',
    description:
      'The mischievous boy who refuses to grow up whisks Wendy and her brothers away to Neverland, a world of pirates, fairies, and endless adventure.',
    coverFrom: '#155e75',
    coverTo: '#083344',
    coverAccent: '#67e8f9',
    genres: ['Fantasy', 'Classic', 'Children'],
    level: 'B1',
    rating: 4.4,
    reviewCount: 760,
    viewCount: 8800,
    isPremium: false,
    publishedYear: 1911,
    pages: [
      {
        type: 'heading',
        english: 'Chapter 1 — Peter Breaks Through',
        farsi: 'فصلِ نخست — پیتر از میان می‌شکافد',
      },
      {
        english:
          'All children, except one, grow up. They soon know that they will grow up, and the way Wendy knew was this: one day when she was two years old she was playing in a garden.',
        farsi:
          'همه‌ی کودکان، جز یکی، بزرگ می‌شوند. آن‌ها به‌زودی می‌فهمند که بزرگ خواهند شد، و شیوه‌ای که وندی فهمید این بود: روزی که دو ساله بود در باغچه‌ای بازی می‌کرد.',
      },
      {
        english:
          'She plucked another flower and ran with it to her mother. I suppose she must have looked rather delightful, for Mrs. Darling put her hand to her heart and cried, "Oh, why can\'t you remain like this for ever!"',
        farsi:
          'گلِ دیگری چید و با آن به سوی مادرش دوید. گمان می‌کنم باید چنان دل‌انگیز می‌نمود، چون خانم دارلینگ دست بر دل نهاد و فریاد زد: «آه، چرا نمی‌توانی برای همیشه چنین بمانی!»',
      },
      {
        english:
          'Of all delectable islands the Neverland is the snuggest and most compact; not large and sprawly, you know, with tedious distances between one place and another.',
        farsi:
          'در میانِ همه‌ی جزیره‌های دل‌انگیز، نِوِرلَند جاآرام‌ترین و فشرده‌ترین است؛ نه بزرگ و پهن، می‌دانی، با فاصله‌های خسته‌کننده‌ای میانِ یک مکان و دیگری.',
      },
      {
        english:
          'It would not be fair to say that Mr. Darling was a coward. He was a man who had been to school, and knew what other men knew, and that was everything.',
        farsi:
          'اینکه بگوییم آقای دارلینگ ترسو بود، عادلانه نیست. او مردی بود که به مدرسه رفته بود، و می‌دانست آنچه دیگر مردان می‌دانستند، و آن همه‌چیز بود.',
      },
    ],
  },
  {
    slug: 'moby-dick',
    title: 'Moby-Dick',
    author: 'Herman Melville',
    description:
      'Ishmael recounts the obsessive voyage of the whaling ship Pequod, led by Captain Ahab in his vengeful pursuit of the legendary white whale.',
    coverFrom: '#1e3a8a',
    coverTo: '#172554',
    coverAccent: '#93c5fd',
    genres: ['Classic', 'Adventure', 'Literary'],
    level: 'C1',
    rating: 4.2,
    reviewCount: 540,
    viewCount: 6200,
    isPremium: true,
    publishedYear: 1851,
    pages: [
      {
        type: 'heading',
        english: 'Chapter 1 — Loomings',
        farsi: 'فصلِ نخست — نمودها',
      },
      {
        english:
          'Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.',
        farsi:
          'مرا اسماعیل خطاب کنید. چند سال پیش — طولانی‌اش را درست نمی‌دانم — چون پولِ کم یا هیچ‌چیز در کیفم نداشتم، و چیزی خاص در ساحل مرا نمی‌خواند، اندیشیدم کمی دریانوردی کنم و بخشِ آبیِ جهان را ببینم.',
      },
      {
        english:
          'It is a way I have of driving off the spleen and regulating the circulation. Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul;',
        farsi:
          'این شیوه‌ای است که با آن ملال را می‌رانم و گردشِ خون را تنظیم می‌کنم. هرگاه می‌بینم دورِ دهانم گرفته می‌شود؛ هرگاه در جانم نوامبری نمور و بارانی است؛',
      },
      {
        english:
          'whenever I find myself involuntarily pausing before coffin warehouses, and bringing up the rear of every funeral I meet; then, I account it high time to get to sea as soon as I can.',
        farsi:
          'هرگاه بی‌اراده پیشِ انبارهای تابوت درمی‌ایستم، و در پشتِ هر تشییعِ جنازه‌ای که می‌بینم جای می‌گیرم؛ آن‌گاه، به باورِ من وقتِ آن است که هرچه زودتر به دریا بزنم.',
      },
      {
        english:
          'This is my substitute for pistol and ball. With a philosophical flourish Cato throws himself upon his sword; I quietly take to the ship.',
        farsi:
          'این جایگزینِ من برای تپانچه و گلوله است. کاتو با اظهاری فلسفی خود را بر شمشیر می‌اندازد؛ من آرام به کشتی پناه می‌برم.',
      },
    ],
  },
  {
    slug: 'the-yellow-wallpaper',
    title: 'The Yellow Wallpaper',
    author: 'Charlotte Perkins Gilman',
    description:
      'A woman confined to a room by her physician husband descends into obsession with the room\'s wallpaper, in this seminal feminist short novel.',
    coverFrom: '#a16207',
    coverTo: '#422006',
    coverAccent: '#fde047',
    genres: ['Literary', 'Classic', 'Psychological'],
    level: 'B2',
    rating: 4.5,
    reviewCount: 430,
    viewCount: 5100,
    isPremium: false,
    publishedYear: 1892,
    pages: [
      {
        type: 'heading',
        english: 'The Yellow Wallpaper',
        farsi: 'کاغذِ دیواریِ زرد',
      },
      {
        english:
          'It is very seldom that mere ordinary people like John and myself secure ancestral halls for the summer. A colonial mansion, a hereditary estate, I would say a haunted house.',
        farsi:
          'بسیار کم پیش می‌آید که مردمِ معمولیِ چون جان و من تالارهای نیاکانی برای تابستان به دست می‌آورند. عمارتی استعماری، ملکی ارثی، من آن را خانه‌ای تسخیرشده می‌نامم.',
      },
      {
        english:
          'John laughs at me, of course, but one expects that in marriage. John is practical in the extreme. He has no patience with faith, an intense horror of superstition.',
        farsi:
          'جان البته بر من می‌خندد، اما کسی در ازدواج این را انتظار دارد. جان بسیار عمل‌گراست. با ایمان صبری ندارد، و از خرافات به شدت وحشت دارد.',
      },
      {
        english:
          'I am absolutely forbidden to "work" until I am well again. So I will let it alone and talk to my diary, for no one else will listen.',
        farsi:
          'تا زمانی که دوباره خوب شوم، مطلقاً ممنوع شده «کار» کنم. پس آن را وا می‌گذارم و با دفترِ روزانه‌ام سخن می‌گویم، چون هیچ‌کس دیگر گوش نمی‌دهد.',
      },
      {
        english:
          'The color is repellent, almost revolting; a smouldering unclean yellow, strangely faded by the slow-turning sunlight. It is a dull yet lurid orange in some places, a sickly sulphur tint in others.',
        farsi:
          'رنگ دافع‌کننده است، تقریباً حالت‌آور؛ زردی دودآلود و ناپاکی که به‌طرزِ عجیبی با نورِ آرام‌چرخانِ خورشید کم‌رنگ شده. جایی نارنجی‌ای مات اما وحشتناک است، جایی به رنگِ گوگردِ بیمارگونه.',
      },
    ],
  },
  {
    slug: 'the-little-prince',
    title: 'The Little Prince',
    author: 'Antoine de Saint-Exupéry',
    description:
      'A pilot stranded in the desert meets a young prince who has traveled to Earth from a tiny asteroid. A poetic tale about friendship, love, and what truly matters in life.',
    coverFrom: '#1e40af',
    coverTo: '#1e3a8a',
    coverAccent: '#fde047',
    genres: ['Fantasy', 'Classic', 'Children'],
    level: 'B1',
    rating: 4.8,
    reviewCount: 1850,
    viewCount: 16700,
    isPremium: false,
    publishedYear: 1943,
    pages: [
      {
        type: 'heading',
        english: 'Chapter 1 — The Drawing of the Boa Constrictor',
        farsi: 'فصلِ نخست — نقاشیِ مارِ بوا',
      },
      {
        english:
          'Once when I was six years old I saw a magnificent picture in a book, called True Stories from Nature, about the primeval forest. It was a picture of a boa constrictor in the act of swallowing an animal.',
        farsi:
          'وقتی شش‌ساله بودم، در کتابی به نام «داستان‌های واقعی از طبیعت» درباره‌ی جنگلِ کهن، تصویری باشکوه دیدم. تصویری بود از مارِ بوا در حالِ بلعیدنِ یک حیوان.',
      },
      {
        english:
          'In the book it said: "Boa constrictors swallow their prey whole, without chewing it. After that they are not able to move, and they sleep through the six months that they need for digestion."',
        farsi:
          'در کتاب نوشته بود: «مارهای بوا طعمه‌ی خود را کامل و بدون جویدن می‌بلعند. پس از آن نمی‌توانند حرکت کنند و شش ماهی که برای هضم لازم دارند را به خواب می‌گذراند.»',
      },
      {
        english:
          'I pondered deeply, then, over the adventures of the jungle. And after some work with a colored pencil I succeeded in making my first drawing. I showed my masterpiece to the grown-ups, and asked them whether the drawing frightened them.',
        farsi:
          'سپس عمیقاً درباره‌ی ماجراهای جنگل اندیشیدم. و پس از کمی کار با مدادِ رنگی، موفق شدم اولین نقاشی‌ام را بکشم. شاهکارم را به بزرگ‌ترها نشان دادم و پرسیدم آیا از نقاشی می‌ترسند.',
      },
      {
        english:
          'But they answered: "Frighten? Why should anyone be frightened by a hat?" My drawing was not a picture of a hat. It was a picture of a boa constrictor digesting an elephant.',
        farsi:
          'اما پاسخ دادند: «بترسیم؟ چرا کسی باید از یک کلاه بترسد؟» نقاشیِ من تصویرِ کلاه نبود. تصویرِ مارِ بویی بود که در حالِ هضمِ یک فیل بود.',
      },
      {
        english:
          'I have spent lots of time with grown-ups. I have seen them intimately, close at hand. And that hasn\'t much improved my opinion of them. Grown-ups never understand anything by themselves.',
        farsi:
          'وقتِ زیادی را با بزرگ‌ترها گذرانده‌ام. آن‌ها را از نزدیک و با دقت دیده‌ام. و این چندان نظرم را درباره‌شان بهتر نکرده. بزرگ‌ترها هرگز چیزی را خودشان نمی‌فهمند.',
      },
    ],
  },
  {
    slug: 'frankenstein',
    title: 'Frankenstein',
    author: 'Mary Shelley',
    description:
      'A young scientist creates a sapient creature in an unorthodox scientific experiment. A foundational work of Gothic science fiction exploring ambition, responsibility, and what makes us human.',
    coverFrom: '#064e3b',
    coverTo: '#022c22',
    coverAccent: '#10b981',
    genres: ['Classic', 'Drama', 'Psychological'],
    level: 'B2',
    rating: 4.4,
    reviewCount: 920,
    viewCount: 8900,
    isPremium: false,
    publishedYear: 1818,
    pages: [
      {
        type: 'heading',
        english: 'Letter 1 — To Mrs. Saville, England',
        farsi: 'نامه‌ی ۱ — به خانم ساویل، انگلستان',
      },
      {
        english:
          'You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings. I arrived here yesterday, and my first task is to assure my dear sister of my welfare.',
        farsi:
          'خوشحال خواهی شد که بشنوی هیچ فاجعه‌ای همراهِ آغازِ این کاری که تو با این پیش‌بینی‌های شوم نگریسته بودی رخ نداده. دیروز به اینجا رسیدم و نخستین وظیفه‌ام اطمینان دادن به خواهرِ عزیزم درباره‌ی سلامتی‌ام است.',
      },
      {
        english:
          'I am already far north of London, and as I walk in the streets of Petersburgh, I feel a cold northern breeze play upon my cheeks, which braces my nerves and fills me with delight.',
        farsi:
          'من اکنون بسیار شمالِ لندن هستم، و چون در خیابان‌های پترزبورگ قدم می‌زنم، نسیمِ سردِ شمالی را حس می‌کنم که بر گونه‌هایم می‌وزد، عصب‌هایم را قوی می‌کند و از لذت پر می‌کند.',
      },
      {
        english:
          'This breeze, which has travelled from the regions towards which I am advancing, gives me a foretaste of those icy climes. Inspirited by this wind of promise, my daydreams become more fervent and vivid.',
        farsi:
          'این نسیم که از سرزمین‌هایی که به سوی آن‌ها پیش می‌روم آمده، مزه‌ای پیش از موعد از آن آب‌و‌هوای یخی به من می‌دهد. از این بادِ پر از وعده الهام می‌گیرم و رویاهای بیدارم پرشورتر و زنده‌تر می‌شوند.',
      },
      {
        english:
          'I try in vain to be persuaded that the pole is the seat of frost and desolation; it ever presents itself to my imagination as the region of beauty and delight. There, Margaret, the sun is forever visible.',
        farsi:
          'بیهوده می‌کوشم که قانع شوم قطب جایگاهِ سرما و ویرانی است؛ در تخیلِ من همیشه به‌عنوان سرزمینِ زیبایی و لذت نمایان می‌شود. آنجا، مارگارت، خورشید همیشه دیده می‌شود.',
      },
    ],
  },
  {
    slug: 'black-beauty',
    title: 'Black Beauty',
    author: 'Anna Sewell',
    description:
      'The autobiography of a horse, told from the animal\'s own perspective. A beloved classic that advocates for the humane treatment of horses and all animals.',
    coverFrom: '#1c1917',
    coverTo: '#0c0a09',
    coverAccent: '#a8a29e',
    genres: ['Classic', 'Children', 'Nature'],
    level: 'B1',
    rating: 4.5,
    reviewCount: 670,
    viewCount: 6400,
    isPremium: false,
    publishedYear: 1877,
    pages: [
      {
        type: 'heading',
        english: 'Part 1 — My Early Home',
        farsi: 'بخشِ یکم — خانه‌ی نخستینِ من',
      },
      {
        english:
          'The first place that I can well remember was a large pleasant meadow with a pond of clear water in it. Some shady trees leaned over it, and rushes and water-lilies grew at the deep end.',
        farsi:
          'اولین جایی که به‌خوبی به یاد دارم مرتعی بزرگ و خوشایند بود با برکه‌ای از آبِ زلال در آن. چند درختِ سایه‌دار بر آن خمیده بودند، و نیلوفرآبی و نی در انتهایِ عمیق می‌رویید.',
      },
      {
        english:
          'Over the hedge on one side we looked into a plowed field, and on the other we looked over a gate at our master\'s house, which stood by the roadside. At the top of the meadow, in a corner, was a plantation of fir trees.',
        farsi:
          'از پشتِ یکی از حصارها به یک زمینِ شخم‌خورده می‌نگاهیدیم، و از سوی دیگر از پشتِ دری به خانه‌ی اربابِمان می‌نگاهیدیم که کنارِ جاده بود. در بالایِ مرتع، در گوشه‌ای، کشتزارِ درختانِ نر بود.',
      },
      {
        english:
          'When I was young I used to graze on the meadow, and drink at the pond. As I grew older, I began to play with the other colts in the field. We used to gallop together round and round, and have a great deal of fun.',
        farsi:
          'وقتی جوان بودم در مرتع می‌چرییدم و از برکه می‌نوشیدم. چون بزرگ‌تر شدم، با بچه‌اسب‌های دیگر در زمین بازی می‌کردم. با هم دور و دور می‌تاختیم و بسیار می‌خندیدیم.',
      },
      {
        english:
          'My mother was very fond of me, and I was very fond of her. She used to call me "Darkie." I had a dark coat, and I was the finest horse in the meadow. My master was a good man, and he was kind to us all.',
        farsi:
          'مادرم بسیار به من علاقه داشت، و من نیز بسیار به او علاقه داشتم. او مرا «تاریکی» می‌خواند. من قهوه‌ای تیره داشتم، و بهترین اسب در مرتع بودم. اربابِ من مردی نیک بود و با همه‌ی ما مهربان بود.',
      },
    ],
  },
  {
    slug: 'the-wind-in-the-willows',
    title: 'The Wind in the Willows',
    author: 'Kenneth Grahame',
    description:
      'ماجراهای دوستانه‌ی مولِ موش‌کور، موشِ آبی، گورکن و وزغِ خوش‌قلب در کرانه‌ی رودخانه و جنگلِ وحشی. داستانی گرم و صمیمی درباره‌ی دوستی، خانه و آرامشِ طبیعت.',
    coverFrom: '#4d6b3e',
    coverTo: '#2c3e26',
    coverAccent: '#e8c45a',
    genres: ['Classic', 'Children', 'Nature'],
    level: 'B1',
    rating: 4.6,
    reviewCount: 845,
    viewCount: 7800,
    isPremium: false,
    publishedYear: 1908,
    pages: [
      {
        type: 'heading',
        english: 'Chapter 1 — The River Bank',
        farsi: 'فصلِ یکم — کرانه‌ی رود',
      },
      {
        english:
          'The Mole had been working very hard all the morning, spring-cleaning his little home. First with brooms, then with dusters; then on ladders and steps and chairs, with a brush and a pail of whitewash; till he had dust in his throat and eyes, and splashes of whitewash all over his black fur, and an aching back and weary arms.',
        farsi:
          'مول تمامِ صبح بسیار سخت کار می‌کرد و خانه‌ی کوچکش را برای بهار تمیز می‌کرد. نخست با جاروها، سپس با دستمال‌های گردگیری؛ بعد روی نردبان‌ها و پله‌ها و صندلی‌ها، با قلم‌مو و سطلِ گچ، تا آن‌که گرد و خاک در گلو و چشمش نشست و قطراتِ گچ تمامِ موهای سیاهش را پوشاند و کمرش درد گرفت و بازوهایش خسته شدند.',
      },
      {
        english:
          'Spring was moving in the air above and in the earth below and around him, penetrating even his dark and lowly little house with its spirit of discontent and longing. It was small wonder, then, that he suddenly flung down his brush on the floor, said "Bother!" and "O blow!" and also "Hang spring-cleaning!" and bolted out of the house without even waiting to put on his coat.',
        farsi:
          'بهار در هوای بالا و در خاکِ پایین و اطرافش در حرکت بود، و با روحِ نارضایتی و آرزو حتی خانه‌ی تاریک و فروتنِ کوچکش را نیز فرا می‌گرفت. بنابراین شگفت نبود که ناگهان قلم‌مویش را به زمین انداخت، گفت «خفه‌شوم!» و «آه بس!» و نیز «به جهنمِ بهار-تمیزکاری!» و بی‌آنکه منتظر بماند کتش را بپوشد از خانه بیرون دوید.',
      },
      {
        english:
          'Something up above the ground was calling him imperiously, and he made for the steep little tunnel which answered in his case to the gavea-hole. So he scraped and scratched and scrabbled and scrooged, working blindly and eagerly till he popped his head out into the sunlight.',
        farsi:
          'چیزی در بالا و روی زمین با صلابت او را صدا می‌زد، و او به سویِ تونلِ تندِ کوچکی رفت که در موردِ او به جایِ سوراخِ خروج بود. پس کَند و خراش داد و چنگ زد و خود را هل داد، کورکورانه و مشتاقانه کار کرد تا آن‌که سرش را به نورِ خورشید بیرون آورد.',
      },
      {
        english:
          'He found himself rolling in the warm grass of a great meadow. "This is fine!" he said to himself. "This is better than whitewashing!" The sunshine struck hot on his fur, soft breezes caressed his heated brow, and after the seclusion of the cellarage he had lived in so long, the carol of the happy birds fell on his ears and entranced him.',
        farsi:
          'خود را یافت که در علف‌های گرمِ مرتعی بزرگ می‌غلتید. «عالیه!» با خود گفت. «این از گچ‌کاری بهتر است!» آفتابِ گرم بر خزش می‌تابید، نسیم‌های نرم بر پیشانیِ گرمش نوازش می‌کردند، و پس از انزوایِ زیرزمینی که مدتِ طولانی در آن زندگی کرده بود، آوازِ پرندگانِ خوشحال در گوشش می‌نشست و او را می‌خوشحال می‌کرد.',
      },
      {
        english:
          'Hitherto he had never seen a river. He stood quite still for a moment, watching, and presently, as the pageant went by, his eyes widened. Then, as the creature came closer, he saw it was a small brown animal with a twinkling eye and a laughing face.',
        farsi:
          'تا آن زمان هرگز رود ندیده بود. برای لحظه‌ای کاملاً بی‌حرکت ایستاد و تماشا کرد، و به‌زودی، چون آن رژه می‌گذشت، چشمانش گشاد شد. سپس، چون آن موجود نزدیک‌تر آمد، دید که جانوری کوچک قهوه‌ای است با چشمِ برقی و چهره‌ای خندان.',
      },
      {
        english:
          '"Hallo, Mole!" said the Water Rat. "Would you like to come along in my boat?" The Mole was so taken aback by this invitation that for a moment he could not speak. Then, with a great effort, he stammered, "Oh—yes—please—I would love to!"',
        farsi:
          '«سلام، مول!» موشِ آبی گفت. «دوست داری در قایقِ من بیایی؟» مول از این دعوت چنان غافلگیر شد که برای لحظه‌ای نتوانست سخن گوید. سپس، با کوششِ بسیار، با لکنت گفت: «اوه—آره—لطفاً—بسیار دوست دارم!»',
      },
    ],
  },
  {
    slug: 'the-adventures-of-tom-sawyer',
    title: 'The Adventures of Tom Sawyer',
    author: 'Mark Twain',
    description:
      'پسرِ شیطان و باهوشِ شهرِ کوچکِ سنت‌پترزبورگ در کنارِ رودخانه‌ی می‌سی‌سی‌پی، با ماجراجویی‌ها، شیطنت‌ها و کشف‌هایش. تصویری زنده و خنده‌دار از کودکی و آزادی.',
    coverFrom: '#a0623a',
    coverTo: '#5c3520',
    coverAccent: '#f5d76e',
    genres: ['Classic', 'Adventure', 'Children'],
    level: 'B1',
    rating: 4.5,
    reviewCount: 980,
    viewCount: 9100,
    isPremium: false,
    publishedYear: 1876,
    pages: [
      {
        type: 'heading',
        english: 'Chapter 1 — "TOM!"',
        farsi: 'فصلِ یکم — «تام!»',
      },
      {
        english:
          '"TOM!" No answer. "TOM!" No answer. "What\'s gone with that boy, I wonder? You TOM!" The old lady pulled her spectacles down and looked over them about the room; then she put them up and looked out under them.',
        farsi:
          '«تام!» جوابی نبود. «تام!» جوابی نبود. «نمی‌دانم آن پسر کجاست! تام!» پیرزن عینکش را پایین کشید و از روی آن در اتاق نگاه کرد؛ سپس آن را بالا گذاشت و از زیرِ آن بیرون نگاه کرد.',
      },
      {
        english:
          'She seldom or never looked through them for so small an article as a boy, for they were her state pair, the pride of her heart, and were built for "style," not service—she could have seen through a pair of stove-lids just as well.',
        farsi:
          'او کمتر یا هرگز برای چیزی به آن کوچکیِ یک پسر از میانِ آن‌ها نگاه نمی‌کرد، زیرا آن‌ها جفتِ رسمیِ او، مایه‌ی افتخارِ قلبش بودند، و برای «ظاهر» ساخته شده بودند نه برای کار—می‌توانست همان‌خوبی از میانِ دو دربِ اجاق هم ببیند.',
      },
      {
        english:
          'She looked perplexed for a moment, and then said, not fiercely, but still loud enough for the furniture to hear: "Well, I lay if I get hold of you I\'ll—" She did not finish, for by this time she was bending down and punching under the bed with the broom.',
        farsi:
          'او برای لحظه‌ای مبهوت به نظر آمد، و سپس گفت—نه با خشم، ولی به‌قدری بلند که اثاثیه هم بشنود: «خب، قسم اگر تورا بگیرم من—» جمله را تمام نکرد، زیرا در این هنگام خم شد و با جارو زیرِ تخت می‌زد.',
      },
      {
        english:
          'Then she went to the open door and stood in it and looked out among the tomato vines and "jimpson" weeds that constituted the garden. No Tom. So she lifted up her voice at an angle calculated for distance and shouted: "Y-o-u-u TOM!"',
        farsi:
          'سپس به سویِ درِ باز رفت، در آن ایستاد و میانِ درختچه‌های گوجه‌فرنگی و علف‌های هرزِ داتوره که باغچه را تشکیل می‌دادند بیرون نگاه کرد. تامی در کار نبود. پس صدایش را با زاویه‌ای که برای مسافت مناسب بود بالا برد و فریاد زد: «تااااام!»',
      },
      {
        english:
          'There was a slight noise behind her and she turned just in time to seize a small boy by the slack of his roundabout and arrest his flight. "There! I might \'a\' thought of that closet. What you been doing in there?"',
        farsi:
          'صدای کوچکی از پشتِ سرِ او آمد، و او دقیقاً به‌موقع برگشت تا پسربچه‌ای را از یقه‌ی شلِ کتِ کوتاهش بگیرد و فرارش را متوقف کند. «همین‌جا! می‌توانستم به آن کمد فکر کنم. آنجا چه می‌کردی؟»',
      },
      {
        english:
          '"Nothing." "Nothing! Look at your hands. And look at your mouth. What IS that truck?" "I don\'t know, aunt." "Well, I know. It\'s jam—that\'s what it is."',
        farsi:
          '«هیچی.» «هیچی! به دست‌هایت نگاه کن. و به دهانت نگاه کن. این چیست؟» «نمی‌دانم، خاله.» «خب، من می‌دانم. مرباست—این است که هست.»',
      },
      {
        english:
          'Tom had been snuffling and snorting for some time, but now he broke out with a sort of desperate protest: "I never did do it, aunt! I never done nothing to that jam. Sid did it, and he threw the spoon at me to make me look guilty!" But his aunt was not to be taken in so easily.',
        farsi:
          'تام مدتی بود که عطسه می‌زد و بی‌صدا گریه می‌کرد، اما اکنون با اعتراضی تقریباً ناامیدانه گفت: «هرگز نکردمش، خاله! هیچ‌وقت به آن مربا کاری نداشتم. سید کرد، و قاشق را به سوی من پرتاب کرد تا من مجرم به نظر آیم!» اما خاله‌اش آسان فریب نمی‌خورد.',
      },
    ],
  },
  {
    slug: 'the-time-machine',
    title: 'The Time Machine',
    author: 'H. G. Wells',
    description:
      'مسافرِ زمان داستانِ سفرِ شگفت‌انگیزِ خود را به سالِ هشتصد و دو هزار و هفتاد و یک می‌گوید و برخوردش با جهانِ آینده‌ی اِیلویی‌ها و مورلوک‌ها. یکی از بنیادی‌ترین آثارِ علمی‌تخیلی.',
    coverFrom: '#1e3a5f',
    coverTo: '#0f1d30',
    coverAccent: '#7fd4e8',
    genres: ['Science Fiction', 'Classic', 'Adventure'],
    level: 'B2',
    rating: 4.4,
    reviewCount: 760,
    viewCount: 7200,
    isPremium: false,
    publishedYear: 1895,
    pages: [
      {
        type: 'heading',
        english: 'Chapter 1 — The Drawing-Room',
        farsi: 'فصلِ یکم — اتاقِ پذیرایی',
      },
      {
        english:
          'The Time Traveller (for so it will be convenient to speak of him) was expounding a recondite matter to us. His grey eyes shone and twinkled, and his usually pale face was flushed and animated. The fire burned brightly, and the soft radiance of the incandescent lights in the lilies of silver caught the bubbles that flashed and passed in our glasses.',
        farsi:
          'مسافرِ زمان (که نامیدنش به این صورت مناسب‌تر است) موضوعی دشوار را برای ما شرح می‌داد. چشمانِ خاکستریش می‌درخشید و برق می‌زد، و چهره‌ی معمولاً رنگ‌پریده‌اش سرخ و پرشور بود. آتش روشن می‌سوخت، و درخششِ نرمِ چراغ‌های نورانی در شکوفه‌های نقره‌ای، حباب‌هایی را که در لیوان‌هایمان می‌درخشیدند و می‌گذشتند، می‌گرفت.',
      },
      {
        english:
          'Our chairs, being his patents, embraced and caressed us rather than submitted to be sat upon, and there was that luxurious after-dinner atmosphere when thought roams gracefully free of the trammels of precision. And he put it to us in this way—marking the points with a lean forefinger—as we sat and lazily admired his earnestness over his new idea.',
        farsi:
          'صندلی‌های ما، که اختراعِ او بودند، ما را در آغوش می‌گرفتند و نوازش می‌کردند تا آنکه بر آن‌ها بنشینیم، و آن حال‌وهوایِ مجللِ پس از شام بود که در آن فکر با وقار از بندِ دقت آزاد می‌گردد. و او با این بیان برای ما مطرح کرد—نکته‌ها را با انگشتِ باریکِ اشاره‌اش نشان می‌داد—چون ما نشسته بودیم و با تنبلیِ جدیتش را درباره‌ی ایده‌ی جدیدش تحسین می‌کردیم.',
      },
      {
        english:
          '"You must follow me carefully. I shall have to controvert one or two ideas that are almost universally accepted. The geometry, for instance, they taught you at school is founded on a misconception." "Is not that rather a large thing to expect us to begin upon?" said Filby, an argumentative person with red hair.',
        farsi:
          '«باید با دقت مرا دنبال کنید. باید یک یا دو ایده‌ای را که تقریباً به‌طور جهانی پذیرفته شده‌اند رد کنم. هندسه، مثلاً، که در مدرسه به شما آموختند بر یک سوء‌فهم بنا شده است.» «آیا انتظارِ چنین چیزِ بزرگی برای شروع کمی زیاد نیست؟» فیلبی گفت، مردی گیرنده با موهای سرخ.',
      },
      {
        english:
          '"I do not mean to ask you to accept anything without reasonable ground for it. You will soon admit as much as I need from you. You know of course that a mathematical line, a line of thickness NIL, has no real existence. They taught you that? Neither has a mathematical plane. These things are mere abstractions."',
        farsi:
          '«نمی‌خواهم از شما بخواهم چیزی را بدونِ دلیلِ معقول بپذیرید. به‌زودی به اندازه‌ای که از شما نیاز دارم اعتراف خواهید کرد. البته می‌دانید که یک خطِ ریاضی، خطی با ضخامتِ صفر، وجودِ واقعی ندارد. این را به شما آموختند؟ یک صفحه‌ی ریاضی نیز همین‌گونه است. این چیزها صرفاً انتزاع‌اند.»',
      },
      {
        english:
          '"There I object," said Filby. "Of course a solid body may exist. All real things—" "So most people think. But wait a moment. Can an instantaneous cube exist?" "Don\'t follow you," said Filby. "Can a cube that does not last for any time at all, have a real existence?" Filby became pensive.',
        farsi:
          '«اینجا مخالفت می‌کنم،» فیلبی گفت. «البته یک جسمِ جامد ممکن است وجود داشته باشد. تمامِ چیزهای واقعی—» «بیشترِ مردم این‌گونه فکر می‌کنند. ولی لحظه‌ای صبر کن. آیا یک مکعبِ لحظه‌ای می‌تواند وجود داشته باشد؟» «دنبالت نمی‌روم،» فیلبی گفت. «آیا مکعبی که اصلاً برای هیچ زمانی دوام نیاورد، می‌تواند وجودِ واقعی داشته باشد؟» فیلبی به تفکر فرو رفت.',
      },
      {
        english:
          '"Clearly," the Time Traveller proceeded, "any real body must have extension in four directions: it must have Length, Breadth, Thickness, and—Duration. But through a natural infirmity of the flesh, we incline to overlook this fact. There are really four dimensions, three which we call the three planes of Space, and a Fourth, which is Time."',
        farsi:
          '«بدیهی است،» مسافرِ زمان ادامه داد، «که هر جسمِ واقعی باید در چهار جهت امتداد داشته باشد: باید طول، عرض، ضخامت، و—دوام داشته باشد. ولی به‌واسطه‌ی ضعفی طبیعیِ جسم، متمایلیم این واقعیت را نادیده بگیریم. در واقع چهار بُعد وجود دارد، سه‌تای آن را که سه صفحه‌ی فضا می‌نامیم، و بُعدِ چهارم، که زمان است.»',
      },
    ],
  },
  {
    slug: 'the-picture-of-dorian-gray',
    title: 'The Picture of Dorian Gray',
    author: 'Oscar Wilde',
    description:
      'جوانِ زیبایِ دوریان گری آرزو می‌کند که پرتره‌اش پیر شود و خودش جوان بماند. آرزویش برآورده می‌شود و پرتره‌ی هولناک، گناهانِ او را در خود ثبت می‌کند. شاهکارِ آسکار وایلد درباره‌ی زیبایی، جوانی و تباهی.',
    coverFrom: '#3d1f4f',
    coverTo: '#1a0d22',
    coverAccent: '#c9a85c',
    genres: ['Classic', 'Drama', 'Gothic'],
    level: 'B2',
    rating: 4.6,
    reviewCount: 1120,
    viewCount: 10400,
    isPremium: false,
    publishedYear: 1890,
    pages: [
      {
        type: 'heading',
        english: 'Chapter 1 — The Studio',
        farsi: 'فصلِ یکم — کارگاهِ نقاشی',
      },
      {
        english:
          'The studio was filled with the rich odour of roses, and when the light summer wind stirred amidst the trees of the garden, there came through the open door the heavy scent of the lilac, or the more delicate perfume of the pink-flowering thorn.',
        farsi:
          'کارگاهِ نقاشی از بویِ غنیِ گل‌های رز پر بود، و چون بادِ سبکِ تابستانی میانِ درختانِ باغ می‌گشت، از درِ باز بویِ سنگینِ یاسِ بنفش، یا عطرِ ظریف‌ترِ خارِ صوره‌برگشتِ صورتی به درون می‌آمد.',
      },
      {
        english:
          'From the corner of the divan of Persian saddle-bags on which he was lying, smoking, as was his custom, innumerable cigarettes, Lord Henry Wotton could just catch the gleam of the honey-sweet and honey-coloured blossoms of a laburnum, whose tremulous branches seemed hardly able to bear the burden of a beauty so flamelike as theirs.',
        farsi:
          'از گوشه‌ی مبلِ ساخته‌شده از کیف‌های زینِ ایرانی که بر آن دراز کشیده بود و طبقِ عادتِ خود سیگارهای بی‌شماری می‌کشید، لُرد هِنری وُتون تازه می‌توانست درخششِ شکوفه‌های شهد-شیرین و شهد-رنگِ درختِ زنجیر را ببیند، که شاخه‌های لرزانش به‌سختی توانِ حملِ بارِ زیباییِ چنان شعله‌وارِ آن‌ها را داشتند.',
      },
      {
        english:
          'Now and then the fantastic shadows of birds in flight flitted across the long tussore-silk curtains at the end of the room, and gave a feeling of being in a woodland. The sullen murmur of the bees shouldering their way through the long unmown grass seemed to make the stillness more oppressive.',
        farsi:
          'گه‌گاهِ سایه‌های غریبِ پرندگانِ در پرواز از میانِ پرده‌های بلندِ ابریشمِ توسوری در انتهایِ اتاق می‌گذشتند، و حسِ بودن در یک جنگل می‌دادند. زمزمه‌ی کسل‌کننده‌ی زنبورها که از میانِ علف‌های بلندِ نداردیده‌ی بی‌داس شانه می‌زدند، به‌نظر می‌رسید سکوت را سخت‌تر کند.',
      },
      {
        english:
          'In the centre of the room, clamped to an upright easel, stood the full-length portrait of a young man of extraordinary personal beauty, and in front of it, some little distance away, sat the artist himself, Basil Hallward. The artist had turned away suddenly, and looked for a moment at his picture.',
        farsi:
          'در مرکزِ اتاق، محکم‌شده به یک سه‌پایه‌ی ایستاده، پرتره‌ی تمام‌قدِ جوانی با زیباییِ شخصیِ استثنایی قرار داشت، و در پیشِ آن، کمی فاصله، خودِ نقاش، بیزِل هالوارد نشسته بود. نقاش ناگهان رو برگرداندید و برای لحظه‌ای به تصویرش نگاه کرد.',
      },
      {
        english:
          '"It is your best work, Basil, the best thing you have ever done," said Lord Henry, languidly. "You must certainly send it next year to the Grosvenor. The Academy is too large and too vulgar. The Grosvenor is the only place for it."',
        farsi:
          '«این بهترین کارِ توست، بیزِل، بهترین چیزی که تا کنون کرده‌ای،» لُرد هِنری با سستی گفت. «باید سالِ آینده آن را حتماً به گروسونِر بفرستی. آکادمی بیش از حد بزرگ و عامیانه است. گروسونِر تنها جایِ آن است.»',
      },
      {
        english:
          '"I don\'t think I shall send it anywhere," he answered, tossing his head. "Not send it anywhere? My dear fellow, why? Have you any reason? What odd chaps you painters are! You do anything in the world to gain a reputation. As soon as you have one, you seem to want to throw it away."',
        farsi:
          '«فکر نمی‌کنم آن را به هیچ‌جا بفرستم،» او پاسخ داد و سرش را تکان داد. «به هیچ‌جا نفرستی؟ دوستِ عزیزم، چرا؟ دلیلی داری؟ چه آدم‌های عجیبی هستید شما نقاش‌ها! هر کاری در جهان می‌کنید تا آبرویی به‌دست آورید. به‌محضِ اینکه آبرو پیدا کنید، به‌نظر می‌رسید می‌خواهید آن را دور بریزید.»',
      },
    ],
  },
  {
    slug: 'robinson-crusoe',
    title: 'Robinson Crusoe',
    author: 'Daniel Defoe',
    description:
      'کشتیِ رابینسون کروزو در طوفان غرق می‌شود و او به‌تنهایی در جزیره‌ای دورافتاده به خشکی می‌رسد. داستانِ بی‌نظیرِ بقا، تنهایی، و ساختِ دوباره‌ی زندگی از صفر. یکی از نخستین رمان‌های انگلیسی.',
    coverFrom: '#1f4d4a',
    coverTo: '#0c2524',
    coverAccent: '#d9a441',
    genres: ['Classic', 'Adventure'],
    level: 'B2',
    rating: 4.3,
    reviewCount: 690,
    viewCount: 6500,
    isPremium: false,
    publishedYear: 1719,
    pages: [
      {
        type: 'heading',
        english: 'Chapter 1 — I Was Born in the Year 1632',
        farsi: 'فصلِ یکم — در سالِ ۱۶۳۲ به‌دنیا آمدم',
      },
      {
        english:
          'I was born in the year 1632, in the city of York, of a good family, though not of that country, my father being a foreigner of Bremen, who settled first at Hull. He got a good estate by merchandise, and leaving off his trade, lived afterward at York, from whence he had married my mother.',
        farsi:
          'من در سالِ ۱۶۳۲ در شهرِ یورک، در خانواده‌ای نیک، به‌دنیا آمدم، هرچند اهلِ آن دیار نبودیم، زیرا پدرم بیگانه‌ای از برمن بود که نخست در هال ساکن شد. او از راهِ بازرگانی ثروتی خوب به‌دست آورد، و پس از کنار گذاشتنِ کارِ خود، سپس در یورک زندگی کرد، و از آنجا با مادرم ازدواج کرد.',
      },
      {
        english:
          'My mother, whose relations were named Robinson, a very good family in that country, and from whom I was called Robinson Kreutznaer; but, by the usual corruption of words in England, we are now called—nay, we call ourselves and write our name—Crusoe; and so my companions always called me.',
        farsi:
          'مادرم، که خویشاوندانش نامِ خانوادگیِ رابینسون را داشتند، خانواده‌ای بسیار نیک در آن دیار بودند، و از آن‌ها من رابینسون کرویتس‌نائِر نامیده شدم؛ ولی به‌واسطه‌ی دگرگونیِ معمولِ واژه‌ها در انگلستان، اکنون نامیده می‌شویم—بلکه خودمان را می‌نامیم و ناممان را می‌نویسیم—کروزو؛ و همین‌گونه رفیقانم همیشه مرا صدا می‌زدند.',
      },
      {
        english:
          'I had two elder brothers, one of whom was lieutenant-colonel to an English regiment of foot in Flanders, formerly commanded by the famous Colonel Lockhart, and was killed at the battle near Dunkirk against the Spaniards. What became of my second brother I never knew, any more than my father or mother did know what was become of me.',
        farsi:
          'من دو برادرِ بزرگ‌تر داشتم، که یکی از آن‌ها سرهنگِ دومِ یک هنگِ پیاده‌نظامِ انگلیسی در فلاندر بود، که پیش‌تر به فرماندهیِ سرهنگِ معروفِ لاکهارت بود، و در نبردِ نزدیکِ دانکرک در برابرِ اسپانیایی‌ها کشته شد. از برادرِ دومِم هرگز ندانم چه شد، همان‌گونه که پدر و مادرم نیز نمی‌دانستند از من چه شد.',
      },
      {
        english:
          'Being the third son of the family and not bred to any trade, my head began to be filled very early with rambling thoughts. My father, who was very ancient, had given me a competent share of learning, as far as house-education and a country free-school generally go, and designed me for the law.',
        farsi:
          'چون سومین پسرِ خانواده بودم و برای هیچ شغلی تربیت نشده بودم، سرم خیلی زود از افکارِ سرگردانی پر شد. پدرم، که بسیار پیر بود، به من سهمی کافی از دانش داده بود، تا آن‌جا که آموزشِ خانگی و مدرسه‌ی رایجِ روستایی معمولاً می‌رسد، و مرا برای حقوق تعیین کرده بود.',
      },
      {
        english:
          'But I would be satisfied with nothing but going to sea; and my inclination to this led me so strongly against the will, nay, the commands of my father, and against all the entreaties and persuasions of my mother and other friends, that there seemed to be something fatal in that propensity of nature, tending directly to the life of misery which was to befall me.',
        farsi:
          'ولی من به هیچ‌چیز جز رفتن به دریا راضی نمی‌شدم؛ و تمایلِ من به این کار چنان قوی مرا برخلافِ خواست، بلکه فرمانِ پدرم، و برخلافِ تمامِ التماس‌ها و ترغیب‌های مادرم و دیگر دوستان می‌راند، که به‌نظر می‌رسید در آن گرایشِ طبیعی چیزی مقدر باشد، که مستقیماً به سویِ زندگیِ بدبختی می‌رفت که قرار بود بر سرِ من بیاید.',
      },
      {
        english:
          'My father, a wise and grave man, gave me serious and excellent counsel against what he foresaw was my design. He told me there was nothing but middle state of life that could afford a man a competent share of happiness; that the middle station had the fewest disasters, and was not exposed to so many vicissitudes as the higher or lower part of mankind.',
        farsi:
          'پدرم، مردی دانا و باوقار، به من مشورتِ جدی و عالی علیه آنچه پیش‌بینی می‌کرد طراحیِ من بود داد. به من گفت که چیزی جز حالِ میانیِ زندگی نبود که می‌توانست به انسان سهمی کافی از خوشبختی دهد؛ که حالِ میانی کمترینِ بلاها را داشت، و به‌اندازه‌ی بخشِ بالاتر یا پایین‌ترِ بشریت در برابرِ چنین دگرگونی‌هایِ فراوانی قرار نداشت.',
      },
    ],
  },
  {
    slug: 'a-christmas-carol',
    title: 'A Christmas Carol',
    author: 'Charles Dickens',
    description:
      'Ebenezer Scrooge, a miserly old man, is visited on Christmas Eve by the ghost of his former partner Jacob Marley and three spirits who reveal his past, present, and future, transforming him into a generous man. A beloved holiday tale of redemption.',
    coverFrom: '#7f1d1d',
    coverTo: '#450a0a',
    coverAccent: '#fbbf24',
    genres: ['Fiction', 'Classic', 'Holiday'],
    level: 'B1',
    rating: 4.8,
    reviewCount: 1320,
    viewCount: 15600,
    isPremium: false,
    publishedYear: 1843,
    pages: [
      {
        type: 'heading',
        english: "Stave One — Marley's Ghost",
        farsi: 'پرده‌ی نخست — روحِ مارلی',
      },
      {
        english:
          'Marley was dead, to begin with. There is no doubt whatever about that. The register of his burial was signed by the clergyman, the clerk, the undertaker, and the chief mourner. Scrooge signed it. And Scrooge\'s name was good upon \'Change, for anything he chose to put his hand to. Old Marley was as dead as a door-nail. Mind! I don\'t mean to say that I know, of my own knowledge, what there is particularly dead about a door-nail. I might have been inclined, myself, to regard a coffin-nail as the deadest piece of ironmongery in the trade. But the wisdom of our ancestors is in the simile; and my unhallowed hands shall not disturb it, or the Country\'s done for.',
        farsi:
          'مارلی مرده بود، از آغازِ کار. هیچ شکی در این نیست. ثبتِ دفنِ او را کشیش، منشی، کفن‌وشفاف‌کن و سوگوارِ اصلی امضا کرده بودند. اسکروژ هم امضا کرد. و نامِ اسکروژ در بورس اعتبار داشت، برای هر کاری که دست به آن می‌گذاشت. مارلیِ پیر به‌اندازه‌ی میخِ در مرده بود. توجه! نمی‌خواهم بگویم که از دانشِ خود می‌دانم میخِ در چه ویژگیِ خاصی مرده‌تر است. شاید خودم متمایل بودم که میخِ تابوت را مرده‌ترین قطعه‌ی یراق‌آلاتِ این حرفه بدانم. اما خردِ نیاکان ما در این تشبیه است؛ و دست‌های ناپاک من نباید آن را برهم زند، وگرنه کشور نابود می‌شود.',
      },
      {
        english:
          'Oh! But he was a tight-fisted hand at the grind-stone, Scrooge! a squeezing, wrenching, grasping, scraping, clutching, covetous, old sinner! Hard and sharp as flint, from which no steel had ever struck out generous fire; secret, and self-contained, and solitary as an oyster. The cold within him froze his old features, nipped his pointed nose, shrivelled his cheek, stiffened his gait; made his eyes red, his thin lips blue; and spoke out shrewdly in his grating voice. A frosty rime was on his head, and on his eyebrows, and his wiry chin. He carried his own low temperature always about with him; he iced his office in the dogdays; and didn\'t thaw it one degree at Christmas.',
        farsi:
          'اوه! اما اسکروژ دستی بر سنگِ آسیابِ تنگ داشت! گیردار، فریبکار، مال، دزد، چنگ‌زن، طمع‌کار، پیرمردِ گناهکار! سخت و تیز چون سنگِ چخماق، که هیچ فولادی از آن آتشِ بخشش بیرون نزده بود؛ رازدار، در خود فرو رفته و تنها چون صدف. سرمایِ درونش چهره‌ی پیرش را یخ زد، بینیِ تیزش را بی‌حس کرد، گونه‌اش را چروکید، راه رفتنش را خشک کرد؛ چشمانش را سرخ کرد، لب‌های نازکش را آبی؛ و با صدای خشنش به‌تیزی گفت. بر سر و ابرو و چانه‌ی سیم‌گونش شبنمِ یخی بود. او سرمایِ کمِ خود را همیشه با خود حمل می‌کرد؛ در روزهایِ سوزانِ تابستان، دفترش را یخ می‌زد؛ و در کریسمس یک درجه هم آن را ذوب نمی‌کرد.',
      },
      {
        english:
          '"You will be haunted," resumed the Ghost, "by Three Spirits." Scrooge\'s countenance fell almost as low as the Ghost\'s had done. "Is that the chance and hope you mentioned, Jacob?" he demanded, in a faltering voice. "It is." "I — I think I\'d rather not," said Scrooge. "Without their visits," said the Ghost, "you cannot hope to shun the path I tread. Expect the first tomorrow, when the bell tolls One." "Couldn\'t I take \'em all at once, and have it over, Jacob?" hinted Scrooge. "Expect the second on the next night at the same hour. The third upon the next night when the last stroke of Twelve has ceased to vibrate."',
        farsi:
          '«توسطِ سه روح تسخیر خواهی شد،» روح ادامه داد، «.» چهره‌ی اسکروژ تقریباً به‌اندازه‌ی چهره‌ی روح افتاد. «این همان شانس و امیدی است که گفتی، یعقوب؟» با صدایی لرزان پرسید. «بله.» «من... من فکر می‌کنم ترجیح می‌دهم نه،» اسکروژ گفت. «بدونِ دیدارِ آن‌ها،» روح گفت، «نمی‌توانی امید داشته باشی از مسیری که من می‌روم بپرهی. فردا اولی را انتظار داشته باش، وقتی زنگ یک را می‌زند.» «نمی‌توانم همه را یک‌جا بگیرم و تمام کنم، یعقوب؟» اسکروژ پیشنهاد کرد. «فردایِ آن‌شب، در همان ساعت، دومی را انتظار داشته باش. سومی را در شبِ بعد، وقتی ضربه‌ی آخرِ دوازده آرام شد.»',
      },
      {
        english:
          '"Spirit," said Scrooge submissively, "conduct me where you will. I went forth last night on compulsion, and I learnt a lesson which is working now. To-night, if you have aught to teach me, let me profit by it." "Touch my robe." As the words were spoken, they passed through the wall, and stood upon an open country road, with fields on either side. The city had entirely vanished. Not a vestige of it was to be seen. The darkness and the mist had vanished with it, and it was a clear, cold, winter day, with snow upon the ground. "Good Heaven!" said Scrooge, clasping his hands together, as he looked about him. "I was bred in this place. I was a boy here."',
        farsi:
          '«روح،» اسکروژ با فرمان‌برداری گفت، «هر جا می‌خواهی مرا ببر. دیشب از روی اجبار بیرون رفتم، و درسی آموختم که اکنون در حالِ اثر است. امشب، اگر چیزی برای آموختن به من داری، بگذار از آن بهره ببرم.» «ردایم را لمس کن.» همین که این کلمات گفته شد، از دیوار گذشتند و بر جاده‌ی روستایِ باز ایستادند، با مزارع در دو طرف. شهر کمرنگ شده بود. اثری از آن دیده نمی‌شد. تاریکی و مه با آن ناپدید شده بود، و روزِ زمستانیِ روشن و سردی بود، با برف بر زمین. «آسمانِ نیک!» اسکروژ گفت، دست‌هایش را به هم فشرد، در حالی که به اطراف نگاه می‌کرد. «من در این‌جا بزرگ شدم. من در این‌جا پسربچه بودم.»',
      },
      {
        english:
          '"I will honour Christmas in my heart, and try to keep it all the year. I will live in the Past, the Present, and the Future. The Spirits of all Three shall strive within me. I will not shut out the lessons that they teach. Oh, tell me I may sponge away the writing on this stone!" Holding up his hands in one last prayer to have his fate reversed, he saw an alteration in the Phantom\'s hood and dress. It shrunk, collapsed, and dwindled down into a bedpost. Yes! and the bedpost was his own. The bed was his own, the room was his own. Best and happiest of all, the Time before him was his own, to make amends in!',
        farsi:
          '«کریسمس را در دل گرامی خواهم داشت، و تلاش می‌کنم تمامِ سال آن را نگه دارم. در گذشته، حال و آینده خواهم زیست. روحِ هر سه در من کوشش خواهد کرد. درس‌هایی که می‌دهند را رد نخواهم کرد. اوه، بگو ممکن است نوشته‌ی روی این سنگ را پاک کنم!» با بلند کردنِ دست‌ها در آخرین دعا برای بازگرداندنِ سرنوشتش، تغییری در کلاه و لباسِ روح دید. کوچک شد، فرو ریخت، و به پایه‌ی تخت تبدیل شد. بله! و پایه‌ی تخت تختِ خودش بود. تخت تختِ خودش بود، اتاق اتاقِ خودش بود. و بهترین و خوشحال‌کننده‌ترین، زمانی که در پیش داشت زمانِ خودش بود، تا جبران کند!',
      },
    ],
  },
  {
    slug: 'legend-of-sleepy-hollow',
    title: 'The Legend of Sleepy Hollow',
    author: 'Washington Irving',
    description:
      'In a quiet Dutch settlement along the Hudson, the superstitious schoolmaster Ichabod Crane competes with the brawny Brom Bones for the hand of Katrina Van Tassel — until a moonlit ride home brings him face to face with the legendary Headless Horseman.',
    coverFrom: '#422006',
    coverTo: '#1c1917',
    coverAccent: '#ea580c',
    genres: ['Fiction', 'Classic', 'Horror'],
    level: 'B2',
    rating: 4.4,
    reviewCount: 540,
    viewCount: 6200,
    isPremium: false,
    publishedYear: 1820,
    pages: [
      {
        type: 'heading',
        english: 'Found Among the Papers of the Late Diedrich Knickerbocker',
        farsi: 'یافت‌شده در میانِ نوشته‌هایِ دیدریش نیکربوکرِ مرحوم',
      },
      {
        english:
          'In the bosom of one of those spacious coves which indent the eastern shore of the Hudson, at that broad expansion of the river denominated by the ancient Dutch navigators the Tappan Zee, and where they always prudently shortened sail and implored the protection of St. Nicholas when they crossed, there lies a small market town or rural port, which by some is called Greensburgh, but which is more generally and properly known by the name of Tarry Town. This name was given, we are told, in former days, by the good housewives of the adjacent country, from their propensity to tarry about the village tavern on market days.',
        farsi:
          'در دلِ یکی از آن آبدره‌های پهناور که ساحلِ شرقیِ هادسون را فرورفته می‌کند، در آن گسترشِ پهناورِ رود که ناوبرانِ هلندیِ باستان آن را تَپَن زی می‌نامیدند، و جایی که همیشه با احتیاط بادبان را کوتاه می‌کردند و هنگامِ عبور از قدیسِ نیکلاس حمایت می‌خواستند، شهرکِ بازاریِ کوچکی یا بندرِ روستایی نهفته است که برخی آن را گرینزبرگ می‌نامند، اما عموماً و درست‌تر به نامِ تری‌تاون شناخته می‌شود. به ما گفته‌اند این نام را در روزگارانِ گذشته زنانِ خانه‌دارِ نیکِ سرزمینِ مجاور داده‌اند، به‌خاطرِ تمایلشان به توقف در می‌خانه‌ی روستا در روزهایِ بازار.',
      },
      {
        english:
          'Not far from this village, perhaps about two miles, there is a little valley or rather lap of land among high hills, which is one of the quietest places in the whole world. A small brook glides through it with just murmur enough to lull one to repose; and the occasional whistle of a quail or tapping of a woodpecker is almost the only sound that ever breaks in upon the uniform tranquility. I recollect that, when a stripling, my first exploit in squirrel-shooting was in a grove of tall walnut-trees that shades one side of the valley. I had wandered into it at noon, when all nature is peculiarly quiet, and was startled by the roar of my own gun, as it broke the Sabbath stillness around.',
        farsi:
          'نه چندان دور از این روستا، شاید حدودِ دو مایل، دره‌ی کوچکی یا به‌قولی دامنِ زمینی میانِ تپه‌های بلند است، که یکی از آرام‌ترین مکان‌هایِ تمامِ جهان است. رودخانه‌ی کوچکی از میانِ آن می‌لغزد با نجوایی که انسان را به خواب می‌خواباند؛ و سوتِ گاه‌گاهیِ بلدرچین یا کوبیدنِ دارکوب تقریباً تنها صدایی است که آرامشِ یکنواخت را می‌شکند. به یاد دارم که در جوانی، نخستین کارِ جرأت‌مندانه‌ام در تیراندازیِ سنجاب در جنگلِ کوچکی از درختانِ بلندِ گردو بود که سمتِ یکی از دره را سایه می‌انداخت. در ظهر به آن سرگردان شده بودم، وقتی همه‌ی طبیعت به‌طورِ خاصی آرام است، و از غرشِ تفنگِ خودم به‌لرزه افتادم، چون آرامشِ روزِ تعطیلِ اطراف را شکست.',
      },
      {
        english:
          'A drowsy, dreamy influence seems to hang over the land, and to pervade the very atmosphere. The people of the village are generally descended from the original Dutch settlers, and their manners and customs still bear the trace of olden time. They are given to all kinds of marvellous beliefs, have trances and visions, and are subject to strange sights and sounds. They see apparitions of the dead, and hear warnings in the air. The dominant spirit that haunts this enchanted region, and is said to be the most frequently beheld, is the apparition of a figure on horseback, without a head. It is said to be the ghost of a Hessian trooper, whose head had been carried away by a cannon-ball, in some nameless battle during the Revolutionary War.',
        farsi:
          'نفوذِ خواب‌آلود و رؤیایی بر سرزمین می‌آویزد و در همان اتمسفر فراگیر است. مردمِ روستا عموماً از مهاجرانِ هلندیِ نخستین نشأت گرفته‌اند، و آداب‌ورسومِ آن‌ها هنوز اثرِ روزگارِ قدیم را دارد. آن‌ها به باورهایِ شگفت‌انگیزِ همه‌گونه گرایش دارند، خلسه و رؤیا می‌بینند، و در معرضِ دیدها و صداهایِ عجیب هستند. ارواحِ مردگان را می‌بینند، و هشدارهایی در هوا می‌شنوند. روحِ غالب که این منطقه‌ی جادویی را تسخیر کرده، و گفته می‌شود بیشترین دیده شدن را دارد، ظاهرِ سوارکاری است بی‌سر. گفته می‌شود روحِ سربازِ هَسی است، که سرش در جنگی بی‌نام، در طولِ جنگِ انقلابی، با گلوله‌ی توپ پرت شده بود.',
      },
      {
        english:
          'Ichabod Crane, who sojourned in Sleepy Hollow, was a native of Connecticut; a State which supplies the Union with pioneers for the mind as well as for the forest, and sends forth yearly its legions of frontier woodmen and country schoolmasters. The cognomen of Crane was not inapplicable to his person. He was tall, but exceedingly lank, with narrow shoulders, long arms and legs, hands that dangled a mile out of his sleeves, feet that might have served for shovels, and his whole frame most loosely hung together. His head was small, and flat at top, with huge ears, large green glassy eyes, and a long snipe nose, so that it looked like a weather-cock perched upon his spindle neck.',
        farsi:
          'آیکاب کرین، که در سلیپی هالو ساکن بود، بومیِ کنتیکت بود؛ ایالتی که به اتحادیه پیشگامِ ذهن و جنگل می‌دهد، و سالانه لشکری از چوب‌برانِ مرزی و معلمانِ روستایی می‌فرستد. لقبِ کرین به شخصِ او بی‌مناسبت نبود. بلند بود، اما به‌شدت لاغر، با شانه‌های باریک، بازوها و پاهای بلند، دست‌هایی که مایل‌ها از آستینِ بیرون می‌آویختند، پاهایی که به‌جای بیل به‌کار می‌آمدند، و کلِ قامتش به‌آرامی به‌هم پیوسته بود. سرش کوچک بود، و بالا صاف، با گوش‌های بزرگ، چشمانِ سبزِ شیشه‌ایِ بزرگ، و بینیِ درازِ نوک‌تیز، به‌طوری که مانندِ بادبادک بر گردنِ دوک‌مانندش نشسته بود.',
      },
      {
        english:
          'The galloping of hoofs, sounding louder and louder, came nearer and nearer. Ichabod, who had been vainly trying to urge on his old horse, looked back in terror, and beheld what he feared. It was the headless horseman! Huge, dark, and menacing, he sat his powerful steed, and in his hand he held — Ichabod could not be sure — but it looked like a head! A desperate race ensued. The specter rode hard upon his heels. The schoolmaster urged his horse to the bridge. He thought if he could but reach the church bridge, he would be safe. He cleared the bridge in a leap. The next moment the specter passed him like a flash. Ichabod felt a sudden blow, and tumbled headlong into the dust. The horseman flashed by in a clap of thunder.',
        farsi:
          'سمّ بهترین، بلندتر و بلندتر می‌شد، نزدیک‌تر و نزدیک‌تر می‌شد. آیکاب، که بیهوده تلاش می‌کرد اسبِ پیرش را بشتاباند، با ترس به عقب نگاه کرد، و آنچه می‌ترسید دید. سوارکارِ بی‌سر بود! بزرگ، تاریک، و تهدیدآمیز، بر اسبِ قدرتمندش نشسته بود، و در دستش — آیکاب مطمئن نبود — اما شبیه سر بود! مسابقه‌ای ناامیدانه درگرفت. ارواح پشتِ پاشنه‌هایش سوار شد. معلم اسبش را به پل تشویق کرد. فکر کرد اگر فقط به پلِ کلیسا برسد، در امان خواهد بود. پل را در یک جهش پشت سر گذاشت. لحظه‌ی بعد ارواح مانندِ درخشی از او گذشت. آیکاب ضربه‌ی ناگهانی احساس کرد، و سرنگون به خاک افتاد. سوارکار در یک غرشِ گردباد گذشت.',
      },
    ],
  },
  {
    slug: 'wonderful-wizard-of-oz',
    title: 'The Wonderful Wizard of Oz',
    author: 'L. Frank Baum',
    description:
      'When a cyclone carries Dorothy and her little dog Toto away from Kansas to the magical Land of Oz, she sets off along the yellow brick road with a Scarecrow, a Tin Woodman, and a Cowardly Lion to find the great Wizard who can send her home.',
    coverFrom: '#166534',
    coverTo: '#052e16',
    coverAccent: '#fde047',
    genres: ['Fantasy', 'Children', 'Classic'],
    level: 'A2',
    rating: 4.7,
    reviewCount: 1180,
    viewCount: 14200,
    isPremium: false,
    publishedYear: 1900,
    pages: [
      {
        type: 'heading',
        english: 'Chapter 1 — The Cyclone',
        farsi: 'فصلِ یکم — گردباد',
      },
      {
        english:
          'Dorothy lived in the midst of the great Kansas prairies, with Uncle Henry, who was a farmer, and Aunt Em, who was the farmer\'s wife. Their house was small, for the lumber to build it had to be hauled by wagon many miles. There were four walls, a floor and a roof, which made one room; and this room contained a rusty looking cookstove, a cupboard for the dishes, a table, three or four chairs, and the beds. When Dorothy stood in the doorway and looked around, she could see nothing but the great gray prairie on every side. Not a tree nor a house broke the broad sweep of flat country that reached to the edge of the sky in all directions.',
        farsi:
          'دوروتی در میانه‌ی دشت‌های بزرگِ کانزاس زندگی می‌کرد، با عمو هنری که کشاورز بود، و عمه اِم که همسرِ کشاورز بود. خانه‌شان کوچک بود، چون چوبِ ساختنِ آن باید با ارابه‌ای چندین مایل آورده می‌شد. چهار دیوار، یک کف و یک سقف داشت، که یک اتاق می‌ساخت؛ و این اتاق دربردارنده‌ی اجاقِ زنگ‌زده، کابینتی برای ظرف‌ها، یک میز، سه‌چهار صندلی، و تخت‌ها بود. وقتی دوروتی در چهارچوبِ در ایستاد و به اطراف نگاه کرد، جز دشتِ بزرگِ خاکستری از هر سو چیزی نمی‌دید. نه درختی نه خانه‌ای گستره‌ی پهناورِ سرزمینِ هموار را که از هر جهت به لبه‌ی آسمان می‌رسید نمی‌شکست.',
      },
      {
        english:
          'It was Toto that made Dorothy laugh, and saved her from growing as gray as her other surroundings. Toto was not gray; he was a little black dog, with long silky hair and small black eyes that twinkled merrily on either side of his funny, wee nose. Toto played all day long, and Dorothy played with him, and loved him dearly. Today, however, they were not playing. Uncle Henry sat upon the doorstep and looked anxiously at the sky, which was even grayer than usual. From the far north they could hear a low wail of the wind, and Uncle Henry and Dorothy could see the grasses waving before the great storm came.',
        farsi:
          'توتو بود که دوروتی را به خنده می‌آورد، و از خاکستری شدنِ چون سایرِ اطرافش نجاتش می‌داد. توتو خاکستری نبود؛ سگِ کوچکِ سیاهی بود، با موی بلندِ ابریشمی و چشمانِ کوچکِ سیاهی که از هر دو طرفِ بینیِ خنده‌دارِ کوچکش می‌درخشید. توتو تمامِ روز بازی می‌کرد، و دوروتی با او بازی می‌کرد، و بسیار دوستش داشت. امروز، اما، بازی نمی‌کردند. عمو هنری بر پله‌ی در نشست و با نگرانی به آسمان نگاه کرد، که حتی از معمول هم خاکستری‌تر بود. از شمالِ دور می‌توانستند نوایِ پایینِ باد را بشنوند، و عمو هنری و دوروتی می‌دیدند که علف‌ها قبل از آمدنِ طوفانِ بزرگ می‌تپیدند.',
      },
      {
        english:
          'Suddenly, with a mighty roar, the cyclone was upon them. The house shook so violently that Dorothy, who had been sitting on the floor, lost her balance and tumbled over. Then a strange thing happened. The house whirled around two or three times and rose slowly through the air. Dorothy felt as if she were going up in a balloon. The north and south winds met where the house stood, and made it the exact center of the cyclone. In the center of a cyclone the air is generally still, but the great pressure of the wind on every side of the house raised it up higher and higher, until it was at the very top of the cyclone.',
        farsi:
          'ناگهان، با غرشی قدرتمند، گردباد بر آن‌ها فرود آمد. خانه آن‌قدر خشونت‌بار تکان خورد که دوروتی، که روی زمین نشسته بود، تعادلش را از دست داد و غلت زد. آن‌گاه اتفاقِ عجیبی افتاد. خانه دو سه بار چرخید و آرام در هوا بالا رفت. دوروتی احساس کرد انگار با بالن بالا می‌رود. بادهایِ شمالی و جنوبی در جایی که خانه ایستاده بود به‌هم رسیدند، و آن را مرکزِ دقیقِ گردباد کردند. در مرکزِ گردباد هوا عموماً آرام است، اما فشارِ بزرگِ باد از هر سویِ خانه آن را بالا و بالا برد، تا آنکه در بالاترین نقطه‌ی گردباد بود.',
      },
      {
        english:
          'The cyclone had set the house down, very gently — in the midst of a country of marvelous beauty. There were lovely patches of greensward all about, with stately trees bearing rich and luscious fruits. Banks of gorgeous flowers were on every hand, and birds with rare and brilliant plumage sang and fluttered in the trees and bushes. A little way off was a small brook, rushing and sparkling along between green banks, and murmuring in a voice very grateful to a little girl who had lived so long on the dry, gray prairies. While she stood looking eagerly at the strange and beautiful sight, she saw coming toward her a group of the queerest people she had ever seen.',
        farsi:
          'گردباد خانه را بسیار نرم — در میانه‌ی سرزمینی از زیباییِ شگفت‌انگیز — گذاشته بود. بسترهای زیبایِ چمنِ سبز همه‌جا بود، با درختانی باشکوه که میوه‌های فربه و شیرین می‌دادند. کناره‌های گل‌های باشکوه از هر سو بود، و پرندگانی با پرهای کم‌نظیر و درخشان در درختان و بوته‌ها می‌خواندند و بال‌بال می‌زدند. کمی دورتر رودخانه‌ی کوچکی بود، که میانِ کناره‌های سبز می‌تاخت و می‌درخشید، و با صدایی که برای دخترکِ که چنان در دشت‌های خشک و خاکستری زندگی کرده بود بسیار خوشایند بود، نجوا می‌کرد. در حالی که با اشتیاق به آن منظره‌ی عجیب و زیبا نگاه می‌کرد، دید گروهی از عجیب‌ترین آدم‌هایی که تا به حال دیده بود به‌سویش می‌آیند.',
      },
      {
        english:
          '"That is because you have no brains," answered Dorothy. "Of course not," said the Scarecrow. "I am only stuffed with straw. But I should like to have brains instead of straw. I would be as good a man as any. I cannot understand why you should want to leave this beautiful country and go back to the dry, gray place you call Kansas." "That is because you have no brains," answered Dorothy. "No matter how dreary and gray our homes are, we people of flesh and blood would rather live there than in any other country, be it ever so beautiful. There is no place like home." The Scarecrow sighed. "Of course I cannot understand it," he said. "If your heads were stuffed with straw, like mine, you would probably all live in the beautiful places."',
        farsi:
          '«این به آن سبب است که تو مغز نداری،» دوروتی پاسخ داد. «البته نه،» مترسک گفت. «من فقط با کاه پر شده‌ام. اما دلم می‌خواهد به جایِ کاه مغز داشته باشم. آدمِ خوبی می‌شوم مانندِ هر کس. نمی‌فهمم چرا می‌خواهی این سرزمینِ زیبا را ترک کنی و به آن جایِ خشک و خاکستری برگردی که کانزاس می‌نامیش.» «این به آن سبب است که تو مغز نداری،» دوروتی پاسخ داد. «هرچند خانه‌هایمان چقدر غم‌انگیز و خاکستری باشند، ما آدم‌های گوشت‌وخون ترجیح می‌دهیم آنجا زندگی کنیم تا در هر سرزمینِ دیگر، هرچند زیبا باشد. هیچ‌جایی مانندِ خانه نیست.» مترسک آهی کشید. «البته نمی‌توانم بفهمم،» گفت. «اگر سرهایتان با کاه پر می‌شد، مانندِ سرِ من، احتمالاً همگی در مکان‌های زیبا زندگی می‌کردید.»',
      },
      {
        english:
          '"I shall ask for some brains," said the Scarecrow, "for I should be the biggest fool in all the Land of Oz without them." "And I shall ask for a heart," said the Tin Woodman, "for I shall never be happy until I have one." "And I shall ask for courage," said the Cowardly Lion, "for I shall never be king of the beasts until I have it." And Toto barked merrily, as if he too had a wish. They walked on through the forest, the four of them, and Dorothy knew that the road to the Emerald City was paved with yellow brick. They were a strange company, but each was full of hope, and the sunlight fell upon them through the leaves of the great trees.',
        farsi:
          '«من مغز خواهم خواست،» مترسک گفت، «چون بدونِ آن‌ها بزرگ‌ترین احمقِ تمامِ سرزمینِ اُز خواهم بود.» «و من قلب خواهم خواست،» مردِ حلبی‌ایِ چوب‌بر گفت، «چون هرگز خوشحال نخواهم شد تا وقتی یکی داشته باشم.» «و من شجاعت خواهم خواست،» شیرِ بزدل گفت، «چون هرگز پادشاهِ حیوانات نخواهم شد تا وقتی آن را داشته باشم.» و توتو با شادیِ فراوان پارس کرد، انگار او هم آرزویی داشت. آن‌ها از میانِ جنگل رفتند، آن چهار نفر، و دوروتی می‌دانست که راهِ شهرِ زمردی با آجرِ زرد فرش شده. گروهِ عجیبی بودند، اما هر کس پر از امید بود، و نورِ خورشید از میانِ برگ‌های درختانِ بزرگ بر آن‌ها می‌تابید.',
      },
      {
        english:
          '"Who are you?" asked Dorothy. "I am Oz, the Great and Terrible," said the voice. "Who are you, and why do you seek me?" It was a humble voice, and Dorothy was much surprised. "I am Dorothy, the Small and Meek," she said. "I have come to you for help." The eyes looked at her thoughtfully. "Where did you get the silver shoes?" "From the Wicked Witch of the East, when my house fell on her and killed her," said Dorothy. "Where did you get the mark upon your forehead?" "That is where the Good Witch of the North kissed me, as she bade me good-bye." The people of the Emerald City had all thought the Wizard was a great Head, or a lovely Lady, or a terrible Beast. In truth, Oz was a little old man, with a bald head and a wrinkled face.',
        farsi:
          '«تو کی هستی؟» دوروتی پرسید. «من اُز هستم، بزرگ و هولناک،» صدا گفت. «تو کی هستی، و چرا به‌سراغِ من آمده‌ای؟» صدایی فروتن بود، و دوروتی بسیار تعجب کرد. «من دوروتی هستم، کوچک و خوار،» گفت. «برایِ کمک به‌سراغت آمده‌ام.» چشمان با تأمل به او نگاه کردند. «کفش‌های نقره‌ای را از کجا آوردی؟» «از جادوگرِ بدِ شرق، وقتی خانه‌ام روی او افتاد و کشتش،» دوروتی گفت. «نشانه‌ای بر پیشانی‌ات را از کجا آوردی؟» «آن‌جا جایی است که جادوگرِ نیکِ شمال هنگامِ خداحافظی مرا بوسید.» مردمِ شهرِ زمردی همگی فکر می‌کردند جادوگر سرِ بزرگی است، یا بانوی زیبایی، یا وحشتناکِ دیوانه‌ای. در حقیقت، اُز پیرمردِ کوچکی بود، با سرِ تاس و چهره‌ای چروک.',
      },
    ],
  },
  {
    slug: 'through-the-looking-glass',
    title: 'Through the Looking-Glass',
    author: 'Lewis Carroll',
    description:
      'Six months after her adventures in Wonderland, Alice steps through a mirror into a backwards world where chess pieces talk, flowers argue, and Humpty Dumpty explains the meaning of words. A surreal sequel full of wordplay and logic.',
    coverFrom: '#854d0e',
    coverTo: '#422006',
    coverAccent: '#fde047',
    genres: ['Fantasy', 'Classic', 'Children'],
    level: 'B2',
    rating: 4.5,
    reviewCount: 610,
    viewCount: 7100,
    isPremium: false,
    publishedYear: 1871,
    pages: [
      {
        type: 'heading',
        english: 'Chapter 1 — Looking-Glass House',
        farsi: 'فصلِ یکم — خانه‌ی آینه',
      },
      {
        english:
          'One thing was certain, that the white kitten had had nothing to do with it — it was the black kitten\'s fault entirely. For the white kitten had been having its face washed by the old cat for the last quarter of an hour (and bearing it pretty well, considering); so you see that it couldn\'t have had any hand in the mischief. The way Dinah washed her children\'s faces was this: first she held the poor thing down by its ear with one paw, and then with the other paw she rubbed its face all over, the wrong way, beginning at the nose. And just as I said, to keep her in good temper, she had been hard at work on the white kitten, while the black one was nowhere to be seen.',
        farsi:
          'یک چیز مسلّم بود، که گربه‌ی سفید هیچ دخالتی در این کار نداشته — تقصیر تماماً از گربه‌ی سیاه بود. چون گربه‌ی سفید را گربه‌ی پیر در یک‌چهارمِ آخرِ ساعت شست (و تقریباً خوب تحمل کرد، با در نظر گرفتن شرایط)؛ پس می‌بینید که نمی‌توانست در این شیطنت دخالت داشته باشد. روشِ داینا در شستنِ چهره‌ی بچه‌هایش این‌گونه بود: نخست با یک پنجه، گربه‌ی بیچاره را از گوشش نگه می‌داشت، و سپس با پنجه‌ی دیگر تمامِ صورتش را، به‌جهتِ غلط، از بینی شروع می‌کرد، می‌مالید. و همان‌طور که گفتم، برایِ نگه‌داشتنش در خلق‌وخویِ خوب، روی گربه‌ی سفید سخت کار می‌کرد، در حالی که گربه‌ی سیاه هیچ‌جا دیده نمی‌شد.',
      },
      {
        english:
          '"Let\'s pretend that there\'s a way of getting through into it, somehow, Kitty. Let\'s pretend the glass has got all soft like gauze, so that we can get through. Why, it\'s turning into a sort of mist now, I declare! It\'ll be easy enough to get through —" She was up on the chimney-piece while she said this, though she hardly knew how she had got there. And certainly the glass was beginning to melt away, just like a bright silvery mist. In another moment Alice was through the glass, and had jumped lightly down into the Looking-glass room. The very first thing she did was to look whether there was a fire in the fireplace, and she was pleased to find that there was.',
        farsi:
          '«بگذار تصور کنیم راهی برای عبور به درونِ آن هست، به‌نحوی، گربه. بگذار تصور کنیم آینه مانندِ حریر نرم شده، تا بتوانیم عبور کنیم. چرا، حالا دارم قسم می‌خورم به نوعی مه تبدیل می‌شود! به‌اندازه‌ی کافی آسان خواهد بود که عبور کنیم —» او روی شومینه بود وقتی این را گفت، اگرچه به‌سختی می‌دانست چگونه به آنجا رسیده بود. و البته آینه شروع به ذوب شدن کرده بود، درست مانندِ مهی نقره‌ایِ درخشان. در لحظه‌ای دیگر آلیس از میانِ آینه عبور کرد، و به‌آرامی به اتاقِ آینه پُرید. نخستین کاری که کرد این بود که دید آیا در شومینه آتشی هست، و خوشحال شد که هست.',
      },
      {
        english:
          '"I see nobody on the road," said Alice. "I only wish I had such eyes," the King remarked in a fretful tone. "To be able to see Nobody! And at that distance too! Why, it\'s as much as I can do to see real people, by this light!" "I do wish the creatures wouldn\'t stare so," said Alice, as she walked on. "As if they were alive!" "They couldn\'t do that," said the Rose: "they\'re wood, you know." "I know they\'re wood," said Alice: "but they couldn\'t talk, if they were wood. Are you wood?" "Oh, we\'re flowers," said the Rose. "I should like to see the Red Queen," Alice said. "Which way?" said the Rose. "She\'s on the other side. Walk towards the Eighth Square, and you\'ll see her."',
        farsi:
          '«من کسی را در راه نمی‌بینم،» آلیس گفت. «ای کاش چشمانی چون آن داشتم،» پادشاه با لحنی آزرده گفت. «که بتوانم کسی را نبینم! و در آن فاصله هم! چرا، به‌اندازه‌ی کافی می‌توانم آدم‌های واقعی را ببینم، در این نور!» «ای کاش موجودات این‌قدر خیره نمی‌شدند،» آلیس گفت، هنگامی که راه می‌رفت. «انگار زنده‌اند!» «نمی‌توانستند آن کار را بکنند،» رز گفت: «آن‌ها چوبند، می‌دانید.» «می‌دانم چوب‌اند،» آلیس گفت: «اما اگر چوب بودند نمی‌توانستند حرف بزنند. آیا تو چوبی؟» «اوه، ما گل هستیم،» رز گفت. «دلم می‌خواهد ملکه‌ی قرمز را ببینم،» آلیس گفت. «کدام راه؟» رز گفت. «او در آن سوی است. به سمتِ میدانِ هشتم برو، و او را خواهی دید.»',
      },
      {
        english:
          '"Contrariwise," continued Tweedledee, "if it was so, it might be; and if it were so, it would be; but as it isn\'t, it ain\'t. That\'s logic." "I was thinking," Alice said very politely, "which is the best way out of this wood? It\'s getting so dark. Would you tell me, please?" But the little men only looked at each other and grinned. They were fat and round, with flat faces, like a couple of schoolboys. They were dressed in the oddest clothes Alice had ever seen. They were so much alike that Alice could not tell which was which. "I know what you\'re thinking about," said Tweedledum, "but it isn\'t so, nohow." "Contrariwise," continued Tweedledee, "if it was so, it might be; and if it were so, it would be."',
        farsi:
          '«برعکس،» توییدل‌دی ادامه داد، «اگر چنین بود، ممکن بود؛ و اگر چنین بود، خواهد بود؛ اما چون نیست، نیست. این منطق است.» «من فکر می‌کردم،» آلیس بسیار مؤدبانه گفت، «بهترین راهِ خروج از این جنگل کدام است؟ هوا تاریک می‌شود. لطفاً به من می‌گویید؟» اما مردانِ کوچک فقط به هم نگاه کردند و پوزخند زدند. آن‌ها فربه و گرد بودند، با چهره‌های تخت، مانندِ دو دانش‌آموز. عجیب‌ترین لباس‌هایی را که آلیس تا به حال دیده بود پوشیده بودند. آن‌ها آن‌قدر شبیهِ هم بودند که آلیس نمی‌توانست بفهمد کدام کدام است. «می‌دانم به چه فکر می‌کنی،» توییدل‌دام گفت، «اما چنین نیست، به‌هیچ‌وجه.» «برعکس،» توییدل‌دی ادامه داد، «اگر چنین بود، ممکن بود؛ و اگر چنین بود، خواهد بود.»',
      },
      {
        english:
          '"The question is," said Humpty Dumpty, "which is to be master — that\'s all." Alice was too much puzzled to say anything; so after a minute Humpty Dumpty began again. "They\'ve a temper, some of them — particularly verbs: they\'re the proudest — adjectives you can do anything with, but not verbs — however, I can manage the whole lot of them! Impenetrability! That\'s what I say!" "Would you tell me, please," said Alice, "what—" "I meant by impenetrability that we\'ve had enough of that subject," said Humpty Dumpty, "and it would be just as well if you\'d mention what you mean to do next, as I suppose you don\'t mean to stop here all the rest of your life." "That\'s a great deal to make one word mean," Alice said in a thoughtful tone. "When I make a word do a lot of work like that," said Humpty Dumpty, "I always pay it extra."',
        farsi:
          '«مسئله این است،» هامپتی دامپتی گفت، «که کدام ارباب باشد — همین.» آلیس آن‌قدر گیج شده بود که چیزی نگوید؛ پس پس از یک دقیقه هامپتی دامپتی دوباره آغاز کرد. «آن‌ها خلق‌وخویی دارند، برخی‌شان — به‌ویژه فعل‌ها: آن‌ها مغرورترین‌اند — با صفت‌ها هر کاری بکن، اما با فعل‌ها نه — با این حال، من می‌توانم همه‌شان را اداره کنم! نفوذناپذیری! این چیزی است که می‌گویم!» «لطفاً به من بگویید،» آلیس گفت، «چه—» «منظورم از نفوذناپذیری این بود که از این موضوع به‌اندازه‌ی کافی داشته‌ایم،» هامپتی دامپتی گفت، «و بهتر است بگویی منظورت از کارِ بعدی چیست، چون فرض می‌کنم نمی‌خواهی تمامِ بقیه‌ی عمرت اینجا بمانی.» «این کلمه را معنایِ زیادی دادن کارِ بزرگی است،» آلیس با لحنی متفکرانه گفت. «وقتی من کلمه‌ای را به این کارِ زیاد وادارم،» هامپتی دامپتی گفت، «همیشه به آن اضافه می‌دهم.»',
      },
    ],
  },
  {
    slug: 'call-of-the-wild-classic',
    title: 'The Call of the Wild',
    author: 'Jack London',
    description:
      'Stolen from his comfortable California home and sold to a sled team during the Klondike Gold Rush, the dog Buck must learn the brutal law of club and fang — and finally answer the ancient call of the wilderness. A powerful tale of instinct and survival.',
    coverFrom: '#78350f',
    coverTo: '#1c1917',
    coverAccent: '#fbbf24',
    genres: ['Adventure', 'Classic', 'Nature'],
    level: 'B2',
    rating: 4.6,
    reviewCount: 780,
    viewCount: 8900,
    isPremium: false,
    publishedYear: 1903,
    pages: [
      {
        type: 'heading',
        english: 'Chapter I — Into the Primitive',
        farsi: 'فصلِ یکم — به درونِ بدوی',
      },
      {
        english:
          'Buck did not read the newspapers, or he would have known that trouble was brewing, not alone for himself, but for every tidewater dog, strong of muscle and with warm, long hair, from Puget Sound to San Diego. Because men, groping in the Arctic darkness, had found a yellow metal, and because steamship and transportation companies were booming the find, thousands of men were rushing into the Northland. These men wanted dogs, and the dogs they wanted were heavy dogs, with strong muscles by which to toil, and furry coats to protect them from the frost. Buck lived at a big house in the sun-kissed Santa Clara Valley. Judge Miller\'s place, it was called.',
        farsi:
          'باک روزنامه نمی‌خواند، وگرنه می‌دانست که دردسر در راه است، نه فقط برایِ خودش، بلکه برایِ هر سگِ ساحلی با عضلاتی قوی و مویی بلند و گرم، از پاوجِت ساند تا سن‌دیگو. چون مردان، در تاریکیِ قطبی، فلزِ زردی یافته بودند، و چون شرکت‌هایِ کشتی و حمل‌ونقل این کشف را تبلیغ می‌کردند، هزاران مرد به سرزمینِ شمال هجوم می‌بردند. این مردان سگ می‌خواستند، و سگ‌هایی که می‌خواستند سنگین بودند، با عضلاتی قوی برایِ کشیدنِ بار، و پوششی پشمی برایِ نگاه‌داشتنِ آن‌ها از یخ. باک در خانه‌ای بزرگ در دره‌ی آفتاب‌گرفته‌ی سانتا کلارا زندگی می‌کرد. محلِ قاضی میلر نامیده می‌شد.',
      },
      {
        english:
          'He had never been treated roughly. He had been the undisputed possessor of the Judge\'s estate. He had gone hunting with the Judge\'s sons; he had escorted the Judge\'s daughters, on long twilight or early morning rambles; he had carried the Judge\'s grandsons on his back and guarded their footsteps. But there was no spirit of rebellion in him. The first thing he knew, he was being led away by a stranger. He trusted the man because he was a friend of one of the gardeners. But when the man turned him over to another, and that other tightened a knotted rope around his neck, Buck realized that he was being betrayed. He sprang at the man in sudden fury, but the rope choked him, and he was thrown into the baggage car of a train.',
        farsi:
          'هیچ‌گاه با خشونت رفتار نشده بود. صاحبِ بلامنازعِ ملکِ قاضی بود. با پسرانِ قاضی شکار رفته بود؛ دخترانِ قاضی را در قدم‌زدن‌هایِ طولانیِ غروب یا سحر همراهی کرده بود؛ نوه‌هایِ قاضی را بر پشتِ خود حمل کرده و گام‌هایشان را نگهبانی کرده بود. اما روحِ عصیانی در او نبود. نخستین چیزی که فهمید، این بود که با یک غریبه برده می‌شود. به مرد اعتماد کرد چون دوستِ یکی از باغبانان بود. اما وقتی مرد او را به دیگری سپرد، و آن دیگری طنابِ گره‌خورده‌ای بر گردنش تنگ کرد، باک فهمید که خیانت می‌شود. در خشمِ ناگهانی به مرد پرید، اما طناب او را خفه کرد، و به واگنِ بارِ یک قطار انداخته شد.',
      },
      {
        english:
          'Here a man with a red sweater and a hatchet in his hand stood over them. He was breaking dogs. The man in the red sweater looked at Buck with curious, appraising eyes. "Another broken one," he said. He picked up a club and stood ready. Buck sprang at him in rage, but the man struck him with the club, hard. Buck\'s body twisted in the air, and he fell on his side. Again he sprang. Again the club came down. Again he was struck. After the tenth time, Buck lay still, his nose bleeding, his tongue lolling. The man in the red sweater nodded. "Yes, he\'s a fighter," he said. "But every dog has his day, and every dog learns the law of club and fang."',
        farsi:
          'این‌جا مردی با پیراهنِ قرمز و تبری در دست بر آن‌ها ایستاده بود. او در حالِ شکستنِ سگ‌ها بود. مردِ پیراهن‌قرمز با چشمانی کنجکاو و ارزش‌گذار به باک نگاه کرد. «یکی دیگر از شکسته‌ها،» گفت. چماقی برداشت و آماده ایستاد. باک در خشم به او پرید، اما مرد با چماق او را زد، محکم. بدنِ باک در هوا پیچید، و بر پهلو افتاد. دوباره پرید. دوباره چماق فرود آمد. دوباره زده شد. پس از دهمین بار، باک بی‌حرکت افتاد، بینی‌اش خونریزی می‌کرد، زبانش آویزان بود. مردِ پیراهن‌قرمز سر تکان داد. «بله، او جنگجوست،» گفت. «اما هر سگی روزش را دارد، و هر سگی قانونِ چماق و دندان را می‌آموزد.»',
      },
      {
        english:
          'And Buck learned. He learned to eat fast, to swallow his food whole, to fight for every morsel. He learned to steal from his fellow dogs, to dig holes and hide his food. He learned to keep his feet on the slippery ice. He learned to sleep curled in a ball, his nose under his tail, in the snow. The domesticated generations fell from him. The ancient instincts awoke. In vague ways he remembered back to the youth of the breed, to the time the wild dogs ranged in packs through the forest. It was no task for him to fight as his forefathers had fought. He was a killer, a meat killer, and he was alive.',
        farsi:
          'و باک آموخت. آموخت سریع بخورد، غذایش را کامل ببلعد، برایِ هر لقمه بجنگد. آموخت از سگ‌هایِ همدمش بدزدد، سوراخ بکند و غذایش را پنهان کند. آموخت پاهایش را بر یخِ لیز نگه دارد. آموخت به‌صورتِ توپ فرورفته بخوابد، بینی‌اش زیرِ دمش، در برف. نسل‌هایِ اهلی از او فرو ریخت. غرایزِ باستانی بیدار شدند. به‌طورِ مبهم به جوانیِ نژاد، به زمانی که سگ‌هایِ وحشی در گروه‌ها در جنگل می‌گشتند، یاد کرد. برایِ او کاری نبود که مانندِ نیاکانش بجنگد. او یک قاتل بود، یک قاتلِ گوشت، و زنده بود.',
      },
      {
        english:
          'Spitz was the lead dog, and he was a bitter rival to Buck. They fought often, and the team watched. The day came when they were chasing a snowshoe rabbit. Spitz was ahead, then Buck. The team behind. Spitz cut across to intercept, but Buck was faster. He struck Spitz with his shoulder, and Spitz went down. The pack fell upon him. Buck stood back and watched. He had killed the lead dog, and now he was the leader. When Perrault and François saw what had happened, they knew. François looked at Buck. "By Gar, I tink Buck ees de devil," he said. They made him the lead dog, and the team ran faster than ever.',
        farsi:
          'اسپیتز سگِ پیشاهنگ بود، و رقیبِ تلخی برایِ باک بود. اغلب می‌جنگیدند، و تیم تماشا می‌کرد. روزی رسید که در تعقیبِ خرگوشیِ برفی بودند. اسپیتز جلو بود، سپس باک. تیم پشت سر. اسپیتز برایِ رهگیری قطعِ مسیر کرد، اما باک سریع‌تر بود. با شانه‌اش اسپیتز را زد، و اسپیتز زمین خورد. گروه بر او افتاد. باک عقب ایستاد و تماشا کرد. او سگِ پیشاهنگ را کشته بود، و اکنون خودش رهبر بود. وقتی پرو و فرانسوا دیدند چه شده، فهمیدند. فرانسوا به باک نگاه کرد. «به خدا، فکر می‌کنم باک دیو است،» گفت. او را پیشاهنگِ تیم کردند، و تیم سریع‌تر از همیشه دوید.',
      },
      {
        english:
          'John Thornton was the man. When Buck fell through the ice with the team and the sled, John Thornton cut him loose from the traces. When Hal and Charles and Mercedes would have beaten Buck to make him rise, Thornton stepped between them and the dog. He took Buck in, nursed him back to health, and Buck loved him with a love that was adoration. For the first time, Buck knew love, real love, passionate love. And Thornton loved Buck back, in his quiet way. They understood each other. Thornton would hold Buck\'s head in his hands and look into his eyes, and Buck would nuzzle his face. The other men in the camp watched this strange bond with quiet wonder.',
        farsi:
          'جان تورنتون آن مرد بود. وقتی باک با تیم و سورتمه از میانِ یخ رفت، جان تورنتون او را از بندِها آزاد کرد. وقتی هال و چارلز و مرسدس می‌خواستند باک را کتک بزنند تا بلند شود، تورنتون میانِ آن‌ها و سگ ایستاد. باک را گرفت، پرستاری کرد تا خوب شد، و باک او را با عشقی که نیایش بود دوست داشت. برایِ نخستین بار، باک عشق را شناخت، عشقِ واقعی، عشقِ پرشور. و تورنتون هم باک را دوست داشت، به‌طرزِ آرامِ خودشان. یکدیگر را می‌فهمیدند. تورنتون سرِ باک را در دست‌هایش می‌گرفت و در چشمانش نگاه می‌کرد، و باک صورتش را می‌مالید. مردانِ دیگرِ اردوگاه با شگفتیِ آرام به این پیوندِ عجیب نگاه می‌کردند.',
      },
      {
        english:
          'But the call of the wild was in him. He heard it in the night, when the moon shone and the forest stretched out black and mysterious. He felt it in his blood. He would wander off into the forest for days at a time, hunting, killing, living as his forefathers had lived. He befriended a wild timber wolf, and they ran together. But always he came back to John Thornton. Always. Until one day, he came back to the camp to find it destroyed, the Yeehats had attacked, and Thornton was dead. Buck killed them. He killed many. And then, having no longer any tie to mankind, he answered the call of the wild. He joined the wolf pack, and became their leader. The Yeehats speak of the Ghost Dog to this day.',
        farsi:
          'اما ندایِ وحش در او بود. آن را در شب می‌شنید، وقتی ماه می‌تابید و جنگل سیاه و رازآلود گسترده بود. آن را در خونش حس می‌کرد. روزها به جنگل می‌رفت، شکار می‌کرد، می‌کشت، چون نیاکانش زندگی می‌کرد. با گرگِ جنگلیِ وحشی دوست شد، و با هم می‌دویدند. اما همیشه به جان تورنتون بازمی‌گشت. همیشه. تا آنکه یک روز بازگشت و اردوگاه را ویران یافت، یی‌هات‌ها حمله کرده بودند، و تورنتون مرده بود. باک آن‌ها را کشت. بسیاری را کشت. و سپس، چون دیگر هیچ پیوندی با نسلِ بشر نداشت، به ندایِ وحش پاسخ داد. به گروهِ گرگ‌ها پیوست، و رهبرشان شد. یی‌هات‌ها تا امروز از سگِ روح می‌گویند.',
      },
    ],
  },
  {
    slug: 'importance-of-being-earnest',
    title: 'The Importance of Being Earnest',
    author: 'Oscar Wilde',
    description:
      'Two young gentlemen, Jack Worthing and Algernon Moncrieff, both lead double lives under the name "Ernest" to escape social obligations — until their deceptions collide over the charming Gwendolen Fairfax and the formidable Lady Bracknell. Wilde\'s sparkling comedy of manners.',
    coverFrom: '#9d174d',
    coverTo: '#500724',
    coverAccent: '#f9a8d4',
    genres: ['Drama', 'Comedy', 'Classic'],
    level: 'B2',
    rating: 4.7,
    reviewCount: 690,
    viewCount: 7800,
    isPremium: false,
    publishedYear: 1895,
    pages: [
      {
        type: 'heading',
        english: 'First Act — Morning-Room in Algernon\'s Flat',
        farsi: 'پرده‌ی نخست — اتاقِ صبحگاهیِ آپارتمانِ آلجرنون',
      },
      {
        english:
          'Algernon. Did you hear what I was playing, Lane? Lane. I didn\'t think it polite to listen, sir. Algernon. I\'m sorry for that, for your sake. I don\'t play accurately — any one can play accurately — but I play with wonderful expression. As far as the piano is concerned, sentiment is my forte. I keep science for Life. Lane. Yes, sir. Algernon. How are the cucumber sandwiches? I told you to prepare them specially. Lane. Yes, sir. [Handing the salver.] Algernon. [Inspecting them, taking two, and sitting down on the sofa.] Oh! . . . by the way, Lane, I see from your book that on Thursday night, when Lord Shoreman and Mr. Worthing were dining with me, eight bottles of champagne are entered as having been consumed.',
        farsi:
          'آلجرنون: شنیدی که چه می‌نواختم، لین؟ لین: فکر نکردم مؤدبانه باشد که گوش دهم، آقا. آلجرنون: برایِ تو متأسفم. من دقیق نمی‌نوازم — هر کس می‌تواند دقیق بنوازد — اما با احساسِ شگفت‌انگیزی می‌نوازم. تا آنجا که به پیانو مربوط است، احساس نقطه‌ی قوتِ من است. علم را برایِ زندگی نگه می‌دارم. لین: بله، آقا. آلجرنون: ساندویچ‌های خیار چطورند؟ گفتم مخصوص آماده کنی. لین: بله، آقا. [سینی را می‌دهد.] آلجرنون: [آن‌ها را بررسی می‌کند، دو تا برمی‌دارد، و روی مبل می‌نشیند.] اوه! . . . ضمناً، لین، از کتابت می‌بینم که شبِ پنجشنبه، وقتی لرد شورمن و آقای وورثینگ با من شام می‌خوردند، هشت بطریِ شامپاین به‌عنوانِ مصرف‌شده ثبت شده.',
      },
      {
        english:
          'Jack. I am in love with Gwendolen Fairfax. I have come up to town expressly to propose to her. Algernon. I thought you had come up for pleasure? . . . I call that business. Jack. How utterly unromantic you are! Algernon. I really don\'t see anything romantic in proposing. It is very romantic to be in love. But there is nothing romantic about a definite proposal. Why, one may be accepted. One usually is, I believe. Then the excitement is all over. The very essence of romance is uncertainty. If ever I get married, I\'ll certainly try to forget the fact. Jack. I have no doubt about that, dear Algy. The Divorce Court was specially invented for people whose memories are so curiously constituted.',
        farsi:
          'جک: من عاشقِ گوِندولِن فِر‌فکس هستم. مخصوصاً برایِ خواستگاری از او به شهر آمده‌ام. آلجرنون: فکر می‌کردم برایِ تفریح آمده‌ای؟ . . . من آن را کار می‌نامم. جک: چقدر به‌کلی غیررومانتیکی! آلجرنون: واقعاً چیزی رمانتیک در خواستگاری نمی‌بینم. عاشق بودن بسیار رمانتیک است. اما در خواستگاریِ صریح چیزی رمانتیک نیست. چرا، شاید پذیرفته شوی. معمولاً پذیرفته می‌شوی، فکر کنم. آن‌گاه هیجان تمام می‌شود. ذاتِ عاشقی عدم‌قطعیت است. اگر تا به حال ازدواج کنم، قطعاً تلاش می‌کنم این واقعیت را فراموش کنم. جک: در این باره شکی ندارم، آلگیِ عزیز. دادگاهِ طلاق مخصوصاً برایِ کسانی اختراع شد که حافظه‌شان چنان عجیب ساخته شده.',
      },
      {
        english:
          'Jack. My name is Ernest in town and Jack in the country. Algernon. Yes, but your name in the country is Jack. I have invented an invaluable permanent invalid called Bunbury, in order that I may be able to go down into the country whenever I choose. If it wasn\'t for Bunbury\'s extraordinary bad health, for instance, I wouldn\'t be able to dine with you at Willis\'s to-night. Bunbury is perfectly invaluable. If it wasn\'t for Bunbury, I should have to dine with my aunt Augusta. Jack. Well, I have decided to give up my name of Ernest. I have no use for it any longer. Algernon. But you can\'t give up a name like Ernest. Gwendolen would never love you if your name wasn\'t Ernest.',
        farsi:
          'جک: نامِ من در شهر ارنست و در روستا جک است. آلجرنون: بله، اما نامت در روستا جک است. من یک بیمارِ همیشگیِ بی‌نظیر به نامِ بان‌بِری اختراع کرده‌ام، تا هر وقت خواستم بتوانم به روستا بروم. اگر سلامتیِ بسیار بدِ بان‌بِری نبود، مثلاً نمی‌توانستم امشب با تو در ویلیس شام بخورم. بان‌بِری کاملاً ارزشمند است. اگر بان‌بِری نبود، باید با عمه‌ام آگوستا شام می‌خوردم. جک: خب، تصمیم گرفته‌ام نامِ ارنستم را کنار بگذارم. دیگر نیازی به آن ندارم. آلجرنون: اما نمی‌توانی نامی چونِ ارنست را کنار بگذاری. گوِندولِن هرگز دوستت نخواهد داشت اگر نامت ارنست نباشد.',
      },
      {
        english:
          'Gwendolen. We live, as I hope you know, Mr. Worthing, in an age of ideals. The fact is constantly mentioned in the more expensive monthly magazines, and has reached the provincial pulpits. My ideal has always been to love some one of the name of Ernest. There is something in that name that inspires absolute confidence. The moment Algernon first mentioned to me that he had a friend called Ernest, I knew I was destined to love you. Jack. You really love me, Gwendolen? Gwendolen. Passionately! Jack. Darling! You don\'t know how happy you\'ve made me. Gwendolen. My own Ernest. Jack. But you don\'t really mean to say that you couldn\'t love me if my name wasn\'t Ernest? Gwendolen. But your name is Ernest. Jack. Yes, I know it is. But supposing it was something else?',
        farsi:
          'گوندولین: ما، چنانچه می‌دانم آقای وورثینگ، در عصرِ آرمان‌ها زندگی می‌کنیم. این واقعیت دائماً در مجلاتِ ماهانه‌ی گران‌تر ذکر می‌شود، و به منابرِ ایالتی رسیده. آرمانِ من همیشه این بوده که کسی به نامِ ارنست را دوست داشته باشم. در این نام چیزی هست که اعتمادِ کامل الهام می‌کند. لحظه‌ای که آلجرنون نخستین‌بار به من گفت دوستی به نامِ ارنست دارد، فهمیدم مقدر است دوستت داشته باشم. جک: واقعاً دوستم داری، گوِندولین؟ گوندولین: با اشتیاق! جک: عزیزم! نمی‌دانی چقدر خوشحالم کردی. گوندولین: ارنستِ من. جک: اما واقعاً نمی‌خواهی بگویی اگر نامم ارنست نبود نمی‌توانستی دوستم داشته باشی؟ گوندولین: اما نامت ارنست است. جک: بله، می‌دانم. اما فرض کنیم چیز دیگری بود؟',
      },
      {
        english:
          'Lady Bracknell. Are your parents living? Jack. I have lost both my parents. Lady Bracknell. To lose one parent may be regarded as a misfortune; to lose both looks like carelessness. Who was your father? He was evidently a man of some wealth. Was he born in what the Radical papers call the purple of commerce, or did he rise from the ranks of the aristocracy? Jack. I am afraid I really don\'t know. The fact is, Lady Bracknell, I said I had lost my parents. It would be nearer the truth to say that my parents seem to have lost me. I don\'t actually know who I am by birth. I was found in a handbag in the cloakroom at Victoria Station. Lady Bracknell. A handbag? Jack. Yes, Lady Bracknell. In the Brighton Line.',
        farsi:
          'لیدی برکنل: پدر و مادرت زنده‌اند؟ جک: هر دو را از دست داده‌ام. لیدی برکنل: از دست دادنِ یک والد را می‌توان بدبختی دانست؛ از دست دادنِ هر دو بی‌احتیابی به‌نظر می‌رسد. پدرت کی بود؟ آشکارا مردی با ثروتی بود. آیا در آنچه روزنامه‌های رادیکال بنفشِ تجارت می‌نامند به‌دنیا آمد، یا از رده‌هایِ اشرافیت برخاست؟ جک: می‌ترسم واقعاً ندانم. حقیقت این است، لیدی برکنل، گفتم پدر و مادرم را از دست داده‌ام. نزدیک‌تر به حقیقت این است که بگویم پدر و مادرم به‌نظر می‌رسد مرا از دست داده‌اند. در حقیقت نمی‌دانم به‌ولادت چه کسی هستم. در یک کیفِ دستی در صندوقِ خلوتِ ایستگاهِ ویکتوریا پیدا شدم. لیدی برکنل: کیفِ دستی؟ جک: بله، لیدی برکنل. در خطِ برایتون.',
      },
    ],
  },
  {
    slug: 'persuasion',
    title: 'Persuasion',
    author: 'Jane Austen',
    description:
      'Eight years after being persuaded to break off her engagement to the penniless naval officer Frederick Wentworth, Anne Elliot meets him again — now a wealthy captain. A mature, autumnal novel of second chances, regret, and quiet constancy.',
    coverFrom: '#7c2d12',
    coverTo: '#431407',
    coverAccent: '#fbbf24',
    genres: ['Romance', 'Classic', 'Fiction'],
    level: 'C1',
    rating: 4.6,
    reviewCount: 540,
    viewCount: 6200,
    isPremium: false,
    publishedYear: 1818,
    pages: [
      {
        type: 'heading',
        english: 'Chapter I',
        farsi: 'فصلِ یکم',
      },
      {
        english:
          'Sir Walter Elliot, of Kellynch Hall, in Somersetshire, was a man who, for his own amusement, never took up any book but the Baronetage; there he found occupation for an idle hour, and consolation in a distressed one; there his faculties were roused into admiration and respect, by contemplating the limited remnant of the earliest patents; there any unwelcome sensations, arising from domestic affairs, changed naturally into pity and contempt. As he turned over the almost endless creations of the last century, and there, if every other leaf were powerless, he could read his own history with an interest which never failed. This was the page at which the favourite volume always opened: "ELLIOT OF KELLYNCH HALL. Walter Elliot, born March 1, 1760."',
        farsi:
          'سر والتر الیوت، از کِلینچ هال، در سامرست‌شر، مردی بود که برایِ تفریحِ خود هیچ کتابی جز بارونتاژ برنمی‌داشت؛ آنجا برایِ ساعتِ بی‌کاری‌اش شغلی می‌یافت، و در ساعتِ غم انسانی تن‌دلبخواه؛ آنجا قوایِ او به تحسین و احترام بیدار می‌شد، با تأمل در بقایایِ محدودِ قدیمی‌ترین اختراعات؛ آنجا هر احساسِ ناخوشایندی که از امورِ خانگی پیدایش می‌شد، طبیعتاً به شفقت و تحقیر بدل می‌گشت. چون برگ‌هایِ تقریباً بی‌پایانِ قرنِ گذشته را ورق می‌زد، آنجا، اگر هر برگِ دیگر بی‌اثر بود، می‌توانست تاریخِ خودش را با علاقه‌ای که هرگز فرو نمی‌نشست بخواند. این صفحه‌ای بود که جلدِ محبوب همیشه در آن باز می‌شد: «الیوتِ کِلینچ هال. والتر الیوت، متولدِ یکمِ مارسِ ۱۷۶۰.»',
      },
      {
        english:
          'Vanity was the beginning and the end of Sir Walter Elliot\'s character; vanity of person and of situation. He had been remarkably handsome in his youth; and, at fifty-four, was still a very fine man. Few women could think more of their personal appearance than he did, nor could the valet of any new-made lord be more delighted with the place he held in society. He could not have supposed that any man could be so proud of such a station, and considered himself as the most deserving of all the men who held the honor of a baronetage. He had been initially married to a woman of great good sense, who had managed his household with great economy, and who had given him three daughters, of whom Anne, the second, was the only one who seemed to inherit her mother\'s qualities.',
        farsi:
          'خودبینی آغاز و انجامِ شخصیتِ سر والتر الیوت بود؛ خودبینی به شخص و به موقعیت. در جوانی بسیار خوش‌سیما بود؛ و در پنجاه‌وچهار سالگی هنوز مردی بسیار جذاب بود. کمتر زنی می‌توانست از ظاهرِ شخصیِ خود بیشتر از او فکر کند، نه خدمتکارِ هر لردِ تازه‌به‌نوبت‌رسیده‌ای می‌توانست از جایگاهی که در جامعه داشت خوشحال‌تر باشد. نمی‌توانست تصور کند کسی چنین به چنین جایگاهی مغرور باشد، و خودش را شایسته‌ترینِ همه‌ی مردانی می‌دانست که افتخارِ بارونتاژ را داشتند. ابتدا با زنی از حسِ بزرگ ازدواج کرد، که خانه‌داریِ او را با صرفه‌جوییِ بزرگ اداره می‌کرد، و سه دختر به او داد، که آن، دومین، تنها کسی بود که به‌نظر می‌رسید صفاتِ مادرش را به ارث برده باشد.',
      },
      {
        english:
          'Anne Elliot, at seven-and-twenty, could hardly be considered very young; but her bloom had vanished early; and even her beauty, of which her father had always been proud, had faded into a quiet, subdued loveliness. She had been persuaded, eight years ago, to refuse the man she loved. Lady Russell, her mother\'s dearest friend, had counseled her against the match. Captain Wentworth had then no fortune, no certain prospects, and Anne, only nineteen, had been persuaded to give him up. The decision had haunted her ever since. She had met no one who could replace him in her heart. Now, eight years later, the news came that Captain Wentworth\'s sister was to marry Admiral Croft, and that they were to take possession of Kellynch Hall, the Elliot family home.',
        farsi:
          'آن الیوت، در بیست‌وهفت سالگی، به‌سختی می‌توانست بسیار جوان شمرده شود؛ اما شکوفایی‌اش زود از بین رفته بود؛ و حتی زیبایی‌اش، که پدرش همیشه به آن مغرور بود، به زیباییِ آرام و ملایمی فرو رفته بود. هشت سال پیش، قانع شده بود مردی را که دوست می‌داشت رد کند. لیدی راسل، صمیمی‌ترین دوستِ مادرش، علیه این ازدواج مشورت داده بود. کاپیتان ونت‌ورث آن زمان نه ثروت داشت، نه چشم‌اندازِ قطعی، و آن، فقط نوزده ساله، قانع شده بود او را رها کند. این تصمین از آن زمان تا کنون آزارش می‌داد. با کسی روبرو نشده بود که در دلش جایگزینِ او شود. حالا، هشت سال بعد، خبر آمد که خواهرِ کاپیتان ونت‌ورث با ادمیرال کرافت ازدواج می‌کند، و آن‌ها قرار است کِلینچ هال، خانه‌ی خانوادگیِ الیوت، را در اختیار بگیرند.',
      },
      {
        english:
          'He was not at all proud of his sister\'s match. The Admiral was a fine man, but Lady Russell had a right to be concerned. Anne could not but feel that she was to encounter him. The Crofts were coming to Kellynch, and with them, perhaps, Captain Wentworth himself. Anne\'s feelings on the occasion were such as may be imagined. She had only to think of the past, and to remember that she had refused him. She had no expectation that he would still love her. He, perhaps, might not even remember her with kindness. Yet there was a sort of comfort in knowing that she would see him again. Eight years was a long time. He had grown in his profession; he was now a successful captain, and his sister\'s marriage to the Admiral would bring him into her neighborhood.',
        farsi:
          'او اصلاً به ازدواجِ خواهرش مغرور نبود. ادمیرال مردی خوب بود، اما لیدی راسل حق داشت نگران باشد. آن نمی‌توانست جز این احساس کند که قرار است با او روبرو شود. کرافت‌ها به کِلینچ می‌آمدند، و با آن‌ها، شاید، خودِ کاپیتان ونت‌ورث. احساساتِ آن در این موقعیت چنین بود که می‌توان تصور کرد. فقط کافی بود به گذشته فکر کند، و یاد کند که او را رد کرده بود. هیچ انتظاری نداشت که هنوز او را دوست داشته باشد. او، شاید، حتی با مهربانی او را به یاد نمی‌آورد. اما نوعی آرامش در دانستنِ اینکه دوباره او را خواهد دید بود. هشت سال مدتِ طولانی بود. او در حرفه‌اش رشد کرده بود؛ حالا کاپیتانِ موفقی بود، و ازدواجِ خواهرش با ادمیرال او را به محله‌ی او می‌آورد.',
      },
      {
        english:
          '"You pierce my soul. I am half agony, half hope. Tell me not that I am too late, that such precious feelings are gone for ever. I offer myself to you again with a heart even more your own, than when you almost broke it, eight years and a half ago. Let not any man tell me that I am too late. I have loved you alone. I may have been unjust, weak, resentful, but never inconstant. For you alone I think and plan. Have you not seen this? Could you have been so blind? I can listen no longer in silence. I must speak to you by such means as are within my reach. You pierce my soul!" Captain Wentworth placed the letter in Anne\'s hand, and walked away.',
        farsi:
          '«روحم را سوراخ می‌کنی. من نیمی عذابم، نیمی امید. به من نگو که دیر شده، که چنین احساساتِ گرانقدری برای همیشه رفته‌اند. خود را دوباره به تو پیشنهاد می‌کنم با دلی که حتی بیشتر از آنِ توست، تا وقتی که تقریباً آن را شکستی، هشت سال و نیم پیش. هیچ‌ مردی به من نگوید که دیر شده. تنها تو را دوست داشته‌ام. ممکن است بی‌انصاف، ضعیف، کینه‌مند بوده باشم، اما هرگز بی‌ثبات نه. برایِ تو تنها فکر می‌کنم و نقشه می‌کشم. این را ندیده‌ای؟ چنان کور بوده‌ای؟ دیگر نمی‌توانم در سکوت گوش دهم. باید با هر وسیله‌ای که در دسترسم است با تو صحبت کنم. روحم را سوراخ می‌کنی!» کاپیتان ونت‌ورث نامه را در دستِ آن گذاشت، و دور شد.',
      },
      {
        english:
          'Anne\'s happiness, in receiving such a letter, can hardly be described. She had never ceased to love Captain Wentworth, and now she knew that he had never ceased to love her. All those years of doubt, of silent suffering, of regret, were over. They walked together along the street, and talked, and explained, and forgave. The past was past; the future was theirs. There was still much to be settled, much to be done. Sir Walter would have to be persuaded; Lady Russell would have to acknowledge that she had been wrong; friends and family would have opinions. But Anne and Wentworth had each other, and that was enough. They had learned, through long years of separation, that no persuasion, however well-meant, should come between two hearts that truly love.',
        farsi:
          'خوشبختیِ آن در دریافتِ چنین نامه‌ای به‌سختی می‌توان توصیف کرد. هرگز از دوست‌داشتنِ کاپیتان ونت‌ورث دست برنداشته بود، و حالا می‌دانست او نیز هرگز از دوست‌داشتنِ او دست برنداشته بود. تمامِ آن سال‌هایِ شک، رنجِ خاموش، پشیمانی، تمام شد. با هم در خیابان راه رفتند، صحبت کردند، توضیح دادند، بخشیدند. گذشته گذشته بود؛ آینده از آنِ آن‌ها بود. هنوز چیزِ زیادی باید حل می‌شد، کارِ زیادی باید انجام می‌گرفت. سر والتر باید قانع می‌شد؛ لیدی راسل باید می‌پذیرفت که در اشتباه بوده؛ دوستان و خانواده نظر خواهند داشت. اما آن و ونت‌ورث هم را داشتند، و این کافی بود. از طریقِ سال‌های طولانیِ جدایی آموخته بودند که هیچ قانع‌کردنی، هرچند خیرخواهانه، نباید میانِ دو دلی که واقعاً عاشق‌اند فاصله اندازد.',
      },
    ],
  },
  {
    slug: 'treasure-island-classic',
    title: 'Treasure Island',
    author: 'Robert Louis Stevenson',
    description:
      'Young Jim Hawkins discovers a treasure map in the chest of a dying sailor and joins an expedition aboard the Hispaniola — only to find that the charming cook, Long John Silver, is plotting mutiny. The quintessential pirate adventure.',
    coverFrom: '#92400e',
    coverTo: '#451a03',
    coverAccent: '#fcd34d',
    genres: ['Adventure', 'Classic', 'Fiction'],
    level: 'B2',
    rating: 4.5,
    reviewCount: 820,
    viewCount: 9400,
    isPremium: false,
    publishedYear: 1883,
    pages: [
      {
        type: 'heading',
        english: 'Part One — The Old Buccaneer',
        farsi: 'بخشِ یکم — دزدِ دریاییِ پیر',
      },
      {
        english:
          'Squire Trelawney, Dr. Livesey, and the rest of these gentlemen having asked me to write down the whole particulars about Treasure Island, from the beginning to the end, keeping nothing back but the bearings of the island, and that only because there is still treasure not yet lifted, I take up my pen in the year of grace 17—and go back to the time when my father kept the Admiral Benbow inn and the brown old seaman with the sabre cut first took up his lodging under our roof. I remember him as if it were yesterday, as he came plodding to the inn door, his sea-chest following behind him in a hand-barrow; a tall, strong, heavy, nut-brown man, his tarry pigtail falling over the shoulders of his soiled blue coat, his hands ragged and scarred, with black, broken nails.',
        farsi:
          'اسکوایر تِرِلاونی، دکتر لایوسی و بقیه‌ی اینان از من خواستند که تمامِ جزئیاتِ ماجرا را درباره‌ی جزیره‌ی گنج، از آغاز تا پایان، بنویسم و چیزی را فرونگذارم، جز موقعیتِ جزیره، و آن هم فقط به این سبب که هنوز گنجی است که برنداشته‌اند. قلم به دست می‌گیرم در سالِ فضلِ ۱۷—، و به آن زمان بازمی‌گردم که پدرم مهمان‌خانه‌ی «آدمیرال بن‌بو» را نگه می‌داشت و آن ملوانِ پیرِ سمرنگ با زخمِ شمشیر نخستین‌بار زیرِ سقفِ ما منزل گرفت. او را چنان به یاد دارم که گویی دیروز بود؛ چون با قدم‌هایی سنگین به درِ مهمان‌خانه آمد، و صندوقِ دریایی‌اش در یک دست‌چرخِ دستی پشتِ سرش می‌آمد؛ مردی بلندقامت، نیرومند، سنگین و سمرنگ، گیسویِ قیراندودش بر شانه‌های کتِ آبیِ کثیفش می‌افتاد، دست‌هایش پینه‌بسته و زخمی بود، با ناخن‌های سیاهِ شکسته.',
      },
      {
        english:
          '"I\'ll tell you what I\'ll do, matey," he said, after he had been with us a week or so. "I\'ll give you a silver fourpenny every month, if you\'ll only keep your weather-eye open for a seafaring man with one leg, and let me know the moment he appears." I remember his laugh, which was big and bold and shook his whole body. He would tell stories of the most dreadful kind: hangings, storms at sea, murders, and strange deeds in foreign lands. He frightened the country people, who came to drink at our inn. He would call for a glass of rum, and bid me keep my eye open for the seafaring man with one leg, and tell me stories that made my blood run cold. I do not think I ever feared anything so much as that one-legged seafaring man.',
        farsi:
          '«به تو می‌گویم چه می‌کنم، یا رفیق،» گفت، پس از آنکه هفت روزی یا چیزی با ما بود. «هر ماه یک چهار‌پنیِ نقره به تو می‌دهم، اگر فقط چشمِ حواست را برایِ ملوانی دریایی با یک پا باز نگه داری، و به من بگویی لحظه‌ای که ظاهر می‌شود.» خنده‌اش را به یاد دارم، که بزرگ و جسور بود و تمامِ بدنش را می‌لرزاند. داستان‌هایی از وحشتناک‌ترین نوع می‌گفت: دار زدن، طوفان در دریا، قتل، و کارهای عجیب در سرزمین‌های دور. مردمِ روستا را می‌ترساند، که برایِ نوشیدن به مهمان‌خانه‌ی ما می‌آمدند. لیوان رُمی طلب می‌کرد، و به من می‌گفت چشمم را برایِ ملوانِ دریاییِ یک‌پا باز نگه دارم، و داستان‌هایی می‌گفت که خونم را یخ می‌کرد. فکر نمی‌کنم تا به حال از چیزی به‌اندازه‌ی آن ملوانِ دریاییِ یک‌پا ترسیده باشم.',
      },
      {
        english:
          'It was a bitter cold winter, with long hard frosts, and the heaviest snow I had ever seen. The Admiral Benbow was nearly empty. My father was ill, and my mother was busy. Then one afternoon, the captain came in, more drunk than I had ever seen him. He fell against the door, and lay still. I called to my mother, but she was upstairs with my father. The captain was dead. We found, when we searched his sea-chest, a packet wrapped in oilcloth. Inside the packet was a book, with strange writings in it, and a folded paper. I knew that the paper was a map. I could see the shape of an island, and the words: "Treasure Island." I ran to fetch Dr. Livesey. I knew that my father had died that morning, and that my mother was heartbroken, but the map burned in my pocket.',
        farsi:
          'زمستانی سرد و تلخ بود، با یخبندان‌هایِ طولانی و سخت، و سنگین‌ترین برفی که تا به حال دیده بودم. آدمیرال بن‌بو تقریباً خالی بود. پدرم بیمار بود، و مادرم سرگرم بود. آن‌گاه یک بعدازظهر، ناخدا آمد، مست‌تر از آنکه تا به حال دیده بودم. به در تکیه کرد، و بی‌حرکت ماند. به مادرم صدا زدم، اما او در طبقه‌ی بالا با پدرم بود. ناخدا مرده بود. وقتی صندوقِ دریایی‌اش را گشتیم، بسته‌ای در پارچه‌ی روغنی پیچیده پیدا کردیم. درونِ بسته کتابی بود، با نوشته‌های عجیب، و کاغذِ تا شده‌ای. می‌دانستم آن کاغذ نقشه بود. می‌توانستم شکلِ جزیره را ببینم، و کلمات: «جزیره‌ی گنج.» دویدم تا دکتر لایوسی را بیاورم. می‌دانستم پدرم آن صبح مرده بود، و مادرم دل‌شکسته بود، اما نقشه در جیبم می‌سوخت.',
      },
      {
        english:
          '"Trelawney," said the doctor, "I\'ll lay you any wager that the seafaring man with one leg that the captain was so afraid of, is Long John Silver. And I\'ll lay you another wager that he is the very man who planned the mutiny on the ship that bore the captain to his death." The Squire was indignant, but the doctor was right. They decided to fit out a ship, the Hispaniola, and to sail for Treasure Island. I was to go as cabin-boy. The Squire went to Bristol to find a crew, and there he met Long John Silver, who kept an inn called the "Spy-glass." Silver had only one leg. The Squire engaged him as cook, and Silver recommended many of the crew. I did not trust Silver. His smile was too ready, his tongue too smooth.',
        farsi:
          '«ترِلاونی،» دکتر گفت، «با تو هر شرطی بستم که آن ملوانِ دریاییِ یک‌پا که ناخدا چنان از او می‌ترسید، لانگ جان سیلور است. و شرطِ دیگری هم می‌بندم که او همان کسی است که شورش را در کشتیِ ناخدا برنامه‌ریزی کرد و او را به مرگ رساند.» اسکوایر خشمگین بود، اما دکتر حق داشت. تصمیم گرفتند کشتی‌ای، هیسبانیولا، تجهیز کنند، و به سویِ جزیره‌ی گنج بروند. من به‌عنوانِ کشتی‌پسربچه می‌رفتم. اسکوایر به بریستول رفت تا خدمه پیدا کند، و آن‌جا با لانگ جان سیلور روبرو شد، که مهمان‌خانه‌ای به نام «چشمِ جاسوس» نگه می‌داشت. سیلور فقط یک پا داشت. اسکوایر او را به‌عنوانِ آشپز گرفت، و سیلور بسیاری از خدمه را معرفی کرد. به سیلور اعتماد نداشتم. لبخندش بیش از حد آماده بود، زبانش بیش از حد نرم.',
      },
      {
        english:
          'We set sail from Bristol on a fair wind. The voyage was uneventful for many days. I grew familiar with the crew, and especially with the cook, Long John Silver, who had a parrot called Captain Flint. The parrot would scream, "Pieces of eight! Pieces of eight!" and Silver would laugh. He was always kind to me, and told me stories of the sea. But one night, when I had crawled into an apple barrel to get an apple, I overheard Silver talking to the young seaman, Israel Hands. "When we have the treasure," Silver said, "we will take the ship, and the Squire and the doctor and the boy will walk the plank." I held my breath. My heart pounded. I had discovered the mutiny.',
        farsi:
          'با بادِ موافق از بریستول بادبان کشیدیم. سفر برایِ روزهایِ بسیاری بدونِ حادثه بود. با خدمه آشنا شدم، و به‌ویژه با آشپز، لانگ جان سیلور، که طوطیی به نامِ کاپیتان فِلینت داشت. طوطی فریاد می‌زد، «هشت‌تکه! هشت‌تکه!» و سیلور می‌خندید. او همیشه با من مهربان بود، و داستان‌هایِ دریا برایم می‌گفت. اما یک شب، وقتی به بشکه‌ی سیب رفته بودم تا سیبی بگیرم، شنیدم سیلور با ملوانِ جوان، اسرائیل هندز، صحبت می‌کند. «وقتی گنج را داشته باشیم،» سیلور گفت، «کشتی را می‌گیریم، و اسکوایر و دکتر و پسربچه از تخته‌ی عریضِ کشتی به دریا می‌روند.» نفسم را نگه داشتم. دلم می‌تپید. شورش را کشف کرده بودم.',
      },
      {
        english:
          'I ran to the doctor and the Squire and told them everything. They were alarmed but resolute. "We must act as if we knew nothing," said the doctor. "We must wait for our chance." The next morning, we sighted land. The island was exactly as the map described it: a wild, hilly place, with a great mountain in the middle, and forests around the edges. The crew was restless. Silver was cheerful. We dropped anchor in a small cove, and the Squire allowed a third of the crew to go ashore for the day. I slipped away from the others and ran into the forest. I wanted to explore. I wanted to be alone. I ran until I could run no more, and then I fell down among the tall grasses, and listened to the strange birds and the wind in the trees.',
        farsi:
          'به‌سویِ دکتر و اسکوایر دویدم و همه‌چیز را گفتم. نگران اما مصمم بودند. «باید طوری رفتار کنیم که انگار چیزی نمی‌دانیم،» دکتر گفت. «باید منتظرِ فرصت‌مان بمانیم.» صبحِ بعد، خشکی را دیدیم. جزیره دقیقاً چنان بود که نقشه توصیفش می‌کرد: مکانِ وحشی و تپه‌ای، با کوهِ بزرگی در میانه، و جنگل‌هایی در اطراف. خدمه بی‌قرار بودند. سیلور شادمان بود. در یک آبدره‌ی کوچک لنگر انداختیم، و اسکوایر اجازه داد یک‌سومِ خدمه برایِ روز به خشکی بروند. من از دیگران جدا شدم و به جنگل دویدم. می‌خواستم کاوش کنم. می‌خواستم تنها باشم. آن‌قدر دویدم تا دیگر نتوانستم بدوم، آن‌گاه در میانِ علف‌های بلند افتادم، و به پرندگانِ عجیب و باد در درختان گوش دادم.',
      },
      {
        english:
          'It was on the island that I met Ben Gunn, a marooned sailor who had been left there three years before by Captain Flint. He was wild and strange, dressed in goatskins, and he had found the treasure. He had moved it, all by himself, to a cave on the north side of the island. He told me everything, and I brought the doctor to him. The doctor was overjoyed. With Ben Gunn\'s help, we defeated Silver and his men. The treasure was loaded onto the Hispaniola, and we set sail for home. Silver escaped with a bag of gold, and I never saw him again. We divided the treasure, and each of us had enough to live in comfort for the rest of our days. The parrot still screams in my dreams: "Pieces of eight! Pieces of eight!"',
        farsi:
          'در جزیره بود که با بن گان روبرو شدم، ملوانی طردشده که سه سال پیش توسطِ کاپیتان فلینت آنجا رها شده بود. وحشی و عجیب بود، با پوستِ بز پوشیده، و گنج را پیدا کرده بود. آن را، تماماً خودش، به غاری در سمتِ شمالِ جزیره برده بود. همه‌چیز را به من گفت، و من دکتر را به او آوردم. دکتر بسیار خوشحال شد. با کمکِ بن گان، سیلور و مردانش را شکست دادیم. گنج در هیسبانیولا بار شد، و به سویِ خانه بادبان کشیدیم. سیلور با کیسه‌ای از طلا فرار کرد، و من هرگز او را ندیدم. گنج را تقسیم کردیم، و هر کسمان به‌اندازه‌ای داشت تا بقیه‌ی عمر را در آسایش زندگی کند. طوطی هنوز در رؤیاهایم فریاد می‌زند: «هشت‌تکه! هشت‌تکه!»',
      },
    ],
  },
]

export const SEED_REVIEWS: {
  bookSlug: string
  userName: string
  userAvatar: string
  rating: number
  comment: string
}[] = [
  {
    bookSlug: 'alice-in-wonderland',
    userName: 'نگار محمدی',
    userAvatar: '',
    rating: 5,
    comment: 'تجربه‌ی خواندن دوزبانه فوق‌العاده‌ست. معنی هر کلمه را زدم و یاد گرفتم!',
  },
  {
    bookSlug: 'alice-in-wonderland',
    userName: 'Arman T.',
    userAvatar: '',
    rating: 4,
    comment: 'The page-turn animation feels real. Loved the sepia theme.',
  },
  {
    bookSlug: 'pride-and-prejudice',
    userName: 'سارا ک',
    userAvatar: '',
    rating: 5,
    comment: 'داستان بی‌نظیره و هوش مصنوعی به‌خوبی توضیح می‌ده. حتماً پیشنهاد می‌کنم.',
  },
  {
    bookSlug: 'sherlock-holmes-scandal',
    userName: 'Reza M.',
    userAvatar: '',
    rating: 5,
    comment: 'هولمز همیشه جذابه. بخش دیکشنریِ سریع عالیه.',
  },
  {
    bookSlug: 'treasure-island',
    userName: 'مریم رستمی',
    userAvatar: '',
    rating: 4,
    comment: 'ماجراجوییِ پرکشش. ترجمه‌ی فارسی روان و دقیقه.',
  },
  {
    bookSlug: 'call-of-the-wild',
    userName: 'Kian',
    userAvatar: '',
    rating: 5,
    comment: 'One of the best reading experiences I have had. The AI chat is surprisingly helpful.',
  },
  {
    bookSlug: 'the-wind-in-the-willows',
    userName: 'نگار کریمی',
    userAvatar: '',
    rating: 5,
    comment: 'حسِ گرمِ رودخانه و دوستیِ این چهار دوست واقعاً آرامش‌بخش است. ترجمه‌ی فارسی لطیف و دقیقه.',
  },
  {
    bookSlug: 'the-adventures-of-tom-sawyer',
    userName: 'Sina',
    userAvatar: '',
    rating: 5,
    comment: 'The bilingual reader is perfect for Twain\'s colloquial dialogue. Aunt Polly feels alive in both languages.',
  },
  {
    bookSlug: 'the-time-machine',
    userName: 'علی رضایی',
    userAvatar: '',
    rating: 4,
    comment: 'ایده‌ی بُعدِ چهارمِ زمان فوق‌العاده است. وقتی کلمه‌ی «duration» را زدم، هوش مصنوعی عالی توضیح داد.',
  },
  {
    bookSlug: 'the-picture-of-dorian-gray',
    userName: 'مرجان صدر',
    userAvatar: '',
    rating: 5,
    comment: 'نثرِ وایلد چنان زیباست که دوزبانه خواندنش لذتِ دوچندان می‌دهد. پرتره‌ی هولناک تا مدتی در ذهنم ماند.',
  },
  {
    bookSlug: 'robinson-crusoe',
    userName: 'Farhad',
    userAvatar: '',
    rating: 4,
    comment: 'A patient, deliberate opening. The reader\'s continuous-scroll mode suits Defoe\'s slow, meditative prose perfectly.',
  },
  {
    bookSlug: 'anne-of-green-gables',
    userName: 'سحر یزدانی',
    userAvatar: '',
    rating: 5,
    comment: 'آن دخترِ سرخ‌مویه‌ی پرانرژیِ دلبریِ همگی می‌کند. مترجمِ فارسی لحنِ شوخ‌طبعِ او را خوب حفظ کرده.',
  },
  {
    bookSlug: 'secret-garden',
    userName: 'پارسا م',
    userAvatar: '',
    rating: 4,
    comment: 'باغِ رازآلود و جادویِ طبیعت. خواندنِ دوزبانه برای یادگیریِ واژگانِ مرتبط با باغ و گیاه عالیه.',
  },
  {
    bookSlug: 'peter-pan',
    userName: 'نسترن ا',
    userAvatar: '',
    rating: 5,
    comment: 'پسربچه‌ای که هرگز بزرگ نمی‌شود! دیالوگ‌های انگلیسی کوتاه و ساده‌اند و برای سطحِ B1 مناسب‌هستند.',
  },
  {
    bookSlug: 'the-little-prince',
    userName: 'امیر ت',
    userAvatar: '',
    rating: 5,
    comment: 'شاهکارِ ساده-به‌نظرِ اگزوپری. ترجمه‌ی فارسی لحنِ شاعرانه را حفظ کرده. آخرِ داستان بغضم گرفت.',
  },
  {
    bookSlug: 'frankenstein',
    userName: 'الهام نوری',
    userAvatar: '',
    rating: 4,
    comment: 'شروعِ نامه‌نگاری با مارگارت جذاب است. هوش مصنوعی به‌خوبی مفاهیمِ علمیِ پیچیده را ساده می‌کند.',
  },
  {
    bookSlug: 'a-christmas-carol',
    userName: 'مریم احمدی',
    userAvatar: '',
    rating: 5,
    comment: 'اسکروژ و سه روحِ کریسمس — یکی از زیباترین داستان‌هایِ دیکنز. ترجمه‌ی فارسی لحنِ اخلاقیِ او را خوب حفظ کرده. شبِ کریسمس آن را خواندم و واقعاً لذت بردم.',
  },
  {
    bookSlug: 'legend-of-sleepy-hollow',
    userName: 'حسین رضایی',
    userAvatar: '',
    rating: 4,
    comment: 'فضایِ مه‌آلودِ روستایِ هلندی و سوارکارِ بی‌سر واقعاً هولناک است. برایِ خواندنِ شبِ هالووین عالیه. صحنه‌ی تعقیب‌وگریز پایانی نفس‌گیر بود.',
  },
  {
    bookSlug: 'wonderful-wizard-of-oz',
    userName: 'زهرا کریمی',
    userAvatar: '',
    rating: 5,
    comment: 'دوروتی و توتو و مترسک و شیرِ بزدل — قهرمان‌هایِ کودکی‌ام. متنِ انگلیسی ساده و ترجمه‌ی فارسی روان. برایِ سطحِ A2 فوق‌العاده‌ست.',
  },
  {
    bookSlug: 'through-the-looking-glass',
    userName: 'مریم توکلی',
    userAvatar: '',
    rating: 4,
    comment: 'بازیِ کلماتِ کارول در دوزبانه لذتِ دوچندان می‌دهد. هامپتی دامپتی و فعل‌های مغرور فوق‌العاده‌ست. خواندنِ دیالوگ‌ها کنار هم خیلی جالب بود.',
  },
  {
    bookSlug: 'call-of-the-wild-classic',
    userName: 'حسین مرادی',
    userAvatar: '',
    rating: 5,
    comment: 'باکِ سگ و جان تورنتون — داستانِ عشقِ بینِ انسان و حیوان. ترجمه‌ی صحنه‌هایِ برف و یخ و سورتمه عالیه. پایانش هم غم‌انگیز و هم زیباست.',
  },
  {
    bookSlug: 'importance-of-being-earnest',
    userName: 'زهرا نوری',
    userAvatar: '',
    rating: 5,
    comment: 'کمدیِ وایلد در همان نخستین صفحه می‌ترکاند. دیالوگ‌هایِ آلجرنون و جک فوق‌العاده‌ی ظریف است. ساندویچِ خیار و کیفِ دستیِ ویکتوریا بی‌فراموش!',
  },
  {
    bookSlug: 'persuasion',
    userName: 'مریم صادقی',
    userAvatar: '',
    rating: 4,
    comment: 'آرام‌ترین رمانِ آستن، و شاید عمیق‌ترین. نامه‌ی ونت‌ورث قلبم را لرزاند. هشت سالِ انتظار و یک فرصتِ دوباره — داستانِ واقعیِ بزرگسالی.',
  },
  {
    bookSlug: 'treasure-island-classic',
    userName: 'حسین کاظمی',
    userAvatar: '',
    rating: 5,
    comment: 'ماجراجوییِ کامل! لانگ جان سیلور با طوطی‌اش همیشه در ذهنم می‌ماند. ترجمه‌ی فارسی اصطلاحاتِ دریایی را خوب نگه داشته. بشکه‌ی سیبِ جک بی‌نظیر بود.',
  },
]
