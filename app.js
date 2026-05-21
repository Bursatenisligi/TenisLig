var returnToTab = null; 
let currentLeaderboardMode = 'Tekler';

document.addEventListener('DOMContentLoaded', function() {
    // --- FIREBASE BAŞLATMA ---
    const firebaseConfig = {
        apiKey: "AIzaSyCdrG3likzeKwv1YcMZe-9FAiaQxJoYMO8",
        authDomain: "tenisligi-4672a.firebaseapp.com",
        projectId: "tenisligi-4672a",
        storageBucket: "tenisligi-4672a.firebasestorage.app",
        messagingSenderId: "380772240660",
        appId: "1:380772240660:web:39186d8fee6ff35d0c8601"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const auth = firebase.auth();
    const db = firebase.firestore();

    const adMatchFormat = document.getElementById('ad-match-format');
    const adPartnerContainer = document.getElementById('ad-partner-container');
    const adPartnerSelect = document.getElementById('ad-partner-select');

    const challengeMatchFormat = document.getElementById('challenge-match-format');
    const challengePartnerContainer = document.getElementById('challenge-partner-container');
    const challengePartnerSelect = document.getElementById('challenge-partner-select');
    

    
// --- YENİ: AKILLI TURNUVA FORMU GİZLE/GÖSTER MOTORU ---
    const formatSel = document.getElementById('tour-format');
    const systemSel = document.getElementById('tour-system');
    const regTypeSel = document.getElementById('tour-reg-type');
    const leagueDurSel = document.getElementById('tour-league-duration');
    const leagueTeamTypeSel = document.getElementById('tour-league-team-type');
    const autoTypeSel = document.getElementById('tour-auto-type');
    
    function updateTourFormUI() {
        if(!formatSel || !systemSel || !regTypeSel) return;
        const isDoubles = !formatSel.value.includes('Tekler');
        const isAuto = regTypeSel.value === 'auto';
        const isLeague = systemSel.value === 'league';
        const autoType = autoTypeSel ? autoTypeSel.value : 'balanced';

        document.getElementById('doubles-options').style.display = isDoubles ? 'block' : 'none';
        document.getElementById('auto-options').style.display = (isDoubles && isAuto) ? 'block' : 'none';
        document.getElementById('league-options').style.display = isLeague ? 'block' : 'none';
        
        if (isLeague) {
            const isCustomWeeks = leagueDurSel && leagueDurSel.value === 'custom_weeks';
            document.getElementById('league-custom-weeks-container').style.display = isCustomWeeks ? 'block' : 'none';
            
            // Eğer çiftler ve otomatik eşleşme ise (sadece Belirli Hafta seçiliyse) Takım Yapısını sor
            const showTeamType = isDoubles && isAuto && isCustomWeeks;
            document.getElementById('league-team-type-container').style.display = showTeamType ? 'block' : 'none';
            
            // KURAL: Eğer Otomatik "Denk Eşleşme" seçildiyse, takımlar her hafta karıştırılamaz!
            if (showTeamType && leagueTeamTypeSel) {
                const teamOptions = leagueTeamTypeSel.options;
                for (let i = 0; i < teamOptions.length; i++) {
                    if (teamOptions[i].value === 'changing') {
                        if (isAuto && autoType === 'balanced') {
                            teamOptions[i].disabled = true;
                            if (leagueTeamTypeSel.value === 'changing') leagueTeamTypeSel.value = 'fixed'; // Zorla sabite çek
                            teamOptions[i].text = "Her Hafta Karıştırılsın (Denk eşleşmede kapalı)";
                        } else {
                            teamOptions[i].disabled = false;
                            teamOptions[i].text = "Takımlar Her Hafta Yeniden Karıştırılsın (Mix-in)";
                        }
                    }
                }
            }
            
            const teamType = showTeamType ? leagueTeamTypeSel.value : 'fixed';
            
            // Puan tablosu: Çiftlerse ve takımlar sabitse sor. Her hafta değişiyorsa sorma, direkt kişi bazlı yap.
            const showStandings = isDoubles && teamType === 'fixed';
            document.getElementById('league-standings-container').style.display = showStandings ? 'block' : 'none';
        }
    }

    if (formatSel) formatSel.addEventListener('change', updateTourFormUI);
    if (systemSel) systemSel.addEventListener('change', updateTourFormUI);
    if (regTypeSel) regTypeSel.addEventListener('change', updateTourFormUI);
    if (leagueDurSel) leagueDurSel.addEventListener('change', updateTourFormUI);
    if (leagueTeamTypeSel) leagueTeamTypeSel.addEventListener('change', updateTourFormUI);
    if (autoTypeSel) autoTypeSel.addEventListener('change', updateTourFormUI);
    setTimeout(updateTourFormUI, 500);

   
    
    // --- KORT LİSTESİ ---
    const COURT_LIST = [
        "Meşelipark Tenis Kulübü", "Evrensel Tenis", "Esas Tenis ve Spor Kulübü", "Podyum Tenis",
        "Bursa Yenigün Tenis Kortu", "Hüdavendigar Spor Tesisleri", "Yenigün Tenis Akademi",
        "Ertuğrul Sağlam Tenis Kortları", "Altınşehir Gençlik Merkezi", "Nilüfer Hobi Bahçeleri Tenis Sahası",
        "Gd Academy Bursa", "Uni+ Sport Club Tenis Kortları", "Aslanlar Tenis Akademisi", "Ferdi / Bağımsız"    
    ];

    // --- YARDIMCI: GÜVENLİ AVATAR OLUŞTURUCU (CORS HATASINI ÖNLER) ---
    function getSafeAvatar(text) {
        const colors = ['#f44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#009688', '#4CAF50', '#FF9800', '#FF5722', '#795548', '#607D8B'];
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = text.charCodeAt(i) + ((hash << 5) - hash);
        }
        const color = colors[Math.abs(hash) % colors.length];
        const initials = text.split(" ").map((n)=>n[0]).join("").substring(0,2).toUpperCase();

        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
          <rect width="100" height="100" fill="${color}" />
          <text x="50" y="50" font-family="Arial, sans-serif" font-weight="bold" font-size="40" fill="white" text-anchor="middle" dy=".35em">${initials}</text>
        </svg>`;
        return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
    }

    // YENİ: Tenis tecrübesi hesaplama fonksiyonu
    function calculateTennisDuration(startDateStr) {
        if (!startDateStr) return '';
        const start = new Date(startDateStr);
        const now = new Date();
        let years = now.getFullYear() - start.getFullYear();
        let months = now.getMonth() - start.getMonth();
        if (months < 0) { years--; months += 12; }
        
        let result = [];
        if (years > 0) result.push(`${years} Yıl`);
        if (months > 0) result.push(`${months} Ay`);
        
        if (result.length === 0) return "Yeni Başladı";
        return result.join(" ") + "dır oynuyor";
    }

    // --- YARDIMCI: TUTARLI SEÇİCİ (SEEDED RANDOM) ---
    function pickConsistent(arr, seed) {
        if (!arr || arr.length === 0) return "";
        let hash = 0;
        for (let i = 0; i < seed.length; i++) { hash = seed.charCodeAt(i) + ((hash << 5) - hash); }
        const index = Math.abs(hash) % arr.length;
        return arr[index];
    }

    // Dropdownları doldurma fonksiyonu
    function populateClubDropdowns() {
        const selects = ['register-club', 'edit-club', 'leaderboard-club-filter'];
        selects.forEach(id => {
            const el = document.getElementById(id);
            if(!el) return;
            COURT_LIST.forEach(court => {
                const opt = document.createElement('option');
                opt.value = court; opt.textContent = court;
                el.appendChild(opt);
            });
        });
    }
    populateClubDropdowns();

    // --- GOOGLE APPS SCRIPT İLE MAİL GÖNDERME ---
    const MAIL_API_URL = "https://script.google.com/macros/s/AKfycby0ci4rioEQOyjqomWdy6iaqmvCzjcAGtZd08-b2OaoDeJkPO2E9gy9p1eDkZeRx0B5/exec"; 

// UYGULAMANIN YENİ LİNKİNİ BURAYA YAZ (Sonunda / olsun)
    const APP_URL = "https://bursatenisligi.github.io/TenisLig/"; 

    async function sendNotificationEmail(targetUserId, subject, messageHTML) {
        const targetUser = userMap[targetUserId];
        if (!targetUser) return;

        // Eski hardcoded linkleri ve "aşağıdaki linke tıkla" gibi dağınık cümleleri otomatik temizliyoruz
        let cleanMessage = messageHTML
            .replace(/<p>.*(aşağıdaki|hemen uygulamaya|Cevap vermek).*<\/p>/gi, '')
            .replace(/<p><a href="https:\/\/mehmetmuratyak\.github\.io.*<\/a><\/p>/gi, '')
            .replace(/<p>.*Uygulamaya Git.*<\/p>/gi, '');

        // Profesyonel, Düzenli Mail Şablonu (HTML Wrapper)
        const wrappedHTML = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                
                <div style="background: linear-gradient(135deg, #c06035 0%, #8d4020 100%); padding: 25px 20px; text-align: center;">
                    <h2 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">🎾 Tenis Ligi</h2>
                </div>
                
                <div style="padding: 30px 25px; font-size: 15px; line-height: 1.6; color: #444;">
                    <h3 style="color: #c06035; margin-top: 0; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">${subject}</h3>
                    
                    ${cleanMessage}
                    
                    <div style="text-align: center; margin-top: 35px; margin-bottom: 10px;">
                        <a href="${APP_URL}" style="background-color: #c06035; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 10px rgba(192, 96, 53, 0.3);">Uygulamayı Aç</a>
                    </div>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eaeaea;">
                    Bu mesaj <strong>Tenis Ligi</strong> sistemi tarafından otomatik olarak gönderilmiştir.<br>
                    Mailleri almak istemiyorsanız, uygulama içindeki "Profil" sekmesinden e-posta bildirimlerini kapatabilirsiniz.
                </div>
            </div>
        `;

        const plainText = cleanMessage.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().substring(0, 150);

        const requestData = {
            targetUserId: targetUserId,
            subject: subject,
            body: wrappedHTML,
            plainText: plainText
        };

        if (targetUser.email && targetUser.emailNotifications !== false) {
            requestData.to = targetUser.email;
        }

        try {
            await fetch(MAIL_API_URL, {
                method: "POST",
                mode: "no-cors", 
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(requestData)
            });
            console.log("İstek başarıyla Google Script'e yollandı.");
        } catch (error) {
            console.error("İstek gönderilirken hata oluştu:", error);
        }
    }

    // --- ROZET TANIMLARI ---
    const BADGE_DEFINITIONS = {
        'newbie': { icon: '🐣', name: 'Çaylak', desc: 'Ligdeki ilk maçına çıktın.' },
        'first_win': { icon: '🥇', name: 'İlk Kan', desc: 'Ligdeki ilk galibiyetini aldın.' },
        'hat_trick': { icon: '🔥', name: 'Alev Aldı', desc: 'Üst üste 3 galibiyet serisi.' },
        'unstoppable': { icon: '🚀', name: 'Durdurulamaz', desc: 'Üst üste 5 galibiyet serisi.' },
        'legend_streak': { icon: '🦁', name: 'Ligin Efsanesi', desc: 'Üst üste 10 galibiyet serisi.' },
        'clay_master': { icon: '🧱', name: 'Toprak Ağası', desc: 'Toprak kortta 5 galibiyet.' },
        'hard_hitter': { icon: '🟦', name: 'Beton Delen', desc: 'Sert kortta 5 galibiyet.' },
        'marathon': { icon: '🏃', name: 'Maratoncu', desc: '3 set süren zorlu bir maçı kazandın.' },
        'bagel_master': { icon: '🥯', name: 'Fırıncı', desc: 'Bir seti 6-0 kazandın.' },
        'comeback_kid': { icon: '🪃', name: 'Geri Dönüş', desc: 'İlk seti kaybedip maçı kazandın.' },
        'veteran': { icon: '👴', name: 'Tecrübeli', desc: 'Ligde 20 maç tamamladın.' },
        'champion': { icon: '👑', name: 'Şampiyon', desc: '3000 puana ulaştın.' }
    };

    const getPlayerLeague = (points) => {
        if (points >= 3000) return 'Altın';
        if (points >= 1000) return 'Gümüş';
        return 'Bronz';
    };

    const COMMENTARY_PARTS = {
        openers: ["Maç sonucu tescillendi.", "Kortlarda beklenen karşılaşma tamamlandı.", "Lig fikstüründeki kritik maç sonuçlandı.", "Mücadele sona erdi.", "Skor tabelası güncellendi.", "Son dakika skoru sisteme düştü.", "Karşılaşmanın galibi belirlendi.", "Zorlu mücadele neticelendi."],
        actions: {
            crushing: ["<strong>{winner}</strong>, rakibi karşısında net bir üstünlük kurarak maçı kazandı.", "<strong>{winner}</strong>, maç boyunca oyunun kontrolünü elinde tuttu.", "<strong>{winner}</strong>, disiplinli oyunuyla sonuca gitmekte zorlanmadı.", "Rakibine şans tanımayan <strong>{winner}</strong>, rahat bir galibiyet aldı."],
            tight: ["Büyük bir çekişmeye sahne olan maçta kazanan <strong>{winner}</strong> oldu.", "Kritik puanların belirleyici olduğu maçta <strong>{winner}</strong> hata yapmadı.", "Başa baş geçen mücadelede son sözü <strong>{winner}</strong> söyledi.", "İki oyuncunun da üst düzey performans sergilediği maçı <strong>{winner}</strong> kazandı."],
            comeback: ["Geriye düştüğü maçta oyunu bırakmayan <strong>{winner}</strong>, maçı çevirmeyi başardı.", "<strong>{winner}</strong>, ilk seti kaybetmesine rağmen disiplinden kopmayarak kazandı.", "Müthiş bir geri dönüşe imza atan <strong>{winner}</strong> sahadan galip ayrıldı."],
            normal: ["<strong>{winner}</strong>, istikrarlı oyunuyla galibiyete uzandı.", "Günün kazanan ismi <strong>{winner}</strong> oldu.", "<strong>{winner}</strong>, rakibi {loser} karşısında galip gelmeyi bildi.", "Maç sonunda gülen taraf <strong>{winner}</strong> oldu."]
        },
        details: ["Maç sonucu: {score}.", "Tescil edilen skor: {score}.", "Mücadele {score} skoruyla tamamlandı.", "Skor tabelası: {score}."],
        closings: ["Kazanan oyuncuyu tebrik ederiz.", "Lig sıralamasındaki dengeler değişebilir.", "Her iki oyuncu da fair-play ruhuyla mücadele etti.", "Bir sonraki maçlar merakla bekleniyor.", "Puanlar güncellendi."],
        ads: { challenge: ["📢 <strong>RESMİ MEYDAN OKUMA</strong>", "🔥 <strong>PUANLI MAÇ TEKLİFİ</strong>", "⚔️ <strong>REKABET ÇAĞRISI</strong>"], friendly: ["👋 <strong>HAZIRLIK MAÇI</strong>", "🎾 <strong>ANTRENMAN MAÇI</strong>", "🤝 <strong>DOSTLUK KARŞILAŞMASI</strong>"], wagerText: ["Ortadaki ödül: <strong>{wager} Puan</strong>.", "Kazanan <strong>{wager} puan</strong> alacak.", "Mücadele <strong>{wager} puan</strong> değerinde."] }
    };

    // --- DEĞİŞKENLER VE DOM ELEMENTLERİ ---
    let userMap = {}; let currentMatchDocId = null; let isLoginMode = true; let listeners = []; let isReadOnlyView = false; let currentChatId = null; let currentChatUnsubscribe = null; let matchInteractionListeners = []; 
    
    const authScreen = document.getElementById('auth-screen'); const mainApp = document.getElementById('main-app');
    const tabLoginSwitch = document.getElementById('tab-login-switch'); const tabRegisterSwitch = document.getElementById('tab-register-switch'); const registerFields = document.getElementById('register-fields'); const authActionBtn = document.getElementById('auth-action-btn'); const authError = document.getElementById('auth-error'); const loginFooterLinks = document.getElementById('login-footer-links');
    const emailInput = document.getElementById('email'); const passwordInput = document.getElementById('password'); const fullNameInput = document.getElementById('full-name'); const courtPreferenceSelect = document.getElementById('court-preference'); const profilePhotoInput = document.getElementById('profile-photo'); const profilePreview = document.getElementById('profile-preview');
    const forgotPasswordLink = document.getElementById('forgot-password-link'); const forgotPasswordModal = document.getElementById('forgot-password-modal'); const resetEmailInput = document.getElementById('reset-email'); const btnSendResetLink = document.getElementById('btn-send-reset-link'); const resetMsg = document.getElementById('reset-msg');
    const challengeForm = document.getElementById('challenge-form'); const createAdForm = document.getElementById('create-ad-form'); const opponentSelect = document.getElementById('opponent-select'); const matchTypeSelect = document.getElementById('match-type-select'); const wagerPointsInput = document.getElementById('wager-points'); const adMatchTypeSelect = document.getElementById('ad-match-type'); const adWagerPointsInput = document.getElementById('ad-wager-points'); const btnShowCreateAd = document.getElementById('btn-show-create-ad'); const btnShowSpecificChallenge = document.getElementById('btn-show-specific-challenge'); const submitChallengeBtn = document.getElementById('submit-challenge-btn'); const submitAdBtn = document.getElementById('submit-ad-btn');
    const openRequestsContainer = document.getElementById('lobby-requests-container'); const scheduledMatchesContainer = document.getElementById('lobby-scheduled-container'); const announcementsContainer = document.getElementById('lobby-announcements-container'); 
    const leaderboardDiv = document.getElementById('leaderboard'); const chatListContainer = document.getElementById('chat-list-container');
    const myActiveMatchesContainer = document.getElementById('my-active-matches-container'); const myPendingMatchesContainer = document.getElementById('my-pending-matches-container'); const myHistoryMatchesContainer = document.getElementById('my-history-matches-container');
    const histFilterStart = document.getElementById('hist-filter-start'); const histFilterEnd = document.getElementById('hist-filter-end'); const histFilterPlayerName = document.getElementById('hist-filter-player-name'); const histFilterCourt = document.getElementById('hist-filter-court'); const btnApplyHistoryFilter = document.getElementById('btn-apply-history-filter');
    const filtersContainer = document.getElementById('filters-container'); const filterDateStart = document.getElementById('filter-date-start'); const filterDateEnd = document.getElementById('filter-date-end'); const filterCourt = document.getElementById('filter-court'); const filterPlayer = document.getElementById('filter-player'); const applyFiltersBtn = document.getElementById('apply-filters-btn'); const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const fixtureActiveContainer = document.getElementById('fixture-active-container'); const fixturePendingContainer = document.getElementById('fixture-pending-container'); const fixtureHistoryContainer = document.getElementById('fixture-history-container');
    const bestsContainer = document.getElementById('bests-container'); const bestsFilterSelect = document.getElementById('bests-filter-select');
    const galleryGrid = document.getElementById('gallery-grid'); const galleryFilterDate = document.getElementById('gallery-filter-date'); const galleryFilterCourt = document.getElementById('gallery-filter-court'); const galleryFilterPlayer = document.getElementById('gallery-filter-player'); const btnGalleryFilter = document.getElementById('btn-gallery-filter'); const btnGalleryClear = document.getElementById('btn-gallery-clear');
    const matchDetailView = document.getElementById('match-detail-view'); const detailMatchInfo = document.getElementById('detail-match-info'); const detailMatchPhoto = document.getElementById('detail-match-photo'); const winnerSelect = document.getElementById('winner-select'); const backToListBtn = document.getElementById('back-to-list-btn'); const scoreInputSection = document.getElementById('score-input-section'); const scoreDisplaySection = document.getElementById('score-display-section'); const actionButtonsContainer = document.getElementById('action-buttons-container'); const scheduleInputSection = document.getElementById('schedule-input-section');
    const matchResultPhotoInput = document.getElementById('match-result-photo'); const matchUploadPreview = document.getElementById('match-upload-preview'); 
    const chatFromMatchBtn = document.getElementById('chat-from-match-btn'); const notificationContainer = document.getElementById('notification-container'); const playerStatsModal = document.getElementById('player-stats-modal'); const startChatBtn = document.getElementById('start-chat-btn'); 
    const statsPlayerName = document.getElementById('stats-player-name'); const statsTotalPoints = document.getElementById('stats-total-points'); const statsCourtPref = document.getElementById('stats-court-pref'); const statsPlayerPhoto = document.getElementById('stats-player-photo');
    const chatModal = document.getElementById('chat-window-modal'); const chatMessages = document.getElementById('chat-messages'); const chatInput = document.getElementById('chat-input'); const sendMessageBtn = document.getElementById('send-message-btn'); const chatRecipientName = document.getElementById('chat-recipient-name'); const closeChatModal = document.getElementById('close-chat-window'); const clearChatBtn = document.getElementById('clear-chat-btn'); 
    const editProfilePhotoInput = document.getElementById('edit-profile-photo'); const editProfilePreview = document.getElementById('edit-profile-preview'); const editFullNameInput = document.getElementById('edit-full-name'); const editCourtPreference = document.getElementById('edit-court-preference'); const editNotificationPreference = document.getElementById('edit-notification-preference'); const saveProfileBtn = document.getElementById('save-profile-btn'); const logoutBtnProfile = document.getElementById('logout-btn-profile'); const myPhotosContainer = document.getElementById('my-photos-container'); 
    const statsViewPlayerSelect = document.getElementById('stats-view-player-select'); const statTotalMatch = document.getElementById('stat-total-match'); const statTotalWin = document.getElementById('stat-total-win'); const statTotalPointsDisplay = document.getElementById('stat-total-points'); const chartWinRate = document.getElementById('chart-win-rate'); const chartSetRate = document.getElementById('chart-set-rate'); const chartGameRate = document.getElementById('chart-game-rate'); const barClay = document.getElementById('bar-clay'); const valClay = document.getElementById('val-clay'); const barHard = document.getElementById('bar-hard'); const valHard = document.getElementById('val-hard'); const statFormBadges = document.getElementById('stat-form-badges');
    const navItems = document.querySelectorAll('.nav-item'); const tabSections = document.querySelectorAll('.tab-section');
    // --- TURNUVA DOM ELEMENTLERİ ---
    const btnShowCreateTournament = document.getElementById('btn-show-create-tournament');
    const createTournamentForm = document.getElementById('create-tournament-form');
    const tournamentListView = document.getElementById('tournament-list-view');
    const activeTournamentsContainer = document.getElementById('active-tournaments-container');
    const btnSaveTournament = document.getElementById('btn-save-tournament');
    const tournamentDetailView = document.getElementById('tournament-detail-view');
    const detailTourName = document.getElementById('detail-tour-name');
    const tourRegistrationArea = document.getElementById('tour-registration-area');
    const tourAdminManageArea = document.getElementById('tour-admin-manage-area');
    const tourBracketContainer = document.getElementById('tour-bracket-container');

    const compressAndConvertToBase64 = (file, targetWidth = 1000) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    try {
                        const elem = document.createElement('canvas');
                        let width = img.width; let height = img.height;
                        if (width > targetWidth) { height = height * (targetWidth / width); width = targetWidth; }
                        elem.width = width; elem.height = height;
                        const ctx = elem.getContext('2d');
                        if (!ctx) { reject(new Error("Canvas oluşturulamadı.")); return; }
                        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, width, height);
                        let quality = 0.9; let dataUrl = elem.toDataURL('image/jpeg', quality); 
                        const MAX_SIZE = 950000; 
                        while (dataUrl.length > MAX_SIZE && quality > 0.1) {
                            quality -= 0.1; dataUrl = elem.toDataURL('image/jpeg', quality);
                        }
                        resolve(dataUrl);
                    } catch (error) { reject(error); }
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };
    
    function fetchWeather() {
        const widget = document.getElementById('weather-widget');
        const tempEl = document.getElementById('weather-temp');
        const descEl = document.getElementById('weather-desc');
        const windEl = document.getElementById('weather-wind');
        if (!widget) return;

        fetch('https://api.open-meteo.com/v1/forecast?latitude=40.1885&longitude=29.0610&current_weather=true&timezone=auto')
            .then(response => response.json())
            .then(data => {
                const weather = data.current_weather;
                const temp = Math.round(weather.temperature);
                const wind = Math.round(weather.windspeed);
                const code = weather.weathercode;
                let desc = "Bilinmiyor"; let icon = ""; let bgGradient = "linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)"; 
                if (code === 0) { desc = "Açık / Güneşli"; icon = "☀️"; bgGradient = "linear-gradient(135deg, #FFC371 0%, #FF5F6D 100%)"; }
                else if (code >= 1 && code <= 3) { desc = "Parçalı Bulutlu"; icon = "⛅"; bgGradient = "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)"; }
                else if (code >= 45 && code <= 48) { desc = "Sisli"; icon = "🌫️"; bgGradient = "linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)"; }
                else if (code >= 51 && code <= 67) { desc = "Yağmurlu"; icon = "🌧️"; bgGradient = "linear-gradient(135deg, #373B44 0%, #4286f4 100%)"; }
                else if (code >= 71 && code <= 77) { desc = "Karlı"; icon = "❄️"; bgGradient = "linear-gradient(135deg, #E6DADA 0%, #274046 100%)"; }
                else if (code >= 80 && code <= 82) { desc = "Sağanak Yağış"; icon = "🌦️"; bgGradient = "linear-gradient(135deg, #373B44 0%, #4286f4 100%)"; }
                else if (code >= 95) { desc = "Fırtına"; icon = "⛈️"; bgGradient = "linear-gradient(135deg, #141E30 0%, #243B55 100%)"; }
                else { desc = "Bulutlu"; icon = "☁️"; bgGradient = "linear-gradient(135deg, #757F9A 0%, #D7DDE8 100%)"; }
                tempEl.textContent = `${temp}°C`; descEl.textContent = `${icon} ${desc}`; windEl.textContent = `💨 ${wind} km/s`; widget.style.background = bgGradient; widget.style.display = 'block';
            }).catch(err => { widget.style.display = 'none'; });
    }
    
    const getLeagueBadgeHTML = (points) => {
        let cls = 'league-bronze'; let txt = 'BRONZ';
        if (points >= 3000) { cls = 'league-gold'; txt = 'ALTIN'; }
        else if (points >= 1000) { cls = 'league-silver'; txt = 'GÜMÜŞ'; }
        return `<span class="league-badge ${cls}">${txt}</span>`;
    };

    const setTodayFilters = () => {
        const today = new Date(); const yyyy = today.getFullYear(); const mm = String(today.getMonth() + 1).padStart(2, '0'); const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        if(filterDateStart) filterDateStart.value = todayStr; if(filterDateEnd) filterDateEnd.value = todayStr;
    };

    const setHistoryTodayFilters = () => {
        const today = new Date(); const yyyy = today.getFullYear(); const mm = String(today.getMonth() + 1).padStart(2, '0'); const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        if(histFilterStart) histFilterStart.value = todayStr; if(histFilterEnd) histFilterEnd.value = todayStr;
    };

    const setGalleryTodayFilters = () => {
        const today = new Date(); const yyyy = today.getFullYear(); const mm = String(today.getMonth() + 1).padStart(2, '0'); const dd = String(today.getDate()).padStart(2, '0');
        if(galleryFilterDate) galleryFilterDate.value = `${yyyy}-${mm}-${dd}`;
    };

    function generateAdvancedCommentary(type, data) {
        const seedID = data.matchId || Date.now().toString();
        if (type === 'match_result') {
            const opener = pickConsistent(COMMENTARY_PARTS.openers, seedID + "_opener");
            let actionArray = [];
            if (data.isComeback) actionArray = COMMENTARY_PARTS.actions.comeback;
            else if (data.isCrushing) actionArray = COMMENTARY_PARTS.actions.crushing;
            else if (data.isTight) actionArray = COMMENTARY_PARTS.actions.tight;
            else actionArray = COMMENTARY_PARTS.actions.normal;
            const action = pickConsistent(actionArray, seedID + "_action");
            const detail = pickConsistent(COMMENTARY_PARTS.details, seedID + "_detail");
            const closing = pickConsistent(COMMENTARY_PARTS.closings, seedID + "_closing");
            return `${opener} ${action} ${detail} ${closing}`.replace(/{winner}/g, data.winnerName).replace(/{loser}/g, data.loserName).replace(/{score}/g, data.scoreStr);
        } else if (type === 'open_ad') {
            let intro = ""; let mid = "";
            if (data.wager >= 50) { intro = pickConsistent(COMMENTARY_PARTS.ads.challenge, seedID + "_ad_intro"); mid = pickConsistent(COMMENTARY_PARTS.ads.wagerText, seedID + "_ad_mid"); } 
            else { intro = pickConsistent(COMMENTARY_PARTS.ads.friendly, seedID + "_ad_intro"); mid = "Maksat spor olsun, raketler konuşsun."; }
            return `${intro} ${mid}`.replace(/{p1}/g, data.p1Name).replace(/{wager}/g, data.wager);
        } else if (type === 'badge_earned') {
            const close = pickConsistent(COMMENTARY_PARTS.closings, seedID + "_badge");
            return `🎖️ <strong>Tebrikler {p1}!</strong> Gösterdiği üstün performansla koleksiyonuna <strong>"${data.badgeName}"</strong> rozetini ekledi. ${close}`.replace(/{p1}/g, data.p1Name);
        } else if (type === 'new_player') {
            return `👋 <strong>Aramıza Hoş Geldin {p1}!</strong> Ligimize taze kan geldi. İlk maçını heyecanla bekliyoruz. 🎾`.replace(/{p1}/g, data.p1Name);
        }
        return "Ligde heyecan devam ediyor...";
    }

// --- ROZET KONTROL VE VERME MOTORU (GARANTİLİ VERSİYON) ---
    window.checkAndGrantBadges = async function(userId) {
        if(!userId) return [];
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if(!userDoc.exists) return [];
        const userData = userDoc.data();
        
        let currentBadges = userData.badges || []; let newBadges = [];
        const stats = await calculateAdvancedStats(userId);
        
        const check = (id, condition) => { if (!currentBadges.includes(id) && condition) { newBadges.push(id); currentBadges.push(id); } };
        check('newbie', stats.played >= 1); check('first_win', stats.won >= 1); check('veteran', stats.played >= 20); check('champion', userData.toplamPuan >= 3000);
        
        // Rozetler için de hatasız çekim yapıyoruz
        const allMatchesSnap = await db.collection('matches').where('durum', '==', 'Tamamlandı').get();
        let userMatches = [];
        allMatchesSnap.forEach(doc => {
            const d = doc.data();
            if (d.oyuncu1ID === userId || d.oyuncu2ID === userId || d.oyuncu1PartnerID === userId || d.oyuncu2PartnerID === userId) {
                userMatches.push({ ...d, id: doc.id });
            }
        });
        
        userMatches.sort((a,b) => (a.tarih?.seconds||0) - (b.tarih?.seconds||0));
        
        let streak = 0; let maxStreak = 0;
        userMatches.forEach(m => { 
            let isWinner = false;
            if (m.kayitliKazananID === userId) isWinner = true; 
            else if (m.kayitliKazananID === m.oyuncu1ID && m.oyuncu1PartnerID === userId) isWinner = true; 
            else if (m.kayitliKazananID === m.oyuncu2ID && m.oyuncu2PartnerID === userId) isWinner = true; 

            if(isWinner) { streak++; if(streak>maxStreak) maxStreak=streak; } else { streak=0; } 
        });

        check('hat_trick', maxStreak >= 3); check('unstoppable', maxStreak >= 5); check('legend_streak', maxStreak >= 10);
        check('clay_master', stats.clay.won >= 5); check('hard_hitter', stats.hard.won >= 5);
        
        if (newBadges.length > 0) {
            await userRef.update({ badges: currentBadges });
            newBadges.forEach(badgeId => {
                db.collection('news').add({ type: 'badge_earned', userId: userId, badgeId: badgeId, badgeName: BADGE_DEFINITIONS[badgeId].name, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
            });
        }
        return newBadges;
    };

    function switchAuthTab(mode) {
        isLoginMode = mode === 'login'; authError.style.display = 'none'; authError.textContent = '';
        if (isLoginMode) {
            tabLoginSwitch.classList.add('active'); tabRegisterSwitch.classList.remove('active'); registerFields.style.display = 'none'; authActionBtn.textContent = 'Giriş Yap'; if(loginFooterLinks) loginFooterLinks.style.display = 'block';
        } else {
            tabRegisterSwitch.classList.add('active'); tabLoginSwitch.classList.remove('active'); registerFields.style.display = 'block'; authActionBtn.textContent = 'Kayıt Ol'; if(loginFooterLinks) loginFooterLinks.style.display = 'none';
        }
    }

    if (tabLoginSwitch) { tabLoginSwitch.addEventListener('click', () => switchAuthTab('login')); tabRegisterSwitch.addEventListener('click', () => switchAuthTab('register')); }
    if (forgotPasswordLink) { forgotPasswordLink.addEventListener('click', () => { forgotPasswordModal.style.display = 'flex'; resetMsg.textContent = ''; resetEmailInput.value = emailInput.value || ''; }); }
    if (btnSendResetLink) {
        btnSendResetLink.addEventListener('click', () => {
            const email = resetEmailInput.value.trim();
            if (!email) { resetMsg.textContent = "Lütfen e-posta adresinizi girin."; resetMsg.style.color = "red"; return; }
            auth.sendPasswordResetEmail(email).then(() => { resetMsg.textContent = "Sıfırlama bağlantısı gönderildi! E-postanızı kontrol edin."; resetMsg.style.color = "green"; setTimeout(() => { forgotPasswordModal.style.display = 'none'; }, 3000); }).catch((error) => { resetMsg.textContent = "Hata: " + error.message; resetMsg.style.color = "red"; });
        });
    }

    function getChatId(uid1, uid2) { return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`; }
    function openChat(targetUserId, targetUserName) {
        const myUid = auth.currentUser.uid; currentChatId = getChatId(myUid, targetUserId); chatRecipientName.textContent = targetUserName; chatMessages.innerHTML = '<p style="text-align:center;color:#999;">Mesajlar yükleniyor...</p>';
        chatModal.style.display = 'flex'; playerStatsModal.style.display = 'none'; matchDetailView.style.display = 'none'; subscribeToMessages();
    }

    function subscribeToMessages() {
        if (currentChatUnsubscribe) currentChatUnsubscribe();
        db.collection('chats').doc(currentChatId).get().then(docSnap => {
            let clearedTime = null;
            if(docSnap.exists) { const data = docSnap.data(); if(data.clearedAt && data.clearedAt[auth.currentUser.uid]) { clearedTime = data.clearedAt[auth.currentUser.uid]; } }
            let query = db.collection('chats').doc(currentChatId).collection('messages').orderBy('timestamp', 'asc');
            if(clearedTime) { query = query.startAfter(clearedTime); }
            currentChatUnsubscribe = query.onSnapshot(snapshot => {
                chatMessages.innerHTML = '';
                if(snapshot.empty) { chatMessages.innerHTML = '<p style="text-align:center;color:#999;">Mesaj yok.</p>'; return; }
                snapshot.forEach(doc => {
                    const msg = doc.data(); const isMe = msg.senderId === auth.currentUser.uid; const date = msg.timestamp ? msg.timestamp.toDate() : new Date(); const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                    const msgDiv = document.createElement('div'); msgDiv.className = `message-bubble ${isMe ? 'message-sent' : 'message-received'}`; msgDiv.innerHTML = `${msg.text}<span class="message-time">${timeStr}</span>`; chatMessages.appendChild(msgDiv);
                });
                chatMessages.scrollTop = chatMessages.scrollHeight;
            });
        });
    }

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text || !currentChatId) return;
        try {
            await db.collection('chats').doc(currentChatId).collection('messages').add({ text: text, senderId: auth.currentUser.uid, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
            await db.collection('chats').doc(currentChatId).set({ lastMessage: text, lastMessageSenderId: auth.currentUser.uid, lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(), participants: currentChatId.split('_'), deletedBy: [] }, { merge: true });
            
            const parts = currentChatId.split('_'); const myUid = auth.currentUser.uid; const targetId = parts.find(id => id !== myUid); const myName = userMap[myUid]?.isim || 'Bir Oyuncu';
            if (targetId) {
                const subject = "💬 Yeni Mesajın Var";
                const body = `<p><strong>${myName}</strong> sana bir mesaj gönderdi:</p><blockquote style="border-left: 4px solid #ccc; margin: 10px 0; padding-left: 10px; color: #555; background-color: #f9f9f9; padding: 10px;">"${text}"</blockquote><p>Cevap vermek için uygulamaya aşağıdaki linkten giriş yapabilirsin:</p><p><a href="https://bursatenisligi.github.io/TenisLig/">https://bursatenisligi.github.io/TenisLig/</a></p>`;
                sendNotificationEmail(targetId, subject, body);
            }
            chatInput.value = ''; 
        } catch (error) { console.error("Mesaj gönderme hatası:", error); alert("Mesaj gönderilemedi."); }
    }

    async function deleteChat(chatId, e) {
        e.stopPropagation(); if(!confirm("Sohbeti silmek istediğinize emin misiniz?")) return;
        try { await db.collection('chats').doc(chatId).set({ deletedBy: firebase.firestore.FieldValue.arrayUnion(auth.currentUser.uid) }, { merge: true }); loadChatList(); } catch(err) { console.error(err); alert("Silinemedi."); }
    }

    async function clearChatMessages() {
        if(!currentChatId) return; if(!confirm("Sohbet geçmişini temizlemek istiyor musunuz?")) return;
        try { await db.collection('chats').doc(currentChatId).set({ clearedAt: { [auth.currentUser.uid]: firebase.firestore.Timestamp.now() } }, { merge: true }); subscribeToMessages(); alert("Geçmiş temizlendi."); } catch(err) { console.error(err); alert("Hata oluştu."); }
    }

    function loadChatList() {
        const myUid = auth.currentUser.uid; if(!chatListContainer) return; chatListContainer.innerHTML = '<p style="text-align:center;">Yükleniyor...</p>';
        db.collection('chats').where('participants', 'array-contains', myUid).orderBy('lastMessageTime', 'desc').get().then(snapshot => {
            chatListContainer.innerHTML = ''; let hasChats = false;
            snapshot.forEach(doc => {
                const data = doc.data(); if (data.deletedBy && data.deletedBy.includes(myUid)) return;
                hasChats = true; const chatId = doc.id; const otherId = data.participants.find(id => id !== myUid); const name = userMap[otherId]?.isim || 'Bilinmiyor'; const time = data.lastMessageTime ? data.lastMessageTime.toDate().toLocaleDateString('tr-TR') : '';
                const item = document.createElement('div'); item.className = 'modern-list-item'; 
                item.innerHTML = `<div class="list-item-left"><div class="list-item-icon">💬</div></div><div class="list-item-content"><div class="list-item-title">${name}</div><div class="list-item-subtitle">${data.lastMessage}</div></div><div class="list-item-right"><span>${time}</span><button class="btn-delete-chat" data-id="${chatId}" style="margin-top:5px;">🗑️</button></div>`;
                item.onclick = () => openChat(otherId, name); const delBtn = item.querySelector('.btn-delete-chat'); delBtn.onclick = (e) => deleteChat(chatId, e); chatListContainer.appendChild(item);
            });
            if(!hasChats) chatListContainer.innerHTML = '<p style="text-align:center;color:#777;">Henüz sohbetiniz yok.</p>';
        }).catch(err => { chatListContainer.innerHTML = '<p style="text-align:center;color:red;">Liste yüklenemedi.</p>'; });
    }

    function fetchUserMap() {
        return db.collection('users').get().then(snapshot => {
            if (filterPlayer) filterPlayer.innerHTML = '<option value="">Tüm Oyuncular</option>';
            if (galleryFilterPlayer) galleryFilterPlayer.innerHTML = '<option value="">Tüm Oyuncular</option>';
            if (statsViewPlayerSelect) { while(statsViewPlayerSelect.options.length > 1) { statsViewPlayerSelect.remove(1); } }
            snapshot.forEach(doc => {
                const player = doc.data();
                userMap[doc.id] = { isim: player.isim || player.email, email: player.email, uid: doc.id, toplamPuan: player.toplamPuan, ciftlerPuani: player.ciftlerPuani, kortTercihi: player.kortTercihi, telefon: player.telefon, fotoURL: player.fotoURL, cinsiyet: player.cinsiyet, bildirimTercihi: player.bildirimTercihi || 'ses', tenisBaslangic: player.tenisBaslangic || '', kulup: player.kulup || 'Belirtilmemiş', emailNotifications: (player.emailNotifications !== false), macSayisi: player.macSayisi || 0, galibiyetSayisi: player.galibiyetSayisi || 0, badges: player.badges || [] };
                if (filterPlayer) { const option = document.createElement('option'); option.value = doc.id; option.textContent = player.isim || player.email; filterPlayer.appendChild(option); }
                if (galleryFilterPlayer) { const option = document.createElement('option'); option.value = doc.id; option.textContent = player.isim || player.email; galleryFilterPlayer.appendChild(option); }
                if (statsViewPlayerSelect && doc.id !== auth.currentUser?.uid) { const opt = document.createElement('option'); opt.value = doc.id; opt.textContent = player.isim || player.email; statsViewPlayerSelect.appendChild(opt); }
            });
        });
    }

function loadLeaderboard(filterClub = 'all') {
        const leaderboardDiv = document.getElementById('leaderboard');
        if(!leaderboardDiv) return;
        leaderboardDiv.innerHTML = '<p style="text-align:center; color:#999; margin-top:20px;">🏆 Sıralama güncelleniyor...</p>';

        // Firestore yerine zaten yüklü olan userMap üzerinden sıralıyoruz (Çok daha hızlı)
        let usersArray = Object.values(userMap);
        if (filterClub !== 'all') {
            usersArray = usersArray.filter(player => player.kulup === filterClub);
        }

        // Mod'a göre sıralama yap
        if (currentLeaderboardMode !== 'Tekler') {
            usersArray.sort((a, b) => (b.ciftlerPuani !== undefined ? b.ciftlerPuani : 1000) - (a.ciftlerPuani !== undefined ? a.ciftlerPuani : 1000));
        } else {
            usersArray.sort((a, b) => (b.toplamPuan || 0) - (a.toplamPuan || 0));
        }

        leaderboardDiv.innerHTML = '';
        let rank = 1; let displayedCount = 0;

        usersArray.forEach(player => {
            const score = currentLeaderboardMode !== 'Tekler' ? (player.ciftlerPuani !== undefined ? player.ciftlerPuani : 1000) : (player.toplamPuan || 0);
            const photoURL = player.fotoURL || getSafeAvatar(player.isim || player.email);
            const badgeHTML = getLeagueBadgeHTML(score);
            const clubDisplay = player.kulup ? player.kulup : 'Kulüpsüz';
            
            let rankBadgeClass = "rank-badge-normal"; let rankIcon = `#${rank}`; let cardBorderClass = "";
            if (rank === 1) { rankBadgeClass = "rank-badge-gold"; rankIcon = "🥇 1"; cardBorderClass = "card-gold-border"; } 
            else if (rank === 2) { rankBadgeClass = "rank-badge-silver"; rankIcon = "🥈 2"; cardBorderClass = "card-silver-border"; } 
            else if (rank === 3) { rankBadgeClass = "rank-badge-bronze"; rankIcon = "🥉 3"; cardBorderClass = "card-bronze-border"; }

            const playerCard = document.createElement('div');
            playerCard.className = `player-card ${cardBorderClass}`;
            playerCard.onclick = () => showPlayerStats(player.uid); 
            playerCard.innerHTML = `
                <div class="leaderboard-left"><div class="${rankBadgeClass}">${rankIcon}</div><img src="${photoURL}" class="leaderboard-avatar"></div>
                <div class="leaderboard-info"><div class="leaderboard-name">${player.isim || player.email}</div><div class="leaderboard-club">🏟️ ${clubDisplay}</div></div>
                <div class="leaderboard-right"><div class="leaderboard-points">${score} P</div>${badgeHTML}</div>
            `;
            leaderboardDiv.appendChild(playerCard);
            rank++; displayedCount++;
        });
        if (displayedCount === 0) { leaderboardDiv.innerHTML = '<p style="text-align:center; padding:20px; color:#777;">Bu kriterlere uygun oyuncu bulunamadı.</p>'; }
    }



    function analyzeStats(matches) {
        let playerStats = {}; let courtStats = {};
        Object.keys(userMap).forEach(uid => { playerStats[uid] = { id: uid, name: userMap[uid].isim, points: 0, wins: 0, matches: 0, setsPlayed: 0, tieBreakWins: 0, history: [] }; });

        matches.forEach(m => {
            if (m.macYeri) courtStats[m.macYeri] = (courtStats[m.macYeri] || 0) + 1;
            const p1 = m.oyuncu1ID; const p2 = m.oyuncu2ID; const winner = m.kayitliKazananID;
            let time = m.macZamani ? m.macZamani.seconds : (m.tarih ? m.tarih.seconds : 0);

            [p1, p2].forEach(pid => {
                if (playerStats[pid]) {
                    playerStats[pid].matches++;
                    if (pid === winner) playerStats[pid].wins++;
                    playerStats[pid].history.push({ time: time, win: (pid === winner) });
                }
            });

            if (m.skor) {
                const s = m.skor;
                const sets = [{p1: s.s1_me, p2: s.s1_opp}, {p1: s.s2_me, p2: s.s2_opp}, {p1: s.s3_me, p2: s.s3_opp}];
                sets.forEach(set => {
                    const s1 = parseInt(set.p1||0); const s2 = parseInt(set.p2||0);
                    if (s1 + s2 > 0) {
                        if (playerStats[m.sonucuGirenID]) playerStats[m.sonucuGirenID].setsPlayed++;
                        const otherId = (m.sonucuGirenID === p1) ? p2 : p1;
                        if (playerStats[otherId]) playerStats[otherId].setsPlayed++;
                        if ((s1 === 7 && s2 === 6) || (s1 === 6 && s2 === 7)) {
                            const tbWinner = (s1 === 7) ? m.sonucuGirenID : otherId;
                            if(playerStats[tbWinner]) playerStats[tbWinner].tieBreakWins++;
                        }
                    }
                });
            }
        });

        let maxWins = { val: 0, p: null }; let maxMatches = { val: 0, p: null }; let maxSets = { val: 0, p: null }; let maxTB = { val: 0, p: null }; let maxStreak = { val: 0, p: null }; let maxPointsTotal = { val: -99999, p: null };
        Object.values(userMap).forEach(u => { if(u.toplamPuan > maxPointsTotal.val) maxPointsTotal = { val: u.toplamPuan, p: u.isim }; });
        Object.values(playerStats).forEach(p => {
            if (p.wins > maxWins.val) maxWins = { val: p.wins, p: p.name };
            if (p.matches > maxMatches.val) maxMatches = { val: p.matches, p: p.name };
            if (p.setsPlayed > maxSets.val) maxSets = { val: p.setsPlayed, p: p.name };
            if (p.tieBreakWins > maxTB.val) maxTB = { val: p.tieBreakWins, p: p.name };
            if (p.history.length > 0) {
                p.history.sort((a, b) => a.time - b.time);
                let currentStreak = 0; let bestStreak = 0;
                p.history.forEach(h => { if (h.win) { currentStreak++; if (currentStreak > bestStreak) bestStreak = currentStreak; } else { currentStreak = 0; } });
                if (bestStreak > maxStreak.val) maxStreak = { val: bestStreak, p: p.name };
            }
        });

        let bestCourt = { val: 0, name: '-' };
        Object.keys(courtStats).forEach(c => { if(courtStats[c] > bestCourt.val) bestCourt = { val: courtStats[c], name: c }; });
        return { maxPointsTotal, maxWins, maxMatches, maxStreak, maxTB, maxSets, bestCourt };
    }

    async function loadTheBests(filterType = 'all') {
        if (!bestsContainer) return;
        bestsContainer.innerHTML = '<p style="width:100%; text-align:center; color:#999; margin-top:20px;">📊 İstatistikler analiz ediliyor...</p>';
        try {
            const snapshot = await db.collection('matches').where('durum', '==', 'Tamamlandı').get();
            let matches = []; snapshot.forEach(doc => matches.push(doc.data()));
            if (filterType === 'month') {
                const now = new Date(); const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                matches = matches.filter(m => { const d = m.macZamani ? m.macZamani.toDate() : (m.tarih ? m.tarih.toDate() : null); return d && d >= startOfMonth && d <= endOfMonth; });
            }
            const stats = analyzeStats(matches);
            const getPhotoByName = (name) => {
                if (!name || name === '-') return 'https://via.placeholder.com/60?text=?';
                const user = Object.values(userMap).find(u => (u.isim || u.email) === name);
                return user && user.fotoURL ? user.fotoURL : getSafeAvatar(name);
            };
            const createBestCard = (type, icon, label, value, playerName) => {
                const photoURL = getPhotoByName(playerName);
                let colorClass = "best-accent-blue"; if (type === 'gold') colorClass = "best-accent-gold"; if (type === 'fire') colorClass = "best-accent-fire"; if (type === 'green') colorClass = "best-accent-green";
                return `<div class="best-card-modern"><div class="best-card-header ${colorClass}"><span class="best-card-icon">${icon}</span><span class="best-card-label">${label}</span></div><div class="best-card-body"><div class="best-card-value">${value}</div><div class="best-player-row"><img src="${photoURL}" class="best-avatar"><div class="best-player-name">${playerName || '-'}</div></div></div></div>`;
            };
            let legendTitle = "Ligin Efsanesi"; let legendVal = stats.maxPointsTotal.val + " Puan"; let legendName = stats.maxPointsTotal.p;
            if (filterType === 'month') { legendTitle = "Ayın Lideri"; legendVal = stats.maxWins.val + " Galibiyet"; legendName = stats.maxWins.p; }

            bestsContainer.innerHTML = `
                ${createBestCard('gold', '👑', legendTitle, legendVal, legendName)}
                ${createBestCard('fire', '🔥', 'Yenilmezlik Serisi', stats.maxStreak.val + " Maç", stats.maxStreak.p)}
                ${createBestCard('green', '🦾', 'Galibiyet Makinesi', stats.maxWins.val + " Galibiyet", stats.maxWins.p)}
                ${createBestCard('blue', '🏃', 'Maratoncu', stats.maxMatches.val + " Maç", stats.maxMatches.p)}
                ${createBestCard('blue', '🧱', 'Tie-Break Kralı', stats.maxTB.val + " TB Zaferi", stats.maxTB.p)}
                ${createBestCard('blue', '🥵', 'Set Canavarı', stats.maxSets.val + " Set", stats.maxSets.p)}
                <div class="best-card-modern" style="grid-column: span 2;">
                    <div class="best-card-header best-accent-gray"><span class="best-card-icon">📍</span><span class="best-card-label">En Popüler Kort</span></div>
                    <div class="best-card-body" style="flex-direction:row; justify-content:space-between; padding: 15px;"><div class="best-card-value" style="font-size:1.2em;">${stats.bestCourt.name}</div><div style="font-weight:bold; color:#777;">${stats.bestCourt.val} Maç</div></div>
                </div>`;
        } catch (error) { bestsContainer.innerHTML = '<p style="text-align:center; color:red;">Veriler yüklenemedi.</p>'; }
    }

    function loadGallery() {
        if (!galleryGrid) return;
        galleryGrid.innerHTML = '<p style="text-align:center; width:200%; color:#777;">📸 Fotoğraflar yükleniyor...</p>';
        if (galleryFilterCourt && galleryFilterCourt.options.length === 1) { ['Toprak', 'Sert'].forEach(c => { const opt = document.createElement('option'); opt.value = c; opt.textContent = c; galleryFilterCourt.appendChild(opt); }); }
        const filterDate = galleryFilterDate.value ? new Date(galleryFilterDate.value) : null;
        const filterCrt = galleryFilterCourt.value; const filterPlyr = galleryFilterPlayer.value;
        const tenDaysAgo = new Date(); tenDaysAgo.setDate(tenDaysAgo.getDate() - 10); tenDaysAgo.setHours(0, 0, 0, 0);

        db.collection('matches').orderBy('tarih', 'desc').limit(100).get().then(snapshot => {
            let photos = [];
            snapshot.forEach(doc => {
                const m = doc.data();
                if (m.macFotoURL) {
                    const mDate = m.macZamani ? m.macZamani.toDate() : (m.tarih ? m.tarih.toDate() : null);
                    let pass = true;
                    if (filterDate) { if (!mDate || mDate.getDate() !== filterDate.getDate() || mDate.getMonth() !== filterDate.getMonth() || mDate.getFullYear() !== filterDate.getFullYear()) pass = false; } 
                    else { if (!mDate || mDate < tenDaysAgo) pass = false; }
                    if (filterCrt && m.kortTipi !== filterCrt) pass = false;
                    if (filterPlyr && (m.oyuncu1ID !== filterPlyr && m.oyuncu2ID !== filterPlyr)) pass = false;
                    if (pass) photos.push({ ...m, id: doc.id, dateObj: mDate });
                }
            });
            if (photos.length === 0) { let msg = filterDate ? "Seçilen tarihte fotoğraf yok." : "Son 10 gün içinde yüklenen maç fotoğrafı yok."; galleryGrid.innerHTML = `<p style="text-align:center; width:200%; color:#999; padding:20px;">${msg} 🤷‍♂️</p>`; } 
            else { renderGalleryGrid(photos, galleryGrid); }
        }).catch(err => { galleryGrid.innerHTML = '<p style="text-align:center; width:200%; color:red;">Yüklenemedi.</p>'; });
    }

    function loadUserPhotos() {
        if (!myPhotosContainer) return; myPhotosContainer.innerHTML = '<p style="text-align:center; width:200%; color:#777;">Yükleniyor...</p>';
        const myUid = auth.currentUser.uid;
        const q1 = db.collection('matches').where('oyuncu1ID', '==', myUid).where('durum', '==', 'Tamamlandı').get();
        const q2 = db.collection('matches').where('oyuncu2ID', '==', myUid).where('durum', '==', 'Tamamlandı').get();
        Promise.all([q1, q2]).then(snapshots => {
            let photos = [];
            snapshots.forEach(snap => { snap.forEach(doc => { const m = doc.data(); if (m.macFotoURL) { photos.push({ ...m, id: doc.id, dateObj: m.macZamani ? m.macZamani.toDate() : (m.tarih ? m.tarih.toDate() : new Date()) }); } }); });
            photos = photos.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i); photos.sort((a,b) => b.dateObj - a.dateObj);
            renderGalleryGrid(photos, myPhotosContainer);
        });
    }

    function renderGalleryGrid(items, container) {
        container.innerHTML = '';
        if (items.length === 0) { container.innerHTML = '<p style="text-align:center; width:200%; color:#999; padding:20px;">Fotoğraf bulunamadı.</p>'; return; }
        items.forEach(item => {
            const p1 = userMap[item.oyuncu1ID]?.isim.split(' ')[0] || '?'; const p2 = userMap[item.oyuncu2ID]?.isim.split(' ')[0] || '?';
            const dateStr = item.dateObj ? item.dateObj.toLocaleString('tr-TR', { day: 'numeric', month: 'short' }) : ''; const kort = item.kortTipi || 'Kort';
            const div = document.createElement('div'); div.className = 'gallery-item';
            div.onclick = () => { returnToTab = (container === myPhotosContainer) ? 'tab-profile' : 'tab-gallery'; showMatchDetail(item.id); };
            div.innerHTML = `<img src="${item.macFotoURL}" class="gallery-img" loading="lazy"><div class="gallery-date-badge">${dateStr}</div><div class="gallery-overlay"><span style="font-weight:bold;">${p1} vs ${p2}</span><span style="font-size:0.9em; opacity:0.9;">${kort}</span></div>`;
            container.appendChild(div);
        });
    }

    function loadOpponents() {
        if(opponentSelect) opponentSelect.innerHTML = '<option value="">Rakip Seçin</option>';
        if(adPartnerSelect) adPartnerSelect.innerHTML = '<option value="">Partner Seçin</option>';
        if(challengePartnerSelect) challengePartnerSelect.innerHTML = '<option value="">Partner Seçin</option>';
        
        const currentUserID = auth.currentUser.uid;
        Object.values(userMap).forEach(player => { 
            if (player.uid !== currentUserID) { 
                const opt1 = document.createElement('option'); opt1.value = player.uid; opt1.textContent = `${player.isim || player.email}`; 
                const opt2 = opt1.cloneNode(true);
                const opt3 = opt1.cloneNode(true);
                
                if(opponentSelect) opponentSelect.appendChild(opt1); 
                if(adPartnerSelect) adPartnerSelect.appendChild(opt2);
                if(challengePartnerSelect) challengePartnerSelect.appendChild(opt3);
            } 
        });
    }

function openLobbyDetail(type, data) {
        const modal = document.getElementById('lobby-detail-modal'); const content = document.getElementById('lobby-detail-content'); let html = '';
        if (type === 'result') {
            html = `<div class="detail-big-icon">🏁</div><h3>Maç Sonucu</h3><div class="detail-players"><div class="detail-player-box"><img src="${data.p1Photo}" class="detail-avatar"><div>${data.p1Name}</div></div><div class="detail-vs">VS</div><div class="detail-player-box"><img src="${data.p2Photo}" class="detail-avatar"><div>${data.p2Name}</div></div></div><div style="font-size:1.5em; font-weight:bold; margin-bottom:15px; color:#28a745;">${data.scoreStr}</div><div class="detail-commentary">${data.commentary}</div><button onclick="document.getElementById('lobby-detail-modal').style.display='none'; showMatchDetail('${data.matchId}')" class="btn-main">Maç Detayına Git</button>`;
        } else if (type === 'ad') {
            // --- ÇİFTLER İÇİN PARTNER SEÇİM KUTUSU ---
            let partnerSelectHTML = '';
            if (!(data.macFormati || '').includes('Tekler') && data.isEligible) {
                let options = '<option value="">Takım Arkadaşını Seç</option>';
                Object.values(userMap).forEach(p => {
                    if (p.uid !== auth.currentUser.uid && p.uid !== data.oyuncu1ID) {
                        options += `<option value="${p.uid}">${p.isim || p.email}</option>`;
                    }
                });
                partnerSelectHTML = `<div style="margin-bottom:15px; text-align:left;"><label style="font-size:0.85em; font-weight:bold; color:#555;">Bu bir çiftler maçı. Partnerini seç:</label><select id="accept-ad-partner" style="width:100%; padding:8px; border-radius:6px; border:1px solid #ccc; margin-top:5px;">${options}</select></div>`;
            }
            // ------------------------------------------

            let btnHTML = data.isEligible ? `<button class="btn-main" style="background:#28a745;" onclick="acceptOpenRequest('${data.matchId}', ${data.wager}, '${data.matchType}', '${data.macFormati}')">✅ Meydan Okumayı Kabul Et</button>` : `<button class="btn-main" style="background:#ccc; cursor:not-allowed;" disabled>🔒 Ligin Yetmiyor</button>`;
            
            html = `<div class="detail-big-icon">${data.isChallenge ? '🔥' : '🤝'}</div><h3>${data.headerTitle}</h3><div class="detail-players"><div class="detail-player-box"><img src="${data.p1Photo}" class="detail-avatar"><div>${data.p1Name}</div></div><div class="detail-vs">?</div><div class="detail-player-box"><div style="width:60px; height:60px; border-radius:50%; background:#eee; display:flex; align-items:center; justify-content:center; margin:0 auto 5px auto; font-size:20px; color:#999;">👤</div><div>Rakip Aranıyor</div></div></div><div style="background:#fff3cd; padding:10px; border-radius:8px; margin-bottom:15px; color:#856404; font-weight:bold;">Bahis: ${data.wager} Puan</div><div class="detail-commentary">${data.commentary}</div>${partnerSelectHTML}${btnHTML}`;
        } else if (type === 'schedule') {
            html = `<div class="detail-big-icon">📅</div><h3>Maç Planı</h3><div class="detail-players"><div class="detail-player-box"><img src="${data.p1Photo}" class="detail-avatar"><div>${data.p1Name}</div></div><div class="detail-vs">VS</div><div class="detail-player-box"><img src="${data.p2Photo}" class="detail-avatar"><div>${data.p2Name}</div></div></div><div class="detail-commentary"><strong>Zaman:</strong> ${data.timeStr}<br><strong>Yer:</strong> ${data.location}<br><br>${data.contextMsg}</div><button onclick="document.getElementById('lobby-detail-modal').style.display='none'; showMatchDetail('${data.matchId}')" class="btn-main">Detayları Gör</button>`;
        }
        content.innerHTML = html; modal.style.display = 'flex';
    }

async function loadAnnouncements() {
        if (!announcementsContainer) return; announcementsContainer.innerHTML = `<p style="text-align:center; color:#999; margin-top:10px;">Yükleniyor...</p>`;
        try {
            const matchSnap = await db.collection('matches').where('durum', '==', 'Tamamlandı').orderBy('tarih', 'desc').limit(5).get();
            announcementsContainer.innerHTML = '';
            if (matchSnap.empty) { announcementsContainer.innerHTML = '<p style="text-align:center; padding:10px; font-size:0.9em;">Henüz tamamlanan maç yok.</p>'; return; }
            matchSnap.forEach(doc => {
                const m = doc.data(); const p1 = userMap[m.oyuncu1ID]; const p2 = userMap[m.oyuncu2ID]; 
                const p1Name = p1?.isim || '?'; const p2Name = p2?.isim || '?';
                
                // --- ÇİFTLER İÇİN TAKIM İSİMLERİ ---
                let team1Name = p1Name.split(' ')[0];
                if (!(m.macFormati || '').includes('Tekler') && m.oyuncu1PartnerID && userMap[m.oyuncu1PartnerID]) {
                    team1Name += ` & ${userMap[m.oyuncu1PartnerID].isim.split(' ')[0]}`;
                }
                let team2Name = p2Name.split(' ')[0];
                if (!(m.macFormati || '').includes('Tekler') && m.oyuncu2PartnerID && userMap[m.oyuncu2PartnerID]) {
                    team2Name += ` & ${userMap[m.oyuncu2PartnerID].isim.split(' ')[0]}`;
                }
                // ------------------------------------

                let scoreStr = "Skor Yok"; if(m.skor) scoreStr = `${m.skor.s1_me}-${m.skor.s1_opp}, ${m.skor.s2_me}-${m.skor.s2_opp}` + (m.skor.s3_me ? `, ${m.skor.s3_me}-${m.skor.s3_opp}` : '');
                
                const winnerName = (m.kayitliKazananID === m.oyuncu1ID) ? team1Name : team2Name; 
                const loserName = (m.kayitliKazananID === m.oyuncu1ID) ? team2Name : team1Name;
                
                let isCrushing = false; if (m.skor && ((m.skor.s1_me <= 1 || m.skor.s1_opp <= 1))) isCrushing = true;
                const commentary = generateAdvancedCommentary('match_result', { winnerName, loserName, scoreStr, isCrushing, matchId: doc.id });
                const modalData = { p1Name: team1Name, p2Name: team2Name, p1Photo: p1?.fotoURL || getSafeAvatar(p1Name), p2Photo: p2?.fotoURL || getSafeAvatar(p2Name), scoreStr, commentary, matchId: doc.id };
                
                const div = document.createElement('div'); div.className = 'compact-news-row'; div.onclick = () => openLobbyDetail('result', modalData);
                div.innerHTML = `<div class="compact-left"><div style="font-size:1.5em;">🏁</div></div><div class="compact-mid"><div class="compact-title">${team1Name} vs ${team2Name}</div><div class="compact-subtitle">${scoreStr}</div></div><div class="compact-right"><span style="font-size:0.8em; color:#28a745; font-weight:bold;">Sonuç</span></div>`;
                announcementsContainer.appendChild(div);
            });
        } catch (e) { announcementsContainer.innerHTML = '<p style="color:red; text-align:center;">Yüklenemedi.</p>'; }
    }

function loadOpenRequests() {
        if(!openRequestsContainer) return; openRequestsContainer.innerHTML = '<p style="text-align:center; color:#999; margin-top:10px;">Yükleniyor...</p>';
        const currentUserID = auth.currentUser.uid; const myLeague = getPlayerLeague(userMap[currentUserID]?.toplamPuan || 0);
        db.collection('matches').where('durum', '==', 'Acik_Ilan').orderBy('tarih', 'desc').get().then(snapshot => {
            openRequestsContainer.innerHTML = '';
            if(snapshot.empty) { openRequestsContainer.innerHTML = '<p style="text-align:center; color:#999; font-size:0.9em; padding:10px;">Açık ilan yok.</p>'; return; }
            snapshot.forEach(doc => {
                const data = doc.data(); if(data.oyuncu1ID === currentUserID) return;
                const p1 = userMap[data.oyuncu1ID]; const p1Name = p1?.isim || 'Bilinmiyor';
                
                // --- ÇİFTLER İÇİN TAKIM İSİMLERİ ---
                let team1Name = p1Name.split(' ')[0];
                if (!(data.macFormati || '').includes('Tekler') && data.oyuncu1PartnerID && userMap[data.oyuncu1PartnerID]) {
                    team1Name += ` & ${userMap[data.oyuncu1PartnerID].isim.split(' ')[0]}`;
                }
                // ------------------------------------

                const isChallenge = data.macTipi === 'Meydan Okuma'; const badgeClass = isChallenge ? 'bg-orange-light' : 'bg-green-light'; const badgeText = isChallenge ? `${data.bahisPuani} P` : 'Dostluk';
                const allowed = data.allowedLeagues || ['Bronz', 'Gümüş', 'Altın']; const isEligible = allowed.includes(myLeague);
                const commentary = generateAdvancedCommentary('open_ad', { p1Name: team1Name, wager: data.bahisPuani, matchId: doc.id });
                
                const modalData = { 
                    p1Name: team1Name, 
                    p1Photo: p1?.fotoURL || getSafeAvatar(p1Name), 
                    wager: data.bahisPuani, 
                    matchType: data.macTipi, 
                    macFormati: data.macFormati || 'Tekler',
                    commentary, 
                    matchId: doc.id, 
                    isEligible, 
                    isChallenge, 
                    headerTitle: isChallenge ? 'Meydan Okuma' : 'Dostluk Maçı',
                    oyuncu1ID: data.oyuncu1ID 
                };

                const div = document.createElement('div'); div.className = 'compact-news-row'; if(!isEligible) div.style.opacity = '0.6'; div.onclick = () => openLobbyDetail('ad', modalData);
                div.innerHTML = `<div class="compact-left"><img src="${p1?.fotoURL || getSafeAvatar(p1Name)}" class="compact-avatar"></div><div class="compact-mid"><div class="compact-title">${team1Name}</div><div class="compact-subtitle">${isChallenge ? 'Meydan Okuma' : 'Dostluk Maçı'} ${!(data.macFormati || '').includes('Tekler') ? '(Çiftler 👥)' : ''}</div></div><div class="compact-right"><span class="compact-badge ${badgeClass}">${badgeText}</span></div>`;
                openRequestsContainer.appendChild(div);
            });
        });
    }

function loadScheduledMatches() {
        if(!scheduledMatchesContainer) return; scheduledMatchesContainer.innerHTML = '<p style="text-align:center; color:#999; margin-top:10px;">Yükleniyor...</p>';
        db.collection('matches').where('durum', '==', 'Hazır').get().then(snapshot => {
            scheduledMatchesContainer.innerHTML = ''; let matches = [];
            snapshot.forEach(doc => matches.push({ ...doc.data(), id: doc.id }));
            matches.sort((a, b) => (a.macZamani ? a.macZamani.toMillis() : 9e12) - (b.macZamani ? b.macZamani.toMillis() : 9e12));
            if(matches.length === 0) { scheduledMatchesContainer.innerHTML = '<p style="text-align:center; color:#999; font-size:0.9em; padding:10px;">Planlanmış maç yok.</p>'; return; }
            matches.forEach(match => {
                const p1 = userMap[match.oyuncu1ID]; const p2 = userMap[match.oyuncu2ID]; 
                const p1Name = p1?.isim || 'O1'; const p2Name = p2?.isim || 'O2';
                
                // --- ÇİFTLER İÇİN TAKIM İSİMLERİ ---
                let team1Name = p1Name.split(' ')[0];
                if (!(match.macFormati || '').includes('Tekler') && match.oyuncu1PartnerID && userMap[match.oyuncu1PartnerID]) {
                    team1Name += ` & ${userMap[match.oyuncu1PartnerID].isim.split(' ')[0]}`;
                }
                let team2Name = p2Name.split(' ')[0];
                if (!(match.macFormati || '').includes('Tekler') && match.oyuncu2PartnerID && userMap[match.oyuncu2PartnerID]) {
                    team2Name += ` & ${userMap[match.oyuncu2PartnerID].isim.split(' ')[0]}`;
                }
                // ------------------------------------

                let dateDisplay = 'Planlanıyor'; let timeStr = 'Tarih Bekleniyor'; let location = match.macYeri || 'Kort Seçilmedi';
                if (match.macZamani) { const d = match.macZamani.toDate(); dateDisplay = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }); timeStr = d.toLocaleString('tr-TR', { day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' }); }
                
                const modalData = { p1Name: team1Name, p2Name: team2Name, p1Photo: p1?.fotoURL || getSafeAvatar(p1Name), p2Photo: p2?.fotoURL || getSafeAvatar(p2Name), matchId: match.id, timeStr, location, contextMsg: "Maç detaylarını ve konum bilgisini buradan görebilirsin." };
                const div = document.createElement('div'); div.className = 'compact-news-row'; div.onclick = () => openLobbyDetail('schedule', modalData);
                div.innerHTML = `<div class="compact-left"><div style="font-size:1.5em; width:36px; text-align:center;">📅</div></div><div class="compact-mid"><div class="compact-title">${team1Name} vs ${team2Name}</div><div class="compact-subtitle">${location}</div></div><div class="compact-right"><span class="compact-badge bg-blue-light">${dateDisplay}</span></div>`;
                scheduledMatchesContainer.appendChild(div);
            });
        });
    }

async function acceptOpenRequest(matchId, wager, type, macFormati) {
        let partnerID = null;
        if (macFormati !== 'Tekler') {
            const partnerSelect = document.getElementById('accept-ad-partner');
            if (!partnerSelect || !partnerSelect.value) return alert("Çiftler maçı için lütfen bir partner seçin!");
            partnerID = partnerSelect.value;
        }

        if(!confirm("Bu maçı kabul etmek istiyor musun?")) return;
        const myUid = auth.currentUser.uid; const me = userMap[myUid];
        
        if (type === 'Meydan Okuma') {
            if (me.toplamPuan < 0) return alert("Puanın eksiye düştüğü için bahisli maç kabul edemezsin.");
            if (wager > me.toplamPuan * 0.5) return alert(`Bu maç için puanın yetersiz.`);
        }
try { 
            await db.collection('matches').doc(matchId).update({ 
                oyuncu2ID: myUid, 
                oyuncu2PartnerID: partnerID,
                durum: 'Hazır' 
            }); 
            
            // İlan sahibine bildirim gönder (Veritabanından ilan sahibini bulup mail atıyoruz)
            db.collection('matches').doc(matchId).get().then(doc => {
                const m = doc.data();
                if(m && m.oyuncu1ID) {
                    const subject = "✅ Kort İlanın Kabul Edildi!";
                    const body = `<p><strong>${me.isim}</strong> açık kort ilanını kabul etti!</p><p>Hemen uygulamaya girip maç tarihini ve kortu belirleyebilirsiniz.</p><p><a href="https://bursatenisligi.github.io/TenisLig/">Uygulamaya Git</a></p>`;
                    sendNotificationEmail(m.oyuncu1ID, subject, body);
                }
            });

            alert("Maç kabul edildi! İlan sahibine bildirim gönderildi. 📨"); 
            document.getElementById('lobby-detail-modal').style.display='none'; 
            document.querySelector('[data-target="tab-matches"]').click(); 
        } catch (error) { alert("Hata: Maç kabul edilemedi."); loadOpenRequests(); }
    }

    function loadMyMatchesOverview() {
        if(!myActiveMatchesContainer || !myPendingMatchesContainer || !myHistoryMatchesContainer) return;
        myActiveMatchesContainer.innerHTML = '<p style="text-align:center;">Yükleniyor...</p>'; myPendingMatchesContainer.innerHTML = '<p style="text-align:center;">Yükleniyor...</p>'; myHistoryMatchesContainer.innerHTML = '<p style="text-align:center;">Yükleniyor...</p>';
        const currentUserID = auth.currentUser.uid;
        const q1 = db.collection('matches').where('oyuncu1ID', '==', currentUserID).get(); const q2 = db.collection('matches').where('oyuncu2ID', '==', currentUserID).get();
        if (histFilterCourt && histFilterCourt.options.length === 1) { ['Toprak', 'Sert'].forEach(c => { const opt = document.createElement('option'); opt.value = c; opt.textContent = c; histFilterCourt.appendChild(opt); }); }

        Promise.all([q1, q2]).then(snapshots => {
            let allMatches = [];
            snapshots.forEach(snap => { snap.forEach(doc => allMatches.push({ ...doc.data(), id: doc.id })); });
            allMatches = allMatches.filter((match, index, self) => index === self.findIndex((t) => (t.id === match.id)));
            allMatches.sort((a, b) => { const dateA = a.tarih ? a.tarih.seconds : 0; const dateB = b.tarih ? b.tarih.seconds : 0; return dateB - dateA; });
            const activeMatches = allMatches.filter(m => ['Hazır', 'Sonuç_Bekleniyor'].includes(m.durum));
            const pendingMatches = allMatches.filter(m => ['Bekliyor', 'Acik_Ilan'].includes(m.durum));
            const historyMatches = allMatches.filter(m => m.durum === 'Tamamlandı');
            renderMatchSection(activeMatches, myActiveMatchesContainer, 'active'); renderMatchSection(pendingMatches, myPendingMatchesContainer, 'pending'); renderMatchSection(historyMatches.slice(0, 10), myHistoryMatchesContainer, 'history');
        });
    }

function createModernMatchHTML(match, currentUserID, isFixture = false) {
        const p1 = userMap[match.oyuncu1ID]; const p2 = userMap[match.oyuncu2ID];
        const p1Name = p1?.isim || '???'; const p2Name = p2 ? (p2.isim || '???') : 'Bekleniyor';
        
        let team1Name = p1Name.split(' ')[0]; 
        if (match.oyuncu1PartnerID && userMap[match.oyuncu1PartnerID]) {
            team1Name += ` & ${userMap[match.oyuncu1PartnerID].isim.split(' ')[0]}`;
        }
        let team2Name = p2Name.split(' ')[0];
        if (match.oyuncu2PartnerID && userMap[match.oyuncu2PartnerID]) {
            team2Name += ` & ${userMap[match.oyuncu2PartnerID].isim.split(' ')[0]}`;
        }
        let title = `${team1Name} vs ${team2Name}`; 

        const displayPhoto = (match.oyuncu1ID === currentUserID || match.oyuncu1PartnerID === currentUserID) ? (p2?.fotoURL || getSafeAvatar(p2Name)) : (p1?.fotoURL || getSafeAvatar(p1Name));
        let badgeClass = 'bg-gray-light'; let iconStr = '⏳'; let statusText = match.durum;
        
        if(match.durum === 'Hazır') { badgeClass = 'bg-blue-light'; iconStr = '📅'; statusText = 'Oynanacak'; }
        else if(match.durum === 'Bekliyor') { badgeClass = 'bg-orange-light'; iconStr = '📩'; statusText = 'Teklif'; }
        else if(match.durum === 'Sonuç_Bekleniyor') { badgeClass = 'bg-purple-light'; iconStr = '⚖️'; statusText = 'Onay'; }
        else if(match.durum === 'Tamamlandı') { badgeClass = 'bg-green-light'; iconStr = '✅'; statusText = 'Bitti'; }
        else if(match.durum === 'Acik_Ilan') { badgeClass = 'bg-green-light'; iconStr = '📢'; statusText = 'İlan'; }

        let subText = match.macYeri || 'Kort Seçilmedi'; let rightInfo = '';
        
        if (match.durum === 'Tamamlandı' && match.skor) {
            const s = match.skor; 
            subText = `${s.s1_me}-${s.s1_opp}, ${s.s2_me}-${s.s2_opp}` + (s.s3_me || s.s3_opp ? `, ${s.s3_me}-${s.s3_opp}` : ''); 
            rightInfo = `<span style="font-weight:bold; color:#333;">${iconStr}</span>`;
        } else if (match.macZamani) {
            const d = match.macZamani.toDate(); const dateStr = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }); const timeStr = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); rightInfo = `<div style="text-align:right; line-height:1.2;"><div style="font-weight:bold;">${dateStr}</div><div style="font-size:0.8em;">${timeStr}</div></div>`;
        } else { 
            rightInfo = `<span class="compact-badge ${badgeClass}">${statusText}</span>`; 
        }

        const targetTab = isFixture ? 'tab-fixture' : 'tab-matches';
        return `<div class="compact-news-row" onclick="returnToTab='${targetTab}'; showMatchDetail('${match.id}')"><div class="compact-left"><img src="${displayPhoto}" class="compact-avatar" style="width:40px; height:40px;"></div><div class="compact-mid"><div class="compact-title">${title}</div><div class="compact-subtitle">${subText}</div></div><div class="compact-right">${rightInfo}</div></div>`;
    }

    function renderMatchSection(matches, container, type) {
        container.innerHTML = '';
        if (matches.length === 0) { container.innerHTML = `<div style="text-align:center; padding:20px; color:#999; font-style:italic;">Kayıt bulunamadı.</div>`; return; }
        const currentUserID = auth.currentUser.uid;
        matches.forEach(match => { container.innerHTML += createModernMatchHTML(match, currentUserID, false); });
    }

    function filterMyHistoryMatches() {
        const currentUserID = auth.currentUser.uid; myHistoryMatchesContainer.innerHTML = '<p style="text-align:center;">Filtreleniyor...</p>';
        const start = histFilterStart.value ? new Date(histFilterStart.value) : null; const end = histFilterEnd.value ? new Date(histFilterEnd.value) : null; const pName = histFilterPlayerName.value.toLowerCase().trim(); const court = histFilterCourt.value;
        const q1 = db.collection('matches').where('oyuncu1ID', '==', currentUserID).where('durum', '==', 'Tamamlandı').get(); const q2 = db.collection('matches').where('oyuncu2ID', '==', currentUserID).where('durum', '==', 'Tamamlandı').get();

        Promise.all([q1, q2]).then(snapshots => {
            let matches = []; snapshots.forEach(snap => snap.forEach(doc => matches.push({ ...doc.data(), id: doc.id })));
            matches.sort((a, b) => (b.tarih ? b.tarih.seconds : 0) - (a.tarih ? a.tarih.seconds : 0));
            const filtered = matches.filter(m => {
                const mDate = m.macZamani ? m.macZamani.toDate() : (m.tarih ? m.tarih.toDate() : null);
                if (start && (!mDate || mDate < start)) return false;
                if (end) { const e = new Date(end); e.setHours(23,59,59); if (!mDate || mDate > e) return false; }
                if (court && m.kortTipi !== court) return false;
                if (pName) { const oid = m.oyuncu1ID === currentUserID ? m.oyuncu2ID : m.oyuncu1ID; const oname = (userMap[oid]?.isim || '').toLowerCase(); if (!oname.includes(pName)) return false; }
                return true;
            });
            renderMatchSection(filtered, myHistoryMatchesContainer, 'history');
        });
    }

    function loadMatchesForFixture() {
        isReadOnlyView = true;
        if(fixtureActiveContainer) fixtureActiveContainer.innerHTML = '<p style="text-align:center;">Yükleniyor...</p>'; if(fixturePendingContainer) fixturePendingContainer.innerHTML = '<p style="text-align:center;">Yükleniyor...</p>'; if(fixtureHistoryContainer) fixtureHistoryContainer.innerHTML = '<p style="text-align:center;">Yükleniyor...</p>';
        if (filterCourt && filterCourt.options.length === 1) { ['Toprak', 'Sert'].forEach(c => { const opt = document.createElement('option'); opt.value = c; opt.textContent = c; filterCourt.appendChild(opt); }); }

        db.collection('matches').where('durum', 'in', ['Bekliyor', 'Hazır', 'Sonuç_Bekleniyor']).get().then(snapshot => {
            let activeMatches = []; let pendingMatches = [];
            snapshot.forEach(doc => {
                const match = { ...doc.data(), id: doc.id };
                if (['Hazır', 'Sonuç_Bekleniyor'].includes(match.durum)) { activeMatches.push(match); } else if (match.durum === 'Bekliyor') { pendingMatches.push(match); }
            });
            const sortFn = (a, b) => { const dateA = a.macZamani ? a.macZamani.seconds : (a.tarih ? a.tarih.seconds : 0); const dateB = b.macZamani ? b.macZamani.seconds : (b.tarih ? b.tarih.seconds : 0); return dateB - dateA; };
            activeMatches.sort(sortFn); pendingMatches.sort(sortFn);
            renderFixtureSection(activeMatches, fixtureActiveContainer); renderFixtureSection(pendingMatches, fixturePendingContainer);
        });

        db.collection('matches').where('durum', '==', 'Tamamlandı').get().then(snapshot => {
            let historyMatches = [];
            const fStart = filterDateStart.value ? new Date(filterDateStart.value) : null; const fEnd = filterDateEnd.value ? new Date(filterDateEnd.value) : null; const fCourt = filterCourt.value; const fPlayer = filterPlayer.value;
            snapshot.forEach(doc => {
                const match = doc.data();
                if (fStart || fEnd) { const d = match.macZamani ? match.macZamani.toDate() : (match.tarih ? match.tarih.toDate() : null); if (!d) return; if (fStart) { fStart.setHours(0,0,0,0); if (d < fStart) return; } if (fEnd) { fEnd.setHours(23,59,59,999); if (d > fEnd) return; } }
                if (fCourt && match.kortTipi !== fCourt) return;
                if (fPlayer && match.oyuncu1ID !== fPlayer && match.oyuncu2ID !== fPlayer) return;
                historyMatches.push({ ...match, id: doc.id });
            });
            historyMatches.sort((a, b) => { const dateA = a.macZamani ? a.macZamani.seconds : (a.tarih ? a.tarih.seconds : 0); const dateB = b.macZamani ? b.macZamani.seconds : (b.tarih ? b.tarih.seconds : 0); return dateB - dateA; });
            renderFixtureSection(historyMatches, fixtureHistoryContainer);
        });
    }

    function renderFixtureSection(matches, container) {
        if(!container) return; container.innerHTML = '';
        if (matches.length === 0) { container.innerHTML = '<div style="text-align:center; padding:20px; color:#999;">Veri yok.</div>'; return; }
        const currentUserID = auth.currentUser.uid;
        matches.forEach(match => { container.innerHTML += createModernMatchHTML(match, currentUserID, true); });
    }

    function renderBadges(userId, containerId) {
        const container = document.getElementById(containerId); if(!container) return; container.innerHTML = '...';
        const user = userMap[userId]; if(!user) { container.innerHTML = ''; return; }
        const userBadges = user.badges || []; container.innerHTML = '';
        Object.keys(BADGE_DEFINITIONS).forEach(key => {
            const def = BADGE_DEFINITIONS[key]; const hasBadge = userBadges.includes(key);
            const badgeEl = document.createElement('div'); badgeEl.className = `badge-item ${hasBadge ? 'earned' : 'locked'}`; badgeEl.setAttribute('data-desc', def.desc);
            badgeEl.innerHTML = `<div class="badge-icon">${def.icon}</div><div class="badge-name">${def.name}</div>`; container.appendChild(badgeEl);
        });
    }

// --- OYUNCU (VE PARTNER) İSTATİSTİK HESAPLAMA MOTORU (GARANTİLİ VERSİYON) ---
// --- OYUNCU (VE PARTNER) İSTATİSTİK HESAPLAMA MOTORU (GARANTİLİ & TURNUVA UYUMLU VERSİYON) ---
    async function calculateAdvancedStats(userId) {
        // Firebase'i yormadan tüm tamamlanmış maçları çek
        const allMatchesSnap = await db.collection('matches').where('durum', '==', 'Tamamlandı').get();
        let allMatches = [];
        
        allMatchesSnap.forEach(doc => {
            const m = doc.data();
            if (m.oyuncu1ID === userId || m.oyuncu2ID === userId || m.oyuncu1PartnerID === userId || m.oyuncu2PartnerID === userId) {
                allMatches.push({ ...m, id: doc.id });
            }
        });
        
        allMatches.sort((a, b) => { 
    // Önce skor girilme tarihi, yoksa maç planı tarihi, o da yoksa oluşturulma tarihine göre en günceli bulur
    const tA = a.skorTarihi ? a.skorTarihi.seconds : (a.macZamani ? a.macZamani.seconds : (a.tarih ? a.tarih.seconds : 0)); 
    const tB = b.skorTarihi ? b.skorTarihi.seconds : (b.macZamani ? b.macZamani.seconds : (b.tarih ? b.tarih.seconds : 0)); 
    return tB - tA; 
});

        let stats = { played: 0, won: 0, setsPlayed: 0, setsWon: 0, gamesPlayed: 0, gamesWon: 0, clay: { played: 0, won: 0 }, hard: { played: 0, won: 0 }, form: [] };

        allMatches.forEach(m => {
            stats.played++; 
            
            let isWinner = false;
            if (m.kayitliKazananID === userId) isWinner = true; 
            else if (m.kayitliKazananID === m.oyuncu1ID && m.oyuncu1PartnerID === userId) isWinner = true; 
            else if (m.kayitliKazananID === m.oyuncu2ID && m.oyuncu2PartnerID === userId) isWinner = true; 

            if (isWinner) stats.won++;
            if(stats.form.length < 5) stats.form.push(isWinner ? 'W' : 'L');
            
            let surface = 'other'; const courtType = (m.kortTipi || '').toLocaleLowerCase('tr-TR');
            if(courtType.includes('toprak')) surface = 'clay'; else if(courtType.includes('sert')) surface = 'hard';
            if(surface !== 'other') { stats[surface].played++; if(isWinner) stats[surface].won++; }

            if (m.skor) {
                const s = m.skor; const sets = [{p1: s.s1_me, p2: s.s1_opp}, {p1: s.s2_me, p2: s.s2_opp}, {p1: s.s3_me, p2: s.s3_opp, tb: true}];
                sets.forEach(set => {
                    let myG = 0, opG = 0;
                    
                    if (m.macTipi === 'Turnuva') {
                        // YENİ: Turnuvalarda skor kutuları sabittir (p1=Takım1, p2=Takım2)
                        const isTeam1 = (m.oyuncu1ID === userId || m.oyuncu1PartnerID === userId);
                        if (isTeam1) { 
                            myG = parseInt(set.p1 || 0); 
                            opG = parseInt(set.p2 || 0); 
                        } else { 
                            myG = parseInt(set.p2 || 0); 
                            opG = parseInt(set.p1 || 0); 
                        }
                    } else {
                        // Normal maçlarda ayna (Skoru girene göre Ben/Rakip) mantığı
                        const isMyTeamScore = (m.sonucuGirenID === userId) || 
                                              (m.sonucuGirenID === m.oyuncu1ID && m.oyuncu1PartnerID === userId) ||
                                              (m.sonucuGirenID === m.oyuncu2ID && m.oyuncu2PartnerID === userId);

                        if (isMyTeamScore) { 
                            myG = parseInt(set.p1 || 0); 
                            opG = parseInt(set.p2 || 0); 
                        } else { 
                            myG = parseInt(set.p2 || 0); 
                            opG = parseInt(set.p1 || 0); 
                        }
                    }
                    
                    if(myG + opG > 0) { 
                        stats.setsPlayed++; 
                        if(myG > opG) stats.setsWon++; 
                        // Tie-Break seti oyun sayısına eklenmez
                        if(!set.tb) { stats.gamesPlayed += (myG + opG); stats.gamesWon += myG; } 
                    }
                });
            }
        });
        return stats;
    }

    async function updateStatsView(targetUserId) {
        if(!targetUserId) targetUserId = auth.currentUser.uid; statFormBadges.innerHTML = '...';
        const user = userMap[targetUserId]; const stats = await calculateAdvancedStats(targetUserId);

        sstatTotalMatch.textContent = stats.played; statTotalWin.textContent = stats.won; 
        statTotalPointsDisplay.textContent = user ? (user.toplamPuan || 0) : 0;
        const statDoublesPointsDisplay = document.getElementById('stat-doubles-points');
        if (statDoublesPointsDisplay) {
            statDoublesPointsDisplay.textContent = user ? (user.ciftlerPuani !== undefined ? user.ciftlerPuani : 1000) : 1000;
        }
        const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0; const setRate = stats.setsPlayed > 0 ? Math.round((stats.setsWon / stats.setsPlayed) * 100) : 0; const gameRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;

        updateCircleChart(chartWinRate, winRate); updateCircleChart(chartSetRate, setRate); updateCircleChart(chartGameRate, gameRate);
        updateBarChart(barClay, valClay, stats.clay); updateBarChart(barHard, valHard, stats.hard);

        statFormBadges.innerHTML = '';
        if(stats.form.length === 0) { statFormBadges.innerHTML = '<span style="font-size:0.8em; color:#999;">Veri yok</span>'; } else { stats.form.forEach(res => { const b = document.createElement('div'); b.className = `form-badge ${res==='W'?'form-w':'form-l'}`; b.textContent = res === 'W' ? 'G' : 'M'; statFormBadges.appendChild(b); }); }
    }

    function updateCircleChart(el, percent) { el.style.setProperty('--p', percent); el.querySelector('span').textContent = `%${percent}`; }
    function updateBarChart(barEl, valEl, data) { const rate = data.played > 0 ? Math.round((data.won / data.played) * 100) : 0; barEl.style.width = `${rate}%`; valEl.textContent = `%${rate}`; }

    if(statsViewPlayerSelect) { statsViewPlayerSelect.addEventListener('change', (e) => { e.target.blur(); const val = e.target.value; updateStatsView(val === 'me' ? auth.currentUser.uid : val); }); }

    async function showPlayerStats(userId) {
        statsPlayerName.textContent = 'Yükleniyor...'; statsTotalPoints.textContent = '-'; statsCourtPref.innerHTML = '';
        if(statsPlayerPhoto) statsPlayerPhoto.src = 'logo.png'; 
        document.getElementById('stats-badges-grid').innerHTML = ''; document.getElementById('stats-form-badges').innerHTML = '';

        try {
            const u = userMap[userId]; if(!u) return;
            statsPlayerName.textContent = u.isim || 'İsimsiz Oyuncu'; 
            statsTotalPoints.textContent = u.toplamPuan || 0; 
            const statsDoublesPoints = document.getElementById('stats-doubles-points');
            if (statsDoublesPoints) {
                statsDoublesPoints.textContent = u.ciftlerPuani !== undefined ? u.ciftlerPuani : 1000;
            } 
            
            let infoText = "";
            if (u.kulup && u.kulup !== 'Belirtilmemiş') { infoText += `🏟️ ${u.kulup}`; }
            const duration = calculateTennisDuration(u.tenisBaslangic);
            if (duration) { if (infoText) infoText += " | "; infoText += `⏳ ${duration}`; }
            
            statsCourtPref.innerHTML = `${u.kortTercihi || '-'} <br><span style="font-size:0.85em; color:#777; font-weight:normal;">${infoText}</span>`;
            if(statsPlayerPhoto) statsPlayerPhoto.src = u.fotoURL || getSafeAvatar(u.isim || 'A');
            
            renderBadges(userId, 'stats-badges-grid');

            if(startChatBtn) {
                if (userId === auth.currentUser.uid) { startChatBtn.style.display = 'none'; } else { startChatBtn.style.display = 'block'; startChatBtn.onclick = () => openChat(userId, u.isim); }
            }
            
            playerStatsModal.style.display = 'flex'; 
            
            const stats = await calculateAdvancedStats(userId);
            const matchRate = stats.played > 0 ? ((stats.won / stats.played) * 100).toFixed(0) : 0; const setRate = stats.setsPlayed > 0 ? ((stats.setsWon / stats.setsPlayed) * 100).toFixed(0) : 0; const gameRate = stats.gamesPlayed > 0 ? ((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(0) : 0;
            
            document.getElementById('pie-match-chart').style.setProperty('--p', matchRate); document.getElementById('text-match-rate').textContent = `%${matchRate}`;
            document.getElementById('pie-set-chart').style.setProperty('--p', setRate); document.getElementById('text-set-rate').textContent = `%${setRate}`;
            document.getElementById('pie-game-chart').style.setProperty('--p', gameRate); document.getElementById('text-game-rate').textContent = `%${gameRate}`;
            
  const h2hBox = document.getElementById('stats-h2h-box');
            if (userId !== auth.currentUser.uid) {
                h2hBox.style.display = 'block'; h2hBox.innerHTML = 'Aramızdaki Maçlar Yükleniyor...';
                const myId = auth.currentUser.uid;
                
                // --- YENİ H2H (ARAMIZDAKİ MAÇLAR) HESAPLAMASI ---
                // Tüm maçları çekip çiftler/partner durumlarını lokal olarak güvenle ayırıyoruz
                db.collection('matches').where('durum', '==', 'Tamamlandı').get().then(snap => {
                    let myWins = 0, oppWins = 0;
                    snap.forEach(doc => {
                        const m = doc.data();
                        // Maçtaki tüm oyuncuların (partnerler dahil) ID'lerini topla
                        const players = [m.oyuncu1ID, m.oyuncu2ID, m.oyuncu1PartnerID, m.oyuncu2PartnerID].filter(Boolean);
                        
                        // Eğer ikimiz de bu maçtaysak (İster kaptan ister partner olalım)
                        if (players.includes(myId) && players.includes(userId)) {
                            
                            // Takımları ayır
                            const team1 = [m.oyuncu1ID, m.oyuncu1PartnerID].filter(Boolean);
                            const team2 = [m.oyuncu2ID, m.oyuncu2PartnerID].filter(Boolean);
                            
                            const iAmTeam1 = team1.includes(myId);
                            const oppIsTeam1 = team1.includes(userId);
                            
                            // Sadece "Farklı takımlardaysak" (Rakipsek) hesaba kat. Aynı takımda partnersek H2H sayılmaz.
                            if (iAmTeam1 !== oppIsTeam1) {
                                let isMyTeamWinner = false;
                                let isOppTeamWinner = false;
                                
                                if (m.kayitliKazananID) {
                                    if (team1.includes(m.kayitliKazananID)) {
                                        if (iAmTeam1) isMyTeamWinner = true; else isOppTeamWinner = true;
                                    } else if (team2.includes(m.kayitliKazananID)) {
                                        if (!iAmTeam1) isMyTeamWinner = true; else isOppTeamWinner = true;
                                    }
                                }
                                
                                if (isMyTeamWinner) myWins++;
                                else if (isOppTeamWinner) oppWins++;
                            }
                        }
                    });
                    h2hBox.innerHTML = `🆚 Aramızdaki Maçlar: <span style="color:#28a745">Sen ${myWins}</span> - <span style="color:#dc3545">${oppWins} Rakip</span>`;
                });
                // ------------------------------------------------
                
            } else { h2hBox.style.display = 'none'; }

            const formContainer = document.getElementById('stats-form-badges'); formContainer.innerHTML = '';
            if (stats.form.length === 0) { formContainer.innerHTML = '<span style="font-size:0.8em; color:#999;">Henüz maç yok</span>'; } else {
                stats.form.forEach(result => { const badge = document.createElement('div'); badge.className = `form-badge ${result === 'W' ? 'form-w' : 'form-l'}`; badge.textContent = result === 'W' ? 'G' : 'M'; formContainer.appendChild(badge); });
            }

            const statsContainer = document.querySelector('#player-stats-modal .stats-container');
            let photosContainer = document.getElementById('player-stats-photos');
            if (!photosContainer) { photosContainer = document.createElement('div'); photosContainer.id = 'player-stats-photos'; photosContainer.style.marginTop = '20px'; photosContainer.style.borderTop = '1px solid #eee'; photosContainer.style.paddingTop = '15px'; statsContainer.appendChild(photosContainer); }
            photosContainer.innerHTML = '<p style="text-align:center; color:#999; font-size:0.9em;">Fotoğraflar taranıyor...</p>';

 // Fotoğrafları hatasız çekme
            const photoSnap = await db.collection('matches').where('durum', '==', 'Tamamlandı').get();
            let photos = [];
            photoSnap.forEach(doc => {
                const m = doc.data();
                if (m.oyuncu1ID === userId || m.oyuncu2ID === userId || m.oyuncu1PartnerID === userId || m.oyuncu2PartnerID === userId) {
                    if (m.macFotoURL) {
                        photos.push({ ...m, id: doc.id, dateObj: m.macZamani ? m.macZamani.toDate() : (m.tarih ? m.tarih.toDate() : new Date()) });
                    }
                }
            });
            photos.sort((a,b) => b.dateObj - a.dateObj);
            
            if (photos.length === 0) { photosContainer.innerHTML = '<div style="text-align:center; color:#ccc; font-size:0.8em; margin-top:10px;">Bu oyuncunun maç fotoğrafı yok. 📷</div>'; return; }
            let galleryHTML = '<h4 style="color:#555; text-align:center; border:none; margin-bottom:10px; font-size:0.9em; text-transform:uppercase;">📸 Maç Kareleri</h4><div class="gallery-grid">';
            photos.forEach(item => { const dateStr = item.dateObj ? item.dateObj.toLocaleString('tr-TR', { day: 'numeric', month: 'short' }) : ''; galleryHTML += `<div class="gallery-item" onclick="document.getElementById('player-stats-modal').style.display='none'; showMatchDetail('${item.id}')"><img src="${item.macFotoURL}" class="gallery-img" loading="lazy"><div class="gallery-date-badge">${dateStr}</div></div>`; });
            galleryHTML += '</div>'; photosContainer.innerHTML = galleryHTML;

        } catch (error) { console.error("İstatistik hatası:", error); document.getElementById('stats-form-badges').innerHTML = '<span style="color:red; font-size:0.8em;">Veri alınamadı</span>'; }
    }

function showMatchDetail(matchDocId) {
        tabSections.forEach(s => s.style.display = 'none'); matchDetailView.style.display = 'block'; currentMatchDocId = matchDocId;
        if(matchUploadPreview) { matchUploadPreview.style.display='none'; matchUploadPreview.src=''; }
        if(matchResultPhotoInput) { matchResultPhotoInput.value = ''; }
        if(detailMatchPhoto) { detailMatchPhoto.style.display='none'; detailMatchPhoto.src=''; }
        actionButtonsContainer.innerHTML = ''; document.getElementById('result-message').textContent = '';

        const currentUserID = auth.currentUser.uid;

        // EKSİK OLAN KISIM BURASIYDI: "async" ekledik ve değişkenleri tanımladık
        db.collection('matches').doc(matchDocId).get().then(async doc => {
            const match = doc.data();
            
            // 1. KİMLİK KONTROLLERİ (Hatanın Çözüldüğü Yer)
            const isParticipant = (currentUserID === match.oyuncu1ID || currentUserID === match.oyuncu2ID || currentUserID === match.oyuncu1PartnerID || currentUserID === match.oyuncu2PartnerID);
            
            let isTourAdmin = false;
            if (match.tournamentId) {
                try {
                    const tourSnap = await db.collection('tournaments').doc(match.tournamentId).get();
                    if (tourSnap.exists && tourSnap.data().creatorId === currentUserID) {
                        isTourAdmin = true;
                    }
                } catch(e) { console.error("Turnuva admini kontrol edilirken hata:", e); }
            }

            const p1Name = userMap[match.oyuncu1ID]?.isim || '???'; 
            const p2Name = match.oyuncu2ID ? (userMap[match.oyuncu2ID]?.isim || '???') : 'Henüz Yok';
            
            // --- ÇİFTLER İÇİN TAKIM İSİMLERİ OLUŞTURMA ---
            let team1Name = p1Name.split(' ')[0]; 
            if (!(match.macFormati || '').includes('Tekler') && match.oyuncu1PartnerID && userMap[match.oyuncu1PartnerID]) {
                team1Name += ` & ${userMap[match.oyuncu1PartnerID].isim.split(' ')[0]}`;
            }
            let team2Name = p2Name.split(' ')[0];
            if (!(match.macFormati || '').includes('Tekler') && match.oyuncu2PartnerID && userMap[match.oyuncu2PartnerID]) {
                team2Name += ` & ${userMap[match.oyuncu2PartnerID].isim.split(' ')[0]}`;
            }
            // ---------------------------------------------
            
            winnerSelect.innerHTML = `<option value="">Kazanan Takımı Seçin</option><option value="${match.oyuncu1ID}">${team1Name}</option>`;
            if(match.oyuncu2ID) winnerSelect.innerHTML += `<option value="${match.oyuncu2ID}">${team2Name}</option>`;
            
            let infoHTML = `<h3>${match.macTipi} ${!(match.macFormati || '').includes('Tekler') ? '<span style="color:#28a745; font-size:0.8em;">(Çiftler 👥)</span>' : ''}</h3><p><strong>${team1Name}</strong> <br><span style="color:#999; font-size:0.8em;">vs</span><br> <strong>${team2Name}</strong></p><p>Bahis: ${match.bahisPuani} Puan</p>`;
            if(match.durum === 'Acik_Ilan') infoHTML += `<p style="color:orange; font-weight:bold;">Bu bir açık ilandır.</p>`;
            
            const courtType = match.kortTipi ? ` (${match.kortTipi})` : '';
            if(match.macYeri && match.macZamani) { const d = match.macZamani.toDate().toLocaleString('tr-TR'); infoHTML += `<div style="background-color:#e2e6ea; padding:8px; border-radius:5px; margin-top:5px;">📍 <strong>${match.macYeri}${courtType}</strong><br>⏰ <strong>${d}</strong></div>`; } 
            else if (match.kortTipi) { infoHTML += `<div style="background-color:#e2e6ea; padding:8px; border-radius:5px; margin-top:5px;">Kort Tipi: <strong>${match.kortTipi}</strong></div>`; }
            
            if(match.macFotoURL && detailMatchPhoto) { detailMatchPhoto.src = match.macFotoURL; detailMatchPhoto.style.display = 'block'; }
            detailMatchInfo.innerHTML = infoHTML;

            const photoArea = document.getElementById('photo-upload-area'); const currentPhotoDisplay = document.getElementById('current-match-photo-display'); const previewImg = document.getElementById('standalone-photo-preview'); const photoInput = document.getElementById('standalone-photo-input');
            if(previewImg) { previewImg.style.display = 'none'; previewImg.src = ''; }
            if(photoInput) photoInput.value = '';

            const isEligibleStatus = ['Hazır', 'Sonuç_Bekleniyor', 'Tamamlandı'].includes(match.durum);
            if (isParticipant && isEligibleStatus && photoArea) {
                photoArea.style.display = 'block';
                if (match.macFotoURL && currentPhotoDisplay) { currentPhotoDisplay.src = match.macFotoURL; currentPhotoDisplay.style.display = 'block'; } else if(currentPhotoDisplay) { currentPhotoDisplay.style.display = 'none'; }
                const saveBtn = document.getElementById('btn-save-photo-only'); if(saveBtn) saveBtn.onclick = () => saveOnlyPhoto(matchDocId);
            } else if (photoArea) { photoArea.style.display = 'none'; }

            loadMatchInteractions(matchDocId, match);

            scoreInputSection.style.display = 'none'; scoreDisplaySection.style.display = 'none'; winnerSelect.style.display = 'none'; scheduleInputSection.style.display = 'none'; 
            
            if (chatFromMatchBtn) {
                if (match.oyuncu2ID && isParticipant) {
                    const opponentId = currentUserID === match.oyuncu1ID ? match.oyuncu2ID : match.oyuncu1ID;
                    const opponentName = userMap[opponentId]?.isim || 'Rakip';
                    chatFromMatchBtn.style.display = 'block'; chatFromMatchBtn.onclick = () => openChat(opponentId, opponentName);
                } else { chatFromMatchBtn.style.display = 'none'; }
            }
            
            // 2. YETKİ KONTROLÜ İLE BUTONLARI GÖSTER (Oyuncu veya Admin)
            if (!isParticipant && !isTourAdmin) {
                if (match.durum === 'Sonuç_Bekleniyor' || match.durum === 'Tamamlandı') {
                    const s = match.skor || {}; scoreDisplaySection.style.display = 'block';
                    let resText = match.durum === 'Tamamlandı' ? `<p style="color:green;">Kazanan: ${userMap[match.kayitliKazananID]?.isim}</p>` : `<p style="color:orange;">Sonuç Onayı Bekleniyor</p>`;
                    scoreDisplaySection.innerHTML = `<div style="background:#f1f1f1; padding:10px; border-radius:5px;"><p><strong>Skor:</strong> ${s.s1_me}-${s.s1_opp}, ${s.s2_me}-${s.s2_opp}, ${s.s3_me}-${s.s3_opp}</p>${resText}</div>`;
                } else { document.getElementById('result-message').textContent = "Bu maç henüz oynanmadı veya sonuç girilmedi."; }
                return;
            }
            
            if (match.durum === 'Acik_Ilan' && currentUserID === match.oyuncu1ID) {
                const dbn = document.createElement('button'); dbn.textContent = 'İlanı Kaldır 🗑️'; dbn.className = 'btn-reject'; dbn.onclick = () => deleteMatch(matchDocId, "İlan kaldırıldı."); actionButtonsContainer.appendChild(dbn); 
                return;
            }

            if (match.durum === 'Bekliyor') {
                if (currentUserID === match.oyuncu2ID) {
                    if (!(match.macFormati || '').includes('Tekler')) {
                        const label = document.createElement('label'); label.textContent = "Takım Arkadaşın (Partnerin):"; label.className = "input-label"; label.style.marginTop = "0";
                        const s = document.createElement('select'); s.id = 'accept-challenge-partner'; s.style.marginBottom = '15px'; s.innerHTML = '<option value="">Partnerini Seç</option>';
                        Object.values(userMap).forEach(p => { if(p.uid !== currentUserID && p.uid !== match.oyuncu1ID) { s.innerHTML += `<option value="${p.uid}">${p.isim || p.email}</option>`; } });
                        actionButtonsContainer.appendChild(label); actionButtonsContainer.appendChild(s);
                    }
                    const ab = document.createElement('button'); ab.textContent = 'Kabul Et ✅'; ab.className = 'btn-accept'; 
                    ab.onclick = async () => {
                        let partnerID = null;
                        if (!(match.macFormati || '').includes('Tekler')) {
                            const pSelect = document.getElementById('accept-challenge-partner');
                            if (!pSelect.value) return alert("Lütfen partnerini seç!"); partnerID = pSelect.value;
                        }
                        try {
                            await db.collection('matches').doc(matchDocId).update({ durum: 'Hazır', oyuncu2PartnerID: partnerID });
                            const myName = userMap[currentUserID]?.isim || 'Rakibin'; const subject = "✅ Maç Teklifin Kabul Edildi!";
                            const body = `<p><strong>${myName}</strong> maç teklifini kabul etti!</p><p>Hemen uygulamaya girip maç tarihini ve kortu belirleyebilirsiniz.</p><p><a href="https://bursatenisligi.github.io/TenisLig/">Uygulamaya Git</a></p>`;
                            sendNotificationEmail(match.oyuncu1ID, subject, body);
                            alert("Kabul edildi! Rakibine mail bildirimi gönderildi. 📨"); goBackToList();
                        } catch (err) { console.error(err); alert("Kabul edilirken hata oluştu: " + err.message); }
                    };
                    const rb = document.createElement('button'); rb.textContent = 'Reddet ❌'; rb.className = 'btn-reject'; rb.onclick = () => deleteMatch(matchDocId, "Reddedildi."); 
                    actionButtonsContainer.append(ab, rb);
                } else if (currentUserID === match.oyuncu1ID) {
                    const wb = document.createElement('button'); wb.textContent = 'Geri Çek ↩️'; wb.className = 'btn-withdraw'; wb.onclick = () => deleteMatch(matchDocId, "Geri çekildi."); actionButtonsContainer.appendChild(wb);
                }
            } 
            else if (match.durum === 'Hazır') {
                scheduleInputSection.style.display = 'block'; 
                scheduleInputSection.innerHTML = `
                    <button id="btn-toggle-schedule" class="btn-purple" style="width:100%; margin-bottom:10px; display:flex; justify-content:center; align-items:center; gap:10px;"><span>📅</span> Maç Planla / Güncelle</button>
                    <div id="schedule-form-container" style="display:none; background:#f8f9fa; padding:10px; border-radius:8px; margin-bottom:15px; border:1px solid #eee;">
                        <h4 style="margin-top:0; margin-bottom:10px; color:#6f42c1; font-size:0.9em; border-bottom:1px solid #ddd; padding-bottom:5px;">Plan Detayları</h4>
                        <label class="input-label">Kort Tipi:</label>
                        <select id="dynamic-court-type"><option value="Toprak">Toprak 🧱</option><option value="Sert">Sert 🟦</option></select>
                        <label class="input-label">Kort Seçimi:</label>
                        <select id="dynamic-venue-select"><option value="">Kort Seç</option></select>
                        <label class="input-label">Tarih ve Saat:</label>
                        <input type="datetime-local" id="dynamic-time-input">
                        <button id="dynamic-save-schedule-btn" class="btn-save-schedule" style="margin-top:10px;">Planı Kaydet ✅</button>
                    </div>`;

                const toggleSchedBtn = document.getElementById('btn-toggle-schedule'); const schedContainer = document.getElementById('schedule-form-container');
                toggleSchedBtn.onclick = () => { const isHidden = schedContainer.style.display === 'none'; schedContainer.style.display = isHidden ? 'block' : 'none'; toggleSchedBtn.style.opacity = isHidden ? '0.9' : '1'; };

                const dVenueSelect = document.getElementById('dynamic-venue-select');
                COURT_LIST.forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; if(match.macYeri === c) o.selected = true; dVenueSelect.appendChild(o); });
                if(match.kortTipi) document.getElementById('dynamic-court-type').value = match.kortTipi;
                if(match.macZamani) { const dateVal = new Date(match.macZamani.toDate().getTime() - (match.macZamani.toDate().getTimezoneOffset() * 60000)).toISOString().slice(0,16); document.getElementById('dynamic-time-input').value = dateVal; }
                document.getElementById('dynamic-save-schedule-btn').onclick = () => saveMatchSchedule(matchDocId);

                scoreInputSection.style.display = 'block'; 
                scoreInputSection.innerHTML = `
                    <button id="btn-toggle-score" class="btn-main" style="width:100%; margin-bottom:10px; display:flex; justify-content:center; align-items:center; gap:10px; background: linear-gradient(to right, #ffc107, #ff9800); color:#333;"><span>📝</span> Maç Sonucu Gir</button>
                    <div id="score-form-container" style="display:none; background:#fff3cd; padding:10px; border-radius:8px; margin-bottom:15px; border:1px solid #ffeeba;">
                         <h4 style="margin-top:0; margin-bottom:10px; color:#856404; font-size:0.9em; border-bottom:1px solid #e6dbb9; padding-bottom:5px;">Maç Detayları</h4>
                         <div style="margin-bottom:15px;">
                            <label class="input-label" style="color:#856404;">Hangi zeminde oynadınız?</label>
                            <select id="score-court-type" style="width:100%; padding:8px; border-radius:6px; border:1px solid #e6dbb9;"><option value="Toprak" ${match.kortTipi === 'Toprak' ? 'selected' : ''}>Toprak 🧱</option><option value="Sert" ${match.kortTipi === 'Sert' ? 'selected' : ''}>Sert 🟦</option></select>
                         </div>
                         <div class="score-row"><span>1. Set</span><input type="number" id="s1-me" class="score-box" placeholder="P1" value="${match.skor?.s1_me || ''}"><input type="number" id="s1-opp" class="score-box" placeholder="P2" value="${match.skor?.s1_opp || ''}"></div>
                        <div class="score-row"><span>2. Set</span><input type="number" id="s2-me" class="score-box" placeholder="P1" value="${match.skor?.s2_me || ''}"><input type="number" id="s2-opp" class="score-box" placeholder="P2" value="${match.skor?.s2_opp || ''}"></div>
                        <div class="score-row"><span>3. Set (Opsiyonel)</span><input type="number" id="s3-me" class="score-box" placeholder="P1" value="${match.skor?.s3_me || ''}"><input type="number" id="s3-opp" class="score-box" placeholder="P2" value="${match.skor?.s3_opp || ''}"></div>
                        <div id="winner-select-container" style="margin-top: 15px; margin-bottom: 10px;"><label style="font-size:0.85em; color:#856404; font-weight:bold; margin-bottom:5px; display:block;">Kazanan Kim?</label></div>
                        <button id="dynamic-save-score-btn" class="btn-save" style="margin-top:5px; background-color:#28a745;">Sonucu Kaydet ve Gönder 🚀</button>
                    </div>`;

                const scoreContainer = document.getElementById('score-form-container'); const winnerContainer = document.getElementById('winner-select-container');
                winnerSelect.style.display = 'block'; winnerSelect.style.marginBottom = '0'; winnerContainer.appendChild(winnerSelect);

                const toggleScoreBtn = document.getElementById('btn-toggle-score');
                toggleScoreBtn.onclick = () => { const isHidden = scoreContainer.style.display === 'none'; scoreContainer.style.display = isHidden ? 'block' : 'none'; };
                document.getElementById('dynamic-save-score-btn').onclick = () => saveMatchResult(matchDocId);
            }
            else if (match.durum === 'Sonuç_Bekleniyor') {
                const s = match.skor || {};
                // Admin VEYA skoru giren kişi değilse onay ekranını görsün
                if (isTourAdmin || match.sonucuGirenID !== currentUserID) {
                    const myS1 = s.s1_opp || 0; const oppS1 = s.s1_me || 0; const myS2 = s.s2_opp || 0; const oppS2 = s.s2_me || 0; const myS3 = s.s3_opp || 0; const oppS3 = s.s3_me || 0;
                    const p1Val = match.oyuncu1ID; const p2Val = match.oyuncu2ID;

                    scoreDisplaySection.style.display = 'block';
                    scoreDisplaySection.innerHTML = `
                        <div style="background:#e3f2fd; padding:15px; border-radius:10px; border:1px solid #bbdefb; text-align:center;">
                            <h4 style="margin-top:0; color:#0d47a1;">📬 Skor Onayı Bekleniyor</h4>
                            <div style="font-size:1.2em; font-weight:bold; margin-bottom:10px;">${oppS1}-${myS1}, ${oppS2}-${myS2} ${s.s3_me || s.s3_opp ? `, ${oppS3}-${myS3}` : ''}</div>
                            <div style="font-size:0.9em; color:#555; margin-bottom:15px;">Kazanan Adayı: <strong>${(match.adayKazananID === match.oyuncu1ID) ? team1Name : team2Name}</strong></div>
                            <button id="btn-toggle-approve" class="btn-main" style="background-color:#007bff; width:100%;">⚖️ Skoru İncele / Onayla / Değiştir</button>
                            <div id="approve-action-area" style="display:none; margin-top:15px; background:#fff; padding:10px; border-radius:8px; border:1px solid #ddd;">
                                <p style="color:#28a745; font-weight:bold; margin-bottom:5px;">✅ Her şey doğru mu?</p>
                                <button id="btn-quick-approve" class="btn-approve" style="margin-bottom:20px;">Evet, Skoru Onayla</button>
                                <hr style="border-top:1px dashed #ccc; margin-bottom:15px;">
                                <p style="color:#ffc107; font-weight:bold; margin-bottom:10px;">✏️ Yanlışlık mı var? Düzenle ve Gönder:</p>
                                <label class="input-label">Kazanan Kim?</label>
                                <select id="change-winner-select"><option value="${p1Val}" ${match.adayKazananID === p1Val ? 'selected' : ''}>${userMap[p1Val]?.isim}</option><option value="${p2Val}" ${match.adayKazananID === p2Val ? 'selected' : ''}>${userMap[p2Val]?.isim}</option></select>
                                <div class="score-row"><span>1. Set</span><input type="number" id="c-s1-me" class="score-box" value="${myS1}"> <input type="number" id="c-s1-opp" class="score-box" value="${oppS1}"> </div>
                                <div class="score-row"><span>2. Set</span><input type="number" id="c-s2-me" class="score-box" value="${myS2}"> <input type="number" id="c-s2-opp" class="score-box" value="${oppS2}"> </div>
                                <div class="score-row"><span>3. Set</span><input type="number" id="c-s3-me" class="score-box" value="${myS3}"> <input type="number" id="c-s3-opp" class="score-box" value="${oppS3}"> </div>
                                <button id="btn-submit-change" class="btn-save" style="background-color:#ff9800; margin-top:10px;">Değişikliği Gönder 🔄</button>
                            </div>
                        </div>`;

                    const tglBtn = document.getElementById('btn-toggle-approve'); const actionArea = document.getElementById('approve-action-area');
                    tglBtn.onclick = () => { const isHidden = actionArea.style.display === 'none'; actionArea.style.display = isHidden ? 'block' : 'none'; };
                    document.getElementById('btn-quick-approve').onclick = () => finalizeMatch(matchDocId, match);
                    document.getElementById('btn-submit-change').onclick = () => updateAndResubmitScore(matchDocId);
                } else {
                    scoreDisplaySection.style.display = 'block';
                    scoreDisplaySection.innerHTML = `
                        <div style="background:#fff3cd; padding:15px; border-radius:10px; border:1px solid #ffeeba; text-align:center;">
                            <h4 style="margin:0; color:#856404;">⏳ Onay Bekleniyor</h4>
                            <p style="margin:5px 0; font-size:0.9em;">Rakibin veya Turnuva Yönetiminin sonucu onaylaması bekleniyor.</p>
                            <div style="font-weight:bold; margin-top:10px;">Girilen Skor: ${s.s1_me}-${s.s1_opp}, ${s.s2_me}-${s.s2_opp}</div>
                        </div>`;
                }
            }
            else if (match.durum === 'Tamamlandı') {
                const s = match.skor || {}; scoreDisplaySection.style.display = 'block';
                scoreDisplaySection.innerHTML = `<div style="background:#e8f5e9; padding:10px; border-radius:8px; border:1px solid #c3e6cb;"><p style="font-size:1.2em; font-weight:bold; text-align:center; margin-bottom:5px;">${s.s1_me}-${s.s1_opp}, ${s.s2_me}-${s.s2_opp} ${s.s3_me || s.s3_opp ? ', ' + s.s3_me + '-' + s.s3_opp : ''}</p><p style="text-align:center; color:#28a745; margin:0;">Kazanan: <strong>${(match.kayitliKazananID === match.oyuncu1ID) ? team1Name : team2Name}</strong></p></div>`;
            }

const shareMatchBtn = document.getElementById('btn-share-match-detail');
            if (shareMatchBtn) {
                const newShareBtn = shareMatchBtn.cloneNode(true); shareMatchBtn.parentNode.replaceChild(newShareBtn, shareMatchBtn);
                newShareBtn.innerHTML = '📸 Instagram\'da Paylaş'; newShareBtn.style.background = 'linear-gradient(45deg, #405de6, #5851db, #833ab4, #c13584, #e1306c, #fd1d1d)';
                
                newShareBtn.addEventListener('click', async () => {
                    try { await navigator.clipboard.writeText("https://bursatenisligi.github.io/TenisLig/"); } catch(e) {}
                    alert("Sitenin linki panoya (hafızaya) kopyalandı! 📋\n\nResim oluştuktan sonra Instagram hikayenize eklerken 'Çıkartmalar' menüsünden 'Bağlantı' aracını seçip kopyalanan linki direkt yapıştırabilirsiniz.");

                    let finalMatchData = null; try { if (typeof match !== 'undefined') finalMatchData = match; } catch (e) {}
                    if (!finalMatchData && typeof currentMatchDocId !== 'undefined' && currentMatchDocId) { try { const doc = await db.collection('matches').doc(currentMatchDocId).get(); finalMatchData = doc.data(); } catch (err) { console.error(err); } }
                    if (!finalMatchData) { alert("Veri yüklenemedi, lütfen sayfayı yenileyin."); return; }

                    const SAFE_LOGO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiI+PHBhdGggZmlsbD0iI2MzZjkwOCIgZD0iTTI1NiAwdTI1NiAyNTZjMCAxNDEuMzg1LTExNC42MTUgMjU2LTI1NiAyNTZTJDAgMzk3LjM4NSAwIDI1NiAxMTQuNjE1IDAgMjU2IDB6Ii8+PHBhdGggZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjMyIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIGQ9Ik0zMzkuMzQ4IDEwOC41NDVjLTQ3LjA2IDUwLjI3Mi03NS45NjIgMTE4LjE1NS03NS45NjIgMTkyLjQ1NXM4MS45NDcgMTM3LjUzNyAxMzUuMTY0IDE4Mi42MzZNMzcuNTg2IDEzNC4xMDRjNDkuNjY4IDM5LjczNyAxMTIuNzU3IDYzLjYyNCAxODAuOTU4IDYzLjYyNHMxMzEuMjktMjMuODg3IDE4MC45NTgtNjMuNjI0Ii8+PC9zdmc+";
                    
                    const getU = (id) => userMap[id] || { isim: 'Bilinmeyen', fotoURL: 'https://via.placeholder.com/150' };
                    const p1 = getU(finalMatchData.oyuncu1ID); const p1p = finalMatchData.oyuncu1PartnerID ? getU(finalMatchData.oyuncu1PartnerID) : null;
                    const p2 = getU(finalMatchData.oyuncu2ID); const p2p = finalMatchData.oyuncu2PartnerID ? getU(finalMatchData.oyuncu2PartnerID) : null;
                    
                    let team1Name = p1.isim; if(p1p) team1Name += ` & ${p1p.isim}`;
                    let team2Name = p2.isim; if(p2p) team2Name += ` & ${p2p.isim}`;
                    
                    const wid = finalMatchData.kayitliKazananID || finalMatchData.adayKazananID; 
                    let winnerTeam = "?"; let isTeam1Winner = (wid === finalMatchData.oyuncu1ID);
                    if (wid) { winnerTeam = isTeam1Winner ? team1Name : team2Name; }
                    
                    let scoreText = "Skor Yok"; 
                    if (finalMatchData.skor) { 
                        const s = finalMatchData.skor; 
                        let set1 = (parseInt(s.s1_me||0) + parseInt(s.s1_opp||0)) > 0 ? `${s.s1_me}-${s.s1_opp}` : ''; 
                        let set2 = (parseInt(s.s2_me||0) + parseInt(s.s2_opp||0)) > 0 ? `, ${s.s2_me}-${s.s2_opp}` : ''; 
                        let set3 = (parseInt(s.s3_me||0) + parseInt(s.s3_opp||0)) > 0 ? `, ${s.s3_me}-${s.s3_opp}` : ''; 
                        scoreText = set1 + set2 + set3;
                        if(scoreText.startsWith(', ')) scoreText = scoreText.substring(2);
                    }

                    let matchBadgeHTML = '';
                    if (finalMatchData.macTipi === 'Turnuva' && finalMatchData.tournamentId) {
                        try {
                            const tDoc = await db.collection('tournaments').doc(finalMatchData.tournamentId).get();
                            if(tDoc.exists) { matchBadgeHTML = `<div style="background:rgba(255,255,255,0.25); padding:15px 40px; border-radius:40px; margin-top:20px; font-size:2.2em; font-weight:600; backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.3); color:#fff; text-shadow:0 2px 5px rgba(0,0,0,0.5);">🏆 ${tDoc.data().name}</div>`; }
                        } catch(e) {}
                    }

                    const tempDiv = document.createElement('div'); tempDiv.id = 'share-card-temp';
                    let photoUrl = finalMatchData.macFotoURL; let hasPhoto = photoUrl && photoUrl.length > 20 && !photoUrl.includes("placeholder");
                    
                    const cardStyle = "width: 1080px; height: 1920px; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); position: fixed; top: -5000px; left: 0; font-family: 'Poppins', sans-serif; display:flex; flex-direction:column; padding: 100px 80px; box-sizing:border-box; color:white; justify-content:space-between; align-items:center; text-align:center;";
                    
                    const ctaHTML = `<div style="font-size:2.2em; font-weight:700; color:#fff; background:rgba(0,0,0,0.6); padding:20px 50px; border-radius:50px; text-shadow: 0 2px 5px rgba(0,0,0,0.8); margin-bottom:20px; border: 1px solid rgba(255,255,255,0.2);">👇 Sıralama ve Detaylar İçin Linke Tıkla 👇</div>`;

                    let innerContent = '';
                    if (hasPhoto) {
                        innerContent = `
                        <div id="capture-story" style="${cardStyle} background: url('${photoUrl}') center/cover no-repeat;">
                            <div style="position:absolute; top:0; left:0; right:0; bottom:0; background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%); z-index:1;"></div>
                            <div style="position:relative; z-index:2; width:100%; display:flex; flex-direction:column; align-items:center; justify-content:space-between; height:100%;">
                                <div style="display:flex; flex-direction:column; align-items:center;">
                                    <img src="${SAFE_LOGO}" style="width:150px; height:150px; margin-bottom:20px; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5));">
                                    <h1 style="margin:0; font-size:4.5em; font-weight:900; letter-spacing:3px; text-shadow: 0 4px 15px rgba(0,0,0,0.8);">MAÇ SONUCU</h1>
                                    ${matchBadgeHTML}
                                </div>
                                <div style="width:100%; display:flex; flex-direction:column; align-items:center; gap: 50px;">
                                    <div style="font-size:3.5em; font-weight:800; text-shadow: 0 5px 15px rgba(0,0,0,0.8);">${team1Name}</div>
                                    <div style="font-size:3em; color:#ffc107; font-weight:900; text-shadow: 0 2px 10px rgba(0,0,0,0.9);">VS</div>
                                    <div style="font-size:3.5em; font-weight:800; text-shadow: 0 5px 15px rgba(0,0,0,0.8);">${team2Name}</div>
                                </div>
                                <div style="width:100%; display:flex; flex-direction:column; align-items:center; margin-top:20px;">
                                    <h3 style="margin:0 0 20px 0; color:#ffc107; font-size:2.5em; font-weight:900; text-transform:uppercase; letter-spacing:2px; text-shadow: 0 4px 10px rgba(0,0,0,0.9);">🏆 KAZANAN</h3>
                                    <div style="font-size:3.8em; font-weight:900; margin-bottom:40px; line-height:1.2; text-shadow: 0 5px 15px rgba(0,0,0,0.9);">${winnerTeam}</div>
                                    <div style="border-top:3px dashed rgba(255,255,255,0.6); padding-top:40px; width:80%;">
                                        <div style="font-size:2.2em; color:#ddd; margin-bottom:15px; font-weight:600; text-shadow: 0 3px 8px rgba(0,0,0,0.9);">SKOR</div>
                                        <div style="font-size:7em; font-weight:900; color:#00ff88; letter-spacing:5px; line-height:1; text-shadow: 0 5px 20px rgba(0,0,0,0.9);">${scoreText}</div>
                                    </div>
                                </div>
                                ${ctaHTML}
                            </div>
                        </div>`;
                    } else {
                        innerContent = `
                        <div id="capture-story" style="${cardStyle}">
                            <div style="position:relative; z-index:2; width:100%; display:flex; flex-direction:column; align-items:center; justify-content:space-between; height:100%;">
                                <div style="display:flex; flex-direction:column; align-items:center;">
                                    <img src="${SAFE_LOGO}" style="width:180px; height:180px; margin-bottom:30px;">
                                    <h1 style="margin:0; font-size:5.5em; font-weight:900; letter-spacing:4px; text-shadow: 0 5px 15px rgba(0,0,0,0.4);">MAÇ SONUCU</h1>
                                    ${matchBadgeHTML}
                                </div>
                                <div style="width:100%; display:flex; flex-direction:column; align-items:center; gap: 50px;">
                                    <div style="font-size:3.8em; font-weight:800; text-shadow: 0 4px 10px rgba(0,0,0,0.3);">${team1Name}</div>
                                    <div style="font-size:3em; color:#ffc107; font-weight:900; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">VS</div>
                                    <div style="font-size:3.8em; font-weight:800; text-shadow: 0 4px 10px rgba(0,0,0,0.3);">${team2Name}</div>
                                </div>
                                <div style="width:100%; display:flex; flex-direction:column; align-items:center; margin-top:20px;">
                                    <h3 style="margin:0 0 20px 0; color:#ffc107; font-size:2.8em; font-weight:900; text-transform:uppercase; letter-spacing:2px; text-shadow: 0 4px 10px rgba(0,0,0,0.5);">🏆 KAZANAN</h3>
                                    <div style="font-size:4em; font-weight:900; margin-bottom:40px; line-height:1.2; text-shadow: 0 5px 15px rgba(0,0,0,0.5);">${winnerTeam}</div>
                                    <div style="border-top:3px dashed rgba(255,255,255,0.4); padding-top:40px; width:80%;">
                                        <div style="font-size:2.2em; color:#eee; margin-bottom:15px; font-weight:600;">SKOR</div>
                                        <div style="font-size:7.5em; font-weight:900; color:#00ff88; letter-spacing:5px; line-height:1; text-shadow: 0 5px 20px rgba(0,0,0,0.5);">${scoreText}</div>
                                    </div>
                                </div>
                                ${ctaHTML}
                            </div>
                        </div>`;
                    }
                    tempDiv.innerHTML = innerContent; document.body.appendChild(tempDiv);

                    await new Promise(r => setTimeout(r, 1000));

                    if (typeof shareElementAsImage === 'function') { 
                        await shareElementAsImage('capture-story', 'mac-sonucu', 'btn-share-match-detail'); 
                    } else { alert("Hata: Görüntü fonksiyonu bulunamadı."); }
                    
                    setTimeout(() => { if(document.body.contains(tempDiv)) document.body.removeChild(tempDiv); }, 1000);
                });
            }
        }).catch(err => {
            console.error("Match yüklenirken hata:", err);
            detailMatchInfo.innerHTML = '<p style="color:red;">Maç detayları yüklenirken bir hata oluştu.</p>';
        });
    }

    async function updateMatchStatus(id, st, msg) { await db.collection('matches').doc(id).update({durum:st}); alert(msg); goBackToList(); }
    async function deleteMatch(id, msg) { await db.collection('matches').doc(id).delete(); alert(msg); goBackToList(); }
    
    async function saveMatchSchedule(id) { 
        const cType = document.getElementById('dynamic-court-type').value; const venue = document.getElementById('dynamic-venue-select').value; const timeVal = document.getElementById('dynamic-time-input').value;
        if(!cType || !venue || !timeVal) { alert("Lütfen Kort Tipi, Kort Seçimi ve Tarih/Saat bilgilerini eksiksiz girin."); return; }
        try { await db.collection('matches').doc(id).update({ kortTipi: cType, macYeri: venue, macZamani: firebase.firestore.Timestamp.fromDate(new Date(timeVal)) }); alert("Maç planı başarıyla kaydedildi! ✅"); showMatchDetail(id); } catch(e) { console.error(e); alert("Plan kaydedilirken hata oluştu."); }
    }
    
    async function saveMatchResult(id) {
        if (!winnerSelect.value) { alert("Lütfen kazananı seçin!"); return; }
        const selectedCourtType = document.getElementById('score-court-type').value;
        const s1m = parseInt(document.getElementById('s1-me').value) || 0; const s1o = parseInt(document.getElementById('s1-opp').value) || 0; const s2m = parseInt(document.getElementById('s2-me').value) || 0; const s2o = parseInt(document.getElementById('s2-opp').value) || 0; const s3m = parseInt(document.getElementById('s3-me').value) || 0; const s3o = parseInt(document.getElementById('s3-opp').value) || 0;

        let updateData = { durum: 'Sonuç_Bekleniyor', adayKazananID: winnerSelect.value, sonucuGirenID: auth.currentUser.uid, kortTipi: selectedCourtType, skor: { s1_me: s1m, s1_opp: s1o, s2_me: s2m, s2_opp: s2o, s3_me: s3m, s3_opp: s3o }, skorTarihi: firebase.firestore.FieldValue.serverTimestamp() };

        try {
            await db.collection('matches').doc(id).update(updateData);
            const docSnap = await db.collection('matches').doc(id).get();
            if (docSnap.exists) {
                const matchData = docSnap.data(); const myUid = auth.currentUser.uid;
                const targetId = (matchData.oyuncu1ID === myUid) ? matchData.oyuncu2ID : matchData.oyuncu1ID; const myName = userMap[myUid]?.isim || 'Rakibin';
                const subject = "📝 Maç Sonucu Girildi - Onay Bekliyor";
                const body = `<p><strong>${myName}</strong> oynadığınız maçın skorunu sisteme girdi.</p><div style="background-color:#e3f2fd; padding:10px; border-radius:5px; border:1px solid #bbdefb; margin:10px 0;"><p style="font-size:16px; font-weight:bold; margin:0;">Girilen Skor: ${s1m}-${s1o}, ${s2m}-${s2o} ${s3m + s3o > 0 ? ', ' + s3m + '-' + s3o : ''}</p><p style="margin:5px 0 0 0; font-size:12px; color:#555;">(Not: Skorlar girilen kişinin bakış açısındandır)</p></div><p>Skoru onaylamak veya itiraz etmek (değiştirmek) için aşağıdaki linke tıkla:</p><p><a href="https://bursatenisligi.github.io/TenisLig/">https://bursatenisligi.github.io/TenisLig/</a></p>`;
                sendNotificationEmail(targetId, subject, body);
            }
            alert("Sonuç girildi, onay bekleniyor. ⏳ Rakibine bildirim gönderildi."); showMatchDetail(id);
        } catch (e) { console.error("Sonuç kaydetme hatası:", e); alert("Sonuç kaydedilemedi: " + e.message); }
    }

    async function updateAndResubmitScore(matchId) {
        const winnerSelect = document.getElementById('change-winner-select');
        if(!winnerSelect.value) { alert("Lütfen kazananı seçin!"); return; }
        const s1m = parseInt(document.getElementById('c-s1-me').value) || 0; const s1o = parseInt(document.getElementById('c-s1-opp').value) || 0; const s2m = parseInt(document.getElementById('c-s2-me').value) || 0; const s2o = parseInt(document.getElementById('c-s2-opp').value) || 0; const s3m = parseInt(document.getElementById('c-s3-me').value) || 0; const s3o = parseInt(document.getElementById('c-s3-opp').value) || 0;
        const myUid = firebase.auth().currentUser.uid;

        const updateData = { durum: 'Sonuç_Bekleniyor', adayKazananID: winnerSelect.value, sonucuGirenID: myUid, skor: { s1_me: s1m, s1_opp: s1o, s2_me: s2m, s2_opp: s2o, s3_me: s3m, s3_opp: s3o } };
        try { await firebase.firestore().collection('matches').doc(matchId).update(updateData); alert("Düzeltme başarıyla gönderildi! Şimdi rakibinin onayı bekleniyor. 🔄"); showMatchDetail(matchId); } catch (e) { console.error("Güncelleme Hatası:", e); alert("Değişiklik kaydedilirken bir hata oluştu."); }
    }

// --- GRUPLARI VE FİKSTÜRÜ AYNI ANDA OLUŞTURAN TEK MOTOR ---
    window.generateGroupStageDraw = async function(tourId) {
        const groupSizeInput = document.getElementById('group-size-input');
        const advancingCountInput = document.getElementById('advancing-count-input');

        const targetGroupSize = parseInt(groupSizeInput?.value) || 4;
        const advancingCount = parseInt(advancingCountInput?.value) || 2;

        try {
            const docRef = db.collection('tournaments').doc(tourId);
            const tourSnap = await docRef.get();
            const tourData = tourSnap.data();
            const participants = tourData.participants || [];

            if (participants.length < 3) return alert("Grup aşaması için en az 3 kişi gerekli!");

            const numGroups = Math.max(1, Math.round(participants.length / targetGroupSize));
            const minCalculatedSize = Math.floor(participants.length / numGroups);

            if (advancingCount >= minCalculatedSize) {
                return alert(`Dağılım sonrası hesaplanan en küçük grup ${minCalculatedSize} kişi oluyor. Gruptan çıkacak kişi sayısı (${advancingCount}) bundan kesinlikle küçük olmalıdır!`);
            }

            if (!confirm(`Tüm oyuncular ${numGroups} adet gruba dağıtılacak ve ilk ${advancingCount} kişi eleme turuna çıkacak. Fikstür hemen oluşturulacak. Onaylıyor musunuz?`)) return;

            let players = [...participants].map(p => {
                 let pts = userMap[p.p1]?.toplamPuan || 0;
                 if (!(tourData.format || '').includes('Tekler') && p.p2) pts += (userMap[p.p2]?.toplamPuan || 0);
                 return { ...p, points: pts };
            });
            players.sort((a, b) => b.points - a.points);

            let groups = Array.from({ length: numGroups }, (_, i) => ({
                groupId: i, groupName: 'Grup ' + String.fromCharCode(65 + i), players: [], matches: []
            }));

            players.forEach((player, i) => {
                let row = Math.floor(i / numGroups); let col = i % numGroups;
                let targetGroupIndex = (row % 2 === 0) ? col : (numGroups - 1 - col);
                groups[targetGroupIndex].players.push({ ...player, played: 0, won: 0, lost: 0, gamesWon: 0, gamesLost: 0, winRate: 0, groupPoints: 0 });
            });

            for (let g = 0; g < groups.length; g++) {
                let p = groups[g].players; let matchCount = 1;
                for (let i = 0; i < p.length; i++) {
                    for (let j = i + 1; j < p.length; j++) {
                        let p1 = p[i]; let p2 = p[j];
                        const mId = await window.createTournamentMatchDoc(tourId, p1, p2, groups[g].groupName, `G${g}_M${matchCount}`);
                        groups[g].matches.push({ matchId: `G${g}_M${matchCount}`, firestoreMatchId: mId, p1: p1, p2: p2, winner: null, score: null });
                        matchCount++;
                    }
                }
            }

            const totalAdvancing = numGroups * advancingCount;
            const bracketSize = Math.pow(2, Math.ceil(Math.log2(totalAdvancing)));
            
            let placeholders = [];
            // 1. Önce direkt çıkanları (Tüm 1.ler, sonra tüm 2.ler) sıraya diz ki adil eşleşsin
            for(let r=1; r<=advancingCount; r++) {
                for(let g=0; g<numGroups; g++) { 
                    placeholders.push({ isPlaceholder: true, groupIdx: g, groupName: String.fromCharCode(65 + g), rank: r }); 
                }
            }
            
            // 2. BAY geçmek yerine, eksik koltuklara "En İyi Üçüncüler/Ekstralar" yerleştir
            const missingSlots = bracketSize - totalAdvancing;
            for(let i=1; i<=missingSlots; i++) {
                placeholders.push({ isPlaceholder: true, isBestExtra: true, extraRank: i });
            }
            
            // Güvenlik: Eğer hala boşluk kalırsa (matematiksel olarak) BAY ile doldur
            while(placeholders.length < bracketSize) { placeholders.push({ isBye: true }); }

            function getSeededOrder(size) {
                if (size <= 1) return [1]; const half = getSeededOrder(size / 2); const res = [];
                for (let i = 0; i < half.length; i++) { res.push(half[i]); res.push(size - half[i] + 1); } return res;
            }
            const order = getSeededOrder(bracketSize);

            const rounds = []; let currentSize = bracketSize / 2; let rNum = 1;
            while(currentSize >= 1) {
                let rName = rNum + ". Tur"; if(currentSize === 4) rName = "Çeyrek Final"; if(currentSize === 2) rName = "Yarı Final"; if(currentSize === 1) rName = "Final";
                let mList = []; for(let i=0; i<currentSize; i++) mList.push({ p1: null, p2: null, winner: null, score: null, firestoreMatchId: null });
                rounds.push({ roundName: rName, matches: mList }); currentSize /= 2; rNum++;
            }

            for (let i = 0; i < bracketSize; i += 2) {
                const mIdx = i / 2;
                rounds[0].matches[mIdx].p1 = placeholders[order[i]-1];
                rounds[0].matches[mIdx].p2 = placeholders[order[i+1]-1];
                
                if (rounds[0].matches[mIdx].p1.isBye || rounds[0].matches[mIdx].p2.isBye) {
                    const autoWinner = rounds[0].matches[mIdx].p1.isBye ? rounds[0].matches[mIdx].p2 : rounds[0].matches[mIdx].p1;
                    rounds[0].matches[mIdx].winner = autoWinner; rounds[0].matches[mIdx].score = "Oynamadan Geçti";
                    const nextMIdx = Math.floor(mIdx / 2);
                    if (mIdx % 2 === 0) rounds[1].matches[nextMIdx].p1 = autoWinner; else rounds[1].matches[nextMIdx].p2 = autoWinner;
                }
            }

            await docRef.update({
                status: 'Devam Ediyor', stage: 'Grup', targetGroupSize: targetGroupSize, advancingCount: advancingCount, groups: groups, bracket: rounds
            });

            participants.forEach(p => {
                const subject = "🏆 Turnuva Grupları Belli Oldu!";
                const body = `<p>Katıldığınız <strong>${tourData.name}</strong> turnuvasında gruplar oluşturuldu.</p><p>Hemen uygulamaya girip bulunduğunuz grubu ve rakiplerinizi inceleyebilirsiniz!</p>`;
                if (p.p1) sendNotificationEmail(p.p1, subject, body);
                if (p.p2) sendNotificationEmail(p.p2, subject, body);
            });

            alert("Gruplar ve Fikstür Yapısı başarıyla oluşturuldu! 🏆");
            openTournamentDetail(tourId, (await docRef.get()).data());

        } catch (e) { console.error(e); alert("Gruplar oluşturulurken hata: " + e.message); }
    };
function goBackToList() {
        matchInteractionListeners.forEach(unsubscribe => unsubscribe()); matchInteractionListeners = [];
        matchDetailView.style.display='none';
        if (returnToTab) {
            tabSections.forEach(s => s.style.display = 'none'); 
            document.getElementById(returnToTab).style.display = 'block'; 
            navItems.forEach(n => n.classList.remove('active')); 
            const navItem = document.querySelector(`.nav-item[data-target="${returnToTab}"]`); 
            if(navItem) navItem.classList.add('active');

            if (returnToTab === 'tab-matches') loadMyMatchesOverview(); 
            if (returnToTab === 'tab-fixture') loadMatchesForFixture(); 
            if (returnToTab === 'tab-gallery') loadGallery(); 
            if (returnToTab === 'tab-profile') loadUserPhotos();
            
            // --- YENİ: TURNUVA SAYFASINA DÖNÜŞTE OTOMATİK GÜNCELLEME ---
            if (returnToTab === 'tab-tournaments') {
                if (currentMatchDocId) {
                    db.collection('matches').doc(currentMatchDocId).get().then(doc => {
                        const mData = doc.data();
                        if (mData && mData.tournamentId) {
                            // Maçın ait olduğu turnuvayı bul ve verilerini canlı olarak tekrar çek!
                            db.collection('tournaments').doc(mData.tournamentId).get().then(tDoc => {
                                if(tDoc.exists) openTournamentDetail(tDoc.id, tDoc.data());
                            });
                        } else {
                            loadTournaments();
                        }
                    });
                } else {
                    loadTournaments();
                }
            }
            // -------------------------------------------------------------
            
            returnToTab = null;
        } else { 
            document.getElementById('tab-lobby').style.display = 'block'; 
            document.querySelector('[data-target="tab-lobby"]').classList.add('active'); 
        }
    }

    function setupNotifications(userId) {
        listeners.forEach(u => u()); listeners = [];
        listeners.push(db.collection('matches').where('oyuncu1ID','==',userId).onSnapshot({includeMetadataChanges:true}, s=>handleSnapshot(s,userId,'p1')));
        listeners.push(db.collection('matches').where('oyuncu2ID','==',userId).onSnapshot({includeMetadataChanges:true}, s=>handleSnapshot(s,userId,'p2')));
        listeners.push(db.collection('chats').where('participants','array-contains',userId).onSnapshot({includeMetadataChanges:true}, s => {
            s.docChanges().forEach(change => {
                if (change.type === 'modified') {
                    const data = change.doc.data();
                    if (data.lastMessageSenderId && data.lastMessageSenderId !== userId) {
                        if (chatModal.style.display === 'flex' && currentChatId === change.doc.id) return;
                        const senderId = data.participants.find(id => id !== userId); const senderName = userMap[senderId]?.isim || 'Biri'; showNotification(`💬 ${senderName}: ${data.lastMessage}`, 'info');
                    }
                }
            });
        }));
    }

    function handleSnapshot(snapshot, userId, role) {
        snapshot.docChanges().forEach(change => {
            const d = change.doc.data(); if (change.doc.metadata.hasPendingWrites) return;
            if (change.type === 'added' && d.tarih && (new Date()-d.tarih.toDate())<30000 && role==='p2' && d.durum==='Bekliyor') showNotification(`${userMap[d.oyuncu1ID]?.isim||'Biri'} sana meydan okudu!`, 'info');
            if (change.type === 'modified') {
                const opp = role==='p1'?userMap[d.oyuncu2ID]?.isim:userMap[d.oyuncu1ID]?.isim;
                if (d.durum==='Hazır') { const msg = role==='p1' ? 'Teklifin kabul edildi!' : 'Maç eşleşmesi sağlandı!'; showNotification(msg, 'success'); }
                if (d.durum==='Sonuç_Bekleniyor' && d.sonucuGirenID!==userId) showNotification(`${opp} sonucu girdi.`, 'warning');
                if (d.durum==='Tamamlandı') showNotification(`Maç tamamlandı!`, 'success');
            }
        });
    }

function showNotification(msg, type='info') {
        // Görsel pop-up (Toast) kısmını tamamen İPTAL ettik. Ekranda kutucuk çıkmayacak.
        /* const t = document.createElement('div'); 
        t.className=\`notification-toast \${type}\`; 
        t.innerHTML = \`<span>\${msg}</span><button onclick="this.parentElement.remove()" style="background:none;border:none;color:#fff;">&times;</button>\`; 
        notificationContainer.appendChild(t); 
        setTimeout(()=>t.remove(), 5000); 
        */

        // Sadece kullanıcının tercihine göre arka planda ses veya titreşim çalışsın (Görünmez bildirim)
        const u = userMap[auth.currentUser?.uid];
        if(u?.bildirimTercihi === 'ses') { 
            try { 
                const a = new (window.AudioContext || window.webkitAudioContext)(); 
                const o = a.createOscillator(); 
                const g = a.createGain(); 
                o.connect(g); g.connect(a.destination); 
                o.type = 'sine'; o.frequency.value = 880; 
                g.gain.value = 0.1; o.start(); o.stop(a.currentTime + 0.2); 
            } catch(e){} 
        }
        else if(u?.bildirimTercihi === 'titresim' && navigator.vibrate) {
            navigator.vibrate([200,100,200]);
        }
    }

    if(sendMessageBtn) { sendMessageBtn.onclick = sendMessage; }
    if(chatInput) { chatInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') sendMessage(); }); }
    if(closeChatModal) { closeChatModal.onclick = () => { chatModal.style.display = 'none'; if (currentChatUnsubscribe) currentChatUnsubscribe(); }; }
    if (clearChatBtn) clearChatBtn.addEventListener('click', clearChatMessages);

    async function runLeagueMaintenance() {
        console.log("Lig bakımı başlatılıyor..."); const now = new Date(); const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000; 
        try {
            const batch = db.batch(); let operationCount = 0;
            const pendingSnap = await db.collection('matches').where('durum', '==', 'Bekliyor').get();
            pendingSnap.forEach(doc => {
                const m = doc.data(); const createDate = m.tarih ? m.tarih.toDate() : null;
                if (createDate && (now - createDate) > FIVE_DAYS_MS) { batch.delete(db.collection('matches').doc(doc.id)); operationCount++; }
            });

            const readySnap = await db.collection('matches').where('durum', '==', 'Hazır').get();
            readySnap.forEach(doc => {
                const m = doc.data(); const matchId = doc.id; const matchRef = db.collection('matches').doc(matchId); const createdDate = m.tarih ? m.tarih.toDate() : null; const scheduledDate = m.macZamani ? m.macZamani.toDate() : null;
                if (!scheduledDate && createdDate) { if ((now - createdDate) > FIVE_DAYS_MS) { batch.delete(matchRef); operationCount++; } }
                if (scheduledDate) { if ((now - scheduledDate) > FIVE_DAYS_MS) { batch.delete(matchRef); operationCount++; } }
            });

            const approvalSnap = await db.collection('matches').where('durum', '==', 'Sonuç_Bekleniyor').get();
            for (const doc of approvalSnap.docs) {
                const m = doc.data(); const matchId = doc.id; const scoreDate = m.skorTarihi ? m.skorTarihi.toDate() : (m.macZamani ? m.macZamani.toDate() : m.tarih.toDate());
                if ((now - scoreDate) > FIVE_DAYS_MS) {
                    const wid = m.adayKazananID; const lid = m.oyuncu1ID === wid ? m.oyuncu2ID : m.oyuncu1ID;
                    let wg = 0, lg = 0;
                    if(m.skor) {
                        const s = m.skor; const isEntryByWinner = m.sonucuGirenID === wid;
                        const s1w = isEntryByWinner ? parseInt(s.s1_me) : parseInt(s.s1_opp); const s1l = isEntryByWinner ? parseInt(s.s1_opp) : parseInt(s.s1_me); const s2w = isEntryByWinner ? parseInt(s.s2_me) : parseInt(s.s2_opp); const s2l = isEntryByWinner ? parseInt(s.s2_opp) : parseInt(s.s2_me);
                        wg = s1w + s2w; lg = s1l + s2l;
                    }
                    const bonusW = wg * 5; const bonusL = lg * 5;
                    if(m.macTipi === 'Meydan Okuma') {
                        batch.update(db.collection('users').doc(wid), { toplamPuan: firebase.firestore.FieldValue.increment(m.bahisPuani + bonusW), galibiyetSayisi: firebase.firestore.FieldValue.increment(1), macSayisi: firebase.firestore.FieldValue.increment(1) });
                        batch.update(db.collection('users').doc(lid), { toplamPuan: firebase.firestore.FieldValue.increment(-m.bahisPuani + bonusL), macSayisi: firebase.firestore.FieldValue.increment(1) });
                    } else {
                        batch.update(db.collection('users').doc(wid), { toplamPuan: firebase.firestore.FieldValue.increment(50 + bonusW), galibiyetSayisi: firebase.firestore.FieldValue.increment(1), macSayisi: firebase.firestore.FieldValue.increment(1) });
                        batch.update(db.collection('users').doc(lid), { toplamPuan: firebase.firestore.FieldValue.increment(50 + bonusL), macSayisi: firebase.firestore.FieldValue.increment(1) });
                    }
                    batch.update(db.collection('matches').doc(matchId), { durum: 'Tamamlandı', kayitliKazananID: wid, onayTipi: 'Otomatik' });
                    operationCount++;
                }
            }
            if (operationCount > 0) { await batch.commit(); }
        } catch (error) { console.error("Lig bakımı sırasında hata:", error); }
    }

    async function checkAndSendReminders() {
        console.log("Hatırlatma kontrolleri yapılıyor..."); const now = new Date(); const ONE_DAY_MS = 24 * 60 * 60 * 1000; 
        const batch = db.batch(); let reminderCount = 0;
        const snapshot = await db.collection('matches').where('durum', 'in', ['Bekliyor', 'Hazır', 'Sonuç_Bekleniyor']).get();

        for (const doc of snapshot.docs) {
            const m = doc.data(); const matchId = doc.id; const lastRem = m.lastReminderSent ? m.lastReminderSent.toDate() : 0;
            if ((now - lastRem) < ONE_DAY_MS) continue;

            let targets = []; let subject = ""; let bodyContent = "";

            if (m.durum === 'Bekliyor' && m.oyuncu2ID) {
                const createDate = m.tarih ? m.tarih.toDate() : now;
                if ((now - createDate) > ONE_DAY_MS) { targets.push(m.oyuncu2ID); subject = "⏳ Bekleyen Maç Teklifi"; bodyContent = `<p>Bir oyuncu sana maç teklifi gönderdi. Lütfen yanıtla.</p>`; }
            } else if (m.durum === 'Hazır' && !m.macZamani) {
                const acceptDate = m.tarih ? m.tarih.toDate() : now;
                if ((now - acceptDate) > ONE_DAY_MS) { targets.push(m.oyuncu1ID); targets.push(m.oyuncu2ID); subject = "📅 Maç Tarihini Belirleyin"; bodyContent = `<p>Maç eşleşmeniz sağlandı, lütfen tarih ve kort belirleyin.</p>`; }
            } else if (m.durum === 'Hazır' && m.macZamani) {
                const matchDate = m.macZamani.toDate();
                if (now > new Date(matchDate.getTime() + (3 * 60 * 60 * 1000))) { targets.push(m.oyuncu1ID); targets.push(m.oyuncu2ID); subject = "📝 Maç Skoru Girilmedi"; bodyContent = `<p>Maç saatiniz geçti. Lütfen skoru giriniz.</p>`; }
            } else if (m.durum === 'Sonuç_Bekleniyor') {
                const targetId = (m.sonucuGirenID === m.oyuncu1ID) ? m.oyuncu2ID : m.oyuncu1ID;
                targets.push(targetId); subject = "⚖️ Maç Sonucu Onayı Bekliyor"; bodyContent = `<p>Rakibin skoru girdi, onaylaman bekleniyor.</p>`;
            }

            if (targets.length > 0) {
                const matchRef = db.collection('matches').doc(matchId); batch.update(matchRef, { lastReminderSent: firebase.firestore.FieldValue.serverTimestamp() }); reminderCount++;
                targets.forEach(uid => { if(uid) sendNotificationEmail(uid, subject, bodyContent); });
            }
        }
        if (reminderCount > 0) { await batch.commit(); }
    }

// --- GÜVENLİ AUTH VE PUSHER BAŞLATMA BLOKU ---
// --- GÜVENLİ AUTH BAŞLATMA BLOKU ---
    auth.onAuthStateChanged(user => {
        if (user) {
            authScreen.style.display = 'none';
            mainApp.style.display = 'flex';

            // UYGULAMA VERİLERİNİ YÜKLE (Pusher başlatma kodları buradan tamamen kaldırıldı)
            fetchUserMap().then(() => { 
                loadLeaderboard(); 
                loadOpponents(); 
                loadMyMatchesOverview(); 
                loadOpenRequests(); 
                loadScheduledMatches(); 
                loadLobbyMyActions(); 
                loadAnnouncements(); 
                setupNotifications(user.uid); 
                checkAndShowRecaps(); 
                runLeagueMaintenance(); 
                checkAndSendReminders(); 
                initSpamWarning(); 
                initOnboarding(); 
                checkProfileCompleteness();
            }).catch(err => console.error("Veriler yüklenirken hata:", err));

        } else { 
            // KULLANICI GİRİŞ YAPMAMIŞSA
            authScreen.style.display = 'flex'; 
            mainApp.style.display = 'none'; 
            listeners.forEach(u=>u()); 
            switchAuthTab('login');
        }
    });

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-target'); matchDetailView.style.display = 'none';
            tabSections.forEach(section => section.style.display = 'none'); document.getElementById(targetId).style.display = 'block'; navItems.forEach(nav => nav.classList.remove('active')); item.classList.add('active');

            if (targetId === 'tab-stats') { updateStatsView(auth.currentUser.uid); }
            else if (targetId === 'tab-fixture') { setTodayFilters(); loadMatchesForFixture(); }
            else if (targetId === 'tab-matches') { setHistoryTodayFilters(); loadMyMatchesOverview(); }
            else if (targetId === 'tab-bests') { loadTheBests(bestsFilterSelect.value); }
            // Mevcut kodların arasında uygun bir yere (örneğin tab-bests'ten sonraya) ekle:
            else if (targetId === 'tab-tournaments') { loadTournaments(); }
            else if (targetId === 'tab-chat') { loadChatList(); }
            else if (targetId === 'tab-rankings') { loadLeaderboard(); }
            else if (targetId === 'tab-lobby') { loadLobbyMyActions(); loadOpenRequests(); loadScheduledMatches(); loadAnnouncements(); }
            else if (targetId === 'tab-gallery') { if(galleryFilterDate) galleryFilterDate.value = ''; loadGallery(); }
            else if (targetId === 'tab-profile') {
                const u = userMap[auth.currentUser.uid];
                if(u) {
                    editFullNameInput.value = u.isim || ''; editCourtPreference.value = u.kortTercihi || 'Her İkisi'; const editGender = document.getElementById('edit-gender'); if(editGender) editGender.value = u.cinsiyet || 'Erkek'; document.getElementById('edit-start-date').value = u.tenisBaslangic || ''; document.getElementById('edit-club').value = u.kulup || '';
                    if(editNotificationPreference) editNotificationPreference.value = u.bildirimTercihi || 'ses'; if(editProfilePreview) editProfilePreview.src = u.fotoURL || getSafeAvatar(u.isim);
                    const emailCheckbox = document.getElementById('edit-email-notify'); if(emailCheckbox) { emailCheckbox.checked = (u.emailNotifications !== false); }
                    renderBadges(auth.currentUser.uid, 'my-badges-container'); loadUserPhotos();
                }
            }
        });
    });

    if(btnApplyHistoryFilter) btnApplyHistoryFilter.addEventListener('click', filterMyHistoryMatches);
    if(bestsFilterSelect) bestsFilterSelect.addEventListener('change', (e) => loadTheBests(e.target.value));
    if(btnGalleryFilter) btnGalleryFilter.addEventListener('click', loadGallery);
    if(btnGalleryClear) btnGalleryClear.addEventListener('click', () => { galleryFilterDate.value = ''; galleryFilterCourt.value = ''; galleryFilterPlayer.value = ''; loadGallery(); });

    if(saveProfileBtn) saveProfileBtn.addEventListener('click', async ()=>{ 
        const btn = saveProfileBtn; btn.disabled = true; btn.textContent = "İşleniyor...";
        try {
            const f = editProfilePhotoInput.files[0]; let url = userMap[auth.currentUser.uid].fotoURL; 
            if(f) url = await compressAndConvertToBase64(f, 600);
            await db.collection('users').doc(auth.currentUser.uid).update({ isim: editFullNameInput.value, kortTercihi: editCourtPreference.value, cinsiyet: document.getElementById('edit-gender').value, bildirimTercihi: editNotificationPreference.value, emailNotifications: document.getElementById('edit-email-notify').checked, tenisBaslangic: document.getElementById('edit-start-date').value, kulup: document.getElementById('edit-club').value, fotoURL: url });
            alert("Profil güncellendi! ✅"); location.reload(); 
        } catch (error) { console.error("Hata:", error); alert("Hata: " + error.message); btn.disabled = false; btn.textContent = "Kaydet ve Güncelle"; }
    });
    
    document.querySelectorAll('.close-modal').forEach(b=>b.onclick=function(){this.closest('.modal').style.display='none'}); window.onclick=e=>{if(e.target.classList.contains('modal'))e.target.style.display='none'};
    
    if(btnShowCreateAd) { btnShowCreateAd.addEventListener('click', () => { document.getElementById('challenge-menu-area').style.display = 'none'; createAdForm.style.display = 'block'; challengeForm.style.display = 'none'; }); }
    if(btnShowSpecificChallenge) { btnShowSpecificChallenge.addEventListener('click', () => { document.getElementById('challenge-menu-area').style.display = 'none'; challengeForm.style.display = 'block'; createAdForm.style.display = 'none'; loadOpponents(); }); }

    matchTypeSelect.addEventListener('change', e=>{wagerPointsInput.style.display=e.target.value==='Meydan Okuma'?'block':'none'});
    adMatchTypeSelect.addEventListener('change', e=>{adWagerPointsInput.style.display=e.target.value==='Meydan Okuma'?'block':'none'});
    backToListBtn.addEventListener('click', goBackToList);

    // Çiftler seçildiğinde partner menüsünü göster
    if(adMatchFormat) {
    adMatchFormat.addEventListener('change', (e) => {
        adPartnerContainer.style.display = !e.target.value.includes('Tekler') ? 'block' : 'none';
    });
    }
    if(challengeMatchFormat) {
    challengeMatchFormat.addEventListener('change', (e) => {
        challengePartnerContainer.style.display = !e.target.value.includes('Tekler') ? 'block' : 'none';
    });
    }

    // Turnuva Oluşturma Formunu Göster
    if(btnShowCreateTournament) {
        btnShowCreateTournament.addEventListener('click', () => {
            tournamentListView.style.display = 'none';
            createTournamentForm.style.display = 'block';
        });
    }

// Yeni Turnuvayı Kaydet
    if(btnSaveTournament) {
        btnSaveTournament.addEventListener('click', async () => {
            const name = document.getElementById('tour-name').value.trim();
            const format = document.getElementById('tour-format').value;
            const pointsSystem = document.getElementById('tour-points-system') ? document.getElementById('tour-points-system').value : 'winRate';
            const fee = parseInt(document.getElementById('tour-fee').value) || 0;
            const deadline = document.getElementById('tour-deadline').value;
  // YENİ KAYIT ALANLARI VE LİG YAPISI
            const isDoubles = !format.includes('Tekler');
            const regType = isDoubles ? document.getElementById('tour-reg-type').value : 'manual';
            const autoType = (isDoubles && regType === 'auto') ? document.getElementById('tour-auto-type').value : null;
            const systemType = document.getElementById('tour-system').value;
            
            const leagueDuration = systemType === 'league' ? document.getElementById('tour-league-duration').value : null;
            const leagueWeeks = (systemType === 'league' && leagueDuration === 'custom_weeks') ? parseInt(document.getElementById('tour-league-weeks').value) : null;
            
            let leagueTeamType = 'fixed';
            if (systemType === 'league' && isDoubles && regType === 'auto' && leagueDuration === 'custom_weeks') {
                leagueTeamType = document.getElementById('tour-league-team-type').value;
            }
            
            let standingsType = 'individual';
            if (systemType === 'league' && isDoubles) {
                if (leagueTeamType === 'changing') standingsType = 'individual';
                else standingsType = document.getElementById('tour-standings-type').value;
            }

            if(!name || !deadline) return alert("Lütfen turnuva adını ve son kayıt tarihini girin.");

            try {
                btnSaveTournament.disabled = true;
                btnSaveTournament.textContent = 'Oluşturuluyor...';

                await db.collection('tournaments').add({
                    name: name,
                    format: format,
                    pointsSystem: pointsSystem, // YENİ: Seçilen puan sistemini veritabanına kaydet
                    fee: fee,
                    deadline: firebase.firestore.Timestamp.fromDate(new Date(deadline)),
                    status: 'Kayıt', 
                    creatorId: auth.currentUser.uid, 
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    regType: regType,
                    autoType: autoType,
                    systemType: systemType,
                    leagueDuration: leagueDuration,
                    leagueWeeks: leagueWeeks,
                    leagueTeamType: leagueTeamType,
                    standingsType: standingsType,
                    teamsGenerated: false,
                    participants: [] 
                });

                alert("Turnuva başarıyla oluşturuldu! 🏆");
                createTournamentForm.style.display = 'none';
                tournamentListView.style.display = 'block';
                
                document.getElementById('tour-name').value = '';
                document.getElementById('tour-fee').value = '';
                document.getElementById('tour-deadline').value = '';
                
                loadTournaments();

            } catch(e) {
                console.error("Turnuva oluşturma hatası: ", e);
                alert("Hata oluştu: " + e.message);
            } finally {
                btnSaveTournament.disabled = false;
                btnSaveTournament.textContent = 'Turnuvayı Başlat 🚀';
            }
        });
    }

    if (authActionBtn) {
        authActionBtn.addEventListener('click', async () => {
            const email = emailInput.value; const password = passwordInput.value;
            if (!email || !password) { authError.textContent = "E-posta ve şifre zorunludur."; authError.style.display = 'block'; return; }
            if (isLoginMode) {
                auth.signInWithEmailAndPassword(email, password).catch(e => { authError.style.display = 'block'; authError.textContent = "Giriş Hatası: " + e.message; });
            } else {
                try {
                    const c = await auth.createUserWithEmailAndPassword(email, password); let url = null;
                    if(profilePhotoInput.files[0]) url = await compressAndConvertToBase64(profilePhotoInput.files[0], 800, 0.8);
                    await db.collection('users').doc(c.user.uid).set({ email: email, isim: fullNameInput.value || email.split('@')[0], kortTercihi: courtPreferenceSelect.value || 'Farketmez', cinsiyet: document.getElementById('register-gender').value || 'Erkek', tenisBaslangic: document.getElementById('register-start-date').value || '', kulup: document.getElementById('register-club').value || '', fotoURL: url, toplamPuan: 1000, bildirimTercihi: 'ses', emailNotifications: true, macSayisi: 0, galibiyetSayisi: 0, badges: [], kayitTari: firebase.firestore.FieldValue.serverTimestamp() });
                } catch(e) { authError.style.display = 'block'; authError.textContent = "Kayıt Hatası: " + e.message; }
            }
        });
    }

submitChallengeBtn.addEventListener('click', async () => {
        const oid = opponentSelect.value; 
        const mt = matchTypeSelect.value; 
        let wp = parseInt(wagerPointsInput.value);

        // --- YENİ EKLENEN ÇİFTLER KONTROLLERİ ---
        const format = challengeMatchFormat ? challengeMatchFormat.value : 'Tekler';
        const partnerID = challengePartnerSelect ? challengePartnerSelect.value : '';
        // ----------------------------------------

        if (!oid) return alert("Lütfen bir rakip seçin!");
        
        // --- YENİ EKLENEN PARTNER DOĞRULAMASI ---
        if (format !== 'Tekler' && !partnerID) {
            return alert("Lütfen çiftler maçı için bir partner seçin!");
        }
        if (format !== 'Tekler' && partnerID === oid) {
            return alert("Partneriniz ile rakibiniz aynı kişi olamaz!");
        }
        // ----------------------------------------

        if (mt === 'Meydan Okuma' && (isNaN(wp) || wp < 50 || wp % 50 !== 0)) { return alert("Bahis puanı en az 50 olmalı ve 50'nin katları olmalıdır!"); }
        
        const me = userMap[auth.currentUser.uid]; const op = userMap[oid]; 
        
        if (mt === 'Meydan Okuma') {
            if (me.toplamPuan < 0) return alert("Puanın eksiye düştüğü için bahisli maç teklif edemezsin.");
            if (op.toplamPuan < 0) return alert("Rakibin puanı eksi olduğu için bahisli maç kabul edemez.");
            if (wp > me.toplamPuan * 0.5) return alert("Maksimum bahis, toplam puanının yarısı olabilir.");
            if (wp > op.toplamPuan * 0.5) return alert("Bu bahis miktarı rakibin puan limitini aşıyor.");
        }
        
        try {
            // --- EKLENEN YENİ ALANLAR (macFormati, oyuncu1PartnerID, oyuncu2PartnerID) ---
            await db.collection('matches').add({ 
                oyuncu1ID: auth.currentUser.uid, 
                oyuncu1PartnerID: format !== 'Tekler' ? partnerID : null,
                oyuncu2ID: oid, 
                oyuncu2PartnerID: null, // Rakip maçı kabul ederken kendi partnerini seçecek
                macFormati: format,
                macTipi: mt, 
                bahisPuani: wp || 0, 
                durum: 'Bekliyor', 
                tarih: firebase.firestore.FieldValue.serverTimestamp(), 
                kayitliKazananID: null 
            });
            
            const senderName = me.isim || 'Bir oyuncu'; const mailSubject = "⚔️ Meydan Okuma Geldi!";
            // Maile format bilgisini de ekledik
            const mailBody = `<p><strong>${senderName}</strong> sana özel bir maç teklifi gönderdi.</p><div style="background-color:#fff3cd; padding:10px; border-radius:5px; border:1px solid #ffeeba; margin:10px 0;"><p><strong>Maç Tipi:</strong> ${mt}</p><p><strong>Format:</strong> ${format}</p><p><strong>Bahis:</strong> ${wp || 0} Puan</p></div><p>Teklifi kabul etmek veya reddetmek için uygulamaya aşağıdaki adresten gidebilirsin:</p><p><a href="https://bursatenisligi.github.io/TenisLig/">https://bursatenisligi.github.io/TenisLig/</a></p>`;
            sendNotificationEmail(oid, mailSubject, mailBody);
            
            alert("Teklif başarıyla gönderildi! Rakibine mail ile haber verildi. 📨"); challengeForm.style.display = 'none'; document.querySelector('[data-target="tab-matches"]').click();
        } catch (error) { console.error("Teklif gönderme hatası:", error); alert("Bir hata oluştu: " + error.message); }
    });

    submitAdBtn.addEventListener('click', async () => {
        const mt = adMatchTypeSelect.value; 
        let wp = parseInt(adWagerPointsInput.value);
        
        // --- YENİ EKLENEN ÇİFTLER KONTROLLERİ ---
        const format = adMatchFormat ? adMatchFormat.value : 'Tekler';
        const partnerID = adPartnerSelect ? adPartnerSelect.value : '';
        // ----------------------------------------

        const checkboxes = document.querySelectorAll('input[name="allowed-leagues"]:checked'); const allowedLeagues = Array.from(checkboxes).map(cb => cb.value);
        if (allowedLeagues.length === 0) { return alert("Lütfen bu ilanı kabul edebilecek en az bir lig seçin!"); }
        
        // --- YENİ EKLENEN PARTNER DOĞRULAMASI ---
        if (format !== 'Tekler' && !partnerID) {
            return alert("Lütfen çiftler maçı için bir partner seçin!");
        }
        // ----------------------------------------

        if(mt === 'Meydan Okuma' && (isNaN(wp)||wp<50||wp%50!==0)) { return alert("Bahis puanı en az 50 ve 50'nin katları olmalıdır!"); }
        const me = userMap[auth.currentUser.uid];
        if (mt === 'Meydan Okuma') { if (me.toplamPuan < 0) return alert("Puanın eksiye düştüğü için bahisli ilan açamazsın."); if (wp > me.toplamPuan * 0.5) return alert("Maksimum bahis toplam puanının yarısı olabilir."); }
        
        try {
            // --- EKLENEN YENİ ALANLAR (macFormati, oyuncu1PartnerID, oyuncu2PartnerID) ---
            await db.collection('matches').add({ 
                oyuncu1ID: auth.currentUser.uid, 
                oyuncu1PartnerID: format !== 'Tekler' ? partnerID : null,
                oyuncu2ID: null, 
                oyuncu2PartnerID: null,
                macFormati: format,
                macTipi: mt, 
                bahisPuani: wp || 0, 
                durum: 'Acik_Ilan', 
                tarih: firebase.firestore.FieldValue.serverTimestamp(), 
                kayitliKazananID: null, 
                allowedLeagues: allowedLeagues 
            });
            
            const myName = me.isim || 'Bir oyuncu'; const leagueText = allowedLeagues.join(', ');
            const subject = "📢 Yeni Kort İlanı!";
            // Maile format bilgisini de ekledik
            const body = `<p><strong>${myName}</strong> herkese açık bir maç ilanı oluşturdu!</p><div style="background-color:#f8f9fa; padding:10px; border-left:4px solid #28a745; margin:10px 0;"><p><strong>Maç Tipi:</strong> ${mt}</p><p><strong>Format:</strong> ${format}</p><p><strong>Bahis:</strong> ${wp || 0} Puan</p><p><strong>Kabul Edebilen Ligler:</strong> ${leagueText}</p></div><p>Kendine güveniyorsan hemen uygulamaya girip ilanı kabul et:</p><p><a href="https://bursatenisligi.github.io/TenisLig/">https://bursatenisligi.github.io/TenisLig/</a></p>`;
            const allUserIds = Object.keys(userMap);
            allUserIds.forEach(uid => { if (uid !== auth.currentUser.uid) { sendNotificationEmail(uid, subject, body); } });
            
            alert("İlan başarıyla yayınlandı ve oyunculara mail gönderildi! 📢"); createAdForm.style.display = 'none'; loadOpenRequests(); document.querySelector('[data-target="tab-lobby"]').click(); 
        } catch (error) { console.error("İlan oluşturma hatası:", error); alert("Hata oluştu: " + error.message); }
    });

    if(applyFiltersBtn) applyFiltersBtn.addEventListener('click', () => loadMatchesForFixture());
    if(clearFiltersBtn) clearFiltersBtn.addEventListener('click', () => { filterDateStart.value = ''; filterDateEnd.value = ''; filterCourt.value = ''; filterPlayer.value = ''; loadMatchesForFixture(); });
    if(logoutBtnProfile) logoutBtnProfile.addEventListener('click', ()=> { if(confirm("Çıkış yapmak istediğinize emin misiniz?")) { auth.signOut(); window.location.reload(); } });
    
    if (profilePhotoInput) { profilePhotoInput.addEventListener('change', async (e) => { const file = e.target.files[0]; if(file) { const base64 = await compressAndConvertToBase64(file, 800, 0.8); if(profilePreview) profilePreview.src = base64; } }); }
    if (editProfilePhotoInput) { editProfilePhotoInput.addEventListener('change', async (e) => { const file = e.target.files[0]; if(file) { const base64 = await compressAndConvertToBase64(file, 800, 0.8); if(editProfilePreview) editProfilePreview.src = base64; } }); }
    if(matchResultPhotoInput) { matchResultPhotoInput.addEventListener('change', async (e) => { const file = e.target.files[0]; if(file) { const base64 = await compressAndConvertToBase64(file, 1024, 0.8); if(matchUploadPreview) { matchUploadPreview.src = base64; matchUploadPreview.style.display = 'inline-block'; } } }); }
    
    function loadMatchInteractions(matchId, matchData) {
        const container = document.getElementById('match-interactions-container'); const myUid = auth.currentUser.uid;
        if (matchData.durum === 'Acik_Ilan' || !matchData.oyuncu2ID) { container.style.display = 'none'; return; }
        container.style.display = 'block';

        const p1Name = userMap[matchData.oyuncu1ID]?.isim || 'Oyuncu 1'; const p2Name = userMap[matchData.oyuncu2ID]?.isim || 'Oyuncu 2';
        const pollLoading = document.getElementById('poll-loading'); const votingArea = document.getElementById('poll-voting-area'); const resultsArea = document.getElementById('poll-results-area'); const btnP1 = document.getElementById('btn-vote-p1'); const btnP2 = document.getElementById('btn-vote-p2');
        btnP1.textContent = `Oy: ${p1Name}`; btnP2.textContent = `Oy: ${p2Name}`;
        btnP1.onclick = () => castVote(matchId, 'p1', p1Name); btnP2.onclick = () => castVote(matchId, 'p2', p2Name);

        const votesRef = db.collection('matches').doc(matchId).collection('votes');
        const voteUnsub = votesRef.onSnapshot(snapshot => {
            if(pollLoading) pollLoading.style.display = 'none';
            let p1Votes = 0; let p2Votes = 0; let iVoted = false;
            snapshot.forEach(doc => { const data = doc.data(); if (data.choice === 'p1') p1Votes++; else if (data.choice === 'p2') p2Votes++; if (doc.id === myUid || data.userId === myUid) { iVoted = true; } });
            const total = p1Votes + p2Votes;
            if (matchData.durum === 'Tamamlandı' || iVoted) {
                if(votingArea) votingArea.style.display = 'none'; if(resultsArea) resultsArea.style.display = 'block';
                const p1Perc = total > 0 ? Math.round((p1Votes / total) * 100) : 0; const p2Perc = total > 0 ? Math.round((p2Votes / total) * 100) : 0;
                const nameP1 = document.getElementById('poll-name-p1'); const nameP2 = document.getElementById('poll-name-p2'); if(nameP1) nameP1.textContent = p1Name; if(nameP2) nameP2.textContent = p2Name;
                const percP1 = document.getElementById('poll-perc-p1'); const percP2 = document.getElementById('poll-perc-p2'); if(percP1) percP1.textContent = `%${p1Perc} (${p1Votes})`; if(percP2) percP2.textContent = `%${p2Perc} (${p2Votes})`;
                const barP1 = document.getElementById('poll-bar-p1'); const barP2 = document.getElementById('poll-bar-p2'); if(barP1) barP1.style.width = `${p1Perc}%`; if(barP2) barP2.style.width = `${p2Perc}%`;
                const totalVotes = document.getElementById('poll-total-votes'); if(totalVotes) totalVotes.textContent = total;
            } else { if(votingArea) votingArea.style.display = 'block'; if(resultsArea) resultsArea.style.display = 'none'; }
        });
        matchInteractionListeners.push(voteUnsub);

        const commentsList = document.getElementById('match-comments-list'); const btnSend = document.getElementById('btn-send-match-comment'); const inputComment = document.getElementById('match-comment-input');
        if(btnSend) btnSend.onclick = () => sendMatchComment(matchId, inputComment);
        const commentsRef = db.collection('matches').doc(matchId).collection('comments').orderBy('timestamp', 'asc');
        const commentUnsub = commentsRef.onSnapshot(snapshot => {
            if(!commentsList) return; commentsList.innerHTML = '';
            if (snapshot.empty) { commentsList.innerHTML = '<p style="text-align:center; color:#999; font-size:0.9em;">İlk yorumu sen yap! 👇</p>'; return; }
            snapshot.forEach(doc => {
                const c = doc.data(); const timeStr = c.timestamp ? c.timestamp.toDate().toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day:'numeric', month:'numeric' }) : ''; const isMe = c.userId === myUid;
                const div = document.createElement('div'); div.className = 'comment-item'; if(isMe) div.style.borderLeft = '3px solid #c06035';
                div.innerHTML = `<div class="comment-header"><span class="comment-author">${c.userName}</span><span>${timeStr}</span></div><div class="comment-text">${c.text}</div>`; commentsList.appendChild(div);
            });
            commentsList.scrollTop = commentsList.scrollHeight;
        });
        matchInteractionListeners.push(commentUnsub);
    }

    async function castVote(matchId, choice, playerName) {
        try { await db.collection('matches').doc(matchId).collection('votes').doc(auth.currentUser.uid).set({ choice: choice, userId: auth.currentUser.uid, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); } catch (error) { console.error("Oy verme hatası:", error); alert("Oy verirken bir hata oluştu."); }
    }

    async function sendMatchComment(matchId, inputEl) {
        const text = inputEl.value.trim(); if (!text) return;
        const myUid = auth.currentUser.uid; const myUser = userMap[myUid]; const userName = myUser ? myUser.isim : 'Bilinmeyen';
        try {
            inputEl.value = '';
            await db.collection('matches').doc(matchId).collection('comments').add({ text: text, userId: myUid, userName: userName, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
            const matchDoc = await db.collection('matches').doc(matchId).get();
            if (matchDoc.exists) {
                const m = matchDoc.data(); let targets = [];
                if (m.oyuncu1ID && m.oyuncu1ID !== myUid) targets.push(m.oyuncu1ID);
                if (m.oyuncu2ID && m.oyuncu2ID !== myUid) targets.push(m.oyuncu2ID);
                const subject = "💬 Maçına Yeni Yorum Yapıldı";
                const body = `<p><strong>${userName}</strong> maç sayfasına bir yorum bıraktı:</p><blockquote style="background-color:#f9f9f9; border-left: 4px solid #ccc; padding: 10px; margin: 10px 0;">"${text}"</blockquote><p>Cevap vermek için uygulamaya git: <a href="https://bursatenisligi.github.io/TenisLig/">Tenis Ligi</a></p>`;
                targets.forEach(uid => { sendNotificationEmail(uid, subject, body); });
            }
        } catch (error) { console.error("Yorum hatası:", error); alert("Yorum gönderilemedi."); }
    }

    const standaloneInput = document.getElementById('standalone-photo-input');
    if(standaloneInput) {
        standaloneInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) { const base64 = await compressAndConvertToBase64(file, 1024, 0.8); const preview = document.getElementById('standalone-photo-preview'); preview.src = base64; preview.style.display = 'inline-block'; }
        });
    }

    async function saveOnlyPhoto(matchId) {
        const input = document.getElementById('standalone-photo-input'); const file = input.files[0];
        if (!file) { alert("Lütfen önce bir fotoğraf seçin."); return; }
        const btn = document.getElementById('btn-save-photo-only'); btn.textContent = "Yükleniyor..."; btn.disabled = true;
        try {
            const photoUrl = await compressAndConvertToBase64(file, 1024, 0.8);
            await db.collection('matches').doc(matchId).update({ macFotoURL: photoUrl });
            alert("Fotoğraf başarıyla güncellendi! 📸"); showMatchDetail(matchId); 
        } catch (error) { console.error("Fotoğraf yükleme hatası:", error); alert("Fotoğraf yüklenirken bir hata oluştu."); } finally { btn.textContent = "Fotoğrafı Kaydet 💾"; btn.disabled = false; }
    }

    async function deleteAccount() {
        if(!confirm("⚠️ DİKKAT: Hesabınızı silmek üzeresiniz!\n\nBu işlem geri alınamaz. Tüm maç geçmişiniz, puanlarınız ve fotoğraflarınız silinecektir.\n\nDevam etmek istiyor musunuz?")) return;
        const verification = prompt("Silme işlemini onaylamak için lütfen aşağıya 'SİL' yazın:"); if (verification !== 'SİL') { alert("İşlem iptal edildi. Doğru kelimeyi girmediniz."); return; }
        const user = auth.currentUser; const uid = user.uid; const btn = document.getElementById('btn-delete-account');
        try {
            btn.disabled = true; btn.textContent = "Siliniyor...";
            await db.collection('users').doc(uid).delete(); await user.delete();
            alert("Hesabınız başarıyla silindi. Sizi özleyeceğiz! 👋"); window.location.reload(); 
        } catch (error) {
            if (error.code === 'auth/requires-recent-login') { alert("Güvenlik gereği, hesabınızı silmek için oturumunuzu tazelemeniz gerekiyor. Lütfen Çıkış Yapıp tekrar giriş yapın ve tekrar deneyin."); } else { alert("Bir hata oluştu: " + error.message); }
            btn.disabled = false; btn.textContent = "Hesabımı Kalıcı Olarak Sil";
        }
    }
    const btnDeleteAccount = document.getElementById('btn-delete-account'); if(btnDeleteAccount) { btnDeleteAccount.addEventListener('click', deleteAccount); }

    function initSpamWarning() {
        const alertBox = document.getElementById('email-spam-alert'); const closeBtn = document.getElementById('btn-close-spam-alert');
        const isDismissed = localStorage.getItem('tenisLigi_spamAlertDismissed');
        if (!isDismissed && alertBox) { alertBox.style.display = 'flex'; setTimeout(() => { if(alertBox) alertBox.style.display = 'none'; }, 5000); }
        if (closeBtn) { closeBtn.addEventListener('click', function() { if(alertBox) alertBox.style.display = 'none'; localStorage.setItem('tenisLigi_spamAlertDismissed', 'true'); }); }
    }

    function checkProfileCompleteness() {
        const userId = firebase.auth().currentUser.uid; const user = userMap[userId]; const alertBox = document.getElementById('profile-incomplete-alert');
        if (!user || !alertBox) return;
        const isPhotoMissing = !user.fotoURL || user.fotoURL.includes('placeholder') || user.fotoURL.includes('via.placeholder.com'); const isClubMissing = !user.kulup || user.kulup === 'Belirtilmemiş';
        if (!isPhotoMissing && !isClubMissing) return;
        const lastDismissed = localStorage.getItem('tenisLigi_profileAlertDismissedTime'); const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; const now = Date.now();
        if (lastDismissed && (now - parseInt(lastDismissed) < THREE_DAYS_MS)) { return; }

        alertBox.style.display = 'flex';
        const msgTitle = alertBox.querySelector('strong'); const msgText = alertBox.querySelector('p');
        if (isPhotoMissing && !isClubMissing) { msgTitle.textContent = "Hayalet Oyuncu Olma! 👻"; msgText.textContent = "Kortlarda tanınmak için bir profil fotoğrafı yüklemelisin."; } else if (!isPhotoMissing && isClubMissing) { msgTitle.textContent = "Hangi Kulüptesin? 🏟️"; msgText.textContent = "Profiline kulüp bilgisini ekleyerek rakiplerini bilgilendir."; }
        document.getElementById('btn-fix-profile').onclick = () => { alertBox.style.display = 'none'; document.querySelector('[data-target="tab-profile"]').click(); };
        document.getElementById('btn-close-profile-alert').onclick = () => { alertBox.style.display = 'none'; localStorage.setItem('tenisLigi_profileAlertDismissedTime', Date.now().toString()); };
    }

    const leaderboardFilter = document.getElementById('leaderboard-club-filter');
    if (leaderboardFilter) { leaderboardFilter.addEventListener('change', (e) => { loadLeaderboard(e.target.value); }); }

    const CURRENT_GUIDE_VERSION = 'v1_baslangic'; 
    function initOnboarding() {
        const modal = document.getElementById('onboarding-modal'); const closeBtn = document.getElementById('close-onboarding'); const nextBtn = document.getElementById('btn-next-slide'); const finishBtn = document.getElementById('btn-finish-onboarding'); const slides = document.querySelectorAll('.onboarding-slide'); const dots = document.querySelectorAll('.dot');
        const seenVersion = localStorage.getItem('tenisLigi_guideVersion');
        if (seenVersion !== CURRENT_GUIDE_VERSION) { modal.style.display = 'flex'; }
        let currentSlide = 0;
        function showSlide(index) {
            slides.forEach(s => s.classList.remove('active-slide')); slides[index].classList.add('active-slide');
            dots.forEach(d => d.classList.remove('active')); dots[index].classList.add('active');
            if (index === slides.length - 1) { nextBtn.style.display = 'none'; finishBtn.style.display = 'inline-block'; } else { nextBtn.style.display = 'inline-block'; finishBtn.style.display = 'none'; nextBtn.textContent = index === 0 ? "Başlayalım 👉" : "İlerle 👉"; }
        }
        nextBtn.onclick = () => { if (currentSlide < slides.length - 1) { currentSlide++; showSlide(currentSlide); } };
        const closeOnboarding = () => { modal.style.display = 'none'; localStorage.setItem('tenisLigi_guideVersion', CURRENT_GUIDE_VERSION); };
        finishBtn.onclick = closeOnboarding; closeBtn.onclick = closeOnboarding;
    }

    async function getPeriodStats(userId, startDate, endDate) {
        const q1 = db.collection('matches').where('oyuncu1ID', '==', userId).where('durum', '==', 'Tamamlandı').get(); const q2 = db.collection('matches').where('oyuncu2ID', '==', userId).where('durum', '==', 'Tamamlandı').get();
        const [s1, s2] = await Promise.all([q1, q2]); let matches = [];
        const process = (doc) => { const m = doc.data(); const d = m.macZamani ? m.macZamani.toDate() : (m.tarih ? m.tarih.toDate() : null); if (d && d >= startDate && d <= endDate) { matches.push({ ...m, id: doc.id }); } };
        s1.forEach(process); s2.forEach(process);
        matches = matches.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);
        if (matches.length === 0) return null;
        let stats = { totalMatches: matches.length, wins: 0, pointsEarned: 0, photos: [] };
        matches.forEach(m => {
            const isWinner = m.kayitliKazananID === userId; if (isWinner) stats.wins++;
            let pts = 50; if (m.macTipi === 'Meydan Okuma') pts = m.bahisPuani || 50;
            if (isWinner) stats.pointsEarned += pts; else stats.pointsEarned += 10; 
            if (m.macFotoURL) stats.photos.push(m.macFotoURL);
        });
        return stats;
    }

    async function checkAndShowRecaps() {
        const userId = auth.currentUser.uid; const now = new Date();
        const prevMonthDate = new Date(); prevMonthDate.setDate(1); prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
        const pYear = prevMonthDate.getFullYear(); const pMonth = prevMonthDate.getMonth(); const pMonthName = prevMonthDate.toLocaleString('tr-TR', { month: 'long' });
        const storageKeyMonth = `tenisLigi_recap_${userId}_${pYear}_${pMonth}`; const hasSeenMonth = localStorage.getItem(storageKeyMonth);

        if (!hasSeenMonth) {
            const start = new Date(pYear, pMonth, 1); const end = new Date(pYear, pMonth + 1, 0, 23, 59, 59);
            const stats = await getPeriodStats(userId, start, end);
            if (stats && stats.totalMatches > 0) { showRecapModal('month', pMonthName, stats); localStorage.setItem(storageKeyMonth, 'true'); return; }
        }

        if (now.getMonth() === 0) { 
            const lastYear = now.getFullYear() - 1; const storageKeyYear = `tenisLigi_recap_${userId}_${lastYear}_YEAR`; const hasSeenYear = localStorage.getItem(storageKeyYear);
            if (!hasSeenYear) {
                const start = new Date(lastYear, 0, 1); const end = new Date(lastYear, 11, 31, 23, 59, 59);
                const stats = await getPeriodStats(userId, start, end);
                if (stats && stats.totalMatches > 5) { showRecapModal('year', lastYear, stats); localStorage.setItem(storageKeyYear, 'true'); }
            }
        }
    }

    function showRecapModal(type, titlePeriod, stats) {
        const modal = document.getElementById('recap-modal'); const title = document.getElementById('recap-title'); const subtitle = document.getElementById('recap-subtitle'); const closeBtn = document.getElementById('close-recap'); const shareBtn = document.getElementById('btn-share-recap');
        const elMatches = document.getElementById('recap-matches'); const elWins = document.getElementById('recap-wins'); const elRate = document.getElementById('recap-rate'); const elPoints = document.getElementById('recap-points'); const photoArea = document.getElementById('recap-photos-area'); const photoGrid = document.getElementById('recap-photo-grid'); const message = document.getElementById('recap-message');

        if (type === 'month') { title.textContent = `${titlePeriod} Özeti`; subtitle.textContent = "Geçen ayın performansı"; document.querySelector('.recap-content').style.background = "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)"; } 
        else { title.textContent = `${titlePeriod} Özeti 🏆`; subtitle.textContent = "Koskoca bir tenis yılı!"; document.querySelector('.recap-content').style.background = "linear-gradient(135deg, #c06035 0%, #8d4020 100%)"; }

        elMatches.textContent = stats.totalMatches; elWins.textContent = stats.wins; const winRate = Math.round((stats.wins / stats.totalMatches) * 100); elRate.textContent = `%${winRate}`; elPoints.textContent = stats.pointsEarned; 

        if (winRate > 70) message.textContent = "🔥 Kortları ateşe verdin! İnanılmaz bir performans."; else if (winRate > 40) message.textContent = "💪 Mücadeleci ruhunla harika maçlar çıkardın."; else message.textContent = "🎾 Önemli olan katılmaktı! Gelecek dönem senin olacak.";

        if (stats.photos.length > 0) {
            photoArea.style.display = 'block'; photoGrid.innerHTML = '';
            const shuffled = stats.photos.sort(() => 0.5 - Math.random()).slice(0, 3);
            shuffled.forEach(url => { const img = document.createElement('img'); img.src = url; img.className = 'recap-photo-thumb'; photoGrid.appendChild(img); });
        } else { photoArea.style.display = 'none'; }

        modal.style.display = 'flex';
        if (window.confetti) { var duration = 3000; var end = Date.now() + duration; (function frame() { confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } }); confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } }); if (Date.now() < end) requestAnimationFrame(frame); }()); }

        const closeModal = () => { modal.style.display = 'none'; }; closeBtn.onclick = closeModal;
        shareBtn.onclick = () => { shareElementAsImage('recap-capture-area', 'tenis-ozet', 'btn-share-recap'); };
    }

async function shareElementAsImage(elementId, fileNamePrefix, buttonId) {
        const element = document.getElementById(elementId); const button = document.getElementById(buttonId);
        if (!element || !button) return;
        const originalText = button.innerHTML; const originalColor = button.style.background;
        button.innerHTML = '⏳ Görüntü Oluşturuluyor...'; button.style.background = '#6c757d'; button.disabled = true;

        try {
            const canvas = await html2canvas(element, {
                scale: 2, useCORS: true, allowTaint: false, backgroundColor: "#ffffff", logging: true,
                ignoreElements: (el) => { return el.tagName === 'BUTTON' || el.id === 'btn-share-match-detail' || el.classList.contains('close-modal'); }
            });

            canvas.toBlob(async (blob) => {
                if (!blob) { throw new Error("Canvas blob oluşturulamadı."); }
                const file = new File([blob], `${fileNamePrefix}.png`, { type: 'image/png' });
                button.innerHTML = '📲 ŞİMDİ PAYLAŞ (HAZIR!)'; button.disabled = false; button.style.background = '#28a745'; 
                
                const readyBtn = button.cloneNode(true); button.parentNode.replaceChild(readyBtn, button);

                readyBtn.addEventListener('click', async () => {
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        // PAYLAŞIM YAZISI BURADA DÜZELTİLDİ:
                        try { await navigator.share({ files: [file], title: 'Tenis Ligi', text: 'https://bursatenisligi.github.io/TenisLig/' }); cleanupAfterShare(readyBtn, originalText, originalColor); } 
                        catch (err) { console.log("Paylaşım iptal:", err); cleanupAfterShare(readyBtn, originalText, originalColor); }
                    } else {
                        const link = document.createElement('a'); link.download = `${fileNamePrefix}-${Date.now()}.png`; link.href = canvas.toDataURL(); link.click(); cleanupAfterShare(readyBtn, originalText, originalColor);
                    }
                });
            }, 'image/png');
        } catch (error) {
            console.error("html2canvas Hatası:", error); alert("Görüntü oluşturulamadı. Lütfen internet bağlantınızı kontrol edin veya profil fotoğrafınızı güncelleyin.");
            button.innerHTML = originalText; button.style.background = originalColor; button.disabled = false;
            const tempBanner = document.getElementById('temp-branding-match'); if(tempBanner) tempBanner.remove();
            const shareCard = document.getElementById('share-card-temp'); if(shareCard) shareCard.remove();
        }
    }

    function cleanupAfterShare(btn, origTxt, origCol) {
        const tempBanner = document.getElementById('temp-branding-match'); if(tempBanner) tempBanner.remove();
        btn.innerHTML = "✅ Paylaşıldı / İndirildi"; btn.disabled = true; 
        setTimeout(() => { btn.innerHTML = origTxt; btn.style.background = origCol; btn.disabled = false; }, 2000);
    }

    window.showMatchDetail = showMatchDetail; window.showPlayerStats = showPlayerStats; window.acceptOpenRequest = acceptOpenRequest;
    
    window.goToCreateAd = function() {
        const tabBtn = document.querySelector('[data-target="tab-challenge"]'); if(tabBtn) tabBtn.click();
        setTimeout(() => { const createBtn = document.getElementById('btn-show-create-ad'); if(createBtn) createBtn.click(); }, 100);
    };

    window.returnToChallengeMenu = function() {
        document.getElementById('challenge-menu-area').style.display = 'flex'; document.getElementById('create-ad-form').style.display = 'none'; document.getElementById('challenge-form').style.display = 'none';
    };

    function loadLobbyMyActions() {
        const container = document.getElementById('lobby-actions-container'); const card = document.getElementById('lobby-actions-card');
        if (!container || !card) return; const myUid = auth.currentUser.uid;

        db.collection('matches').where('durum', 'in', ['Bekliyor', 'Hazır', 'Sonuç_Bekleniyor']).get().then(snapshot => {
            let myActions = [];
            snapshot.forEach(doc => {
                const m = doc.data(); const mid = doc.id;
                if (m.oyuncu1ID !== myUid && m.oyuncu2ID !== myUid) return;

                if (m.durum === 'Sonuç_Bekleniyor' && m.sonucuGirenID !== myUid) {
                    myActions.push({ id: mid, type: 'approve', priority: 1, text: '⚖️ Skor Onayı Bekleniyor', sub: 'Rakibin sonucu girdi, onayla veya itiraz et.', color: 'bg-orange-light' });
                }
                else if (m.durum === 'Bekliyor' && m.oyuncu2ID === myUid) {
                    myActions.push({ id: mid, type: 'invite', priority: 2, text: '⚔️ Maç Teklifi Var', sub: `${userMap[m.oyuncu1ID]?.isim || 'Rakip'} sana meydan okudu!`, color: 'bg-purple-light' });
                }
                else if (m.durum === 'Hazır') {
                    if (m.macZamani) {
                        const matchDate = m.macZamani.toDate(); const now = new Date(); const diffHours = (matchDate - now) / (1000 * 60 * 60);
                        if (diffHours < -2) {
                            myActions.push({ id: mid, type: 'enter_score', priority: 0, text: '📝 Skoru Gir', sub: 'Maç saati geçti, sonucu girmeyi unutma!', color: 'bg-red-light', style: 'border: 1px solid red;' }); return; 
                        } else if (diffHours <= 48) {
                            const timeStr = matchDate.toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}); const dayStr = matchDate.getDate() === now.getDate() ? 'Bugün' : 'Yarın';
                            myActions.push({ id: mid, type: 'match', priority: 3, text: `🎾 Maçın Var (${dayStr})`, sub: `Saat: ${timeStr} - ${m.macYeri || 'Kort ?'}`, color: 'bg-green-light' });
                        }
                    } else {
                         myActions.push({ id: mid, type: 'plan', priority: 4, text: '📅 Tarih Belirle', sub: 'Maçınız onaylandı, zamanı planlayın.', color: 'bg-blue-light' });
                    }
                }
            });

            container.innerHTML = '';
            if (myActions.length === 0) { card.style.display = 'none'; return; }
            card.style.display = 'block'; myActions.sort((a, b) => a.priority - b.priority);

            myActions.forEach(action => {
                const div = document.createElement('div'); div.className = 'compact-news-row'; if(action.style) div.style = action.style; 
                div.onclick = () => { returnToTab = 'tab-lobby'; showMatchDetail(action.id); };
                div.innerHTML = `<div class="compact-left"><div style="font-size:1.4em;">${action.type === 'approve' ? '⚖️' : (action.type === 'invite' ? '📩' : (action.type === 'enter_score' ? '📝' : '⏰'))}</div></div><div class="compact-mid"><div class="compact-title" style="color:#d35400;">${action.text}</div><div class="compact-subtitle">${action.sub}</div></div><div class="compact-right"><span class="compact-badge ${action.color}" style="font-size:0.7em;">GİT -></span></div>`;
                container.appendChild(div);
            });
        }).catch(err => console.error("Aksiyonlar yüklenirken hata:", err));

    }

// --- TURNUVALARI LİSTELEME ---
    function loadTournaments() {
        if(!activeTournamentsContainer) return;
        activeTournamentsContainer.innerHTML = '<p style="text-align:center; color:#999;">Yükleniyor...</p>';

        const adminControls = document.getElementById('admin-tournament-controls');
        // Not: Şimdilik "Yeni Turnuva Aç" butonunu herkese açık yaptık. 
        // İleride sadece senin (Admin) görmeni istersen buraya bir UID if'i koyabiliriz.
        if (adminControls) adminControls.style.display = 'block'; 

        db.collection('tournaments').orderBy('createdAt', 'desc').get().then(snapshot => {
            activeTournamentsContainer.innerHTML = '';
            
            if(snapshot.empty) {
                activeTournamentsContainer.innerHTML = '<p style="text-align:center; color:#777; padding:15px;">Aktif turnuva bulunmuyor.</p>';
                return;
            }

            snapshot.forEach(doc => {
                const t = doc.data();
                const tId = doc.id;
                
                // Tarihi güzel formata çevir
                const dateStr = t.deadline ? t.deadline.toDate().toLocaleString('tr-TR', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}) : 'Belirtilmedi';

                // Duruma göre rozet rengi
                let statusBadge = '';
                if(t.status === 'Kayıt') statusBadge = '<span class="match-status-badge status-green">Kayıtlar Açık</span>';
                else if(t.status === 'Kapalı') statusBadge = '<span class="match-status-badge status-yellow">Kayıtlar Kapandı</span>';
                else if(t.status === 'Devam Ediyor') statusBadge = '<span class="match-status-badge status-blue">Devam Ediyor</span>';
                else statusBadge = '<span class="match-status-badge status-gray">Bitti</span>';

                // Kartı oluştur
                const card = document.createElement('div');
                card.className = 'modern-list-item';
                card.onclick = () => openTournamentDetail(tId, t); // Tıklayınca detaya gidecek

                card.innerHTML = `
                    <div class="list-item-left">
                        <div class="list-item-icon" style="background:#fff3e0; color:#e65100;">🏆</div>
                    </div>
                    <div class="list-item-content">
                        <div class="list-item-title">${t.name}</div>
                        <div class="list-item-subtitle">${t.format} • Katılım: ${t.fee} Puan<br>Son Kayıt: <strong>${dateStr}</strong></div>
                    </div>
                    <div class="list-item-right">
                        ${statusBadge}
                        <span style="font-size:0.8em; margin-top:5px; color:#c06035; font-weight:bold;">${t.participants ? t.participants.length : 0} Kayıt</span>
                    </div>
                `;
                activeTournamentsContainer.appendChild(card);
            });
        }).catch(err => {
            console.error("Turnuva yükleme hatası:", err);
            activeTournamentsContainer.innerHTML = '<p style="text-align:center; color:red;">Yüklenemedi.</p>';
        });
    }

    
// --- YÖNETİCİ: HATALI MAÇLARI VE MANUEL OYUNCU DEĞİŞİKLİKLERİNİ TABLOYA ZORLA İŞLEME (SÜPER SENKRONİZASYON) ---
 // --- YÖNETİCİ: HATALI MAÇLARI VE MANUEL OYUNCU DEĞİŞİKLİKLERİNİ TABLOYA ZORLA İŞLEME (ULTRA SENKRONİZASYON) ---
// --- ORGANİZATÖR: HEM TABLOYU HEM OYUNCU PUANLARINI VE ROZETLERİ ONARAN SÜPER MOTOR ---
    window.syncTournamentMatches = async function(tourId) {
        if (!confirm("DİKKAT: Bu işlem tüm turnuva maçlarını tarayacak, puanları ÇİFTLER LİGİNE aktaracak, eksik istatistikleri ve ROZETLERİ tamamlayacaktır. Onaylıyor musunuz?")) return;
        try {
            const container = document.getElementById('tournament-detail-view');
            container.innerHTML = '<p style="text-align:center; margin-top:50px; font-weight:bold; color:#d35400;">Derin onarım başlatıldı... Lütfen sekmeyi kapatmayın ⏳</p>';

            const tourRef = db.collection('tournaments').doc(tourId);
            const tourSnap = await tourRef.get();
            const tourData = tourSnap.data();

            const matchSnap = await db.collection('matches')
                .where('tournamentId', '==', tourId)
                .where('durum', '==', 'Tamamlandı')
                .get();
                
            let repairCount = 0;
            const batch = db.batch();
            let uniqueUsersToBadge = new Set(); // Rozet onarımı için

            for (const doc of matchSnap.docs) {
                const m = doc.data();
                const wid = m.kayitliKazananID;
                
                // Oyuncuları rozet havuzuna ekle
                if(m.oyuncu1ID) uniqueUsersToBadge.add(m.oyuncu1ID);
                if(m.oyuncu2ID) uniqueUsersToBadge.add(m.oyuncu2ID);
                if(m.oyuncu1PartnerID) uniqueUsersToBadge.add(m.oyuncu1PartnerID);
                if(m.oyuncu2PartnerID) uniqueUsersToBadge.add(m.oyuncu2PartnerID);

                if ((m.macFormati || '').includes('Tekler') && (m.oyuncu1PartnerID || m.oyuncu2PartnerID)) { batch.update(doc.ref, { macFormati: 'Çiftler' }); }

                if (m.matchTag && wid) {
                    await window.advanceTournamentBracket(tourId, m.matchTag, wid);
                }
                repairCount++;
            }

            await batch.commit();
            
            // Geriye dönük eksik ROZETLERİ dağıt
            const badgeFunc = window.checkAndGrantBadges || checkAndGrantBadges;
            if (typeof badgeFunc === 'function') {
                for (let uid of uniqueUsersToBadge) {
                    await badgeFunc(uid);
                }
            }

            alert(`Onarım Tamamlandı! ${repairCount} maç tarandı, formatlar ve ROZETLER düzeltildi. ✅ \n\nNot: Değişiklikleri tam görmek için sayfayı yenileyin.`);
            openTournamentDetail(tourId, (await tourRef.get()).data());
        } catch (e) {
            console.error(e);
            alert("Onarım sırasında hata: " + e.message);
        }
    };
// --- 1. TURNUVA DETAY VE ORGANİZATÖR PANELİ (TEK VE TEMİZ VERSİYON) ---
    window.openTournamentDetail = function(tourId, tourData) {
        const container = document.getElementById('tournament-list-view');
        const detail = document.getElementById('tournament-detail-view');
        if(container) container.style.display = 'none';
        if(detail) detail.style.display = 'block';
        document.getElementById('detail-tour-name').textContent = tourData.name;

        const myUid = auth.currentUser.uid;
        // GÜVENLİK GÜNCELLEMESİ: Eski turnuvaları veya admini doğru tanıma
        const isAdmin = !tourData.creatorId || (tourData.creatorId === myUid);
        
        renderRegistrationArea(tourId, tourData, myUid);

        const adminArea = document.getElementById('tour-admin-manage-area');
        if (isAdmin) {
            adminArea.style.display = 'block';
            let actionButtonsHTML = '';

            let matchStarted = false;
            
            // Eleme Ağacı (Bracket) Maçları Başladı mı?
            if(tourData.bracket) {
                tourData.bracket.forEach(r => r.matches.forEach(m => { 
                    if(m.winner && m.score !== "Bay Geçti" && m.score !== "Oynamadan Geçti") {
                        matchStarted = true; 
                    }
                }));
            }
            
            // Grup Maçları Başladı mı Kontrolü
            if(tourData.groups) {
                tourData.groups.forEach(g => g.matches.forEach(m => {
                    if(m.winner) matchStarted = true;
                }));
            }

            // Duruma Göre Normal Butonları Ayarla
if (tourData.status === 'Kayıt') {
                actionButtonsHTML = `<button id="btn-close-registration" class="btn-main" style="background:#dc3545; font-size:0.8em; padding:8px; flex:1;">Kayıtları Kapat 🔒</button>`;
            } else if (tourData.status === 'Format_Secimi') {
  let generationButtons = '';
                const isChangingLeague = (tourData.systemType === 'league' && tourData.leagueTeamType === 'changing');

                // 1. ADIM: EĞER OTOMATİK SABİT TAKIMSA ÖNCE TAKIMLARI KUR BUTONU ÇIKAR
                if (!tourData.format.includes('Tekler') && tourData.regType === 'auto' && !tourData.teamsGenerated && !isChangingLeague) {
                     generationButtons = `<button onclick="window.generateAutoTeams('${tourId}')" class="btn-main" style="background:#17a2b8; padding:10px; width:100%;">🤖 Sistem Takımlarını Kur (${tourData.autoType === 'balanced' ? 'Denk' : 'Kura'})</button>`;
                } 
                // 2. ADIM: TAKIMLAR KURULDUYSA (VEYA MANUELSE / DEĞİŞEN LİG İSE) SİSTEMİ BAŞLAT BUTONLARI ÇIKAR
                else {
                     if (tourData.systemType === 'league') {
                         generationButtons = `<button onclick="window.generateLeagueFixture('${tourId}')" class="btn-main" style="background:#20c997; padding:10px; width:100%;">📅 Lig Fikstürünü Çıkar ve Başlat</button>`;
                     } else if (tourData.systemType === 'knockout') {
                         generationButtons = `<button onclick="generateKnockoutDraw('${tourId}', true)" class="btn-main" style="background:#6f42c1; padding:10px; width:100%;">🎾 Eleme Ağacını Kur ve Başlat</button>`;
                     } else {
                         generationButtons = `<button onclick="document.getElementById('group-settings-area').style.display='block'" class="btn-main" style="background:#007bff; padding:10px; width:100%;">👥 Grupları Kur ve Başlat</button>`;
                     }
                }
                
                actionButtonsHTML = `
                    <div style="display:flex; flex-direction:column; gap:10px; width:100%;">
                        ${generationButtons}
                        <button onclick="updateTournamentStatus('${tourId}', 'Kayıt')" class="btn-main" style="background:#ffc107; color:#333; padding:8px;">Kayıtları Tekrar Aç 🔓</button>
                    </div>`;
            } else {
                if(!matchStarted) actionButtonsHTML = `<button onclick="updateTournamentStatus('${tourId}', 'Kayıt')" class="btn-main" style="background:#ffc107; color:#333; padding:8px;">Kayıtları Aç 🔓</button>`;
                else actionButtonsHTML = `<p style="color:#d35400; font-size:0.8em; font-weight:bold; text-align:center;">Maçlar başladığı için kayıtlar kilitlendi.</p>`;
            }
// EKRANA ÇİZ (Gruplar Bitti Kutusu Tamamen Kaldırıldı)
            adminArea.innerHTML = `
                <h4 style="margin-top:0; color:#856404;">🛠️ Organizatör Paneli</h4>
                <div style="display:flex; gap:10px; margin-bottom:10px; flex-wrap:wrap;">
                    ${!matchStarted ? `<button id="btn-admin-add-player" class="btn-main" style="background:#28a745; font-size:0.8em; padding:8px; flex:1;">+ Oyuncu Ekle</button>` : ''}
                    ${actionButtonsHTML}
                </div>
                <div id="admin-manual-add-form" style="display:none; background:#fff; padding:10px; border-radius:8px; margin-bottom:10px; border:1px solid #ddd;">
                    <label class="input-label">Oyuncu 1</label>
                    <select id="admin-p1-select"></select>
                   ${!(tourData.format || '').includes('Tekler') && tourData.regType !== 'auto' ? `<label class="input-label">Oyuncu 2 (Partner)</label><select id="admin-p2-select"></select>` : ''}
                    <button id="btn-admin-save-reg" class="btn-save" style="margin-top:10px;">Kaydı Ekle ✅</button>
                </div>
                
                <div id="group-settings-area" style="display:none; background:#e3f2fd; padding:15px; border-radius:8px; margin-top:10px; border:1px solid #bbdefb;">
                    <label class="input-label" style="color:#0d47a1; font-weight:bold;">Grup Başına Ortalama Oyuncu (Örn: 4)</label>
                    <input type="number" id="group-size-input" value="4" min="2" style="padding:8px; margin-bottom:10px;">
                    <label class="input-label" style="color:#0d47a1; font-weight:bold;">Gruptan Kaç Kişi Üst Tura Çıkacak? (Örn: 2)</label>
                    <input type="number" id="advancing-count-input" value="2" min="1" style="padding:8px; margin-bottom:10px;">
                    <button onclick="generateGroupStageDraw('${tourId}')" class="btn-save" style="margin-top:5px; background:#007bff;">Grupları Oluştur ve Başlat 🚀</button>
                </div>

                <button onclick="syncTournamentMatches('${tourId}')" style="background:none; border:none; color:#17a2b8; text-decoration:underline; width:100%; margin-top:15px; font-weight:bold; box-shadow:none;">🔄 Hatalı Onaylanan Maçları Senkronize Et</button>
                <button onclick="window.recalculateAllPoints()" style="background:none; border:none; color:#28a745; text-decoration:underline; width:100%; margin-top:10px; font-weight:bold; box-shadow:none;">🛠️ Tüm Ligin Puanlarını Sıfırdan Onar</button>
                <button onclick="deleteTournament('${tourId}')" style="background:none; border:none; color:#dc3545; text-decoration:underline; width:100%; margin-top:10px; font-weight:bold; box-shadow:none;">🗑️ Bu Turnuvayı İptal Et ve Tamamen Sil</button>
            `;
            
            const btnAdd = document.getElementById('btn-admin-add-player');
            if(btnAdd) btnAdd.onclick = () => {
                const f = document.getElementById('admin-manual-add-form');
                f.style.display = f.style.display === 'none' ? 'block' : 'none';
                populateAdminPlayerSelects(tourData);
            };

            const btnSaveManual = document.getElementById('btn-admin-save-reg');
            if(btnSaveManual) btnSaveManual.onclick = () => adminAddParticipant(tourId);

            const btnCloseReg = document.getElementById('btn-close-registration');
            if (btnCloseReg) btnCloseReg.onclick = () => closeRegistration(tourId, tourData);
        } else {
            adminArea.style.display = 'none';
        }

        if (tourData.bracket || tourData.groups) {
            renderTournamentBracket(tourId, tourData, myUid); 
        } else {
            document.getElementById('tour-bracket-container').innerHTML = '<p style="text-align:center; color:#777; width: 100%; margin-top:20px;">Fikstür henüz oluşturulmadı.</p>';
        }
    };


    window.deleteTournament = async function(tourId) {
        if(!confirm("⚠️ DİKKAT: Bu turnuvayı silmek istediğinize emin misiniz?\n\nBu işlem oyuncuların bu turnuvadan kazandığı PUANLARI da geri alacaktır!")) return;
        
        const verification = prompt("Silme işlemini onaylamak için 'İPTAL' yazın:"); 
        if (verification !== 'İPTAL') return alert("İşlem iptal edildi.");

        try {
            document.getElementById('tournament-detail-view').innerHTML = '<p style="text-align:center; margin-top:50px;">Puanlar geri alınıyor ve turnuva siliniyor... ⏳</p>';

            const batch = db.batch();
            
            // 1. Turnuvaya ait TÜM maçları getir
            const matchSnap = await db.collection('matches').where('tournamentId', '==', tourId).get();
            
            for (const doc of matchSnap.docs) {
                const m = doc.data();
                
                // Eğer maç tamamlanmışsa puanları geri hesapla
                if (m.durum === 'Tamamlandı' && m.kayitliKazananID) {
                    const wid = m.kayitliKazananID;
                    const lid = (m.oyuncu1ID === wid) ? m.oyuncu2ID : m.oyuncu1ID;
                    
                    // Çiftler partnerlerini bul
                    let wPartnerId = (m.oyuncu1ID === wid) ? m.oyuncu1PartnerID : m.oyuncu2PartnerID;
                    let lPartnerId = (m.oyuncu1ID === wid) ? m.oyuncu2PartnerID : m.oyuncu1PartnerID;

                    // Kazanılan puanı hesapla (finalizeMatch'in tersi)
                    let wg = 0, lg = 0;
                    if (m.skor) {
                        const s = m.skor;
                        const isEntryByWinner = m.sonucuGirenID === wid;
                        const s1w = isEntryByWinner ? parseInt(s.s1_me||0) : parseInt(s.s1_opp||0);
                        const s1l = isEntryByWinner ? parseInt(s.s1_opp||0) : parseInt(s.s1_me||0);
                        const s2w = isEntryByWinner ? parseInt(s.s2_me||0) : parseInt(s.s2_opp||0);
                        const s2l = isEntryByWinner ? parseInt(s.s2_opp||0) : parseInt(s.s2_me||0);
                        wg = s1w + s2w; lg = s1l + s2l;
                    }
                    
                    const pointsToSubtractW = -(50 + (wg * 5)); // Galibin puanını eksi olarak hazırla
                    const pointsToSubtractL = -(50 + (lg * 5)); // Mağlubun puanını eksi olarak hazırla

                    // Puanları geri çekme fonksiyonu
                    const reverseStats = (uid, pts, isWin) => {
                        if (!uid) return;
                        const userRef = db.collection('users').doc(uid);
                        if (!(m.macFormati || '').includes('Tekler')) {
                            batch.update(userRef, { ciftlerPuani: firebase.firestore.FieldValue.increment(pts) });
                        } else {
                            batch.update(userRef, { 
                                toplamPuan: firebase.firestore.FieldValue.increment(pts),
                                galibiyetSayisi: firebase.firestore.FieldValue.increment(isWin ? -1 : 0),
                                macSayisi: firebase.firestore.FieldValue.increment(-1)
                            });
                        }
                    };

                    reverseStats(wid, pointsToSubtractW, true);
                    reverseStats(lid, pointsToSubtractL, false);
                    if (!(m.macFormati || '').includes('Tekler')) {
                        reverseStats(wPartnerId, pointsToSubtractW, true);
                        reverseStats(lPartnerId, pointsToSubtractL, false);
                    }
                }
                
                // Maç dökümanını sil
                batch.delete(doc.ref);
            }

            // 2. Turnuva dökümanını sil
            const tourRef = db.collection('tournaments').doc(tourId);
            batch.delete(tourRef);

            await batch.commit();

            alert("Turnuva silindi ve tüm puanlar başarıyla geri alındı! 🗑️");
            document.getElementById('tournament-detail-view').style.display = 'none';
            document.getElementById('tournament-list-view').style.display = 'block';
            loadTournaments();
            
        } catch(e) {
            alert("Hata: " + e.message);
            console.error(e);
        }
    };

// --- 2. KATILIMCI LİSTESİ VE KAYIT ALANI ---
    function renderRegistrationArea(tourId, tourData, myUid) {
        const regArea = document.getElementById('tour-registration-area');
        if (!regArea) return;

        const participants = tourData.participants || [];
        const isAdmin = (tourData.creatorId === myUid);
        
        // YENİ: Sistem tarafından takım kurulup kurulmadığını kontrol et
        const isAutoTeams = tourData.regType === 'auto' && tourData.teamsGenerated;
        
        let html = `
            <div style="text-align:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                <p style="margin:5px 0;"><strong>Format:</strong> ${tourData.format} | <strong>Ücret:</strong> ${tourData.fee} Puan</p>
            </div>
            <h4 style="margin-top:0; border:none; font-size:1.1em; color:#0d47a1;">
                ${isAutoTeams ? '🤝 Sistem Tarafından Kurulan Takımlar' : '👥 Katılımcı Listesi'} (${participants.length})
            </h4>
        `;

        if (participants.length === 0) {
            html += `<p style="text-align:center; color:#999; font-size:0.9em; padding:10px;">Henüz kayıtlı oyuncu yok.</p>`;
        } else {
            html += `<div class="tour-participants-list" style="margin-bottom:20px; max-height:350px; overflow-y:auto; padding-right:5px;">`;
            
            participants.forEach((p, index) => {
                const u1 = userMap[p.p1];
                const u2 = p.p2 ? userMap[p.p2] : null;
                const p1Name = u1?.isim || 'Bilinmeyen';
                const p2Name = u2 ? u2.isim : '';
                
                let displayHTML = '';
                
                // TAKIMLAR KURULDUYSA ÖZEL GÖRÜNÜM
// TAKIMLAR KURULDUYSA ÖZEL GÖRÜNÜM
                if (isAutoTeams) {
                    const teamMetric = p.points !== undefined ? `%${p.points} Güç` : 'Belirsiz';
                    displayHTML = `
                        <div style="flex:1;">
                            <div style="font-size:0.95em; font-weight:700; color:#333; margin-bottom:3px;">Takım ${index + 1}</div>
                            <div style="font-size:0.85em; color:#555;">🎾 ${p1Name}</div>
                            <div style="font-size:0.85em; color:#555;">🎾 ${p2Name}</div>
                        </div>
                        <div style="text-align:right;">
                            <span style="background:#e3f2fd; color:#0d47a1; padding:4px 8px; border-radius:12px; font-size:0.8em; font-weight:bold;">${teamMetric}</span>
                        </div>
                    `;
                } 
                // NORMAL/BİREYSEL KAYIT GÖRÜNÜMÜ

                else {
                    const displayName = p.p2 ? `${p1Name} & ${p2Name}` : p1Name;
                    
                    const getWinRate = (u) => { if(!u || !u.macSayisi) return 0; return Math.round((u.galibiyetSayisi / u.macSayisi) * 100); };
                    const r1 = getWinRate(u1);
                    
                    let rateText = "";
                    if (p.p2) {
                        const r2 = getWinRate(u2);
                        rateText = `%${Math.round((r1 + r2) / 2)} Ort.`;
                    } else {
                        rateText = `%${r1} Kazanma`;
                    }

                    displayHTML = `
                        <div style="flex:1; font-size:0.9em; font-weight:600; color:#444;">${index + 1}. ${displayName}</div>
                        <div style="font-size:0.85em; font-weight:bold; color:#0d47a1; background:#e3f2fd; padding:3px 8px; border-radius:10px;">${rateText}</div>
                    `;
                }

                html += `
                    <div class="modern-list-item" style="padding:12px; margin-bottom:8px; border-left:4px solid ${isAutoTeams ? '#28a745' : '#c06035'}; display:flex; justify-content:space-between; align-items:center; background:#f8f9fa;">
                        ${displayHTML}
                        ${isAdmin && !isAutoTeams ? `<button onclick="adminDeleteParticipant('${tourId}', ${index})" style="width:auto; background:none; color:#dc3545; margin:0 0 0 10px; padding:5px; box-shadow:none; font-size:1.2em;">🗑️</button>` : ''}
                    </div>`;
            });
            html += `</div>`;
        }

        const myRegistration = participants.find(p => p.p1 === myUid || p.p2 === myUid);

        // --- HATA BURADAYDI: HTML'i biriktirip EN SONDA Ekrana basacağız ---
        if (tourData.status !== 'Kayıt') {
            html += `<div style="background:#fff3cd; padding:10px; border-radius:8px; text-align:center; color:#856404; font-weight:bold;">🔒 Kayıtlar Kapandı</div>`;
        } else if (myRegistration) {
            html += `
                <div style="background:#e8f5e9; padding:15px; border-radius:12px; text-align:center; border:1px solid #c3e6cb;">
                    <p style="color:#28a745; font-weight:bold; margin-bottom:10px;">✅ Turnuvaya Kayıtlısınız</p>
                    <button onclick="cancelTournamentRegistration('${tourId}', '${myRegistration.p1}', '${myRegistration.p2}')" class="btn-main" style="background:#dc3545; width:auto; padding:8px 20px;">Kaydı İptal Et ❌</button>
                </div>`;
        } else {
            let partnerSelectHTML = '';
            if (!(tourData.format || '').includes('Tekler') && tourData.regType !== 'auto') {
                partnerSelectHTML = `<label class="input-label" style="color:#c06035; font-weight:bold;">Takım Arkadaşını Seç (Partner)</label><select id="tour-partner-select" style="margin-bottom:15px;"><option value="">Lütfen Bir Partner Seçin</option></select>`;
            }
            html += `<div style="background:#f8f9fa; padding:15px; border-radius:12px; border:1px solid #eee;">${partnerSelectHTML}<button id="btn-join-tour" class="btn-save" style="background:#28a745; margin-top:5px;">Turnuvaya Katıl 🎾</button></div>`;
        }

        // UNUTULAN KOMUT: Hazırlanan HTML'i ekrana çiz!
        regArea.innerHTML = html;

        // Ekrana çizildikten sonra olayları (tıklamaları vb) bağla
        if (tourData.status === 'Kayıt' && !myRegistration) {
            if (!(tourData.format || '').includes('Tekler') && tourData.regType !== 'auto') {
                const selectEl = document.getElementById('tour-partner-select');
                if (selectEl) {
                    Object.values(userMap).forEach(player => {
                        const isOtherRegistered = participants.some(p => p.p1 === player.uid || p.p2 === player.uid);
                        if (player.uid !== myUid && !isOtherRegistered) {
                            const opt = document.createElement('option'); opt.value = player.uid; opt.textContent = player.isim || player.email; selectEl.appendChild(opt);
                        }
                    });
                }
            }
            const joinBtn = document.getElementById('btn-join-tour');
            if (joinBtn) joinBtn.onclick = () => joinTournament(tourId, tourData, myUid);
        }
    }

async function joinTournament(tourId, tourData, myUid) {
        const me = userMap[myUid];
        if (me.toplamPuan < tourData.fee) return alert(`Bu turnuvaya katılmak için en az ${tourData.fee} puana ihtiyacın var.`);
        
        let newRegistration = { p1: myUid, p2: null };
        const format = tourData.format;
        const myGender = me.cinsiyet;

        if (!myGender) return alert("Cinsiyet bilginiz eksik. Lütfen profilinizden güncelleyin.");

const regType = tourData.regType || 'manual';

        // --- TEKLER İÇİN CİNSİYET KONTROLLERİ ---
        if (format === 'Tekler Erkek' && myGender !== 'Erkek') return alert("Hata: Sadece Erkek oyuncular katılabilir.");
        if (format === 'Tekler Kadın' && myGender !== 'Kadın') return alert("Hata: Sadece Kadın oyuncular katılabilir.");

        // --- ÇİFTLER: OTOMATİK EŞLEŞME (SİSTEM KURACAK) ---
        if (!format.includes('Tekler') && regType === 'auto') {
            if (format === 'Double Erkek' && myGender !== 'Erkek') return alert("Hata: Sadece erkekler.");
            if (format === 'Double Kadın' && myGender !== 'Kadın') return alert("Hata: Sadece kadınlar.");
            // Mix formatında herkes bireysel kaydolur, sistem eşleştirecek
            newRegistration.p2 = null; 
        }
        // --- ÇİFTLER: MANUEL TAKIM KAYDI ---
        else if (!format.includes('Tekler') && regType === 'manual') {
            const partnerId = document.getElementById('tour-partner-select').value;
            if (!partnerId) return alert("Lütfen partner seçin!");
            const p2Gender = userMap[partnerId]?.cinsiyet;
            if (!p2Gender) return alert("Partnerinizin cinsiyet bilgisi eksik.");

            if (format === 'Double Erkek' && (myGender !== 'Erkek' || p2Gender !== 'Erkek')) return alert("Hata: Sadece Erkek-Erkek.");
            if (format === 'Double Kadın' && (myGender !== 'Kadın' || p2Gender !== 'Kadın')) return alert("Hata: Sadece Kadın-Kadın.");
            if (format === 'Mix' && (myGender === p2Gender)) return alert("Hata: Mix turnuvasına bir Kadın ve bir Erkek katılmalıdır.");
            newRegistration.p2 = partnerId;
        }

        try {
            document.getElementById('btn-join-tour').disabled = true;
            document.getElementById('btn-join-tour').textContent = 'Kayıt Yapılıyor...';
            await db.collection('tournaments').doc(tourId).update({ participants: firebase.firestore.FieldValue.arrayUnion(newRegistration) });
            alert("Kayıt başarılı! 🏆");
            const updatedDoc = await db.collection('tournaments').doc(tourId).get();
            openTournamentDetail(tourId, updatedDoc.data());
        } catch(e) { alert("Hata: " + e.message); }
    }

    window.cancelTournamentRegistration = async function(tourId, p1, p2) {
        if (!confirm("Turnuva kaydını iptal etmek istediğine emin misin?")) return;
        try {
            const docRef = db.collection('tournaments').doc(tourId); const doc = await docRef.get();
            let parts = doc.data().participants || [];
            parts = parts.filter(p => !(p.p1 === p1 && p.p2 === (p2 !== 'null' ? p2 : null)));
            await docRef.update({ participants: parts });
            alert("Kaydın başarıyla iptal edildi.");
            openTournamentDetail(tourId, (await docRef.get()).data());
        } catch(e) { alert("İptal sırasında hata oluştu: " + e.message); }
    };

    window.adminDeleteParticipant = async function(tourId, index) {
        if (!confirm("Bu kaydı turnuvadan çıkarmak istediğinize emin misiniz?")) return;
        try {
            const docRef = db.collection('tournaments').doc(tourId); const doc = await docRef.get();
            let parts = doc.data().participants || []; parts.splice(index, 1);
            await docRef.update({ participants: parts }); alert("Kayıt silindi. 🗑️");
            openTournamentDetail(tourId, (await docRef.get()).data());
        } catch (e) { alert("Silme hatası: " + e.message); }
    };

    function populateAdminPlayerSelects(tourData) {
        const p1Select = document.getElementById('admin-p1-select'); const p2Select = document.getElementById('admin-p2-select');
        const participants = tourData.participants || [];
        let optionsHTML = '<option value="">Lütfen Oyuncu Seçin</option>';
        Object.values(userMap).forEach(p => {
            const isRegistered = participants.some(pt => pt.p1 === p.uid || pt.p2 === p.uid);
            if (!isRegistered) optionsHTML += `<option value="${p.uid}">${p.isim || p.email}</option>`;
        });
        if (p1Select) p1Select.innerHTML = optionsHTML; if (p2Select) p2Select.innerHTML = optionsHTML;
    }

window.adminAddParticipant = async function(tourId) {
        const p1 = document.getElementById('admin-p1-select').value;
        const p2 = document.getElementById('admin-p2-select')?.value || null;
        if(!p1) return alert("En az bir oyuncu seçmelisiniz.");

        try {
            const docRef = db.collection('tournaments').doc(tourId);
            const tourSnap = await docRef.get();
            const tourData = tourSnap.data();
            const format = tourData.format;
            const regType = tourData.regType || 'manual';

            const p1Gender = userMap[p1]?.cinsiyet;
            if (!p1Gender) return alert("Seçilen oyuncunun cinsiyet bilgisi eksik.");

            // TEKLER KONTROLÜ
            if (format === 'Tekler Erkek' && p1Gender !== 'Erkek') return alert("Hata: Bu oyuncu Erkek değil.");
            if (format === 'Tekler Kadın' && p1Gender !== 'Kadın') return alert("Hata: Bu oyuncu Kadın değil.");

            // ÇİFTLER: OTOMATİK EŞLEŞME (SİSTEM KURACAK) - BİREYSEL KAYIT
            if (!format.includes('Tekler') && regType === 'auto') {
                if (format === 'Double Erkek' && p1Gender !== 'Erkek') return alert("Hata: Sadece erkek oyuncu seçebilirsiniz.");
                if (format === 'Double Kadın' && p1Gender !== 'Kadın') return alert("Hata: Sadece kadın oyuncu seçebilirsiniz.");
                // Mix için cinsiyet fark etmez, herkes bireysel girer
            } 
            // ÇİFTLER: MANUEL TAKIM KAYDI
            else if (!format.includes('Tekler') && regType === 'manual') {
                if (!p2) return alert("Bu formatta partner seçmek zorunludur.");
                const p2Gender = userMap[p2]?.cinsiyet;
                if (!p2Gender) return alert("Partnerin cinsiyet bilgisi eksik.");

                if (format === 'Double Erkek' && (p1Gender !== 'Erkek' || p2Gender !== 'Erkek')) return alert("Hata: Sadece Erkek-Erkek.");
                if (format === 'Double Kadın' && (p1Gender !== 'Kadın' || p2Gender !== 'Kadın')) return alert("Hata: Sadece Kadın-Kadın.");
                if (format === 'Mix' && (p1Gender === p2Gender)) return alert("Hata: Mix için 1 Kadın 1 Erkek gerekli.");
            }

            const newPlayerObj = { p1, p2: (regType === 'auto' ? null : p2), points: 0 }; 
            await docRef.update({ participants: firebase.firestore.FieldValue.arrayUnion(newPlayerObj) });
            alert("Oyuncu başarıyla eklendi. ✅");
            openTournamentDetail(tourId, (await docRef.get()).data());
        } catch(e) { alert("Hata: " + e.message); }
    };

    window.updateTournamentStatus = async function(tourId, newStatus) {
        if(!confirm(`Turnuva durumunu '${newStatus}' olarak değiştirmek istiyor musunuz?`)) return;
        try { await db.collection('tournaments').doc(tourId).update({ status: newStatus }); alert("Durum güncellendi!"); openTournamentDetail(tourId, { ...(await db.collection('tournaments').doc(tourId).get()).data(), id: tourId }); } 
        catch(e) { alert("Hata: " + e.message); }
    };

 async function closeRegistration(tourId, tourData) {
        if (!tourData.participants || tourData.participants.length < 2) return alert("En az 2 kayıt gerekli!");
        if (!confirm("Kayıtları kapatıp eşleşme ve kura aşamasına geçmek istediğinize emin misiniz?")) return;
        try { await db.collection('tournaments').doc(tourId).update({ status: 'Format_Secimi' }); alert("Kayıtlar kapandı!"); openTournamentDetail(tourId, { ...(await db.collection('tournaments').doc(tourId).get()).data(), id: tourId }); } 
        catch(e) { alert("Hata: " + e.message); }
    }
// ============================================================================
    // ================== MAÇ ONAY VE TURNUVA AĞACI MOTORLARI =====================
    // ============================================================================

    // --- 1. MAÇ DÖKÜMANI OLUŞTURUCU ---
    window.createTournamentMatchDoc = async function(tourId, p1, p2, roundName, matchTag) {
        if(!p1 || !p2 || p1.isBye || p2.isBye) return null;
        const tourSnap = await db.collection('tournaments').doc(tourId).get();
        const format = tourSnap.exists ? tourSnap.data().format : 'Tekler';

        const matchRef = await db.collection('matches').add({
            tournamentId: tourId, 
            roundName: roundName, 
            matchTag: matchTag,
            oyuncu1ID: p1.p1, 
            oyuncu1PartnerID: p1.p2, 
            oyuncu2ID: p2.p1, 
            oyuncu2PartnerID: p2.p2,
            macFormati: format, 
            macTipi: 'Turnuva', 
            bahisPuani: 0, 
            durum: 'Hazır', 
            tarih: firebase.firestore.FieldValue.serverTimestamp()
        });
        return matchRef.id;
    };

// --- 2. TUR ATLATMA VE GRUP HESAPLAMA MOTORU ---
    window.advanceTournamentBracket = async function(tourId, matchTag, winnerUid) {
        const tourRef = db.collection('tournaments').doc(tourId);
        const tourSnap = await tourRef.get();
        const data = tourSnap.data();

        const matchQuery = await db.collection('matches').where('tournamentId', '==', tourId).where('matchTag', '==', matchTag).get();
        let mData = null;
        if (!matchQuery.empty) mData = matchQuery.docs[0].data();

        // A. GRUP MAÇI (Sıralama ve Ağacı Canlı Güncelle)
        if (matchTag.startsWith('G')) {
            let groups = data.groups;
            let bracket = data.bracket || [];
            const parts = matchTag.split('_');
            const gIdx = parseInt(parts[0].replace('G',''));
            const group = groups[gIdx];
            
            const matchIndexInArray = group.matches.findIndex(m => m.matchId === matchTag);
            if(matchIndexInArray === -1) return;
            const mObj = group.matches[matchIndexInArray];
            
            const winnerObj = (mObj.p1.p1 === winnerUid) ? mObj.p1 : mObj.p2;
            mObj.winner = winnerObj;
            mObj.score = "Tamamlandı"; 
            if (mData && mData.skor) {
                mObj.rawScore = mData.skor;
                mObj.reporterId = mData.sonucuGirenID;
            }
            
            group.players.forEach(p => { p.played = 0; p.won = 0; p.lost = 0; p.gamesWon = 0; p.gamesLost = 0; p.winRate = 0; p.groupPoints = 0; });
            
            group.matches.forEach(m => {
                if (m.winner && m.rawScore) {
                    const s = m.rawScore;
                    const s1m = parseInt(s.s1_me||0); const s1o = parseInt(s.s1_opp||0);
                    const s2m = parseInt(s.s2_me||0); const s2o = parseInt(s.s2_opp||0);
                    
                    const p1G = s1m + s2m; 
                    const p2G = s1o + s2o;
                    
                    const p1Id = m.p1.p1; const p2Id = m.p2.p1;
                    const p1Player = group.players.find(p => p.p1 === p1Id);
                    const p2Player = group.players.find(p => p.p1 === p2Id);
                    
                    if (p1Player && p2Player) {
                        p1Player.played++; p2Player.played++;
                        p1Player.gamesWon += p1G; p1Player.gamesLost += p2G;
                        p2Player.gamesWon += p2G; p2Player.gamesLost += p1G;
                        
                        if (m.winner.p1 === p1Id) { 
                            p1Player.won++; p2Player.lost++; 
                            p1Player.groupPoints += 3; p2Player.groupPoints += 1;
                        }
                        else { 
                            p2Player.won++; p1Player.lost++; 
                            p2Player.groupPoints += 3; p1Player.groupPoints += 1;
                        }
                    }
                }
            });

            group.players.forEach(p => {
                const totalGames = p.gamesWon + p.gamesLost;
                p.winRate = totalGames > 0 ? (p.gamesWon / totalGames) * 100 : 0;
            });
            
            group.players.sort((a, b) => {
                if (data.pointsSystem === 'threePoint') return (b.groupPoints || 0) - (a.groupPoints || 0) || b.winRate - a.winRate || b.gamesWon - a.gamesWon;
                return b.winRate - a.winRate || b.gamesWon - a.gamesWon || b.won - a.won;
            });

            // --- YENİ: ELEME AĞACINDAKİ YER TUTUCULARI (Sırayla ve Garantili) GÜNCELLE ---
            // --- YENİ: ELEME AĞACINDAKİ YER TUTUCULARI VE EN İYİ 3.LERİ CANLI GÜNCELLE ---
    // --- YENİ: ELEME AĞACINDAKİ YER TUTUCULARI VE EN İYİ 3.LERİ CANLI GÜNCELLE ---
            if (bracket.length > 0) {
                const advCount = data.advancingCount || 2;
                const topPlayers = group.players.slice(0, advCount);
                
                // Grupların tamamen bitip bitmediğini kontrol et
                let allGroupsFinished = true;
                data.groups.forEach(gr => gr.matches.forEach(mx => { if (!mx.winner && mx.score !== "Oynamadan Geçti" && mx.score !== "Bay Geçti") allGroupsFinished = false; }));

                // 1. O AN BİTEN GRUBUN DİREKT ÇIKANLARINI AĞACA YERLEŞTİR
                for (let mIdx = 0; mIdx < bracket[0].matches.length; mIdx++) {
                    let m = bracket[0].matches[mIdx];
                    for (let slotKey of ['p1', 'p2']) {
                        let slot = m[slotKey];
                        if (slot && slot.isPlaceholder && !slot.isBestExtra && slot.groupIdx === gIdx) {
                            const currentPlayer = topPlayers[slot.rank - 1];
                            if (currentPlayer && currentPlayer.played > 0) {
                                m[slotKey] = { ...slot, ...currentPlayer, isLiveCandidate: !allGroupsFinished }; 
                            }
                        }
                    }
                }

                // 2. EN İYİ 3.LERİ (EKSTRALARI) HESAPLA VE AĞACA YERLEŞTİR
                let extraPool = [];
                data.groups.forEach(gr => {
                    for(let i = advCount; i < gr.players.length; i++) { 
                        if (gr.players[i].played > 0) extraPool.push(gr.players[i]); 
                    }
                });
                
                extraPool.sort((a, b) => {
                    if (data.pointsSystem === 'threePoint') return (b.groupPoints || 0) - (a.groupPoints || 0) || b.winRate - a.winRate || b.gamesWon - a.gamesWon;
                    return b.winRate - a.winRate || b.gamesWon - a.gamesWon || b.won - a.won;
                });

                for (let mIdx = 0; mIdx < bracket[0].matches.length; mIdx++) {
                    let m = bracket[0].matches[mIdx];
                    for (let slotKey of ['p1', 'p2']) {
                        let slot = m[slotKey];
                        if (slot && slot.isPlaceholder && slot.isBestExtra) {
                            const bestExtraPlayer = extraPool[slot.extraRank - 1]; 
                            if (bestExtraPlayer) {
                                m[slotKey] = { ...slot, ...bestExtraPlayer, isLiveCandidate: !allGroupsFinished };
                            }
                        }
                    }
                }

                // 3. EĞER TÜM GRUPLAR BİTTİYSE, MAÇLARI RESMİLEŞTİR VE "(Aday)" ROZETİNİ KALDIR
                if (allGroupsFinished) {
                    for (let mIdx = 0; mIdx < bracket[0].matches.length; mIdx++) {
                        let m = bracket[0].matches[mIdx];
                        
                        // Aday rozetlerini temizle
                        if (m.p1 && m.p1.isLiveCandidate !== undefined) m.p1.isLiveCandidate = false;
                        if (m.p2 && m.p2.isLiveCandidate !== undefined) m.p2.isLiveCandidate = false;

                        // Her iki taraf da belliyse ve maç henüz oluşturulmadıysa oluştur
                        if (m.p1 && m.p1.p1 && m.p2 && m.p2.p1 && !m.p1.isBye && !m.p2.isBye) {
                            if (!m.firestoreMatchId) {
                                m.firestoreMatchId = await window.createTournamentMatchDoc(tourId, m.p1, m.p2, bracket[0].roundName, `R0_M${mIdx}`, data.format);
                            } else {
                                await db.collection('matches').doc(m.firestoreMatchId).update({ oyuncu1ID: m.p1.p1, oyuncu1PartnerID: m.p1.p2 || null, oyuncu2ID: m.p2.p1, oyuncu2PartnerID: m.p2.p2 || null });
                            }
                        }
                    }
                }
            }

            await tourRef.update({ groups: groups, bracket: bracket });

            const subject = "📊 Grubunda Yeni Maç Sonucu!";
            const body = `<p><strong>${data.name}</strong> turnuvasında, bulunduğun <strong>${group.groupName}</strong> grubunda yeni bir maç sonuçlandı.</p><p>Puan durumu güncellendi. Sıralamanı kontrol etmek için uygulamaya gir!</p>`;
            group.players.forEach(p => {
                if (p.p1 !== mObj.p1.p1 && p.p1 !== mObj.p2.p1) {
                    if (p.p1 && typeof sendNotificationEmail === 'function') sendNotificationEmail(p.p1, subject, body);
                    if (p.p2 && typeof sendNotificationEmail === 'function') sendNotificationEmail(p.p2, subject, body);
                }
            });
            return; 
        }
        // LİG MAÇI İŞLEYİCİSİ
        if (matchTag && matchTag.startsWith('L')) {
            let bracket = data.bracket || [];
            const parts = matchTag.split('_');
            const rIdx = parseInt(parts[0].replace('L',''));
            const mIdx = parseInt(parts[1].replace('M',''));
            if (bracket.length === 0 || !bracket[rIdx] || !bracket[rIdx].matches[mIdx]) return; 

            const mObj = bracket[rIdx].matches[mIdx];
            mObj.winner = (mObj.p1.p1 === winnerUid) ? mObj.p1 : mObj.p2;
            mObj.score = "Tamamlandı";
            if (mData && mData.skor) mObj.rawScore = mData.skor;

            await tourRef.update({ bracket: bracket });
            
            const subject = "📊 Ligde Yeni Maç Sonucu!";
            const body = `<p><strong>${data.name}</strong> liginde yeni bir maç sonuçlandı.</p><p>Güncel puan durumunu incelemek için uygulamaya göz at!</p>`;
            data.participants.forEach(p => {
                if (p.p1 && typeof sendNotificationEmail === 'function') sendNotificationEmail(p.p1, subject, body);
                if (p.p2 && typeof sendNotificationEmail === 'function') sendNotificationEmail(p.p2, subject, body);
            });
            return;
        }

        // B. ELEME MAÇI (Fikstür Atlatma ve Bildirimler)
        if (matchTag.startsWith('R')) {
            let bracket = data.bracket;
            const parts = matchTag.split('_');
            const rIdx = parseInt(parts[0].replace('R',''));
            const mIdx = parseInt(parts[1].replace('M',''));

            const winnerObj = bracket[rIdx].matches[mIdx].p1.p1 === winnerUid ? bracket[rIdx].matches[mIdx].p1 : bracket[rIdx].matches[mIdx].p2;
            
            bracket[rIdx].matches[mIdx].winner = winnerObj;
            bracket[rIdx].matches[mIdx].score = "Tamamlandı";

            const nextR = rIdx + 1;
            if (nextR < bracket.length) {
                const nextM = Math.floor(mIdx / 2);
                if (mIdx % 2 === 0) bracket[nextR].matches[nextM].p1 = winnerObj;
                else bracket[nextR].matches[nextM].p2 = winnerObj;

                const mObj = bracket[nextR].matches[nextM];
                if (mObj.p1 && mObj.p2 && !mObj.firestoreMatchId) {
                    const newId = await window.createTournamentMatchDoc(tourId, mObj.p1, mObj.p2, bracket[nextR].roundName, `R${nextR}_M${nextM}`);
                    bracket[nextR].matches[nextM].firestoreMatchId = newId;
                }
            } else {
                data.status = 'Bitti'; 
            }
            await tourRef.update({ bracket: bracket, status: data.status });

            const currentRoundMatches = bracket[rIdx].matches;
            const isRoundFinished = currentRoundMatches.every(m => m.winner || m.score === "Bay Geçti" || m.score === "Oynamadan Geçti");

            if (isRoundFinished) {
                const roundName = bracket[rIdx].roundName;
                const isFinal = (rIdx === bracket.length - 1);

                if (isFinal) {
                    let champName = userMap[winnerObj.p1]?.isim || 'Bir takım';
                    if (winnerObj.p2 && userMap[winnerObj.p2]) champName += ` & ${userMap[winnerObj.p2].isim}`;

                    const subject = `👑 Şampiyon Belli Oldu: ${champName}!`;
                    const body = `<p><strong>${data.name}</strong> turnuvası sona erdi!</p><p>Büyük finali kazanarak şampiyon olan <strong>${champName}</strong> takımını/oyuncusunu tebrik ederiz. 🏆</p><p>Turnuva sonucunu incelemek için uygulamaya göz atın.</p>`;
                    
                    data.participants.forEach(p => {
                        if (p.p1 && typeof sendNotificationEmail === 'function') sendNotificationEmail(p.p1, subject, body);
                        if (p.p2 && typeof sendNotificationEmail === 'function') sendNotificationEmail(p.p2, subject, body);
                    });
                } else {
                    const nextRoundName = bracket[nextR].roundName;
                    const subject = `🎾 ${roundName} Tamamlandı!`;
                    const body = `<p><strong>${data.name}</strong> turnuvasında <strong>${roundName}</strong> maçlarının tümü tamamlandı ve ${nextRoundName} eşleşmeleri belli oldu!</p><p>Güncel fikstürü görmek için uygulamayı ziyaret edin.</p>`;
                    
                    data.participants.forEach(p => {
                        if (p.p1 && typeof sendNotificationEmail === 'function') sendNotificationEmail(p.p1, subject, body);
                        if (p.p2 && typeof sendNotificationEmail === 'function') sendNotificationEmail(p.p2, subject, body);
                    });
                }
            }
        }
    };

    // --- 3. MAÇ ONAYLAMA VE PUAN DAĞITIM MOTORU ---
// --- 3. MAÇ ONAYLAMA VE PUAN DAĞITIM MOTORU ---
    window.finalizeMatch = async function(id, m) {
        const batch = db.batch(); 
        const wid = m.adayKazananID; 
        const lid = (m.oyuncu1ID === wid) ? m.oyuncu2ID : m.oyuncu1ID;

        let wPartnerId = null; let lPartnerId = null;
        if (!(m.macFormati || '').includes('Tekler')) {
            wPartnerId = (m.oyuncu1ID === wid) ? m.oyuncu1PartnerID : m.oyuncu2PartnerID;
            lPartnerId = (m.oyuncu1ID === wid) ? m.oyuncu2PartnerID : m.oyuncu1PartnerID;
        }

        let wg = 0, lg = 0;
        if(m.skor) {
            const s = m.skor; 
            if (m.macTipi === 'Turnuva') {
                const p1G = parseInt(s.s1_me||0) + parseInt(s.s2_me||0);
                const p2G = parseInt(s.s1_opp||0) + parseInt(s.s2_opp||0);
                if (m.oyuncu1ID === wid) { wg = p1G; lg = p2G; } else { wg = p2G; lg = p1G; }
            } else {
                const isEntryByWinner = m.sonucuGirenID === wid;
                const s1w = isEntryByWinner ? parseInt(s.s1_me||0) : parseInt(s.s1_opp||0); 
                const s1l = isEntryByWinner ? parseInt(s.s1_opp||0) : parseInt(s.s1_me||0); 
                const s2w = isEntryByWinner ? parseInt(s.s2_me||0) : parseInt(s.s2_opp||0); 
                const s2l = isEntryByWinner ? parseInt(s.s2_opp||0) : parseInt(s.s2_me||0);
                wg = s1w + s2w; lg = s1l + s2l;
            }
        }
        const bonusW = wg * 5; const bonusL = lg * 5;

        let winPoints = 50 + bonusW; let losePoints = 50 + bonusL; 
        if(m.macTipi === 'Meydan Okuma') { winPoints = m.bahisPuani + bonusW; losePoints = -m.bahisPuani + bonusL; }

        const updateStats = (uid, isWin) => {
            if(!uid) return;
            const ref = db.collection('users').doc(uid);
            const pts = isWin ? winPoints : losePoints;
            const gInc = isWin ? 1 : 0;
            
            if (!(m.macFormati || '').includes('Tekler')) {
                const uData = userMap[uid] || {};
                const currentCiftler = uData.ciftlerPuani !== undefined ? uData.ciftlerPuani : 1000;
                batch.update(ref, { 
                    ciftlerPuani: currentCiftler + pts,
                    galibiyetSayisi: firebase.firestore.FieldValue.increment(gInc),
                    macSayisi: firebase.firestore.FieldValue.increment(1)
                });
            } else {
                batch.update(ref, { 
                    toplamPuan: firebase.firestore.FieldValue.increment(pts), 
                    galibiyetSayisi: firebase.firestore.FieldValue.increment(gInc), 
                    macSayisi: firebase.firestore.FieldValue.increment(1) 
                });
            }
        };

        updateStats(wid, true); updateStats(lid, false);
        if (!(m.macFormati || '').includes('Tekler')) { updateStats(wPartnerId, true); updateStats(lPartnerId, false); }

        const matchRef = db.collection('matches').doc(id);
        batch.update(matchRef, { durum: 'Tamamlandı', kayitliKazananID: wid });

        try {
            await batch.commit();
            
            if (m.tournamentId && m.matchTag) {
                if (typeof window.advanceTournamentBracket === 'function') {
                    await window.advanceTournamentBracket(m.tournamentId, m.matchTag, wid);
                }
            }
            
            // YENİ: PARTNERLERE DE ROZET VER
            const badgeFunc = window.checkAndGrantBadges || checkAndGrantBadges;
            if (typeof badgeFunc === 'function') {
                await badgeFunc(wid); await badgeFunc(lid);
                if (wPartnerId) await badgeFunc(wPartnerId);
                if (lPartnerId) await badgeFunc(lPartnerId);
            }

            alert("✅ Maç onaylandı ve puanlar/rozetler doğru haneye işlendi!"); 
            if (typeof confetti === 'function') { confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#c06035', '#ffffff', '#28a745'] }); }
            if (typeof goBackToList === 'function') goBackToList(); 
            if (typeof loadLeaderboard === 'function') loadLeaderboard();
        } catch (error) { console.error("Onay Hatası:", error); alert("Hata oluştu: " + error.message); }
    };

    // --- 3. MAÇ ONAYLAMA VE PUAN DAĞITIM MOTORU ---
    window.finalizeMatch = async function(id, m) {
        const batch = db.batch(); 
        const wid = m.adayKazananID; 
        const lid = (m.oyuncu1ID === wid) ? m.oyuncu2ID : m.oyuncu1ID;

        let wPartnerId = null; let lPartnerId = null;
        if (!(m.macFormati || '').includes('Tekler')) {
            wPartnerId = (m.oyuncu1ID === wid) ? m.oyuncu1PartnerID : m.oyuncu2PartnerID;
            lPartnerId = (m.oyuncu1ID === wid) ? m.oyuncu2PartnerID : m.oyuncu1PartnerID;
        }

        let wg = 0, lg = 0;
        if(m.skor) {
            const s = m.skor; const isEntryByWinner = m.sonucuGirenID === wid;
            const s1w = isEntryByWinner ? parseInt(s.s1_me||0) : parseInt(s.s1_opp||0); 
            const s1l = isEntryByWinner ? parseInt(s.s1_opp||0) : parseInt(s.s1_me||0); 
            const s2w = isEntryByWinner ? parseInt(s.s2_me||0) : parseInt(s.s2_opp||0); 
            const s2l = isEntryByWinner ? parseInt(s.s2_opp||0) : parseInt(s.s2_me||0);
            wg = s1w + s2w; lg = s1l + s2l;
        }
        const bonusW = wg * 5; const bonusL = lg * 5;

        let winPoints = 50 + bonusW; let losePoints = 50 + bonusL; 
        if(m.macTipi === 'Meydan Okuma') { winPoints = m.bahisPuani + bonusW; losePoints = -m.bahisPuani + bonusL; }

        const updateStats = (uid, isWin) => {
            if(!uid) return;
            const ref = db.collection('users').doc(uid);
            const pts = isWin ? winPoints : losePoints;
            const gInc = isWin ? 1 : 0;
            
            if (!(m.macFormati || '').includes('Tekler')) {
                const uData = userMap[uid] || {};
                const currentCiftler = uData.ciftlerPuani !== undefined ? uData.ciftlerPuani : 1000;
                batch.update(ref, { 
                    ciftlerPuani: currentCiftler + pts,
                    galibiyetSayisi: firebase.firestore.FieldValue.increment(gInc),
                    macSayisi: firebase.firestore.FieldValue.increment(1)
                });
            } else {
                batch.update(ref, { 
                    toplamPuan: firebase.firestore.FieldValue.increment(pts), 
                    galibiyetSayisi: firebase.firestore.FieldValue.increment(gInc), 
                    macSayisi: firebase.firestore.FieldValue.increment(1) 
                });
            }
        };

        updateStats(wid, true); 
        updateStats(lid, false);
        if (!(m.macFormati || '').includes('Tekler')) { 
            updateStats(wPartnerId, true); 
            updateStats(lPartnerId, false); 
        }

        const matchRef = db.collection('matches').doc(id);
        batch.update(matchRef, { durum: 'Tamamlandı', kayitliKazananID: wid });

        try {
            await batch.commit();
            
            // BURADA GLOBAL 'window.' ÖNEKİ İLE ÇAĞIRIYORUZ (Hatanın Çözümü)
            if (m.tournamentId && m.matchTag) {
                if (typeof window.advanceTournamentBracket === 'function') {
                    await window.advanceTournamentBracket(m.tournamentId, m.matchTag, wid);
                }
            }
            
            if (typeof checkAndGrantBadges === 'function') {
                await checkAndGrantBadges(wid); await checkAndGrantBadges(lid);
            }
            alert("✅ Maç onaylandı ve puanlar doğru haneye işlendi!"); 
            if (typeof confetti === 'function') {
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#c06035', '#ffffff', '#28a745'] });
            }
            if (typeof goBackToList === 'function') goBackToList(); 
            if (typeof loadLeaderboard === 'function') loadLeaderboard();
        } catch (error) { console.error("Onay Hatası:", error); alert("Hata oluştu: " + error.message); }
    };

    window.generateKnockoutDraw = async function(tourId, isDirect = true) {
        if (!confirm("Kura çekilecek ve gerçek maç dökümanları oluşturulacak. Onaylıyor musunuz?")) return;
        try {
            const docRef = db.collection('tournaments').doc(tourId); const tourData = (await docRef.get()).data();
            
            // Yüzde Hesabı (Seribaşı)
            const matchesSnap = await db.collection('matches').where('durum', '==', 'Tamamlandı').get();
            let gameStats = {}; 
            matchesSnap.forEach(doc => {
                const m = doc.data();
                if(m.skor) {
                    const s = m.skor; const p1 = m.sonucuGirenID; const p2 = m.oyuncu1ID === p1 ? m.oyuncu2ID : m.oyuncu1ID; 
                    if(!gameStats[p1]) gameStats[p1] = { w: 0, p: 0 }; if(!gameStats[p2]) gameStats[p2] = { w: 0, p: 0 };
                    const sets = [{ w: s.s1_me, l: s.s1_opp, tb: false }, { w: s.s2_me, l: s.s2_opp, tb: false }, { w: s.s3_me, l: s.s3_opp, tb: true }];
                    sets.forEach(set => { if (set.tb) return; let w = parseInt(set.w || 0); let l = parseInt(set.l || 0); if(w + l > 0) { gameStats[p1].w += w; gameStats[p1].p += (w + l); gameStats[p2].w += l; gameStats[p2].p += (w + l); } });
                }
            });
            const getRate = (uid) => { if(!gameStats[uid] || gameStats[uid].p === 0) return 0; return (gameStats[uid].w / gameStats[uid].p) * 100; };
            let players = [...tourData.participants].map(p => { let r = getRate(p.p1); if (!(tourData.format || '').includes('Tekler') && p.p2) { r = (getRate(p.p1) + getRate(p.p2)) / 2; } return { ...p, points: r }; });
            players.sort((a, b) => b.points - a.points); 

            // Bracket Boyutu
            const n = players.length; const bracketSize = Math.pow(2, Math.ceil(Math.log2(n))); const byes = bracketSize - n;
            for(let i=0; i<byes; i++) { players.push({ isBye: true }); }

            function getSeededOrder(size) {
                if (size <= 1) return [1]; const half = getSeededOrder(size / 2); const res = [];
                for (let i = 0; i < half.length; i++) { res.push(half[i]); res.push(size - half[i] + 1); } return res;
            }
            const seededPositions = getSeededOrder(bracketSize);

            // İskelet Oluşturma
            const rounds = []; let currentSize = bracketSize / 2; let rNum = 1;
            while(currentSize >= 1) {
                let rName = rNum + ". Tur"; if(currentSize === 4) rName = "Çeyrek Final"; if(currentSize === 2) rName = "Yarı Final"; if(currentSize === 1) rName = "Final";
                let mList = []; for(let i=0; i<currentSize; i++) mList.push({ p1: null, p2: null, winner: null, score: null, firestoreMatchId: null });
                rounds.push({ roundName: rName, matches: mList }); currentSize /= 2; rNum++;
            }

            // 1. Turu ve BAY'ları İşleme
            for (let i = 0; i < bracketSize; i += 2) {
                const p1 = players[seededPositions[i]-1]; const p2 = players[seededPositions[i+1]-1]; const mIdx = i / 2;
                rounds[0].matches[mIdx].p1 = p1; rounds[0].matches[mIdx].p2 = p2;
                const autoWinner = p1.isBye ? p2 : (p2.isBye ? p1 : null);

                if (autoWinner) {
                    rounds[0].matches[mIdx].winner = autoWinner; rounds[0].matches[mIdx].score = "Bay Geçti";
                    const nextMIdx = Math.floor(mIdx / 2);
                    if (mIdx % 2 === 0) rounds[1].matches[nextMIdx].p1 = autoWinner; else rounds[1].matches[nextMIdx].p2 = autoWinner;
                } else {
                    const mId = await createTournamentMatchDoc(tourId, p1, p2, rounds[0].roundName, `R0_M${mIdx}`);
                    rounds[0].matches[mIdx].firestoreMatchId = mId;
                }
            }

            await docRef.update({ status: 'Devam Ediyor', bracket: rounds });
            alert("Turnuva fikstürü oluşturuldu ve maçlar açıldı! 🏆");
            openTournamentDetail(tourId, (await docRef.get()).data());
        } catch(e) { alert("Hata: " + e.message); }
    };
// --- 5. AĞAÇ (BRACKET) VE GRUP TABLOSU ÇİZİCİ ---
    window.renderTournamentBracket = function(tourId, tourData, myUid) {
        const container = document.getElementById('tour-bracket-container');
        if(!container) return; 
        container.innerHTML = ''; 
        
        container.style.flexDirection = 'column';
        container.style.gap = '30px';
        container.style.alignItems = 'center';

        const isAdmin = (tourData.creatorId === myUid);

const getPlayerFullName = (p) => {
            if (!p) return '<span style="color:#ccc;">Bekleniyor</span>';
            if (p.isBye) return '<span style="color:#aaa;">- BAY -</span>';
            
            // Eğer yer tutucuysa ve henüz ismi yoksa "Grup A 1." veya "En İyi 1. Üçüncü" yazdır
            if (p.isPlaceholder && !p.p1) {
                if (p.isBestExtra) return `<span style="color:#007bff; font-weight:bold;">En İyi ${p.extraRank}. Üçüncü</span>`;
                return `<span style="color:#c06035; font-weight:bold;">${p.groupName} Grubu ${p.rank}.</span>`;
            }
            
            let name = userMap[p.p1]?.isim || 'Oyuncu'; 
            if (p.p2) name += ` & ${userMap[p.p2]?.isim || 'Oyuncu'}`; 
            
            // Eğer yer tutucu koltuğunda oturuyorsa başına durumunu (Aday/Kesinleşti) ekle
            if (p.isPlaceholder) {
                if (p.isBestExtra && p.isLiveCandidate) {
                    name = `<small style="font-size:0.7em; color:#007bff; font-weight:bold;">(Şu anki ${p.extraRank}. Aday)</small><br>` + name;
                } else if (p.isLiveCandidate) {
                    name = `<small style="font-size:0.7em; color:#c06035; font-weight:bold;">(Şu anki Aday)</small><br>` + name;
                } else if (p.isBestExtra) {
                    name = `<small style="font-size:0.7em; color:#28a745; font-weight:bold;">(Kesinleşti: ${p.extraRank}. Üçüncü)</small><br>` + name;
                } else {
                    name = `<small style="font-size:0.7em; color:#777; font-weight:bold;">(${p.groupName} Grubu ${p.rank}.)</small><br>` + name;
                }
            }
            
            return name;
        };
 // YENİ: LİG SİSTEMİ TABLOSU VE FİKSTÜRÜ ÇİZİMİ
        if (tourData.systemType === 'league' && tourData.bracket) {
            const isIndividual = ((tourData.format || '').includes('Tekler') || tourData.standingsType === 'individual' || tourData.leagueTeamType === 'changing');
            let stats = {};
            
// İstatistik Havuzunu Kur
            tourData.bracket.forEach(round => {
                round.matches.forEach(m => {
                    if(!m.p1 || !m.p2) return;
                    
                    const p1Id = isIndividual ? m.p1.p1 : m.p1.p1 + "_" + (m.p1.p2 || '');
                    const p2Id = isIndividual ? m.p2.p1 : m.p2.p1 + "_" + (m.p2.p2 || '');
                    
                    const addStat = (id, obj) => { if(!stats[id]) stats[id] = { name: getPlayerFullName(obj), pld: 0, w: 0, l: 0, pts: 0, gw: 0, gl: 0, rate: 0 }; };
                    
                    // HATA BURADAYDI: Bireysel modda herkesi TEKİL obje olarak fonksiyona gönderiyoruz
                    if (isIndividual) {
                        addStat(m.p1.p1, { p1: m.p1.p1 });
                        if (m.p1.p2) addStat(m.p1.p2, { p1: m.p1.p2 });
                        
                        addStat(m.p2.p1, { p1: m.p2.p1 });
                        if (m.p2.p2) addStat(m.p2.p2, { p1: m.p2.p2 });
                    } else {
                        addStat(p1Id, m.p1); 
                        addStat(p2Id, m.p2);
                    }

                    if (m.winner) {
                        const winId1 = isIndividual ? m.winner.p1 : m.winner.p1 + "_" + (m.winner.p2 || '');
                        const losId1 = (m.winner.p1 === m.p1.p1) ? (isIndividual ? m.p2.p1 : m.p2.p1 + "_" + (m.p2.p2 || '')) : (isIndividual ? m.p1.p1 : m.p1.p1 + "_" + (m.p1.p2 || ''));
                        
                        // Maç Puanlarını Ekle
                        stats[winId1].pld++; stats[winId1].w++; stats[winId1].pts += 3;
                        stats[losId1].pld++; stats[losId1].l++; stats[losId1].pts += 1;

                        if (isIndividual && m.winner.p2) { stats[m.winner.p2].pld++; stats[m.winner.p2].w++; stats[m.winner.p2].pts += 3; }
                        if (isIndividual && m.p1.p2 && m.p2.p2) {
                            const losId2 = (m.winner.p1 === m.p1.p1) ? m.p2.p2 : m.p1.p2;
                            stats[losId2].pld++; stats[losId2].l++; stats[losId2].pts += 1;
                        }

                        // Oyun (Game) Averajlarını Hesapla
                        let p1G = 0; let p2G = 0;
                        if (m.rawScore) {
                            const s = m.rawScore;
                            p1G = parseInt(s.s1_me||0) + parseInt(s.s2_me||0) + parseInt(s.s3_me||0);
                            p2G = parseInt(s.s1_opp||0) + parseInt(s.s2_opp||0) + parseInt(s.s3_opp||0);
                        }
                        
                        const updateGames = (id, wonG, lostG) => {
                            if(stats[id]) { stats[id].gw += wonG; stats[id].gl += lostG; }
                        };
                        
                        updateGames(p1Id, p1G, p2G);
                        updateGames(p2Id, p2G, p1G);
                        if (isIndividual && m.p1.p2) updateGames(m.p1.p2, p1G, p2G);
                        if (isIndividual && m.p2.p2) updateGames(m.p2.p2, p2G, p1G);
                    }
                });
            });

            // Kazanma Yüzdelerini Belirle
            Object.values(stats).forEach(st => {
                const totalGames = st.gw + st.gl;
                st.rate = totalGames > 0 ? (st.gw / totalGames) * 100 : 0;
            });
            
            // Sıralama Algoritması: 1. Puan -> 2. Yüzde Oranı -> 3. Aldığı Oyun -> 4. Oynadığı Maç
            const sortedStats = Object.values(stats).sort((a,b) => b.pts - a.pts || b.rate - a.rate || b.gw - a.gw || a.pld - b.pld);
            
            // Puan Tablosu HTML
            let leagueHTML = `
                <div style="background:#fff; border-radius:12px; padding:15px; border:1px solid #ddd; margin-bottom:20px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                    <h3 style="margin-top:0; color:#0d47a1; text-align:center; border-bottom:2px solid #eee; padding-bottom:10px;">🏆 Lig Puan Durumu</h3>
                    <div style="overflow-x:auto;">
                        <table style="width:100%; min-width:320px; border-collapse:collapse; font-size:0.85em;">
                            <tr style="background:#f8f9fa; text-align:left; border-bottom:1px solid #ddd;">
                                <th style="padding:8px 4px;">Sıra</th>
                                <th style="padding:8px 4px;">${isIndividual ? 'Oyuncu' : 'Takım'}</th>
                                <th style="padding:8px 4px; text-align:center;">O</th>
                                <th style="padding:8px 4px; text-align:center;">G</th>
                                <th style="padding:8px 4px; text-align:center;">M</th>
                                <th style="padding:8px 4px; text-align:center;">A.O</th>
                                <th style="padding:8px 4px; text-align:center;">V.O</th>
                                <th style="padding:8px 4px; text-align:center; color:#28a745;">%</th>
                                <th style="padding:8px 4px; text-align:center; color:#d35400;">Puan</th>
                            </tr>`;
            
            sortedStats.forEach((st, idx) => {
                const bg = idx === 0 ? 'background:#fff8e1;' : ''; // Lidere sarı arka plan
                leagueHTML += `
                    <tr style="border-bottom:1px solid #eee; ${bg}">
                        <td style="padding:8px 4px; font-weight:bold;">${idx+1}.</td>
                        <td style="padding:8px 4px; font-weight:600; color:#444;">${st.name}</td>
                        <td style="padding:8px 4px; text-align:center;">${st.pld}</td>
                        <td style="padding:8px 4px; text-align:center; color:#28a745;">${st.w}</td>
                        <td style="padding:8px 4px; text-align:center; color:#dc3545;">${st.l}</td>
                        <td style="padding:8px 4px; text-align:center;">${st.gw}</td>
                        <td style="padding:8px 4px; text-align:center;">${st.gl}</td>
                        <td style="padding:8px 4px; text-align:center; font-weight:bold; color:#28a745;">%${st.rate.toFixed(1)}</td>
                        <td style="padding:8px 4px; text-align:center; font-weight:bold; color:#d35400;">${st.pts}</td>
                    </tr>`;
            });
            leagueHTML += `</table></div></div>`;
            
            // Fikstür HTML
            leagueHTML += `<h3 style="color:#c06035; text-align:center;">📅 Haftalık Fikstür</h3><div style="display:flex; flex-direction:column; gap:20px;">`;
            tourData.bracket.forEach(round => {
                leagueHTML += `<div style="background:#f8f9fa; padding:15px; border-radius:10px; border:1px solid #eee;">
                    <div style="font-weight:bold; color:#555; margin-bottom:10px; text-transform:uppercase; border-bottom:1px dashed #ccc; padding-bottom:5px;">${round.roundName}</div>
                    <div style="display:flex; flex-direction:column; gap:8px;">`;
                
                round.matches.forEach(m => {
                    const isP1Win = m.winner && m.winner.p1 === m.p1?.p1; 
                    const isP2Win = m.winner && m.winner.p1 === m.p2?.p1;
                    leagueHTML += `
                        <div class="bracket-match" style="cursor:pointer; border:1px solid ${m.winner ? '#28a745' : '#ccc'}; width:100%; min-width:unset;" onclick="returnToTab = 'tab-tournaments'; showMatchDetail('${m.firestoreMatchId}')">
                            <div class="match-player ${isP1Win ? 'player-winner' : ''}"><span>${getPlayerFullName(m.p1)}</span><span style="font-size:0.8em;">${isP1Win ? 'Galip' : '-'}</span></div>
                            <div class="match-player ${isP2Win ? 'player-winner' : ''}"><span>${getPlayerFullName(m.p2)}</span><span style="font-size:0.8em;">${isP2Win ? 'Galip' : '-'}</span></div>
                        </div>`;
                });
                leagueHTML += `</div></div>`;
            });
            leagueHTML += `</div>`;
            
            container.innerHTML = leagueHTML;
            return; 
        }

        if (tourData.groups && tourData.groups.length > 0) {
            const groupsWrapper = document.createElement('div');
            groupsWrapper.className = "groups-wrapper";
            groupsWrapper.style.width = "100%";
            groupsWrapper.style.display = "flex";
            groupsWrapper.style.flexDirection = "column";
            groupsWrapper.style.gap = "20px";

            const groupHeader = document.createElement('h3');
            groupHeader.innerHTML = "📊 Grup Puan Durumu";
            groupHeader.style.textAlign = "center";
            groupHeader.style.color = "#555";
            groupsWrapper.appendChild(groupHeader);

            tourData.groups.forEach(group => {
                const groupDiv = document.createElement('div');
                groupDiv.style.background = '#fff';
                groupDiv.style.borderRadius = '12px';
                groupDiv.style.border = '1px solid #ddd';
                groupDiv.style.padding = '15px';
                groupDiv.style.boxShadow = '0 4px 10px rgba(0,0,0,0.05)';

                const isThreePoint = tourData.pointsSystem === 'threePoint';
                let ptsTh = isThreePoint ? '<th style="padding:6px 4px; text-align:center; color:#d35400;">Puan</th>' : '';

                let html = `<h4 style="margin-top:0; color:#c06035; border-bottom:2px solid #eee; padding-bottom:5px;">${group.groupName}</h4>
                            <div style="width: 100%; overflow-x: auto; margin-bottom:15px; border-radius: 8px;">
                                <table style="width:100%; min-width: 320px; border-collapse: collapse; font-size:0.8em;">
                                    <tr style="background:#f8f9fa; border-bottom:1px solid #ddd; text-align:left;">
                                        <th style="padding:6px 4px;">Takım/Oyuncu</th>
                                        <th style="padding:6px 4px; text-align:center;">O</th>
                                        <th style="padding:6px 4px; text-align:center;">G</th>
                                        <th style="padding:6px 4px; text-align:center;">M</th>
                                        <th style="padding:6px 4px; text-align:center;">A.O</th>
                                        <th style="padding:6px 4px; text-align:center;">V.O</th>
                                        ${ptsTh}
                                        <th style="padding:6px 4px; text-align:center; color:#28a745;">%</th>
                                    </tr>`;
                
                let sortedPlayers = [...group.players].sort((a, b) => {
                    if (tourData.pointsSystem === 'threePoint') {
                        return (b.groupPoints || 0) - (a.groupPoints || 0) || b.winRate - a.winRate || b.gamesWon - a.gamesWon;
                    } else {
                        return b.winRate - a.winRate || b.gamesWon - a.gamesWon || b.won - a.won;
                    }
                });

                const advCount = tourData.advancingCount || 2;

                sortedPlayers.forEach((p, pIdx) => {
                    const isQualifying = (pIdx < advCount);
                    const rowStyle = isQualifying ? 'background: #e8f5e9;' : '';
                    const badge = isQualifying ? '<br><span style="color:#28a745; font-size:0.9em;">✅ Üst Tura Çıkıyor</span>' : '';
                    let ptsTd = isThreePoint ? `<td style="padding:6px 4px; text-align:center; font-weight:bold; color:#d35400;">${p.groupPoints || 0}</td>` : '';

                    html += `<tr style="border-bottom:1px solid #eee; ${rowStyle}">
                                <td style="padding:6px 4px; font-weight:bold; color:#444; max-width: 130px; white-space: normal; word-wrap: break-word;">
                                    ${getPlayerFullName(p)}${badge}
                                </td>
                                <td style="padding:6px 4px; text-align:center;">${p.played}</td>
                                <td style="padding:6px 4px; text-align:center;">${p.won}</td>
                                <td style="padding:6px 4px; text-align:center;">${p.lost}</td>
                                <td style="padding:6px 4px; text-align:center;">${p.gamesWon}</td>
                                <td style="padding:6px 4px; text-align:center;">${p.gamesLost}</td>
                                ${ptsTd}
                                <td style="padding:6px 4px; text-align:center; font-weight:bold; color:#28a745;">%${(p.winRate || 0).toFixed(1)}</td>
                             </tr>`;
                });
                
                html += `</table></div>`;
                
                html += `<div style="font-weight:bold; color:#777; font-size:0.75em; margin-bottom:8px; text-transform:uppercase;">Grup Maçları</div><div style="display:flex; flex-direction:column; gap:8px;">`;

                group.matches.forEach(match => {
                    const isP1Win = match.winner && match.winner.p1 === match.p1?.p1; 
                    const isP2Win = match.winner && match.winner.p1 === match.p2?.p1;
                    html += `
                        <div class="bracket-match" style="cursor:pointer; border:1px solid ${match.winner ? '#28a745' : '#c06035'}; min-width:unset; width:100%;" onclick="returnToTab = 'tab-tournaments'; showMatchDetail('${match.firestoreMatchId}')">
                            <div class="match-player ${isP1Win ? 'player-winner' : ''}"><span>${getPlayerFullName(match.p1)}</span><span style="font-size:0.8em;">${isP1Win ? 'Galip' : '-'}</span></div>
                            <div class="match-player ${isP2Win ? 'player-winner' : ''}"><span>${getPlayerFullName(match.p2)}</span><span style="font-size:0.8em;">${isP2Win ? 'Galip' : '-'}</span></div>
                        </div>
                    `;
                });
                html += `</div>`;
                groupDiv.innerHTML = html;
                groupsWrapper.appendChild(groupDiv);
            });
            container.appendChild(groupsWrapper);
        }

        if (tourData.bracket && tourData.bracket.length > 0) {
            const bracketWrapper = document.createElement('div');
            bracketWrapper.style.width = "100%";
            bracketWrapper.style.marginTop = "20px";
            bracketWrapper.style.paddingTop = "20px";
            bracketWrapper.style.borderTop = "3px dashed #eee";

            const bracketHeader = document.createElement('h3');
            bracketHeader.innerHTML = "🏆 Eleme Turları (Final Yolu)";
            bracketHeader.style.textAlign = "center";
            bracketHeader.style.color = "#c06035";
            bracketHeader.style.marginBottom = "20px";
            bracketWrapper.appendChild(bracketHeader);

            const treeScrollArea = document.createElement('div');
            treeScrollArea.style.display = "flex";
            treeScrollArea.style.flexDirection = "row";
            treeScrollArea.style.gap = "30px";
            treeScrollArea.style.overflowX = "auto";
            treeScrollArea.style.padding = "10px 5px";
            treeScrollArea.style.webkitOverflowScrolling = "touch";

            tourData.bracket.forEach((round, rIndex) => {
                const roundDiv = document.createElement('div'); 
                roundDiv.className = 'bracket-round';
                roundDiv.innerHTML = `<div class="round-header">${round.roundName}</div>`;

                round.matches.forEach((match, mIndex) => {
                    const matchDiv = document.createElement('div'); 
                    matchDiv.className = 'bracket-match';
                    const isP1Win = match.winner && match.winner.p1 === match.p1?.p1; 
                    const isP2Win = match.winner && match.winner.p1 === match.p2?.p1;

                    matchDiv.innerHTML = `
                        <div class="match-player ${isP1Win ? 'player-winner' : ''}"><span>${getPlayerFullName(match.p1)}</span><span style="font-size:0.8em;">${isP1Win ? 'Galip' : '-'}</span></div>
                        <div class="match-player ${isP2Win ? 'player-winner' : ''}"><span>${getPlayerFullName(match.p2)}</span><span style="font-size:0.8em;">${isP2Win ? 'Galip' : '-'}</span></div>
                    `;

                    if (match.firestoreMatchId) {
                        matchDiv.style.border = "1px solid #c06035"; matchDiv.style.cursor = "pointer";
                        matchDiv.onclick = () => { returnToTab = 'tab-tournaments'; showMatchDetail(match.firestoreMatchId); };
                    }
                    roundDiv.appendChild(matchDiv);
                });
                treeScrollArea.appendChild(roundDiv);
            });
            bracketWrapper.appendChild(treeScrollArea);
            container.appendChild(bracketWrapper);
        }
        const scrollSpacer = document.createElement('div');
        scrollSpacer.style.height = "120px";
        scrollSpacer.style.width = "100%";
        scrollSpacer.style.flexShrink = "0";
        container.appendChild(scrollSpacer);
    };

    // Filtre Butonları (Tekler/Çiftler vb)
    const btnRankSingles = document.getElementById('btn-rank-singles');
    const btnRankDoubles = document.getElementById('btn-rank-doubles');
    if (btnRankSingles && btnRankDoubles) {
        btnRankSingles.addEventListener('click', () => { currentLeaderboardMode = 'Tekler'; btnRankSingles.style.background = '#c06035'; btnRankDoubles.style.background = '#6c757d'; loadLeaderboard(document.getElementById('leaderboard-club-filter').value); });
        btnRankDoubles.addEventListener('click', () => { currentLeaderboardMode = 'Çiftler'; btnRankSingles.style.background = '#6c757d'; btnRankDoubles.style.background = '#c06035'; loadLeaderboard(document.getElementById('leaderboard-club-filter').value); });
    }

    // ============================================================================
    // ============================================================================

    // --- SAFARİ/IOS UYUMLU MANUEL BİLDİRİM İZNİ ---

    // --- SAFARİ/IOS UYUMLU MANUEL BİLDİRİM İZNİ ---
    const btnEnablePush = document.getElementById('btn-enable-push');
    if (btnEnablePush) {
        btnEnablePush.addEventListener('click', () => {
            if (!window.PusherPushNotifications) {
                return alert("Tarayıcınız veya cihazınız bu bildirim türünü desteklemiyor (PWA olarak ana ekrana eklediğinizden emin olun).");
            }
            
            btnEnablePush.textContent = "Bağlanıyor... ⏳";
            
            navigator.serviceWorker.ready.then(registration => {
                const beamsClient = new window.PusherPushNotifications.Client({
                    instanceId: 'b752a69c-c259-4e6e-adcf-d16c8c323ff9',
                    serviceWorkerRegistration: registration 
                });
                
                beamsClient.start()
                    .then(() => beamsClient.addDeviceInterest(auth.currentUser.uid))
                    .then(() => {
                        alert("Harika! Bildirimler başarıyla açıldı. Artık hiçbir maçı kaçırmayacaksın! 🔔");
                        btnEnablePush.style.display = 'none';
                    })
                    .catch(error => {
                        console.error("Bildirim açma hatası:", error);
                        alert("Bağlantı engellendi veya reddedildi: " + error.message);
                        btnEnablePush.textContent = "🔔 Telefona Bildirim Gönder";
                    });
            }).catch(error => {
                alert("Servis başlatılamadı: " + error.message);
                btnEnablePush.textContent = "🔔 Telefona Bildirim Gönder";
            });
        });
        
        if (window.Notification && Notification.permission === 'granted') {
            btnEnablePush.style.display = 'none';
        }
    }

    // --- TÜM LİGİN PUANLARINI SIFIRDAN HESAPLAMA MOTORU (MANUEL DEĞİŞİKLİKLER İÇİN) ---
    window.recalculateAllPoints = async function() {
        if(!confirm("DİKKAT: Veritabanındaki manuel değişiklikler nedeniyle bozulan puanları düzeltmek için tüm ligin puanları maç geçmişine bakılarak SIFIRDAN hesaplanacaktır. Onaylıyor musunuz?")) return;
        try {
            // Ekrana yükleniyor yazısı koy
            const loading = document.createElement('div');
            loading.id = 'recalc-loading';
            loading.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);color:white;display:flex;justify-content:center;align-items:center;z-index:9999;font-size:1.2em;font-weight:bold;text-align:center;padding:20px;';
            loading.innerHTML = 'Lig verileri taranıyor ve puanlar yeniden dağıtılıyor...<br>Lütfen bekleyin ⏳';
            document.body.appendChild(loading);

            // 1. Tüm kullanıcıları al ve puanlarını sıfırla (1000)
            const usersSnap = await db.collection('users').get();
            let userStats = {};
            usersSnap.forEach(doc => {
                userStats[doc.id] = {
                    toplamPuan: 1000,
                    ciftlerPuani: 1000,
                    galibiyetSayisi: 0,
                    macSayisi: 0,
                    ref: doc.ref
                };
            });

            // 2. Tüm bitmiş maçları çek
            const matchesSnap = await db.collection('matches').where('durum', '==', 'Tamamlandı').get();

            matchesSnap.forEach(doc => {
                const m = doc.data();
                const wid = m.kayitliKazananID;
                if(!wid) return; // Kazananı belli olmayan maçları atla
                
                const lid = (m.oyuncu1ID === wid) ? m.oyuncu2ID : m.oyuncu1ID;

                // Partnerleri de yakala
                let wPartnerId = null; let lPartnerId = null;
                if (!(m.macFormati || '').includes('Tekler')) {
                    wPartnerId = (m.oyuncu1ID === wid) ? m.oyuncu1PartnerID : m.oyuncu2PartnerID;
                    lPartnerId = (m.oyuncu1ID === wid) ? m.oyuncu2PartnerID : m.oyuncu1PartnerID;
                }

                // 3. Puan Matematiği
                let wg = 0, lg = 0;
                if(m.skor) {
                    const s = m.skor;
                    if (m.macTipi === 'Turnuva') {
                        const p1G = parseInt(s.s1_me||0) + parseInt(s.s2_me||0);
                        const p2G = parseInt(s.s1_opp||0) + parseInt(s.s2_opp||0);
                        if (m.oyuncu1ID === wid) { wg = p1G; lg = p2G; } else { wg = p2G; lg = p1G; }
                    } else {
                        const isEntryByWinner = m.sonucuGirenID === wid;
                        const s1w = isEntryByWinner ? parseInt(s.s1_me||0) : parseInt(s.s1_opp||0);
                        const s1l = isEntryByWinner ? parseInt(s.s1_opp||0) : parseInt(s.s1_me||0);
                        const s2w = isEntryByWinner ? parseInt(s.s2_me||0) : parseInt(s.s2_opp||0);
                        const s2l = isEntryByWinner ? parseInt(s.s2_opp||0) : parseInt(s.s2_me||0);
                        wg = s1w + s2w; lg = s1l + s2l;
                    }
                }
                const bonusW = wg * 5; const bonusL = lg * 5;

                let winPoints = 50 + bonusW; let losePoints = 50 + bonusL;
                if(m.macTipi === 'Meydan Okuma') { winPoints = m.bahisPuani + bonusW; losePoints = -m.bahisPuani + bonusL; }

                // Puanları hanelere yazma fonksiyonu
                const applyToUser = (uid, isWin) => {
                    if(!uid || !userStats[uid]) return;
                    userStats[uid].macSayisi += 1;
                    if(isWin) userStats[uid].galibiyetSayisi += 1;

                    if (!(m.macFormati || '').includes('Tekler')) {
                        userStats[uid].ciftlerPuani += isWin ? winPoints : losePoints;
                    } else {
                        userStats[uid].toplamPuan += isWin ? winPoints : losePoints;
                    }
                };

                // Puanları Dağıt
                applyToUser(wid, true);
                applyToUser(lid, false);
                if (!(m.macFormati || '').includes('Tekler')) {
                    applyToUser(wPartnerId, true);
                    applyToUser(lPartnerId, false);
                }
            });

            // 4. Yeni Puanları Veritabanına Topluca Kaydet
            const batch = db.batch();
            for (const uid in userStats) {
                const u = userStats[uid];
                batch.update(u.ref, {
                    toplamPuan: u.toplamPuan,
                    ciftlerPuani: u.ciftlerPuani,
                    galibiyetSayisi: u.galibiyetSayisi,
                    macSayisi: u.macSayisi
                });
            }

            await batch.commit();
            document.getElementById('recalc-loading').remove();
            alert("Muazzam! Tüm lig puanları mevcut maçlara göre sıfırdan hesaplandı ve hak edenlere teslim edildi! ✅");
            window.location.reload();
        } catch(e) {
            console.error(e);
            alert("Hata oluştu: " + e.message);
            if(document.getElementById('recalc-loading')) document.getElementById('recalc-loading').remove();
        }
    };
// --- YENİ: OTOMATİK DENK/KURA TAKIM KURMA ALGORİTMASI ---
// --- YENİ: OYUN KAZANMA YÜZDESİNE GÖRE DENK/KURA TAKIM KURMA ALGORİTMASI ---
// --- YENİ: OYUN KAZANMA YÜZDESİNE GÖRE DENK/KURA TAKIM KURMA ALGORİTMASI ---
    window.generateAutoTeams = async function(tourId) {
        try {
            const docRef = db.collection('tournaments').doc(tourId);
            const data = (await docRef.get()).data();
            let players = data.participants || [];
            
            // 1. GERÇEK GÜCÜ BUL (Tüm maçlardan Oyun Kazanma Yüzdesini Hesapla)
            const matchesSnap = await db.collection('matches').where('durum', '==', 'Tamamlandı').get();
            let gameStats = {}; 
            matchesSnap.forEach(doc => {
                const m = doc.data();
                if(!m.skor || !m.kayitliKazananID) return;
                
                const wid = m.kayitliKazananID;
                const lid = (m.oyuncu1ID === wid) ? m.oyuncu2ID : m.oyuncu1ID;
                let wP = (m.oyuncu1ID === wid) ? m.oyuncu1PartnerID : m.oyuncu2PartnerID;
                let lP = (m.oyuncu1ID === wid) ? m.oyuncu2PartnerID : m.oyuncu1PartnerID;

                const uids = [wid, lid]; if(wP) uids.push(wP); if(lP) uids.push(lP);
                uids.forEach(u => { if(u && !gameStats[u]) gameStats[u] = { w: 0, p: 0 }; });

                const s = m.skor;
                const sets = [{ w: s.s1_me, l: s.s1_opp, tb: false }, { w: s.s2_me, l: s.s2_opp, tb: false }, { w: s.s3_me, l: s.s3_opp, tb: true }];
                
                let isEntryByWinner = m.sonucuGirenID === wid;
                if (m.macTipi === 'Turnuva') isEntryByWinner = (m.oyuncu1ID === wid);
                
                sets.forEach(set => { 
                    if (set.tb) return; // Tie-Break oyundan sayılmaz
                    let b1 = parseInt(set.w || 0); let b2 = parseInt(set.l || 0); 
                    if(b1 + b2 > 0) { 
                        let winG = isEntryByWinner ? b1 : b2; let losG = isEntryByWinner ? b2 : b1;
                        if(wid) { gameStats[wid].w += winG; gameStats[wid].p += (winG + losG); }
                        if(wP) { gameStats[wP].w += winG; gameStats[wP].p += (winG + losG); }
                        if(lid) { gameStats[lid].w += losG; gameStats[lid].p += (winG + losG); }
                        if(lP) { gameStats[lP].w += losG; gameStats[lP].p += (winG + losG); }
                    } 
                });
            });

            // 2. TAKIMLARI KUR
            if (data.format === 'Mix') {
                let males = []; let females = [];
                for (let p of players) {
                    const u = userMap[p.p1];
                    let rate = 0;
                    
                    // SİHİRLİ DOKUNUŞ: EĞER OYUNCUNUN HİÇ MAÇI YOKSA ORGANİZATÖRE SOR!
                    if (!gameStats[p.p1] || gameStats[p.p1].p === 0) {
                        if (data.autoType === 'balanced') {
                            let val = prompt(`🚨 DİKKAT: ${u.isim || 'Bilinmeyen'} isimli oyuncunun sistemde hiç maçı yok!\n\nDenk takımlar kurabilmek için lütfen bu oyuncuya tahmini bir Oyun Kazanma Yüzdesi (%) girin:\n(Örn: Ortalama bir oyuncu için 40-50 arası bir değer)`);
                            rate = parseFloat(val);
                            if(isNaN(rate)) rate = 0;
                        }
                    } else {
                        rate = (gameStats[p.p1].w / gameStats[p.p1].p) * 100;
                    }
                    
                    if(u.cinsiyet === 'Kadın') females.push({uid: p.p1, rate: rate});
                    else males.push({uid: p.p1, rate: rate});
                }
                
                if (males.length !== females.length) return alert(`🚨 Mix turnuvası için Kadın ve Erkek sayıları EŞİT olmalıdır! \nMevcut Kayıt: ${males.length} Erkek, ${females.length} Kadın.`);
                
                if (data.autoType === 'balanced') {
                    males.sort((a,b) => b.rate - a.rate); // Erkekler Büyükten Küçüğe
                    females.sort((a,b) => a.rate - b.rate); // Kadınlar Küçükten Büyüğe
                } else {
                    males.sort(() => 0.5 - Math.random()); females.sort(() => 0.5 - Math.random());
                }
                
                let newTeams = [];
                for(let i=0; i<males.length; i++) {
                    const avgRate = ((males[i].rate + females[i].rate) / 2).toFixed(1);
                    newTeams.push({ p1: males[i].uid, p2: females[i].uid, points: avgRate }); 
                }
                await docRef.update({ participants: newTeams, teamsGenerated: true });
                alert("Müthiş! Mix takımları OYUN KAZANMA YÜZDELERİ gözetilerek dengeli bir şekilde kuruldu! ✅");
                openTournamentDetail(tourId, (await docRef.get()).data());
                
            } else { // Double Erkek veya Double Kadın
                if (players.length % 2 !== 0) return alert(`🚨 Eşleşme için toplam oyuncu sayısı ÇİFT olmalıdır! (Mevcut: ${players.length})`);
                
                let all = [];
                for (let p of players) {
                    const u = userMap[p.p1];
                    let rate = 0;
                    
                    // SİHİRLİ DOKUNUŞ: EĞER OYUNCUNUN HİÇ MAÇI YOKSA ORGANİZATÖRE SOR!
                    if (!gameStats[p.p1] || gameStats[p.p1].p === 0) {
                        if (data.autoType === 'balanced') {
                            let val = prompt(`🚨 DİKKAT: ${u.isim || 'Bilinmeyen'} isimli oyuncunun sistemde hiç maçı yok!\n\nDenk takımlar kurabilmek için lütfen bu oyuncuya tahmini bir Oyun Kazanma Yüzdesi (%) girin:\n(Örn: Ortalama bir oyuncu için 40-50 arası bir değer)`);
                            rate = parseFloat(val);
                            if(isNaN(rate)) rate = 0;
                        }
                    } else {
                        rate = (gameStats[p.p1].w / gameStats[p.p1].p) * 100;
                    }
                    all.push({uid: p.p1, rate: rate});
                }

                if (data.autoType === 'balanced') { all.sort((a,b) => b.rate - a.rate); } 
                else { all.sort(() => 0.5 - Math.random()); }
                
                let newTeams = [];
                for(let i=0; i<all.length/2; i++) {
                    const avgRate = ((all[i].rate + all[all.length - 1 - i].rate) / 2).toFixed(1);
                    newTeams.push({ p1: all[i].uid, p2: all[all.length - 1 - i].uid, points: avgRate });
                }
                await docRef.update({ participants: newTeams, teamsGenerated: true });
                alert("Takımlar OYUN KAZANMA YÜZDELERİNE göre başarıyla kuruldu! ✅");
                openTournamentDetail(tourId, (await docRef.get()).data());
            }
        } catch(e) { alert("Takım kurma hatası: " + e.message); }
    };

/// --- 2. KATILIMCI LİSTESİ VE KAYIT ALANI ---
    async function renderRegistrationArea(tourId, tourData, myUid) {
        const regArea = document.getElementById('tour-registration-area');
        if (!regArea) return;

        // Yükleniyor efekti ekleyelim (hesaplama 1-2 saniye sürebilir)
        regArea.innerHTML = '<div style="text-align:center; padding:20px; color:#999;">Oyuncu güç oranları analiz ediliyor... ⏳</div>';

        const participants = tourData.participants || [];
        const isAdmin = (tourData.creatorId === myUid);
        const isAutoTeams = tourData.regType === 'auto' && tourData.teamsGenerated;

        // --- YENİ: GERÇEK OYUN (GAME) KAZANMA YÜZDESİNİ HESAPLA ---
        const matchesSnap = await db.collection('matches').where('durum', '==', 'Tamamlandı').get();
        let gameStats = {}; 
        matchesSnap.forEach(doc => {
            const m = doc.data();
            if(!m.skor || !m.kayitliKazananID) return;
            
            const wid = m.kayitliKazananID;
            const lid = (m.oyuncu1ID === wid) ? m.oyuncu2ID : m.oyuncu1ID;
            let wP = (m.oyuncu1ID === wid) ? m.oyuncu1PartnerID : m.oyuncu2PartnerID;
            let lP = (m.oyuncu1ID === wid) ? m.oyuncu2PartnerID : m.oyuncu1PartnerID;

            const uids = [wid, lid]; if(wP) uids.push(wP); if(lP) uids.push(lP);
            uids.forEach(u => { if(u && !gameStats[u]) gameStats[u] = { w: 0, p: 0 }; });

            const s = m.skor;
            const sets = [{ w: s.s1_me, l: s.s1_opp, tb: false }, { w: s.s2_me, l: s.s2_opp, tb: false }, { w: s.s3_me, l: s.s3_opp, tb: true }];
            
            let isEntryByWinner = m.sonucuGirenID === wid;
            if (m.macTipi === 'Turnuva') isEntryByWinner = (m.oyuncu1ID === wid);
            
            sets.forEach(set => { 
                if (set.tb) return; // Tie-break dahil edilmez
                let b1 = parseInt(set.w || 0); let b2 = parseInt(set.l || 0); 
                if(b1 + b2 > 0) { 
                    let winG = isEntryByWinner ? b1 : b2; let losG = isEntryByWinner ? b2 : b1;
                    if(wid) { gameStats[wid].w += winG; gameStats[wid].p += (winG + losG); }
                    if(wP) { gameStats[wP].w += winG; gameStats[wP].p += (winG + losG); }
                    if(lid) { gameStats[lid].w += losG; gameStats[lid].p += (winG + losG); }
                    if(lP) { gameStats[lP].w += losG; gameStats[lP].p += (winG + losG); }
                } 
            });
        });
        
        const getGameWinRate = (uid) => { 
            if(!uid || !gameStats[uid] || gameStats[uid].p === 0) return 0; 
            return Math.round((gameStats[uid].w / gameStats[uid].p) * 100); 
        };
        // ---------------------------------------------------------
        
        let html = `
            <div style="text-align:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                <p style="margin:5px 0;"><strong>Format:</strong> ${tourData.format} | <strong>Ücret:</strong> ${tourData.fee} Puan</p>
            </div>
            <h4 style="margin-top:0; border:none; font-size:1.1em; color:#0d47a1;">
                ${isAutoTeams ? '🤝 Sistem Tarafından Kurulan Takımlar' : '👥 Katılımcı Listesi'} (${participants.length})
            </h4>
        `;

        if (participants.length === 0) {
            html += `<p style="text-align:center; color:#999; font-size:0.9em; padding:10px;">Henüz kayıtlı oyuncu yok.</p>`;
        } else {
            html += `<div class="tour-participants-list" style="margin-bottom:20px; max-height:350px; overflow-y:auto; padding-right:5px;">`;
            
            participants.forEach((p, index) => {
                const u1 = userMap[p.p1];
                const u2 = p.p2 ? userMap[p.p2] : null;
                const p1Name = u1?.isim || 'Bilinmeyen';
                const p2Name = u2 ? u2.isim : '';
                
                let displayHTML = '';
                
                // TAKIMLAR KURULDUYSA ÖZEL GÖRÜNÜM
                if (isAutoTeams) {
                    const teamMetric = p.points !== undefined ? `%${p.points} Güç` : 'Belirsiz';
                    displayHTML = `
                        <div style="flex:1;">
                            <div style="font-size:0.95em; font-weight:700; color:#333; margin-bottom:3px;">Takım ${index + 1}</div>
                            <div style="font-size:0.85em; color:#555;">🎾 ${p1Name}</div>
                            <div style="font-size:0.85em; color:#555;">🎾 ${p2Name}</div>
                        </div>
                        <div style="text-align:right;">
                            <span style="background:#e3f2fd; color:#0d47a1; padding:4px 8px; border-radius:12px; font-size:0.8em; font-weight:bold;">${teamMetric}</span>
                        </div>
                    `;
                } 
                // NORMAL/BİREYSEL KAYIT GÖRÜNÜMÜ
                else {
                    const displayName = p.p2 ? `${p1Name} & ${p2Name}` : p1Name;
                    
                    const r1 = getGameWinRate(p.p1);
                    let rateText = "";
                    if (p.p2) {
                        const r2 = getGameWinRate(p.p2);
                        rateText = `%${Math.round((r1 + r2) / 2)} Ort. Güç`;
                    } else {
                        rateText = `%${r1} Güç`;
                    }

                    displayHTML = `
                        <div style="flex:1; font-size:0.9em; font-weight:600; color:#444;">${index + 1}. ${displayName}</div>
                        <div style="font-size:0.85em; font-weight:bold; color:#0d47a1; background:#e3f2fd; padding:3px 8px; border-radius:10px;">${rateText}</div>
                    `;
                }

                html += `
                    <div class="modern-list-item" style="padding:12px; margin-bottom:8px; border-left:4px solid ${isAutoTeams ? '#28a745' : '#c06035'}; display:flex; justify-content:space-between; align-items:center; background:#f8f9fa;">
                        ${displayHTML}
                        ${isAdmin && !isAutoTeams ? `<button onclick="adminDeleteParticipant('${tourId}', ${index})" style="width:auto; background:none; color:#dc3545; margin:0 0 0 10px; padding:5px; box-shadow:none; font-size:1.2em;">🗑️</button>` : ''}
                    </div>`;
            });
            html += `</div>`;
        }

        const myRegistration = participants.find(p => p.p1 === myUid || p.p2 === myUid);

        if (tourData.status !== 'Kayıt') {
            html += `<div style="background:#fff3cd; padding:10px; border-radius:8px; text-align:center; color:#856404; font-weight:bold;">🔒 Kayıtlar Kapandı</div>`;
        } else if (myRegistration) {
            html += `
                <div style="background:#e8f5e9; padding:15px; border-radius:12px; text-align:center; border:1px solid #c3e6cb;">
                    <p style="color:#28a745; font-weight:bold; margin-bottom:10px;">✅ Turnuvaya Kayıtlısınız</p>
                    <button onclick="cancelTournamentRegistration('${tourId}', '${myRegistration.p1}', '${myRegistration.p2}')" class="btn-main" style="background:#dc3545; width:auto; padding:8px 20px;">Kaydı İptal Et ❌</button>
                </div>`;
        } else {
            let partnerSelectHTML = '';
            if (!(tourData.format || '').includes('Tekler') && tourData.regType !== 'auto') {
                partnerSelectHTML = `<label class="input-label" style="color:#c06035; font-weight:bold;">Takım Arkadaşını Seç (Partner)</label><select id="tour-partner-select" style="margin-bottom:15px;"><option value="">Lütfen Bir Partner Seçin</option></select>`;
            }
            html += `<div style="background:#f8f9fa; padding:15px; border-radius:12px; border:1px solid #eee;">${partnerSelectHTML}<button id="btn-join-tour" class="btn-save" style="background:#28a745; margin-top:5px;">Turnuvaya Katıl 🎾</button></div>`;
        }

        regArea.innerHTML = html;

        if (tourData.status === 'Kayıt' && !myRegistration) {
            if (!(tourData.format || '').includes('Tekler') && tourData.regType !== 'auto') {
                const selectEl = document.getElementById('tour-partner-select');
                if (selectEl) {
                    Object.values(userMap).forEach(player => {
                        const isOtherRegistered = participants.some(p => p.p1 === player.uid || p.p2 === player.uid);
                        if (player.uid !== myUid && !isOtherRegistered) {
                            const opt = document.createElement('option'); opt.value = player.uid; opt.textContent = player.isim || player.email; selectEl.appendChild(opt);
                        }
                    });
                }
            }
            const joinBtn = document.getElementById('btn-join-tour');
            if (joinBtn) joinBtn.onclick = () => joinTournament(tourId, tourData, myUid);
        }
    }

    // --- YENİ: LİG FİKSTÜRÜ VE HAFTALIK KARIŞIK SİSTEM MOTORU ---
    window.generateLeagueFixture = async function(tourId) {
        if (!confirm("Lig fikstürü oluşturulacak ve maçlar başlayacak. Onaylıyor musunuz?")) return;
        try {
            const docRef = db.collection('tournaments').doc(tourId);
            const tourData = (await docRef.get()).data();
            let players = tourData.participants || [];
            
            const isChanging = tourData.leagueTeamType === 'changing';
            let weeks = 1;
            
            if (tourData.leagueDuration === 'all_play_all') {
                let n = players.length;
                if (n % 2 !== 0) n++; // BAY için
                weeks = n - 1;
            } else {
                weeks = tourData.leagueWeeks || 1;
            }

            let rounds = [];

            if (isChanging) {
                // SİSTEM 1: HAFTALIK YENİDEN KARIŞTIRILAN (MIX-IN) LİG
                let individuals = [];
                players.forEach(p => {
                    if (p.p1) individuals.push({ p1: p.p1 });
                    if (p.p2) individuals.push({ p1: p.p2 });
                });

                for(let w = 0; w < weeks; w++) {
                    let roundMatches = [];
                    let shuffled = [...individuals].sort(() => 0.5 - Math.random());
                    
                    if (tourData.format === 'Mix') {
                        let males = shuffled.filter(p => userMap[p.p1]?.cinsiyet !== 'Kadın');
                        let females = shuffled.filter(p => userMap[p.p1]?.cinsiyet === 'Kadın');
                        let teams = [];
                        for(let i=0; i<Math.min(males.length, females.length); i++) teams.push({p1: males[i].p1, p2: females[i].p1});
                        for(let i=0; i<teams.length; i+=2) {
                            if(i+1 < teams.length) roundMatches.push({p1: teams[i], p2: teams[i+1], winner: null, score: null});
                        }
                    } else { // Double Erkek / Kadın
                        let teams = [];
                        for(let i=0; i<shuffled.length; i+=2) {
                            if(i+1 < shuffled.length) teams.push({p1: shuffled[i].p1, p2: shuffled[i+1].p1});
                        }
                        for(let i=0; i<teams.length; i+=2) {
                            if(i+1 < teams.length) roundMatches.push({p1: teams[i], p2: teams[i+1], winner: null, score: null});
                        }
                    }
                    rounds.push({ roundName: (w+1) + ". Hafta", matches: roundMatches });
                }
            } else {
                // SİSTEM 2: KLASİK LİG (SABİT TAKIMLAR VEYA TEKLER) - Berger Tablosu
                let n = players.length;
                let isOdd = n % 2 !== 0;
                let rrPlayers = [...players];
                if (isOdd) { rrPlayers.push({ isBye: true }); n++; }
                
                let half = n / 2;
                
                for (let w = 0; w < weeks; w++) {
                    let roundMatches = [];
                    for (let i = 0; i < half; i++) {
                        let p1 = rrPlayers[i]; let p2 = rrPlayers[n - 1 - i];
                        if (!p1.isBye && !p2.isBye) {
                            roundMatches.push({p1: p1, p2: p2, winner: null, score: null});
                        }
                    }
                    rounds.push({ roundName: (w+1) + ". Hafta", matches: roundMatches });
                    rrPlayers.splice(1, 0, rrPlayers.pop()); 
                }
            }
            
            for (let r = 0; r < rounds.length; r++) {
                for (let m = 0; m < rounds[r].matches.length; m++) {
                    let match = rounds[r].matches[m];
                    const mId = await window.createTournamentMatchDoc(tourId, match.p1, match.p2, rounds[r].roundName, `L${r}_M${m}`);
                    match.firestoreMatchId = mId;
                    match.matchId = `L${r}_M${m}`;
                }
            }

            await docRef.update({ status: 'Devam Ediyor', stage: 'League', bracket: rounds });
            alert("Lig fikstürü başarıyla oluşturuldu ve maçlar başladı! 📅");
            openTournamentDetail(tourId, (await docRef.get()).data());
            
        } catch(e) { alert("Lig oluşturma hatası: " + e.message); }
    };
  
}); // DOMContentLoaded SONU