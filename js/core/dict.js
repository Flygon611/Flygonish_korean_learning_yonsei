/* -------------------------------------------------------------------- dict
   Two jobs:
     1. one flat index of every word the textbook teaches, so any word in any
        dialogue can be tapped and explained;
     2. a best-effort analyser that splits an arbitrary Korean sentence and
        works back from a conjugated form to its dictionary form.
   It is a study aid, not a morphological analyser — when it cannot resolve a
   token it says so plainly instead of guessing. */
(function () {
  const YK = (window.YK = window.YK || {});

  /* words the textbook assumes but does not always list */
  const EXTRA = [
    ['좀', '一点 / 请'], ['제', '我的（저의）'], ['수', '（能做/不能做的）办法'],
    ['한', '一个'], ['아', '啊'], ['그래요', '是啊 / 好的'],
    ['않다', '不（먹지 않습니다）', 4],
    /* Words that occur in the textbook sentences but are not vocabulary items:
       without these, tapping them in a dialogue finds nothing. The lesson is
       where the word first appears. */
    ['담배', '香烟', 1], ['서울', '首尔', 1], ['키', '个子，身高', 1], ['그분', '那位', 1],
    ['이분', '这位', 1], ['고기', '肉', 1], ['생선', '鱼', 1],
    ['방', '房间', 2], ['설악산', '雪岳山', 2], ['농구', '篮球', 2], ['야구', '棒球', 2],
    ['구두', '皮鞋', 2], ['일본말', '日语', 2], ['건물', '建筑，楼', 2], ['질문', '提问', 2],
    ['교수님', '教授（敬称）', 2], ['고양이', '猫', 2], ['강원도', '江原道', 2],
    ['신문', '报纸', 3],
    ['날', '日子，天', 4], ['물건', '东西，物品', 4], ['파티', '聚会', 4], ['김치', '泡菜', 4],
    ['기분', '心情', 4], ['기숙사', '宿舍', 4], ['남대문시장', '南大门市场', 4],
    ['녹차', '绿茶', 4], ['홍차', '红茶', 4],
    ['시험', '考试', 5], ['종로', '钟路', 5], ['손', '手', 5], ['졸업', '毕业', 5],
    ['전', '之前', 6], ['제목', '题目，标题', 6], ['냉장고', '冰箱', 6], ['우산', '雨伞', 6],
    ['시내', '市内，市区', 6],
    ['영어', '英语', 7], ['건강', '健康', 7], ['박물관', '博物馆', 7], ['쓰레기', '垃圾', 7],
    ['잠실역', '蚕室站', 7], ['야채', '蔬菜', 7], ['젓가락', '筷子', 7], ['배추', '白菜', 7],
    ['아르바이트', '打工', 7],
    ['연극', '话剧', 8], ['잠깐', '一会儿', 8], ['축구', '足球', 8], ['바다', '海', 8],
    ['스트레스', '压力', 8], ['당신', '您', 8],
    ['후', '之后', 9], ['좌회전', '左转', 9], ['구름', '云', 9], ['피아노', '钢琴', 9],
    ['목소리', '嗓音', 9], ['어머님', '母亲（敬称）', 9], ['아버님', '父亲（敬称）', 9],
    ['연세대학교', '延世大学', 9],
    ['때', '时候', 10], ['하루', '一天', 10], ['한자', '汉字', 10], ['대사관', '大使馆', 10],
    ['동안', '期间', 10], ['제주도', '济州岛', 10], ['손님', '客人', 10], ['일주일', '一周', 10],
    ['소리', '声音', 10], ['운전', '驾驶', 10], ['계획', '计划', 10], ['방울', '滴', 10],
    ['준비하다', '准备', 4], ['생각하다', '想，认为', 4], ['질문하다', '提问', 4],
    ['운전하다', '开车', 7], ['청소하다', '打扫', 7], ['요리하다', '做菜', 7],
    ['졸업하다', '毕业', 5], ['소개하다', '介绍', 2], ['걱정하다', '担心', 8],
    ['시작하다', '开始', 5], ['사랑하다', '爱', 8], ['여행하다', '旅行', 10],
    ['비빔밥', '拌饭'], ['꽃', '花'], ['모두', '都 / 全部'], ['시월', '十月'],
    ['인분', '人份'], ['싶다', '想（고 싶다）'], ['어떻다', '怎么样'],
    ['매일', '每天'], ['요일', '星期'], ['한번', '一次'], ['다음에', '下次'],
    ['먼저', '首先'], ['그때', '那时'], ['이따가', '待会儿'], ['나중에', '以后'],
    ['아마', '大概'], ['아직', '还'], ['거의', '几乎'], ['특히', '尤其'],
    ['같이', '一起'], ['따로', '单独'], ['서로', '互相'], ['직접', '亲自'],
    ['복잡하다', '复杂 / 拥挤'], ['맛있다', '好吃'], ['재미있다', '有趣'],
    ['계시다', '在（敬语）'], ['말씀하시다', '说（敬语）'],
    ['여름', '夏天'], ['취미', '爱好'], ['걸리다', '花费（时间）'],
    ['목요일', '星期四'], ['아름답다', '美丽'], ['세우다', '停（车）'],
    ['가르치다', '教'], ['전화하다', '打电话'], ['드리다', '给（谦语）'],
 ['잠실', '蚕室'], ['걸리다', '花费（时间）'],
    ['세우다', '停下 / 建立'], ['드리다', '给（谦语）'], ['같다', '像 / 一样'],
    ['전화하다', '打电话'], ['이해하다', '理解'], ['파랗다', '蓝'],
    ['이렇다', '这样'], ['그렇다', '那样'], ['저렇다', '那样（远）'],
    ['알겠습니다', '知道了'], ['모르겠습니다', '不知道'],
 ['어때요', '怎么样？'], ['어떻다', '怎么样'],
    ['거', '东西（것的口语）'], ['것', '东西'], ['분', '位（敬称）'], ['사람들', '人们'],
    ['신촌', '新村'], ['연세', '延世'], ['고향', '故乡'], ['불고기', '烤肉'],
    ['탁구', '乒乓球'], ['지하철역', '地铁站'], ['학생회관', '学生会馆'],
    ['할머니', '奶奶'], ['할아버지', '爷爷'], ['아내', '妻子'], ['남편', '丈夫'],
    ['아들', '儿子'], ['딸', '女儿'], ['아이', '孩子'], ['어른', '大人'],
    ['이번', '这次'], ['다음', '下次'], ['지난', '上一个'], ['작년', '去年'],
    ['올해', '今年'], ['내년', '明年'], ['아직', '还'], ['벌써', '已经'],
    ['빨리', '快'], ['천천히', '慢'], ['조금', '一点'], ['아주', '很'],
    ['정도', '程度'], ['쯤', '左右'], ['번', '次'], ['명', '名（人）'],
    ['권', '本（量词）'], ['병', '瓶'], ['잔', '杯'], ['그릇', '碗'],
    ['한국어를', '韩国语（宾格）'],
    ['네', '是 / 你的'], ['예', '是（更正式）'], ['아니요', '不'], ['아니', '不（半语）'],
    ['저', '我（谦称）'], ['나', '我（半语）'], ['너', '你（半语）'], ['우리', '我们'],
    ['이', '这'], ['그', '那'], ['저것', '那个（远）'], ['여기', '这里'],
    ['거기', '那里'], ['저기', '那里（远）'], ['어디', '哪里'],
    ['누구', '谁'], ['무엇', '什么'], ['뭐', '什么（口语）'], ['왜', '为什么'],
    ['언제', '什么时候'], ['어떻게', '怎么'], ['얼마', '多少（钱）'],
    ['몇', '几'], ['어느', '哪个'], ['무슨', '什么（的）'], ['어떤', '什么样的'],
    ['있다', '有 / 在'], ['없다', '没有'], ['하다', '做'], ['되다', '成为'],
    ['이다', '是'], ['아니다', '不是'], ['그렇다', '是的 / 那样'],
    ['안', '不（否定副词）'], ['못', '不能'], ['잘', '好 / 好好地'],
    ['아주', '非常'], ['매우', '非常'], ['너무', '太'], ['조금', '一点'],
    ['많이', '很多'], ['정말', '真的'], ['진짜', '真的（口语）'], ['별로', '不太（后接否定）'],
    ['그리고', '并且'], ['그런데', '但是'], ['그래서', '所以'], ['하지만', '但是'],
    ['그럼', '那么'], ['그러면', '那么'], ['먼저', '首先'], ['다시', '再'],
    ['같이', '一起'], ['함께', '一起'], ['혼자', '一个人'], ['자주', '经常'],
    ['가끔', '偶尔'], ['항상', '总是'], ['보통', '通常'], ['요즘', '最近'],
    ['지금', '现在'], ['오늘', '今天'], ['내일', '明天'], ['어제', '昨天'],
    ['아침', '早上'], ['점심', '中午'], ['저녁', '晚上'], ['밤', '夜晚'],
    ['월요일', '星期一'], ['화요일', '星期二'], ['수요일', '星期三'],
    ['목요일', '星期四'], ['금요일', '星期五'], ['토요일', '星期六'], ['일요일', '星期日'],
    ['주말', '周末'], ['지난주', '上周'], ['이번 주', '这周'], ['다음 주', '下周'],
    ['하나', '一'], ['둘', '二'], ['셋', '三'], ['넷', '四'], ['다섯', '五'],
    ['여섯', '六'], ['일곱', '七'], ['여덟', '八'], ['아홉', '九'], ['열', '十'],
    ['일', '一（汉字词）'], ['이', '二（汉字词）'], ['삼', '三（汉字词）'],
    ['사', '四（汉字词）'], ['오', '五（汉字词）'], ['육', '六（汉字词）'],
    ['칠', '七（汉字词）'], ['팔', '八（汉字词）'], ['구', '九（汉字词）'], ['십', '十（汉字词）'],
    ['백', '百'], ['천', '千'], ['만', '万'], ['원', '韩元'],
    ['분', '位（敬称）/ 分'], ['명', '名'], ['개', '个'], ['번', '次 / 号'],
    ['시', '点（时刻）'], ['시간', '小时'], ['살', '岁'], ['년', '年'], ['월', '月'], ['일', '日'],
    ['씨', '先生 / 小姐（接姓后）'], ['님', '您（敬称后缀）'],
    ['한국', '韩国'], ['한국어', '韩国语'], ['한국말', '韩国话'],
    ['중국', '中国'], ['일본', '日本'], ['미국', '美国'], ['영국', '英国'],
    ['러시아', '俄罗斯'], ['호주', '澳大利亚'],
    ['사람', '人'], ['친구', '朋友'], ['가족', '家人'], ['부모님', '父母'],
    ['아버지', '父亲'], ['어머니', '母亲'], ['형', '哥哥（男称）'], ['오빠', '哥哥（女称）'],
    ['누나', '姐姐（男称）'], ['언니', '姐姐（女称）'], ['동생', '弟弟 / 妹妹'],
    ['선생님', '老师'], ['학생', '学生'], ['대학생', '大学生'], ['회사원', '公司职员'],
    ['의사', '医生'], ['간호사', '护士'], ['기자', '记者'], ['변호사', '律师'],
    ['가수', '歌手'], ['경찰', '警察'], ['은행원', '银行职员'], ['비서', '秘书'],
    ['집', '家'], ['학교', '学校'], ['회사', '公司'], ['은행', '银行'],
    ['도서관', '图书馆'], ['식당', '餐厅'], ['교실', '教室'], ['화장실', '洗手间'],
    ['가게', '商店'], ['시장', '市场'], ['병원', '医院'], ['역', '车站'],
    ['공항', '机场'], ['지하철', '地铁'], ['버스', '公共汽车'], ['택시', '出租车'],
    ['기차', '火车'], ['비행기', '飞机'], ['자전거', '自行车'],
    ['물', '水'], ['밥', '饭'], ['음식', '食物'], ['과일', '水果'],
    ['커피', '咖啡'], ['차', '茶'], ['술', '酒'], ['빵', '面包'],
    ['책', '书'], ['공책', '笔记本'], ['연필', '铅笔'], ['볼펜', '圆珠笔'],
    ['지우개', '橡皮'], ['가방', '包'], ['지갑', '钱包'], ['열쇠', '钥匙'],
    ['옷', '衣服'], ['모자', '帽子'], ['신발', '鞋'], ['돈', '钱'],
    ['날씨', '天气'], ['봄', '春天'], ['여름', '夏天'], ['가을', '秋天'], ['겨울', '冬天'],
    ['비', '雨'], ['눈', '雪 / 眼睛'], ['바람', '风'], ['하늘', '天空'],
    ['전화', '电话'], ['휴대폰', '手机'], ['인터넷', '网络'], ['컴퓨터', '电脑'],
    ['영화', '电影'], ['음악', '音乐'], ['노래', '歌'], ['사진', '照片'],
    ['운동', '运动'], ['여행', '旅行'], ['휴일', '假日'], ['방학', '假期'],
    ['생일', '生日'], ['이름', '名字'], ['나이', '年龄'], ['직업', '职业'],
    ['주소', '地址'], ['번호', '号码'], ['시간', '时间'], ['약속', '约定'],
    ['안녕하세요', '你好'], ['안녕하십니까', '您好（正式）'],
    ['감사합니다', '谢谢'], ['고맙습니다', '谢谢'], ['죄송합니다', '对不起'],
    ['미안합니다', '对不起'], ['실례합니다', '打扰一下'], ['괜찮아요', '没关系 / 不错'],
    ['반갑습니다', '很高兴（见到你）'], ['처음', '第一次'], ['뵙겠습니다', '拜见（谦语）'],
    ['맛있다', '好吃'], ['재미있다', '有趣'], ['바쁘다', '忙'], ['좋다', '好'],
    ['나쁘다', '坏'], ['크다', '大'], ['작다', '小'], ['많다', '多'], ['적다', '少'],
    ['춥다', '冷'], ['덥다', '热'], ['예쁘다', '漂亮'], ['아름답다', '美丽'],
    ['어렵다', '难'], ['쉽다', '容易'], ['비싸다', '贵'], ['싸다', '便宜'],
    ['가다', '去'], ['오다', '来'], ['보다', '看'], ['사다', '买'],
    ['팔다', '卖'], ['주다', '给'], ['받다', '收'], ['만나다', '见面'],
    ['먹다', '吃'], ['마시다', '喝'], ['자다', '睡'], ['일어나다', '起床'],
    ['공부하다', '学习'], ['일하다', '工作'], ['쉬다', '休息'], ['놀다', '玩'],
    ['읽다', '读'], ['쓰다', '写 / 用'], ['듣다', '听'], ['말하다', '说'],
    ['배우다', '学'], ['가르치다', '教'], ['알다', '知道'], ['모르다', '不知道'],
    ['좋아하다', '喜欢'], ['싫어하다', '讨厌'], ['살다', '住'], ['있다', '在 / 有'],
  ];

  let index = null;
  const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();

  function build() {
    if (index) return index;
    index = Object.create(null);
    /* Same spelling, different meaning is normal in Korean: 눈 is both snow and
       an eye, 배 is a pear, a boat and a belly. The first version kept only the
       first definition, so every other sense was silently dropped. Now all of
       them are kept and the lookup hands back the list. */
    const put = (ko, zh, lesson, src) => {
      const k = clean(ko);
      const z = clean(zh);
      if (!k || !z) return;
      const list = index[k] || (index[k] = []);
      if (list.some((e) => e.zh === z)) return;
      list.push({ ko: k, zh: z, lesson: lesson || 0, src: src || 'vocab' });
    };
    for (const lesson of (window.YK_LESSONS?.lessons || [])) {
      for (const sec of lesson.sections) {
        for (const v of (sec.vocab || [])) put(v.ko, v.zh, lesson.no, 'vocab');
        for (const g of (sec.grammar || [])) {
          for (const ex of (g.examples || [])) { /* sentences stay out of the index */ }
        }
      }
    }
    // a third element marks the lesson where the word is actually taught
    for (const [ko, zh, lesson] of EXTRA) put(ko, zh, lesson || 0, 'extra');
    for (const p of (window.YK_CAST || [])) {
      put(p.ko, `${p.zh} · ${p.jobZh}`, 0, 'cast');
      put(p.short, `${p.zh} · ${p.jobZh}`, 0, 'cast');
    }
    return index;
  }

  /* particles, longest first, so 습니다-style endings never get mistaken */
  const JOSA = ['에서는', '에서도', '에게서', '으로서', '으로써', '에게는', '한테서',
    '이라고', '이라는', '이라도', '이라서', '이라야', '이란', '이라는', '이랑은',
    '하고는', '부터는', '까지는', '보다는', '에서는', '으로는', '이라', '라는',
    '이랑', '하고', '에서', '에게', '한테', '으로', '로서', '로써', '까지',
    '부터', '보다', '처럼', '대로', '마다', '밖에', '조차', '마저', '이나', '에는', '이지요', '이지', '이죠', '이에요', '이라도', '이란',
    '이','가','은','는','을','를','에','의','와','과','도','만','랑','나','로','께'];

  const ENDINGS = [
    '입니다', '입니까', '이었습니다', '였습니다', '이에요', '예요',
    /* 하다 verbs: 졸업합니다 is 졸업 + 하 + ㅂ니다, and '합니다' was not in the
       list, so the whole form failed even though 졸업 is in the dictionary */
    '합니다', '합니까', '했습니다', '했습니까', '하십시오', '하세요', '하겠습니다',
    '겠습니다', '겠어요', '시다', '니다', '을까요', 'ㄹ까요', '을까', 'ㄹ까', '까요',
    '습니다', 'ㅂ니다', '십시오', '으십시오', '습니까', 'ㅂ니까', '읍시다', 'ㅂ시다',
    '었습니다', '았습니다', '였습니다', '었어요', '았어요', '였어요',
    '으세요', '세요', '어요', '아요', '여요', '해요',
    '으니까', '니까', '으면서', '면서', '으려고', '려고', '으러', '러',
    '을까요', 'ㄹ까요', '을게요', 'ㄹ게요', '게요', '을게', 'ㄹ게', '을래요', 'ㄹ래요', '래요',
    '해서', '하여서', '해', '해요',
    '은데', '는데', 'ㄴ데', '지만', '어서', '아서', '여서', '으면', '면',
    '었', '았', '였', '했',
    '네요', '군요', '지요', '죠', '네', '다', '까', '지', '기', '게', '고',
    '서', '며', '나', '요', '은', '을', '는', 'ㄹ', '음', 'ㅁ', '어', '아', '여',
  ];

  /* ---- hangul syllable surgery, for forms the ending list cannot reach ---- */

  const { CHO, JUNG, JONG, COMPOUND, isHangul, split, join, withLast, addJong, dropJong } = YK.jamo;

  function uncontracted(word) {
    /* Only the final syllable can carry a contraction (마시+어 -> 마셔).
       Expanding earlier syllables would mangle the rest of the word. */
    let tail = '';
    if (word.length > 1 && word.endsWith('요')) { tail = '요'; word = word.slice(0, -1); }
    if (!word) return tail;
    const last = word[word.length - 1];
    if (!isHangul(last)) return word + tail;
    const { cho, jung, jong } = split(last);
    if (!COMPOUND[jung]) return word + tail;
    const [a, b] = COMPOUND[jung];
    return word.slice(0, -1) + join(cho, a, '') + join('ㅇ', b, jong) + tail;
  }

  /* ㅂ/ㄷ/ㅅ/르 irregular stems cannot be reconstructed from the conjugated
     form alone, so the common ones are listed explicitly. */
  const IRREGULAR = {
    '더워': '덥다', '추워': '춥다', '매워': '맵다', '어려워': '어렵다',
    '쉬워': '쉽다', '아름다워': '아름답다', '가까워': '가깝다', '무거워': '무겁다',
    '가벼워': '가볍다', '도와': '돕다', '고와': '곱다', '반가워': '반갑다',
    '들어': '듣다', '걸어': '걷다', '물어': '묻다', '실어': '싣다',
    '나아': '낫다', '지어': '짓다', '부어': '붓다', '이어': '잇다',
    '몰라': '모르다', '빨라': '빠르다', '불러': '부르다', '골라': '고르다',
    '흘러': '흐르다', '써': '쓰다', '커': '크다', '바빠': '바쁘다',
    '예뻐': '예쁘다', '슬퍼': '슬프다',
    '더우': '덥다', '추우': '춥다', '매우': '맵다', '어려우': '어렵다',
    '쉬우': '쉽다', '아름다우': '아름답다', '가까우': '가깝다',
    '무거우': '무겁다', '가벼우': '가볍다', '반가우': '반갑다',
    '도우': '돕다', '고우': '곱다',
  };

  /* stem tweaks: ㅆ past, honorific 시, and stems whose final consonant is
     dropped or swapped when an ending is attached. */
  function stemVariants(stem) {
    const out = [stem];
    const last = stem[stem.length - 1];
    if (last && isHangul(last)) {
      const { cho, jung, jong } = split(last);
      const bare = () => stem.slice(0, -1) + join(cho, jung, '');

      if (jong === 'ㅆ') {
        // 갔어요 -> 가다, 만났어요 -> 만나다, 마셨어요 -> 마시다, 했어요 -> 하다
        if (COMPOUND[jung]) out.push(stem.slice(0, -1) + join(cho, COMPOUND[jung][0], ''));
        out.push(bare());
        if (jung === 'ㅐ') {
          out.push(stem.slice(0, -1) + join(cho, 'ㅏ', ''));      // 했어요 -> 하다
          out.push(stem.slice(0, -1) + join(cho, 'ㅓ', 'ㅎ'));    // 어땠어요 -> 어떻다
        }
      } else if (cho === 'ㅅ' && jung === 'ㅣ' && !jong) {
        out.push(stem.slice(0, -1));              // 하셨어요 -> 하다
      }

      if (jong === 'ㄹ') {
        out.push(bare());                          // 갈까요 -> 가다, 살다 -> 사다
        out.push(stem.slice(0, -1) + join(cho, jung, 'ㄷ')); // 듣다 -> 들
      } else if (jong === 'ㄷ') {
        out.push(stem.slice(0, -1) + join(cho, jung, 'ㄹ')); // 듣다
      } else if (jong === 'ㅂ') {
        out.push(bare());                          // 갑니다 -> 가다, 합니다 -> 하다
        out.push(stem.slice(0, -1) + join(cho, jung, 'ㅜ')); // ㅂ irregular -> 더워요
      } else if (jong && jong !== 'ㅆ') {
        out.push(bare());                          // 탄다 -> 타다, 있니다 -> 이다
      }

      if (jung === 'ㅡ') out.push(stem.slice(0, -1));   // 쓰다 -> 써요
    }
    /* 하시 + 었 -> 하셨: the honorific 시 only becomes visible one level down */
    for (const v of out.slice()) {
      const l = v[v.length - 1];
      if (l && isHangul(l)) {
        const { cho, jung, jong } = split(l);
        if (cho === 'ㅅ' && jung === 'ㅣ' && !jong) out.push(v.slice(0, -1));
      }
    }
    return Array.from(new Set(out));
  }

  /* A candidate only counts if it could actually BE the verb behind this stem.
     Without this, findVerb('압') walked down to the bare stem '하' and matched
     하다, so 압니다 in "나는 저 사람을 압니다" was glossed as "to do". */
  function plausible(stem, ko) {
    const base = ko.replace(/다$/, '');
    if (!stem || !base) return false;
    if (stem[0] === base[0]) return true;
    if (stem.length === 1 && base.length === 1) {
      const a = split(stem), b = split(base);
      /* the past tense also merges ㅐ into ㅏ: 했습니다 -> 하다 */
      const sameVowel = a && b && (a.jung === b.jung || (a.jung === 'ㅐ' && b.jung === 'ㅏ'));
      return !!(a && b && a.cho === b.cho && sameVowel);
    }
    return false;
  }

  function findVerb(stem) {
    const idx = build();
    if (IRREGULAR[stem] && idx[IRREGULAR[stem]]) return idx[IRREGULAR[stem]][0];
    for (const base of stemVariants(stem)) {
      if (IRREGULAR[base] && idx[IRREGULAR[base]]) return idx[IRREGULAR[base]][0];
      const cands = [base + '다', base + '하다'];
      if (/하$/.test(base)) cands.push(base.slice(0, -1) + '하다');
      for (const c of cands) if (idx[c] && plausible(stem, idx[c][0].ko)) return idx[c][0];
      /* The bare stem used to be accepted too, and that matched ANY entry:
         않습니다 reduced `않` to `아` and cheerfully returned the interjection
         아 "啊". findVerb promises a predicate, so a bare stem only counts when
         it really is one. */
      if (idx[base] && /다$/.test(base)) return idx[base][0];
    }
    return null;
  }

  /* look a single token up; returns { entry, via } or null */
  function lookup(raw) {
    const idx = build();
    const w = clean(raw).replace(/[.,?!。，？！"'()\[\]]+$/g, '');
    if (!w) return null;
    if (/^\d+$/.test(w)) return { entry: { ko: w, zh: '数字', lesson: 0, src: 'extra' }, via: 'number' };
    if (idx[w]) return { entry: idx[w][0], entries: idx[w], via: 'exact' };

    const forms = w === uncontracted(w) ? [w] : [w, uncontracted(w)];
    const plain = findVerb(w);
    if (plain) return { entry: plain, via: 'bare' };
    if (w === '해' || w === '해요') {
      const v = findVerb('하');
      if (v) return { entry: v, via: 'ending' };
    }

    for (const form of forms) {
      for (const j of JOSA) {
        if (form.length > j.length && form.endsWith(j)) {
          const stem = form.slice(0, -j.length);
          if (idx[stem]) return { entry: idx[stem][0], entries: idx[stem], via: 'stem', suffix: j };
          const v = findVerb(stem);
          if (v) return { entry: v, via: 'stem', suffix: j };
        }
      }
      for (const e of ENDINGS) {
        if (form.length > e.length && form.endsWith(e)) {
          const stem = form.slice(0, -e.length);
          /* 알 + ㅂ니다 -> 압니다, 만들 + ㅂ니다 -> 만듭니다: an ㄹ-final verb
             drops its ㄹ and the ㅂ lands on the stem syllable. Undo that
             first, otherwise 압니다 only ever looks like 압 + 니다. */
          if ((e === '니다' || e === '니까') && stem.length) {
            const lastCh = stem[stem.length - 1];
            const sp = isHangul(lastCh) ? split(lastCh) : null;
            if (sp && sp.jong === 'ㅂ') {
              const restored = stem.slice(0, -1) + join(sp.cho, sp.jung, 'ㄹ');
              const rv = findVerb(restored);
              if (rv) {
                /* 삽니다 is both 살다 (to live) and 사다 (to buy): same shape,
                   two verbs. Listing both beats silently picking one. */
                const alt = findVerb(stem);
                const list = [rv];
                if (alt && alt.ko !== rv.ko) list.push(alt);
                return { entry: rv, entries: list, via: 'ending', suffix: e };
              }
            }
          }
          /* a verbal ending means the stem is a verb: 전화해 -> 전화하다, not 전화 */
          const v = findVerb(stem);
          if (v) return { entry: v, via: 'ending', suffix: e };
          if (idx[stem]) return { entry: idx[stem][0], entries: idx[stem], via: 'ending', suffix: e };
        }
      }
    }
    return null;
  }

  /* whole-sentence analysis, used by the 사전 page */
  function analyze(sentence) {
    const out = [];
    for (const t of YK.tokens(sentence)) {
      if (t.kind === 'space') { out.push({ kind: 'space' }); continue; }
      if (t.kind === 'punct') { out.push({ kind: 'punct', text: t.text }); continue; }
      const hit = lookup(t.text);
      out.push({
        kind: 'word',
        text: t.text,
        entry: hit ? hit.entry : null,
        guessed: hit ? false : false,
        unknown: !hit,
      });
    }
    return out;
  }

  const all = () => [].concat.apply([], Object.values(build()));
  const size = () => Object.keys(build()).length;

  YK.dict = { lookup, analyze, all, size, build,
    _dbg: { uncontracted, findVerb, stemVariants, ENDINGS, JOSA } };
})();
