export interface SFXOption {
  id: SFXType;
  name: string;
  category: string;
  description: string;
  tags: string[];
  filename: string;
}

export const AVAILABLE_SFX: SFXOption[] = [
  // Retail & Sales
  { id: 'cash_register', name: 'Ταμειακή Μηχανή', category: 'Retail & Sales', description: 'Ήχος ταμειακής μηχανής cha-ching', tags: ['retail', 'sales', 'ταμείο'], filename: 'cash_register.ogg' },
  { id: 'coins_shuffling', name: 'Κέρματα & Χαρτονομίσματα', category: 'Retail & Sales', description: 'Ήχος κερμάτων', tags: ['coins', 'money', 'κέρματα'], filename: 'coins_shuffling.ogg' },
  { id: 'glass_toast', name: 'Τσούγκρισμα Ποτηριών', category: 'Retail & Sales', description: 'Τσούγκρισμα ποτηριών cheers', tags: ['toast', 'cheers', 'ποτήρια'], filename: 'glass_toast.ogg' },
  { id: 'champagne_cork', name: 'Φελλός Σαμπάνιας', category: 'Retail & Sales', description: 'Άνοιγμα σαμπάνιας', tags: ['champagne', 'celebration', 'σαμπάνια'], filename: 'pop_bubble.ogg' },

  // Alerts & Bells
  { id: 'bell_chime', name: 'Καμπανάκι / Chime', category: 'Alerts & Bells', description: 'Κρυστάλλινο καμπανάκι', tags: ['bell', 'chime', 'κουδούνι'], filename: 'medium_bell_ringing.ogg' },
  { id: 'doorbell', name: 'Κουδούνι Εξώπορτας', category: 'Alerts & Bells', description: 'Κουδούνι πόρτας ding-dong', tags: ['doorbell', 'ding-dong', 'πόρτα'], filename: 'doorbell.ogg' },
  { id: 'creaking_door', name: 'Παλιά Πόρτα (Τρίξιμο)', category: 'Alerts & Bells', description: 'Τρίξιμο παλιάς πόρτας', tags: ['door', 'creak', 'πόρτα'], filename: 'creaking_door.ogg' },
  { id: 'sliding_glass_door', name: 'Συρόμενη Τζαμαρία', category: 'Alerts & Bells', description: 'Συρόμενη πόρτα', tags: ['sliding', 'door', 'τζαμαρία'], filename: 'sliding_glass_door.ogg' },
  { id: 'wood_door', name: 'Ξύλινη Πόρτα', category: 'Alerts & Bells', description: 'Κλείσιμο ξύλινης πόρτας', tags: ['wood', 'door', 'πόρτα'], filename: 'wood_door.ogg' },
  { id: 'cell_phone_vibrate', name: 'Δόνηση Κινητού', category: 'Alerts & Bells', description: 'Δόνηση smartphone', tags: ['phone', 'vibrate', 'κινητό'], filename: 'cell_phone_vibrate.ogg' },
  { id: 'phone_alerts', name: 'Ήχος Κλήσης', category: 'Alerts & Bells', description: 'Μελωδικός ήχος κλήσης', tags: ['phone', 'alert', 'κλήση'], filename: 'phone_alerts.ogg' },
  { id: 'phone_ring', name: 'Τηλεφωνικός Ήχος', category: 'Alerts & Bells', description: 'Κλασικό τηλέφωνο', tags: ['phone', 'ring', 'τηλέφωνο'], filename: 'phone_ring.ogg' },
  { id: 'pop_notification', name: 'Ειδοποίηση Pop', category: 'Alerts & Bells', description: 'Ήχος bubble notification', tags: ['pop', 'notification', 'ειδοποίηση'], filename: 'pop_bubble.ogg' },
  { id: 'dinner_bell', name: 'Τρίγωνο / Reception', category: 'Alerts & Bells', description: 'Κουδούνι ρεσεψιόν', tags: ['bell', 'dinner', 'reception'], filename: 'dinner_bell.ogg' },
  { id: 'digital_watch_alarm', name: 'Ψηφιακό Χρονόμετρο', category: 'Alerts & Bells', description: 'Ψηφιακό μπιπ χρονομέτρου', tags: ['watch', 'alarm', 'χρονόμετρο'], filename: 'digital_watch_alarm.ogg' },
  { id: 'alarm_clock', name: 'Ξυπνητήρι', category: 'Alerts & Bells', description: 'Κλασικό ξυπνητήρι', tags: ['alarm', 'clock', 'ξυπνητήρι'], filename: 'alarm_clock.ogg' },
  { id: 'clock_ticking', name: 'Τικ-Τακ Ρολογιού', category: 'Alerts & Bells', description: 'Συνεχές τικ-τακ', tags: ['clock', 'tick', 'ρολόι'], filename: 'clock_ticking.ogg' },
  { id: 'bugle_tune', name: 'Σάλπισμα / Fanfare', category: 'Alerts & Bells', description: 'Στρατιωτικό σάλπισμα εγερτηρίου', tags: ['bugle', 'fanfare', 'σάλπισμα'], filename: 'bugle_tune.ogg' },
  { id: 'radio_beep', name: 'Σήμα Ώρας / Beep', category: 'Alerts & Bells', description: 'Ραδιοφωνικό pips σήμα ώρας', tags: ['radio', 'beep', 'σήμα'], filename: 'radio_beep.ogg' },

  // Cinematic & Impacts
  { id: 'whoosh', name: 'Whoosh Μετάβασης', category: 'Cinematic & Impacts', description: 'Γρήγορο πέρασμα αέρα transition', tags: ['whoosh', 'transition', 'μετάβαση'], filename: 'whoosh_swoosh.ogg' },
  { id: 'cinematic_sweep', name: 'Κλιμάκωση / Riser', category: 'Cinematic & Impacts', description: 'Ανοδικό cinematic sweep', tags: ['riser', 'sweep', 'κλιμάκωση'], filename: 'cinematic_sweep.ogg' },
  { id: 'cinematic_suspense', name: 'Αγωνία / Drone', category: 'Cinematic & Impacts', description: 'Υποβλητικό drone αγωνίας', tags: ['suspense', 'drone', 'αγωνία'], filename: 'cinematic_suspense.ogg' },
  { id: 'sub_impact', name: 'Sub Boom / 808', category: 'Cinematic & Impacts', description: 'Βαρύ βαθύ sub boom', tags: ['sub', 'impact', 'boom'], filename: 'sub_impact.ogg' },
  { id: 'glass_breaking', name: 'Σπάσιμο Τζαμιού', category: 'Cinematic & Impacts', description: 'Θρυμματισμός γυαλιού', tags: ['glass', 'break', 'γυαλί'], filename: 'glass_breaking.ogg' },
  { id: 'body_punch', name: 'Χτύπημα / Punch', category: 'Cinematic & Impacts', description: 'Δυνατή γροθιά action hit', tags: ['punch', 'hit', 'χτύπημα'], filename: 'body_punch.ogg' },
  { id: 'wood_impact', name: 'Χτύπημα σε Ξύλο', category: 'Cinematic & Impacts', description: 'Χτύπημα σε ξύλινη επιφάνεια', tags: ['wood', 'hit', 'ξύλο'], filename: 'wood_impact.ogg' },
  { id: 'impact_crash', name: 'Σύγκρουση / Crash', category: 'Cinematic & Impacts', description: 'Δυνατή σύγκρουση', tags: ['crash', 'impact', 'σύγκρουση'], filename: 'impact_crash.ogg' },
  { id: 'magic_sparkle', name: 'Μαγική Αστερόσκονη', category: 'Cinematic & Impacts', description: 'Μαγικός λαμπερός ήχος sparkle', tags: ['magic', 'sparkle', 'μαγεία'], filename: 'magic_sparkle.ogg' },
  { id: 'wind_chimes', name: 'Ανεμοκουδούνια', category: 'Cinematic & Impacts', description: 'Ήχος chimes στον άνεμο', tags: ['chimes', 'wind', 'άνεμος'], filename: 'wind_chimes.ogg' },

  // Vehicles & City
  { id: 'car_screech', name: 'Φρενάρισμα Αυτοκινήτου', category: 'Vehicles & City', description: 'Έντονο στρίγγλισμα ελαστικών', tags: ['car', 'brake', 'φρένα'], filename: 'car_screech.ogg' },
  { id: 'car_horn', name: 'Κόρνα Αυτοκινήτου', category: 'Vehicles & City', description: 'Κόρνα επιβατικού οχήματος', tags: ['car', 'horn', 'κόρνα'], filename: 'car_horn.ogg' },
  { id: 'air_horn', name: 'Κόρνα DJ / Stadium', category: 'Vehicles & City', description: 'Κόρνα γηπέδου stadium blast', tags: ['airhorn', 'stadium', 'dj'], filename: 'air_horn.ogg' },
  { id: 'emergency_siren', name: 'Σειρήνα', category: 'Vehicles & City', description: 'Σειρήνα άμεσης δράσης', tags: ['siren', 'emergency', 'σειρήνα'], filename: 'emergency_siren.ogg' },

  // Crowd & Events
  { id: 'applause', name: 'Χειροκρότημα', category: 'Crowd & Events', description: 'Θερμό χειροκρότημα κοινού', tags: ['applause', 'clapping', 'χειροκρότημα'], filename: 'applause.ogg' },
  { id: 'crowd_cheer', name: 'Επευφημίες Κοινού', category: 'Crowd & Events', description: 'Ζητωκραυγές γηπέδου / κοινού', tags: ['crowd', 'cheer', 'κοινό'], filename: 'crowd_cheer.ogg' },
  { id: 'coffee_shop', name: 'Ατμόσφαιρα Καφέ', category: 'Crowd & Events', description: 'Ήχοι καφετέριας & chatter', tags: ['coffee', 'ambience', 'καφέ'], filename: 'coffee_shop.ogg' },

  // Office & Tech
  { id: 'camera_click', name: 'Κλικ Φωτογραφικής', category: 'Office & Tech', description: 'Κλικ κλείστρου φωτογραφικής μηχανής', tags: ['camera', 'click', 'κάμερα'], filename: 'camera_click.ogg' },
  { id: 'typing_keyboard', name: 'Πληκτρολόγιο', category: 'Office & Tech', description: 'Πληκτρολόγηση σε μηχανικό πληκτρολόγιο', tags: ['typing', 'keyboard', 'πληκτρολόγιο'], filename: 'typing_keyboard.ogg' },
  { id: 'button_push', name: 'Πάτημα Διακόπτη', category: 'Office & Tech', description: 'Κλικ ηλεκτρικού διακόπτη', tags: ['button', 'switch', 'κουμπί'], filename: 'button_push.ogg' },
  { id: 'record_scratch', name: 'Σκρατς Βινυλίου', category: 'Office & Tech', description: 'Απότομο σταμάτημα/σκρατς βινυλίου', tags: ['scratch', 'vinyl', 'βινύλιο'], filename: 'record_scratch.ogg' },

  // Nature & Weather
  { id: 'heavy_rain', name: 'Δυνατή Βροχή', category: 'Nature & Weather', description: 'Ήχος καταιγίδας & καταρρακτώδους βροχής', tags: ['rain', 'weather', 'βροχή'], filename: 'heavy_rain.ogg' },
  { id: 'distant_thunder', name: 'Μακρινή Βροντή', category: 'Nature & Weather', description: 'Μακρινό υπόκωφο μπουμπουνητό', tags: ['thunder', 'weather', 'βροντή'], filename: 'distant_thunder.ogg' },
  { id: 'thunder_storm', name: 'Κεραυνός & Καταιγίδα', category: 'Nature & Weather', description: 'Δυνατός κεραυνός με ωστικό κύμα', tags: ['thunder', 'storm', 'κεραυνός'], filename: 'thunder_crack.ogg' },

  // Cartoon & Comedy
  { id: 'cartoon_boing', name: 'Ελατήριο Boing', category: 'Cartoon & Comedy', description: 'Κωμικό ελατήριο boing', tags: ['cartoon', 'boing', 'ελατήριο'], filename: 'cartoon_boing.ogg' },
  { id: 'slide_whistle', name: 'Σφυρίχτρα Slide', category: 'Cartoon & Comedy', description: 'Ανοδική/καθοδική κωμική σφυρίχτρα', tags: ['whistle', 'slide', 'σφυρίχτρα'], filename: 'slide_whistle.ogg' },
  { id: 'cartoon_cowbell', name: 'Κωμικό Κουδούνι', category: 'Cartoon & Comedy', description: 'Κουδούνι slapstick', tags: ['cowbell', 'comedy', 'κουδούνι'], filename: 'cartoon_cowbell.ogg' },
  { id: 'clown_horn', name: 'Κόρνα Κλόουν', category: 'Cartoon & Comedy', description: 'Διπλό honk κλόουν', tags: ['horn', 'clown', 'κόρνα'], filename: 'clown_horn.ogg' },
];