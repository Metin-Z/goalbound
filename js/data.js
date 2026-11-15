/* ===================== Futbol Kariyeri — data (leagues, clubs, names) =====================
   Edit freely: each club is [name, short code, primary colour, secondary colour, strength 50-95].
   Short code '' = derived automatically from the name (FBT.abbr), so renaming a club updates its code everywhere; put 2-4 letters to override.
   League and cup names are generic (no real competition brands).
   Süper Lig and the five v14 leagues (sc, at, ch, gr, dk) = 2026-27 season clubs. Other leagues use their 2025-26 line-ups; update here when needed.
   Club names are parodies (no real club names). Player names are generated per career from per-nationality pools (see FB_NAMES); a club may also get an explicit roster:
   FB_ROSTERS['tr:0'] = ['Kaleci', 'Sol bek', 'Stoper', 'Stoper', 'Sağ bek', 'Orta saha', 'Orta saha', 'Orta saha', 'Sol kanat', 'Forvet', 'Sağ kanat'] (11 names, GK..RW order)  (optional, overrides generation). */
const FB_LEAGUES = [
  { id: 'tr', name: 'Süper Lig', country: 'Türkiye', flag: '🇹🇷', nat: 'tr', dom: .55, euro: [2, 2, 1], teams: [
    ['G.Saray', '', '#a90432', '#fdb912', 82], ['FenerB', '', '#14205c', '#f5d400', 81], ['B.Taş', '', '#111111', '#ffffff', 78],
    ['Trabzon Fırtına', '', '#7a1f3d', '#4fa3d9', 75], ['Başak İstanbul', '', '#f05a28', '#0b2240', 72], ['Samsun Kırmızı', '', '#e30613', '#ffffff', 72],
    ['İzmir Göztaş', '', '#f6c400', '#d0021b', 71], ['Eyüp Sultan SK', '', '#6a1b9a', '#f6c400', 68], ['Haliç Paşa', '', '#1d3d8f', '#ffffff', 68],
    ['Kocaeli Körfez', '', '#0a7a3b', '#111111', 67], ['Ankara Gençler', '', '#d0021b', '#111111', 66], ['Alanya Güneş', '', '#f47b20', '#0b8a3e', 68],
    ['Konya Yeşilbeyaz', '', '#0a7a3b', '#ffffff', 67], ['Antep Şahinleri', '', '#c8102e', '#111111', 67], ['Rize Çay SK', '', '#0b8a3e', '#1d3d8f', 67],
    ['Erzurum Dadaş', '', '#1d4f9e', '#ffffff', 64], ['Diyar Amed', '', '#0b8a3e', '#d0021b', 63], ['Çorum Leblebi FK', '', '#b5121b', '#111111', 63]] },
  { id: 'en', name: 'Premier Division', country: 'İngiltere', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', nat: 'en', dom: .35, euro: [4, 2, 1], teams: [
    ['Arsenol', '', '#ef0107', '#ffffff', 89], ['Aston Vela', '', '#670e36', '#95bfe5', 82], ['Boremouth', '', '#da291c', '#111111', 76], ['Brentfort', '', '#e30613', '#ffffff', 76],
    ['Brightown', '', '#0057b8', '#ffffff', 79], ['Burnlee', '', '#6c1d45', '#99d6ea', 72], ['Chelsy', '', '#034694', '#ffffff', 86], ['Crystal Castle', '', '#1b458f', '#c4122e', 78],
    ['Evertown', '', '#003399', '#ffffff', 75], ['Fullham', '', '#f2f2f2', '#111111', 76], ['Leeds Unity', '', '#f2f2f2', '#1d428a', 73], ['Liverpole', '', '#c8102e', '#ffffff', 90],
    ['Manchester Sky', '', '#6cabdd', '#ffffff', 89], ['Manchester Red', '', '#da291c', '#fbe122', 83], ['Newcastle Magpies', '', '#241f20', '#ffffff', 84], ['Nottingham Woods', '', '#dd0000', '#ffffff', 77],
    ['Sunderlund', '', '#eb172b', '#ffffff', 72], ['Tottenhem', '', '#f2f2f2', '#132257', 82], ['West Hammers', '', '#7a263a', '#1bb1e7', 76], ['Wolverton', '', '#fdb913', '#231f20', 74]] },
  { id: 'es', name: 'Primera División', country: 'İspanya', flag: '🇪🇸', nat: 'es', dom: .6, euro: [4, 2, 1], teams: [
    ['R.Madrid', '', '#f2f2f2', '#febe10', 91], ['Barsalona', '', '#a50044', '#004d98', 90], ['A.Madrid', '', '#cb3524', '#ffffff', 85], ['Bilbao Leones', '', '#ee2523', '#ffffff', 80],
    ['Villa Amarilla', '', '#ffe667', '#005187', 80], ['Betico Sevilla', '', '#00954c', '#ffffff', 79], ['Donostia Real', '', '#0067b1', '#ffffff', 78], ['Vigo Celestes', '', '#8ac3ee', '#ffffff', 75],
    ['Sevila', '', '#f2f2f2', '#d6001c', 76], ['Valensia', '', '#f2f2f2', '#111111', 75], ['Pamplona Rojillos', '', '#d91a21', '#0a346f', 74], ['Getafé', '', '#005999', '#ffffff', 73],
    ['Jirona', '', '#cd2534', '#ffffff', 75], ['Vallecas Rayo', '', '#f2f2f2', '#e53027', 73], ['Españolo', '', '#007fc8', '#ffffff', 73], ['Majorca Islas', '', '#e20613', '#111111', 73],
    ['Vitoria Babazorros', '', '#009ad7', '#ffffff', 72], ['Levanté', '', '#00519e', '#b4053f', 70], ['Elx Franjiverdes', '', '#f2f2f2', '#05642c', 70], ['Oviedo Carbayones', '', '#0057a5', '#ffffff', 69]] },
  { id: 'it', name: 'Serie Uno', country: 'İtalya', flag: '🇮🇹', nat: 'it', dom: .45, euro: [4, 2, 1], teams: [
    ['Internazionali', '', '#0068a8', '#111111', 88], ['A.Milano', '', '#fb090b', '#111111', 85], ['Juventa', '', '#f2f2f2', '#111111', 85], ['Napule', '', '#12a0d7', '#ffffff', 86],
    ['Bergamo Dea', '', '#1e71b8', '#111111', 83], ['Romulus', '', '#8e1f2f', '#f0bc42', 82], ['Aquile Roma', '', '#87d8f7', '#ffffff', 80], ['Fiorenza', '', '#482e92', '#ffffff', 79],
    ['Bolonya', '', '#a21c26', '#1a2f48', 79], ['Toro Granata', '', '#881f19', '#ffffff', 75], ['Lago Como', '', '#0a4595', '#ffffff', 77], ['Udinesi', '', '#f2f2f2', '#111111', 74],
    ['Genova Grifone', '', '#a7193b', '#0e2b5c', 73], ['Casteddu Sardegna', '', '#b01028', '#0f2c5c', 72], ['Salento Lupi', '', '#ffd700', '#d50000', 71], ['Parmigiano', '', '#ffd200', '#1e3d8f', 72],
    ['Verona Scaligeri', '', '#003c82', '#ffd200', 71], ['Sassolino', '', '#00a752', '#111111', 72], ['Cremona Grigiorossi', '', '#c8102e', '#9e9e9e', 70], ['Pisa Torre', '', '#0a1f44', '#111111', 69]] },
  { id: 'fr', name: 'Division Une', country: 'Fransa', flag: '🇫🇷', nat: 'fr', dom: .45, euro: [3, 2, 1], teams: [
    ['Paris Saint-Gérard', '', '#004170', '#da291c', 90], ['Marsilya', '', '#f2f2f2', '#2faee0', 83], ['Monako', '', '#e51b22', '#ffffff', 82], ['Lil Dogues', '', '#e01e13', '#20325f', 81],
    ['Olympique Lion', '', '#f2f2f2', '#da0812', 81], ['Niçois', '', '#c8102e', '#111111', 78], ['Lents', '', '#ffd400', '#e2001a', 79], ['Renn', '', '#e13327', '#111111', 78],
    ['Strasburg', '', '#009fe3', '#ffffff', 77], ['Tuluz', '', '#5e2a84', '#ffffff', 75], ['Brest Pirates', '', '#e30613', '#ffffff', 75], ['Nantais', '', '#fcd405', '#00a650', 73],
    ['Oxerre', '', '#f2f2f2', '#005baa', 72], ['Anjou SCO', '', '#111111', '#ffffff', 71], ['Le Havr', '', '#0f2d52', '#8dc8e8', 71], ['L\'Orient', '', '#f58113', '#111111', 71],
    ['Mez', '', '#7c0a2b', '#ffffff', 70], ['Paris Club', '', '#0a2240', '#ffffff', 72]] },
  { id: 'de', name: 'Erste Liga', country: 'Almanya', flag: '🇩🇪', nat: 'de', dom: .45, euro: [4, 2, 1], teams: [
    ['B.Munih', '', '#dc052d', '#ffffff', 91], ['B.Dortmunt', '', '#fde100', '#111111', 85], ['Leverküzen', '', '#e32221', '#111111', 84], ['Leipzig Enerji', '', '#f2f2f2', '#dd0741', 83],
    ['Stuttgarter Löwen', '', '#f2f2f2', '#e32219', 81], ['Frankfurt Adler', '', '#111111', '#e1000f', 81], ['Freiburg Breisgau', '', '#f2f2f2', '#e2001a', 78], ['Volksburg', '', '#65b32e', '#ffffff', 77],
    ['Gladbach Fohlen', '', '#f2f2f2', '#111111', 77], ['Hoffenhayn', '', '#1961b5', '#ffffff', 77], ['Mainz Karneval', '', '#c3141e', '#ffffff', 76], ['Werda Bremen', '', '#1d9053', '#ffffff', 76],
    ['Berlin Eisern', '', '#eb1923', '#ffffff', 76], ['Augsburg Fugger', '', '#ba3733', '#46714d', 74], ['Colonia Geißbock', '', '#f2f2f2', '#ed1c24', 74], ['Hamburg Dinos', '', '#f2f2f2', '#0a3f86', 74],
    ['St. Paulus', '', '#6c4a32', '#ffffff', 72], ['Heidenhaym', '', '#e2001a', '#003b79', 72]] },
  { id: 'pt', name: 'Primeira Divisão', country: 'Portekiz', flag: '🇵🇹', nat: 'pt', dom: .4, euro: [2, 2, 1], teams: [
    ['Benfika', '', '#e83030', '#ffffff', 84], ['Portu Dragões', '', '#00428c', '#ffffff', 84], ['Lisboa Leões', '', '#008057', '#ffffff', 85], ['Braga Arsenalistas', '', '#e20613', '#ffffff', 79],
    ['Guimarães Conquistadores', '', '#f2f2f2', '#111111', 75], ['Famalikão', '', '#002c5f', '#ffffff', 73], ['Barcelos Galos', '', '#e30613', '#1d428a', 72], ['Moreira Cónegos', '', '#00843d', '#ffffff', 71],
    ['Rio Ávila', '', '#00843d', '#ffffff', 70], ['Estoril Canarinhos', '', '#ffd200', '#0057a8', 71], ['Casa Pía', '', '#111111', '#ffffff', 69], ['Arouka', '', '#ffd200', '#0057a8', 70],
    ['Santa Klara', '', '#e30613', '#ffffff', 70], ['Madeira Nacional', '', '#111111', '#ffffff', 69], ['Estrela Amador', '', '#e30613', '#00843d', 68], ['Alverka', '', '#e30613', '#ffffff', 67],
    ['Tondella', '', '#00843d', '#ffd200', 67], ['Vila das Aves', '', '#c8102e', '#ffffff', 67]] },
  { id: 'nl', name: 'Hoofdklasse', country: 'Hollanda', flag: '🇳🇱', nat: 'nl', dom: .55, euro: [2, 2, 1], teams: [
    ['Eindhoven Lampen', '', '#ed1c24', '#ffffff', 82], ['Ajaxx', '', '#f2f2f2', '#d2122e', 81], ['Feijenoord', '', '#ff0000', '#ffffff', 81], ['Alkmaar Kaas', '', '#e30613', '#ffffff', 78],
    ['Enschede Tukkers', '', '#e30613', '#ffffff', 76], ['Utreg', '', '#e30613', '#ffffff', 75], ['Nijmegen Keizer', '', '#e30613', '#00843d', 73], ['Heerenvein', '', '#0057a8', '#ffffff', 72],
    ['Rotterdam Spartaan', '', '#e30613', '#ffffff', 71], ['Deventer Arenden', '', '#e30613', '#ffd200', 72], ['Grunn', '', '#00843d', '#ffffff', 71], ['Sittard Fortune', '', '#ffd200', '#00843d', 70],
    ['Zwolle Blauwvingers', '', '#0057a8', '#ffffff', 70], ['Almelo Herakles', '', '#111111', '#ffffff', 69], ['Breda NAK', '', '#ffd200', '#111111', 69], ['Kralingen Excelsius', '', '#e30613', '#111111', 68],
    ['Telestar', '', '#f2f2f2', '#e30613', 67], ['Volendam Palingen', '', '#f58113', '#111111', 67]] },
  { id: 'be', name: 'Eerste Klasse', country: 'Belçika', flag: '🇧🇪', nat: 'be', dom: .4, euro: [1, 2, 1], teams: [
    ['Brugge Blauw-Zwart', '', '#0057a8', '#111111', 80], ['Anderleht', '', '#5b2a86', '#ffffff', 77], ['Saint-Gilles Union', '', '#ffd200', '#0057a8', 78], ['Limburg Smurfen', '', '#0057a8', '#ffffff', 76],
    ['Buffalo Gent', '', '#0057a8', '#ffffff', 75], ['Antwerpen Great Old', '', '#e30613', '#ffffff', 75], ['Liège Standart', '', '#e30613', '#ffffff', 73], ['Malinwa', '', '#ffd200', '#e30613', 72],
    ['Westerlo Kemphanen', '', '#ffd200', '#0057a8', 71], ['Charleroi Zèbres', '', '#111111', '#ffffff', 71], ['Brugge Cercle Groen', '', '#00843d', '#111111', 70], ['Oud-Leuven', '', '#e30613', '#ffffff', 70],
    ['Truiden Kanaries', '', '#ffd200', '#0057a8', 70], ['Denderleeuw', '', '#0057a8', '#ffffff', 68], ['Essevee', '', '#e30613', '#ffffff', 68], ['Louvière Loups', '', '#00843d', '#ffffff', 67]] },
  { id: 'no', name: 'Norsk Elite', country: 'Norveç', flag: '🇳🇴', nat: 'no', dom: .7, euro: [1, 1, 1], teams: [
    ['Bodø Glimmer', '', '#ffd200', '#111111', 78], ['Molde Fjord', '', '#0057a8', '#ffffff', 72], ['Rosenburg', '', '#f2f2f2', '#111111', 72], ['Bergen Branners', '', '#e30613', '#ffffff', 73],
    ['Stavanger Vikings', '', '#0057a8', '#ffffff', 71], ['Tromsø Nordlys', '', '#e30613', '#ffffff', 69], ['Sarpsborg Ståle', '', '#0057a8', '#ffffff', 68], ['Fredrikstat', '', '#e30613', '#ffffff', 68],
    ['Oslo Ungdom', '', '#0057a8', '#ffffff', 66], ['Sandefjord Hval', '', '#0057a8', '#ffffff', 66], ['Godset Drammen', '', '#0057a8', '#ffffff', 66], ['Hamar Kameratene', '', '#00843d', '#ffffff', 65],
    ['Kristiansund Klippfisk', '', '#0057a8', '#ffffff', 65], ['Haugesund Måker', '', '#111111', '#ffffff', 64], ['Oslo Bohemen', '', '#0a2240', '#e30613', 68], ['Bryne Jæren', '', '#e30613', '#ffffff', 64]] },
  { id: 'ru', name: 'Vysshaya Liga', country: 'Rusya', flag: '🇷🇺', nat: 'ru', dom: .7, euro: [0, 0, 0], teams: [
    ['Zenith Piter', '', '#0094d8', '#ffffff', 80], ['Kuban Boğaları', '', '#111111', '#00843d', 78], ['Spartaküs Moskova', '', '#e30613', '#ffffff', 76], ['Moskova Ordu', '', '#0057a8', '#e30613', 76],
    ['Moskova Demiryolu', '', '#e30613', '#00843d', 75], ['Moskova Dinamik', '', '#0057a8', '#ffffff', 75], ['Rostov Don', '', '#ffd200', '#0057a8', 71], ['Kazan Yakut', '', '#7a1f3d', '#00843d', 71],
    ['Grozni Terek', '', '#00843d', '#ffffff', 69], ['Samara Kanatları', '', '#0057a8', '#ffffff', 69], ['Mahaçkale Dağlılar', '', '#0057a8', '#ffffff', 68], ['Orenburg Gaz', '', '#0057a8', '#ffffff', 68],
    ['Nijni Novgorod', '', '#111111', '#ffffff', 67], ['Kaliningrad Baltık', '', '#0057a8', '#ffffff', 68], ['Tolyatti Otomobil', '', '#111111', '#ffffff', 66], ['Soçi Sahil', '', '#0057a8', '#ffd200', 66]] },
  { id: 'az', name: 'Yüksək Liqa', country: 'Azerbaycan', flag: '🇦🇿', nat: 'az', dom: .6, euro: [1, 1, 1], teams: [
    ['Ağdam Atları', '', '#111111', '#ffffff', 76], ['Bakı Neftçilər', '', '#111111', '#f2f2f2', 68], ['Bakı Sabahı', '', '#0057a8', '#ffffff', 68], ['Zirə Kəndi', '', '#0057a8', '#ffd200', 66],
    ['Tovuz Turanlılar', '', '#e30613', '#ffffff', 65], ['Sumqayıt Kimya', '', '#0057a8', '#ffffff', 64], ['Gəncə Kəpəzi', '', '#00843d', '#ffffff', 63], ['Naxçıvan Araz', '', '#e30613', '#ffffff', 64],
    ['Səbail Liman', '', '#0057a8', '#ffffff', 62], ['Qəbələ Dağlar', '', '#e30613', '#ffffff', 63], ['Şamaxı Şahlar', '', '#00843d', '#ffffff', 62], ['İmişli Pambıq', '', '#c8102e', '#ffffff', 61]] },
  // v14: five more leagues — club line-ups are the 2026-27 seasons (checked Nov 2026); colours are the clubs' traditional kit colours, strength is a game estimate
  { id: 'sc', name: 'Scottish Top Flight', country: 'İskoçya', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', nat: 'sc', dom: .55, euro: [1, 1, 1], teams: [
    ['Glasgow Kelt', '', '#018749', '#ffffff', 79], ['Glasgow Gers', '', '#1b458f', '#ffffff', 77], ['Heart of Lothian', '', '#7a1f3d', '#ffffff', 70], ['Granite City', '', '#e30613', '#ffffff', 69],
    ['Leith Hibees', '', '#00843d', '#ffffff', 68], ['Motherwel Steelmen', '', '#ffb612', '#7a1f3d', 67], ['Dundee Terrors', '', '#f58113', '#111111', 66], ['Ayrshire Killie', '', '#0057a8', '#ffffff', 64],
    ['Paisley Buddies', '', '#111111', '#ffffff', 64], ['Dundee Dark Blues', '', '#0a2240', '#ffffff', 63], ['Falkirk Bairns', '', '#0a2240', '#e30613', 63], ['Perth Saints', '', '#0057a8', '#ffffff', 62]] },
  { id: 'at', name: 'Österreich Liga', country: 'Avusturya', flag: '🇦🇹', nat: 'at', dom: .6, euro: [1, 1, 1], teams: [
    ['Salzburg Mozart', '', '#f2f2f2', '#d6001c', 78], ['Graz Sturmvogel', '', '#111111', '#ffffff', 75], ['Wien Grün-Weiß', '', '#00843d', '#ffffff', 72], ['Wien Veilchen', '', '#5b2a86', '#ffffff', 71],
    ['Linz Athletik', '', '#111111', '#f2f2f2', 71], ['Lavanttal Wölfe', '', '#111111', '#f2f2f2', 69], ['Hartberg Steiermark', '', '#0057a8', '#ffffff', 66], ['Graz Rotjacken', '', '#e30613', '#ffffff', 64],
    ['Tirol Wattens', '', '#00843d', '#ffffff', 64], ['Innviertel Ried', '', '#111111', '#00843d', 64], ['Altach Rheindorf', '', '#111111', '#ffd200', 64], ['Lustenau Grün', '', '#00843d', '#ffffff', 63]] },
  { id: 'ch', name: 'Schweizer Liga', country: 'İsviçre', flag: '🇨🇭', nat: 'ch', dom: .5, euro: [1, 1, 1], teams: [
    ['Bern Jungs', '', '#ffd200', '#111111', 76], ['Basel Bebbi', '', '#e30613', '#0057a8', 75], ['Lugano Bianconeri', '', '#111111', '#ffffff', 72], ['Genf Grenats', '', '#7a1f3d', '#ffffff', 71],
    ['Thun Oberland', '', '#e30613', '#ffffff', 70], ['St. Gallus', '', '#00843d', '#ffffff', 70], ['Luzern Leuchten', '', '#0057a8', '#ffffff', 69], ['Zürih Stadt', '', '#f2f2f2', '#0057a8', 69],
    ['Sion Valais', '', '#f2f2f2', '#e30613', 68], ['Lausanne Léman', '', '#0057a8', '#ffffff', 68], ['Zürih Çekirgeleri', '', '#0057a8', '#f2f2f2', 67], ['Vaduz Prens', '', '#e30613', '#0057a8', 64]] },
  { id: 'gr', name: 'Ethniki A', country: 'Yunanistan', flag: '🇬🇷', nat: 'gr', dom: .5, euro: [1, 1, 1], teams: [
    ['Pire Olimpos', '', '#e30613', '#ffffff', 80], ['Selanik Çifte Kartal', '', '#111111', '#ffffff', 78], ['Atina Bizans', '', '#ffd200', '#111111', 78], ['Atina Yonca', '', '#00843d', '#ffffff', 77],
    ['Selanik Ares', '', '#ffd200', '#111111', 70], ['Kandiye OFİ', '', '#111111', '#ffffff', 68], ['Trípoli Asteri', '', '#ffd200', '#0057a8', 66], ['Peristeri Korkusuz', '', '#0057a8', '#ffffff', 66],
    ['Volos Argonaut', '', '#0057a8', '#e30613', 65], ['Livadia', '', '#00843d', '#ffffff', 65], ['Selanik Herakles', '', '#0057a8', '#ffffff', 64], ['Agrinio Etolya', '', '#ffd200', '#0057a8', 64],
    ['Kifisia Kuzey', '', '#0057a8', '#ffffff', 63], ['Kalamata Zeytin', '', '#111111', '#ffffff', 63]] },
  { id: 'dk', name: 'Danske Liga', country: 'Danimarka', flag: '🇩🇰', nat: 'dk', dom: .55, euro: [1, 1, 1], teams: [
    ['Kopenhag Byens', '', '#f2f2f2', '#0057a8', 77], ['Herning Ulvene', '', '#111111', '#e30613', 77], ['Brøndby Vestegn', '', '#ffd200', '#0057a8', 73], ['Farum Nord', '', '#e30613', '#ffd200', 72],
    ['Aarhus Hvide', '', '#f2f2f2', '#0a2240', 72], ['Randers Kronjylland', '', '#0057a8', '#ffffff', 68], ['Silkeborg Søer', '', '#e30613', '#ffffff', 68], ['Viborg Grønne', '', '#00843d', '#ffffff', 67],
    ['Odense Bold', '', '#0057a8', '#ffffff', 67], ['Haderslev Sønder', '', '#0094d8', '#ffffff', 65], ['Lyngby Fjord', '', '#0057a8', '#ffffff', 65], ['Horsens Heste', '', '#ffd200', '#111111', 64]] }
];
// European cups: [name, short, colour]
const FB_CUPS = { ucl: ['Avrupa Şampiyonlar Kupası', 'ŞK', '#0b1f5c'], uel: ['Avrupa Kupası', 'AK', '#f37021'], uecl: ['Avrupa Konferans Kupası', 'KK', '#16a34a'] };
// Optional real rosters can be dropped in here later (club id → names, GK first).
const FB_ROSTERS = {};
// Name pools per nationality: [first names CSV, surnames CSV]. Parody-flavoured: they nod to famous players without being real people.
// To extend: append names to a list, or add a new code here + in FB_NAT (flag) and optionally FB_FOREIGN (transfer weight).
const FB_NAMES = {
  tr: ['Hakan,Tanju,Rıdvan,Lefter,Metin,Feyyaz,Sergen,Tugay,Rüştü,Alpay,Okan,Arda,Emre,Burak,Kerem,Ümit,Oğuz,Selçuk,Nihat,Tuncay,Hami,Volkan,Gökhan,Cenk,Semih,Arif,Mert,Barış,Ferdi,Kaan,Uğur,Yusuf', 'Şükürer,Çolakçı,Turanlı,Reçberli,Dilmenli,Uçaroğlu,Belözlü,Kahveci,Topçuoğlu,Golcüoğlu,Kafadar,Ofsaytçı,Yıldırımcı,Mandıralı,Tekmeci,Paslı,Kaya,Demir,Şahin,Çelik,Aydın,Öztürk,Arslan,Doğan,Kılıç,Aslan,Koç,Kurt,Kalecioğlu,Akgün,Karaman,Fırtınalı'],
  en: ['Harry,Wayne,Stevie,Frankie,Gazza,Becks,Rio,Jamie,Jack,Marcus,Declan,Bukayo,Jude,Phil,Kyle,Cole,Reece,Jordan,Ollie,Callum,Raheem,Peter,Teddy,Gary,Alan,Ashley,Jesse,Trent', 'Kane-Hill,Rooneyford,Gerrardson,Lampardo,Beckingham,Ferdinandez,Vardley,Shearwood,Linekin,Owenton,Scholesby,Rashfield,Saka-Smith,Bellingworth,Foden-Ward,Walkerton,Smith,Jonesy,Taylor,Brown,Wright,Thompson,Evans,Hughes,Clarkeson,Turner,Cooper,Bailey'],
  es: ['Iker,Xavi,Andrés,Sergio,Fernando,Raúl,David,Carles,Pedri,Gavi,Álvaro,Dani,Fermín,Unai,Rodrigo,Nico,Lamine,Marcos,Pablo,Hugo,Rubén,Borja,Jesús,Óscar,Mikel,Aitor', 'Casillado,Hernández-Xa,Iniestra,Ramosa,Torreón,Villano,Puyolo,Busquetez,Pedrero,Alonsito,Moratilla,Olmedo,Yamalero,Galindo,Martínez,López,Sánchez,Pérez,Gomera,Fernández,Díaz,Morenito,Romero,Navarro,Ruiz,Gil,Molina,Castro'],
  it: ['Francesco,Paolo,Gigi,Andrea,Alessandro,Roberto,Fabio,Filippo,Christian,Daniele,Gianluigi,Marco,Lorenzo,Federico,Nicolò,Ciro,Sandro,Giacomo,Mattia,Riccardo,Giorgio,Davide,Luca,Simone,Pietro,Tommaso', 'Tottini,Maldinetti,Buffone,Pirlotti,Del Pierino,Baggino,Cannavaro-Ricci,Inzaghetti,Vierotti,De Rossetti,Donnarummo,Barellino,Chiesetta,Immobilone,Rossi,Russo,Ferrari,Esposito,Bianchi,Romano,Colombo,Ricci,Marino,Greco,Gallo,Contini,Mancini,Moretti'],
  fr: ['Zinédine,Thierry,Kylian,Antoine,Franck,Patrick,Didier,Karim,Ousmane,Hugo,Lilian,Robert,Paul,Aurélien,Théo,Jules,Warren,Bradley,Randal,Adrien,Rayan,Désiré,Malo,Enzo,Mattéo,Corentin', 'Zidano,Henrix,Mbappard,Griezmont,Ribérot,Vieirac,Deschampy,Benzemard,Dembélot,Lloris-Petit,Thuramel,Pirès-Roux,Pogbart,Tchouaméry,Martin,Bernard,Dubois,Thomas,Petit,Durand,Leroy,Moreau,Simon,Laurent,Lefebvre,Girard,Fontaine,Rousseau'],
  de: ['Franz,Gerd,Lothar,Jürgen,Oliver,Philipp,Bastian,Thomas,Manuel,Miroslav,Toni,Mesut,Ilkay,Joshua,Jamal,Leroy,Kai,Florian,Leon,Niklas,Julian,Antonio,Robin,Mats,Timo,Lukas', 'Beckenhauer,Müllermann,Matthäuser,Klinsmeyer,Kahnert,Lahmke,Schweinsberger,Neuerhof,Kloser,Kroosmann,Özlein,Gündoğer,Kimmichel,Musialski,Wirtzinger,Havertsen,Schmidt,Schneider,Fischer,Weber,Meyer,Wagner,Becker,Schulz,Hoffmann,Lehmannsen,Richter,Wolf'],
  pt: ['Cristiano,Luís,Rui,Deco,Ricardo,Pepe,Nani,Bernardo,Bruno,Rúben,João,Diogo,Gonçalo,Rafael,Vitinha,Nuno,Francisco,Tiago,André,Pedro,Fábio,Renato,Danilo,Otávio', 'Ronaldão,Figueiredo,Costinha-Rui,Portugalo,Pepinho,Quaresmão,Silvão,Fernandinho,Félixão,Leãozinho,Dias-Neves,Brito,Santos,Ferreira,Vaz,Oliveira,Nogueira,Rodrigues,Martins,Sousa,Gomes,Lopes,Marques,Alves,Almeida,Ribeiro,Tavares,Carvalho'],
  nl: ['Johan,Marco,Ruud,Dennis,Frank,Patrick,Arjen,Robin,Wesley,Clarence,Edwin,Virgil,Frenkie,Memphis,Cody,Xavi,Denzel,Teun,Jurriën,Matthijs,Ryan,Micky,Justin,Joey,Sem,Thijs', 'Cruijfer,Van Bastiaan,Gullitsen,Bergkampen,Rijkaardt,Kluivers,Robbenhuis,Van Persijn,Sneijders,Seedorp,Van der Zaar,Van Dijkman,De Jongh,Depaay,Gakpoort,Bakker,Visser,Smit,Meijer,de Boerderij,Mulder,de Groot,Bos,Vos,Dekker,Brouwer,de Wit,Dijkstra'],
  be: ['Kevin,Eden,Romelu,Thibaut,Vincent,Jan,Dries,Axel,Youri,Leandro,Jérémy,Charles,Arthur,Amadou,Wout,Jonas,Hans,Lucas,Thomas,Maxime,Simon,Elias', 'De Bruijner,Hazardin,Lukakon,Courtoisier,Kompanier,Vertongen-Maes,Mertensen,Witselaar,Tielemond,Trossardt,Doku-Peeters,Onanaert,Peeters,Janssens,Maes,Jacobs,Willems,Claes,Goossens,Wouters,Dubois,Lambert,Dupont,Leclercq,Vermeulen,Pauwels'],
  no: ['Erling,Martin,Ole,John,Tore,Steffen,Morten,Sander,Alexander,Kristoffer,Fredrik,Jørgen,Oscar,Leo,Antonio,Marcus,Patrick,Ola,Julian,Andreas,Aron,Henrik,Sondre,Tobias', 'Haalandsen,Ødegaardt,Solskjærli,Riiseby,Carewsen,Iversund,Flo-Berg,Sørloth-Dahl,Larsby,Hansen,Johansen,Olsen,Nilsen,Pedersund,Andersen,Kristiansen,Karlsen,Bergum,Haugland,Hagen,Eriksen,Strand,Solberg,Bakke,Lund,Moe'],
  dk: ['Peter,Michael,Brian,Christian,Kasper,Simon,Pierre-Emile,Rasmus,Mikkel,Jonas,Mathias,Frederik,Andreas,Magnus,Emil,Oliver,Victor,Jesper,Thomas,Mads,Nikolaj,Jakob,Lasse,Gustav', 'Schmeichelsen,Laudrupsen,Eriksenberg,Kjærgaardt,Højbjergen,Højlunder,Poulsby,Delaney-Holm,Nielsen,Jenssen,Hansen,Pedersen,Andersen,Kristiansson,Larsen,Sørensby,Rasmussen,Jørgsen,Madsen,Kristensen,Thomsen,Møller,Knudsen,Skovby'],
  sc: ['Kenny,Denis,Graeme,Ally,Gordon,Darren,Andy,Scott,John,Kieran,Billy,Callum,Lewis,Ryan,Liam,Ross,Craig,Euan,Fraser,Jamie,Rory,Grant,Lyndon,Connor', 'Dalglishton,Lawson,Souneston,McCoistie,Strachanan,Fletchers,Robertsonne,McTominey-Reid,Tierneyson,McGinnes,MacDonald,Campbell,Stewart,Thomson,Paterson,Murray,Reid,Frazier,McLean,Hamilton,Graham,Kerr,Wallace,Dunlop,Cameron,Burns'],
  at: ['Toni,Herbert,Hans,David,Marko,Marcel,Konrad,Christoph,Stefan,Philipp,Dominik,Valentin,Florian,Michael,Patrick,Nicolas,Romano,Kevin,Lukas,Maximilian,Alexander,Sebastian', 'Polsterer,Krankl-Huber,Prohaskar,Alabauer,Arnautović-Maier,Sabitzinger,Laimerhof,Baumgartlhuber,Gruber,Huber,Bauer,Wagner,Pichler,Steiner,Moser,Mayer,Hofer,Leitner,Berger,Fuchs,Eder,Winkler,Brunner,Egger'],
  ch: ['Granit,Xherdan,Stéphane,Alexander,Yann,Breel,Manuel,Ricardo,Fabian,Remo,Silvan,Ruben,Noah,Dan,Denis,Nico,Michel,Kubilay,Johan,Valon,Haris,Ardon', 'Xhakaj,Shaqirić,Chapuisat-Meier,Freier,Sommerhalder,Embolo-Keller,Akanjii,Rodríguez-Frei,Seferović-Graf,Müller,Meier,Schmid,Keller,Weber,Huber,Meyer,Steiner,Gerber,Baumann,Zimmermann,Widmeyer,Wyss,Favre,Rochat,Fontana'],
  gr: ['Angelos,Giorgos,Kostas,Theodoros,Traianos,Sokratis,Vasilis,Dimitris,Nikos,Giannis,Christos,Panagiotis,Thanasis,Lazaros,Andreas,Stelios,Manolis,Petros,Fotis,Michalis,Tasos,Konstantinos,Savvas,Lefteris', 'Charisteasis,Karagounakis,Zagorakos,Dellasidis,Seitaridos,Papastathopoulakis,Mitroglouris,Tsimikakos,Bakasetakis,Papadopoulos,Georgiou,Nikolaidis,Pappas,Vlachos,Oikonomou,Makris,Karagiannis,Dimitriou,Antoniou,Ioannidis,Galanis,Alexiou,Stavrou,Raptis'],
  ru: ['Lev,Andrei,Igor,Aleksandr,Artem,Dmitri,Ivan,Maksim,Nikita,Sergey,Kirill,Mikhail,Daniil,Yuri,Anton,Roman,Denis,Pavel,Vladislav,Matvey,Aleksey,Konstantin,Georgi,Ilya', 'Yashinov,Arshavinsky,Akinfeevich,Dzyubov,Golovinsky,Kerzhakovich,Pavlyuchenkin,Smolovski,Ivanov,Smirnov,Kuznetsov,Popov,Sokolov,Lebedev,Kozlov,Novikov,Morozov,Petrovsky,Volkov,Vasilyev,Zaytsev,Pavlov,Fyodorov,Belov'],
  az: ['Emin,Toral,Mahir,Ramil,Elvin,Rauf,Namiq,Bəhlul,Abbas,Musa,Tural,Ruslan,Araz,Rüstəm,Vüqar,Coşqun,Cəlal,Hüseyn,Kənan,Nihad,Orxan,Rəhman,Elşən,Qurban', 'Qurbanovski,Mahmudlu,Nəbiyevçi,Məmmədov,Əliyev,Hüseynzadə,Həsənov,Quliyev,Abdullayev,İsmayılov,Rzayev,Cəfərov,Qasımov,Babayev,Mustafayev,Səfərov,Kərimov,Bayramlı,Zeynalov,Musayev,Novruzov,Əhmədov,Bağırov,Dadaşov'],
  br: ['Ronaldão,Ronaldinho,Kaká,Romário,Rivaldo,Zico,Pelezinho,Cafuzinho,Robertinho,Neymarzinho,Vinícius,Rodrygo,Gabriel,Lucas,Thiago,Mateus,Felipe,Bruno,Alisson,Éderson,Casemiro,Marquinhos,Raphinha,Endrick,Juninho,Fred', 'Nazário-Lima,Gaúcho,Leitão,Faria,Ferreirinha,Arantes,Cafu,Carlos,Silva Júnior,Vini Santos,Goes,Souza,Lima,Araújo,Barbosa,Cardoso,Nascimento,Bezerra,Rocha,Teixeira,Batista,Freitas,Monteiro,Cavalcanti,Duarte,Pires'],
  ar: ['Lionel,Diego,Gabriel,Juan Román,Javier,Sergio,Ángel,Hernán,Carlos,Lautaro,Julián,Enzo,Alexis,Rodrigo,Nicolás,Emiliano,Paulo,Santiago,Matías,Joaquín,Leandro,Facundo,Franco,Thiago', 'Messina,Maradonna,Batistuta-Ruiz,Riquelmo,Zanettini,Agüerro,Di Maríano,Crespito,Tevezón,Martínezz,Álvarezo,Fernándezi,Mac Allisterr,Dybalino,Otamendo,Godoy,Vargas,Rojas,Acosta,Benítez,Medina,Herrera,Sosa,Quiroga'],
  af: ['Samuel,Didier,Yaya,Sadio,Mohamed,Riyad,Achraf,Victor,Kalidou,Jay-Jay,George,Emmanuel,Michael,Moussa,Ibrahima,Kwame,Kofi,Yaw,Omar,Amine,Bilal,Seydou,Idrissa,Serge,Wilfried,André', "Eto'oh,Drogbá,Touré-Koné,Manéh,Salahi,Mahrezzi,Hakimo,Osimhenn,Koulibalié,Okochaa,Weahh,Essienne,Diallo,Traoré,Koné,Camara,Sylla,Ndiaye,Mensah,Boateng,Okafor,Adeyemi,Kouyaté,Bamba,Cissé,Sarr"],
  bk: ['Luka,Davor,Zvonimir,Ivan,Mario,Dejan,Nemanja,Dušan,Aleksandar,Stefan,Nikola,Marko,Edin,Miralem,Josip,Mateo,Andrej,Filip,Sergej,Dragan,Darko,Milan,Vedran,Bojan', 'Modrićić,Šukerović,Bobanić,Rakitović,Mandžukić-Horvat,Stanković-Petrov,Vidić-Ilić,Vlahović-Kos,Džekić,Pjanović,Savićević,Petrović,Jovanović,Nikolić,Kovač,Horvat,Novak,Marić,Babić,Jurić,Pavlović,Stojanović,Lukić,Ristić'],
  pl: ['Robert,Wojciech,Jakub,Piotr,Kamil,Grzegorz,Łukasz,Arkadiusz,Krzysztof,Mateusz,Bartosz,Sebastian,Przemysław,Karol,Jan,Michał,Tomasz,Paweł,Adam,Szymon', 'Lewandowskij,Szczęsnyk,Błaszczykowski-Nowak,Zielińskij,Milikowski,Bednarek-Wójcik,Kowalski,Nowak,Wiśniewski,Wójcik,Kamyk,Lewicki,Zalewicz,Szymczak,Woźniak,Dąbrowski,Kozłowski,Jankowski,Mazur,Krawczyk'],
  jp: ['Hidetoshi,Shinji,Keisuke,Takumi,Kaoru,Takefusa,Wataru,Daichi,Ritsu,Kyogo,Ao,Hiroki,Yuto,Takehiro,Junya,Shoya,Ayase,Kento,Sota,Haruto', 'Nakatani,Kagawara,Hondaki,Minamota,Mitomaru,Kubota-Saito,Endoh,Kamadaka,Doanaga,Tomiyasuda,Tanakawa,Suzuki,Takahashi,Watanabe,Itoya,Yamamoto,Nakamura,Kobayashi,Kato,Yoshida'],
  kr: ['Heung-min,Ji-sung,Min-jae,Kang-in,Hee-chan,Ui-jo,Jae-sung,Seung-ho,Woo-yeong,Gue-sung,Hyun-woo,Min-ho,Jun-ho,Tae-hwan,Sung-yong,Do-hyun', 'Sonn,Parkk,Kimm,Leee,Hwangg,Choi,Jungg,Kang,Choo,Yoon,Jang,Lim,Han,Oh,Seo,Shin'],
  us: ['Christian,Landon,Clint,Tim,Weston,Tyler,Gio,Brenden,Folarin,Sergiño,Ricardo,Josh,Matt,DeAndre,Chris,Jordan,Brian,Kellyn,Yunus,Haji', 'Pulisichek,Donovanson,Dempseyer,Howardson,McKennie-Jones,Adamsford,Reynaand,Aaronsen,Baloguny,Destinyo,Smith,Johnson,Williams,Brown,Miller,Davis,Wilson,Moore,Taylor,Robinson'],
};
// Foreign-player origins, weighted by repetition (a club's own nationality is skipped)
const FB_FOREIGN = ['br', 'br', 'br', 'br', 'br', 'af', 'af', 'af', 'af', 'af', 'fr', 'fr', 'fr', 'fr', 'ar', 'ar', 'ar', 'pt', 'pt', 'pt', 'es', 'es', 'es', 'bk', 'bk', 'bk', 'nl', 'nl', 'de', 'de', 'en', 'en', 'it', 'it', 'be', 'be', 'pl', 'dk', 'no', 'sc', 'ch', 'at', 'gr', 'tr', 'jp', 'kr', 'us'];
// Exact real-player names the generator must never output (add more as you spot them)
const FB_BLOCK = new Set(['Arda Güler', 'Burak Yılmaz', 'Leandro Paredes', 'Lucas Moura', 'Bernardo Silva', 'Diogo Costa', 'Rui Costa', 'Robin Koch', 'Andreas Christensen', 'Frank de Boer', 'Ryan Fraser', 'Lewis Ferguson', 'Moussa Sow', 'Dušan Tadić', 'Jakub Kamiński', 'Ao Tanaka', 'Hiroki Ito', 'Toral Bayramov', 'Fabian Frei', 'Silvan Widmer', 'Patrick Berg']);
// Nationality → flag (for squad lists)
const FB_NAT = { tr: '🇹🇷', en: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', es: '🇪🇸', it: '🇮🇹', fr: '🇫🇷', de: '🇩🇪', pt: '🇵🇹', nl: '🇳🇱', be: '🇧🇪', no: '🇳🇴', dk: '🇩🇰', sc: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', at: '🇦🇹', ch: '🇨🇭', gr: '🇬🇷', ru: '🇷🇺', az: '🇦🇿', br: '🇧🇷', ar: '🇦🇷', af: '🌍', bk: '🇭🇷', pl: '🇵🇱', jp: '🇯🇵', kr: '🇰🇷', us: '🇺🇸' };
FB_NAMES.world = FB_NAMES.br;   // legacy alias

// Derbies and big rivalries by club id ('league:index', so renaming a club never breaks them) → special news and commentary
const FB_DERBY = [
  ['tr:0', 'tr:1', 'Kıtalar Arası Derbi'],   // G.Saray – FenerB
  ['tr:0', 'tr:2', 'İstanbul derbisi'],   // G.Saray – B.Taş
  ['tr:1', 'tr:2', 'İstanbul derbisi'],   // FenerB – B.Taş
  ['tr:3', 'tr:1', 'Karadeniz–İstanbul randevusu'],   // Trabzon Fırtına – FenerB
  ['tr:3', 'tr:0', 'Karadeniz–İstanbul randevusu'],   // Trabzon Fırtına – G.Saray
  ['tr:3', 'tr:2', 'Karadeniz–İstanbul randevusu'],   // Trabzon Fırtına – B.Taş
  ['en:0', 'en:17', 'Kuzey Londra derbisi'],   // Arsenol – Tottenhem
  ['en:11', 'en:8', 'Merseyside derbisi'],   // Liverpole – Evertown
  ['en:12', 'en:13', 'Manchester derbisi'],   // Manchester Sky – Manchester Red
  ['en:11', 'en:13', 'Kuzeyin büyük maçı'],   // Liverpole – Manchester Red
  ['es:0', 'es:1', 'El Clásico'],   // R.Madrid – Barsalona
  ['es:0', 'es:2', 'Madrid derbisi'],   // R.Madrid – A.Madrid
  ['es:5', 'es:8', 'Sevilla derbisi'],   // Betico Sevilla – Sevila
  ['it:0', 'it:1', 'Milano derbisi'],   // Internazionali – A.Milano
  ['it:5', 'it:6', 'Roma derbisi'],   // Romulus – Aquile Roma
  ['it:2', 'it:9', 'Torino derbisi'],   // Juventa – Toro Granata
  ['it:2', 'it:0', "Derby d'Italia"],   // Juventa – Internazionali
  ['fr:0', 'fr:1', 'Le Classique'],   // Paris Saint-Gérard – Marsilya
  ['de:0', 'de:1', 'Der Klassiker'],   // B.Munih – B.Dortmunt
  ['pt:0', 'pt:1', 'O Clássico'],   // Benfika – Portu Dragões
  ['pt:0', 'pt:2', 'Lizbon derbisi'],   // Benfika – Lisboa Leões
  ['pt:1', 'pt:2', 'Portekiz devleri'],   // Portu Dragões – Lisboa Leões
  ['nl:1', 'nl:2', 'De Klassieker'],   // Ajaxx – Feijenoord
  ['nl:1', 'nl:0', 'Hollanda devleri'],   // Ajaxx – Eindhoven Lampen
  ['be:0', 'be:1', 'Belçika klasiği'],   // Brugge Blauw-Zwart – Anderleht
  ['sc:0', 'sc:1', 'Old Firm'],   // Glasgow Kelt – Glasgow Gers
  ['sc:2', 'sc:4', 'Edinburgh derbisi'],   // Heart of Lothian – Leith Hibees
  ['sc:9', 'sc:6', 'Dundee derbisi'],   // Dundee Dark Blues – Dundee Terrors
  ['sc:3', 'sc:1', 'İskoç kuzey–güney çekişmesi'],   // Granite City – Glasgow Gers
  ['at:2', 'at:3', 'Viyana derbisi'],   // Wien Grün-Weiß – Wien Veilchen
  ['at:1', 'at:7', 'Graz derbisi'],   // Graz Sturmvogel – Graz Rotjacken
  ['at:0', 'at:2', 'Avusturya devleri'],   // Salzburg Mozart – Wien Grün-Weiß
  ['ch:1', 'ch:7', 'İsviçre klasiği'],   // Basel Bebbi – Zürih Stadt
  ['ch:7', 'ch:10', 'Zürih derbisi'],   // Zürih Stadt – Zürih Çekirgeleri
  ['ch:3', 'ch:9', 'Romandie derbisi'],   // Genf Grenats – Lausanne Léman
  ['ch:0', 'ch:1', 'İsviçre zirve maçı'],   // Bern Jungs – Basel Bebbi
  ['gr:0', 'gr:3', 'Ezeli rakipler derbisi'],   // Pire Olimpos – Atina Yonca
  ['gr:2', 'gr:3', 'Atina derbisi'],   // Atina Bizans – Atina Yonca
  ['gr:2', 'gr:0', 'Atina–Pire derbisi'],   // Atina Bizans – Pire Olimpos
  ['gr:1', 'gr:4', 'Selanik derbisi'],   // Selanik Çifte Kartal – Selanik Ares
  ['gr:1', 'gr:0', 'Kuzey–güney derbisi'],   // Selanik Çifte Kartal – Pire Olimpos
  ['dk:0', 'dk:2', 'New Firm (Kopenhag derbisi)'],   // Kopenhag Byens – Brøndby Vestegn
  ['dk:1', 'dk:0', 'Danimarka zirvesi'],   // Herning Ulvene – Kopenhag Byens
  ['dk:4', 'dk:5', 'Doğu Jutland derbisi'],   // Aarhus Hvide – Randers Kronjylland
  ['no:2', 'no:1', 'Norveç klasiği'],   // Rosenburg – Molde Fjord
  ['ru:2', 'ru:3', 'Moskova derbisi'],   // Spartaküs Moskova – Moskova Ordu
  ['az:0', 'az:1', 'Bakü klasiği']   // Ağdam Atları – Bakı Neftçilər
];
