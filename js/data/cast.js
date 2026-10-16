/* ------------------------------------------------------------- 등장인물
   The cast page of 연세한국어 1 introduces eight recurring characters; the
   dialogue speaker labels in the corpus are these people. */
window.YK_CAST = [
  {
    ko: '톰슨 제임스', gender: 'm', short: '제임스', id: 'james', zh: '汤姆森·詹姆斯', color: '#5a51c6',
    from: '미국', fromZh: '美国', job: '기자', jobZh: '记者',
    note: '리에의 반 친구', noteZh: '理惠的同班同学',
    about: '美国来的记者，在延世大学学韩语。课文里最常出现的主角。',
  },
  {
    ko: '요시다 리에', gender: 'f', short: '리에', id: 'rie', zh: '吉田理惠', color: '#c86a35',
    from: '일본', fromZh: '日本', job: '은행원', jobZh: '银行职员',
    note: '제임스의 반 친구', noteZh: '詹姆斯的同班同学',
    about: '日本来的银行职员，说话礼貌，课文开头就是她和王伟的问候。',
  },
  {
    ko: '크로베토바 마리아', gender: 'f', short: '마리아', id: 'maria', zh: '克罗贝托娃·玛丽亚', color: '#2c8a5f',
    from: '러시아', fromZh: '俄罗斯', job: '대학생', jobZh: '大学生',
    note: '제임스의 반 친구', noteZh: '詹姆斯的同班同学',
    about: '俄罗斯留学生，性格爽快，常在市场、餐厅场景里出现。',
  },
  {
    ko: '왕 웨이', gender: 'm', short: '웨이', id: 'wei', zh: '王伟', color: '#b8452f',
    from: '중국', fromZh: '中国', job: '회사원', jobZh: '公司职员（延世大学）',
    note: '제임스의 반 친구', noteZh: '詹姆斯的同班同学',
    about: '一边工作一边在延世大学上课，是课文里提问最多的人。',
  },
  {
    ko: '김미선', gender: 'f', short: '미선', id: 'miseon', zh: '金美善', color: '#7a5cae',
    from: '한국', fromZh: '韩国', job: '대학원생', jobZh: '研究生',
    note: '마리아의 방 친구', noteZh: '玛丽亚的室友 / 敏哲的女友',
    about: '韩国研究生，负责把外国朋友拉进韩国人的日常话题。',
  },
  {
    ko: '정민철', gender: 'm', short: '민철', id: 'mincheol', zh: '郑敏哲', color: '#2f6f9e',
    from: '한국', fromZh: '韩国', job: '여행사 직원', jobZh: '旅行社职员',
    note: '미선의 남자 친구', noteZh: '美善的男友',
    about: '在旅行社工作，第 3 课带着大家看家庭照片。',
  },
  {
    ko: '이영수', gender: 'm', short: '영수', id: 'yeongsu', zh: '李英秀', color: '#4a7a3a',
    from: '한국', fromZh: '韩国', job: '대학생', jobZh: '大学生',
    note: '제임스와 리에의 하숙집 친구', noteZh: '詹姆斯和理惠的寄宿家庭朋友',
    about: '韩国大学生，第 1 课末尾由王伟介绍出场。',
  },
  {
    ko: '오정희', gender: 'f', short: '정희', id: 'jeonghee', zh: '吴政喜', color: '#a8552f',
    from: '한국', fromZh: '韩国', job: '회사원', jobZh: '公司职员（延世大学）',
    note: '웨이의 회사 동료', noteZh: '王伟的同事',
    about: '王伟的同事，第 5 课以后大量出现，负责问“几点、做什么”。',
  },
];

/* 课文里偶尔出现的临时角色，课本人物页没有收录，性别按语境判断 */
window.YK_SPEAKER_GENDER = {
  '점원': 'f', '기사': 'm', '주인': 'f', '사장': 'm', '의사': 'm', '직원': 'f',
};
