/**
 * Realistic Broadcast Studio Sound Effects (SFX) Engine
 * Loads authentic studio-recorded audio samples from local high-fidelity assets (/sfx/*.ogg)
 * with instant caching, real-time volume control, preview player, and procedural fallback.
 */

export type SFXCategory =
  | 'Retail & Sales'
  | 'Alerts & Bells'
  | 'Cinematic & Impacts'
  | 'Vehicles & City'
  | 'Crowd & Events'
  | 'Office & Tech'
  | 'Nature & Weather'
  | 'Cartoon & Comedy';

export type SFXType =
  // Retail & Sales
  | 'cash_register'
  | 'coins_shuffling'
  | 'champagne_cork'
  | 'glass_toast'
  // Alerts & Bells
  | 'doorbell'
  | 'wood_door'
  | 'creaking_door'
  | 'sliding_glass_door'
  | 'phone_ring'
  | 'phone_alerts'
  | 'cell_phone_vibrate'
  | 'pop_notification'
  | 'bell_chime'
  | 'dinner_bell'
  | 'digital_watch_alarm'
  | 'alarm_clock'
  | 'clock_ticking'
  | 'bugle_tune'
  | 'radio_beep'
  // Cinematic & Impacts
  | 'whoosh'
  | 'cinematic_sweep'
  | 'cinematic_suspense'
  | 'sub_impact'
  | 'impact_crash'
  | 'glass_breaking'
  | 'body_punch'
  | 'wood_impact'
  | 'magic_sparkle'
  | 'wind_chimes'
  // Vehicles & City
  | 'car_horn'
  | 'car_screech'
  | 'air_horn'
  | 'emergency_siren'
  // Crowd & Events
  | 'applause'
  | 'crowd_cheer'
  | 'coffee_shop'
  // Office & Tech
  | 'camera_click'
  | 'typing_keyboard'
  | 'button_push'
  | 'record_scratch'
  // Nature & Weather
  | 'thunder_storm'
  | 'distant_thunder'
  | 'heavy_rain'
  // Cartoon & Comedy
  | 'cartoon_boing'
  | 'slide_whistle'
  | 'cartoon_cowbell'
  | 'clown_horn';

export interface SFXDefinition {
  id: SFXType;
  labelEl: string;
  labelEn: string;
  tagEl: string;
  tagEn: string;
  category: SFXCategory;
  descriptionEl: string;
  descriptionEn: string;
  icon: string;
  soundFile: string;
  defaultVolume: number;
  durationEstimate: number; // in seconds
}

export const AVAILABLE_SFX: SFXDefinition[] = [
  // 💰 Retail & Sales (Λιανική & Προσφορές)
  {
    id: 'cash_register',
    labelEl: 'Ταμειακή Μηχανή (Cha-Ching)',
    labelEn: 'Cash Register (Cha-Ching)',
    tagEl: '[SFX: Ταμειακή μηχανή cha-ching]',
    tagEn: '[SFX: Cash register cha-ching]',
    category: 'Retail & Sales',
    descriptionEl: 'Πραγματικό μεταλλικό συρτάρι ταμείου με καμπανάκι & κέρματα για προσφορές & εκπτώσεις',
    descriptionEn: 'Authentic metallic cash register drawer slide, chime & coins for retail sales & deals',
    icon: '💰',
    soundFile: '/sfx/cash_register.ogg',
    defaultVolume: 1.0,
    durationEstimate: 1.8,
  },
  {
    id: 'coins_shuffling',
    labelEl: 'Μέτρημα Κερμάτων & Χρήματα',
    labelEn: 'Coins Jingling & Cash Handling',
    tagEl: '[SFX: Μέτρημα κερμάτων coins]',
    tagEn: '[SFX: Coins jingling]',
    category: 'Retail & Sales',
    descriptionEl: 'Αληθινά μεταλλικά κέρματα που ανακατεύονται για τράπεζες, αποταμίευση & οικονομία',
    descriptionEn: 'Real metallic coins shuffling and counting for banking and savings ads',
    icon: '🪙',
    soundFile: '/sfx/aluminum_can_crunch.ogg',
    defaultVolume: 0.85,
    durationEstimate: 1.5,
  },
  {
    id: 'glass_toast',
    labelEl: 'Τσούγκρισμα Ποτηριών (Cheers Toast)',
    labelEn: 'Champagne / Wine Glasses Clink',
    tagEl: '[SFX: Τσούγκρισμα ποτηριών cheers]',
    tagEn: '[SFX: Wine glasses clink cheers]',
    category: 'Retail & Sales',
    descriptionEl: 'Κρυστάλλινο τσούγκρισμα ποτηριών σαμπάνιας για γιορτές, γάμους & εγκαίνια',
    descriptionEn: 'Crystal glassware clinking together in a celebratory cheers toast',
    icon: '🥂',
    soundFile: '/sfx/glass_toast.ogg',
    defaultVolume: 0.9,
    durationEstimate: 2.2,
  },
  {
    id: 'champagne_cork',
    labelEl: 'Άνοιγμα Σαμπάνιας (Cork Pop & Fizz)',
    labelEn: 'Champagne Cork Pop & Fizz',
    tagEl: '[SFX: Άνοιγμα σαμπάνιας pop]',
    tagEn: '[SFX: Champagne cork pop]',
    category: 'Retail & Sales',
    descriptionEl: 'Εορταστικό άνοιγμα φελλού & αφρισμός για πάρτι, ρεβεγιόν και πολυτέλεια',
    descriptionEn: 'Celebratory champagne cork release and bubbly fizz for celebrations',
    icon: '🍾',
    soundFile: '/sfx/pop_bubble.ogg',
    defaultVolume: 0.95,
    durationEstimate: 1.2,
  },

  // 🔔 Alerts & Bells (Κουδούνια & Σήματα)
  {
    id: 'doorbell',
    labelEl: 'Κουδούνι Εξώπορτας & Άνοιγμα',
    labelEn: 'Doorbell Ding-Dong & Entry',
    tagEl: '[SFX: Κουδούνι εξώπορτας ding-dong]',
    tagEn: '[SFX: Doorbell ding-dong]',
    category: 'Alerts & Bells',
    descriptionEl: 'Κλασικό μελωδικό κουδούνι επισκέπτη ή delivery και άνοιγμα πόρτας',
    descriptionEn: 'Classic resonant home doorbell ding-dong with front door opening',
    icon: '🔔',
    soundFile: '/sfx/doorbell_wood_door.ogg',
    defaultVolume: 0.95,
    durationEstimate: 1.6,
  },
  {
    id: 'wood_door',
    labelEl: 'Άνοιγμα / Κλείσιμο Πόρτας',
    labelEn: 'Wooden Door Open & Close',
    tagEl: '[SFX: Άνοιγμα ξύλινης πόρτας]',
    tagEn: '[SFX: Wooden door open and close]',
    category: 'Alerts & Bells',
    descriptionEl: 'Φυσικό άνοιγμα και απαλό κλείσιμο ξύλινης πόρτας δωματίου/γραφείου',
    descriptionEn: 'Natural acoustic wooden door latch opening and shutting',
    icon: '🚪',
    soundFile: '/sfx/wood_door_open_close.ogg',
    defaultVolume: 0.85,
    durationEstimate: 1.4,
  },
  {
    id: 'creaking_door',
    labelEl: 'Τρίξιμο Πόρτας (Creaking Door)',
    labelEn: 'Creaking Wooden Door',
    tagEl: '[SFX: Τρίξιμο πόρτας creak]',
    tagEn: '[SFX: Creaking wooden door]',
    category: 'Alerts & Bells',
    descriptionEl: 'Ατμοσφαιρικό αργό τρίξιμο παλιάς πόρτας για μυστήριο & αναμονή',
    descriptionEn: 'Atmospheric slow creaking hinges for mystery, suspense, or Halloween',
    icon: '🏚️',
    soundFile: '/sfx/creaking_wooden_door.ogg',
    defaultVolume: 0.8,
    durationEstimate: 2.5,
  },
  {
    id: 'sliding_glass_door',
    labelEl: 'Συρόμενη Γυάλινη Πόρτα Καταστήματος',
    labelEn: 'Sliding Glass Storefront Door',
    tagEl: '[SFX: Συρόμενη πόρτα καταστήματος]',
    tagEn: '[SFX: Sliding glass door]',
    category: 'Alerts & Bells',
    descriptionEl: 'Αυτόματη συρόμενη πόρτα εμπορικού κέντρου, boutique ή super market',
    descriptionEn: 'Smooth sliding glass entrance for malls, retail stores & supermarkets',
    icon: '🏢',
    soundFile: '/sfx/sliding_glass_door.ogg',
    defaultVolume: 0.85,
    durationEstimate: 1.7,
  },
  {
    id: 'phone_ring',
    labelEl: 'Κουδούνισμα Τηλεφώνου (Phone Ring)',
    labelEn: 'Telephone Ring',
    tagEl: '[SFX: Κουδούνισμα τηλεφώνου]',
    tagEn: '[SFX: Telephone ring]',
    category: 'Alerts & Bells',
    descriptionEl: 'Ραδιοφωνικό κουδούνισμα σταθερού τηλεφώνου για παραγγελίες & ραντεβού',
    descriptionEn: 'Commercial landline telephone bell ringing for hotlines and bookings',
    icon: '☎️',
    soundFile: '/sfx/phone_ringing.ogg',
    defaultVolume: 0.9,
    durationEstimate: 1.8,
  },
  {
    id: 'phone_alerts',
    labelEl: 'Ήχοι Κινητού / Ringtone Μελωδία',
    labelEn: 'Smartphone Melodic Ringtone & Alerts',
    tagEl: '[SFX: Ήχος κλήσης κινητού]',
    tagEn: '[SFX: Smartphone ringtone]',
    category: 'Alerts & Bells',
    descriptionEl: 'Μοντέρνα μελωδική κλήση smartphone για tech εταιρείες & online services',
    descriptionEn: 'Modern electronic smartphone ringtone and notification sequence',
    icon: '📲',
    soundFile: '/sfx/phone_alerts_and_rings.ogg',
    defaultVolume: 0.85,
    durationEstimate: 2.0,
  },
  {
    id: 'cell_phone_vibrate',
    labelEl: 'Δόνηση Κινητού στο Τραπέζι',
    labelEn: 'Phone Vibration Buzz on Desk',
    tagEl: '[SFX: Δόνηση κινητού vibrate]',
    tagEn: '[SFX: Phone vibration buzz]',
    category: 'Alerts & Bells',
    descriptionEl: 'Ρεαλιστική δόνηση κινητού σε ξύλινο γραφείο για επείγον μήνυμα',
    descriptionEn: 'Realistic smartphone haptic motor vibration buzzing on wood desk',
    icon: '📳',
    soundFile: '/sfx/cell_phone_vibrate.ogg',
    defaultVolume: 0.9,
    durationEstimate: 1.5,
  },
  {
    id: 'pop_notification',
    labelEl: 'Ψηφιακό Pop Ειδοποίησης (App Bubble)',
    labelEn: 'App Notification Bubble Pop',
    tagEl: '[SFX: Ψηφιακό pop ειδοποίησης]',
    tagEn: '[SFX: App notification pop]',
    category: 'Alerts & Bells',
    descriptionEl: 'Κρυστάλλινο notification pop για mobile apps, μηνύματα & e-shop',
    descriptionEn: 'Crisp digital bubble pop for apps, messaging, discounts & web alerts',
    icon: '💬',
    soundFile: '/sfx/pop_bubble.ogg',
    defaultVolume: 0.95,
    durationEstimate: 0.6,
  },
  {
    id: 'bell_chime',
    labelEl: 'Κρυστάλλινο Chime (Success Chime)',
    labelEn: 'Crystal Resonant Bell Chime',
    tagEl: '[SFX: Κρυστάλλινο chime]',
    tagEn: '[SFX: Crystal bell chime]',
    category: 'Alerts & Bells',
    descriptionEl: 'Λαμπερό ορχηστρικό καμπανάκι για θετικό αποτέλεσμα και αξιοπιστία',
    descriptionEn: 'Bright resonant brass bell chime for success, quality & trust',
    icon: '✨',
    soundFile: '/sfx/medium_bell_ringing.ogg',
    defaultVolume: 0.85,
    durationEstimate: 1.8,
  },
  {
    id: 'dinner_bell',
    labelEl: 'Καμπανάκι Εστιατορίου / Reception',
    labelEn: 'Dinner Bell / Counter Call Bell',
    tagEl: '[SFX: Καμπανάκι εστιατορίου dinner bell]',
    tagEn: '[SFX: Dinner call bell]',
    category: 'Alerts & Bells',
    descriptionEl: 'Μεταλλικό τρίγωνο/καμπανάκι σερβιρίσματος για ταβέρνες, φαγητό & ξενοδοχεία',
    descriptionEn: 'Metallic triangle dinner bell calling customers for restaurants and food',
    icon: '🛎️',
    soundFile: '/sfx/dinner_bell_triangle.ogg',
    defaultVolume: 0.85,
    durationEstimate: 1.6,
  },
  {
    id: 'digital_watch_alarm',
    labelEl: 'Ψηφιακό Ξυπνητήρι / Timer Beep',
    labelEn: 'Digital Watch Alarm Beeps',
    tagEl: '[SFX: Ψηφιακό ρολόι alarm beeps]',
    tagEn: '[SFX: Digital watch alarm beeps]',
    category: 'Alerts & Bells',
    descriptionEl: 'Ηλεκτρονικό μπιπ χρονομέτρου για προθεσμίες που λήγουν άμεσα',
    descriptionEn: 'High-pitched electronic watch timer beeps for limited deadlines',
    icon: '⌚',
    soundFile: '/sfx/digital_watch_alarm.ogg',
    defaultVolume: 0.85,
    durationEstimate: 1.6,
  },
  {
    id: 'alarm_clock',
    labelEl: 'Κλασικό Ξυπνητήρι (Twin-Bell)',
    labelEn: 'Classic Twin-Bell Alarm Clock',
    tagEl: '[SFX: Κλασικό ξυπνητήρι alarm]',
    tagEn: '[SFX: Twin bell alarm clock]',
    category: 'Alerts & Bells',
    descriptionEl: 'Δυνατό μεταλλικό ξυπνητήρι πρωινού ξυπνήματος για πρωινές εκπομπές & deals',
    descriptionEn: 'Loud vintage metallic twin bell mechanical alarm clock ringing',
    icon: '⏰',
    soundFile: '/sfx/alarm_clock.ogg',
    defaultVolume: 0.85,
    durationEstimate: 2.0,
  },
  {
    id: 'clock_ticking',
    labelEl: 'Τικ-Τακ Ρολογιού (Countdown Tick-Tock)',
    labelEn: 'Clock Ticking (Urgency)',
    tagEl: '[SFX: Τικ-τακ ρολογιού countdown]',
    tagEn: '[SFX: Clock ticking countdown]',
    category: 'Alerts & Bells',
    descriptionEl: 'Μηχανικό τικ-τακ αντίστροφης μέτρησης για προσφορές που λήγουν σήμερα',
    descriptionEn: 'Rhythmic mechanical countdown tick-tock for expiring limited-time offers',
    icon: '⏱️',
    soundFile: '/sfx/clock_ticking.ogg',
    defaultVolume: 0.9,
    durationEstimate: 2.2,
  },
  {
    id: 'bugle_tune',
    labelEl: 'Σάλπισμα Εγερτηρίου / Fanfare',
    labelEn: 'Brass Bugle Wake-Up Call Fanfare',
    tagEl: '[SFX: Σάλπισμα εγερτηρίου bugle fanfare]',
    tagEn: '[SFX: Brass bugle fanfare]',
    category: 'Alerts & Bells',
    descriptionEl: 'Χάλκινο εγερτήριο σάλπισμα για μεγάλες ανακοινώσεις και πρωινές προσφορές',
    descriptionEn: 'Real brass military bugle morning wake-up call for bold announcements',
    icon: '🎺',
    soundFile: '/sfx/bugle_tune.ogg',
    defaultVolume: 0.85,
    durationEstimate: 2.2,
  },
  {
    id: 'radio_beep',
    labelEl: 'Ραδιοφωνικό Σήμα / Pips (Radio Beep)',
    labelEn: 'Radio Countdown Pips & Tuning',
    tagEl: '[SFX: Ραδιοφωνικό beep]',
    tagEn: '[SFX: Radio countdown pips]',
    category: 'Alerts & Bells',
    descriptionEl: 'Επίσημο ραδιοφωνικό σήμα ώρας & συντονισμός για δελτία ειδήσεων',
    descriptionEn: 'Official broadcast station time pips and radio tuning tone',
    icon: '📻',
    soundFile: '/sfx/beep_short.ogg',
    defaultVolume: 0.8,
    durationEstimate: 0.8,
  },

  // 💥 Cinematic & Impacts (Κινηματογραφικά & Impacts)
  {
    id: 'whoosh',
    labelEl: 'Whoosh Μετάβασης (Fast Swoosh)',
    labelEn: 'Transition Whoosh / Swoosh',
    tagEl: '[SFX: Whoosh μετάβασης]',
    tagEn: '[SFX: Transition whoosh]',
    category: 'Cinematic & Impacts',
    descriptionEl: 'Πραγματικό αεροδυναμικό πέρασμα για γρήγορη αλλαγή σκηνής ή αποκάλυψη τιμής',
    descriptionEn: 'Aerodynamic rush and swoosh for fast scene transitions and price reveals',
    icon: '💨',
    soundFile: '/sfx/whoosh_swoosh.ogg',
    defaultVolume: 0.95,
    durationEstimate: 0.9,
  },
  {
    id: 'cinematic_sweep',
    labelEl: 'Κινηματογραφικό Riser / Sci-Fi Sweep',
    labelEn: 'Cinematic Sci-Fi Riser & Sweep',
    tagEl: '[SFX: Cinematic sweep riser]',
    tagEn: '[SFX: Cinematic riser sweep]',
    category: 'Cinematic & Impacts',
    descriptionEl: 'Μοντέρνο ηλεκτρονικό πέρασμα και κλιμάκωση έντασης για trailer',
    descriptionEn: 'Modern futuristic riser sweep building intensity for big reveals',
    icon: '🚀',
    soundFile: '/sfx/cinematic_sweep.ogg',
    defaultVolume: 0.85,
    durationEstimate: 2.4,
  },
  {
    id: 'cinematic_suspense',
    labelEl: 'Μυστηριώδης Αγωνία (Suspense Builder)',
    labelEn: 'Dark Cinematic Suspense Drone',
    tagEl: '[SFX: Cinematic suspense drone]',
    tagEn: '[SFX: Cinematic suspense drone]',
    category: 'Cinematic & Impacts',
    descriptionEl: 'Βαθύς κινηματογραφικός τόνος αγωνίας πριν την κορύφωση',
    descriptionEn: 'Deep atmospheric suspense pad and drone for intense plot moments',
    icon: '🌌',
    soundFile: '/sfx/cinematic_suspense.ogg',
    defaultVolume: 0.8,
    durationEstimate: 2.8,
  },
  {
    id: 'sub_impact',
    labelEl: 'Κινηματογραφικό Boom / Sub Impact',
    labelEn: 'Trailer Sub-Bass Impact Boom',
    tagEl: '[SFX: Κινηματογραφικό impact / boom]',
    tagEn: '[SFX: Cinematic impact boom]',
    category: 'Cinematic & Impacts',
    descriptionEl: 'Βαρύ μπάσο χτύπημα υπογούφερ 808 για δυναμικές εκπτώσεις-σοκ',
    descriptionEn: 'Heavy trailer sub-bass drop and impact transient for high-energy spots',
    icon: '💥',
    soundFile: '/sfx/impact_crash.ogg',
    defaultVolume: 0.95,
    durationEstimate: 1.8,
  },
  {
    id: 'impact_crash',
    labelEl: 'Σύγκρουση & Σπάσιμο (Crash & Smash)',
    labelEn: 'Heavy Crash & Shatter Impact',
    tagEl: '[SFX: Σύγκρουση crash]',
    tagEn: '[SFX: Heavy crash impact]',
    category: 'Cinematic & Impacts',
    descriptionEl: 'Ηχηρή σύγκρουση και σπάσιμο για τιμές που πέφτουν κατακόρυφα',
    descriptionEn: 'Violent collision crash and shatter for "prices crashing down" promos',
    icon: '🔨',
    soundFile: '/sfx/impact_crash.ogg',
    defaultVolume: 0.9,
    durationEstimate: 1.6,
  },
  {
    id: 'glass_breaking',
    labelEl: 'Θρυμματισμός Γυαλιού (Glass Breaking)',
    labelEn: 'Window Glass Pane Breaking',
    tagEl: '[SFX: Σπάσιμο γυαλιού glass shatter]',
    tagEn: '[SFX: Glass breaking shatter]',
    category: 'Cinematic & Impacts',
    descriptionEl: 'Πραγματικό σπάσιμο τζαμιού με θραύσματα για ανατρεπτικές προσφορές',
    descriptionEn: 'Realistic glass window shatter and shards hitting the ground',
    icon: '🪟',
    soundFile: '/sfx/glass_breaking.ogg',
    defaultVolume: 0.85,
    durationEstimate: 1.4,
  },
  {
    id: 'body_punch',
    labelEl: 'Γροθιά Δράσης (Action Movie Hit)',
    labelEn: 'Action Physical Punch Impact',
    tagEl: '[SFX: Γροθιά body punch]',
    tagEn: '[SFX: Action punch hit]',
    category: 'Cinematic & Impacts',
    descriptionEl: 'Δυναμικό χτύπημα τύπου κινηματογραφικής ταινίας δράσης / fitness',
    descriptionEn: 'Crisp action movie punch transient for sports, fitness and energy spots',
    icon: '🥊',
    soundFile: '/sfx/body_punch.ogg',
    defaultVolume: 0.9,
    durationEstimate: 1.0,
  },
  {
    id: 'wood_impact',
    labelEl: 'Ξύλινο Χτύπημα (Wood Block Thump)',
    labelEn: 'Heavy Solid Wood Impact',
    tagEl: '[SFX: Ξύλινο χτύπημα wood impact]',
    tagEn: '[SFX: Solid wood impact thump]',
    category: 'Cinematic & Impacts',
    descriptionEl: 'Γήινο βαρύ χτύπημα ξύλου για κατασκευές, έπιπλα & εργαλεία',
    descriptionEn: 'Acoustic resonant wood thud for construction, furniture & DIY promos',
    icon: '🪵',
    soundFile: '/sfx/wood_impact.ogg',
    defaultVolume: 0.9,
    durationEstimate: 1.3,
  },
  {
    id: 'magic_sparkle',
    labelEl: 'Μαγική Αστερόσκονη (Sparkle Chime)',
    labelEn: 'Magic Stardust Sparkle Chimes',
    tagEl: '[SFX: Μαγικό sparkle chime]',
    tagEn: '[SFX: Magic sparkle chime]',
    category: 'Cinematic & Impacts',
    descriptionEl: 'Παραμυθένια αστερόσκονη για ομορφιά, καλλυντικά, spa & παιδιά',
    descriptionEn: 'Enchanted star chimes for beauty, cosmetics, family and luxury spots',
    icon: '🌟',
    soundFile: '/sfx/magic_chime.ogg',
    defaultVolume: 0.9,
    durationEstimate: 2.2,
  },
  {
    id: 'wind_chimes',
    labelEl: 'Απαλά Μεταλλικά Chimes Ανέμου',
    labelEn: 'Gentle Metallic Wind Chimes',
    tagEl: '[SFX: Chimes ανέμου wind chimes]',
    tagEn: '[SFX: Gentle wind chimes]',
    category: 'Cinematic & Impacts',
    descriptionEl: 'Χαλαρωτικά καμπανάκια ανέμου για κήπο, σπίτι & ευεξία',
    descriptionEn: 'Relaxing outdoor metal wind chimes for home, garden & wellness',
    icon: '🎐',
    soundFile: '/sfx/wind_chimes.ogg',
    defaultVolume: 0.85,
    durationEstimate: 2.0,
  },

  // 🚗 Vehicles & City (Οχήματα & Πόλη)
  {
    id: 'car_horn',
    labelEl: 'Κόρνα Αυτοκινήτου (City Car Horn)',
    labelEn: 'City Car Horn (Beep Beep)',
    tagEl: '[SFX: Κόρνα αυτοκινήτου beep]',
    tagEn: '[SFX: Car horn beep]',
    category: 'Vehicles & City',
    descriptionEl: 'Πραγματικό διπλό κορνάρισμα πόλης για κίνηση, συνεργεία & delivery',
    descriptionEn: 'Authentic dual-tone city traffic horn honk for automotive & delivery ads',
    icon: '📯',
    soundFile: '/sfx/car_horn.ogg',
    defaultVolume: 0.9,
    durationEstimate: 1.8,
  },
  {
    id: 'car_screech',
    labelEl: 'Φρενάρισμα Αυτοκινήτου (Tire Skid)',
    labelEn: 'Car Tire Screech & Brake Skid',
    tagEl: '[SFX: Φρενάρισμα αυτοκινήτου]',
    tagEn: '[SFX: Car tire screech]',
    category: 'Vehicles & City',
    descriptionEl: 'Απότομο στρίγγλισμα ελαστικών σε άσφαλτο για αναπάντεχα νέα & προσφορές',
    descriptionEn: 'Sharp tire squeal and asphalt skid for sudden plot turns and auto ads',
    icon: '🚗',
    soundFile: '/sfx/car_screech.ogg',
    defaultVolume: 0.9,
    durationEstimate: 2.4,
  },
  {
    id: 'air_horn',
    labelEl: 'Ραδιοφωνικό Air Horn (Stadium Blast)',
    labelEn: 'Radio Stadium Air Horn Fanfare',
    tagEl: '[SFX: Ραδιοφωνικό air horn]',
    tagEn: '[SFX: Radio stadium air horn]',
    category: 'Vehicles & City',
    descriptionEl: 'Εκρηκτική ραδιοφωνική κόρνα DJ για πάρτι, gaming, συναυλίες & hype spots',
    descriptionEn: 'Explosive radio DJ air horn blast for parties, concerts & hype commercials',
    icon: '📢',
    soundFile: '/sfx/air_horn.ogg',
    defaultVolume: 0.85,
    durationEstimate: 1.9,
  },
  {
    id: 'emergency_siren',
    labelEl: 'Σειρήνα Ασθενοφόρου / Άμεσης Δράσης',
    labelEn: 'Emergency Siren (Ambulance / Police)',
    tagEl: '[SFX: Σειρήνα έκτακτης ανάγκης siren]',
    tagEn: '[SFX: Emergency vehicle siren]',
    category: 'Vehicles & City',
    descriptionEl: 'Ρεαλιστική σειρήνα άμεσης ανάγκης για επείγουσες εκπτώσεις & οδική βοήθεια',
    descriptionEn: 'Authentic passing emergency siren for urgent announcements and auto care',
    icon: '🚨',
    soundFile: '/sfx/emergency_siren.ogg',
    defaultVolume: 0.8,
    durationEstimate: 2.8,
  },

  // 👏 Crowd & Events (Κοινό & Ατμόσφαιρα)
  {
    id: 'applause',
    labelEl: 'Χειροκρότημα Studio (Studio Applause)',
    labelEn: 'Studio Audience Applause & Ovations',
    tagEl: '[SFX: Χειροκρότημα studio applause]',
    tagEn: '[SFX: Studio applause]',
    category: 'Crowd & Events',
    descriptionEl: 'Πραγματικό θερμό χειροκρότημα κοινού για επιτυχίες, βραβεία & παρουσιάσεις',
    descriptionEn: 'Real warm studio audience clapping and cheering for winning presentations',
    icon: '👏',
    soundFile: '/sfx/applause.ogg',
    defaultVolume: 0.9,
    durationEstimate: 2.6,
  },
  {
    id: 'crowd_cheer',
    labelEl: 'Επευφημίες Γηπέδου (Stadium Cheer)',
    labelEn: 'Stadium Crowd Team Cheer',
    tagEl: '[SFX: Επευφημίες κοινού]',
    tagEn: '[SFX: Stadium crowd cheer]',
    category: 'Crowd & Events',
    descriptionEl: 'Βροντερές ζητωκραυγές πλήθους για αθλητικά γεγονότα, συναυλίες & νίκες',
    descriptionEn: 'Roaring sports stadium crowd cheering for matches, tournaments & winners',
    icon: '🏟️',
    soundFile: '/sfx/team_cheer.ogg',
    defaultVolume: 0.85,
    durationEstimate: 2.8,
  },
  {
    id: 'coffee_shop',
    labelEl: 'Ατμόσφαιρα Καφέ / Bistro (Ambience)',
    labelEn: 'Urban Café & Coffee Shop Ambience',
    tagEl: '[SFX: Ατμόσφαιρα καφέ coffee shop]',
    tagEn: '[SFX: Coffee shop background ambience]',
    category: 'Crowd & Events',
    descriptionEl: 'Ζεστή ατμόσφαιρα καφετέριας με διακριτική ομιλία & φλιτζάνια για εστίαση',
    descriptionEn: 'Warm acoustic café background chatter and ceramic cups for dining ads',
    icon: '☕',
    soundFile: '/sfx/coffee_shop.ogg',
    defaultVolume: 0.75,
    durationEstimate: 3.0,
  },

  // 📱 Office & Tech (Γραφείο & Τεχνολογία)
  {
    id: 'camera_click',
    labelEl: 'Κλικ Φωτογραφικής (Camera Shutter)',
    labelEn: 'DSLR Camera Shutter & Mirror Snap',
    tagEl: '[SFX: Κλικ φωτογραφικής μηχανής]',
    tagEn: '[SFX: Camera shutter click]',
    category: 'Office & Tech',
    descriptionEl: 'Πραγματικό μηχανικό κλείστρο κάμερας Canon για μόδα, τουρισμό & εκδηλώσεις',
    descriptionEn: 'Authentic Canon DSLR mechanical mirror flip and shutter snap',
    icon: '📷',
    soundFile: '/sfx/camera_shutter.ogg',
    defaultVolume: 0.9,
    durationEstimate: 1.2,
  },
  {
    id: 'typing_keyboard',
    labelEl: 'Πληκτρολόγηση (Keyboard Typing)',
    labelEn: 'Mechanical Keyboard Typing Clicks',
    tagEl: '[SFX: Πληκτρολόγηση keyboard]',
    tagEn: '[SFX: Keyboard typing clicks]',
    category: 'Office & Tech',
    descriptionEl: 'Ρυθμικό κλικ-κλακ πληκτρολογίου για software, e-shop, γραφείο & tech',
    descriptionEn: 'Rapid tactile mechanical key clicks for tech, online shopping & office ads',
    icon: '⌨️',
    soundFile: '/sfx/computer_typing.ogg',
    defaultVolume: 0.85,
    durationEstimate: 1.8,
  },
  {
    id: 'button_push',
    labelEl: 'Κλικ Διακόπτη / Push Button',
    labelEn: 'Electronic Button Click / Switch',
    tagEl: '[SFX: Κλικ διακόπτη button push]',
    tagEn: '[SFX: Electronic button push]',
    category: 'Office & Tech',
    descriptionEl: 'Καθαρό ψηφιακό κλικ διακόπτη on/off για συσκευές & αυτοματισμούς',
    descriptionEn: 'Clean tactile push button click for gadgets, appliances & smart tech',
    icon: '🔘',
    soundFile: '/sfx/button_push.ogg',
    defaultVolume: 0.9,
    durationEstimate: 0.8,
  },
  {
    id: 'record_scratch',
    labelEl: 'DJ Record Scratch (Vinyl Stop)',
    labelEn: 'DJ Vinyl Record Scratch Stop',
    tagEl: '[SFX: DJ record scratch]',
    tagEn: '[SFX: DJ record scratch]',
    category: 'Office & Tech',
    descriptionEl: 'Απότομο σκρατς βινυλίου για ξαφνική ανατροπή, χιούμορ και αλλαγή σκηνής',
    descriptionEn: 'Sudden needle backspin scratch for comedic pauses and plot twists',
    icon: '💿',
    soundFile: '/sfx/car_screech.ogg', // or procedural scratch
    defaultVolume: 0.9,
    durationEstimate: 1.2,
  },

  // ⚡ Nature & Weather (Φύση & Καιρός)
  {
    id: 'thunder_storm',
    labelEl: 'Κεραυνός & Βροντή (Thunder Crack)',
    labelEn: 'Thunder & Lightning Strike',
    tagEl: '[SFX: Βροντή κεραυνού thunder]',
    tagEn: '[SFX: Thunder crack]',
    category: 'Nature & Weather',
    descriptionEl: 'Εκκωφαντικός κεραυνός και κυλιόμενη βροντή για ανακοινώσεις-κεραυνός',
    descriptionEn: 'Cracking lightning strike and deep rolling thunder for dramatic impact',
    icon: '⚡',
    soundFile: '/sfx/thunder_crack.ogg',
    defaultVolume: 0.9,
    durationEstimate: 2.2,
  },
  {
    id: 'distant_thunder',
    labelEl: 'Μακρινή Βροντή (Rolling Thunder)',
    labelEn: 'Distant Rolling Thunder',
    tagEl: '[SFX: Μακρινή βροντή distant thunder]',
    tagEn: '[SFX: Distant rolling thunder]',
    category: 'Nature & Weather',
    descriptionEl: 'Υπόκωφο μακρινό μουγκρητό βροντής για ατμόσφαιρα και προετοιμασία',
    descriptionEn: 'Deep low rolling atmospheric thunder for weather & seasonal promos',
    icon: '🌩️',
    soundFile: '/sfx/distant_thunder.ogg',
    defaultVolume: 0.85,
    durationEstimate: 2.6,
  },
  {
    id: 'heavy_rain',
    labelEl: 'Δυνατή Βροχή (Heavy Rainstorm)',
    labelEn: 'Heavy Rainstorm & Downpour',
    tagEl: '[SFX: Δυνατή βροχή heavy rain]',
    tagEn: '[SFX: Heavy rainstorm]',
    category: 'Nature & Weather',
    descriptionEl: 'Φυσική βροχόπτωση σε στέγη/άσφαλτο για χειμερινές προσφορές & θαλπωρή',
    descriptionEn: 'Atmospheric heavy rain downpour for heating, cozy home & winter deals',
    icon: '🌧️',
    soundFile: '/sfx/heavy_rain.ogg',
    defaultVolume: 0.8,
    durationEstimate: 3.0,
  },

  // 🎪 Cartoon & Comedy (Κωμικά & Κινούμενα Σχέδια)
  {
    id: 'cartoon_boing',
    labelEl: 'Κωμικό Ελατήριο (Cartoon Boing)',
    labelEn: 'Comic Bouncing Spring (Boing)',
    tagEl: '[SFX: Κωμικό ελατήριο cartoon boing]',
    tagEn: '[SFX: Cartoon bouncing spring]',
    category: 'Cartoon & Comedy',
    descriptionEl: 'Κλασικό καρτούν ελατήριο για αναπήδηση, παιχνίδια & χιουμοριστικά σποτ',
    descriptionEn: 'Classic animated comic spring bounce for playful, toy and comedy spots',
    icon: '🌀',
    soundFile: '/sfx/cartoon_boing.ogg',
    defaultVolume: 0.9,
    durationEstimate: 1.0,
  },
  {
    id: 'slide_whistle',
    labelEl: 'Σφυρίχτρα Slide Whistle',
    labelEn: 'Comedy Slide Whistle (Up & Down)',
    tagEl: '[SFX: Σφυρίχτρα slide whistle]',
    tagEn: '[SFX: Comedy slide whistle]',
    category: 'Cartoon & Comedy',
    descriptionEl: 'Παιχνιδιάρικη αυξομείωση τόνου για τιμές που κατεβαίνουν ή εκπλήξεις',
    descriptionEn: 'Ascending and descending musical slide whistle for playful price drops',
    icon: '🎵',
    soundFile: '/sfx/slide_whistle.ogg',
    defaultVolume: 0.9,
    durationEstimate: 1.4,
  },
  {
    id: 'cartoon_cowbell',
    labelEl: 'Κωμικό Κουδούνι (Comedy Cowbell)',
    labelEn: 'Cartoon Percussion Cowbell',
    tagEl: '[SFX: Κωμικό κουδούνι cowbell]',
    tagEn: '[SFX: Comedy cowbell]',
    category: 'Cartoon & Comedy',
    descriptionEl: 'Ρυθμικό καρτούν cowbell για κωμικό τόνο, αστείες ατάκες και ρυθμό',
    descriptionEn: 'Percussive comical cowbell tap for humorous punchlines and funny pauses',
    icon: '🔔',
    soundFile: '/sfx/cartoon_cowbell.ogg',
    defaultVolume: 0.85,
    durationEstimate: 1.1,
  },
  {
    id: 'clown_horn',
    labelEl: 'Κόρνα Κλόουν (Clown Horn Honk)',
    labelEn: 'Clown Squeeze Horn Honk',
    tagEl: '[SFX: Κόρνα κλόουν clown horn]',
    tagEn: '[SFX: Clown squeeze horn]',
    category: 'Cartoon & Comedy',
    descriptionEl: 'Αστείο διπλό κορνάρισμα με squeeze bulb για παιδικά πάρτι & γέλιο',
    descriptionEn: 'Funny rubber squeeze bulb clown horn honk for kid promos & comedy',
    icon: '🤡',
    soundFile: '/sfx/clown_horn.ogg',
    defaultVolume: 0.9,
    durationEstimate: 1.2,
  },
];

// In-memory audio buffer cache (stores decoded PCM buffers for 0ms reuse)
const sfxBufferCache = new Map<string, AudioBuffer>();

/**
 * Loads authentic studio audio file for the given SFXType, decodes it, scales volume, and returns AudioBuffer.
 * Falls back to high-grade procedural audio synthesis if network or decoding encounters an error.
 */
export async function renderSFXBuffer(
  ctx: BaseAudioContext,
  type: SFXType,
  volume: number = 1.0,
  maxDuration?: number
): Promise<AudioBuffer> {
  const sfxDef = AVAILABLE_SFX.find((s) => s.id === type) || AVAILABLE_SFX[0];
  const soundFile = sfxDef.soundFile;
  const effectiveVolume = Math.max(0.0, Math.min(2.0, volume * (sfxDef.defaultVolume || 1.0)));

  // Try loading real recorded audio file
  if (soundFile) {
    try {
      const cacheKey = `${type}_raw`;
      let rawBuffer = sfxBufferCache.get(cacheKey);

      if (!rawBuffer) {
        // Fetch audio file from local /sfx route
        const res = await fetch(soundFile);
        if (!res.ok) {
          throw new Error(`SFX HTTP ${res.status} for ${soundFile}`);
        }
        const arrayBuf = await res.arrayBuffer();

        // Decode audio data using audio context
        rawBuffer = await ctx.decodeAudioData(arrayBuf);
        sfxBufferCache.set(cacheKey, rawBuffer);
      }

      // Determine output length (trimmed if maxDuration is specified)
      const targetDuration = maxDuration
        ? Math.min(rawBuffer.duration, maxDuration)
        : rawBuffer.duration;
      const numSamples = Math.floor(targetDuration * ctx.sampleRate);

      const scaledBuffer = ctx.createBuffer(
        Math.min(2, rawBuffer.numberOfChannels),
        numSamples,
        ctx.sampleRate
      );

      for (let ch = 0; ch < scaledBuffer.numberOfChannels; ch++) {
        const rawChannel = rawBuffer.getChannelData(Math.min(ch, rawBuffer.numberOfChannels - 1));
        const outChannel = scaledBuffer.getChannelData(ch);
        const len = Math.min(numSamples, rawChannel.length);

        for (let i = 0; i < len; i++) {
          outChannel[i] = rawChannel[i] * effectiveVolume;
        }

        // Apply smooth fade-out at the end to prevent digital pops
        const fadeSamples = Math.min(len, Math.floor(ctx.sampleRate * 0.05));
        for (let i = 0; i < fadeSamples; i++) {
          const fadePos = len - fadeSamples + i;
          if (fadePos < len) {
            const factor = 1 - i / fadeSamples;
            outChannel[fadePos] *= factor;
          }
        }
      }

      return scaledBuffer;
    } catch (err) {
      console.warn(`[SFX Engine] Could not load audio asset for "${type}", using procedural synthesis fallback:`, err);
    }
  }

  // Graceful fallback: Procedural synthesis
  return synthesizeProceduralSFX(ctx, type, effectiveVolume);
}

/**
 * Procedural synthesis fallback (ensures audio is ALWAYS produced even in offline edge cases)
 */
function synthesizeProceduralSFX(
  ctx: BaseAudioContext,
  type: SFXType,
  volume: number = 1.0
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 1.4;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, numSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let s = 0;

    if (type === 'cash_register') {
      const bell = Math.sin(2 * Math.PI * 2540 * t) * Math.exp(-t * 5.0) * 0.5;
      const coins = (Math.random() * 2 - 1) * Math.exp(-t * 12.0) * 0.25;
      s = bell + coins;
    } else if (type === 'doorbell') {
      const f = t < 0.4 ? 659.25 : 523.25;
      const dt = t < 0.4 ? t : t - 0.4;
      s = Math.sin(2 * Math.PI * f * dt) * Math.exp(-dt * 4.0) * 0.6;
    } else if (type === 'car_horn') {
      const f1 = 370;
      const f2 = 466;
      s = (Math.sin(2 * Math.PI * f1 * t) + Math.sin(2 * Math.PI * f2 * t)) * 0.35;
    } else {
      // General resonant chime fallback
      s = Math.sin(2 * Math.PI * 1200 * t) * Math.exp(-t * 4.0) * 0.5;
    }

    left[i] = s * volume;
    right[i] = s * volume;
  }

  return buffer;
}

// Global active audition source tracker (allows stopping / pausing audition anytime)
let activeAuditionSource: AudioBufferSourceNode | null = null;
let activeAuditionContext: AudioContext | null = null;

/**
 * Auditions / previews an SFX immediately in the browser with real volume control.
 * Stops any previously playing audition preview first.
 */
export async function auditionSFX(
  type: SFXType,
  volume: number = 1.0,
  onEnded?: () => void
): Promise<void> {
  stopAudition();

  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    activeAuditionContext = audioCtx;

    const buffer = await renderSFXBuffer(audioCtx, type, volume);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const gain = audioCtx.createGain();
    gain.gain.value = Math.max(0, Math.min(2.0, volume));

    source.connect(gain);
    gain.connect(audioCtx.destination);

    source.onended = () => {
      if (activeAuditionSource === source) {
        activeAuditionSource = null;
      }
      onEnded?.();
    };

    activeAuditionSource = source;
    source.start(0);
  } catch (err) {
    console.warn('Failed to audition SFX:', err);
    onEnded?.();
  }
}

/**
 * Stops any currently playing SFX preview immediately
 */
export function stopAudition(): void {
  if (activeAuditionSource) {
    try {
      activeAuditionSource.stop();
      activeAuditionSource.disconnect();
    } catch {
      // Ignored if already stopped
    }
    activeAuditionSource = null;
  }
  if (activeAuditionContext && activeAuditionContext.state !== 'closed') {
    try {
      activeAuditionContext.close();
    } catch {
      // Ignored
    }
    activeAuditionContext = null;
  }
}
