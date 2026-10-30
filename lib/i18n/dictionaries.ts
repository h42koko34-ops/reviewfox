// File: lib/i18n/dictionaries.ts

interface ToggleCopy {
  label: string;
  desc: string;
}

interface StatusLabels {
  pending: string;
  matched: string;
  needs_review: string;
  rejected: string;
  fraud_flagged: string;
  expired: string;
}

export interface Dictionary {
  common: {
    loading: string;
    cancel: string;
    save: string;
    saving: string;
    close: string;
    search: string;
    logout: string;
    points: string;
    statusLabels: StatusLabels;
    lockedByAdmin: string;
  };
  nav: { superAdmin: string; companyAdmin: string; employee: string };
  overview: {
    sectionTitle: string;
    activeCompanies: string;
    reviewsMatched: string;
    fraudBlocked: string;
  };
  companyPanel: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    addCompany: string;
    colName: string;
    colStatus: string;
    colEmployees: string;
    colDailyLimit: string;
    colActions: string;
    noCompanies: string;
    manage: string;
    active: string;
    suspended: string;
  };
  createCompany: {
    title: string;
    description: string;
    companyName: string;
    companyNamePlaceholder: string;
    defaultLang: string;
    langAr: string;
    langEn: string;
    maxEmployees: string;
    maxDailyClaims: string;
    adminSectionTitle: string;
    adminFullName: string;
    adminEmail: string;
    adminPassword: string;
    cancel: string;
    submit: string;
    submitting: string;
    toastSuccess: string;
    toastError: string;
  };
  godMode: {
    subtitle: string;
    tabFeatures: string;
    tabPermissions: string;
    tabEmployees: string;
    tabDanger: string;
    featuresDesc: string;
    permissionsDesc: string;
    features: Record<
      'quick_tags' | 'voice_notes' | 'promo_codes' | 'ocr_scanner' | 'qr_gateway' | 'whatsapp_link' | 'keyword_hooks',
      ToggleCopy
    >;
    permissions: Record<
      | 'can_add_employees'
      | 'can_export_excel'
      | 'can_approve_needs_review'
      | 'can_edit_reward_amount'
      | 'can_view_ai_reasoning',
      ToggleCopy
    >;
    employees: {
      addNew: string;
      fullName: string;
      email: string;
      password: string;
      submit: string;
      empty: string;
      pointsLabel: string;
      fraudLabel: string;
      deactivate: string;
      reactivate: string;
    };
    danger: {
      quotasTitle: string;
      maxEmployees: string;
      maxDailyClaims: string;
      saveQuotas: string;
      suspendTitle: string;
      suspendDesc: string;
      activateTitle: string;
      activateDesc: string;
      suspendAction: string;
      activateAction: string;
      confirmTitle: string;
      confirmCancel: string;
      confirmProceed: string;
    };
    toastUpdated: string;
    toastError: string;
  };
  dashboard: {
    tabs: { overview: string; employees: string; claims: string; fraud: string; payroll: string };
    stats: {
      totalEmployees: string;
      pendingClaims: string;
      needsReview: string;
      suspiciousReviews: string;
    };
    features: {
      sectionTitle: string;
      sectionSubtitle: string;
      activeBadge: string;
      lockedBadge: string;
      lockedDesc: string;
    };
    employees: {
      title: string;
      addButton: string;
      lockedTooltip: string;
      quotaReachedTooltip: string;
      table: { name: string; email: string; points: string; fraud: string; status: string };
      addModal: {
        title: string;
        description: string;
        fullName: string;
        email: string;
        password: string;
        submit: string;
        submitting: string;
        toastSuccess: string;
        toastError: string;
      };
      activeLabel: string;
      inactiveLabel: string;
    };
    excelExport: {
      button: string;
      lockedTooltip: string;
      generating: string;
      toastSuccess: string;
      toastError: string;
    };
    claims: {
      title: string;
      table: { employee: string; client: string; invoice: string; status: string; date: string; actions: string };
      approve: string;
      reject: string;
      approveLockedTooltip: string;
      toastUpdated: string;
      toastError: string;
      empty: string;
    };
    fraud: {
      title: string;
      subtitle: string;
      confidenceLabel: string;
      suspiciousBadge: string;
      aiReasoningLockedTitle: string;
      aiReasoningLockedDesc: string;
      reviewerLabel: string;
      ratingLabel: string;
      empty: string;
    };
    payroll: {
      title: string;
      subtitle: string;
      rewardPerReview: string;
      rewardLocked: string;
      saveReward: string;
      employeeCol: string;
      matchedCol: string;
      totalCol: string;
      grandTotal: string;
      monthLabel: string;
      exportButton: string;
    };
  };
  employee: {
    nav: { newClaim: string; history: string; leaderboard: string };
    dailyLimit: {
      usedOf: string;
      reachedTitle: string;
      reachedDesc: string;
    };
    newClaimForm: {
      title: string;
      subtitle: string;
      clientName: string;
      clientNamePlaceholder: string;
      invoiceNumber: string;
      invoiceNumberPlaceholder: string;
      invoiceTimestamp: string;
      quickTagsLabel: string;
      quickTagsOptions: { positive: string; negative: string; neutral: string; followUp: string };
      voiceNotesLabel: string;
      voiceNotesPlaceholder: string;
      promoCodeLabel: string;
      promoCodePlaceholder: string;
      ocrLabel: string;
      ocrPlaceholder: string;
      qrLabel: string;
      qrScanButton: string;
      qrScannedAt: string;
      whatsappLabel: string;
      whatsappPlaceholder: string;
      submit: string;
      submitting: string;
      toastSuccess: string;
      toastError: string;
      noFeaturesEnabled: string;
      duplicateInvoice: string;
    };
    history: { title: string; empty: string; invoiceLabel: string };
    leaderboard: { title: string; subtitle: string; rank: string; pointsLabel: string; empty: string; you: string };
  };
}

const en: Dictionary = {
  common: {
    loading: 'Loading...',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving...',
    close: 'Close',
    search: 'Search',
    logout: 'Logout',
    points: 'Points',
    statusLabels: {
      pending: 'Pending',
      matched: 'Matched',
      needs_review: 'Needs Review',
      rejected: 'Rejected',
      fraud_flagged: 'Fraud Flagged',
      expired: 'Expired',
    },
    lockedByAdmin: 'Locked by ReviewFox Admin',
  },
  nav: { superAdmin: 'Super Admin', companyAdmin: 'Company Admin', employee: 'Employee' },
  overview: {
    sectionTitle: 'Platform Overview',
    activeCompanies: 'Active Companies',
    reviewsMatched: 'Reviews Matched',
    fraudBlocked: 'Fraud Attempts Blocked',
  },
  companyPanel: {
    title: 'Master Company Control Panel',
    subtitle: 'Full control over every company, subscription and quota.',
    searchPlaceholder: 'Search companies...',
    addCompany: 'Add Company',
    colName: 'Company',
    colStatus: 'Status',
    colEmployees: 'Employees',
    colDailyLimit: 'Daily Claim Limit',
    colActions: 'Actions',
    noCompanies: 'No companies found.',
    manage: 'Manage',
    active: 'Active',
    suspended: 'Suspended',
  },
  createCompany: {
    title: 'Create New Company',
    description: 'Provision a new tenant and its first company admin account.',
    companyName: 'Company Name',
    companyNamePlaceholder: 'e.g. Golden Spoon Restaurant',
    defaultLang: 'Default Language',
    langAr: 'Arabic',
    langEn: 'English',
    maxEmployees: 'Max Employees',
    maxDailyClaims: 'Max Daily Claims / Employee',
    adminSectionTitle: 'Company Admin Account',
    adminFullName: 'Full Name',
    adminEmail: 'Email',
    adminPassword: 'Password',
    cancel: 'Cancel',
    submit: 'Create Company',
    submitting: 'Creating...',
    toastSuccess: 'Company created successfully.',
    toastError: 'Failed to create company.',
  },
  godMode: {
    subtitle: 'God-Mode control over features, permissions, quotas and staff.',
    tabFeatures: 'Features',
    tabPermissions: 'Permissions',
    tabEmployees: 'Employees',
    tabDanger: 'Danger Zone',
    featuresDesc: 'Unlock the verification methods this company is allowed to use.',
    permissionsDesc: 'Control exactly what the company owner is allowed to do.',
    features: {
      quick_tags: { label: 'Quick Tags', desc: 'Predefined tags for fast claim submission.' },
      voice_notes: { label: 'Voice Notes', desc: 'Allow employees to attach voice recordings.' },
      promo_codes: { label: 'Promo Codes', desc: 'Enable promo-code based client verification.' },
      ocr_scanner: { label: 'OCR Scanner', desc: 'Scan and extract text from invoices/receipts.' },
      qr_gateway: { label: 'QR Gateway', desc: 'Verify clients via scannable QR codes.' },
      whatsapp_link: { label: 'WhatsApp Link', desc: 'Send review requests via WhatsApp.' },
      keyword_hooks: { label: 'Keyword Hooks', desc: 'AI keyword matching on review text.' },
    },
    permissions: {
      can_add_employees: { label: 'Add Employees', desc: 'Allow the owner to add new employees.' },
      can_export_excel: { label: 'Export Excel', desc: 'Allow exporting reports to Excel.' },
      can_approve_needs_review: { label: 'Approve Needs-Review', desc: 'Allow manual approval of flagged claims.' },
      can_edit_reward_amount: { label: 'Edit Reward Amount', desc: 'Allow changing the reward per review.' },
      can_view_ai_reasoning: { label: 'View AI Reasoning', desc: 'Allow viewing AI confidence & reasoning.' },
    },
    employees: {
      addNew: 'Add Employee',
      fullName: 'Full Name',
      email: 'Email',
      password: 'Password',
      submit: 'Create Employee',
      empty: 'No employees yet.',
      pointsLabel: 'Points',
      fraudLabel: 'Fraud Warnings',
      deactivate: 'Deactivate',
      reactivate: 'Reactivate',
    },
    danger: {
      quotasTitle: 'Quotas',
      maxEmployees: 'Max Employees',
      maxDailyClaims: 'Max Daily Claims',
      saveQuotas: 'Save Quotas',
      suspendTitle: 'Suspend Company',
      suspendDesc: 'This immediately blocks all company users from accessing ReviewFox.',
      activateTitle: 'Activate Company',
      activateDesc: 'This restores full access for the company and its employees.',
      suspendAction: 'Suspend Company',
      activateAction: 'Activate Company',
      confirmTitle: 'Are you absolutely sure?',
      confirmCancel: 'Cancel',
      confirmProceed: 'Yes, Proceed',
    },
    toastUpdated: 'Updated successfully.',
    toastError: 'Something went wrong.',
  },
  dashboard: {
    tabs: { overview: 'Overview', employees: 'Employees', claims: 'Claims', fraud: 'AI Radar & Fraud Center', payroll: 'Monthly Payroll' },
    stats: {
      totalEmployees: 'Total Employees',
      pendingClaims: 'Pending Claims',
      needsReview: 'Needs Review',
      suspiciousReviews: 'Suspicious Reviews',
    },
    features: {
      sectionTitle: 'Active Features Showcase',
      sectionSubtitle: 'Verification methods unlocked by ReviewFox for your company.',
      activeBadge: 'Active',
      lockedBadge: 'Locked',
      lockedDesc: 'Locked — Contact Super Admin to Enable',
    },
    employees: {
      title: 'Employees',
      addButton: 'Add Employee',
      lockedTooltip: 'This feature has been restricted or you have reached the maximum limit — contact ReviewFox admin to upgrade.',
      quotaReachedTooltip: 'Employee quota reached — contact ReviewFox admin to upgrade.',
      table: { name: 'Name', email: 'Email', points: 'Points', fraud: 'Fraud Warnings', status: 'Status' },
      addModal: {
        title: 'Add New Employee',
        description: 'Create a new employee account for your company.',
        fullName: 'Full Name',
        email: 'Email',
        password: 'Password',
        submit: 'Create Employee',
        submitting: 'Creating...',
        toastSuccess: 'Employee added successfully.',
        toastError: 'Failed to add employee.',
      },
      activeLabel: 'Active',
      inactiveLabel: 'Inactive',
    },
    excelExport: {
      button: 'Export Payroll to Excel',
      lockedTooltip: 'Locked by ReviewFox Admin — upgrade your plan to unlock Excel export.',
      generating: 'Generating...',
      toastSuccess: 'Payroll exported successfully.',
      toastError: 'Failed to export payroll.',
    },
    claims: {
      title: 'Pre-Claims',
      table: { employee: 'Employee', client: 'Client', invoice: 'Invoice #', status: 'Status', date: 'Date', actions: 'Actions' },
      approve: 'Approve',
      reject: 'Reject',
      approveLockedTooltip: 'Only the ReviewFox Super Admin can approve this claim.',
      toastUpdated: 'Claim updated successfully.',
      toastError: 'Failed to update claim.',
      empty: 'No claims found.',
    },
    fraud: {
      title: 'AI Radar & Fraud Center',
      subtitle: 'AI-matched reviews and suspicious activity detection.',
      confidenceLabel: 'AI Confidence',
      suspiciousBadge: 'Suspicious',
      aiReasoningLockedTitle: 'AI Reasoning Locked',
      aiReasoningLockedDesc: 'Locked by ReviewFox Admin — upgrade your plan to view AI reasoning.',
      reviewerLabel: 'Reviewer',
      ratingLabel: 'Rating',
      empty: 'No reviews found yet.',
    },
    payroll: {
      title: 'Monthly Payroll Calculator',
      subtitle: 'Automatically calculated based on matched reviews this month.',
      rewardPerReview: 'Reward per Review',
      rewardLocked: 'Locked by ReviewFox Admin',
      saveReward: 'Save',
      employeeCol: 'Employee',
      matchedCol: 'Matched Reviews',
      totalCol: 'Total Reward',
      grandTotal: 'Grand Total',
      monthLabel: 'Current Month',
      exportButton: 'Export Payroll to Excel',
    },
  },
  employee: {
    nav: { newClaim: 'New Claim', history: 'History', leaderboard: 'Leaderboard' },
    dailyLimit: {
      usedOf: 'claims used today',
      reachedTitle: 'Daily Limit Reached',
      reachedDesc: 'You have reached your daily claim limit set by ReviewFox. Try again tomorrow.',
    },
    newClaimForm: {
      title: 'New Pre-Claim',
      subtitle: 'Fill in the verification details for this client.',
      clientName: 'Client Name',
      clientNamePlaceholder: 'Expected client name',
      invoiceNumber: 'Invoice Number',
      invoiceNumberPlaceholder: 'e.g. INV-00231',
      invoiceTimestamp: 'Invoice Date & Time',
      quickTagsLabel: 'Quick Tags',
      quickTagsOptions: { positive: 'Positive', negative: 'Negative', neutral: 'Neutral', followUp: 'Follow-up' },
      voiceNotesLabel: 'Voice Note Transcript',
      voiceNotesPlaceholder: 'Describe the interaction in your own words...',
      promoCodeLabel: 'Promo Code',
      promoCodePlaceholder: 'Enter promo/verification code',
      ocrLabel: 'OCR Captured Name',
      ocrPlaceholder: 'Name captured from scanned receipt',
      qrLabel: 'QR Verification',
      qrScanButton: 'Simulate QR Scan',
      qrScannedAt: 'Scanned at',
      whatsappLabel: 'Client Phone (WhatsApp)',
      whatsappPlaceholder: '+20 10 1234 5678',
      submit: 'Submit Pre-Claim',
      submitting: 'Submitting...',
      toastSuccess: 'Pre-claim submitted successfully!',
      toastError: 'Failed to submit pre-claim.',
      noFeaturesEnabled: 'No verification methods have been enabled for your company yet. Contact your admin.',
      duplicateInvoice: 'This invoice number has already been submitted.',
    },
    history: { title: 'My Claims History', empty: 'You have not submitted any claims yet.', invoiceLabel: 'Invoice' },
    leaderboard: {
      title: 'Company Leaderboard',
      subtitle: 'Top performing employees this period.',
      rank: 'Rank',
      pointsLabel: 'pts',
      empty: 'No leaderboard data yet.',
      you: 'You',
    },
  },
};

const ar: Dictionary = {
  common: {
    loading: 'جاري التحميل...',
    cancel: 'إلغاء',
    save: 'حفظ',
    saving: 'جاري الحفظ...',
    close: 'إغلاق',
    search: 'بحث',
    logout: 'تسجيل الخروج',
    points: 'النقاط',
    statusLabels: {
      pending: 'قيد الانتظار',
      matched: 'تمت المطابقة',
      needs_review: 'بحاجة لمراجعة',
      rejected: 'مرفوض',
      fraud_flagged: 'مشبوه - احتيال',
      expired: 'منتهي الصلاحية',
    },
    lockedByAdmin: 'مقفل من إدارة ReviewFox',
  },
  nav: { superAdmin: 'المشرف العام', companyAdmin: 'مسؤول الشركة', employee: 'موظف' },
  overview: {
    sectionTitle: 'نظرة عامة على المنصة',
    activeCompanies: 'الشركات النشطة',
    reviewsMatched: 'التقييمات المطابقة',
    fraudBlocked: 'محاولات الاحتيال المحظورة',
  },
  companyPanel: {
    title: 'لوحة التحكم الكامل في الشركات',
    subtitle: 'تحكم كامل في كل شركة واشتراكها وحصصها.',
    searchPlaceholder: 'ابحث عن شركة...',
    addCompany: 'إضافة شركة',
    colName: 'الشركة',
    colStatus: 'الحالة',
    colEmployees: 'الموظفون',
    colDailyLimit: 'الحد اليومي للمطالبات',
    colActions: 'الإجراءات',
    noCompanies: 'لا توجد شركات بعد.',
    manage: 'إدارة',
    active: 'نشطة',
    suspended: 'موقوفة',
  },
  createCompany: {
    title: 'إنشاء شركة جديدة',
    description: 'أنشئ شركة جديدة مع حساب مسؤول الشركة الأول.',
    companyName: 'اسم الشركة',
    companyNamePlaceholder: 'مثال: مطعم الملعقة الذهبية',
    defaultLang: 'اللغة الافتراضية',
    langAr: 'العربية',
    langEn: 'الإنجليزية',
    maxEmployees: 'الحد الأقصى للموظفين',
    maxDailyClaims: 'الحد اليومي للمطالبات لكل موظف',
    adminSectionTitle: 'حساب مسؤول الشركة',
    adminFullName: 'الاسم الكامل',
    adminEmail: 'البريد الإلكتروني',
    adminPassword: 'كلمة المرور',
    cancel: 'إلغاء',
    submit: 'إنشاء الشركة',
    submitting: 'جاري الإنشاء...',
    toastSuccess: 'تم إنشاء الشركة بنجاح.',
    toastError: 'فشل إنشاء الشركة.',
  },
  godMode: {
    subtitle: 'تحكم كامل في الميزات والصلاحيات والحصص والموظفين.',
    tabFeatures: 'الميزات',
    tabPermissions: 'الصلاحيات',
    tabEmployees: 'الموظفون',
    tabDanger: 'منطقة الخطر',
    featuresDesc: 'افتح وسائل التحقق المسموح بها لهذه الشركة.',
    permissionsDesc: 'تحكم بدقة فيما يُسمح لمالك الشركة بفعله.',
    features: {
      quick_tags: { label: 'الوسوم السريعة', desc: 'وسوم جاهزة لتسريع تقديم المطالبات.' },
      voice_notes: { label: 'الملاحظات الصوتية', desc: 'السماح للموظفين بإرفاق تسجيلات صوتية.' },
      promo_codes: { label: 'الأكواد الترويجية', desc: 'تفعيل التحقق عبر الأكواد الترويجية.' },
      ocr_scanner: { label: 'ماسح OCR', desc: 'استخراج النصوص من الفواتير والإيصالات.' },
      qr_gateway: { label: 'بوابة QR', desc: 'التحقق من العملاء عبر رمز QR.' },
      whatsapp_link: { label: 'رابط واتساب', desc: 'إرسال طلبات التقييم عبر واتساب.' },
      keyword_hooks: { label: 'الكلمات المفتاحية', desc: 'مطابقة ذكاء اصطناعي للكلمات في التقييم.' },
    },
    permissions: {
      can_add_employees: { label: 'إضافة الموظفين', desc: 'السماح للمالك بإضافة موظفين جدد.' },
      can_export_excel: { label: 'تصدير Excel', desc: 'السماح بتصدير التقارير إلى Excel.' },
      can_approve_needs_review: { label: 'اعتماد المراجعات المعلقة', desc: 'السماح بالاعتماد اليدوي للمطالبات المعلقة.' },
      can_edit_reward_amount: { label: 'تعديل قيمة المكافأة', desc: 'السماح بتغيير مكافأة كل تقييم.' },
      can_view_ai_reasoning: { label: 'عرض تحليل الذكاء الاصطناعي', desc: 'السماح بعرض نسبة الثقة وتحليل الذكاء الاصطناعي.' },
    },
    employees: {
      addNew: 'إضافة موظف',
      fullName: 'الاسم الكامل',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      submit: 'إنشاء الموظف',
      empty: 'لا يوجد موظفون بعد.',
      pointsLabel: 'النقاط',
      fraudLabel: 'تحذيرات الاحتيال',
      deactivate: 'إيقاف',
      reactivate: 'تفعيل',
    },
    danger: {
      quotasTitle: 'الحصص',
      maxEmployees: 'الحد الأقصى للموظفين',
      maxDailyClaims: 'الحد الأقصى للمطالبات اليومية',
      saveQuotas: 'حفظ الحصص',
      suspendTitle: 'إيقاف الشركة',
      suspendDesc: 'سيؤدي هذا إلى منع جميع مستخدمي الشركة من الوصول إلى ReviewFox فورًا.',
      activateTitle: 'تفعيل الشركة',
      activateDesc: 'سيؤدي هذا إلى استعادة الوصول الكامل للشركة وموظفيها.',
      suspendAction: 'إيقاف الشركة',
      activateAction: 'تفعيل الشركة',
      confirmTitle: 'هل أنت متأكد تمامًا؟',
      confirmCancel: 'إلغاء',
      confirmProceed: 'نعم، تابع',
    },
    toastUpdated: 'تم التحديث بنجاح.',
    toastError: 'حدث خطأ ما.',
  },
  dashboard: {
    tabs: { overview: 'نظرة عامة', employees: 'الموظفون', claims: 'المطالبات', fraud: 'رادار الذكاء الاصطناعي ومركز الاحتيال', payroll: 'الرواتب الشهرية' },
    stats: {
      totalEmployees: 'إجمالي الموظفين',
      pendingClaims: 'المطالبات المعلقة',
      needsReview: 'بحاجة لمراجعة',
      suspiciousReviews: 'تقييمات مشبوهة',
    },
    features: {
      sectionTitle: 'عرض الميزات المفعّلة',
      sectionSubtitle: 'وسائل التحقق التي فتحتها إدارة ReviewFox لشركتك.',
      activeBadge: 'مفعّلة',
      lockedBadge: 'مقفلة',
      lockedDesc: 'مقفلة — تواصل مع المشرف العام للتفعيل',
    },
    employees: {
      title: 'الموظفون',
      addButton: 'إضافة موظف',
      lockedTooltip: 'تم تقييد هذه الميزة أو الوصول للحد الأقصى — تواصل مع إدارة ReviewFox للترقية',
      quotaReachedTooltip: 'تم الوصول للحد الأقصى من الموظفين — تواصل مع إدارة ReviewFox للترقية.',
      table: { name: 'الاسم', email: 'البريد الإلكتروني', points: 'النقاط', fraud: 'تحذيرات الاحتيال', status: 'الحالة' },
      addModal: {
        title: 'إضافة موظف جديد',
        description: 'إنشاء حساب موظف جديد لشركتك.',
        fullName: 'الاسم الكامل',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        submit: 'إنشاء الموظف',
        submitting: 'جاري الإنشاء...',
        toastSuccess: 'تمت إضافة الموظف بنجاح.',
        toastError: 'فشل إضافة الموظف.',
      },
      activeLabel: 'نشط',
      inactiveLabel: 'غير نشط',
    },
    excelExport: {
      button: 'تصدير الرواتب إلى Excel',
      lockedTooltip: 'مقفل من إدارة ReviewFox — قم بالترقية لفتح تصدير Excel.',
      generating: 'جاري الإنشاء...',
      toastSuccess: 'تم تصدير الرواتب بنجاح.',
      toastError: 'فشل تصدير الرواتب.',
    },
    claims: {
      title: 'المطالبات المسبقة',
      table: { employee: 'الموظف', client: 'العميل', invoice: 'رقم الفاتورة', status: 'الحالة', date: 'التاريخ', actions: 'الإجراءات' },
      approve: 'اعتماد',
      reject: 'رفض',
      approveLockedTooltip: 'فقط المشرف العام لـ ReviewFox يمكنه اعتماد هذه المطالبة.',
      toastUpdated: 'تم تحديث المطالبة بنجاح.',
      toastError: 'فشل تحديث المطالبة.',
      empty: 'لا توجد مطالبات.',
    },
    fraud: {
      title: 'رادار الذكاء الاصطناعي ومركز الاحتيال',
      subtitle: 'التقييمات المطابقة بالذكاء الاصطناعي وكشف الأنشطة المشبوهة.',
      confidenceLabel: 'نسبة ثقة الذكاء الاصطناعي',
      suspiciousBadge: 'مشبوه',
      aiReasoningLockedTitle: 'تحليل الذكاء الاصطناعي مقفل',
      aiReasoningLockedDesc: 'مقفل من إدارة ReviewFox — قم بالترقية لعرض تحليل الذكاء الاصطناعي.',
      reviewerLabel: 'المُقيّم',
      ratingLabel: 'التقييم',
      empty: 'لا توجد تقييمات بعد.',
    },
    payroll: {
      title: 'حاسبة الرواتب الشهرية',
      subtitle: 'تُحسب تلقائيًا بناءً على التقييمات المطابقة هذا الشهر.',
      rewardPerReview: 'المكافأة لكل تقييم',
      rewardLocked: 'مقفل من إدارة ReviewFox',
      saveReward: 'حفظ',
      employeeCol: 'الموظف',
      matchedCol: 'التقييمات المطابقة',
      totalCol: 'إجمالي المكافأة',
      grandTotal: 'الإجمالي الكلي',
      monthLabel: 'الشهر الحالي',
      exportButton: 'تصدير الرواتب إلى Excel',
    },
  },
  employee: {
    nav: { newClaim: 'مطالبة جديدة', history: 'السجل', leaderboard: 'لوحة المتصدرين' },
    dailyLimit: {
      usedOf: 'مطالبة مستخدمة اليوم',
      reachedTitle: 'تم الوصول للحد اليومي',
      reachedDesc: 'لقد وصلت إلى الحد الأقصى اليومي للمطالبات المحدد من ReviewFox. حاول مرة أخرى غدًا.',
    },
    newClaimForm: {
      title: 'مطالبة مسبقة جديدة',
      subtitle: 'أدخل تفاصيل التحقق الخاصة بهذا العميل.',
      clientName: 'اسم العميل',
      clientNamePlaceholder: 'الاسم المتوقع للعميل',
      invoiceNumber: 'رقم الفاتورة',
      invoiceNumberPlaceholder: 'مثال: INV-00231',
      invoiceTimestamp: 'تاريخ ووقت الفاتورة',
      quickTagsLabel: 'الوسوم السريعة',
      quickTagsOptions: { positive: 'إيجابي', negative: 'سلبي', neutral: 'محايد', followUp: 'متابعة' },
      voiceNotesLabel: 'نص الملاحظة الصوتية',
      voiceNotesPlaceholder: 'صف التفاعل بكلماتك الخاصة...',
      promoCodeLabel: 'الكود الترويجي',
      promoCodePlaceholder: 'أدخل كود التحقق/الترويج',
      ocrLabel: 'الاسم الملتقط عبر OCR',
      ocrPlaceholder: 'الاسم الملتقط من الإيصال الممسوح ضوئيًا',
      qrLabel: 'التحقق عبر QR',
      qrScanButton: 'محاكاة مسح QR',
      qrScannedAt: 'تم المسح في',
      whatsappLabel: 'هاتف العميل (واتساب)',
      whatsappPlaceholder: '+20 10 1234 5678',
      submit: 'إرسال المطالبة',
      submitting: 'جاري الإرسال...',
      toastSuccess: 'تم إرسال المطالبة بنجاح!',
      toastError: 'فشل إرسال المطالبة.',
      noFeaturesEnabled: 'لم يتم تفعيل أي وسيلة تحقق لشركتك بعد. تواصل مع إدارتك.',
      duplicateInvoice: 'تم إرسال رقم الفاتورة هذا من قبل.',
    },
    history: { title: 'سجل مطالباتي', empty: 'لم تقم بإرسال أي مطالبات بعد.', invoiceLabel: 'الفاتورة' },
    leaderboard: {
      title: 'لوحة متصدري الشركة',
      subtitle: 'أفضل الموظفين أداءً خلال هذه الفترة.',
      rank: 'الترتيب',
      pointsLabel: 'نقطة',
      empty: 'لا توجد بيانات بعد.',
      you: 'أنت',
    },
  },
};

export const dictionaries: Record<'ar' | 'en', Dictionary> = { ar, en };