export type Language = 'en' | 'hi' | 'te';

export interface Translations {
  appName: string;
  tagline: string;
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
  todayHisaab: string;
  income: string;
  expenses: string;
  diesel: string;
  netIncome: string;
  trips: string;
  pendingUdhaar: string;
  quickActions: string;
  addHisaab: string;
  newTrip: string;
  addDiesel: string;
  addExpense: string;
  receivePayment: string;
  createBill: string;
  viewHisaab: string;
  saveHisaab: string;
  saving: string;
  viewAll: string;
  noDataFound: string;
  recentTrips: string;
  vehicle: string;
  driver: string;
  customer: string;
  pickup: string;
  drop: string;
  goods: string;
  freight: string;
  loading: string;
  unloading: string;
  extraCharges: string;
  grossIncome: string;
  totalKm: string;
  mileage: string;
  paid: string;
  partial: string;
  pending: string;
  status: string;
  navHome: string;
  navHisaab: string;
  navAdd: string;
  navTrips: string;
  navMore: string;
  customersTitle: string;
  fuelTitle: string;
  expensesTitle: string;
  vehiclesTitle: string;
  driversTitle: string;
  maintenanceTitle: string;
  documentsTitle: string;
  tyresTitle: string;
  salaryTitle: string;
  billsTitle: string;
  reportsTitle: string;
  settingsTitle: string;
  adminTitle: string;
  shareWhatsApp: string;
  printBill: string;
  downloadPDF: string;
  installApp: string;
  installAppDesc: string;
  offlineNotice: string;
  daysRemaining: string;
  expired: string;
  expiringSoon: string;
  valid: string;
  roleDriver: string;
  roleOwner: string;
  roleFleet: string;
  roleAdmin: string;
  searchPlaceholder: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'GAADI HISAAB',
    tagline: 'Hisaab, Trip aur Gaadi — Sab Ek Jagah.',
    greetingMorning: 'Good Morning 👋',
    greetingAfternoon: 'Good Afternoon ☀️',
    greetingEvening: 'Good Evening 🌙',
    todayHisaab: "TODAY'S HISAAB",
    income: 'Income',
    expenses: 'Expenses',
    diesel: 'Diesel',
    netIncome: 'Net Income',
    trips: 'Trips',
    pendingUdhaar: 'Pending Udhaar',
    quickActions: 'Quick Actions',
    addHisaab: '+ Add Hisaab',
    newTrip: '🚚 New Trip',
    addDiesel: '⛽ Diesel Log',
    addExpense: '💸 Add Expense',
    receivePayment: '💰 Receive Payment',
    createBill: '🧾 Create Bill',
    viewHisaab: 'View Diary',
    saveHisaab: 'SAVE HISAAB',
    saving: 'Saving...',
    viewAll: 'View All',
    noDataFound: 'No records found yet',
    recentTrips: "Today's Trips & Activity",
    vehicle: 'Vehicle',
    driver: 'Driver',
    customer: 'Customer',
    pickup: 'From (Pickup)',
    drop: 'To (Drop)',
    goods: 'Goods Type',
    freight: 'Freight Amount',
    loading: 'Loading Charge',
    unloading: 'Unloading Charge',
    extraCharges: 'Extra Charges',
    grossIncome: 'Gross Income',
    totalKm: 'Total KM',
    mileage: 'Mileage (KM/L)',
    paid: 'Paid',
    partial: 'Partial',
    pending: 'Pending',
    status: 'Status',
    navHome: 'Home',
    navHisaab: 'Hisaab',
    navAdd: 'Add',
    navTrips: 'Trips',
    navMore: 'More',
    customersTitle: 'Customers & Udhaar Ledger',
    fuelTitle: 'Diesel & Fuel Manager',
    expensesTitle: 'Expense Tracker',
    vehiclesTitle: 'Vehicles & Fleet',
    driversTitle: 'Drivers Directory',
    maintenanceTitle: 'Vehicle Maintenance',
    documentsTitle: 'Vehicle Documents & Expiry',
    tyresTitle: 'Tyre Management',
    salaryTitle: 'Driver Salary & Advances',
    billsTitle: 'Transport Bills & Invoices',
    reportsTitle: 'Reports & Analytics',
    settingsTitle: 'Settings & Profile',
    adminTitle: 'Admin Control Panel',
    shareWhatsApp: 'Share on WhatsApp',
    printBill: 'Print Bill',
    downloadPDF: 'Download Receipt',
    installApp: 'Add to Home Screen',
    installAppDesc: 'Install Gaadi Hisaab app for quick 1-tap access on your phone',
    offlineNotice: 'You are offline. Using local device storage.',
    daysRemaining: 'days left',
    expired: 'Expired',
    expiringSoon: 'Expiring Soon',
    valid: 'Valid',
    roleDriver: 'Driver',
    roleOwner: 'Vehicle Owner',
    roleFleet: 'Fleet Owner',
    roleAdmin: 'Administrator',
    searchPlaceholder: 'Search vehicle, driver, customer, trip...',
  },

  hi: {
    appName: 'गाड़ी हिसाब',
    tagline: 'हिसाब, ट्रिप और गाड़ी — सब एक जगह।',
    greetingMorning: 'शुभ प्रभात 👋',
    greetingAfternoon: 'नमस्ते ☀️',
    greetingEvening: 'शुभ संध्या 🌙',
    todayHisaab: 'आज का हिसाब',
    income: 'कुल कमाई (Income)',
    expenses: 'खर्चा (Expense)',
    diesel: 'डीजल (Diesel)',
    netIncome: 'बचत (Net Income)',
    trips: 'ट्रिप्स (Trips)',
    pendingUdhaar: 'बाकी उधार (Pending)',
    quickActions: 'त्वरित कार्य (Quick Actions)',
    addHisaab: '+ नया हिसाब जोड़ें',
    newTrip: '🚚 नई ट्रिप',
    addDiesel: '⛽ डीजल भरें',
    addExpense: '💸 खर्चा लिखें',
    receivePayment: '💰 पेमेंट लें',
    createBill: '🧾 बिल बनाएं',
    viewHisaab: 'डायरी देखें',
    saveHisaab: 'हिसाब सुरक्षित करें',
    saving: 'सेव हो रहा है...',
    viewAll: 'सभी देखें',
    noDataFound: 'अभी कोई रिकॉर्ड नहीं है',
    recentTrips: 'आज की ट्रिप्स और हिसाब',
    vehicle: 'गाड़ी',
    driver: 'ड्राइवर',
    customer: 'पार्टी / ग्राहक',
    pickup: 'कहाँ से (Pickup)',
    drop: 'कहाँ तक (Drop)',
    goods: 'माल का प्रकार',
    freight: 'भाड़ा (Freight)',
    loading: 'लोडिंग खर्चा',
    unloading: 'अनलोडिंग खर्चा',
    extraCharges: 'अतिरिक्त चार्ज',
    grossIncome: 'सकल आमदनी',
    totalKm: 'कुल किलोमीटर',
    mileage: 'माइलेज (KM/L)',
    paid: 'चुकाया (Paid)',
    partial: 'आधा चुकाया',
    pending: 'बाकी (Pending)',
    status: 'स्थिति',
    navHome: 'होम',
    navHisaab: 'हिसाब',
    navAdd: 'जोड़ें',
    navTrips: 'ट्रिप्स',
    navMore: 'अन्य',
    customersTitle: 'पार्टी और उधार बही-खाता',
    fuelTitle: 'डीजल और ईंधन हिसाब',
    expensesTitle: 'खर्चा रिकॉर्ड',
    vehiclesTitle: 'गाड़ियां (Vehicles)',
    driversTitle: 'ड्राइवर सूची',
    maintenanceTitle: 'गाड़ी सर्विस व मेंटेनेंस',
    documentsTitle: 'दस्तावेज़ व एक्सपायरी (RC, Insurance)',
    tyresTitle: 'टायर मैनेजमेंट',
    salaryTitle: 'ड्राइवर वेतन व एडवांस',
    billsTitle: 'ट्रांसपोर्ट बिल व रसीद',
    reportsTitle: 'रिपोर्ट्स और मुनाफा',
    settingsTitle: 'सेटिंग्स व प्रोफाइल',
    adminTitle: 'एडमिन पैनल',
    shareWhatsApp: 'व्हाट्सएप पर भेजें',
    printBill: 'प्रिंट बिल',
    downloadPDF: 'डाउनलोड रसीद',
    installApp: 'होम स्क्रीन पर जोड़ें',
    installAppDesc: 'मोबाइल ऐप की तरह 1-टैप में खोलें',
    offlineNotice: 'इंटरनेट बंद है। डेटा सुरक्षित है।',
    daysRemaining: 'दिन शेष',
    expired: 'समाप्त (Expired)',
    expiringSoon: 'जल्द समाप्त',
    valid: 'वैध (Valid)',
    roleDriver: 'ड्राइवर',
    roleOwner: 'गाड़ी मालिक',
    roleFleet: 'फ्लीट मालिक',
    roleAdmin: 'सिस्टम एडमिन',
    searchPlaceholder: 'गाड़ी, ड्राइवर, पार्टी या ट्रिप खोजें...',
  },

  te: {
    appName: 'గాడి హిసాబ్',
    tagline: 'హిసాబ్, ట్రిప్ మరియు గాడి — అంతా ఒకే చోట.',
    greetingMorning: 'శుభోదయం 👋',
    greetingAfternoon: 'నమస్కారం ☀️',
    greetingEvening: 'శుభ సాయంత్రం 🌙',
    todayHisaab: 'ఈరోజు లెక్క (TODAY)',
    income: 'మొత్తం ఆదాయం',
    expenses: 'ఖర్చులు',
    diesel: 'డీజిల్',
    netIncome: 'నికర లాభం (Net)',
    trips: 'ట్రిప్పులు',
    pendingUdhaar: 'బాకీ ఉన్న పైకం',
    quickActions: 'త్వరిత చర్యలు',
    addHisaab: '+ లెక్క జోడించు',
    newTrip: '🚚 కొత్త ట్రిప్',
    addDiesel: '⛽ డీజిల్ నమోదు',
    addExpense: '💸 ఖర్చు నమోదు',
    receivePayment: '💰 చెల్లింపు తీసుకోండి',
    createBill: '🧾 రవాణా బిల్లు',
    viewHisaab: 'డైరీ చూడండి',
    saveHisaab: 'లెక్క సేవ్ చేయండి',
    saving: 'సేవ్ అవుతోంది...',
    viewAll: 'అన్నీ చూడండి',
    noDataFound: 'ఇంకా వివరాలు లేవు',
    recentTrips: 'తాజా ట్రిప్పులు',
    vehicle: 'వాహనం (గాడి)',
    driver: 'డ్రైవర్',
    customer: 'కస్టమర్ / పార్టీ',
    pickup: 'ఎక్కడి నుండి (Pickup)',
    drop: 'ఎక్కడికి (Drop)',
    goods: 'సరుకు వివరాలు',
    freight: 'రవాణా బాడుగ (Freight)',
    loading: 'లోడింగ్ చార్జ్',
    unloading: 'అన్-లోడింగ్ చార్జ్',
    extraCharges: 'అదనపు చార్జ్',
    grossIncome: 'మొత్తం రాబడి',
    totalKm: 'మొత్తం కిలోమీటర్లు',
    mileage: 'మైలేజ్ (KM/L)',
    paid: 'చెల్లించారు',
    partial: 'పాక్షికం',
    pending: 'బాకీ ఉంది',
    status: 'స్థితి',
    navHome: 'హోమ్',
    navHisaab: 'హిసాబ్',
    navAdd: 'జోడించు',
    navTrips: 'ట్రిప్స్',
    navMore: 'మరిన్ని',
    customersTitle: 'కస్టమర్లు & బాకీల పట్టిక',
    fuelTitle: 'డీజిల్ నిర్వహణ',
    expensesTitle: 'ఖర్చుల వివరాలు',
    vehiclesTitle: 'వాహనాల వివరాలు',
    driversTitle: 'డ్రైవర్ల జాబితా',
    maintenanceTitle: 'సర్వీసింగ్ & రిపేర్లు',
    documentsTitle: 'వాహన పత్రాలు (RC, ఇన్సూరెన్స్)',
    tyresTitle: 'టైర్ల నిర్వహణ',
    salaryTitle: 'డ్రైవర్ జీతం & అడ్వాన్సులు',
    billsTitle: 'రవాణా బిల్లులు & రసీదులు',
    reportsTitle: 'నివేదికలు & లాభనష్టాలు',
    settingsTitle: 'సెట్టింగులు',
    adminTitle: 'అడ్మిన్ డాష్‌బోర్డ్',
    shareWhatsApp: 'వాట్సాప్‌లో పంపండి',
    printBill: 'బిల్లు ప్రింట్ చేయండి',
    downloadPDF: 'రసీదు డౌన్‌లోడ్',
    installApp: 'హోమ్ స్క్రీన్‌కు చేర్చండి',
    installAppDesc: 'యాప్ లాగా సులభంగా 1-ట్యాప్‌లో వాడండి',
    offlineNotice: 'ఇంటర్నెట్ లేదు. స్థానిక డేటా వాడబడుతోంది.',
    daysRemaining: 'రోజులు మిగిలివున్నాయి',
    expired: 'గడువు ముగిసింది',
    expiringSoon: 'త్వరలో ముగుస్తుంది',
    valid: 'చెల్లుబాటు',
    roleDriver: 'డ్రైవర్',
    roleOwner: 'వాహన యజమాని',
    roleFleet: 'ఫ్లీట్ ఓనర్',
    roleAdmin: 'అడ్మినిస్ట్రేటర్',
    searchPlaceholder: 'వాహనం, డ్రైవర్, పార్టీ లేదా ట్రిప్ వెతకండి...',
  },
};
