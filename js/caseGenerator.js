// ==============================
// AI 案件生成引擎 - 迷雾侦探
// 使用程序化生成模拟AI叙事
// ==============================

const CaseGenerator = {
  // ---------- 案件模板 ----------
  templates: [
    {
      type: '谋杀',
      settings: ['豪华庄园', '海边别墅', '城市公寓', '山顶旅馆', '古旧剧院', '科研中心', '博物馆', '游艇'],
      introThemes: [
        '清晨，{setting}的管家在{room}发现了{victim}的遗体。现场没有强行闯入的痕迹，凶手很可能就在这座{setting}之中。',
        '{victim}——一位著名的{occupation}——被发现在{setting}的{room}中身亡。死亡时间大约在{time}左右，当时{setting}内有{num}人。',
        '{setting}的主人{victim}在{room}遭遇不测。{police_note}，这意味着凶手就在受邀的宾客之中。'
      ],
      rooms: ['书房', '卧室', '地下室', '花园', '客厅', '走廊', '餐厅', '阁楼', '储藏室', '阳台', '泳池边', '车库'],
      occupations: ['企业家', '收藏家', '音乐家', '作家', '科学家', '艺术家', '律师', '医生', '教授', '投资人'],
      victims: []
    },
    {
      type: '盗窃',
      settings: ['美术馆', '珠宝店', '私人收藏室', '博物馆', '拍卖行', '豪宅', '画廊', '古董店'],
      introThemes: [
        '{setting}的镇馆之宝——{item}——在昨夜被盗。监控系统{reason}，盗贼显然对这里了如指掌。',
        '{victim}报警称其收藏的{item}在{setting}中被盗。{police_note}，案件疑点重重。',
        '价值连城的{item}在{setting}中不翼而飞。{time}前后有人听到{room}方向传来异响。'
      ],
      rooms: ['主展厅', '保险库', '储藏室', '办公室', '地下室', '收藏室', '侧厅', '二楼展厅'],
      occupations: ['收藏家', '拍卖师', '鉴定师', '保安主管', '策展人', '画廊老板', '古董商'],
      victims: []
    },
    {
      type: '失踪',
      settings: ['大学校园', '度假村', '古城', '雪山旅馆', '孤岛', '小镇', '游轮', '疗养院'],
      introThemes: [
        '{victim}在{setting}中神秘失踪，最后一次出现是在{time}的{room}附近。{police_note}。',
        '{setting}的工作人员报告称{victim}已经{time}没有露面。{police_note}。',
        '{victim}来到{setting}后便人间蒸发。{time}有人看到{reason}。'
      ],
      rooms: ['大堂', '走廊尽头', '花园', '天台', '餐厅', '图书馆', '地下室', '东翼走廊'],
      occupations: ['教授', '研究员', '医生', '律师', '记者', '摄影师', '导游', '厨师'],
      victims: []
    },
    {
      type: '欺诈',
      settings: ['金融公司', '律师事务所', '投资机构', '拍卖行', '家族企业', '科技公司', '基金会', '咨询公司'],
      introThemes: [
        '{setting}被曝出巨额财务问题，{victim}——公司的{occupation}——被发现在办公室中{reason}。',
        '{victim}精心策划的骗局终于败露，但在调查人员到达之前，关键证据{reason}。',
        '{setting}内部出现严重的经济犯罪。{victim}的{occupation}身份让这起案件格外复杂。'
      ],
      rooms: ['私人办公室', '会议室', '财务室', '档案室', '茶水间', '地下车库', '总裁办公室', '机房'],
      occupations: ['财务总监', 'CEO', '项目经理', '投资顾问', '审计师', '合伙人', '董事', '分析师'],
      victims: []
    }
  ],

  // ---------- 嫌疑人数据池 ----------
  surnamePool: ['张', '李', '王', '赵', '陈', '周', '林', '黄', '吴', '刘', '孙', '杨', '马', '高', '何', '宋', '郑', '谢', '冯', '郭', '沈', '韩', '曹', '许', '彭', '苏', '潘', '田', '任', '姜', '廖', '方', '石', '唐', '陆', '姚', '董', '罗', '程', '叶', '蔡', '钟', '汪', '杜', '夏', '邱', '谭', '江', '邹', '徐'],
  givenNamePool: ['明', '强', '芳', '敏', '磊', '静', '伟', '丽', '军', '娜', '勇', '娟', '涛', '霞', '杰', '燕', '鹏', '玲', '斌', '婷', '浩', '雪', '峰', '琳', '超', '瑶', '波', '丹', '辉', '红', '刚', '萍', '文', '慧', '磊', '晶', '洋', '倩', '飞', '云'],
  moodPool: ['calm', 'nervous', 'angry', 'sad', 'defiant'],
  moodEmoji: { calm: '😐', nervous: '😰', angry: '😠', sad: '😢', defiant: '😤' },
  moodText: { calm: '冷静', nervous: '紧张', angry: '愤怒', sad: '悲伤', defiant: '挑衅' },

  locationDescPrefix: [
    '房间内一片狼藉，', '空气中弥漫着奇怪的气味，', '这里被打扫得异常干净，',
    '角落里散落着一些物品，', '灯光昏暗，', '窗户半开着，', '一切都整整齐齐，',
    '地上有明显的拖拽痕迹，', '墙上有一些划痕，', '这里明显被翻找过，'
  ],
  locationDescSuffix: [
    '看起来不久前还有人在这里。', '似乎有人试图清理过什么。', '这里的气氛让人很不舒服。',
    '也许有什么重要的东西被遗漏了。', '需要仔细搜查每一个角落。', '这个房间隐藏着秘密。'
  ],
  evidenceNames: {
    physical: [
      {name:'指纹', desc:'在{room}的{item}上提取到一组清晰的指纹，与{link}的指纹相符。'},
      {name:'足迹', desc:'{room}地面上发现了一组足迹，鞋码为{size}码。'},
      {name:'纤维', desc:'在{room}发现了几根{color}的纤维，与{link}的物品材质一致。'},
      {name:'血迹', desc:'{room}的墙壁上发现了喷溅状血迹，血型为{type}型。'},
      {name:'工具痕迹', desc:'{room}的{detail}上有明显的撬动痕迹。'},
      {name:'烟蒂', desc:'{room}发现了几枚烟蒂，烟蒂上的口红印显示为{color}色。'},
      {name:'毛发', desc:'在{room}找到的毛发样本，长度约为{detail}。'},
      {name:'碎玻璃', desc:'{room}的地面上散落着碎玻璃，看起来是{detail}。'},
      {name:'打斗痕迹', desc:'{room}的家具被撞翻，地上有{detail}。'},
      {name:'钥匙', desc:'在{room}的地板缝隙中找到了一把钥匙，上面刻着{detail}。'}
    ],
    document: [
      {name:'信件', desc:'一封未寄出的信，内容提到{detail}。'},
      {name:'收据', desc:'一张{time_desc}的收据，金额为{amount}元。'},
      {name:'照片', desc:'一张照片，{detail}。'},
      {name:'日记', desc:'{victim}的日记本，最后一页写着：{detail}。'},
      {name:'合同', desc:'一份合同，其中{detail}。'},
      {name:'转账记录', desc:'银行转账记录显示{detail}。'},
      {name:'遗嘱', desc:'一份近期修改过的遗嘱，{detail}。'},
      {name:'车票', desc:'一张{time_desc}的{detail}车票。'},
      {name:'病历', desc:'一份病历，显示{detail}。'},
      {name:'备忘录', desc:'一本备忘录中写道：{detail}。'}
    ],
    testimony: [
      {name:'目击证词', desc:'{witness_occupation}声称{time_desc}看到{detail}。'},
      {name:'通话记录', desc:'{time_desc}有一通来自{detail}的电话。'},
      {name:'监控录像', desc:'监控拍到{time_desc}{detail}。'},
      {name:'录音', desc:'一段录音中传来{detail}。'},
      {name:'匿名举报', desc:'一张匿名纸条上写着：{detail}。'}
    ]
  },

  _rand(n) { return Math.floor(Math.random() * n); },
  _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  _pickN(arr, n) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  },
  _randBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
  _genName() {
    const surname = this._pick(this.surnamePool);
    const given = this._pick(this.givenNamePool);
    return surname + given;
  },

  // ---------- 生成完整案件 ----------
  generate(difficulty) {
    difficulty = difficulty || this._randBetween(1, 3);
    const template = this._pick(this.templates);
    const setting = this._pick(template.settings);
    const room = this._pick(template.rooms);
    const victimOcc = this._pick(template.occupations);
    const victimName = this._genName();

    const title = `「${setting}${template.type === '盗窃' ? '失窃' : template.type === '失踪' ? '失踪' : template.type === '欺诈' ? '骗局' : '谜案'}」`;
    const subtitle = `${template.type === '谋杀' ? victimName + '之死' : template.type === '盗窃' ? '失窃的珍宝' : template.type === '失踪' ? '消失的' + victimName : '巨额骗局'}`;

    const timeSlots = ['午夜', '凌晨两点', '清晨六点', '上午十点', '下午三点', '傍晚七点', '深夜十一点'];
    const time = this._pick(timeSlots);
    const policeNote = this._pick(['经过警方初步排查', '令人奇怪的是', '据现场判断', '警方表示']);

    let briefing = this._pick(template.introThemes)
      .replace('{setting}', setting)
      .replace('{room}', room)
      .replace('{victim}', victimName)
      .replace('{occupation}', victimOcc)
      .replace('{time}', time)
      .replace('{num}', String(this._randBetween(4, 8)))
      .replace('{police_note}', policeNote)
      .replace('{reason}', this._pick(['没有任何破坏痕迹', '恰好在那段时间失灵', '留下了明显的线索', '一切看似正常', '像是什么都没发生过']));

    const suspectCount = difficulty + 3;
    const suspects = [];
    const usedNames = new Set([victimName]);
    const killerIdx = this._rand(suspectCount);
    const jobPool = ['管家', '秘书', '保安', '司机', '厨师', '园丁', '保姆', '助理', '邻居', '合作伙伴',
                     '竞争对手', '学生', '同事', '下属', '实习生', '律师', '医生', '记者', '教练', '顾问'];
    const usedJobs = new Set();
    const relations = [
      victimName + '的亲属', victimName + '的生意伙伴', victimName + '的员工',
      victimName + '的邻居', victimName + '的好友', victimName + '的竞争对手',
      '慕名而来的访客', setting + '的长期住客', victimName + '的前任同事',
      victimName + '的私人医生', victimName + '的律师', victimName + '的学生'
    ];
    const secretPool = [
      '他最近欠了一大笔赌债', '她正在调查一起旧案', '他其实是卧底记者',
      '她与受害者有过一段感情', '他收到过恐吓信', '她患有不治之症',
      '他在偷窃公司财物', '她计划近期离职', '他伪造了学历', '她一直在被人勒索',
      '他是非法移民', '她在调查自己的身世', '他挪用了一笔公款', '她收集受害者的隐私',
      '他被人威胁',
    ];
    const usedSecrets = new Set();
    const itemPool = ['桌子', '椅子', '门把手', '窗户', '柜子', '花瓶', '相框', '台灯', '水杯', '键盘',
                      '手机', '钱包', '手表', '戒指', '领带', '围巾', '外套', '鞋子', '帽子', '雨伞'];

    for (let i = 0; i < suspectCount; i++) {
      let name; do { name = this._genName(); } while (usedNames.has(name)); usedNames.add(name);
      let job; do { job = this._pick(jobPool); } while (usedJobs.has(job) && usedJobs.size < jobPool.length); usedJobs.add(job);
      const isGuilty = (i === killerIdx);
      let secret; do { secret = this._pick(secretPool); } while (usedSecrets.has(secret) && usedSecrets.size < secretPool.length); usedSecrets.add(secret);
      const relation = this._pick(relations);
      const mood = isGuilty ? 'nervous' : this._pick(this.moodPool.filter(m => m !== 'nervous'));
      const alibiOptions = [
        `${time}的时候我在自己的房间里睡觉。没人能证明，但我说的是实话。`,
        `我当时在${this._pick(['花园散步', '客厅看书', '厨房泡茶', '阳台打电话', '车库修车', '地下室整理物品'])}，大概${time}左右。`,
        `我和${this._pick([...usedNames].filter(n => n !== name))[0] || '一个朋友'}在一起，他可以作证。`,
        `我那天身体不舒服，一直在房间休息。`,
        `我当时在外面办事，${time}不在${setting}。`,
      ];
      suspects.push({
        id: `suspect_${i}`, name, age: this._randBetween(25, 65), occupation: job,
        description: `${relation}，${job}。${isGuilty ? '举止有些可疑' : '看起来神色如常'}。`,
        relation, mood, isGuilty, secret,
        alibi: this._pick(alibiOptions),
        motive: isGuilty ? this._pick([`为了争夺${setting}的继承权`,`因为${victimName}发现了${name}的秘密`,`为了报复${victimName}的背叛`,`为了得到珍贵的${this._pick(['收藏品', '文件', '财产', '证据'])}`,`因为${victimName}威胁要揭发${name}`]) : '',
        interrogationScript: [],
        portrait: this._pick(['👨‍💼','👩‍💼','👨‍🔧','👩‍🔧','👨‍🎓','👩‍🎓','👨‍🍳','👩‍🍳','👨‍🔬','👩‍🔬','👨‍🎨','👩‍🎨','👨‍✈️','👩‍✈️','👨‍🌾','👩‍🌾'])
      });
    }

    const keyEvidence = [];
    const allEvidence = [];
    const locationEvidenceMap = {};
    const evidenceTypeKeys = Object.keys(this.evidenceNames);
    const killer = suspects[killerIdx];
    const killerEvidenceCount = difficulty + 1;
    const usedEvidenceNames = new Set();

    for (let i = 0; i < killerEvidenceCount; i++) {
      const eType = this._pick(evidenceTypeKeys);
      const pool = this.evidenceNames[eType];
      let eviDef; let attempts = 0;
      do { eviDef = this._pick(pool); attempts++; } while (usedEvidenceNames.has(eviDef.name) && attempts < 10);
      usedEvidenceNames.add(eviDef.name);
      const eviRoom = this._pick(template.rooms);
      const eviItem = this._pick(itemPool);
      const colors = ['黑色', '白色', '红色', '蓝色', '绿色', '灰色', '棕色', '深色', '浅色'];
      const bloodTypes = ['A', 'B', 'O', 'AB'];
      let desc = eviDef.desc
        .replace('{room}', eviRoom).replace('{item}', eviItem).replace('{link}', killer.name)
        .replace('{color}', this._pick(colors)).replace('{type}', this._pick(bloodTypes))
        .replace('{size}', String(this._randBetween(38, 46)))
        .replace('{detail}', this._pick(['边缘有不规则的破损','上面刻有字母缩写','明显是匆忙留下的','来自一个知名的品牌','还带着余温','看起来是近期才留下的']))
        .replace('{victim}', victimName).replace('{time_desc}', this._pick(['昨晚','案发当天','三天前','上周五','案发前两小时']))
        .replace('{amount}', String(this._randBetween(5000, 500000)))
        .replace('{witness_occupation}', this._pick(jobPool));
      const evi = { id: `key_evi_${i}`, name: eviDef.name, description: desc, type: eType, isKey: true, relatedSuspectId: killer.id, found: false, location: eviRoom, canDebunkLie: false };
      keyEvidence.push(evi); allEvidence.push(evi);
      if (!locationEvidenceMap[eviRoom]) locationEvidenceMap[eviRoom] = [];
      locationEvidenceMap[eviRoom].push(evi);
    }

    const innocentSuspects = suspects.filter(s => !s.isGuilty);
    const distractionCount = difficulty + 2;
    for (let i = 0; i < distractionCount; i++) {
      const eType = this._pick(evidenceTypeKeys);
      const pool = this.evidenceNames[eType];
      let eviDef; let attempts = 0;
      do { eviDef = this._pick(pool); attempts++; } while (usedEvidenceNames.has(eviDef.name) && attempts < 10);
      usedEvidenceNames.add(eviDef.name);
      const targetSuspect = this._pick(innocentSuspects);
      const eviRoom = this._pick(template.rooms);
      const eviItem = this._pick(itemPool);
      const colors = ['黑色','白色','红色','蓝色','绿色','灰色','棕色','深色','浅色'];
      let desc = eviDef.desc
        .replace('{room}', eviRoom).replace('{item}', eviItem).replace('{link}', targetSuspect.name)
        .replace('{color}', this._pick(colors)).replace('{type}', this._pick(['A','B','O','AB']))
        .replace('{size}', String(this._randBetween(38, 46)))
        .replace('{detail}', this._pick(['看起来是匆忙中留下的','沾有污渍','似乎被刻意隐藏','已经有一定年头了','不是属于这里的物品','上面写着一个日期']))
        .replace('{victim}', victimName).replace('{time_desc}', this._pick(['昨晚','案发当天','三天前','上周五','案发前两小时']))
        .replace('{amount}', String(this._randBetween(5000, 500000)))
        .replace('{witness_occupation}', this._pick(jobPool));
      const evi = { id: `dist_evi_${i}`, name: eviDef.name, description: desc, type: eType, isKey: false, relatedSuspectId: targetSuspect.id, found: false, location: eviRoom, canDebunkLie: false };
      allEvidence.push(evi);
      if (!locationEvidenceMap[eviRoom]) locationEvidenceMap[eviRoom] = [];
      locationEvidenceMap[eviRoom].push(evi);
    }

    const locations = Object.keys(locationEvidenceMap).map((roomName, idx) => ({
      id: `loc_${idx}`, name: roomName,
      description: this._pick(this.locationDescPrefix) + this._pick(this.locationDescSuffix),
      evidence: locationEvidenceMap[roomName], investigated: false
    }));

    suspects.forEach(suspect => {
      const questions = [
        { question: `案发${time}你在哪里？`, answer: suspect.alibi, truth: suspect.isGuilty ? `他当时就在${room}附近，根本不是他说的那样。` : suspect.alibi },
        { question: `你和${victimName}是什么关系？`, answer: `我是${suspect.relation}，我们${suspect.isGuilty ? '最近有些矛盾' : '关系还不错'}。`, truth: suspect.isGuilty ? `${suspect.name}和${victimName}之间有着不可告人的秘密。` : `${suspect.name}确实是${victimName}的${suspect.relation.replace(victimName + '的', '')}，两人并无过节。` },
        { question: `你对这起案件有什么看法？`, answer: suspect.isGuilty ? '这太可怕了，我希望你们能尽快找到真凶。' : this._pick(['真是太令人震惊了，希望真相能水落石出。','我完全不敢相信会发生这种事。','一定有什么误会。']), truth: suspect.isGuilty ? '他试图转移调查方向，表现得过于积极。' : '他的反应很正常，确实对此感到震惊。' },
        { question: `你最近是不是有什么特别的事情？`, answer: suspect.isGuilty ? '没有，一切正常。你们为什么这么问？' : '这个...我不太想谈这个。', truth: suspect.secret + (suspect.isGuilty ? '，但这只是他犯罪的动机之一。' : '，但与本案无关。') }
      ];
      suspect.interrogationScript = questions;
    });

    const keyEvidenceIds = keyEvidence.map(e => e.id);
    const storyDesc = template.type === '谋杀'
      ? `${killer.name}因为${killer.motive}而起了杀心。他利用了${setting}的复杂环境，在${time}将${victimName}引到${room}，实施了犯罪。现场留下的${keyEvidence.map(e => e.name).join('和')}成为了破案的关键。`
      : template.type === '盗窃'
      ? `${killer.name}精心策划了这次盗窃，${killer.motive}。他趁着${time}的混乱，在${room}盗走了目标物品。但${keyEvidence.map(e => e.name).join('和')}暴露了他的行踪。`
      : `${killer.name}策划了这一切，${killer.motive}。${keyEvidence.map(e => e.name).join('和')}是揭开真相的关键证据。`;

    return {
      id: `case_${Date.now()}`, title, subtitle, type: template.type, setting, difficulty,
      victimName, victimOcc, briefing, time, locations, suspects,
      keyEvidenceIds,
      solution: { culpritId: killer.id, culpritName: killer.name, motive: killer.motive, story: storyDesc, evidence: keyEvidence.map(e => e.name) },
      totalEvidence: allEvidence.length, timeOfDay: time
    };
  }
};
if (typeof module !== 'undefined') module.exports = { CaseGenerator };
