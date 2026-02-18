import { ServiceItem, WorkItem } from './types';
import React from 'react';
import { Instagram, MessageCircle, BarChart3, PenTool } from 'lucide-react';

export const BRAND = {
  name: "TELOS",
  tagline: "Logic serves Beauty.",
  subTagline: "「真価」を可視化し、あるべき美しさへ導く。",
  concept: "Quiet Architecture",
  description: "感性（Magic）と論理（Logic）の融合。TELOSは、この二つを分断させず、美しく統合するために生まれました。あなたのブランドに眠る「真価」を、データという論理で裏付け、洗練された美意識で可視化する。",
};

export const SERVICES: ServiceItem[] = [
  {
    id: "instagram",
    title: "Instagram Strategy",
    titleJp: "Instagram 構築・運用",
    subtitle: "Media Strategy",
    concept: "認知を広げ、世界観を構築する。",
    description: "アカウントは、ブランドの「顔」です。感覚的な運用から脱却し、3C分析とアルゴリズムに基づいた「勝てるロジック」で、あなたのブランドを美しく可視化します。",
    priceLabel: "初期構築 ¥30,000 / 月額レンジ ¥50,000 〜 ¥150,000 (税抜)",
    workflow: [
      "Phase 1: 戦略定義 (Strategy & Definition) - 3C分析・ペルソナ・KPI設計",
      "Phase 2: 設計・制作 (Account Design & Production) - プロフィール設計・ストック制作",
      "Phase 3: 運用開始 (Launch) - リリース・アクティブサポート",
      "Phase 4: 分析・改善 (Analysis & Growth) - 月次レポート・定例MTG"
    ],
    pricingDetails: {
      initial: {
        price: "¥30,000 (税抜)",
        description: "Phase 1（戦略定義）における3C分析、コンセプト設計、運用マニュアル策定費用として。"
      },
      monthly: {
        price: "¥50,000 〜 ¥150,000 (税抜)",
        description: "ご予算と目標達成スピードに合わせて、投稿本数や業務範囲を柔軟にカスタマイズ可能です。"
      },
      recommended: {
        price: "¥110,000 (税抜) / 月",
        details: [
          "アカウント設計・戦略策定",
          "リール動画 企画・制作・編集",
          "フィード投稿 デザイン・ライティング",
          "ストーリーズ運用代行",
          "インサイト分析・レポーティング",
          "月次定例ミーティング"
        ],
        note: "撮影は含まれません（素材支給 または フリー素材活用）。"
      }
    }
  },
  {
    id: "line",
    title: "Official LINE Strategy",
    titleJp: "Official LINE 構築・運用",
    subtitle: "Asset Management",
    concept: "一過性の客を、生涯のファンへ。",
    description: "フロー（流れる情報）から、ストック（資産）へ。顧客と深く繋がり、LTV（生涯顧客価値）を最大化するための「自動化された接客システム」を構築します。",
    priceLabel: "初期構築 ¥30,000 / 月額レンジ ¥50,000 〜 ¥100,000 (税抜)",
    workflow: [
      "Phase 1: 導線設計 (Scenario Planning) - シナリオ・タグ設計",
      "Phase 2: 構築・制作 (Construction & Production) - リッチメニュー・クリエイティブ制作",
      "Phase 3: 運用開始 (Launch) - テスト配信・定期配信",
      "Phase 4: 分析・報告 (Analysis & Reporting) - KPIモニタリング・改善提案"
    ],
    pricingDetails: {
      initial: {
        price: "¥30,000 (税抜)",
        description: "Phase 1（導線設計）におけるシナリオ設計、タグ設計、リッチメニュー構築費用として。"
      },
      monthly: {
        price: "¥50,000 〜 ¥100,000 (税抜)",
        description: "配信頻度やクリエイティブ制作枚数に応じて変動します。"
      },
      recommended: {
        price: "¥80,000 (税抜) / 月",
        details: [
          "シナリオ設計・導線構築",
          "メッセージ配信代行",
          "リッチメニュー制作・更新",
          "クリエイティブ制作",
          "友だち追加施策提案",
          "効果測定・分析レポート"
        ],
        note: "LINE公式アカウントの月額利用料（実費）は別途必要です。"
      }
    }
  },
  {
    id: "ads",
    title: "Meta Ads Strategy",
    titleJp: "Meta 広告運用",
    subtitle: "Ads Accelerator",
    concept: "世界観を損なわず、集客を加速させる。",
    description: "良いものを作っても、届かなければ意味がありません。AI（Advantage+）を味方につけ、届けたい相手へ最短距離で加速させます。",
    priceLabel: "初期構築 ¥30,000 / 広告費の20% (Min ¥50,000)",
    workflow: [
      "Phase 1: 基盤構築 (Setup & Strategy) - CAPI/Pixel設定・構造設計",
      "Phase 2: 制作 (Creative Production) - 構成案・クリエイティブ制作",
      "Phase 3: 審査・開始 (Review & Launch) - 学習フェーズ管理",
      "Phase 4: 最適化 (Optimization) - 摩耗監視・差し替え"
    ],
    pricingDetails: {
      initial: {
        price: "¥30,000 (税抜)",
        description: "Phase 1（基盤構築）におけるアカウント設計、Pixel/CAPIタグ設置、シミュレーション作成費用として。"
      },
      recommended: {
        price: "広告費の 20%",
        details: [
          "広告アカウント設計・構築",
          "ターゲット選定・オーディエンス設定",
          "広告クリエイティブ制作 (ABテスト)",
          "広告文(コピー)ライティング",
          "入札調整・予算管理",
          "週次モニタリング・レポート"
        ]
      }
    }
  },
  {
    id: "creative",
    title: "Creative Studio",
    titleJp: "クリエイティブ制作(単発)",
    subtitle: "Design on Demand",
    concept: "必要な時、必要な「美しさ」を。",
    description: "運用契約なし・スポットでの制作依頼。戦略設計は含まず、ご指示（構成案）に基づき「美しさ」を納品します。",
    priceLabel: "リール ¥15,000〜 / LP ¥150,000〜 他",
    workflow: [
      "Briefing",
      "Production",
      "Review",
      "Delivery"
    ],
    pricingDetails: {
      menu: [
        {
          category: "Social Media",
          items: [
            { label: "リール動画", price: "¥15,000〜 /本" },
            { label: "フィード投稿", price: "¥8,000 /セット" },
            { label: "動画広告クリエイティブ", price: "¥30,000〜 /本" }
          ]
        },
        {
          category: "LINE Creative",
          items: [
            { label: "リッチメニュー画像", price: "¥20,000 /点" },
            { label: "リッチメッセージ", price: "¥15,000 /点" }
          ]
        },
        {
          category: "Asset",
          items: [
            { label: "LP制作", price: "¥150,000〜" }
          ]
        }
      ]
    }
  }
];

export const WORKS: WorkItem[] = [
  {
    id: "project-01",
    client: "Apparel Brand A",
    category: "D2C / Instagram Marketing",
    scope: ["Instagram Marketing", "Reel Production", "Meta Platform Ops"],
    description: "アパレルD2CブランドにおけるSNSマーケティング及びEC連携支援。クリエイティブ制作に加え、Instagramショップ機能の導入やMeta連携における複雑なエラー解消など、プラットフォーム環境の最適化までを包括的に遂行。アルゴリズム分析に基づいた「滞在時間を伸ばす構成」と「世界観の可視化」により、ブランドの熱量を最大化した。",
    highlights: "世界観の可視化と持続可能な集客基盤の構築",
    evidence: [
      { label: "Reach (vs Others)", value: "+47%" },
      { label: "Engagement Rate", value: "1.45%" }
    ],
    outcome: "オーガニック投稿のみでファンコミュニティを活性化し、広告費に依存しない持続可能な集客基盤を構築。"
  },
  {
    id: "project-02",
    client: "Venture Company B",
    category: "Incubation / Branding",
    scope: ["Brand Strategy", "AI Process Design", "LINE Construction"],
    description: "新規事業インキュベーションにおける、ブランドシステム構築からサービス開発までの横断的支援。戦略策定、リサーチ、クリエイティブ生成の全プロセスに「Gemini」や「Genma」等のAIツールを導入。Web、LP、ロゴ、LINE公式アカウント（ステップ配信設計）まで、一気通貫したディレクションで事業の骨格を作り上げた。",
    highlights: "AI導入による高速PDCAと自動化フローの確立",
    evidence: [
      { label: "Efficiency", value: "40% Reduced" },
      { label: "Prototype Completion", value: "2 Months" }
    ],
    outcome: "高速なPDCA環境と、顧客育成（ナーチャリング）の自動化フローを確立し、事業立ち上げの不確実性を大幅に低減。"
  }
];

export const ICONS = {
  instagram: <Instagram className="w-5 h-5" />,
  line: <MessageCircle className="w-5 h-5" />,
  ads: <BarChart3 className="w-5 h-5" />,
  creative: <PenTool className="w-5 h-5" />
};