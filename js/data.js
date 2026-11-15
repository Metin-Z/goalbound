/* ===================== Futbol Kariyeri — data (leagues, clubs, names) =====================
   Edit freely: each club is [name, short code, primary colour, secondary colour, strength 50-95].
   Süper Lig and the five v14 leagues (sc, at, ch, gr, dk) = 2026-27 season clubs. Other leagues use their 2025-26 line-ups; update here when needed.
   Player names are generated per nationality (see FB_NAMES); a club may also get an explicit roster:
   FB_ROSTERS['tr:0'] = ['Kaleci', 'Sol bek', 'Stoper', 'Stoper', 'Sağ bek', 'Orta saha', 'Orta saha', 'Orta saha', 'Sol kanat', 'Forvet', 'Sağ kanat'] (11 names, GK..RW order)  (optional, overrides generation). */
const FB_LEAGUES = [
  { id: 'tr', name: 'Trendyol Süper Lig', country: 'Türkiye', flag: '🇹🇷', nat: 'tr', dom: .55, euro: [2, 2, 1], teams: [
    ['Galatasaray', 'GS', '#a90432', '#fdb912', 82], ['Fenerbahçe', 'FB', '#14205c', '#f5d400', 81], ['Beşiktaş', 'BJK', '#111111', '#ffffff', 78],
    ['Trabzonspor', 'TS', '#7a1f3d', '#4fa3d9', 75], ['Başakşehir', 'İBFK', '#f05a28', '#0b2240', 72], ['Samsunspor', 'SAM', '#e30613', '#ffffff', 72],
    ['Göztepe', 'GÖZ', '#f6c400', '#d0021b', 71], ['Eyüpspor', 'EYP', '#6a1b9a', '#f6c400', 68], ['Kasımpaşa', 'KAS', '#1d3d8f', '#ffffff', 68],
    ['Kocaelispor', 'KOC', '#0a7a3b', '#111111', 67], ['Gençlerbirliği', 'GB', '#d0021b', '#111111', 66], ['Alanyaspor', 'ALN', '#f47b20', '#0b8a3e', 68],
    ['Konyaspor', 'KON', '#0a7a3b', '#ffffff', 67], ['Gaziantep FK', 'GFK', '#c8102e', '#111111', 67], ['Çaykur Rizespor', 'RİZ', '#0b8a3e', '#1d3d8f', 67],
    ['Erzurumspor FK', 'ERZ', '#1d4f9e', '#ffffff', 64], ['Amed SFK', 'AMD', '#0b8a3e', '#d0021b', 63], ['Çorum FK', 'ÇOR', '#b5121b', '#111111', 63]] },
  { id: 'en', name: 'Premier League', country: 'İngiltere', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', nat: 'en', dom: .35, euro: [4, 2, 1], teams: [
    ['Arsenal', 'ARS', '#ef0107', '#ffffff', 89], ['Aston Villa', 'AVL', '#670e36', '#95bfe5', 82], ['Bournemouth', 'BOU', '#da291c', '#111111', 76], ['Brentford', 'BRE', '#e30613', '#ffffff', 76],
    ['Brighton', 'BHA', '#0057b8', '#ffffff', 79], ['Burnley', 'BUR', '#6c1d45', '#99d6ea', 72], ['Chelsea', 'CHE', '#034694', '#ffffff', 86], ['Crystal Palace', 'CRY', '#1b458f', '#c4122e', 78],
    ['Everton', 'EVE', '#003399', '#ffffff', 75], ['Fulham', 'FUL', '#f2f2f2', '#111111', 76], ['Leeds United', 'LEE', '#f2f2f2', '#1d428a', 73], ['Liverpool', 'LIV', '#c8102e', '#ffffff', 90],
    ['Manchester City', 'MCI', '#6cabdd', '#ffffff', 89], ['Manchester United', 'MUN', '#da291c', '#fbe122', 83], ['Newcastle United', 'NEW', '#241f20', '#ffffff', 84], ['Nottingham Forest', 'NFO', '#dd0000', '#ffffff', 77],
    ['Sunderland', 'SUN', '#eb172b', '#ffffff', 72], ['Tottenham', 'TOT', '#f2f2f2', '#132257', 82], ['West Ham', 'WHU', '#7a263a', '#1bb1e7', 76], ['Wolves', 'WOL', '#fdb913', '#231f20', 74]] },
  { id: 'es', name: 'La Liga', country: 'İspanya', flag: '🇪🇸', nat: 'es', dom: .6, euro: [4, 2, 1], teams: [
    ['Real Madrid', 'RMA', '#f2f2f2', '#febe10', 91], ['Barcelona', 'BAR', '#a50044', '#004d98', 90], ['Atlético Madrid', 'ATM', '#cb3524', '#ffffff', 85], ['Athletic Club', 'ATH', '#ee2523', '#ffffff', 80],
    ['Villarreal', 'VIL', '#ffe667', '#005187', 80], ['Real Betis', 'BET', '#00954c', '#ffffff', 79], ['Real Sociedad', 'RSO', '#0067b1', '#ffffff', 78], ['Celta Vigo', 'CEL', '#8ac3ee', '#ffffff', 75],
    ['Sevilla', 'SEV', '#f2f2f2', '#d6001c', 76], ['Valencia', 'VAL', '#f2f2f2', '#111111', 75], ['Osasuna', 'OSA', '#d91a21', '#0a346f', 74], ['Getafe', 'GET', '#005999', '#ffffff', 73],
    ['Girona', 'GIR', '#cd2534', '#ffffff', 75], ['Rayo Vallecano', 'RAY', '#f2f2f2', '#e53027', 73], ['Espanyol', 'ESP', '#007fc8', '#ffffff', 73], ['Mallorca', 'MLL', '#e20613', '#111111', 73],
    ['Alavés', 'ALA', '#009ad7', '#ffffff', 72], ['Levante', 'LEV', '#00519e', '#b4053f', 70], ['Elche', 'ELC', '#f2f2f2', '#05642c', 70], ['Real Oviedo', 'OVI', '#0057a5', '#ffffff', 69]] },
  { id: 'it', name: 'Serie A', country: 'İtalya', flag: '🇮🇹', nat: 'it', dom: .45, euro: [4, 2, 1], teams: [
    ['Inter', 'INT', '#0068a8', '#111111', 88], ['Milan', 'MIL', '#fb090b', '#111111', 85], ['Juventus', 'JUV', '#f2f2f2', '#111111', 85], ['Napoli', 'NAP', '#12a0d7', '#ffffff', 86],
    ['Atalanta', 'ATA', '#1e71b8', '#111111', 83], ['Roma', 'ROM', '#8e1f2f', '#f0bc42', 82], ['Lazio', 'LAZ', '#87d8f7', '#ffffff', 80], ['Fiorentina', 'FIO', '#482e92', '#ffffff', 79],
    ['Bologna', 'BOL', '#a21c26', '#1a2f48', 79], ['Torino', 'TOR', '#881f19', '#ffffff', 75], ['Como', 'COM', '#0a4595', '#ffffff', 77], ['Udinese', 'UDI', '#f2f2f2', '#111111', 74],
    ['Genoa', 'GEN', '#a7193b', '#0e2b5c', 73], ['Cagliari', 'CAG', '#b01028', '#0f2c5c', 72], ['Lecce', 'LEC', '#ffd700', '#d50000', 71], ['Parma', 'PAR', '#ffd200', '#1e3d8f', 72],
    ['Hellas Verona', 'VER', '#003c82', '#ffd200', 71], ['Sassuolo', 'SAS', '#00a752', '#111111', 72], ['Cremonese', 'CRE', '#c8102e', '#9e9e9e', 70], ['Pisa', 'PIS', '#0a1f44', '#111111', 69]] },
  { id: 'fr', name: 'Ligue 1', country: 'Fransa', flag: '🇫🇷', nat: 'fr', dom: .45, euro: [3, 2, 1], teams: [
    ['Paris Saint-Germain', 'PSG', '#004170', '#da291c', 90], ['Marseille', 'OM', '#f2f2f2', '#2faee0', 83], ['Monaco', 'ASM', '#e51b22', '#ffffff', 82], ['Lille', 'LIL', '#e01e13', '#20325f', 81],
    ['Lyon', 'OL', '#f2f2f2', '#da0812', 81], ['Nice', 'NIC', '#c8102e', '#111111', 78], ['Lens', 'RCL', '#ffd400', '#e2001a', 79], ['Rennes', 'REN', '#e13327', '#111111', 78],
    ['Strasbourg', 'RCS', '#009fe3', '#ffffff', 77], ['Toulouse', 'TFC', '#5e2a84', '#ffffff', 75], ['Brest', 'SB29', '#e30613', '#ffffff', 75], ['Nantes', 'FCN', '#fcd405', '#00a650', 73],
    ['Auxerre', 'AJA', '#f2f2f2', '#005baa', 72], ['Angers', 'SCO', '#111111', '#ffffff', 71], ['Le Havre', 'HAC', '#0f2d52', '#8dc8e8', 71], ['Lorient', 'FCL', '#f58113', '#111111', 71],
    ['Metz', 'FCM', '#7c0a2b', '#ffffff', 70], ['Paris FC', 'PFC', '#0a2240', '#ffffff', 72]] },
  { id: 'de', name: 'Bundesliga', country: 'Almanya', flag: '🇩🇪', nat: 'de', dom: .45, euro: [4, 2, 1], teams: [
    ['Bayern München', 'FCB', '#dc052d', '#ffffff', 91], ['Borussia Dortmund', 'BVB', '#fde100', '#111111', 85], ['Bayer Leverkusen', 'B04', '#e32221', '#111111', 84], ['RB Leipzig', 'RBL', '#f2f2f2', '#dd0741', 83],
    ['VfB Stuttgart', 'VFB', '#f2f2f2', '#e32219', 81], ['Eintracht Frankfurt', 'SGE', '#111111', '#e1000f', 81], ['SC Freiburg', 'SCF', '#f2f2f2', '#e2001a', 78], ['VfL Wolfsburg', 'WOB', '#65b32e', '#ffffff', 77],
    ['Borussia M\'gladbach', 'BMG', '#f2f2f2', '#111111', 77], ['Hoffenheim', 'TSG', '#1961b5', '#ffffff', 77], ['Mainz 05', 'M05', '#c3141e', '#ffffff', 76], ['Werder Bremen', 'SVW', '#1d9053', '#ffffff', 76],
    ['Union Berlin', 'FCU', '#eb1923', '#ffffff', 76], ['FC Augsburg', 'FCA', '#ba3733', '#46714d', 74], ['1. FC Köln', 'KOE', '#f2f2f2', '#ed1c24', 74], ['Hamburger SV', 'HSV', '#f2f2f2', '#0a3f86', 74],
    ['St. Pauli', 'STP', '#6c4a32', '#ffffff', 72], ['Heidenheim', 'FCH', '#e2001a', '#003b79', 72]] },
  { id: 'pt', name: 'Liga Portugal', country: 'Portekiz', flag: '🇵🇹', nat: 'pt', dom: .4, euro: [2, 2, 1], teams: [
    ['Benfica', 'SLB', '#e83030', '#ffffff', 84], ['Porto', 'FCP', '#00428c', '#ffffff', 84], ['Sporting CP', 'SCP', '#008057', '#ffffff', 85], ['Braga', 'SCB', '#e20613', '#ffffff', 79],
    ['Vitória SC', 'VSC', '#f2f2f2', '#111111', 75], ['Famalicão', 'FAM', '#002c5f', '#ffffff', 73], ['Gil Vicente', 'GIL', '#e30613', '#1d428a', 72], ['Moreirense', 'MOR', '#00843d', '#ffffff', 71],
    ['Rio Ave', 'RAV', '#00843d', '#ffffff', 70], ['Estoril', 'EST', '#ffd200', '#0057a8', 71], ['Casa Pia', 'CPI', '#111111', '#ffffff', 69], ['Arouca', 'ARO', '#ffd200', '#0057a8', 70],
    ['Santa Clara', 'SCL', '#e30613', '#ffffff', 70], ['Nacional', 'CDN', '#111111', '#ffffff', 69], ['Estrela Amadora', 'EAM', '#e30613', '#00843d', 68], ['Alverca', 'ALV', '#e30613', '#ffffff', 67],
    ['Tondela', 'TON', '#00843d', '#ffd200', 67], ['AVS', 'AVS', '#c8102e', '#ffffff', 67]] },
  { id: 'nl', name: 'Eredivisie', country: 'Hollanda', flag: '🇳🇱', nat: 'nl', dom: .55, euro: [2, 2, 1], teams: [
    ['PSV', 'PSV', '#ed1c24', '#ffffff', 82], ['Ajax', 'AJX', '#f2f2f2', '#d2122e', 81], ['Feyenoord', 'FEY', '#ff0000', '#ffffff', 81], ['AZ Alkmaar', 'AZ', '#e30613', '#ffffff', 78],
    ['Twente', 'TWE', '#e30613', '#ffffff', 76], ['Utrecht', 'UTR', '#e30613', '#ffffff', 75], ['NEC Nijmegen', 'NEC', '#e30613', '#00843d', 73], ['Heerenveen', 'HEE', '#0057a8', '#ffffff', 72],
    ['Sparta Rotterdam', 'SPA', '#e30613', '#ffffff', 71], ['Go Ahead Eagles', 'GAE', '#e30613', '#ffd200', 72], ['Groningen', 'GRO', '#00843d', '#ffffff', 71], ['Fortuna Sittard', 'FOR', '#ffd200', '#00843d', 70],
    ['PEC Zwolle', 'PEC', '#0057a8', '#ffffff', 70], ['Heracles', 'HER', '#111111', '#ffffff', 69], ['NAC Breda', 'NAC', '#ffd200', '#111111', 69], ['Excelsior', 'EXC', '#e30613', '#111111', 68],
    ['Telstar', 'TEL', '#f2f2f2', '#e30613', 67], ['Volendam', 'VOL', '#f58113', '#111111', 67]] },
  { id: 'be', name: 'Pro League', country: 'Belçika', flag: '🇧🇪', nat: 'be', dom: .4, euro: [1, 2, 1], teams: [
    ['Club Brugge', 'CLU', '#0057a8', '#111111', 80], ['Anderlecht', 'AND', '#5b2a86', '#ffffff', 77], ['Union SG', 'USG', '#ffd200', '#0057a8', 78], ['Genk', 'KRC', '#0057a8', '#ffffff', 76],
    ['Gent', 'GNT', '#0057a8', '#ffffff', 75], ['Antwerp', 'ANT', '#e30613', '#ffffff', 75], ['Standard Liège', 'STA', '#e30613', '#ffffff', 73], ['Mechelen', 'KVM', '#ffd200', '#e30613', 72],
    ['Westerlo', 'WES', '#ffd200', '#0057a8', 71], ['Charleroi', 'CHA', '#111111', '#ffffff', 71], ['Cercle Brugge', 'CER', '#00843d', '#111111', 70], ['OH Leuven', 'OHL', '#e30613', '#ffffff', 70],
    ['Sint-Truiden', 'STV', '#ffd200', '#0057a8', 70], ['Dender', 'DEN', '#0057a8', '#ffffff', 68], ['Zulte Waregem', 'ZWA', '#e30613', '#ffffff', 68], ['La Louvière', 'RAL', '#00843d', '#ffffff', 67]] },
  { id: 'no', name: 'Eliteserien', country: 'Norveç', flag: '🇳🇴', nat: 'no', dom: .7, euro: [1, 1, 1], teams: [
    ['Bodø/Glimt', 'BOD', '#ffd200', '#111111', 78], ['Molde', 'MOL', '#0057a8', '#ffffff', 72], ['Rosenborg', 'RBK', '#f2f2f2', '#111111', 72], ['Brann', 'BRA', '#e30613', '#ffffff', 73],
    ['Viking', 'VIK', '#0057a8', '#ffffff', 71], ['Tromsø', 'TIL', '#e30613', '#ffffff', 69], ['Sarpsborg 08', 'S08', '#0057a8', '#ffffff', 68], ['Fredrikstad', 'FFK', '#e30613', '#ffffff', 68],
    ['KFUM Oslo', 'KFU', '#0057a8', '#ffffff', 66], ['Sandefjord', 'SAN', '#0057a8', '#ffffff', 66], ['Strømsgodset', 'SIF', '#0057a8', '#ffffff', 66], ['HamKam', 'HAM', '#00843d', '#ffffff', 65],
    ['Kristiansund', 'KBK', '#0057a8', '#ffffff', 65], ['Haugesund', 'FKH', '#111111', '#ffffff', 64], ['Vålerenga', 'VIF', '#0a2240', '#e30613', 68], ['Bryne', 'BRY', '#e30613', '#ffffff', 64]] },
  { id: 'ru', name: 'Premier Liga', country: 'Rusya', flag: '🇷🇺', nat: 'ru', dom: .7, euro: [0, 0, 0], teams: [
    ['Zenit', 'ZEN', '#0094d8', '#ffffff', 80], ['Krasnodar', 'KRA', '#111111', '#00843d', 78], ['Spartak Moskova', 'SPM', '#e30613', '#ffffff', 76], ['CSKA Moskova', 'CSK', '#0057a8', '#e30613', 76],
    ['Lokomotiv Moskova', 'LOK', '#e30613', '#00843d', 75], ['Dinamo Moskova', 'DIN', '#0057a8', '#ffffff', 75], ['Rostov', 'ROS', '#ffd200', '#0057a8', 71], ['Rubin Kazan', 'RUB', '#7a1f3d', '#00843d', 71],
    ['Akhmat Grozny', 'AKH', '#00843d', '#ffffff', 69], ['Krylia Sovetov', 'KRY', '#0057a8', '#ffffff', 69], ['Dinamo Mahaçkale', 'DMK', '#0057a8', '#ffffff', 68], ['Orenburg', 'ORE', '#0057a8', '#ffffff', 68],
    ['Pari NN', 'PNN', '#111111', '#ffffff', 67], ['Baltika', 'BAL', '#0057a8', '#ffffff', 68], ['Akron Tolyatti', 'AKR', '#111111', '#ffffff', 66], ['Soçi', 'SOC', '#0057a8', '#ffd200', 66]] },
  { id: 'az', name: 'Premyer Liqa', country: 'Azerbaycan', flag: '🇦🇿', nat: 'az', dom: .6, euro: [1, 1, 1], teams: [
    ['Qarabağ', 'QAR', '#111111', '#ffffff', 76], ['Neftçi', 'NEF', '#111111', '#f2f2f2', 68], ['Sabah', 'SAB', '#0057a8', '#ffffff', 68], ['Zirə', 'ZİR', '#0057a8', '#ffd200', 66],
    ['Turan Tovuz', 'TUR', '#e30613', '#ffffff', 65], ['Sumqayıt', 'SUM', '#0057a8', '#ffffff', 64], ['Kəpəz', 'KƏP', '#00843d', '#ffffff', 63], ['Araz-Naxçıvan', 'ARA', '#e30613', '#ffffff', 64],
    ['Səbail', 'SƏB', '#0057a8', '#ffffff', 62], ['Qəbələ', 'QƏB', '#e30613', '#ffffff', 63], ['Şamaxı', 'ŞAM', '#00843d', '#ffffff', 62], ['İmişli', 'İMİ', '#c8102e', '#ffffff', 61]] },
  // v14: five more leagues — club line-ups are the 2026-27 seasons (checked Nov 2026); colours are the clubs' traditional kit colours, strength is a game estimate
  { id: 'sc', name: 'Scottish Premiership', country: 'İskoçya', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', nat: 'sc', dom: .55, euro: [1, 1, 1], teams: [
    ['Celtic', 'CLT', '#018749', '#ffffff', 79], ['Rangers', 'RAN', '#1b458f', '#ffffff', 77], ['Hearts', 'HEA', '#7a1f3d', '#ffffff', 70], ['Aberdeen', 'ABE', '#e30613', '#ffffff', 69],
    ['Hibernian', 'HIB', '#00843d', '#ffffff', 68], ['Motherwell', 'MOT', '#ffb612', '#7a1f3d', 67], ['Dundee United', 'DUN', '#f58113', '#111111', 66], ['Kilmarnock', 'KIL', '#0057a8', '#ffffff', 64],
    ['St Mirren', 'SMI', '#111111', '#ffffff', 64], ['Dundee', 'DND', '#0a2240', '#ffffff', 63], ['Falkirk', 'FAL', '#0a2240', '#e30613', 63], ['St Johnstone', 'SJO', '#0057a8', '#ffffff', 62]] },
  { id: 'at', name: 'Bundesliga (AUT)', country: 'Avusturya', flag: '🇦🇹', nat: 'at', dom: .6, euro: [1, 1, 1], teams: [
    ['RB Salzburg', 'RBS', '#f2f2f2', '#d6001c', 78], ['Sturm Graz', 'STU', '#111111', '#ffffff', 75], ['Rapid Wien', 'RAP', '#00843d', '#ffffff', 72], ['Austria Wien', 'FAK', '#5b2a86', '#ffffff', 71],
    ['LASK', 'LASK', '#111111', '#f2f2f2', 71], ['Wolfsberger AC', 'WAC', '#111111', '#f2f2f2', 69], ['Hartberg', 'TSV', '#0057a8', '#ffffff', 66], ['Grazer AK', 'GAK', '#e30613', '#ffffff', 64],
    ['WSG Tirol', 'WSG', '#00843d', '#ffffff', 64], ['SV Ried', 'RIE', '#111111', '#00843d', 64], ['Altach', 'ALT', '#111111', '#ffd200', 64], ['Austria Lustenau', 'LUS', '#00843d', '#ffffff', 63]] },
  { id: 'ch', name: 'Super League (SUI)', country: 'İsviçre', flag: '🇨🇭', nat: 'ch', dom: .5, euro: [1, 1, 1], teams: [
    ['Young Boys', 'YB', '#ffd200', '#111111', 76], ['Basel', 'BAS', '#e30613', '#0057a8', 75], ['Lugano', 'LUG', '#111111', '#ffffff', 72], ['Servette', 'SER', '#7a1f3d', '#ffffff', 71],
    ['Thun', 'THU', '#e30613', '#ffffff', 70], ['St. Gallen', 'FCSG', '#00843d', '#ffffff', 70], ['Luzern', 'LUZ', '#0057a8', '#ffffff', 69], ['Zürich', 'FCZ', '#f2f2f2', '#0057a8', 69],
    ['Sion', 'SIO', '#f2f2f2', '#e30613', 68], ['Lausanne-Sport', 'LS', '#0057a8', '#ffffff', 68], ['Grasshopper', 'GCZ', '#0057a8', '#f2f2f2', 67], ['Vaduz', 'VAD', '#e30613', '#0057a8', 64]] },
  { id: 'gr', name: 'Super League (GRE)', country: 'Yunanistan', flag: '🇬🇷', nat: 'gr', dom: .5, euro: [1, 1, 1], teams: [
    ['Olympiacos', 'OLY', '#e30613', '#ffffff', 80], ['PAOK', 'PAOK', '#111111', '#ffffff', 78], ['AEK Athens', 'AEK', '#ffd200', '#111111', 78], ['Panathinaikos', 'PAO', '#00843d', '#ffffff', 77],
    ['Aris', 'ARI', '#ffd200', '#111111', 70], ['OFI', 'OFI', '#111111', '#ffffff', 68], ['Asteras Tripolis', 'AST', '#ffd200', '#0057a8', 66], ['Atromitos', 'ATR', '#0057a8', '#ffffff', 66],
    ['Volos', 'VOS', '#0057a8', '#e30613', 65], ['Levadiakos', 'LVD', '#00843d', '#ffffff', 65], ['Iraklis', 'IRA', '#0057a8', '#ffffff', 64], ['Panetolikos', 'PAN', '#ffd200', '#0057a8', 64],
    ['Kifisia', 'KFS', '#0057a8', '#ffffff', 63], ['Kalamata', 'KAL', '#111111', '#ffffff', 63]] },
  { id: 'dk', name: 'Superliga', country: 'Danimarka', flag: '🇩🇰', nat: 'dk', dom: .55, euro: [1, 1, 1], teams: [
    ['FC København', 'FCK', '#f2f2f2', '#0057a8', 77], ['Midtjylland', 'MID', '#111111', '#e30613', 77], ['Brøndby', 'BIF', '#ffd200', '#0057a8', 73], ['Nordsjælland', 'NOR', '#e30613', '#ffd200', 72],
    ['AGF', 'AGF', '#f2f2f2', '#0a2240', 72], ['Randers', 'RFC', '#0057a8', '#ffffff', 68], ['Silkeborg', 'SIL', '#e30613', '#ffffff', 68], ['Viborg', 'VFF', '#00843d', '#ffffff', 67],
    ['OB', 'OB', '#0057a8', '#ffffff', 67], ['Sønderjyske', 'SJE', '#0094d8', '#ffffff', 65], ['Lyngby', 'LBK', '#0057a8', '#ffffff', 65], ['AC Horsens', 'ACH', '#ffd200', '#111111', 64]] }
];
// European cups: [name, short, colour]
const FB_CUPS = { ucl: ['UEFA Şampiyonlar Ligi', 'ŞL', '#0b1f5c'], uel: ['UEFA Avrupa Ligi', 'AL', '#f37021'], uecl: ['UEFA Konferans Ligi', 'KL', '#16a34a'] };
// Optional real rosters can be dropped in here later (club id → names, GK first).
const FB_ROSTERS = {};
// Name pools per nationality: [first names, surnames]
const FB_NAMES = {
  tr: ['Arda,Kerem,Barış,Emre,Mert,Yusuf,Oğuz,Can,Burak,Efe,Semih,Kaan,Berk,Hakan,Ozan,Ferdi,Orkun,Salih,İrfan,Uğurcan,Ahmet,Mehmet,Abdülkerim,Eren,Enes,Cenk,Umut,Taylan,Halil,Serdar', 'Yılmaz,Kaya,Demir,Şahin,Çelik,Aydın,Öztürk,Arslan,Doğan,Kılıç,Aslan,Çetin,Kara,Koç,Kurt,Özdemir,Erdoğan,Akgün,Yıldız,Güler,Karaman,Tekin'],
  en: ['Harry,Jack,James,Oliver,Charlie,George,Mason,Jordan,Kyle,Marcus,Declan,Bukayo,Cole,Reece,Jarrod,Conor,Ben,Lewis,Ollie,Tyrone,Morgan,Callum,Aaron,Jude,Eberechi', 'Smith,Jones,Taylor,Brown,Walker,Wright,Thompson,Evans,Hughes,Clarke,Robinson,Wood,Harrison,Turner,Hall,Lewis,Ward,Cooper,Bailey,Anderson'],
  es: ['Pablo,Álvaro,Sergio,Marcos,Dani,Pedro,Nico,Fermín,Mikel,Iker,Unai,Rodrigo,Javi,Carlos,Raúl,Alejandro,Gavi,Aitor,Íñigo,Hugo,Óscar,Adrián,Jesús,Borja,Rubén', 'García,Martínez,López,Sánchez,Pérez,Gómez,Fernández,Díaz,Moreno,Muñoz,Romero,Navarro,Torres,Ruiz,Ramos,Gil,Serrano,Blanco,Molina,Castro,Ortega,Delgado,Morales,Iglesias,Herrera'],
  it: ['Lorenzo,Federico,Nicolò,Alessandro,Matteo,Gianluca,Davide,Giacomo,Andrea,Sandro,Riccardo,Moise,Mattia,Bryan,Manuel,Destiny,Samuele,Pietro,Simone,Giorgio,Luca,Tommaso,Francesco,Daniele,Stefano', 'Rossi,Russo,Ferrari,Esposito,Bianchi,Romano,Colombo,Ricci,Marino,Greco,Bruno,Gallo,Conti,De Luca,Mancini,Costa,Giordano,Rizzo,Lombardi,Moretti'],
  fr: ['Kylian,Antoine,Ousmane,Aurélien,Eduardo,Théo,Jules,Mathys,Warren,Bradley,Randal,Lucas,Hugo,Adrien,Rayan,Désiré,Manu,Maghnes,Khéphren,Wesley,Malo,Mattéo,Benjamin,Corentin,Enzo', 'Martin,Bernard,Dubois,Thomas,Robert,Richard,Petit,Durand,Leroy,Moreau,Simon,Laurent,Lefebvre,Michel,Fontaine,Chevalier,Girard,Bonnet,Dupont,Lambert,Rousseau,Vincent,Muller,Garnier,Faure,Mbemba,Koné,Camara,Diallo,Traoré'],
  de: ['Florian,Jamal,Leon,Joshua,Kai,Niklas,Leroy,Maximilian,Jonathan,Felix,Robert,David,Antonio,Nick,Pascal,Lukas,Tim,Jonas,Karim,Aleksandar,Julian,Marc-André,Benjamin,Chris,Tom', 'Müller,Schmidt,Schneider,Fischer,Weber,Meyer,Wagner,Becker,Schulz,Hoffmann,Koch,Richter,Klein,Wolf,Schröder,Neumann,Schwarz,Zimmermann,Braun,Krüger,Hofmann,Hartmann,Lange,Werner'],
  pt: ['João,Rúben,Bernardo,Diogo,Gonçalo,Rafael,Pedro,Vitinha,Nuno,Francisco,Tiago,Ricardo,André,Bruno,Rodrigo,Samu,Geovany,Otávio,Danilo,Fábio,Renato,Matheus,Gabriel,Pepê,Zeno', 'Silva,Santos,Ferreira,Pereira,Oliveira,Costa,Rodrigues,Martins,Jesus,Sousa,Fernandes,Gonçalves,Gomes,Lopes,Marques,Alves,Almeida,Ribeiro,Pinto,Carvalho,Teixeira,Moreira,Correia,Mendes,Neves'],
  nl: ['Frenkie,Virgil,Cody,Xavi,Ryan,Jurriën,Denzel,Joey,Teun,Quinten,Micky,Brian,Jerdy,Tijjani,Matthijs,Bart,Wout,Jorrel,Mats,Lutsharel,Kenneth,Justin,Noa,Sem,Thijs', 'Bakker,Visser,Smit,Meijer,de Boer,Mulder,de Groot,Bos,Vos,Peters,Hendriks,van Leeuwen,Dekker,Brouwer,de Wit,Dijkstra,Smits'],
  no: ['Erling,Martin,Sander,Alexander,Kristoffer,Fredrik,Jørgen,Oscar,Leo,Antonio,Marcus,Patrick,Ola,Morten,Julian,Andreas,Aron,Ulrik,Henrik,Jens,Eirik,Kasper,Mathias,Sondre,Tobias', 'Larsen,Hansen,Johansen,Olsen,Nilsen,Pedersen,Andersen,Kristiansen,Jensen,Karlsen,Berg,Haugen,Hagen,Eriksen,Strand,Solberg,Bakke,Lund,Moe,Dahl,Holm,Vik'],
  ru: ['Aleksandr,Artem,Dmitri,Ivan,Maksim,Nikita,Sergey,Andrey,Kirill,Mikhail,Daniil,Igor,Yuri,Anton,Roman,Denis,Pavel,Vladislav,Matvey,Aleksey,Konstantin,Georgi,Ilya,Arsen,Vyacheslav', 'Ivanov,Smirnov,Kuznetsov,Popov,Sokolov,Lebedev,Kozlov,Novikov,Morozov,Petrov,Volkov,Solovyov,Vasilyev,Zaytsev,Pavlov,Semyonov,Golubev,Vinogradov,Bogdanov,Vorobyov,Fyodorov,Mikhailov,Belyaev,Tarasov,Belov'],
  az: ['Emin,Toral,Mahir,Ramil,Elvin,Rauf,Namiq,Bəhlul,Abbas,Musa,Tural,Ruslan,Araz,Ozan,Rüstəm,Səbuhi,Vüqar,Coşqun,Cəlal,Hüseyn,Kənan,Nihad,Orxan,Rəhman,Elşən', 'Məmmədov,Əliyev,Hüseynov,Həsənov,Quliyev,Abdullayev,İsmayılov,Rzayev,Cəfərov,Nəbiyev,Qasımov,Babayev,Mustafayev,Səfərov,Kərimov,Bayramov,Zeynalov,Haciyev,Musayev,Novruzov,Əhmədov,Bağırov,Sadıqov,Dadaşov'],
  world: ['Lucas,Gabriel,Thiago,Mateus,Felipe,Moussa,Ibrahima,Kwame,Samuel,Emmanuel,Stefan,Nikola,Marko,Luka,Ivan,Andrei,Bence,Jakub,Min-ho,Hiroki,Diego,Santiago,Matías,Joaquín,Kofi,Omar,Karim,Amine,Bilal,Yaw', 'Souza,Lima,Araújo,Barbosa,Cardoso,Diallo,Traoré,Koné,Camara,Sow,Ndiaye,Mensah,Boateng,Okafor,Adeyemi,Petrović,Jovanović,Nikolić,Kovač,Horvat,Novak,Popescu,Ionescu,Nagy,Kowalski,Nowak,Park,Lee,Tanaka,Suzuki,Hernández,Rojas,Vargas,Mendoza,Acheampong']
};
// v14 name pools (generated names, not real players)
FB_NAMES.sc = ['Callum,Lewis,Kieran,Ryan,Scott,Liam,Ross,Craig,Euan,Fraser,Andrew,Calum,Jamie,Greg,Stuart,Billy,Lyndon,Kenny,Connor,Ewan,Rory,Murray,Blair,Grant,Dylan', 'MacDonald,Campbell,Stewart,Robertson,Thomson,Anderson,Paterson,Murray,Reid,Ross,Fraser,McLean,Hamilton,Graham,Kerr,Wallace,Ferguson,McKenzie,Cameron,McGregor,Gordon,Henderson,Burns,Christie,Docherty'];
FB_NAMES.gr = ['Giorgos,Kostas,Dimitris,Nikos,Giannis,Vasilis,Christos,Panagiotis,Thanasis,Lazaros,Andreas,Stelios,Manolis,Petros,Fotis,Anastasios,Michalis,Sotiris,Tasos,Apostolos,Charalampos,Konstantinos,Savvas,Pavlos,Lefteris', 'Papadopoulos,Georgiou,Nikolaidis,Pappas,Vlachos,Oikonomou,Makris,Karagiannis,Dimitriou,Antoniou,Ioannidis,Christodoulou,Konstantinou,Galanis,Alexiou,Stavrou,Panagiotou,Mitroglou,Lykogiannis,Tsimikas,Katsaros,Zervas,Raptis,Kyriakou,Samaras'];
FB_NAMES.dk = ['Mikkel,Rasmus,Jonas,Mathias,Frederik,Andreas,Christian,Kasper,Simon,Magnus,Emil,Oliver,Victor,Jesper,Thomas,Anders,Mads,Nikolaj,Jakob,Morten,Lasse,Gustav,Villads,Asger,Elias', 'Nielsen,Jensen,Hansen,Pedersen,Andersen,Christensen,Larsen,Sørensen,Rasmussen,Jørgensen,Petersen,Madsen,Kristensen,Olsen,Thomsen,Poulsen,Johansen,Møller,Mortensen,Knudsen,Jakobsen,Holm,Skov,Dalsgaard,Lindstrøm'];
FB_NAMES.at = [FB_NAMES.de[0] + ',Marko,Stefan,Philipp,Dominik,Christoph,Valentin', 'Gruber,Huber,Bauer,Wagner,Pichler,Steiner,Moser,Mayer,Hofer,Leitner,Berger,Fuchs,Eder,Fischer,Schmid,Winkler,Weber,Schwarz,Maier,Reiter,Brunner,Wimmer,Egger,Lang,Baumgartner'];
FB_NAMES.ch = [FB_NAMES.de[0] + ',' + 'Granit,Xherdan,Breel,Fabian,Remo,Silvan,Yann,Ricardo,Ruben,Noah', 'Müller,Meier,Schmid,Keller,Weber,Huber,Meyer,Schneider,Steiner,Fischer,Gerber,Brunner,Baumann,Frei,Zimmermann,Moser,Widmer,Wyss,Graf,Roth,Favre,Rochat,Bonvin,Fontana,Rossi'];
FB_NAMES.be = [FB_NAMES.nl[0] + ',' + FB_NAMES.fr[0], 'Peeters,Janssens,Maes,Jacobs,Mertens,Willems,Claes,Goossens,Wouters,De Smet,Dubois,Lambert,Dupont,Leclercq,Lemaire,Vermeulen,Van Damme,De Backer,Hermans,Pauwels,Michiels,Desmet,Verbeke,Coppens,Martens'];

// Derbies and big rivalries (club names as in FB_LEAGUES) → special news and commentary
const FB_DERBY = [
  ['Galatasaray', 'Fenerbahçe', 'Kıtalar Arası Derbi'], ['Galatasaray', 'Beşiktaş', 'İstanbul derbisi'], ['Fenerbahçe', 'Beşiktaş', 'İstanbul derbisi'],
  ['Trabzonspor', 'Fenerbahçe', 'Karadeniz–İstanbul randevusu'], ['Trabzonspor', 'Galatasaray', 'Karadeniz–İstanbul randevusu'], ['Trabzonspor', 'Beşiktaş', 'Karadeniz–İstanbul randevusu'],
  ['Arsenal', 'Tottenham', 'Kuzey Londra derbisi'], ['Liverpool', 'Everton', 'Merseyside derbisi'], ['Manchester City', 'Manchester United', 'Manchester derbisi'], ['Liverpool', 'Manchester United', 'Kuzeyin büyük maçı'],
  ['Real Madrid', 'Barcelona', 'El Clásico'], ['Real Madrid', 'Atlético Madrid', 'Madrid derbisi'], ['Real Betis', 'Sevilla', 'Sevilla derbisi'],
  ['Inter', 'Milan', 'Milano derbisi'], ['Roma', 'Lazio', 'Roma derbisi'], ['Juventus', 'Torino', 'Torino derbisi'], ['Juventus', 'Inter', "Derby d'Italia"],
  ['Paris Saint-Germain', 'Marseille', 'Le Classique'], ['Bayern München', 'Borussia Dortmund', 'Der Klassiker'],
  ['Benfica', 'Porto', 'O Clássico'], ['Benfica', 'Sporting CP', 'Lizbon derbisi'], ['Porto', 'Sporting CP', 'Portekiz devleri'],
  ['Ajax', 'Feyenoord', 'De Klassieker'], ['Ajax', 'PSV', 'Hollanda devleri'], ['Club Brugge', 'Anderlecht', 'Belçika klasiği'],
  ['Celtic', 'Rangers', 'Old Firm'], ['Hearts', 'Hibernian', 'Edinburgh derbisi'], ['Dundee', 'Dundee United', 'Dundee derbisi'], ['Aberdeen', 'Rangers', 'İskoç kuzey–güney çekişmesi'],
  ['Rapid Wien', 'Austria Wien', 'Viyana derbisi'], ['Sturm Graz', 'Grazer AK', 'Graz derbisi'], ['RB Salzburg', 'Rapid Wien', 'Avusturya devleri'],
  ['Basel', 'Zürich', 'İsviçre klasiği'], ['Zürich', 'Grasshopper', 'Zürih derbisi'], ['Servette', 'Lausanne-Sport', 'Romandie derbisi'], ['Young Boys', 'Basel', 'İsviçre zirve maçı'],
  ['Olympiacos', 'Panathinaikos', 'Ezeli rakipler derbisi'], ['AEK Athens', 'Panathinaikos', 'Atina derbisi'], ['AEK Athens', 'Olympiacos', 'Atina–Pire derbisi'], ['PAOK', 'Aris', 'Selanik derbisi'], ['PAOK', 'Olympiacos', 'Kuzey–güney derbisi'],
  ['FC København', 'Brøndby', 'New Firm (Kopenhag derbisi)'], ['Midtjylland', 'FC København', 'Danimarka zirvesi'], ['AGF', 'Randers', 'Doğu Jutland derbisi'],
  ['Rosenborg', 'Molde', 'Norveç klasiği'], ['Spartak Moskova', 'CSKA Moskova', 'Moskova derbisi'], ['Qarabağ', 'Neftçi', 'Bakü klasiği']
];
