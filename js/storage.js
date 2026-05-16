const Storage = (() => {
  const KEY = 'personalSiteData';

  const defaults = {
    /* ── Nav ── */
    navLogo: 'Your Name',

    /* ── Hero ── */
    heroEyebrow: '✦ Portfolio',
    heroName: 'Your Name',
    heroTitle: 'Designer & Creative Professional',
    heroBio: '我熱愛將創意與策略結合，打造有溫度、有設計感的品牌體驗。每個作品都是我對美學與功能之間平衡的探索。',
    heroCTA1: '查看作品集',
    heroCTA2: '聯絡我',
    heroPhotoData: null,

    /* ── Custom Sections ── */
    customSections: [],

    /* ── About ── */
    aboutEyebrow: 'About Me',
    aboutTitle: '關於我',
    aboutLead: '設計是我與世界對話的語言。',
    aboutBody: '我是一位熱愛設計的創作者，擁有多年品牌設計、視覺傳達及數位內容製作的經驗。我相信好的設計不只是美觀，更能傳遞情感、解決問題，並在使用者與品牌之間建立深刻的連結。',
    aboutSideImageData: null,
    stat1Number: '50+', stat1Label: '完成專案',
    stat2Number: '5+',  stat2Label: '年資歷',
    stat3Number: '30+', stat3Label: '滿意客戶',

    /* ── Portfolio ── */
    portfolioEyebrow: 'Works',
    portfolioTitle: '作品集',
    portfolio: [
      { id: 'proj-001', title: '品牌識別設計', tag: '品牌設計',
        description: '為新創公司打造完整品牌識別系統，包含 Logo、色票、字型規範及應用設計。', url: '', imageData: null },
      { id: 'proj-002', title: '電商網站視覺', tag: '網頁設計',
        description: '設計一個簡潔現代的電商平台視覺，提升用戶體驗與轉換率。', url: '', imageData: null },
      { id: 'proj-003', title: '社群媒體視覺規劃', tag: '社群媒體',
        description: '為品牌規劃一整套 Instagram 視覺風格，包含模板設計與內容策略。', url: '', imageData: null },
    ],

    /* ── Skills ── */
    skillsEyebrow: 'Services',
    skillsTitle: '我的服務',
    skillsSub: '結合專業技術與創意思維，提供全方位的設計服務。',
    skills: [
      { icon: '🎨', title: '視覺設計', items: ['品牌識別設計', 'Logo 設計', '排版與印刷設計', '包裝設計'] },
      { icon: '💻', title: '數位設計', items: ['網頁 UI/UX 設計', 'App 介面設計', '社群媒體視覺', 'Motion Graphics'] },
      { icon: '✍️', title: '創意服務', items: ['品牌策略諮詢', '視覺內容規劃', '攝影後製', '創意文案'] },
    ],

    /* ── Contact ── */
    contactEyebrow: 'Contact',
    contactTitle: '聯絡我',
    contactSub: '有任何合作提案或想法，歡迎隨時與我聯繫。期待與您一起創造有意義的作品。',
    contactEmail: 'hello@yourname.com',
    contactFormNameLabel: '您的姓名',
    contactFormEmailLabel: '電子郵件',
    contactFormMsgLabel: '訊息內容',
    contactFormBtn: '送出訊息',
    contactLinks: [
      { icon: '🌐', label: 'Website',   value: 'www.yourname.com',        url: '' },
      { icon: '📷', label: 'Instagram', value: '@yourname',                url: '' },
      { icon: '💼', label: 'LinkedIn',  value: 'linkedin.com/in/yourname', url: '' },
    ],

    /* ── Layout config ── */
    sectionConfig: {
      order: ['hero', 'about', 'portfolio', 'skills', 'contact'],
      labels: {
        hero:      'Home',
        about:     '關於我',
        portfolio: '作品集',
        skills:    '服務',
        contact:   '聯絡我',
      },
      navColors: {},  // { sectionId: color }
      colors:    {},  // { sectionId: { bg, lightText } }
    },
    hiddenSections: [],
    sectionPadding: {},
  };

  async function load() {
    return new Promise(resolve => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(KEY, result => {
          const s = result[KEY] || {};
          resolve(_merge(defaults, s));
        });
      } else {
        try {
          const s = JSON.parse(localStorage.getItem(KEY) || '{}');
          resolve(_merge(defaults, s));
        } catch { resolve(JSON.parse(JSON.stringify(defaults))); }
      }
    });
  }

  function _merge(def, saved) {
    const defSC  = def.sectionConfig;
    const savedSC = saved.sectionConfig || {};
    return {
      ...def, ...saved,
      customSections: saved.customSections || [],
      skills:         saved.skills         || def.skills,
      portfolio:      saved.portfolio      || def.portfolio,
      contactLinks:   saved.contactLinks   || def.contactLinks,
      sectionConfig: {
        order:     savedSC.order     || defSC.order,
        labels:    { ...defSC.labels, ...(savedSC.labels    || {}) },
        navColors: savedSC.navColors || {},
        colors:    savedSC.colors    || {},
      },
      hiddenSections: saved.hiddenSections || [],
      sectionPadding: saved.sectionPadding || {},
    };
  }

  async function save(data) {
    return new Promise(resolve => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ [KEY]: data }, resolve);
      } else {
        localStorage.setItem(KEY, JSON.stringify(data));
        resolve();
      }
    });
  }

  return { load, save, defaults };
})();
