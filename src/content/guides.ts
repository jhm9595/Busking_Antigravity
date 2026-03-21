export type GuideLanguage = "en" | "ko" | "zh" | "ja" | "zh-TW";

export interface GuideBodySection {
  heading: string;
  paragraphs: string[];
  checklist?: string[];
}

export interface GuideBody {
  intro: string;
  sections: GuideBodySection[];
  closing: string;
}

export interface GuideEntry {
  slug: string;
  title: string;
  excerpt: string;
  description: string;
  body: GuideBody;
  relatedSlugs: string[];
}

interface LocalizedText {
  en: string;
  ko: string;
  zh: string;
  ja: string;
  "zh-TW": string;
}

interface LocalizedStringList {
  en: string[];
  ko: string[];
  zh: string[];
  ja: string[];
  "zh-TW": string[];
}

interface LocalizedSection {
  heading: LocalizedText;
  paragraphs: LocalizedStringList;
  checklist?: LocalizedStringList;
}

interface LocalizedGuideSeed {
  slug: string;
  relatedSlugs: string[];
  title: LocalizedText;
  excerpt: LocalizedText;
  description: LocalizedText;
  body: {
    intro: LocalizedText;
    sections: LocalizedSection[];
    closing: LocalizedText;
  };
}

function pickText(text: LocalizedText, language: GuideLanguage): string {
  return text[language];
}

function pickList(list: LocalizedStringList, language: GuideLanguage): string[] {
  return list[language];
}

const guideSeeds: LocalizedGuideSeed[] = [
  {
    slug: "start-busking-first-time",
    relatedSlugs: ["hongdae-yeonnam-busking-checklist", "outdoor-busking-gear-basics"],
    title: {
      ko: "버스킹 처음 시작하기",
      en: "Starting Busking for the First Time",
      zh: "第一次开始街头演出",
      ja: "初めての路上ライブの始め方",
      "zh-TW": "第一次開始街頭演出",
    },
    excerpt: {
      ko: "처음 버스킹을 준비할 때 필요한 목표 설정, 장비 우선순위, 첫 공연 운영 기준을 정리합니다.",
      en: "Set realistic goals, choose essential gear, and run your first show with less stress.",
      zh: "整理首次街演所需的目标设定、设备优先级与现场运营基准。",
      ja: "初ライブに必要な目標設定、機材の優先順位、当日運営の基準を整理します。",
      "zh-TW": "整理首次街演所需的目標設定、設備優先順序與現場運營基準。",
    },
    description: {
      ko: "초보 버스커를 위한 첫 공연 준비 가이드입니다.",
      en: "A beginner guide for preparing and completing your first street performance.",
      zh: "面向新手街头艺人的首场演出准备指南。",
      ja: "初心者バスカー向けの初回公演準備ガイドです。",
      "zh-TW": "面向新手街頭藝人的首場演出準備指南。",
    },
    body: {
      intro: {
        ko: "첫 버스킹의 핵심은 완벽함보다 완주입니다. 작은 기준을 세우고 현장 루틴을 만드는 것이 다음 공연의 자신감으로 이어집니다.",
        en: "Your first busking show is about finishing strong, not being perfect. Clear goals and a simple routine build real confidence.",
        zh: "第一次街演的重点不是完美，而是顺利完成。明确目标与现场流程，能让下一场更有信心。",
        ja: "初回の路上ライブで大切なのは完璧さより完走です。明確な目標とシンプルな運営ルーティンが次につながります。",
        "zh-TW": "第一次街演的重點不是完美，而是順利完成。明確目標與現場流程，能讓下一場更有信心。",
      },
      sections: [
        {
          heading: {
            ko: "첫 공연 운영 기준 만들기",
            en: "Set a Practical First-Show Standard",
            zh: "建立首场演出的可执行标准",
            ja: "初回公演の現実的な基準を作る",
            "zh-TW": "建立首場演出的可執行標準",
          },
          paragraphs: {
            ko: [
              "30~40분 분량의 자신 있는 곡으로 구성하고, 설치와 철수를 10분 안에 끝내는 목표를 세우세요.",
              "공연 후에는 관객 반응과 신청곡 흐름을 간단히 기록해 다음 무대의 개선 포인트로 활용하세요.",
            ],
            en: [
              "Build a 30-40 minute set with songs you can perform comfortably, and practice setup/teardown until you can do both in about 10 minutes.",
              "After the show, note audience reactions and request patterns to improve your next performance.",
            ],
            zh: [
              "用最熟悉的歌曲准备30-40分钟歌单，并把搭建与撤场练到约10分钟内完成。",
              "演出后简要记录观众反应与点歌趋势，作为下次优化依据。",
            ],
            ja: [
              "30-40分の持ち曲セットを組み、設営と撤収をそれぞれ10分前後で終えられるよう練習しましょう。",
              "終演後は観客の反応やリクエスト傾向を記録し、次回の改善に活かします。",
            ],
            "zh-TW": [
              "用最熟悉的歌曲準備30-40分鐘歌單，並把架設與撤場練到約10分鐘內完成。",
              "演出後簡要記錄觀眾反應與點歌趨勢，作為下次優化依據。",
            ],
          },
          checklist: {
            ko: ["핵심 장비 점검", "10분 설치/철수 리허설", "짧고 안정적인 셋리스트"],
            en: ["Check core gear", "Rehearse 10-minute setup/teardown", "Use a short stable setlist"],
            zh: ["检查核心设备", "练习10分钟搭建/撤场", "使用短而稳定的歌单"],
            ja: ["主要機材を点検", "10分設営/撤収をリハーサル", "短く安定したセットリスト"],
            "zh-TW": ["檢查核心設備", "練習10分鐘架設/撤場", "使用短而穩定的歌單"],
          },
        },
      ],
      closing: {
        ko: "첫 공연을 끝냈다는 경험 자체가 가장 큰 자산입니다.",
        en: "Finishing your first show is the milestone that matters most.",
        zh: "完成第一场演出，本身就是最重要的里程碑。",
        ja: "初回公演を完走した経験そのものが最大の資産です。",
        "zh-TW": "完成第一場演出，本身就是最重要的里程碑。",
      },
    },
  },
  {
    slug: "hongdae-yeonnam-busking-checklist",
    relatedSlugs: ["choose-busking-location-guide", "pick-best-performance-time-slots"],
    title: {
      ko: "홍대/연남 버스킹 준비 체크리스트",
      en: "Hongdae/Yeonnam Busking Preparation Checklist",
      zh: "弘大/延南街演准备清单",
      ja: "弘大・延南 路上ライブ準備チェックリスト",
      "zh-TW": "弘大/延南街演準備清單",
    },
    excerpt: {
      ko: "유동 인구가 많은 지역에서 공연할 때 꼭 확인해야 할 사전 준비 항목을 정리합니다.",
      en: "A practical checklist for crowded areas: audience flow, noise etiquette, and on-site communication.",
      zh: "整理在高人流区域演出前必须确认的准备事项。",
      ja: "人通りの多いエリアでの公演前に必ず確認すべき項目を整理します。",
      "zh-TW": "整理在人流密集區域演出前必須確認的準備事項。",
    },
    description: {
      ko: "홍대/연남 공연에서 소음, 동선, 관객 안내를 안정적으로 운영하기 위한 가이드입니다.",
      en: "Run busking in Hongdae/Yeonnam with better flow control, lower complaints, and clearer audience guidance.",
      zh: "帮助你在弘大/延南稳定处理噪音、动线与观众引导。",
      ja: "弘大・延南で騒音、導線、観客案内を安定運用するためのガイドです。",
      "zh-TW": "幫助你在弘大/延南穩定處理噪音、動線與觀眾引導。",
    },
    body: {
      intro: {
        ko: "핫플레이스일수록 기본 매너와 운영 디테일이 성패를 좌우합니다.",
        en: "In high-traffic hotspots, etiquette and execution details decide whether your show works.",
        zh: "在人气热点，礼仪与执行细节往往决定演出成败。",
        ja: "人気スポットほど、マナーと運営の細部が結果を左右します。",
        "zh-TW": "在人氣熱點，禮儀與執行細節往往決定演出成敗。",
      },
      sections: [
        {
          heading: {
            ko: "혼잡 지역 운영 핵심",
            en: "Core Operations in Crowded Zones",
            zh: "拥挤区域的运营重点",
            ja: "混雑エリア運営の要点",
            "zh-TW": "擁擠區域的運營重點",
          },
          paragraphs: {
            ko: [
              "스피커 방향은 상점 정면을 피하고, 보행 통로를 막지 않도록 공연 구역을 명확히 구분하세요.",
              "외국인 비중이 높은 시간대에는 친숙한 팝/K-POP을 일부 섞어 체류 시간을 늘리는 전략이 유효합니다.",
            ],
            en: [
              "Point speakers away from storefronts and define a clear performance zone so walkways stay open.",
              "In tourist-heavy hours, mixing in familiar pop or K-pop tracks can improve retention.",
            ],
            zh: [
              "音箱避免正对商铺，并明确演出区域，确保行人通道畅通。",
              "在游客较多时段，可加入熟悉的流行或K-POP曲目提高停留率。",
            ],
            ja: [
              "スピーカーは店舗正面を避け、通行の妨げにならないよう公演エリアを明確に区切りましょう。",
              "観光客が多い時間帯は、馴染みのあるポップスやK-POPを混ぜると滞在率が上がります。",
            ],
            "zh-TW": [
              "音箱避免正對商家，並明確演出區域，確保行人通道順暢。",
              "在遊客較多時段，可加入熟悉的流行或K-POP曲目提升停留率。",
            ],
          },
          checklist: {
            ko: ["상가 사전 인사", "저음 과다 여부 점검", "보행 통로 안내 멘트 준비"],
            en: ["Greet nearby shops", "Check low-end volume", "Prepare walkway guidance lines"],
            zh: ["提前向周边商家打招呼", "检查低频是否过强", "准备通行引导话术"],
            ja: ["近隣店舗へ事前あいさつ", "低音過多を確認", "通行案内の声かけ準備"],
            "zh-TW": ["提前向周邊商家打招呼", "檢查低頻是否過強", "準備通行引導話術"],
          },
        },
      ],
      closing: {
        ko: "현장 매너를 지키는 팀이 결국 더 오래 사랑받습니다.",
        en: "The team that respects on-site etiquette always lasts longer.",
        zh: "重视现场礼仪的团队，最终更能长期被喜爱。",
        ja: "現場マナーを守るチームほど、長く支持されます。",
        "zh-TW": "重視現場禮儀的團隊，最終更能長期被喜愛。",
      },
    },
  },
  {
    slug: "outdoor-busking-gear-basics",
    relatedSlugs: ["busker-basic-sound-tips", "busking-tips-rainy-cold-weather"],
    title: {
      ko: "야외 공연 장비 기초",
      en: "Outdoor Busking Gear Basics",
      zh: "户外街演设备基础",
      ja: "屋外ライブ機材の基礎",
      "zh-TW": "戶外街演設備基礎",
    },
    excerpt: {
      ko: "야외 환경에서 안정적인 공연을 위한 핵심 장비와 구매 우선순위를 소개합니다.",
      en: "Choose durable, portable gear first and build a stable outdoor setup step by step.",
      zh: "介绍户外稳定演出所需的核心设备与采购优先级。",
      ja: "屋外で安定した公演を行うための主要機材と購入優先順位を紹介します。",
      "zh-TW": "介紹戶外穩定演出所需的核心設備與採購優先順序。",
    },
    description: {
      ko: "전원, 내구성, 휴대성을 기준으로 장비를 구성하는 입문 가이드입니다.",
      en: "A starter guide for power, durability, portability, and safe cable management outdoors.",
      zh: "以供电、耐用、便携为核心的户外设备入门指南。",
      ja: "電源・耐久性・携帯性を軸にした屋外機材の入門ガイドです。",
      "zh-TW": "以供電、耐用、便攜為核心的戶外設備入門指南。",
    },
    body: {
      intro: {
        ko: "야외에서는 음질보다 먼저 전원 안정성과 내구성이 필요합니다.",
        en: "Outdoors, reliable power and durability matter before perfect tone.",
        zh: "在户外，稳定供电与耐用性优先于极致音色。",
        ja: "屋外では音質より先に、安定した電源と耐久性が重要です。",
        "zh-TW": "在戶外，穩定供電與耐用性優先於極致音色。",
      },
      sections: [
        {
          heading: {
            ko: "기본 장비 조합",
            en: "Essential Gear Combination",
            zh: "基础设备组合",
            ja: "基本機材の組み合わせ",
            "zh-TW": "基礎設備組合",
          },
          paragraphs: {
            ko: [
              "배터리 앰프, 다이내믹 마이크, 내구성 좋은 케이블을 우선 확보하고 예비 케이블을 항상 준비하세요.",
              "운반 카트와 방수 커버를 함께 준비하면 설치 속도와 악천후 대응력이 크게 올라갑니다.",
            ],
            en: [
              "Start with a battery-powered amp, a dynamic mic, and durable cables, plus one spare cable set.",
              "Add a transport cart and waterproof covers to speed up setup and handle weather changes safely.",
            ],
            zh: [
              "优先配备电池音箱、动圈麦克风和耐用线材，并常备一套备用线。",
              "再准备推车与防水罩，可显著提升搭建效率与恶劣天气应对能力。",
            ],
            ja: [
              "まずはバッテリー駆動アンプ、ダイナミックマイク、耐久性の高いケーブルをそろえ、予備ケーブルも持参しましょう。",
              "運搬カートと防水カバーを追加すると、設営速度と悪天候対応が大きく向上します。",
            ],
            "zh-TW": [
              "優先配備電池音箱、動圈麥克風與耐用線材，並常備一套備用線。",
              "再準備推車與防水罩，可明顯提升架設效率與惡劣天氣應對能力。",
            ],
          },
          checklist: {
            ko: ["배터리 완충", "예비 케이블/젠더", "방수 커버와 이동 스트랩"],
            en: ["Fully charge batteries", "Carry spare cables/adapters", "Pack rain covers and straps"],
            zh: ["电池充满", "携带备用线材/转接头", "准备防水罩和固定带"],
            ja: ["バッテリー満充電", "予備ケーブル/変換端子", "防水カバーと固定ストラップ"],
            "zh-TW": ["電池充滿", "攜帶備用線材/轉接頭", "準備防水罩與固定帶"],
          },
        },
      ],
      closing: {
        ko: "다루기 쉬운 장비가 결국 공연 품질을 가장 안정적으로 끌어올립니다.",
        en: "Gear you can handle confidently will always outperform flashy specs.",
        zh: "你能稳定掌控的设备，最终比华丽参数更可靠。",
        ja: "扱い慣れた機材こそ、最終的に公演品質を安定させます。",
        "zh-TW": "你能穩定掌控的設備，最終比華麗規格更可靠。",
      },
    },
  },
  {
    slug: "busker-basic-sound-tips",
    relatedSlugs: ["outdoor-busking-gear-basics", "song-request-management-tips"],
    title: {
      ko: "버스커를 위한 기본 음향 팁",
      en: "Basic Sound Tips for Buskers",
      zh: "街头艺人的基础音响技巧",
      ja: "バスカー向け基本サウンドのコツ",
      "zh-TW": "街頭藝人的基礎音響技巧",
    },
    excerpt: {
      ko: "게인 조절, 피드백 방지, 보컬 전달력 개선의 핵심을 다룹니다.",
      en: "Improve vocal clarity with better gain staging, EQ balance, and feedback prevention.",
      zh: "覆盖增益控制、啸叫防止与人声清晰度提升要点。",
      ja: "ゲイン調整、ハウリング防止、ボーカルの聞き取りやすさ向上を解説します。",
      "zh-TW": "涵蓋增益控制、嘯叫防止與人聲清晰度提升要點。",
    },
    description: {
      ko: "야외 버스킹에서 바로 적용할 수 있는 실전 음향 운용 가이드입니다.",
      en: "A practical live sound guide for cleaner, safer outdoor busking audio.",
      zh: "可在户外街演现场立即应用的实战音响指南。",
      ja: "屋外ライブですぐ使える実践的な音響運用ガイドです。",
      "zh-TW": "可在戶外街演現場立即應用的實戰音響指南。",
    },
    body: {
      intro: {
        ko: "좋은 무대는 연주력과 함께 안정적인 사운드 세팅에서 완성됩니다.",
        en: "A great performance depends on solid sound setup as much as musical skill.",
        zh: "好舞台不仅靠演奏，也靠稳定的声音设置。",
        ja: "良いステージは演奏力だけでなく、安定した音響設定で完成します。",
        "zh-TW": "好舞台不只靠演奏，也靠穩定的聲音設定。",
      },
      sections: [
        {
          heading: {
            ko: "현장 사운드 기본 원칙",
            en: "Live Sound Fundamentals",
            zh: "现场声音基础原则",
            ja: "現場サウンドの基本原則",
            "zh-TW": "現場聲音基礎原則",
          },
          paragraphs: {
            ko: [
              "입력 게인은 클리핑이 생기지 않는 선에서 맞추고, 체감 볼륨은 마스터 볼륨으로 조정하세요.",
              "스피커와 마이크 각도를 분리하고 EQ를 미세 조정해 하울링을 예방하면 보컬 전달력이 크게 좋아집니다.",
            ],
            en: [
              "Set input gain below clipping, then adjust perceived loudness with the master volume.",
              "Separate speaker and mic angles, then fine-tune EQ to reduce feedback and improve vocal intelligibility.",
            ],
            zh: [
              "输入增益控制在不过载范围，体感音量用主音量调节。",
              "拉开音箱与麦克风角度，再微调EQ抑制啸叫，可明显提升人声可懂度。",
            ],
            ja: [
              "入力ゲインはクリップしない範囲に設定し、体感音量はマスターで調整します。",
              "スピーカーとマイクの向きを分離し、EQを微調整してハウリングを抑えるとボーカルの明瞭度が上がります。",
            ],
            "zh-TW": [
              "輸入增益控制在不失真範圍，體感音量用主音量調整。",
              "拉開音箱與麥克風角度，再微調EQ抑制嘯叫，可明顯提升人聲可懂度。",
            ],
          },
          checklist: {
            ko: ["게인 피크 확인", "스피커-마이크 거리 확보", "관객 위치에서 밸런스 점검"],
            en: ["Check gain peaks", "Keep speaker-mic distance", "Monitor from audience position"],
            zh: ["检查增益峰值", "保持音箱与麦克风距离", "在观众位置试听平衡"],
            ja: ["ゲインピーク確認", "スピーカーとマイクの距離確保", "観客位置でバランス確認"],
            "zh-TW": ["檢查增益峰值", "保持音箱與麥克風距離", "在觀眾位置試聽平衡"],
          },
        },
      ],
      closing: {
        ko: "세팅값을 기록해두면 공연이 거듭될수록 소리가 빠르게 안정됩니다.",
        en: "Save your settings by venue and your sound will improve show after show.",
        zh: "把各场地参数记录下来，声音会一场比一场更稳定。",
        ja: "会場ごとに設定を記録すれば、回を重ねるほど音は安定します。",
        "zh-TW": "把各場地參數記錄下來，聲音會一場比一場更穩定。",
      },
    },
  },
  {
    slug: "how-to-write-live-show-announcements",
    relatedSlugs: ["how-to-engage-busking-audience", "pick-best-performance-time-slots"],
    title: {
      ko: "라이브 공연 공지 잘 쓰는 법",
      en: "How to Write Better Live Show Announcements",
      zh: "如何写好现场演出公告",
      ja: "ライブ告知を上手に書く方法",
      "zh-TW": "如何寫好現場演出公告",
    },
    excerpt: {
      ko: "관객이 실제로 확인하는 핵심 정보와 클릭을 만드는 문장 구조를 정리합니다.",
      en: "Turn announcements into attendance by improving titles, location clarity, and participation hooks.",
      zh: "整理观众真正会看的关键信息与提升点击率的文案结构。",
      ja: "観客が実際に確認する情報と、クリックされる文面構成を整理します。",
      "zh-TW": "整理觀眾真正會看的關鍵資訊與提升點擊率的文案結構。",
    },
    description: {
      ko: "장소, 시간, 참여 유도 문구를 중심으로 공지 전환율을 높이는 가이드입니다.",
      en: "A guide to writing concise, high-conversion busking announcements.",
      zh: "以地点、时间与互动引导为核心的高转化公告写作指南。",
      ja: "場所・時間・参加導線を軸に告知の反応率を高めるガイドです。",
      "zh-TW": "以地點、時間與互動引導為核心的高轉化公告寫作指南。",
    },
    body: {
      intro: {
        ko: "공지는 공연의 예고편입니다. 한눈에 이해되고 바로 이동 가능한 정보가 핵심입니다.",
        en: "Your announcement is the trailer of your show. It should be clear, specific, and easy to act on.",
        zh: "公告就是演出的预告片：信息要清晰、具体、可立即行动。",
        ja: "告知は公演の予告編です。明確で具体的、そしてすぐ行動できる内容が重要です。",
        "zh-TW": "公告就是演出的預告片：資訊要清晰、具體、可立即行動。",
      },
      sections: [
        {
          heading: {
            ko: "공지 문장 구성",
            en: "Announcement Copy Structure",
            zh: "公告文案结构",
            ja: "告知文の構成",
            "zh-TW": "公告文案結構",
          },
          paragraphs: {
            ko: [
              "제목에는 분위기 키워드를 넣고, 본문에는 정확한 위치와 시작/종료 시간, 랜드마크를 함께 적으세요.",
              "신청곡이나 후원 참여 방법처럼 관객이 바로 행동할 수 있는 문장을 마지막에 배치하면 참여율이 올라갑니다.",
            ],
            en: [
              "Use a mood keyword in the title, and include exact location, landmark, and start/end time in the body.",
              "Close with clear participation lines, such as how to request songs or support, to increase action rates.",
            ],
            zh: [
              "标题放入氛围关键词，正文写清准确地点、地标与开始/结束时间。",
              "结尾加入可立即参与的动作句（如点歌或支持方式），能提升互动率。",
            ],
            ja: [
              "タイトルに雰囲気キーワードを入れ、本文には正確な場所・ランドマーク・開始/終了時間を明記しましょう。",
              "最後にリクエスト方法や応援方法など、すぐ行動できる一文を置くと参加率が上がります。",
            ],
            "zh-TW": [
              "標題放入氛圍關鍵字，正文寫清準確地點、地標與開始/結束時間。",
              "結尾加入可立即參與的動作句（如點歌或支持方式），能提升互動率。",
            ],
          },
          checklist: {
            ko: ["지도 핀과 텍스트 위치 일치", "공연 시간대 명확 표기", "참여 유도 문구 포함"],
            en: ["Match map pin and text location", "State time window clearly", "Include action prompt"],
            zh: ["地图定位与文字一致", "明确时间区间", "包含参与引导语"],
            ja: ["地図ピンと本文位置を一致", "時間帯を明確に記載", "参加導線の一文を入れる"],
            "zh-TW": ["地圖定位與文字一致", "明確時間區間", "包含參與引導語"],
          },
        },
      ],
      closing: {
        ko: "좋은 공지는 관객이 길을 잃지 않게 해주는 가장 실용적인 도구입니다.",
        en: "Good announcements remove friction and bring people to your stage.",
        zh: "好的公告能减少决策阻力，把观众真正带到现场。",
        ja: "良い告知は迷いを減らし、観客を実際の現場へ導きます。",
        "zh-TW": "好的公告能降低決策阻力，把觀眾真正帶到現場。",
      },
    },
  },
  {
    slug: "how-to-engage-busking-audience",
    relatedSlugs: ["song-request-management-tips", "retain-fans-after-performance"],
    title: {
      ko: "버스킹 관객과 소통하는 법",
      en: "How to Engage Busking Audiences",
      zh: "如何与街演观众有效互动",
      ja: "路上ライブで観客とつながる方法",
      "zh-TW": "如何與街演觀眾有效互動",
    },
    excerpt: {
      ko: "짧은 멘트와 리액션으로 관객 체류 시간을 늘리는 소통 전략을 설명합니다.",
      en: "Use eye contact, short talk breaks, and live reactions to keep people watching longer.",
      zh: "通过眼神、短讲与即时回应，提高观众停留时间。",
      ja: "アイコンタクト、短いMC、リアクションで観客の滞在時間を伸ばす方法を解説します。",
      "zh-TW": "透過眼神、短講與即時回應，提高觀眾停留時間。",
    },
    description: {
      ko: "현장 몰입도를 높이는 실전 커뮤니케이션 가이드입니다.",
      en: "A practical communication guide to reduce distance and deepen immersion on site.",
      zh: "提升现场沉浸感、拉近距离的实战沟通指南。",
      ja: "現場の没入感を高める実践コミュニケーションガイドです。",
      "zh-TW": "提升現場沉浸感、拉近距離的實戰溝通指南。",
    },
    body: {
      intro: {
        ko: "버스킹의 힘은 기술뿐 아니라 관객과 함께 무대를 만들어가는 태도에서 나옵니다.",
        en: "Busking works best when the audience feels they are part of the stage, not just watching it.",
        zh: "街演最有魅力的时刻，是观众感觉自己在共同完成舞台。",
        ja: "路上ライブの魅力は、観客が“見る側”ではなく“一緒に作る側”になれる点にあります。",
        "zh-TW": "街演最有魅力的時刻，是觀眾感覺自己在共同完成舞台。",
      },
      sections: [
        {
          heading: {
            ko: "소통 루틴 만들기",
            en: "Build a Repeatable Interaction Routine",
            zh: "建立可重复的互动节奏",
            ja: "再現できる交流ルーティンを作る",
            "zh-TW": "建立可重複的互動節奏",
          },
          paragraphs: {
            ko: [
              "곡 사이 20~30초 멘트로 선곡 이유나 짧은 에피소드를 공유하면 관객 몰입이 높아집니다.",
              "눈맞춤, 감사 인사, 채팅 닉네임 호명 같은 작은 반응을 반복해 관객에게 참여감을 주세요.",
            ],
            en: [
              "Use 20-30 second talk breaks between songs to share why you picked the song or a quick story.",
              "Repeat small signals like eye contact, thank-you lines, and reading chat names to create participation.",
            ],
            zh: [
              "歌曲间用20-30秒说明选曲理由或小故事，能显著提升沉浸感。",
              "持续做眼神交流、感谢回应、点名聊天昵称，让观众感到被参与。",
            ],
            ja: [
              "曲間に20-30秒の短いMCで選曲理由や小さなエピソードを伝えると没入感が上がります。",
              "アイコンタクト、感謝の声かけ、チャット名の呼びかけを繰り返し、参加感を作りましょう。",
            ],
            "zh-TW": [
              "歌曲間用20-30秒說明選曲理由或小故事，能明顯提升沉浸感。",
              "持續做眼神交流、感謝回應、點名聊天暱稱，讓觀眾感到被參與。",
            ],
          },
          checklist: {
            ko: ["곡 사이 멘트 템플릿", "관객 질문 한 가지", "실시간 감사 멘트"],
            en: ["Prepare between-song talk template", "Ask one light audience question", "Give real-time thank-you lines"],
            zh: ["准备曲间话术模板", "设计一个轻互动问题", "实时表达感谢"],
            ja: ["曲間MCテンプレート準備", "軽い質問を1つ用意", "リアルタイムで感謝を伝える"],
            "zh-TW": ["準備曲間話術模板", "設計一個輕互動問題", "即時表達感謝"],
          },
        },
      ],
      closing: {
        ko: "진심이 느껴지는 소통이 결국 가장 오래 기억되는 공연을 만듭니다.",
        en: "Authentic interaction is what audiences remember long after the music ends.",
        zh: "真诚的互动，才是演出结束后仍被记住的部分。",
        ja: "音が止んだ後も残るのは、誠実なコミュニケーションです。",
        "zh-TW": "真誠的互動，才是演出結束後仍被記住的部分。",
      },
    },
  },
  {
    slug: "song-request-management-tips",
    relatedSlugs: ["how-to-engage-busking-audience", "busker-basic-sound-tips"],
    title: {
      ko: "공연 중 신청곡 운영 팁",
      en: "Song Request Management During Performance",
      zh: "演出中点歌管理技巧",
      ja: "公演中のリクエスト運用のコツ",
      "zh-TW": "演出中點歌管理技巧",
    },
    excerpt: {
      ko: "신청곡을 반영하면서도 공연 흐름을 유지하는 접수/정렬/응답 방법을 소개합니다.",
      en: "Accept requests without breaking flow by defining repertoire scope and response timing.",
      zh: "在不打断演出节奏的前提下管理点歌接收、排序与回应。",
      ja: "公演の流れを崩さずにリクエストを受けるための受付・整理・応答方法を紹介します。",
      "zh-TW": "在不打斷演出節奏的前提下管理點歌接收、排序與回應。",
    },
    description: {
      ko: "관객 참여와 셋리스트 흐름을 동시에 지키는 신청곡 운영 가이드입니다.",
      en: "Keep audience participation high while protecting setlist pacing.",
      zh: "兼顾观众参与度与歌单节奏的点歌运营指南。",
      ja: "観客参加を高めつつセットリストの流れを守る運用ガイドです。",
      "zh-TW": "兼顧觀眾參與度與歌單節奏的點歌運營指南。",
    },
    body: {
      intro: {
        ko: "신청곡은 강력한 참여 장치지만 기준 없이 받으면 공연이 흐트러집니다.",
        en: "Song requests boost engagement, but without rules they can derail your show.",
        zh: "点歌能提升参与，但没有规则会打乱整场节奏。",
        ja: "リクエストは参加を高めますが、基準がないと公演の流れを崩します。",
        "zh-TW": "點歌能提升參與，但沒有規則會打亂整場節奏。",
      },
      sections: [
        {
          heading: {
            ko: "기준 있는 신청곡 운영",
            en: "Structured Request Handling",
            zh: "有标准的点歌运营",
            ja: "基準のあるリクエスト運用",
            "zh-TW": "有標準的點歌運營",
          },
          paragraphs: {
            ko: [
              "현장에서 가능한 레퍼토리를 먼저 공개하고, 수락/대기/거절 멘트를 미리 준비해 응답 시간을 줄이세요.",
              "분위기 전환이 필요한 요청은 타이밍을 조정하고, 즉시 불가능한 곡은 다음 공연 약속으로 부드럽게 안내하세요.",
            ],
            en: [
              "Publish your playable repertoire first, and prepare accept/wait/decline scripts to respond quickly.",
              "If a request clashes with the mood, move it to a better slot or promise it for a future show politely.",
            ],
            zh: [
              "先公开可演曲目范围，并准备好接收/稍后/婉拒话术，缩短响应时间。",
              "遇到氛围不匹配的点歌可调整时机，无法演唱时礼貌约到下次。",
            ],
            ja: [
              "まず対応可能なレパートリーを公開し、受諾/保留/辞退の定型文を用意して応答を速くしましょう。",
              "雰囲気に合わない曲はタイミングを調整し、難しい場合は次回提案で丁寧に案内します。",
            ],
            "zh-TW": [
              "先公開可演曲目範圍，並準備好接收/稍後/婉拒話術，縮短回應時間。",
              "遇到氛圍不匹配的點歌可調整時機，無法演唱時禮貌約到下次。",
            ],
          },
          checklist: {
            ko: ["레퍼토리 최신화", "수락/거절 멘트 준비", "요청 우선순위 기준"],
            en: ["Keep repertoire list updated", "Prepare accept/decline scripts", "Define request priority rules"],
            zh: ["更新可演曲目清单", "准备接收/婉拒话术", "设定点歌优先级"],
            ja: ["レパートリーを更新", "受諾/辞退テンプレート準備", "優先順位ルールを設定"],
            "zh-TW": ["更新可演曲目清單", "準備接收/婉拒話術", "設定點歌優先級"],
          },
        },
      ],
      closing: {
        ko: "유연하지만 기준 있는 운영이 관객 만족과 무대 완성도를 함께 높입니다.",
        en: "Flexible but consistent request handling improves both audience satisfaction and show quality.",
        zh: "灵活但有标准的点歌管理，才能同时提升体验与质量。",
        ja: "柔軟で一貫した運用が、満足度と公演品質を同時に高めます。",
        "zh-TW": "靈活但有標準的點歌管理，才能同時提升體驗與品質。",
      },
    },
  },
  {
    slug: "sponsorship-and-points-explained",
    relatedSlugs: ["liveroom-sponsorship-guide", "ads-sponsorship-feature-explained"],
    title: {
      ko: "후원과 포인트 기능 이해하기",
      en: "Understanding Sponsorship and Points",
      zh: "理解赞助与积分功能",
      ja: "後援とポイント機能を理解する",
      "zh-TW": "理解贊助與積分功能",
    },
    excerpt: {
      ko: "후원과 포인트 흐름을 관객/버스커 관점에서 쉽게 설명합니다.",
      en: "Explain support flow clearly so both audiences and buskers can participate without confusion.",
      zh: "从观众与艺人两端清晰说明赞助与积分流程。",
      ja: "観客とバスカー双方の視点で後援とポイントの流れをわかりやすく整理します。",
      "zh-TW": "從觀眾與藝人兩端清晰說明贊助與積分流程。",
    },
    description: {
      ko: "참여 방식과 운영 시 유의점을 정리한 후원 기능 안내 가이드입니다.",
      en: "A practical walkthrough of point charging, support actions, and on-stage response etiquette.",
      zh: "整理参与方式与运营注意事项的赞助功能指南。",
      ja: "参加方法と運用時の注意点をまとめた後援機能ガイドです。",
      "zh-TW": "整理參與方式與運營注意事項的贊助功能指南。",
    },
    body: {
      intro: {
        ko: "후원 기능은 단순 결제가 아니라 관객 참여를 음악 경험으로 연결하는 장치입니다.",
        en: "Support features are not just payments; they are a participation channel tied to live experience.",
        zh: "赞助功能不只是支付，更是把观众参与连接到现场体验的通道。",
        ja: "後援機能は単なる決済ではなく、観客参加をライブ体験につなぐ仕組みです。",
        "zh-TW": "贊助功能不只是支付，更是把觀眾參與連接到現場體驗的通道。",
      },
      sections: [
        {
          heading: {
            ko: "후원 운영 기본",
            en: "Sponsorship Flow Basics",
            zh: "赞助流程基础",
            ja: "後援フローの基本",
            "zh-TW": "贊助流程基礎",
          },
          paragraphs: {
            ko: [
              "포인트 충전, 후원 메시지 전달, 실시간 리액션의 흐름을 간단히 안내하면 참여 장벽이 낮아집니다.",
              "후원 금액보다 감사 표현의 일관성이 중요하며, 반응 데이터는 다음 셋리스트 개선에 활용하세요.",
            ],
            en: [
              "Keep the flow simple: charge points, send support with a message, and acknowledge in real time.",
              "Consistent gratitude matters more than amount, and support trends should inform future set planning.",
            ],
            zh: [
              "把“充值-赞助-实时回应”流程讲清楚，可有效降低参与门槛。",
              "比金额更重要的是稳定表达感谢，并用赞助数据优化下次歌单。",
            ],
            ja: [
              "ポイント補充→後援→リアルタイム反応の流れを簡潔に案内すると参加ハードルが下がります。",
              "金額よりも感謝表現の一貫性が重要で、反応データは次回セット改善に活用できます。",
            ],
            "zh-TW": [
              "把「儲值-贊助-即時回應」流程講清楚，可有效降低參與門檻。",
              "比金額更重要的是穩定表達感謝，並用贊助數據優化下次歌單。",
            ],
          },
          checklist: {
            ko: ["후원 안내 멘트 통일", "실시간 감사 리액션", "후원 반응 로그 확인"],
            en: ["Standardize support guidance lines", "Give real-time thank-you reactions", "Review support trend logs"],
            zh: ["统一赞助引导话术", "实时感谢回应", "复盘赞助趋势数据"],
            ja: ["後援案内文を統一", "リアルタイムで感謝を返す", "後援トレンドを確認"],
            "zh-TW": ["統一贊助引導話術", "即時感謝回應", "回顧贊助趨勢數據"],
          },
        },
      ],
      closing: {
        ko: "투명한 안내와 성실한 감사가 후원 경험의 신뢰를 만듭니다.",
        en: "Clear guidance and sincere thanks are the foundation of trusted support experiences.",
        zh: "清晰说明与真诚感谢，是建立赞助信任的基础。",
        ja: "明確な案内と誠実な感謝が、後援体験の信頼を作ります。",
        "zh-TW": "清晰說明與真誠感謝，是建立贊助信任的基礎。",
      },
    },
  },
  {
    slug: "make-singer-profile-stand-out",
    relatedSlugs: ["busker-sns-link-strategy", "organize-booking-inquiries"],
    title: {
      ko: "싱어 프로필을 매력적으로 만드는 법",
      en: "How to Make Your Singer Profile Stand Out",
      zh: "如何打造更有吸引力的歌手主页",
      ja: "シンガープロフィールを魅力的にする方法",
      "zh-TW": "如何打造更有吸引力的歌手頁面",
    },
    excerpt: {
      ko: "첫 화면에서 신뢰와 개성을 동시에 전달하는 구성 원칙을 제안합니다.",
      en: "Build trust and personality at first glance with better profile structure.",
      zh: "通过主页结构在第一眼同时传达可信度与个性。",
      ja: "第一印象で信頼と個性を同時に伝える構成原則を紹介します。",
      "zh-TW": "透過頁面結構在第一眼同時傳達可信度與個性。",
    },
    description: {
      ko: "소개 문구, 대표 이미지, 링크 구성을 최적화하는 가이드입니다.",
      en: "Optimize bio copy, hero image, and external links to convert visitors into followers.",
      zh: "优化简介文案、封面形象与外部链接，提升关注转化。",
      ja: "紹介文、代表画像、リンク構成を最適化するガイドです。",
      "zh-TW": "優化簡介文案、封面形象與外部連結，提升關注轉化。",
    },
    body: {
      intro: {
        ko: "프로필은 공연 전 관객이 당신을 판단하는 가장 빠른 기준입니다.",
        en: "Your profile is the fastest trust signal before anyone hears you live.",
        zh: "在听到你现场表演前，主页就是观众判断你的最快信号。",
        ja: "プロフィールは、観客がライブ前にあなたを判断する最速の手がかりです。",
        "zh-TW": "在聽到你現場演出前，頁面就是觀眾判斷你的最快訊號。",
      },
      sections: [
        {
          heading: {
            ko: "프로필 구성 우선순위",
            en: "Profile Priorities",
            zh: "主页优化优先级",
            ja: "プロフィール最適化の優先順位",
            "zh-TW": "頁面優化優先順序",
          },
          paragraphs: {
            ko: [
              "한 줄 자기소개로 장르와 활동 지역을 먼저 보여주고, 대표 이미지는 음악 톤과 맞는 사진으로 통일하세요.",
              "외부 링크는 자주 쓰는 채널만 남기고 깨진 링크를 주기적으로 정리해 신뢰 손실을 줄이세요.",
            ],
            en: [
              "Lead with a one-line identity that states genre and main area, then use a hero image that matches your music mood.",
              "Keep only active external links and remove broken ones regularly to protect trust.",
            ],
            zh: [
              "先用一句话说明风格与活动区域，再用与音乐气质一致的主图建立形象。",
              "外链保留高频渠道并定期清理失效链接，避免信任流失。",
            ],
            ja: [
              "まず1行の自己紹介でジャンルと活動地域を示し、音楽トーンに合う代表画像で統一感を出しましょう。",
              "外部リンクは主要チャネルに絞り、無効リンクを定期的に整理して信頼低下を防ぎます。",
            ],
            "zh-TW": [
              "先用一句話說明風格與活動區域，再用與音樂氣質一致的主圖建立形象。",
              "外連保留高頻渠道並定期清理失效連結，避免信任流失。",
            ],
          },
          checklist: {
            ko: ["한 줄 소개 고정", "대표 이미지 톤 통일", "링크 동작 점검"],
            en: ["Fix one-line identity", "Unify profile image tone", "Check link health"],
            zh: ["固定一句话定位", "统一主图风格", "检查链接可用性"],
            ja: ["1行プロフィールを固定", "代表画像のトーン統一", "リンク動作を確認"],
            "zh-TW": ["固定一句話定位", "統一主圖風格", "檢查連結可用性"],
          },
        },
      ],
      closing: {
        ko: "프로필 품질은 공연 외 시간에도 팬 전환을 계속 만들어냅니다.",
        en: "A strong profile keeps converting interest into fandom even between shows.",
        zh: "高质量主页会在非演出时段持续把兴趣转化为粉丝。",
        ja: "質の高いプロフィールは、公演のない時間にもファン化を進めます。",
        "zh-TW": "高品質頁面會在非演出時段持續把興趣轉化為粉絲。",
      },
    },
  },
  {
    slug: "retain-fans-after-performance",
    relatedSlugs: ["how-to-engage-busking-audience", "how-to-write-live-show-announcements"],
    title: {
      ko: "공연 후 팬을 유지하는 방법",
      en: "How to Retain Fans After a Performance",
      zh: "演出后如何留住粉丝",
      ja: "公演後にファンを維持する方法",
      "zh-TW": "演出後如何留住粉絲",
    },
    excerpt: {
      ko: "공연 종료 이후 팬 이탈을 줄이기 위한 후속 소통 루틴을 설명합니다.",
      en: "Reduce fan drop-off with post-show messages, schedule updates, and consistent follow-up.",
      zh: "通过演后沟通、日程更新与固定回访降低粉丝流失。",
      ja: "終演後の案内と継続コミュニケーションで離脱を減らす方法を解説します。",
      "zh-TW": "透過演後溝通、日程更新與固定回訪降低粉絲流失。",
    },
    description: {
      ko: "공연 직후 감사 인사와 다음 일정 연결을 체계화하는 가이드입니다.",
      en: "Build a repeatable post-show routine that turns one-time viewers into returning fans.",
      zh: "系统化演后感谢与下次日程连接，提升复看率。",
      ja: "終演直後の感謝と次回案内を仕組み化するガイドです。",
      "zh-TW": "系統化演後感謝與下次日程連結，提升回看率。",
    },
    body: {
      intro: {
        ko: "공연의 진짜 성과는 끝난 뒤 다시 찾아오는 팬의 수에서 드러납니다.",
        en: "The real result of a show is how many people come back after it ends.",
        zh: "一场演出的真实成果，体现在演后有多少人愿意再回来。",
        ja: "公演の本当の成果は、終演後にどれだけ再訪してもらえるかで決まります。",
        "zh-TW": "一場演出的真實成果，體現在演後有多少人願意再回來。",
      },
      sections: [
        {
          heading: {
            ko: "공연 후 후속 루틴",
            en: "Post-Show Follow-Up Routine",
            zh: "演后跟进节奏",
            ja: "公演後フォローのルーティン",
            "zh-TW": "演後跟進節奏",
          },
          paragraphs: {
            ko: [
              "종료 직후 감사 메시지를 남기고, 24시간 내 하이라이트 콘텐츠와 다음 일정 예고를 연결하세요.",
              "팬 댓글과 후기에는 빠르게 답장해 관계를 유지하고, 정기 일정 공개로 재방문 기대를 만드세요.",
            ],
            en: [
              "Post a thank-you message right after the show, then share highlights and next schedule within 24 hours.",
              "Reply quickly to fan comments and keep a predictable schedule cadence to encourage return visits.",
            ],
            zh: [
              "结束后立即发布感谢信息，并在24小时内补充精彩片段与下一场预告。",
              "及时回复粉丝评论，配合稳定更新节奏，持续培养复看习惯。",
            ],
            ja: [
              "終演直後に感謝メッセージを出し、24時間以内にハイライトと次回予定を案内しましょう。",
              "コメント返信を素早く行い、定期的な日程公開で再訪期待を作ります。",
            ],
            "zh-TW": [
              "結束後立即發布感謝訊息，並在24小時內補充精彩片段與下一場預告。",
              "即時回覆粉絲留言，配合穩定更新節奏，持續培養回訪習慣。",
            ],
          },
          checklist: {
            ko: ["종료 직후 감사 공지", "차기 일정 사전 등록", "후기 댓글 응답 루틴"],
            en: ["Publish post-show thanks", "Pre-register next schedule", "Reply to fan feedback consistently"],
            zh: ["发布演后感谢", "提前登记下次日程", "固定回复粉丝反馈"],
            ja: ["終演後の感謝投稿", "次回日程を事前登録", "感想コメント返信を習慣化"],
            "zh-TW": ["發布演後感謝", "提前登記下次日程", "固定回覆粉絲回饋"],
          },
        },
      ],
      closing: {
        ko: "공연 후 24시간의 관리가 팬 유지율을 크게 바꿉니다.",
        en: "How you handle the 24 hours after a show can define long-term fan retention.",
        zh: "演后24小时的运营质量，会明显影响长期留存。",
        ja: "終演後24時間の運用品質が、長期的なファン維持率を左右します。",
        "zh-TW": "演後24小時的運營品質，會明顯影響長期留存。",
      },
    },
  },
  {
    slug: "choose-busking-location-guide",
    relatedSlugs: ["hongdae-yeonnam-busking-checklist", "pick-best-performance-time-slots"],
    title: {
      ko: "버스킹 장소 선택 가이드",
      en: "Busking Location Selection Guide",
      zh: "街演地点选择指南",
      ja: "路上ライブの場所選びガイド",
      "zh-TW": "街演地點選擇指南",
    },
    excerpt: {
      ko: "유동 인구, 소음 환경, 접근성을 기준으로 장소를 평가하는 방법을 안내합니다.",
      en: "Evaluate spots by dwell time, noise constraints, and practical audience access.",
      zh: "从停留时长、噪音限制与可达性评估演出地点。",
      ja: "滞在時間、騒音環境、アクセス性を基準に場所を評価する方法を説明します。",
      "zh-TW": "從停留時長、噪音限制與可達性評估演出地點。",
    },
    description: {
      ko: "사람이 많은 곳이 아니라 관객이 머무를 수 있는 곳을 찾는 전략 가이드입니다.",
      en: "Pick places where people can pause and listen, not just pass by.",
      zh: "不是只看人流，而是找“愿意停下来听”的位置。",
      ja: "通行量だけでなく、観客が立ち止まれる場所を見つける戦略ガイドです。",
      "zh-TW": "不是只看人流，而是找「願意停下來聽」的位置。",
    },
    body: {
      intro: {
        ko: "장소 선택은 무대의 절반입니다. 같은 곡도 장소에 따라 결과가 달라집니다.",
        en: "Location is half the performance; the same set can succeed or fail depending on the spot.",
        zh: "地点几乎决定半场表现：同一套歌单在不同点位结果会完全不同。",
        ja: "場所選びはステージの半分です。同じ曲でも場所で結果が変わります。",
        "zh-TW": "地點幾乎決定半場表現：同一套歌單在不同點位結果會完全不同。",
      },
      sections: [
        {
          heading: {
            ko: "장소 평가 기준",
            en: "Spot Evaluation Criteria",
            zh: "点位评估标准",
            ja: "場所評価の基準",
            "zh-TW": "點位評估標準",
          },
          paragraphs: {
            ko: [
              "통로형보다 광장형, 벤치 인근처럼 체류 가능한 공간을 우선 선택하세요.",
              "허가 규정과 주변 상권 거리, 비상 동선을 함께 확인하면 운영 리스크를 크게 줄일 수 있습니다.",
            ],
            en: [
              "Prioritize plazas or bench-adjacent spaces where people naturally stay, not narrow flow-only corridors.",
              "Check permit rules, shop distance, and emergency walkways together to reduce operational risk.",
            ],
            zh: [
              "优先选择广场型或座椅附近等可停留空间，而非纯通道型点位。",
              "同时核对许可规则、商户距离与应急通道，可显著降低运营风险。",
            ],
            ja: [
              "通路型より、広場やベンチ周辺など滞在しやすい場所を優先しましょう。",
              "許可規定、周辺店舗との距離、緊急導線を同時に確認すると運用リスクを下げられます。",
            ],
            "zh-TW": [
              "優先選擇廣場型或座椅附近等可停留空間，而非純通道型點位。",
              "同時核對許可規則、商家距離與緊急通道，可明顯降低運營風險。",
            ],
          },
          checklist: {
            ko: ["체류 공간 여부", "소음/허가 조건 확인", "보행 동선 방해 점검"],
            en: ["Verify dwell-friendly space", "Check noise/permit constraints", "Ensure walkway safety"],
            zh: ["确认可停留空间", "核查噪音/许可条件", "确保不阻碍通行"],
            ja: ["滞在しやすさ確認", "騒音/許可条件確認", "通行妨害がないか点検"],
            "zh-TW": ["確認可停留空間", "核查噪音/許可條件", "確保不阻礙通行"],
          },
        },
      ],
      closing: {
        ko: "좋은 장소를 찾는 습관이 장기적으로 가장 큰 성과 차이를 만듭니다.",
        en: "Consistent location scouting creates the biggest long-term performance gains.",
        zh: "持续做点位复盘与勘察，才是长期提升的关键。",
        ja: "継続的な場所検証こそ、長期的な成果差を生みます。",
        "zh-TW": "持續做點位復盤與勘察，才是長期提升的關鍵。",
      },
    },
  },
  {
    slug: "pick-best-performance-time-slots",
    relatedSlugs: ["choose-busking-location-guide", "how-to-write-live-show-announcements"],
    title: {
      ko: "공연 일정 시간대 고르는 법",
      en: "How to Pick the Best Performance Time Slots",
      zh: "如何选择最佳演出时段",
      ja: "最適な公演時間帯の選び方",
      "zh-TW": "如何選擇最佳演出時段",
    },
    excerpt: {
      ko: "관객 유입과 체류를 고려해 시간대를 전략적으로 선택하는 기준을 설명합니다.",
      en: "Match genre and audience behavior by weekday/weekend pattern and golden-hour timing.",
      zh: "结合平日/周末人群特征与黄金时段，策略化选择开演时间。",
      ja: "平日/週末の観客特性とゴールデンアワーを踏まえた時間帯選定を解説します。",
      "zh-TW": "結合平日/週末人群特徵與黃金時段，策略化選擇開演時間。",
    },
    description: {
      ko: "요일과 시간별 관객 패턴을 반영한 공연 시간 운영 가이드입니다.",
      en: "Plan recurring slots with data, not guesswork.",
      zh: "基于数据而非感觉，建立可复用的时段运营策略。",
      ja: "曜日と時間帯ごとの観客パターンを反映した運用ガイドです。",
      "zh-TW": "基於數據而非感覺，建立可複用的時段運營策略。",
    },
    body: {
      intro: {
        ko: "같은 장소에서도 시간대가 바뀌면 관객 구성과 반응이 크게 달라집니다.",
        en: "Even at the same spot, audience profile and response can shift dramatically by time slot.",
        zh: "同一地点在不同时段，观众结构与反应会明显不同。",
        ja: "同じ場所でも時間帯が変わると観客構成と反応は大きく変わります。",
        "zh-TW": "同一地點在不同時段，觀眾結構與反應會明顯不同。",
      },
      sections: [
        {
          heading: {
            ko: "시간대 운영 방식",
            en: "Time-Slot Strategy",
            zh: "时段运营方式",
            ja: "時間帯運用の戦略",
            "zh-TW": "時段運營方式",
          },
          paragraphs: {
            ko: [
              "평일 저녁과 주말 오후처럼 관객 성향이 다른 구간을 나눠 장르와 멘트 톤을 맞추세요.",
              "요일별 반응 로그를 기록하고 시작 시간을 30분 단위로 조정하면 성과 해석이 쉬워집니다.",
            ],
            en: [
              "Split slots by audience type, such as weekday evening versus weekend afternoon, and adapt genre and talk tone accordingly.",
              "Track day-by-day response logs and tune start times in 30-minute increments for clearer performance insights.",
            ],
            zh: [
              "按观众类型拆分时段（如工作日晚间与周末下午），同步调整曲风与话术节奏。",
              "记录按星期的反馈数据，并以30分钟粒度微调开演时间，便于复盘判断。",
            ],
            ja: [
              "平日夜と週末午後のように観客タイプで時間帯を分け、ジャンルとMCトーンを合わせましょう。",
              "曜日別ログを取り、開始時刻を30分単位で微調整すると成果分析がしやすくなります。",
            ],
            "zh-TW": [
              "按觀眾類型拆分時段（如工作日晚間與週末下午），同步調整曲風與話術節奏。",
              "記錄按星期的回饋數據，並以30分鐘粒度微調開演時間，便於復盤判斷。",
            ],
          },
          checklist: {
            ko: ["타겟 시간대 정의", "일몰/조명 조건 확인", "요일별 반응 로그 기록"],
            en: ["Define target slots", "Check sunset/light conditions", "Log weekday response trends"],
            zh: ["定义目标时段", "确认日落与照明条件", "记录按星期反馈"],
            ja: ["対象時間帯を定義", "日没/照明条件を確認", "曜日別反応を記録"],
            "zh-TW": ["定義目標時段", "確認日落與照明條件", "記錄按星期回饋"],
          },
        },
      ],
      closing: {
        ko: "시간대 최적화는 적은 자원으로 최대 반응을 얻는 가장 현실적인 전략입니다.",
        en: "Time-slot optimization is one of the highest-impact, lowest-cost improvements you can make.",
        zh: "时段优化是低成本、高收益的关键运营动作。",
        ja: "時間帯最適化は、低コストで効果が大きい運用改善です。",
        "zh-TW": "時段優化是低成本、高收益的關鍵運營動作。",
      },
    },
  },
  {
    slug: "busking-tips-rainy-cold-weather",
    relatedSlugs: ["outdoor-busking-gear-basics", "pick-best-performance-time-slots"],
    title: {
      ko: "비 오는 날/추운 날 버스킹 운영 팁",
      en: "Busking Tips for Rainy or Cold Weather",
      zh: "雨天/寒冷天气街演运营技巧",
      ja: "雨天・寒冷時の路上ライブ運用のコツ",
      "zh-TW": "雨天/寒冷天氣街演運營技巧",
    },
    excerpt: {
      ko: "악천후에서 장비와 컨디션을 지키는 안전 중심 운영 기준을 소개합니다.",
      en: "Protect gear and performance quality in bad weather with clear safety thresholds.",
      zh: "在恶劣天气下以安全为先，保护设备与演出状态。",
      ja: "悪天候で機材とコンディションを守る安全重視の運用基準を紹介します。",
      "zh-TW": "在惡劣天氣下以安全為先，保護設備與演出狀態。",
    },
    description: {
      ko: "우천/한파 상황의 장비 보호, 관객 안내, 중단 기준을 정리한 가이드입니다.",
      en: "A practical weather-response guide for outdoor continuity and safety.",
      zh: "整理雨天与低温场景下的设备保护、观众引导与停演判断。",
      ja: "雨天/寒波時の機材保護、観客案内、中断基準を整理したガイドです。",
      "zh-TW": "整理雨天與低溫場景下的設備保護、觀眾引導與停演判斷。",
    },
    body: {
      intro: {
        ko: "날씨는 통제할 수 없지만, 대응 기준은 미리 설계할 수 있습니다.",
        en: "You cannot control weather, but you can control your response standard.",
        zh: "天气无法控制，但应对标准可以提前制定。",
        ja: "天候は制御できませんが、対応基準は事前に設計できます。",
        "zh-TW": "天氣無法控制，但應對標準可以提前制定。",
      },
      sections: [
        {
          heading: {
            ko: "악천후 대응 기준",
            en: "Bad-Weather Response Standard",
            zh: "恶劣天气应对标准",
            ja: "悪天候対応の基準",
            "zh-TW": "惡劣天氣應對標準",
          },
          paragraphs: {
            ko: [
              "방수 커버, 바닥 분리, 케이블 고정은 기본으로 준비하고 강수량/체감온도 기준으로 운영·축소·중단 규칙을 정하세요.",
              "장소나 일정이 바뀌면 즉시 공지해 관객 이동 혼선을 줄이고 신뢰를 유지해야 합니다.",
            ],
            en: [
              "Prepare waterproof covers, floor isolation, and cable fixes, then define operate/reduce/stop thresholds by rain and temperature.",
              "If location or schedule changes, announce quickly to reduce audience confusion and protect trust.",
            ],
            zh: [
              "防水罩、离地防潮、线材固定要作为基础，并按降雨与体感温度设定“继续/缩短/中止”标准。",
              "若场地或时间变更，需立即发布通知，减少观众误判并维护信任。",
            ],
            ja: [
              "防水カバー、床面からの隔離、ケーブル固定を基本に、降雨量と体感温度で実施/縮小/中止基準を決めましょう。",
              "場所や時間が変わる場合は即時告知し、観客の混乱を防いで信頼を守ります。",
            ],
            "zh-TW": [
              "防水罩、離地防潮、線材固定要作為基礎，並按降雨與體感溫度設定「繼續/縮短/中止」標準。",
              "若場地或時間變更，需立即發布通知，減少觀眾誤判並維護信任。",
            ],
          },
          checklist: {
            ko: ["방수/보온 장비 준비", "중단 기준 사전 합의", "일정 변경 공지 템플릿"],
            en: ["Pack weather protection gear", "Agree stop thresholds in advance", "Prepare change-notice template"],
            zh: ["准备防水保暖装备", "提前约定停演标准", "准备改期通知模板"],
            ja: ["防水・防寒装備を準備", "中断基準を事前共有", "変更告知テンプレート準備"],
            "zh-TW": ["準備防水保暖裝備", "提前約定停演標準", "準備改期通知模板"],
          },
        },
      ],
      closing: {
        ko: "안전을 지키는 운영이 결국 가장 프로다운 공연입니다.",
        en: "The most professional show is the one that stays safe under pressure.",
        zh: "在压力环境下守住安全，才是最专业的演出运营。",
        ja: "厳しい条件でも安全を守る運用こそ、最もプロフェッショナルです。",
        "zh-TW": "在壓力環境下守住安全，才是最專業的演出運營。",
      },
    },
  },
  {
    slug: "portrait-rights-filming-guidelines",
    relatedSlugs: ["how-audience-finds-good-busking", "multilingual-guide-operations-tips"],
    title: {
      ko: "초상권과 촬영 안내 기본 원칙",
      en: "Portrait Rights and Filming Guidelines",
      zh: "肖像权与拍摄告知基本原则",
      ja: "肖像権と撮影案内の基本原則",
      "zh-TW": "肖像權與拍攝告知基本原則",
    },
    excerpt: {
      ko: "촬영 환경에서 관객과 버스커를 모두 배려하는 안내 문구와 운영 원칙을 정리합니다.",
      en: "Protect audience privacy while recording performances through clear, proactive notices.",
      zh: "通过清晰告知在拍摄中兼顾观众隐私与演出记录。",
      ja: "撮影時に観客配慮と公演記録を両立させる案内基準を整理します。",
      "zh-TW": "透過清晰告知在拍攝中兼顧觀眾隱私與演出記錄。",
    },
    description: {
      ko: "촬영 고지, 민감 상황 대응, SNS 업로드 배려를 다루는 가이드입니다.",
      en: "A practical framework for consent messaging, sensitive cases, and respectful uploads.",
      zh: "涵盖拍摄告知、敏感场景应对与社媒发布礼仪。",
      ja: "撮影告知、配慮が必要な場面の対応、SNS投稿時のマナーを扱います。",
      "zh-TW": "涵蓋拍攝告知、敏感場景應對與社群發布禮儀。",
    },
    body: {
      intro: {
        ko: "촬영은 홍보에 도움이 되지만, 배려 없는 기록은 신뢰를 잃게 만듭니다.",
        en: "Recording helps promotion, but recording without consent can quickly damage trust.",
        zh: "拍摄有助传播，但缺乏同意与说明会迅速损害信任。",
        ja: "撮影は宣伝に有効ですが、配慮のない記録は信頼を損ないます。",
        "zh-TW": "拍攝有助傳播，但缺乏同意與說明會迅速損害信任。",
      },
      sections: [
        {
          heading: {
            ko: "촬영 고지와 배려 원칙",
            en: "Filming Notice and Respect Principles",
            zh: "拍摄告知与尊重原则",
            ja: "撮影告知と配慮の原則",
            "zh-TW": "拍攝告知與尊重原則",
          },
          paragraphs: {
            ko: [
              "공연 시작 전에 촬영 목적과 노출 범위를 짧게 안내하고, 원치 않는 관객 요청에는 즉시 대응하세요.",
              "SNS 업로드 시 타 관객의 얼굴 처리 기준을 함께 안내하면 갈등을 사전에 줄일 수 있습니다.",
            ],
            en: [
              "Before starting, state filming purpose and exposure range briefly, and respond immediately to opt-out requests.",
              "When sharing online, provide clear guidance on masking other audience faces to reduce conflicts.",
            ],
            zh: [
              "开演前简短说明拍摄目的与拍摄范围，对不愿出镜的请求即时处理。",
              "发布到社媒时同步说明他人面部处理规则，可提前减少纠纷。",
            ],
            ja: [
              "開始前に撮影目的と映り込み範囲を簡潔に案内し、映り込み拒否には即時対応しましょう。",
              "SNS投稿時は他観客の顔処理ルールも示すと、トラブルを未然に減らせます。",
            ],
            "zh-TW": [
              "開演前簡短說明拍攝目的與拍攝範圍，對不願入鏡的請求即時處理。",
              "發布到社群時同步說明他人臉部處理規則，可提前減少糾紛。",
            ],
          },
          checklist: {
            ko: ["촬영 고지 멘트", "거부 요청 대응 절차", "SNS 업로드 배려 문구"],
            en: ["Prepare filming notice line", "Define opt-out response steps", "Add respectful upload guidance"],
            zh: ["准备拍摄告知话术", "定义拒拍处理流程", "补充文明发布说明"],
            ja: ["撮影告知文を準備", "拒否時対応フローを定義", "投稿時の配慮文を追加"],
            "zh-TW": ["準備拍攝告知話術", "定義拒拍處理流程", "補充文明發布說明"],
          },
        },
      ],
      closing: {
        ko: "권리를 존중하는 운영이 결국 더 건강한 팬 문화를 만듭니다.",
        en: "Respecting rights is what builds a healthier and more loyal audience culture.",
        zh: "尊重权利的现场管理，才能沉淀更健康的粉丝文化。",
        ja: "権利を尊重する運用が、健全で長く続くファン文化を作ります。",
        "zh-TW": "尊重權利的現場管理，才能沉澱更健康的粉絲文化。",
      },
    },
  },
  {
    slug: "how-audience-finds-good-busking",
    relatedSlugs: ["how-to-engage-busking-audience", "portrait-rights-filming-guidelines"],
    title: {
      ko: "관객 입장에서 좋은 버스킹 찾는 법",
      en: "How Audiences Can Find Great Busking",
      zh: "观众视角：如何找到优质街演",
      ja: "観客目線で良い路上ライブを見つける方法",
      "zh-TW": "觀眾視角：如何找到優質街演",
    },
    excerpt: {
      ko: "공연 선택 시 확인할 신호와 현장 매너 기준을 관객 관점에서 안내합니다.",
      en: "Use profile signals, announcement quality, and on-site etiquette cues to pick better performances.",
      zh: "从主页信息、公告质量与现场礼仪信号判断演出质量。",
      ja: "プロフィール情報、告知品質、現場マナーを手がかりに公演を選ぶ方法を説明します。",
      "zh-TW": "從頁面資訊、公告品質與現場禮儀訊號判斷演出品質。",
    },
    description: {
      ko: "관객이 취향에 맞는 공연을 더 정확히 찾도록 돕는 탐색 가이드입니다.",
      en: "A viewer-focused checklist for finding shows worth staying for.",
      zh: "帮助观众更高效找到“值得停留”的演出。",
      ja: "観客が自分に合う公演を見つけるための探索ガイドです。",
      "zh-TW": "幫助觀眾更高效找到「值得停留」的演出。",
    },
    body: {
      intro: {
        ko: "좋은 버스킹은 유명세보다 안내 정확도와 현장 배려에서 먼저 드러납니다.",
        en: "Great busking is often revealed first by clear information and respectful on-site operation.",
        zh: "优质街演往往先体现在信息清晰度与现场秩序感，而非知名度。",
        ja: "良い路上ライブは知名度より、情報の正確さと現場配慮に表れます。",
        "zh-TW": "優質街演往往先體現在資訊清晰度與現場秩序感，而非知名度。",
      },
      sections: [
        {
          heading: {
            ko: "관객용 선택 기준",
            en: "Viewer Selection Criteria",
            zh: "观众筛选标准",
            ja: "観客向けの選定基準",
            "zh-TW": "觀眾篩選標準",
          },
          paragraphs: {
            ko: [
              "공지의 위치 정확성, 시간 준수, 참여 안내가 명확한 팀일수록 현장 경험의 품질이 높습니다.",
              "프로필과 라이브룸에서 소통 태도, 촬영 배려, 신청곡 응답 방식을 확인하면 실패 확률을 줄일 수 있습니다.",
            ],
            en: [
              "Teams with precise location details, schedule reliability, and clear participation guidance usually deliver better experiences.",
              "Check communication tone, filming etiquette, and request handling in profile/live room before committing your time.",
            ],
            zh: [
              "地点准确、时间守约、参与说明清楚的团队，现场体验通常更稳定。",
              "在主页和直播间先看沟通方式、拍摄礼仪与点歌回应，可降低踩雷概率。",
            ],
            ja: [
              "位置情報が正確で時間厳守、参加案内が明確なチームほど現場体験の品質が高い傾向があります。",
              "プロフィールやライブルームで、対話姿勢・撮影配慮・リクエスト対応を確認すると失敗を減らせます。",
            ],
            "zh-TW": [
              "地點準確、時間守約、參與說明清楚的團隊，現場體驗通常更穩定。",
              "在頁面和直播間先看溝通方式、拍攝禮儀與點歌回應，可降低踩雷機率。",
            ],
          },
          checklist: {
            ko: ["공지 정확도 확인", "프로필 정보 일관성", "현장 매너와 소통 품질"],
            en: ["Verify announcement accuracy", "Check profile consistency", "Observe etiquette and interaction quality"],
            zh: ["核对公告准确性", "检查主页信息一致性", "观察礼仪与互动质量"],
            ja: ["告知の正確性確認", "プロフィール情報の整合性", "マナーと対話品質を観察"],
            "zh-TW": ["核對公告準確性", "檢查頁面資訊一致性", "觀察禮儀與互動品質"],
          },
        },
      ],
      closing: {
        ko: "좋은 선택 기준을 가진 관객이 결국 더 좋은 거리 공연 문화를 만듭니다.",
        en: "Better audience choices help great street performance culture grow faster.",
        zh: "观众选择标准越成熟，优质街演文化就成长得越快。",
        ja: "観客の選択基準が育つほど、良い路上ライブ文化は早く広がります。",
        "zh-TW": "觀眾選擇標準越成熟，優質街演文化就成長得越快。",
      },
    },
  },
  {
    slug: "liveroom-sponsorship-guide",
    relatedSlugs: ["sponsorship-and-points-explained", "ads-sponsorship-feature-explained"],
    title: {
      ko: "라이브룸에서 후원하기 가이드",
      en: "Live Room Sponsorship Guide",
      zh: "直播间赞助参与指南",
      ja: "ライブルーム後援ガイド",
      "zh-TW": "直播間贊助參與指南",
    },
    excerpt: {
      ko: "라이브룸에서 후원 참여를 자연스럽게 진행하는 흐름과 주의점을 안내합니다.",
      en: "Learn a smooth support flow in live room without interrupting the performance.",
      zh: "在不打断演出的前提下完成直播间赞助参与。",
      ja: "公演の流れを崩さずにライブルームで後援参加する方法を解説します。",
      "zh-TW": "在不打斷演出的前提下完成直播間贊助參與。",
    },
    description: {
      ko: "포인트 확인부터 후원 메시지 작성까지 핵심 단계를 정리한 가이드입니다.",
      en: "A short step-by-step guide from point check to support message timing.",
      zh: "从余额确认到留言时机的简明步骤指南。",
      ja: "ポイント確認から後援メッセージ送信までの要点を整理したガイドです。",
      "zh-TW": "從餘額確認到留言時機的簡明步驟指南。",
    },
    body: {
      intro: {
        ko: "라이브룸 후원은 공연 몰입을 해치지 않는 타이밍 선택이 중요합니다.",
        en: "In live room support, timing matters as much as the amount.",
        zh: "直播间赞助中，时机与金额同样重要。",
        ja: "ライブルーム後援では、金額と同じくらいタイミングが重要です。",
        "zh-TW": "直播間贊助中，時機與金額同樣重要。",
      },
      sections: [
        {
          heading: {
            ko: "라이브룸 후원 참여 방법",
            en: "How to Participate in Live Room Support",
            zh: "直播间赞助参与方式",
            ja: "ライブルーム後援の参加方法",
            "zh-TW": "直播間贊助參與方式",
          },
          paragraphs: {
            ko: [
              "포인트 잔액과 안내 문구를 먼저 확인한 뒤, 곡 사이 타이밍에 짧은 응원 메시지와 함께 참여하세요.",
              "후원 후에는 아티스트 리액션을 확인하고 다음 참여를 위해 실패/지연 상황을 기록해두면 좋습니다.",
            ],
            en: [
              "Check point balance and instructions first, then support during song breaks with a short encouraging message.",
              "After supporting, watch artist reactions and note any delays or errors to improve your next participation.",
            ],
            zh: [
              "先确认积分余额与提示说明，再在曲间空档发送简短应援留言参与。",
              "赞助后观察艺人回应，并记录延迟或失败情况，便于下次更顺畅参与。",
            ],
            ja: [
              "まずポイント残高と案内文を確認し、曲間のタイミングで短い応援メッセージとともに参加しましょう。",
              "参加後はアーティスト反応を確認し、遅延や失敗を記録して次回の参加精度を上げます。",
            ],
            "zh-TW": [
              "先確認積分餘額與提示說明，再在曲間空檔送出簡短應援留言參與。",
              "贊助後觀察藝人回應，並記錄延遲或失敗情況，便於下次更順暢參與。",
            ],
          },
          checklist: {
            ko: ["포인트 잔액 확인", "곡 사이 참여", "후원 알림 확인"],
            en: ["Check point balance", "Support between songs", "Confirm support notification"],
            zh: ["确认积分余额", "选择曲间参与", "确认赞助提示"],
            ja: ["ポイント残高確認", "曲間に参加", "後援通知を確認"],
            "zh-TW": ["確認積分餘額", "選擇曲間參與", "確認贊助提示"],
          },
        },
      ],
      closing: {
        ko: "공연 흐름을 존중하는 참여가 가장 만족도 높은 후원 경험을 만듭니다.",
        en: "Support that respects show flow creates the best experience for everyone.",
        zh: "尊重演出节奏的赞助方式，才能让双方体验更好。",
        ja: "公演の流れを尊重する参加が、最も満足度の高い後援体験につながります。",
        "zh-TW": "尊重演出節奏的贊助方式，才能讓雙方體驗更好。",
      },
    },
  },
  {
    slug: "ads-sponsorship-feature-explained",
    relatedSlugs: ["sponsorship-and-points-explained", "liveroom-sponsorship-guide"],
    title: {
      ko: "광고 후원 기능을 이해하는 법",
      en: "Understanding the Ad-Based Sponsorship Feature",
      zh: "理解广告赞助功能",
      ja: "広告視聴後援機能を理解する",
      "zh-TW": "理解廣告贊助功能",
    },
    excerpt: {
      ko: "광고 기반 후원 기능의 원리와 사용자 관점 운영 포인트를 설명합니다.",
      en: "Learn how ad-view support works and when to use it without disrupting live flow.",
      zh: "说明广告赞助原理与不打断演出时的参与要点。",
      ja: "広告視聴型後援の仕組みと、運用時に押さえるポイントを解説します。",
      "zh-TW": "說明廣告贊助原理與不打斷演出時的參與要點。",
    },
    description: {
      ko: "무료 후원 참여 흐름과 확인해야 할 핵심 정보를 정리한 가이드입니다.",
      en: "A practical guide to free support participation via ad views.",
      zh: "整理广告观看后免费赞助的参与流程与核对要点。",
      ja: "無料後援参加の流れと確認項目を整理したガイドです。",
      "zh-TW": "整理廣告觀看後免費贊助的參與流程與核對要點。",
    },
    body: {
      intro: {
        ko: "광고 후원은 포인트가 없을 때도 참여를 이어갈 수 있게 해주는 보완 수단입니다.",
        en: "Ad-based support provides a low-barrier way to contribute when points are unavailable.",
        zh: "广告赞助为“无积分也能参与”提供了低门槛通道。",
        ja: "広告後援は、ポイントがない状況でも参加できる補助手段です。",
        "zh-TW": "廣告贊助為「無積分也能參與」提供了低門檻通道。",
      },
      sections: [
        {
          heading: {
            ko: "광고 후원 참여 기준",
            en: "Ad-Support Participation Basics",
            zh: "广告赞助参与基础",
            ja: "広告後援参加の基本",
            "zh-TW": "廣告贊助參與基礎",
          },
          paragraphs: {
            ko: [
              "네트워크 상태와 안내 문구를 확인한 뒤, 대기 시간이나 곡 사이 타이밍에 참여하는 것이 좋습니다.",
              "광고 시청 완료 후 후원 반영 여부를 반드시 확인하고, 과도한 반복보다 필요한 순간에 활용하세요.",
            ],
            en: [
              "Check network quality and on-screen guidance, then participate during breaks or between songs.",
              "Always verify support completion after ad view, and use the feature at meaningful moments rather than excessive repeats.",
            ],
            zh: [
              "先确认网络与界面提示，再在候场或曲间参与更不影响观看体验。",
              "观看完成后务必核对赞助是否到账，避免过度重复触发。",
            ],
            ja: [
              "通信状態と案内文を確認し、待機時間や曲間で参加すると視聴体験を妨げにくくなります。",
              "視聴完了後は反映を必ず確認し、過度な連続利用より必要な場面で活用しましょう。",
            ],
            "zh-TW": [
              "先確認網路與介面提示，再在候場或曲間參與較不影響觀看體驗。",
              "觀看完成後務必核對贊助是否入帳，避免過度重複觸發。",
            ],
          },
          checklist: {
            ko: ["네트워크 상태 점검", "완료 팝업 확인", "공연 흐름 맞춘 참여"],
            en: ["Check network stability", "Confirm completion popup", "Participate at flow-friendly timing"],
            zh: ["检查网络稳定性", "确认完成提示", "选择不打断节奏的时机"],
            ja: ["通信安定性を確認", "完了ポップアップ確認", "流れを崩さないタイミングで参加"],
            "zh-TW": ["檢查網路穩定性", "確認完成提示", "選擇不打斷節奏的時機"],
          },
        },
      ],
      closing: {
        ko: "광고 후원은 선택지를 넓히는 기능이며, 명확한 안내가 신뢰를 완성합니다.",
        en: "Ad support expands participation options, and clear guidance keeps it trustworthy.",
        zh: "广告赞助扩大了参与路径，而清晰说明决定其可信度。",
        ja: "広告後援は参加の選択肢を広げ、明確な案内が信頼を担保します。",
        "zh-TW": "廣告贊助擴大了參與路徑，而清晰說明決定其可信度。",
      },
    },
  },
  {
    slug: "busker-sns-link-strategy",
    relatedSlugs: ["make-singer-profile-stand-out", "retain-fans-after-performance"],
    title: {
      ko: "버스커의 SNS 연결 전략",
      en: "SNS Linking Strategy for Buskers",
      zh: "街头艺人的社媒链接策略",
      ja: "バスカー向けSNS連携戦略",
      "zh-TW": "街頭藝人的社群連結策略",
    },
    excerpt: {
      ko: "프로필과 SNS를 유기적으로 연결해 팬 유입과 재방문을 높이는 구조를 제시합니다.",
      en: "Connect profile and social channels into one clear journey from discovery to return.",
      zh: "把主页与社媒串成一条清晰路径，提升新客转粉与复访。",
      ja: "プロフィールとSNSを連動させ、流入と再訪を伸ばす構成を提案します。",
      "zh-TW": "把頁面與社群串成一條清晰路徑，提升新客轉粉與回訪。",
    },
    description: {
      ko: "채널 역할 분리와 링크 구조 최적화로 팬 소통을 강화하는 가이드입니다.",
      en: "Assign clear channel roles and simplify links to reduce fan drop-off.",
      zh: "通过渠道分工与链接结构优化，降低粉丝流失。",
      ja: "チャネル役割分担とリンク最適化でファン導線を強化するガイドです。",
      "zh-TW": "透過渠道分工與連結結構優化，降低粉絲流失。",
    },
    body: {
      intro: {
        ko: "공연이 끝난 뒤 팬이 어디로 이동하는지가 장기 성장의 핵심입니다.",
        en: "Long-term growth depends on where fans go after your performance ends.",
        zh: "长期增长的关键，在于演出结束后粉丝被引导到哪里。",
        ja: "長期成長の鍵は、公演後にファンをどこへ導くかにあります。",
        "zh-TW": "長期成長的關鍵，在於演出結束後粉絲被引導到哪裡。",
      },
      sections: [
        {
          heading: {
            ko: "채널 연결 구조",
            en: "Cross-Channel Link Structure",
            zh: "跨渠道连接结构",
            ja: "チャネル横断の導線設計",
            "zh-TW": "跨渠道連結結構",
          },
          paragraphs: {
            ko: [
              "공지 채널, 영상 채널, 소통 채널의 역할을 분리하고 중심 허브를 프로필 하나로 통일하세요.",
              "만료 링크를 주기적으로 정리하고 현장 QR 동선을 단순화하면 팔로우 전환율이 높아집니다.",
            ],
            en: [
              "Separate roles for announcement, video, and interaction channels, then unify them through one profile hub.",
              "Clean expired links regularly and simplify QR flow on site to improve follow conversion.",
            ],
            zh: [
              "将公告、视频、互动渠道分工明确，并以一个主页作为统一入口。",
              "定期清理失效链接并简化现场二维码动线，可提升关注转化率。",
            ],
            ja: [
              "告知・動画・交流チャネルの役割を分け、1つのプロフィールを中心ハブに統一しましょう。",
              "無効リンクを定期整理し、現場QR導線を単純化するとフォロー転換率が上がります。",
            ],
            "zh-TW": [
              "將公告、影片、互動渠道分工明確，並以一個頁面作為統一入口。",
              "定期清理失效連結並簡化現場QR動線，可提升關注轉化率。",
            ],
          },
          checklist: {
            ko: ["채널 역할 정의", "허브 링크 고정", "QR 안내 동선 단순화"],
            en: ["Define channel roles", "Pin one hub link", "Simplify QR onboarding"],
            zh: ["定义渠道分工", "固定统一入口链接", "简化二维码引导"],
            ja: ["チャネル役割を定義", "ハブリンクを固定", "QR導線を簡素化"],
            "zh-TW": ["定義渠道分工", "固定統一入口連結", "簡化QR引導"],
          },
        },
      ],
      closing: {
        ko: "링크 전략은 노출보다 다음 행동으로 이어지는 구조가 핵심입니다.",
        en: "The best link strategy is not more exposure, but fewer clicks to the next action.",
        zh: "链接策略的关键不在曝光量，而在“下一步动作”是否顺畅。",
        ja: "リンク戦略の本質は露出量ではなく、次の行動までの摩擦を減らすことです。",
        "zh-TW": "連結策略的關鍵不在曝光量，而在「下一步動作」是否順暢。",
      },
    },
  },
  {
    slug: "organize-booking-inquiries",
    relatedSlugs: ["make-singer-profile-stand-out", "busker-sns-link-strategy"],
    title: {
      ko: "공연 예약/섭외 문의를 정리하는 법",
      en: "How to Organize Booking Inquiries",
      zh: "如何整理演出预约/邀约咨询",
      ja: "公演予約・出演依頼を整理する方法",
      "zh-TW": "如何整理演出預約/邀約詢問",
    },
    excerpt: {
      ko: "문의를 표준 양식으로 정리해 응답 속도와 계약 전환율을 높이는 방법을 소개합니다.",
      en: "Standardize inquiry intake to respond faster and convert more offers into confirmed bookings.",
      zh: "通过标准化收集表提升回复速度与签约转化率。",
      ja: "問い合わせを標準化し、返信速度と成約率を高める方法を紹介します。",
      "zh-TW": "透過標準化收集表提升回覆速度與簽約轉化率。",
    },
    description: {
      ko: "접수 항목, 우선순위 분류, 응답 템플릿을 정리하는 운영 가이드입니다.",
      en: "A practical operations guide for intake forms, priority rules, and response templates.",
      zh: "涵盖信息收集项、优先级规则与回复模板的运营指南。",
      ja: "受付項目、優先順位、返信テンプレートを整える運用ガイドです。",
      "zh-TW": "涵蓋資訊收集項、優先級規則與回覆模板的運營指南。",
    },
    body: {
      intro: {
        ko: "문의 관리는 행정이 아니라 공연 기회를 놓치지 않기 위한 핵심 운영입니다.",
        en: "Inquiry management is not paperwork; it is opportunity management.",
        zh: "咨询管理不是琐事，而是机会管理。",
        ja: "問い合わせ管理は事務作業ではなく、機会管理そのものです。",
        "zh-TW": "詢問管理不是瑣事，而是機會管理。",
      },
      sections: [
        {
          heading: {
            ko: "문의 운영 체계",
            en: "Inquiry Workflow System",
            zh: "咨询处理体系",
            ja: "問い合わせ運用フロー",
            "zh-TW": "詢問處理體系",
          },
          paragraphs: {
            ko: [
              "일시, 장소, 예산, 공연 목적, 장비 조건을 필수 항목으로 받아 초기 왕복 커뮤니케이션을 줄이세요.",
              "수락/거절/조율 템플릿을 준비하면 답장 품질을 유지하면서 응답 속도를 높일 수 있습니다.",
            ],
            en: [
              "Require core fields like date, venue, budget, purpose, and audio conditions to reduce back-and-forth.",
              "Prepare accept/decline/negotiate templates to improve reply speed while keeping communication quality consistent.",
            ],
            zh: [
              "把日期、地点、预算、活动目的与音响条件设为必填，减少来回追问。",
              "预设接单/婉拒/协商模板，可在保证专业度的同时提升回复效率。",
            ],
            ja: [
              "日時・場所・予算・目的・音響条件を必須項目にし、初期の往復連絡を減らしましょう。",
              "受諾/辞退/調整テンプレートを準備すると、品質を保ちながら返信速度を上げられます。",
            ],
            "zh-TW": [
              "把日期、地點、預算、活動目的與音響條件設為必填，減少來回追問。",
              "預設接單/婉拒/協商模板，可在維持專業度的同時提升回覆效率。",
            ],
          },
          checklist: {
            ko: ["필수 접수 항목 고정", "응답 템플릿 준비", "월별 문의 전환율 기록"],
            en: ["Fix mandatory intake fields", "Prepare response templates", "Track monthly conversion rate"],
            zh: ["固定必填收集项", "准备回复模板", "记录月度转化率"],
            ja: ["必須受付項目を固定", "返信テンプレート準備", "月次転換率を記録"],
            "zh-TW": ["固定必填收集項", "準備回覆模板", "記錄月度轉化率"],
          },
        },
      ],
      closing: {
        ko: "정리된 문의 운영은 더 좋은 공연 기회를 선택할 수 있는 여유를 만듭니다.",
        en: "Organized inquiry handling gives you room to choose better opportunities.",
        zh: "有序的询问管理，能让你把精力留给更好的合作机会。",
        ja: "整理された運用は、より良い案件を選ぶ余裕を生みます。",
        "zh-TW": "有序的詢問管理，能讓你把精力留給更好的合作機會。",
      },
    },
  },
  {
    slug: "multilingual-guide-operations-tips",
    relatedSlugs: ["portrait-rights-filming-guidelines", "how-audience-finds-good-busking"],
    title: {
      ko: "다국어 안내가 필요한 이유와 운영 팁",
      en: "Why Multilingual Guidance Matters and How to Operate It",
      zh: "为什么需要多语言指引，以及如何运营",
      ja: "多言語案内が必要な理由と運用のコツ",
      "zh-TW": "為什麼需要多語言指引，以及如何運營",
    },
    excerpt: {
      ko: "다양한 관객과 소통하기 위한 핵심 문구 구성과 운영 기준을 정리합니다.",
      en: "Prioritize short multilingual essentials that reduce confusion for international audiences.",
      zh: "优先准备简短核心多语言文案，降低海外观众理解门槛。",
      ja: "海外観客の混乱を減らす短く明確な多言語案内の作り方を整理します。",
      "zh-TW": "優先準備簡短核心多語言文案，降低海外觀眾理解門檻。",
    },
    description: {
      ko: "핵심 문구 번역, 현장 표기, 오해 대응 루틴을 다루는 운영 가이드입니다.",
      en: "A practical guide for multilingual signage, key phrase translation, and consistency checks.",
      zh: "涵盖关键语翻译、现场标识与误解纠正机制的运营指南。",
      ja: "重要文言の翻訳、現場表示、誤解対応を扱う運用ガイドです。",
      "zh-TW": "涵蓋關鍵語翻譯、現場標示與誤解修正機制的運營指南。",
    },
    body: {
      intro: {
        ko: "다국어 운영의 핵심은 모든 문장을 번역하는 것이 아니라, 필요한 문장을 정확히 전달하는 것입니다.",
        en: "Multilingual quality comes from translating the right lines clearly, not translating everything.",
        zh: "多语言运营的关键，不是“全量翻译”，而是“关键句准确传达”。",
        ja: "多言語運用の本質は“全部翻訳”ではなく、“必要文を正確に届ける”ことです。",
        "zh-TW": "多語言運營的關鍵，不是「全量翻譯」，而是「關鍵句準確傳達」。",
      },
      sections: [
        {
          heading: {
            ko: "다국어 안내 운영 기준",
            en: "Multilingual Guidance Operating Standard",
            zh: "多语言指引运营标准",
            ja: "多言語案内の運用基準",
            "zh-TW": "多語言指引運營標準",
          },
          paragraphs: {
            ko: [
              "참여 방법, 촬영 안내, 공연 시간처럼 오해 가능성이 큰 문구를 우선 다국어로 고정하세요.",
              "문구 길이를 짧게 유지하고 표현을 통일하면 안내판, QR, 공지 간 일관성이 높아집니다.",
            ],
            en: [
              "Prioritize multilingual lines for participation steps, filming notice, and schedule details where confusion is costly.",
              "Keep phrases short and consistent so signage, QR copy, and announcements stay aligned.",
            ],
            zh: [
              "优先多语言化“参与方式、拍摄说明、演出时间”这类高误解风险信息。",
              "句子保持短而统一，可提高看板、二维码与公告之间的一致性。",
            ],
            ja: [
              "参加方法、撮影案内、時間情報など誤解が起きやすい文言を優先して多言語化しましょう。",
              "文の長さと表現を統一すると、看板・QR・告知の一貫性が高まります。",
            ],
            "zh-TW": [
              "優先多語言化「參與方式、拍攝說明、演出時間」這類高誤解風險資訊。",
              "句子保持短而一致，可提高看板、QR與公告之間的一致性。",
            ],
          },
          checklist: {
            ko: ["핵심 문구 우선 번역", "짧고 통일된 표현", "현장 안내판/공지 일치 점검"],
            en: ["Translate high-priority phrases first", "Use short consistent wording", "Align signage and announcements"],
            zh: ["优先翻译高价值文案", "保持短句与统一表达", "核对看板与公告一致"],
            ja: ["優先文言から翻訳", "短く統一した表現", "看板と告知の整合確認"],
            "zh-TW": ["優先翻譯高價值文案", "保持短句與一致表達", "核對看板與公告一致"],
          },
        },
      ],
      closing: {
        ko: "작은 문구 개선이 더 넓은 관객 연결을 만들어냅니다.",
        en: "Small wording improvements can unlock much wider audience reach.",
        zh: "细小的文案优化，往往能换来更广的观众连接。",
        ja: "小さな文言改善が、より広い観客接点を生み出します。",
        "zh-TW": "細小的文案優化，往往能換來更廣的觀眾連結。",
      },
    },
  },
];

function localizeGuide(seed: LocalizedGuideSeed, language: GuideLanguage): GuideEntry {
  return {
    slug: seed.slug,
    relatedSlugs: seed.relatedSlugs,
    title: pickText(seed.title, language),
    excerpt: pickText(seed.excerpt, language),
    description: pickText(seed.description, language),
    body: {
      intro: pickText(seed.body.intro, language),
      sections: seed.body.sections.map((section) => {
        const localizedSection: GuideBodySection = {
          heading: pickText(section.heading, language),
          paragraphs: pickList(section.paragraphs, language),
        };

        if (section.checklist) {
          localizedSection.checklist = pickList(section.checklist, language);
        }

        return localizedSection;
      }),
      closing: pickText(seed.body.closing, language),
    },
  };
}

export const guides: GuideEntry[] = guideSeeds.map((seed) => localizeGuide(seed, "ko"));

export function getAllGuides(language: GuideLanguage = "ko"): GuideEntry[] {
  return guideSeeds.map((seed) => localizeGuide(seed, language));
}

export function getGuideBySlug(slug: string, language: GuideLanguage = "ko"): GuideEntry | undefined {
  const seed = guideSeeds.find((guide) => guide.slug === slug);
  if (!seed) {
    return undefined;
  }
  return localizeGuide(seed, language);
}

export function getRelatedGuides(
  guide: GuideEntry,
  language: GuideLanguage = "ko",
  limit = 3,
): GuideEntry[] {
  const localizedGuides = getAllGuides(language);

  const explicit = guide.relatedSlugs
    .map((slug) => localizedGuides.find((entry) => entry.slug === slug))
    .filter((entry): entry is GuideEntry => Boolean(entry));

  if (explicit.length >= limit) {
    return explicit.slice(0, limit);
  }

  const fallback = localizedGuides.filter(
    (candidate) => candidate.slug !== guide.slug && !guide.relatedSlugs.includes(candidate.slug),
  );

  return [...explicit, ...fallback].slice(0, limit);
}
