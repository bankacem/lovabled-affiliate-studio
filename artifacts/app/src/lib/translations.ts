export interface TranslationDictionary {
  meta: {
    homeTitle: string;
    homeDesc: string;
    blogTitle: string;
    blogDesc: string;
    designsTitle: string;
    designsDesc: string;
    aboutTitle: string;
    aboutDesc: string;
    notFoundTitle: string;
    notFoundDesc: string;
  };
  nav: {
    home: string;
    designs: string;
    blog: string;
    about: string;
    browse: string;
  };
  hero: {
    badge: string;
    titleStart: string;
    titleHighlight: string;
    titleEnd: string;
    desc: string;
    browseCTA: string;
    blogCTA: string;
    happyCustomers: string;
    rating: string;
  };
  categories: {
    title: string;
    subtitle: string;
    designsCount: string;
    tshirts: string;
    mugs: string;
    stickers: string;
    phoneCases: string;
    posters: string;
    hoodies: string;
  };
  footer: {
    brandDesc: string;
    quickLinks: string;
    allDesigns: string;
    blog: string;
    aboutUs: string;
    categories: string;
    connect: string;
    rights: string;
    affiliateDisclosure: string;
  };
  blog: {
    title: string;
    subtitle: string;
    articlesCount: string;
    searchPlaceholder: string;
    noArticles: string;
    adjustSearch: string;
    previous: string;
    next: string;
    pageOf: string;
    readMore: string;
    backToBlog: string;
    share: string;
    copied: string;
    notFound: string;
    notFoundDesc: string;
  };
  designs: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    noDesigns: string;
    related: string;
    viewTeePublic: string;
    viewRedbubble: string;
    viewAmazon: string;
    viewEtsy: string;
    affiliateDisclosure: string;
    backToDesigns: string;
    notFound: string;
    notFoundDesc: string;
    share: string;
    copied: string;
  };
  about: {
    title: string;
    description: string;
    mission: string;
    missionTitle: string;
    missionDesc1: string;
    missionDesc2: string;
    curatedCount: string;
    curatedLabel: string;
    valuesTitle: string;
    valuesSubtitle: string;
    value1Title: string;
    value1Desc: string;
    value2Title: string;
    value2Desc: string;
    value3Title: string;
    value3Desc: string;
    value4Title: string;
    value4Desc: string;
    disclosureTitle: string;
    disclosureDesc: string;
  };
  notFound: {
    title: string;
    desc: string;
    goHome: string;
  };
}

export const translations: Record<"en" | "ar" | "es", TranslationDictionary> = {
  en: {
    meta: {
      homeTitle: "AIPrintVerse | AI-Powered Print-on-Demand Designs",
      homeDesc: "Discover AI-curated print-on-demand designs for t-shirts, mugs, stickers, and more. Shop unique artwork on TeePublic and Redbubble.",
      blogTitle: "Blog | AIPrintVerse - AI Print Design Trends",
      blogDesc: "Read the AIPrintVerse blog for the latest trends in AI-powered print-on-demand designs, design tips, and inspiration for your next unique products.",
      designsTitle: "All Designs | AIPrintVerse - Unique AI Products",
      designsDesc: "Browse our complete collection of AI-curated print-on-demand designs. Shop unique artwork for t-shirts, hoodies, mugs, and stickers from TeePublic and Redbubble.",
      aboutTitle: "About Us | AIPrintVerse - Our Story & Mission",
      aboutDesc: "Learn about AIPrintVerse, our passion for unique AI-powered designs, and our mission to connect design lovers with high-quality print-on-demand products.",
      notFoundTitle: "Page Not Found | AIPrintVerse",
      notFoundDesc: "The page you are looking for does not exist on AIPrintVerse.",
    },
    nav: {
      home: "Home",
      designs: "Designs",
      blog: "Blog",
      about: "About",
      browse: "Browse Designs",
    },
    hero: {
      badge: "Exclusive Design Collection",
      titleStart: "Discover ",
      titleHighlight: "Unique",
      titleEnd: " Print Designs",
      desc: "Browse our curated collection of stunning designs for t-shirts, hoodies, mugs, and stickers. Shop from TeePublic & Redbubble.",
      browseCTA: "Browse Designs",
      blogCTA: "Read the Blog",
      happyCustomers: "+500 Happy Customers",
      rating: "4.9/5 Rating",
    },
    categories: {
      title: "Shop by Category",
      subtitle: "Find the perfect product type for your style",
      designsCount: "designs",
      tshirts: "T-Shirts",
      mugs: "Mugs",
      stickers: "Stickers",
      phoneCases: "Phone Cases",
      posters: "Posters",
      hoodies: "Hoodies",
    },
    footer: {
      brandDesc: "AI-curated print-on-demand designs for t-shirts, mugs, stickers, and more.",
      quickLinks: "Quick Links",
      allDesigns: "All Designs",
      blog: "Blog",
      aboutUs: "About Us",
      categories: "Categories",
      connect: "Connect",
      rights: "© 2025 AIPrintVerse. All rights reserved.",
      affiliateDisclosure: "Affiliate Disclosure: We earn commissions from qualifying purchases through our affiliate links.",
    },
    blog: {
      title: "Blog",
      subtitle: "Design tips, trends, and inspiration for your style",
      articlesCount: "articles",
      searchPlaceholder: "Search articles...",
      noArticles: "No articles found. Try adjusting your search.",
      adjustSearch: "No articles published yet. Check back soon!",
      previous: "Previous",
      next: "Next",
      pageOf: "Page {page} of {totalPages}",
      readMore: "Read More",
      backToBlog: "Back to Blog",
      share: "Share",
      copied: "Link copied!",
      notFound: "Article Not Found",
      notFoundDesc: "The article you're looking for doesn't exist or has been removed.",
    },
    designs: {
      title: "All Designs",
      subtitle: "Browse our complete collection of print-on-demand designs",
      searchPlaceholder: "Search designs...",
      noDesigns: "No designs found. Try adjusting your search or filters.",
      related: "Related Designs",
      viewTeePublic: "View on TeePublic",
      viewRedbubble: "View on Redbubble",
      viewAmazon: "View on Amazon",
      viewEtsy: "View on Etsy",
      affiliateDisclosure: "* Disclosure: We may earn a commission from purchases through these links at no extra cost to you.",
      backToDesigns: "Back to Designs",
      notFound: "Design Not Found",
      notFoundDesc: "The design you're looking for doesn't exist or has been removed.",
      share: "Share",
      copied: "Link copied!",
    },
    about: {
      title: "About AIPrintVerse",
      description: "We're passionate about connecting design lovers with unique, high-quality print-on-demand merchandise. Our curated collection features the best designs from talented artists around the world.",
      mission: "Our Mission",
      missionTitle: "Making Great Design Accessible",
      missionDesc1: "AIPrintVerse was born from a simple idea: everyone deserves access to beautiful, unique designs that express their personality. We scour print-on-demand platforms to find the most creative, well-crafted designs and bring them to you in one convenient place.",
      missionDesc2: "Whether you're looking for a statement t-shirt, a cozy hoodie, a unique coffee mug, or fun stickers, our carefully curated collection has something for every style and interest.",
      curatedCount: "100+",
      curatedLabel: "Curated Designs",
      valuesTitle: "Our Values",
      valuesSubtitle: "What drives us every day",
      value1Title: "Passion for Design",
      value1Desc: "We curate only the most creative and visually stunning designs that we genuinely love.",
      value2Title: "Quality First",
      value2Desc: "Every design is handpicked for its artistic merit, uniqueness, and print quality.",
      value3Title: "Community Driven",
      value3Desc: "We support independent artists and help connect them with design enthusiasts worldwide.",
      value4Title: "Always Fresh",
      value4Desc: "Our collection is constantly updated with the latest trends and timeless classics.",
      disclosureTitle: "Affiliate Disclosure",
      disclosureDesc: "AIPrintVerse participates in affiliate programs with TeePublic, Redbubble, and other print-on-demand platforms. When you make a purchase through our links, we may earn a small commission at no extra cost to you. This helps us keep the site running and continue discovering great designs for you. Thank you for your support!",
    },
    notFound: {
      title: "Page Not Found",
      desc: "Oops! The page you are looking for doesn't exist.",
      goHome: "Go back Home",
    },
  },
  ar: {
    meta: {
      homeTitle: "AIPrintVerse | تصاميم الطباعة عند الطلب المدعومة بالذكاء الاصطناعي",
      homeDesc: "اكتشف تصاميم الطباعة عند الطلب المنسقة بواسطة الذكاء الاصطناعي للقمصان، الأكواب، الملصقات والمزيد. تسوق أعمالاً فنية فريدة على TeePublic و Redbubble.",
      blogTitle: "المدونة | AIPrintVerse - اتجاهات تصاميم الطباعة بالذكاء الاصطناعي",
      blogDesc: "اقرأ مدونة AIPrintVerse لمعرفة أحدث الاتجاهات في تصاميم الطباعة عند الطلب المدعومة بالذكاء الاصطناعي، نصائح التصميم، والإلهام لمنتجاتك الفريدة القادمة.",
      designsTitle: "جميع التصاميم | AIPrintVerse - منتجات فريدة بالذكاء الاصطناعي",
      designsDesc: "تصفح مجموعتنا الكاملة من تصاميم الطباعة عند الطلب المنسقة بالذكاء الاصطناعي. تسوق أعمالاً فنية فريدة للقمصان، الهوديز، الأكواب، والملصقات من TeePublic و Redbubble.",
      aboutTitle: "من نحن | AIPrintVerse - قصتنا ورسالتنا",
      aboutDesc: "تعرف على AIPrintVerse، شغفنا بالتصاميم الفريدة المدعومة بالذكاء الاصطناعي، ورسالتنا لربط محبي التصميم بمنتجات عالية الجودة مطبوعة عند الطلب.",
      notFoundTitle: "الصفحة غير موجودة | AIPrintVerse",
      notFoundDesc: "الصفحة التي تبحث عنها غير موجودة في AIPrintVerse.",
    },
    nav: {
      home: "الرئيسية",
      designs: "التصاميم",
      blog: "المدونة",
      about: "من نحن",
      browse: "تصفح التصاميم",
    },
    hero: {
      badge: "مجموعة تصاميم حصرية",
      titleStart: "اكتشف تصاميم طباعة ",
      titleHighlight: "فريدة",
      titleEnd: " ومبتكرة",
      desc: "تصفح مجموعتنا المنسقة من التصاميم المذهلة للقمصان، الهوديز، الأكواب، والملصقات. تسوق من TeePublic و Redbubble.",
      browseCTA: "تصفح التصاميم",
      blogCTA: "اقرأ المدونة",
      happyCustomers: "+500 عميل سعيد",
      rating: "تقييم 4.9/5",
    },
    categories: {
      title: "تسوق حسب الفئة",
      subtitle: "اعثر على نوع المنتج المثالي لأسلوبك",
      designsCount: "تصاميم",
      tshirts: "قمصان",
      mugs: "أكواب",
      stickers: "ملصقات",
      phoneCases: "أغطية هواتف",
      posters: "ملصقات جدارية",
      hoodies: "هوديز",
    },
    footer: {
      brandDesc: "تصاميم طباعة عند الطلب منسقة بالذكاء الاصطناعي للقمصان، الأكواب، الملصقات والمزيد.",
      quickLinks: "روابط سريعة",
      allDesigns: "جميع التصاميم",
      blog: "المدونة",
      aboutUs: "من نحن",
      categories: "الفئات",
      connect: "تواصل معنا",
      rights: "© 2025 AIPrintVerse. جميع الحقوق محفوظة.",
      affiliateDisclosure: "إخلاء مسؤولية التسويق بالعمولة: نربح عمولات من عمليات الشراء المؤهلة من خلال روابطنا التسويقية.",
    },
    blog: {
      title: "المدونة",
      subtitle: "نصائح التصميم، الاتجاهات والإلهام لأسلوبك الفريد",
      articlesCount: "مقالات",
      searchPlaceholder: "ابحث عن مقالات...",
      noArticles: "لم يتم العثور على مقالات. حاول تعديل البحث.",
      adjustSearch: "لم يتم نشر أي مقالات بعد. تحقق مرة أخرى قريباً!",
      previous: "السابق",
      next: "التالي",
      pageOf: "صفحة {page} من {totalPages}",
      readMore: "اقرأ المزيد",
      backToBlog: "العودة إلى المدونة",
      share: "مشاركة",
      copied: "تم نسخ الرابط!",
      notFound: "المقال غير موجود",
      notFoundDesc: "المقال الذي تبحث عنه غير موجود أو تم حذفه.",
    },
    designs: {
      title: "جميع التصاميم",
      subtitle: "تصفح مجموعتنا الكاملة من تصاميم الطباعة عند الطلب",
      searchPlaceholder: "ابحث عن تصاميم...",
      noDesigns: "لم يتم العثور على تصاميم. حاول تعديل البحث أو الفئات.",
      related: "تصاميم ذات صلة",
      viewTeePublic: "عرض على TeePublic",
      viewRedbubble: "عرض على Redbubble",
      viewAmazon: "عرض على Amazon",
      viewEtsy: "عرض على Etsy",
      affiliateDisclosure: "* إخلاء مسؤولية: قد نربح عمولة من المشتريات عبر هذه الروابط دون أي تكلفة إضافية عليك.",
      backToDesigns: "العودة إلى التصاميم",
      notFound: "التصميم غير موجود",
      notFoundDesc: "التصميم الذي تبحث عنه غير موجود أو تم حذفه.",
      share: "مشاركة",
      copied: "تم نسخ الرابط!",
    },
    about: {
      title: "حول AIPrintVerse",
      description: "نحن شغوفون بربط محبي التصاميم بمنتجات فريدة وعالية الجودة للطباعة عند الطلب. تتميز مجموعتنا المنسقة بأفضل التصاميم من فنانين موهوبين حول العالم.",
      mission: "رسالتنا",
      missionTitle: "جعل التصميم الرائع في متناول الجميع",
      missionDesc1: "ولدت AIPrintVerse من فكرة بسيطة: يستحق الجميع الحصول على تصاميم جميلة وفريدة تعبر عن شخصيتهم. نحن نبحث في منصات الطباعة عند الطلب للعثور على أكثر التصاميم ابتكاراً وجودة ونقدمها لك في مكان واحد مريح.",
      missionDesc2: "سواء كنت تبحث عن قميص مميز، أو هودي مريح، أو كوب قهوة فريد، أو ملصقات ممتعة، فإن مجموعتنا المنسقة بعناية تلبي جميع الأذواق والاهتمامات.",
      curatedCount: "+100",
      curatedLabel: "تصاميم منسقة",
      valuesTitle: "قيمنا",
      valuesSubtitle: "ما يدفعنا للعمل كل يوم",
      value1Title: "الشغف بالتصميم",
      value1Desc: "نحن ننسق فقط التصاميم الأكثر ابتكاراً وجاذبية بصرياً والتي نحبها حقاً.",
      value2Title: "الجودة أولاً",
      value2Desc: "يتم اختيار كل تصميم بعناية لقيمته الفنية وتفرده وجودة الطباعة.",
      value3Title: "دعم المجتمع",
      value3Desc: "نحن ندعم الفنانين المستقلين ونساعد في ربطهم بعشاق التصميم حول العالم.",
      value4Title: "متجدد دائماً",
      value4Desc: "يتم تحديث مجموعتنا باستمرار بأحدث الاتجاهات والكلاسيكيات الخالدة.",
      disclosureTitle: "إخلاء مسؤولية التسويق بالعمولة",
      disclosureDesc: "تشارك AIPrintVerse في برامج التسويق بالعمولة مع TeePublic و Redbubble ومنصات الطباعة عند الطلب الأخرى. عند إجراء عملية شراء من خلال روابطنا، قد نربح عمولة صغيرة دون أي تكلفة إضافية عليك. يساعدنا هذا في استمرار تشغيل الموقع واكتشاف المزيد من التصاميم الرائعة لك. شكراً لدعمكم!",
    },
    notFound: {
      title: "الصفحة غير موجودة",
      desc: "عذراً! الصفحة التي تبحث عنها غير موجودة.",
      goHome: "العودة للرئيسية",
    },
  },
  es: {
    meta: {
      homeTitle: "AIPrintVerse | Diseños de Impresión bajo Demanda impulsados por IA",
      homeDesc: "Descubre diseños de impresión bajo demanda seleccionados por IA para camisetas, tazas, pegatinas y más. Compra obras de arte únicas en TeePublic y Redbubble.",
      blogTitle: "Blog | AIPrintVerse - Tendencias de Diseño de Impresión con IA",
      blogDesc: "Lee el blog de AIPrintVerse para conocer las últimas tendencias en diseños de impresión bajo demanda impulsados por IA, consejos de diseño e inspiración para tus próximos productos únicos.",
      designsTitle: "Todos los Diseños | AIPrintVerse - Productos de IA Únicos",
      designsDesc: "Explora nuestra colección completa de diseños de impresión bajo demanda seleccionados por IA. Compra obras de arte únicas para camisetas, sudaderas, tazas y pegatinas de TeePublic y Redbubble.",
      aboutTitle: "Sobre Nosotros | AIPrintVerse - Nuestra Historia y Misión",
      aboutDesc: "Conoce AIPrintVerse, nuestra pasión por los diseños únicos impulsados por IA y nuestra misión de conectar a los amantes del diseño con productos de impresión bajo demanda de alta calidad.",
      notFoundTitle: "Página no encontrada | AIPrintVerse",
      notFoundDesc: "La página que buscas no existe en AIPrintVerse.",
    },
    nav: {
      home: "Inicio",
      designs: "Diseños",
      blog: "Blog",
      about: "Sobre Nosotros",
      browse: "Explorar Diseños",
    },
    hero: {
      badge: "Colección de Diseños Exclusiva",
      titleStart: "Descubre Diseños de Impresión ",
      titleHighlight: "Únicos",
      titleEnd: "",
      desc: "Explora nuestra colección seleccionada de impresionantes diseños para camisetas, sudaderas con capucha, tazas y pegatinas. Compra en TeePublic y Redbubble.",
      browseCTA: "Explorar Diseños",
      blogCTA: "Leer el Blog",
      happyCustomers: "+500 Clientes Felices",
      rating: "Calificación de 4.9/5",
    },
    categories: {
      title: "Comprar por Categoría",
      subtitle: "Encuentra el tipo de producto perfecto para tu estilo",
      designsCount: "diseños",
      tshirts: "Camisetas",
      mugs: "Tazas",
      stickers: "Pegatinas",
      phoneCases: "Fundas de Móvil",
      posters: "Pósteres",
      hoodies: "Sudaderas con Capucha",
    },
    footer: {
      brandDesc: "Diseños de impresión bajo demanda seleccionados por IA para camisetas, tazas, pegatinas y más.",
      quickLinks: "Enlaces Rápidos",
      allDesigns: "Todos los Diseños",
      blog: "Blog",
      aboutUs: "Sobre Nosotros",
      categories: "Categorías",
      connect: "Conectar",
      rights: "© 2025 AIPrintVerse. Todos los derechos reservados.",
      affiliateDisclosure: "Divulgación de afiliados: Ganamos comisiones por compras que califiquen a través de nuestros enlaces de afiliados.",
    },
    blog: {
      title: "Blog",
      subtitle: "Consejos de diseño, tendencias e inspiración para tu estilo",
      articlesCount: "artículos",
      searchPlaceholder: "Buscar artículos...",
      noArticles: "No se encontraron artículos. Intenta ajustar tu búsqueda.",
      adjustSearch: "¡Aún no se han publicado artículos! Vuelve pronto.",
      previous: "Anterior",
      next: "Siguiente",
      pageOf: "Página {page} de {totalPages}",
      readMore: "Leer Más",
      backToBlog: "Volver al Blog",
      share: "Compartir",
      copied: "¡Enlace copiado!",
      notFound: "Artículo no encontrado",
      notFoundDesc: "El artículo que buscas no existe o ha sido eliminado.",
    },
    designs: {
      title: "Todos los Diseños",
      subtitle: "Explora nuestra colección completa de diseños de impresión bajo demanda",
      searchPlaceholder: "Buscar diseños...",
      noDesigns: "No se encontraron diseños. Intenta ajustar tu búsqueda o filtros.",
      related: "Diseños Relacionados",
      viewTeePublic: "Ver en TeePublic",
      viewRedbubble: "Ver en Redbubble",
      viewAmazon: "Ver en Amazon",
      viewEtsy: "Ver en Etsy",
      affiliateDisclosure: "* Divulgación: Podemos ganar una comisión por las compras realizadas a través de estos enlaces sin costo adicional para ti.",
      backToDesigns: "Volver a Diseños",
      notFound: "Diseño no encontrado",
      notFoundDesc: "El diseño que buscas no existe o ha sido eliminado.",
      share: "Compartir",
      copied: "¡Enlace copiado!",
    },
    about: {
      title: "Sobre AIPrintVerse",
      description: "Nos apasiona conectar a los amantes del diseño con artículos de impresión bajo demanda únicos y de alta calidad. Nuestra colección seleccionada presenta los mejores diseños de talentosos artistas de todo el mundo.",
      mission: "Nuestra Misión",
      missionTitle: "Hacer Accesible el Gran Diseño",
      missionDesc1: "AIPrintVerse nació de una idea simple: todos merecen acceso a diseños hermosos y únicos que expresen su personalidad. Buscamos en plataformas de impresión bajo demanda para encontrar los diseños más creativos y mejor elaborados y traértelos en un solo lugar conveniente.",
      missionDesc2: "Ya sea que estés buscando una camiseta llamativa, una sudadera cómoda, una taza de café única o pegatinas divertidas, nuestra colección cuidadosamente seleccionada tiene algo para cada estilo e interés.",
      curatedCount: "100+",
      curatedLabel: "Diseños Seleccionados",
      valuesTitle: "Nuestros Valores",
      valuesSubtitle: "Lo que nos impulsa cada día",
      value1Title: "Pasión por el Diseño",
      value1Desc: "Seleccionamos solo los diseños más creativos e impresionantes visualmente que realmente amamos.",
      value2Title: "Calidad Primero",
      value2Desc: "Cada diseño es seleccionado a mano por su mérito artístico, singularidad y calidad de impresión.",
      value3Title: "Impulsado por la Comunidad",
      value3Desc: "Apoyamos a los artistas independientes y ayudamos a conectarlos con entusiastas del diseño de todo el mundo.",
      value4Title: "Siempre Fresco",
      value4Desc: "Nuestra colección se actualiza constantemente con las últimas tendencias y clásicos atemporales.",
      disclosureTitle: "Divulgación de Afiliados",
      disclosureDesc: "AIPrintVerse participa en programas de afiliados con TeePublic, Redbubble y otras plataformas de impresión bajo demanda. Cuando realizas una compra a través de nuestros enlaces, podemos ganar una pequeña comisión sin costo adicional para ti. Esto nos ayuda a mantener el sitio en funcionamiento y seguir descubriendo excelentes diseños para ti. ¡Gracias por tu apoyo!",
    },
    notFound: {
      title: "Página No Encontrada",
      desc: "¡Ups! La página que buscas no existe.",
      goHome: "Volver al Inicio",
    },
  },
};
