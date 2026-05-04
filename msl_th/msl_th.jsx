import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { Trophy, Activity, Zap, Lock, Unlock, ShieldAlert, Lightbulb, BarChart3, LineChart, Search, Map as MapIcon, Crown, Gem, Ban, Users, X } from 'lucide-react';

// ============================================================================
// KONFIGURASI DATABASE & SPREADSHEET (MSL THAILAND)
// ============================================================================
const CUSTOM_FIREBASE_CONFIG = {
  apiKey: "AIzaSyC6sj2eCAbg-IZTUYHxbSzEnAnUfba_gQ4",
  authDomain: "mpl-predictor-1ec.firebaseapp.com",
  projectId: "mpl-predictor-1ec",
  storageBucket: "mpl-predictor-1ec.firebasestorage.app",
  messagingSenderId: "224310331537",
  appId: "1:224310331537:web:4a5de42403b753b326d730"
};
const CUSTOM_APP_ID = "msl-th-custom";
const SPREADSHEET_API_URL = "https://script.google.com/macros/s/AKfycbyTnSaE0XDkrGJvQq0QM0oznK65v9E6FXX1uh-rSQXoSdpE4jKdQidCpjjYfLC9EIiT/exec";

// ============================================================================
// DATA MASTER & KAMUS TIM (10 TIM MSL THAILAND)
// ============================================================================
const INITIAL_TEAMS = ['ACT', 'BAC', 'BRU', 'EA', 'FS', 'HD', 'KOG', 'SLX', 'TNC', 'VTE'];

const TEAM_DETAILS = {
  'ACT': { full: 'ACT Esports Club', logo: 'https://cdn.jsdelivr.net/gh/Davton90/mplddd@main/msl_th_team_icon/ACT%20ESPORTS%20CLUB.png' },
  'BAC': { full: 'Bacon Time', logo: 'https://cdn.jsdelivr.net/gh/Davton90/mplddd@main/msl_th_team_icon/BACON%20TIME.png' },
  'BRU': { full: 'Buriram United Esports', logo: 'https://cdn.jsdelivr.net/gh/Davton90/mplddd@main/msl_th_team_icon/BURIRAM%20UNITED%20ESPORTS.png' },
  'EA': { full: 'eArena', logo: 'https://cdn.jsdelivr.net/gh/Davton90/mplddd@main/msl_th_team_icon/EARENA.png' },
  'FS': { full: 'Full Sense', logo: 'https://cdn.jsdelivr.net/gh/Davton90/mplddd@main/msl_th_team_icon/FULL%20SENSE.png' },
  'HD': { full: 'Hydra Esports', logo: 'https://cdn.jsdelivr.net/gh/Davton90/mplddd@main/msl_th_team_icon/HYDRA.png' },
  'KOG': { full: 'King of Gamers Club', logo: 'https://cdn.jsdelivr.net/gh/Davton90/mplddd@main/msl_th_team_icon/KING%20OF%20GAMERS%20CLUB.png' },
  'SLX': { full: 'Solyx', logo: 'https://cdn.jsdelivr.net/gh/Davton90/mplddd@main/msl_th_team_icon/SOLYX.png' },
  'TNC': { full: 'Tenacity', logo: 'https://cdn.jsdelivr.net/gh/Davton90/mplddd@main/msl_th_team_icon/TENACITY.png' },
  'VTE': { full: 'Valee Thai Esports', logo: 'https://cdn.jsdelivr.net/gh/Davton90/mplddd@main/msl_th_team_icon/VALEE%20THAI%20ESPORTS.png' }
};

const TM = {
  'ACT': 'ACT', 'ACT ESPORTS CLUB': 'ACT', 'ACT ESPORTS': 'ACT',
  'BAC': 'BAC', 'BACON TIME': 'BAC', 'BACON': 'BAC',
  'BRU': 'BRU', 'BURIRAM UNITED ESPORTS': 'BRU', 'BURIRAM UNITED': 'BRU', 'BURIRAM': 'BRU',
  'EA': 'EA', 'EARENA': 'EA',
  'FS': 'FS', 'FULL SENSE': 'FS',
  'HD': 'HD', 'HYDRA': 'HD', 'HYDRA ESPORTS': 'HD',
  'KOG': 'KOG', 'KING OF GAMERS CLUB': 'KOG', 'KING OF GAMERS': 'KOG',
  'SLX': 'SLX', 'SOLYX': 'SLX', 'SOLIX': 'SLX',
  'TNC': 'TNC', 'TENACITY': 'TNC', 'TEN': 'TNC',
  'VTE': 'VTE', 'VALEE THAI ESPORTS': 'VTE', 'VALEE': 'VTE', 'VLTH': 'VTE'
};

const HERO_ROLES = {
  "EXP Lane": ["Aldous", "Alice", "Argus", "Arlott", "Badang", "Benedetta", "Chou", "Cici", "Dyrroth", "Edith", "Esmeralda", "Freya", "Gloo", "Guinevere", "Lapu-Lapu", "Lukas", "Masha", "Minsitthar", "Paquito", "Phoveus", "Ruby", "Silvanna", "Sora", "Sun", "Terizla", "Thamuz", "Uranus", "X.Borg", "Yu Zhong", "Zilong"],
  "Jungle": ["Aamon", "Alpha", "Alucard", "Aulus", "Balmond", "Bane", "Barats", "Baxia", "Fanny", "Fredrinn", "Gusion", "Hanzo", "Harley", "Hayabusa", "Helcurt", "Joy", "Julian", "Karina", "Lancelot", "Leomord", "Ling", "Martis", "Natalia", "Nolan", "Popol and Kupa", "Roger", "Saber", "Suyou", "Yi Sun-shin", "Yin"],
  "Mid Lane": ["Aurora", "Cecilion", "Chang'e", "Cyclops", "Eudora", "Faramis", "Gord", "Kadita", "Kagura", "Kimmy", "Lunox", "Luo Yi", "Lylia", "Nana", "Novaria", "Odette", "Pharsa", "Selena", "Vale", "Valentina", "Valir", "Vexana", "Xavier", "Yve", "Zetian", "Zhask", "Zhuxin"],
  "Gold Lane": ["Beatrix", "Brody", "Bruno", "Claude", "Clint", "Granger", "Hanabi", "Harith", "Irithel", "Ixia", "Karrie", "Layla", "Lesley", "Melissa", "Miya", "Moskov", "Natan", "Obsidia", "Wanwan"],
  "Roam": ["Akai", "Angela", "Atlas", "Belerick", "Carmilla", "Chip", "Diggie", "Estes", "Floryn", "Franco", "Gatotkaca", "Grock", "Hilda", "Hylos", "Jawhead", "Johnson", "Kaja", "Kalea", "Khaleed", "Khufra", "Lolita", "Marcel", "Mathilda", "Minotaur", "Rafaela", "Tigreal"]
};
const MAP_LIST = ["Broken Walls", "Dangerous Grass", "Expanding Rivers", "Flying Cloud"];

const getHeroIcon = (name) => `https://cdn.jsdelivr.net/gh/Davton90/Js-Hero@main/Hero%20icon/${encodeURIComponent(name)}.png`;

// JADWAL WEEK 1 - 3 (LOCKED HISTORY, 24 Laga)
const history = [
    // Week 1
    { id: 1, w: 1, t1: 'BAC', t2: 'FS', s1: 2, s2: 1 },
    { id: 2, w: 1, t1: 'HD', t2: 'VTE', s1: 0, s2: 2 },
    { id: 3, w: 1, t1: 'ACT', t2: 'TNC', s1: 2, s2: 0 },
    { id: 4, w: 1, t1: 'KOG', t2: 'SLX', s1: 2, s2: 0 },
    { id: 5, w: 1, t1: 'BRU', t2: 'HD', s1: 2, s2: 0 },
    { id: 6, w: 1, t1: 'TNC', t2: 'SLX', s1: 2, s2: 0 },
    { id: 7, w: 1, t1: 'EA', t2: 'VTE', s1: 0, s2: 2 },
    { id: 8, w: 1, t1: 'FS', t2: 'ACT', s1: 0, s2: 2 },
    // Week 2
    { id: 9, w: 2, t1: 'FS', t2: 'VTE', s1: 0, s2: 2 },
    { id: 10, w: 2, t1: 'KOG', t2: 'TNC', s1: 2, s2: 1 },
    { id: 11, w: 2, t1: 'BAC', t2: 'ACT', s1: 2, s2: 1 },
    { id: 12, w: 2, t1: 'EA', t2: 'SLX', s1: 0, s2: 2 },
    { id: 13, w: 2, t1: 'EA', t2: 'TNC', s1: 0, s2: 2 },
    { id: 14, w: 2, t1: 'BRU', t2: 'FS', s1: 0, s2: 2 },
    { id: 15, w: 2, t1: 'BAC', t2: 'HD', s1: 2, s2: 0 },
    { id: 16, w: 2, t1: 'KOG', t2: 'VTE', s1: 2, s2: 0 },
    // Week 3
    { id: 17, w: 3, t1: 'FS', t2: 'HD', s1: 1, s2: 2 },
    { id: 18, w: 3, t1: 'VTE', t2: 'ACT', s1: 0, s2: 2 },
    { id: 19, w: 3, t1: 'BAC', t2: 'SLX', s1: 2, s2: 1 },
    { id: 20, w: 3, t1: 'BRU', t2: 'EA', s1: 2, s2: 0 },
    { id: 21, w: 3, t1: 'BRU', t2: 'ACT', s1: 2, s2: 0 },
    { id: 22, w: 3, t1: 'EA', t2: 'FS', s1: 2, s2: 0 },
    { id: 23, w: 3, t1: 'HD', t2: 'TNC', s1: 0, s2: 2 },
    { id: 24, w: 3, t1: 'BAC', t2: 'KOG', s1: 0, s2: 2 },
];

// JADWAL WEEK 4 - 5 (UPCOMING, 21 Laga)
const schedule = [
    { w: 4, m: [['ACT', 'HD'], ['VTE', 'TNC'], ['EA', 'KOG'], ['FS', 'SLX'], ['VTE', 'SLX'], ['KOG', 'HD'], ['BRU', 'TNC'], ['BAC', 'EA'], ['EA', 'ACT'], ['FS', 'TNC'], ['HD', 'SLX'], ['BRU', 'KOG']] },
    { w: 5, m: [['BRU', 'VTE'], ['BAC', 'TNC'], ['KOG', 'ACT'], ['EA', 'HD'], ['BRU', 'SLX'], ['BAC', 'VTE'], ['KOG', 'FS'], ['ACT', 'SLX'], ['BRU', 'BAC']] }
];

export default function MSLThailandPredictor() {
  const [activeTab, setActiveTab] = useState('standings'); 
  
  const [matches, setMatches] = useState([]);
  const [teams] = useState(INITIAL_TEAMS);
  const [isAdmin, setIsAdmin] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Memuat Data...');
  const [probs, setProbs] = useState({});
  
  const [globalScores, setGlobalScores] = useState({});
  const [globalDrafts, setGlobalDrafts] = useState({}); 
  
  const [db, setDb] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(1);

  // ANALYTICS STATES
  const [mapFilter, setMapFilter] = useState('ALL MAPS');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [searchHero, setSearchHero] = useState('');
  
  const [minPicksFilter, setMinPicksFilter] = useState(0);
  const [minWRFilter, setMinWRFilter] = useState(0);
  const [tierFilter, setTierFilter] = useState('All Tiers');
  const [matrixSort, setMatrixSort] = useState({ key: 'impact', desc: true });
  
  const [heroDetailModal, setHeroDetailModal] = useState(null);
  const [heroDetailMapFilter, setHeroDetailMapFilter] = useState('ALL MAPS');
  
  const [teamDetailModal, setTeamDetailModal] = useState(null);
  const [teamCompareTeam, setTeamCompareTeam] = useState('ALL TEAMS');
  const [teamDetailMapFilter, setTeamDetailMapFilter] = useState('ALL MAPS');

  // STATES UNTUK TOOLTIP HOVER VS
  const [hoverDraftId, setHoverDraftId] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef(null);

  const baseMatchesRef = useRef([]);
  const lastSpreadsheetDataStr = useRef('');

  // ============================================================================
  // HIDE POPUP ON SCROLL LOGIC
  // ============================================================================
  useEffect(() => {
    const handleScroll = (e) => {
        if (hoverDraftId) {
            if (e.target && e.target.closest && e.target.closest('.draft-popup-container')) {
                return;
            }
            setHoverDraftId(null);
        }
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [hoverDraftId]);

  // ============================================================================
  // INIT DATA & REAL-TIME POLLING
  // ============================================================================
  useEffect(() => {
    let tempMatches = [];
    let idCounter = 1;
    let unsubscribeScores = null;
    let unsubscribeDrafts = null;
    
    history.forEach(m => {
      tempMatches.push({ ...m, fixed: true, _original: true });
      idCounter = Math.max(idCounter, m.id) + 1;
    });

    schedule.forEach(w => {
      w.m.forEach(mPairs => {
        tempMatches.push({ id: idCounter++, w: w.w, t1: TM[mPairs[0]] || mPairs[0], t2: TM[mPairs[1]] || mPairs[1], s1: null, s2: null, fixed: false, _original: false });
      });
    });
    
    baseMatchesRef.current = tempMatches;
    setMatches(tempMatches);

    const firstUnplayed = tempMatches.find(m => !m.fixed);
    if (firstUnplayed) setSelectedWeek(firstUnplayed.w);
    else setSelectedWeek(5); // MSL Max 5 Weeks

    const initFirebase = async () => {
      try {
        const apps = getApps();
        let app = apps.find(a => a.name === "MSL_TH_DB");
        if (!app) app = initializeApp(CUSTOM_FIREBASE_CONFIG, "MSL_TH_DB");
        
        const firestore = getFirestore(app);
        const auth = getAuth(app);
        setDb(firestore);

        try { await signInAnonymously(auth); } catch(e) {}
        
        unsubscribeScores = onSnapshot(doc(firestore, 'artifacts', CUSTOM_APP_ID, 'public', 'data', 'msl_th_global', 'official_scores'), (snap) => {
            if (snap.exists()) setGlobalScores(snap.data()?.scores || {});
            setSyncStatus('Server Terhubung • Auto-Sync Aktif');
        }, () => setSyncStatus('Mode Lokal (DB Offline)'));

        unsubscribeDrafts = onSnapshot(doc(firestore, 'artifacts', CUSTOM_APP_ID, 'public', 'data', 'msl_th_global', 'drafts_data'), (snap) => {
            if (snap.exists()) setGlobalDrafts(snap.data()?.drafts || {});
        }, () => {});

      } catch (err) { setSyncStatus('Mode Lokal (DB Offline)'); }
    };

    initFirebase();
    fetchSheetData();

    const interval = setInterval(() => { fetchSheetData(); }, 10000);
    return () => { clearInterval(interval); if(unsubscribeScores) unsubscribeScores(); if(unsubscribeDrafts) unsubscribeDrafts(); };
  }, []);

  // ============================================================================
  // FETCH SPREADSHEET (DYNAMIC OVERRIDE)
  // ============================================================================
  const fetchSheetData = async () => {
    try {
      const res = await fetch(SPREADSHEET_API_URL + (SPREADSHEET_API_URL.includes('?') ? '&' : '?') + `nocache=${Date.now()}`);
      const text = await res.text();
      let dataRows = [];

      try {
        const jsonData = JSON.parse(text);
        dataRows = jsonData.map(row => ({ t1Raw: row.t1, s1Raw: row.s1, s2Raw: row.s2, t2Raw: row.t2 }));
      } catch (e) {
        const lines = text.split(/\r?\n/).slice(3).map(l => l.trim()).filter(l => l);
        lines.forEach(line => {
          const tokens = line.split(',').map(t => t.trim().replace(/"/g, ''));
          if (tokens.length >= 9) dataRows.push({ t1Raw: tokens[4], s1Raw: tokens[5], s2Raw: tokens[7], t2Raw: tokens[8] });
        });
      }

      const dataStr = JSON.stringify(dataRows);
      if (dataStr === lastSpreadsheetDataStr.current) return;
      lastSpreadsheetDataStr.current = dataStr;

      applySpreadsheetData(dataRows);
    } catch (err) { console.warn("Gagal fetch Spreadsheet"); }
  };

  const applySpreadsheetData = useCallback((dataRows) => {
    setMatches(prevMatches => {
      let newMatches = JSON.parse(JSON.stringify(baseMatchesRef.current));
      
      let matchIdCounter = 1;

      dataRows.forEach((row) => {
        const { t1Raw, s1Raw, s2Raw, t2Raw } = row;
        if (!t1Raw || !t2Raw) return;

        let t1Str = null, t2Str = null;
        let upT1 = String(t1Raw).toUpperCase(); let matchedT1Key = Object.keys(TM).find(k => upT1 === k || upT1.includes(k));
        if (matchedT1Key) t1Str = TM[matchedT1Key];

        let upT2 = String(t2Raw).toUpperCase(); let matchedT2Key = Object.keys(TM).find(k => upT2 === k || upT2.includes(k));
        if (matchedT2Key) t2Str = TM[matchedT2Key];

        if (t1Str && t2Str) {
          let currentMatchId = matchIdCounter++; 
          let targetMatch = newMatches.find(m => m.id === currentMatchId);
          
          if (targetMatch) {
            targetMatch.t1 = t1Str;
            targetMatch.t2 = t2Str;
            
            let s1 = null, s2 = null;
            if (/^[012]$/.test(String(s1Raw).trim())) s1 = parseInt(String(s1Raw).trim());
            if (/^[012]$/.test(String(s2Raw).trim())) s2 = parseInt(String(s2Raw).trim());

            if (s1 !== null && s2 !== null && (s1 > 0 || s2 > 0)) {
              if (s1 + s2 <= 3 && !(s1 === 2 && s2 === 2)) {
                targetMatch.s1 = s1; targetMatch.s2 = s2;
                targetMatch.fixed = (s1 === 2 || s2 === 2);
              }
            }
          }
        }
      });
      return newMatches;
    });
  }, []);

  const mergedMatches = useMemo(() => {
    return matches.map(m => {
      if (globalScores[m.id]) return { ...m, s1: globalScores[m.id].s1, s2: globalScores[m.id].s2, fixed: true };
      return m;
    });
  }, [matches, globalScores]);

  // ============================================================================
  // KALKULASI KLASEMEN & MONTE CARLO (10 TIM)
  // ============================================================================
  const calculateStandings = useCallback((matchData) => {
    let s = {};
    teams.forEach(t => s[t] = { n: t, mw: 0, ml: 0, gw: 0, gl: 0, pts: 0, h2h: {} });
    teams.forEach(t1 => teams.forEach(t2 => s[t1].h2h[t2] = 0));

    matchData.forEach(m => {
      if (m.s1 !== null && m.s2 !== null) {
        s[m.t1].gw += m.s1; s[m.t1].gl += m.s2;
        s[m.t2].gw += m.s2; s[m.t2].gl += m.s1;
        if (m.s1 === 2 || m.s2 === 2) {
          if (m.s1 === 2) { s[m.t1].mw++; s[m.t2].ml++; s[m.t1].pts++; s[m.t1].h2h[m.t2]++; } 
          else { s[m.t2].mw++; s[m.t1].ml++; s[m.t2].pts++; s[m.t2].h2h[m.t1]++; }
        }
      }
    });

    return Object.values(s).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts; 
      const diffA = a.gw - a.gl; const diffB = b.gw - b.gl;
      if (diffB !== diffA) return diffB - diffA; 
      const h2hDiff = b.h2h[a.n] - a.h2h[b.n];
      if (h2hDiff !== 0) return h2hDiff; 
      return a.n.localeCompare(b.n); 
    }).map((t, i) => ({ ...t, rank: i + 1 }));
  }, [teams]);

  const currentStandings = useMemo(() => calculateStandings(mergedMatches), [mergedMatches, calculateStandings]);

  useEffect(() => {
    if (mergedMatches.length === 0 || teams.length === 0) return;
    setIsCalculating(true);

    setTimeout(() => {
      const iterations = 50000;
      let counts = {};
      teams.forEach(t => counts[t] = { upper: 0, playoff: 0, elim: 0 });

      const teamIndices = {};
      teams.forEach((t, i) => teamIndices[t] = i);

      const baseMw = new Int32Array(10); const baseGw = new Int32Array(10); const baseGl = new Int32Array(10);
      const baseH2h = Array.from({length: 10}, () => new Int32Array(10));
      const unplayed = [];

      mergedMatches.forEach(m => {
        const t1 = teamIndices[m.t1]; const t2 = teamIndices[m.t2];
        if (m.s1 !== null && m.s2 !== null && (m.s1 === 2 || m.s2 === 2)) {
            baseGw[t1] += m.s1; baseGl[t1] += m.s2; baseGw[t2] += m.s2; baseGl[t2] += m.s1;
            if (m.s1 === 2) { baseMw[t1]++; baseH2h[t1][t2]++; } else { baseMw[t2]++; baseH2h[t2][t1]++; }
        } else {
            unplayed.push({ t1, t2, curS1: m.s1 || 0, curS2: m.s2 || 0 });
        }
      });

      const unplayedLen = unplayed.length;
      const simMw = new Int32Array(10); const simGw = new Int32Array(10); const simGl = new Int32Array(10);
      const simH2h = new Int32Array(100);
      const baseH2hFlat = new Int32Array(100);
      for(let i=0; i<10; i++) for(let j=0; j<10; j++) baseH2hFlat[i*10+j] = baseH2h[i][j];

      const standings = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

      for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < 10; i++) { simMw[i] = baseMw[i]; simGw[i] = baseGw[i]; simGl[i] = baseGl[i]; }
        for (let i = 0; i < 100; i++) simH2h[i] = baseH2hFlat[i];

        for (let i = 0; i < unplayedLen; i++) {
          const m = unplayed[i];
          let s1 = m.curS1; let s2 = m.curS2;
          while (s1 < 2 && s2 < 2) { if (Math.random() > 0.5) s1++; else s2++; }
          simGw[m.t1] += s1; simGl[m.t1] += s2; simGw[m.t2] += s2; simGl[m.t2] += s1;
          if (s1 === 2) { simMw[m.t1]++; simH2h[m.t1 * 10 + m.t2]++; } else { simMw[m.t2]++; simH2h[m.t2 * 10 + m.t1]++; }
        }

        standings.sort((a, b) => {
          if (simMw[b] !== simMw[a]) return simMw[b] - simMw[a];
          const gdA = simGw[a] - simGl[a]; const gdB = simGw[b] - simGl[b];
          if (gdB !== gdA) return gdB - gdA;
          const h2hDiff = simH2h[b * 10 + a] - simH2h[a * 10 + b];
          if (h2hDiff !== 0) return h2hDiff;
          return teams[a].localeCompare(teams[b]);
        });

        for (let i = 0; i < 10; i++) {
          const teamName = teams[standings[i]];
          if (i < 2) counts[teamName].upper++;
          if (i < 6) counts[teamName].playoff++; 
          if (i >= 6) counts[teamName].elim++;
        }
      }

      let newProbs = {};
      teams.forEach(t => {
        newProbs[t] = {
            upper: ((counts[t].upper / iterations) * 100).toFixed(1),
            playoff: ((counts[t].playoff / iterations) * 100).toFixed(1),
            elim: ((counts[t].elim / iterations) * 100).toFixed(1)
        };
      });
      setProbs(newProbs);
      setIsCalculating(false);
    }, 50);
  }, [mergedMatches, teams]);

  // ============================================================================
  // ANALYTICS DATA PROCESSING & COMBINATIONS
  // ============================================================================
  const heroRolesMap = useMemo(() => {
    let map = {};
    Object.entries(HERO_ROLES).forEach(([role, heroes]) => {
      heroes.forEach(h => map[h] = role);
    });
    return map;
  }, []);

  const mapRoleAbbr = (role) => {
    if (role === 'Jungle' || role === 'Gold Lane') return 'Core';
    if (role === 'EXP Lane') return 'Exp';
    if (role === 'Mid Lane') return 'Mid';
    if (role === 'Roam') return 'Roam';
    return 'Flex';
  };

  const getCombinations = (arr, k) => {
    const results = [];
    const helper = (start, combo) => {
      if (combo.length === k) { results.push(combo); return; }
      for (let i = start; i < arr.length; i++) helper(i + 1, [...combo, arr[i]]);
    };
    helper(0, []);
    return results;
  };

  const IN_GAME_ROLES = ['EXP', 'JUNGLER', 'MID LANE', 'GOLDLANE', 'ROAM'];

  const analytics = useMemo(() => {
    let totalGames = 0;
    let blueWins = 0; let redWins = 0;
    let totalSeconds = 0; let validDurationCount = 0;
    
    let hMap = {}; 
    let tStats = {}; 
    let comboMap = {}; 

    Object.keys(HERO_ROLES).forEach(role => {
      HERO_ROLES[role].forEach(hero => {
        hMap[hero] = { name: hero, role, picks: 0, bans: 0, wins: 0, losses: 0, bluePicks: 0, redPicks: 0 };
      });
    });

    Object.entries(globalDrafts).forEach(([matchId, games]) => {
      const matchInfo = baseMatchesRef.current.find(m => m.id == matchId);
      const t1 = matchInfo ? matchInfo.t1 : 'T1';
      const t2 = matchInfo ? matchInfo.t2 : 'T2';

      if (!tStats[t1]) tStats[t1] = { slots: [{}, {}, {}, {}, {}] };
      if (!tStats[t2]) tStats[t2] = { slots: [{}, {}, {}, {}, {}] };

      games.forEach(g => {
        if (mapFilter !== 'ALL MAPS' && g.map !== mapFilter) return; 
        
        totalGames++;
        if (g.t1Side === 'blue' && g.t1Result === 'W') blueWins++;
        if (g.t2Side === 'blue' && g.t2Result === 'W') blueWins++;
        if (g.t1Side === 'red' && g.t1Result === 'W') redWins++;
        if (g.t2Side === 'red' && g.t2Result === 'W') redWins++;

        if (g.duration) {
          const parts = g.duration.split(':');
          if (parts.length === 2) {
            totalSeconds += (parseInt(parts[0]) * 60) + parseInt(parts[1]);
            validDurationCount++;
          }
        }

        const processPicks = (picks, team, result, side) => {
          picks.forEach((h, idx) => {
            if (!h) return;
            if (idx < 5) tStats[team].slots[idx][h] = (tStats[team].slots[idx][h] || 0) + 1;

            if (!hMap[h]) return;
            hMap[h].picks++;
            if (result === 'W') hMap[h].wins++; else if (result === 'L') hMap[h].losses++;
            if (side === 'blue') hMap[h].bluePicks++; else hMap[h].redPicks++;
          });

          const validPicks = picks.filter(Boolean).sort();
          if (validPicks.length >= 3) {
             const combs = getCombinations(validPicks, 3);
             combs.forEach(c => {
                const key = c.join('|');
                if(!comboMap[key]) comboMap[key] = { heroes: c, picks: 0, wins: 0 };
                comboMap[key].picks++;
                if(result === 'W') comboMap[key].wins++;
             });
          }
        };

        processPicks(g.t1Picks, t1, g.t1Result, g.t1Side);
        processPicks(g.t2Picks, t2, g.t2Result, g.t2Side);

        const processBans = (bans) => {
          bans.forEach(h => { if (h && hMap[h]) hMap[h].bans++; });
        };
        processBans(g.t1Bans);
        processBans(g.t2Bans);
      });
    });

    Object.keys(tStats).forEach(team => {
      tStats[team].topBySlot = tStats[team].slots.map(slotObj => {
         const entries = Object.entries(slotObj);
         if (entries.length === 0) return null;
         entries.sort((a,b) => b[1] - a[1]);
         return { name: entries[0][0], count: entries[0][1] };
      });
    });

    let avgTime = "00:00";
    if (validDurationCount > 0) {
      let avgSec = Math.floor(totalSeconds / validDurationCount);
      let m = Math.floor(avgSec / 60); let s = avgSec % 60;
      avgTime = `${m}:${s.toString().padStart(2, '0')}`;
    }

    let bWR = totalGames > 0 ? ((blueWins / totalGames) * 100).toFixed(1) : 0;
    let rWR = totalGames > 0 ? ((redWins / totalGames) * 100).toFixed(1) : 0;

    let maxPresence = 0;
    let maxWR = 0;
    let hArr = Object.values(hMap).filter(h => h.picks > 0 || h.bans > 0).map(h => {
      const presence = totalGames > 0 ? ((h.picks + h.bans) / totalGames) * 100 : 0;
      const wr = h.picks > 0 ? (h.wins / h.picks) * 100 : 0;
      const impact = (h.picks * (wr/100)) + (h.bans * 0.5); 
      
      if (presence > maxPresence) maxPresence = presence;
      if (wr > maxWR) maxWR = wr;

      let tier = 'NICHE / WEAK';
      if (presence >= 20 && wr >= 50) tier = 'META DOMINANT';
      else if (presence >= 20 && wr < 50) tier = 'OVERRATED';
      else if (presence < 20 && wr >= 50) tier = 'HIDDEN GEM';

      return { ...h, presence, wr, impact, tier };
    }).sort((a, b) => b.impact - a.impact);

    let mostPicked = hArr.sort((a, b) => b.picks - a.picks)[0];
    let mostBanned = [...hArr].sort((a, b) => b.bans - a.bans)[0];
    hArr.sort((a, b) => b.impact - a.impact);

    let sTier = hArr.filter(h => h.tier === 'META DOMINANT').slice(0, 5);
    let aTier = hArr.filter(h => h.tier === 'HIDDEN GEM' && h.picks >= 3).slice(0, 5);

    let displayArr = hArr.filter(h => {
       if (roleFilter !== 'All Roles' && h.role !== roleFilter) return false;
       if (searchHero && !h.name.toLowerCase().includes(searchHero.toLowerCase())) return false;
       if (h.picks < minPicksFilter) return false;
       if (h.wr < minWRFilter) return false;
       if (tierFilter !== 'All Tiers' && h.tier !== tierFilter) return false;
       return true;
    });

    let synergyArr = Object.values(comboMap)
      .map(c => ({
        ...c,
        wr: c.picks > 0 ? (c.wins / c.picks) * 100 : 0,
        roles: c.heroes.map(h => mapRoleAbbr(hMap[h]?.role)).join(' / ')
      }))
      .filter(c => c.picks >= 2) 
      .sort((a, b) => b.wr - a.wr || b.picks - a.picks)
      .slice(0, 10); 

    return { totalGames, avgTime, bWR, rWR, mostPicked, mostBanned, sTier, aTier, hArr, displayArr, tStats, maxPresence, synergyArr };
  }, [globalDrafts, mapFilter, roleFilter, searchHero, minPicksFilter, minWRFilter, tierFilter]);

  // ============================================================================
  // HERO DETAILED STATS (KLIK HERO POPUP)
  // ============================================================================
  const heroDetailData = useMemo(() => {
    if (!heroDetailModal) return null;
    const hero = heroDetailModal;

    let byTeam = {};
    let withHero = {};
    let againstHero = {};

    Object.entries(globalDrafts).forEach(([mId, games]) => {
        const matchInfo = baseMatchesRef.current.find(x => x.id == mId);
        if (!matchInfo) return;

        games.forEach(g => {
            if (heroDetailMapFilter !== 'ALL MAPS' && g.map !== heroDetailMapFilter) return;

            let t1Has = g.t1Picks.includes(hero);
            let t2Has = g.t2Picks.includes(hero);
            if (!t1Has && !t2Has) return;

            let myTeamStr = t1Has ? matchInfo.t1 : matchInfo.t2;
            let myRes = t1Has ? g.t1Result : g.t2Result;
            let myPicks = t1Has ? g.t1Picks : g.t2Picks;
            let oppPicks = t1Has ? g.t2Picks : g.t1Picks;

            if (!byTeam[myTeamStr]) byTeam[myTeamStr] = { name: myTeamStr, total: 0, w: 0, l: 0 };
            byTeam[myTeamStr].total++;
            if (myRes === 'W') byTeam[myTeamStr].w++; else if (myRes === 'L') byTeam[myTeamStr].l++;

            myPicks.forEach(h => {
                if (h && h !== hero) {
                    if (!withHero[h]) withHero[h] = { name: h, total: 0, w: 0, l: 0 };
                    withHero[h].total++;
                    if (myRes === 'W') withHero[h].w++; else if (myRes === 'L') withHero[h].l++;
                }
            });

            oppPicks.forEach(h => {
                if (h && h !== hero) {
                    if (!againstHero[h]) againstHero[h] = { name: h, total: 0, w: 0, l: 0 };
                    againstHero[h].total++;
                    if (myRes === 'W') againstHero[h].w++; else if (myRes === 'L') againstHero[h].l++;
                }
            });
        });
    });

    const processStats = (obj) => Object.values(obj)
        .map(x => ({ ...x, wr: x.total > 0 ? ((x.w / x.total) * 100).toFixed(2) : 0 }))
        .sort((a, b) => b.total - a.total || b.wr - a.wr)
        .slice(0, 5); 

    return {
        byTeam: processStats(byTeam),
        withHero: processStats(withHero),
        againstHero: processStats(againstHero)
    };
  }, [heroDetailModal, globalDrafts, heroDetailMapFilter]);

  // ============================================================================
  // TEAM DETAILED STATS (KLIK TEAM POPUP)
  // ============================================================================
  const teamDetailData = useMemo(() => {
    if (!teamDetailModal) return null;
    const team1 = teamDetailModal;
    const team2 = teamCompareTeam === 'ALL TEAMS' ? null : teamCompareTeam;
    const mapFilter = teamDetailMapFilter;

    let t1Slots = [{}, {}, {}, {}, {}];
    let t2Slots = [{}, {}, {}, {}, {}];

    Object.entries(globalDrafts).forEach(([mId, games]) => {
        const matchInfo = baseMatchesRef.current.find(x => x.id == mId);
        if (!matchInfo) return;

        if (team2) {
            if (!((matchInfo.t1 === team1 && matchInfo.t2 === team2) || (matchInfo.t1 === team2 && matchInfo.t2 === team1))) return;
        } else {
            if (matchInfo.t1 !== team1 && matchInfo.t2 !== team1) return;
        }

        games.forEach(g => {
            if (mapFilter !== 'ALL MAPS' && g.map !== mapFilter) return;

            const processTeam = (tName, picks, side, slots) => {
                picks.forEach((h, idx) => {
                    if (!h || idx >= 5) return;
                    slots[idx][h] = (slots[idx][h] || 0) + 1;
                });
            };

            if (matchInfo.t1 === team1) processTeam(team1, g.t1Picks, g.t1Side, t1Slots);
            else if (matchInfo.t2 === team1) processTeam(team1, g.t2Picks, g.t2Side, t1Slots);

            if (team2) {
                if (matchInfo.t1 === team2) processTeam(team2, g.t1Picks, g.t1Side, t2Slots);
                else if (matchInfo.t2 === team2) processTeam(team2, g.t2Picks, g.t2Side, t2Slots);
            }
        });
    });

    const formatSlots = (slots) => slots.map(slotObj => {
        return Object.entries(slotObj).sort((a,b) => b[1] - a[1]).map(x => ({ name: x[0], count: x[1] }));
    });

    return { t1: formatSlots(t1Slots), t2: team2 ? formatSlots(t2Slots) : null };
  }, [teamDetailModal, teamCompareTeam, teamDetailMapFilter, globalDrafts]);

  // LOGIKA SORTING DATA MATRIX
  const handleSort = (key) => {
    if (matrixSort.key === key) {
      setMatrixSort({ key, desc: !matrixSort.desc });
    } else {
      setMatrixSort({ key, desc: true });
    }
  };

  const sortedMatrix = useMemo(() => {
    let arr = [...analytics.displayArr];
    arr.sort((a, b) => {
      let valA = a[matrixSort.key];
      let valB = b[matrixSort.key];
      
      if (matrixSort.key === 'tier') {
          const tierVal = { 'META DOMINANT': 3, 'HIDDEN GEM': 2, 'OVERRATED': 1, 'NICHE / WEAK': 0 };
          valA = tierVal[a.tier];
          valB = tierVal[b.tier];
      }

      if (valA < valB) return matrixSort.desc ? 1 : -1;
      if (valA > valB) return matrixSort.desc ? -1 : 1;
      return 0;
    });
    return arr;
  }, [analytics.displayArr, matrixSort]);

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const updateLocalScore = (id, team, val) => {
    const num = val === 'null' ? null : parseInt(val);
    setMatches(prev => prev.map(m => {
      if (m.id === id && !m.fixed) {
        let newM = { ...m };
        if (team === 1) {
            newM.s1 = num;
            if (num === 2) newM.s2 = (newM.s2 === 2 || newM.s2 === null) ? 0 : newM.s2;
            else if (num !== null) newM.s2 = 2;
        } else {
            newM.s2 = num;
            if (num === 2) newM.s1 = (newM.s1 === 2 || newM.s1 === null) ? 0 : newM.s1;
            else if (num !== null) newM.s1 = 2;
        }
        return newM;
      }
      return m;
    }));
  };

  const lockScore = async (id, s1, s2) => {
    setGlobalScores(prev => ({ ...prev, [id]: { s1, s2 } }));
    if (db) {
      try {
        const ref = doc(db, 'artifacts', CUSTOM_APP_ID, 'public', 'data', 'msl_th_global', 'official_scores');
        await setDoc(ref, { scores: { ...globalScores, [id]: { s1, s2 } } }, { merge: true });
      } catch (e) {}
    }
  };

  const unlockScore = async (id) => {
    setGlobalScores(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
    });
    if (db) {
      try {
        const next = { ...globalScores };
        delete next[id];
        const ref = doc(db, 'artifacts', CUSTOM_APP_ID, 'public', 'data', 'msl_th_global', 'official_scores');
        await setDoc(ref, { scores: next });
      } catch (e) {}
    }
  };

  const wipeGhostData = async () => {
    if(!window.confirm("Hapus seluruh skor terkunci dari Layar untuk Week 5 s/d 8?")) return;
    const newScores = { ...globalScores };
    for (let i = 25; i <= 56; i++) delete newScores[i];
    setGlobalScores(newScores);
    setMatches(prev => prev.map(m => {
        if (m.id >= 25) return { ...m, s1: null, s2: null, fixed: false };
        return m;
    }));
    alert("✅ Data gaib telah dibersihkan dari layar Anda secara instan!");
    if (db) {
      try {
        const ref = doc(db, 'artifacts', CUSTOM_APP_ID, 'public', 'data', 'msl_th_global', 'official_scores');
        await setDoc(ref, { scores: newScores });
      } catch (e) {}
    }
  };

  const getTeamTip = (t) => {
    const upper = parseFloat(probs[t.n]?.upper || 0); const playoff = parseFloat(probs[t.n]?.playoff || 0);
    const played = t.mw + t.ml; const remaining = 9 - played; // 10 teams single round robin = 9 matches

    if (upper === 100) return { icon: '🏆', text: "Upper Bracket sudah dalam genggaman! Gunakan sisa laga untuk bereksperimen dengan draft dan rotasi roster jelang Playoff.", color: "text-amber-300", bg: "bg-amber-500/10 border-amber-500/30 hover:border-amber-400/60" };
    if (playoff === 100 && upper >= 50) return { icon: '🛡️', text: "Tiket Playoff aman dan peluang Upper Bracket sangat besar. Wajib sapu bersih sisa laga untuk mengunci Top 2.", color: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-400/60" };
    if (playoff === 100 && upper > 0) return { icon: '🔥', text: "Lolos Playoff! Masih ada asa ke Upper Bracket, namun butuh hasil menang 2-0 di sisa laga dan berharap tim Top 2 tersandung.", color: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-400/60" };
    if (playoff === 100 && upper === 0) return { icon: '✅', text: "Lolos ke Playoff, namun peluang Upper Bracket tertutup. Jaga konsistensi dan perbaiki kelemahan sebelum babak eliminasi.", color: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-400/60" };
    if (playoff >= 50) return { icon: '⚔️', text: `Posisi cukup menguntungkan. Dengan sisa ${remaining} laga, fokus raih poin penuh untuk mengunci tiket Playoff lebih awal dan hindari turun rank.`, color: "text-blue-300", bg: "bg-blue-500/10 border-blue-500/30 hover:border-blue-400/60" };
    if (playoff > 0) return { icon: '🚨', text: `Zona bahaya! Peluang menipis. Wajib menyapu bersih sisa ${remaining} pertandingan sambil berharap tim di atas terpeleset.`, color: "text-orange-300", bg: "bg-orange-500/10 border-orange-500/30 hover:border-orange-400/60" };
    return { icon: '❌', text: "Secara matematis tereliminasi dari perebutan Playoff. Saatnya bermain lepas (nothing to lose) dan persiapkan mental untuk musim depan.", color: "text-red-300", bg: "bg-red-500/10 border-red-500/30 hover:border-red-400/60" };
  };

  const getTierClass = (tier) => {
    switch(tier) {
      case 'META DOMINANT': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'HIDDEN GEM': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'OVERRATED': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  // ============================================================================
  // UI COMPONENTS (GLASSMORPHISM)
  // ============================================================================
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-950 via-[#060b14] to-black text-slate-200 font-sans p-4 sm:p-8">
      
      {/* HEADER & TABS NAVBAR */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tighter uppercase italic drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]">
              MSL TH <span className="text-white">Predictor</span>
            </h1>
            <p className="text-blue-200/60 font-medium text-sm tracking-widest mt-1">Glassmorphism Edition • Real-Time JSON API</p>
          </div>
          
          <div className="flex flex-wrap gap-3 items-center">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-xl">
              <div className={`w-2 h-2 rounded-full ${syncStatus.includes('Gagal') || syncStatus.includes('Lokal') || syncStatus.includes('Terputus') ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`}></div>
              <span className="text-xs font-bold text-slate-300">{syncStatus}</span>
            </div>
            <button onClick={() => setIsAdmin(!isAdmin)} className={`px-4 py-2 rounded-2xl text-xs font-bold backdrop-blur-xl transition-all shadow-xl border ${isAdmin ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
              {isAdmin ? 'Admin: ON' : 'Admin Login'}
            </button>
            {isAdmin && (
              <button onClick={wipeGhostData} className="px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-xl bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white flex items-center gap-1.5">
                 <ShieldAlert className="w-3.5 h-3.5" /> Wipe Ghost Matches
              </button>
            )}
          </div>
        </div>

        {/* MAIN TABS */}
        <div className="flex gap-6 border-b border-white/10">
           <button onClick={()=>setActiveTab('standings')} className={`pb-3 px-2 font-black uppercase tracking-widest text-sm flex items-center gap-2 transition-all ${activeTab==='standings' ? 'text-emerald-400 border-b-2 border-emerald-400 shadow-[0_4px_15px_-3px_rgba(52,211,153,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}>
              <LineChart className="w-4 h-4" /> Standings
           </button>
           <button onClick={()=>setActiveTab('analytics')} className={`pb-3 px-2 font-black uppercase tracking-widest text-sm flex items-center gap-2 transition-all ${activeTab==='analytics' ? 'text-emerald-400 border-b-2 border-emerald-400 shadow-[0_4px_15px_-3px_rgba(52,211,153,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}>
              <BarChart3 className="w-4 h-4" /> Hero Statistics
           </button>
        </div>
      </div>

      {activeTab === 'standings' && (
      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-8 animate-fade-in">
        {/* KLASEMEN (STANDINGS) */}
        <div className="xl:col-span-2 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-b from-white/[0.05] to-transparent">
            <h2 className="text-xl font-black tracking-widest uppercase flex items-center gap-2">
              <Trophy className="text-emerald-400 w-5 h-5" /> Regular Season
            </h2>
            {isCalculating && <Activity className="text-blue-400 animate-spin w-5 h-5" />}
          </div>
          
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left whitespace-nowrap text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-white/10 text-xs tracking-widest uppercase">
                  <th className="pb-3 text-center">#</th>
                  <th className="pb-3 px-4">Team</th>
                  <th className="pb-3 text-center">M</th>
                  <th className="pb-3 text-center">G</th>
                  <th className="pb-3 text-center">Diff</th>
                  <th className="pb-3 text-center text-emerald-400">Playoff (Top 6)</th>
                  <th className="pb-3 text-center text-amber-400">Upper</th>
                  <th className="pb-3 text-center text-red-400">Elim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {currentStandings.map((t, i) => (
                  <tr key={t.n} className={`transition-colors hover:bg-white/5 ${i < 2 ? 'bg-amber-500/[0.02]' : (i < 6 ? 'bg-emerald-500/[0.02]' : 'bg-red-500/[0.02]')}`}>
                    <td className="py-3 text-center font-black">
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full mx-auto ${i < 2 ? 'bg-amber-500/20 text-amber-400' : (i < 6 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')}`}>
                        {t.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img src={TEAM_DETAILS[t.n]?.logo} alt={t.n} className="w-7 h-7 object-contain drop-shadow-md" />
                        <span className="font-bold text-white tracking-wide text-[13px]">{TEAM_DETAILS[t.n]?.full || t.n}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center">{t.mw} - {t.ml}</td>
                    <td className="py-3 text-center text-slate-400">{t.gw} - {t.gl}</td>
                    <td className={`py-3 text-center font-bold ${t.gw - t.gl > 0 ? 'text-blue-400' : 'text-slate-500'}`}>{t.gw - t.gl > 0 ? '+' : ''}{t.gw - t.gl}</td>
                    
                    <td className="py-3 px-2">
                      <div className="relative h-6 bg-black/40 rounded-lg overflow-hidden border border-white/5 flex items-center justify-center">
                        <div className="absolute top-0 left-0 bottom-0 bg-emerald-500/40" style={{ width: `${probs[t.n]?.playoff || 0}%` }}></div>
                        <span className="relative z-10 text-[10px] font-black">{probs[t.n]?.playoff || 0}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="relative h-6 bg-black/40 rounded-lg overflow-hidden border border-white/5 flex items-center justify-center">
                        <div className="absolute top-0 left-0 bottom-0 bg-amber-500/40" style={{ width: `${probs[t.n]?.upper || 0}%` }}></div>
                        <span className="relative z-10 text-[10px] font-black">{probs[t.n]?.upper || 0}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="relative h-6 bg-black/40 rounded-lg overflow-hidden border border-white/5 flex items-center justify-center">
                        <div className="absolute top-0 left-0 bottom-0 bg-red-500/40" style={{ width: `${probs[t.n]?.elim || 0}%` }}></div>
                        <span className="relative z-10 text-[10px] font-black">{probs[t.n]?.elim || 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* JADWAL PERTANDINGAN (Per Week) */}
        <div className="xl:col-span-1 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex flex-col overflow-hidden max-h-[800px]">
          <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/[0.05] to-transparent">
            <h2 className="text-xl font-black tracking-widest uppercase flex items-center gap-2">
              <Zap className="text-yellow-400 w-5 h-5" /> Schedule (Week {selectedWeek})
            </h2>
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
              {[1, 2, 3, 4, 5].map(w => (
                 <button 
                   key={w} 
                   onClick={() => setSelectedWeek(w)}
                   className={`px-4 py-1.5 rounded-xl border text-xs font-black transition-all shrink-0 ${
                     selectedWeek === w 
                       ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 border-blue-500' 
                       : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                   }`}
                 >
                   W{w}
                 </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {mergedMatches
              .filter(m => m.w === selectedWeek)
              .sort((a, b) => a.id - b.id)
              .map(m => (
              <div key={m.id} className={`p-4 rounded-2xl border transition-all ${m.fixed ? 'bg-white/[0.02] border-white/10' : 'bg-blue-900/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]'}`}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">W{m.w} / Match {m.id}</span>
                  {m.fixed ? (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-black border border-emerald-500/30">FINAL</span>
                  ) : (
                    <button onClick={() => updateLocalScore(m.id, 1, 'null')} className="text-[9px] bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-2 py-0.5 rounded font-black transition-all">RESET</button>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 relative">
                  <div className="w-[40%] flex items-center justify-end gap-3">
                    <div className="text-right">
                      <div className="font-black text-sm truncate">{m.t1}</div>
                      <div className="text-[8px] text-blue-200/50 uppercase tracking-widest truncate">{TEAM_DETAILS[m.t1]?.full || ''}</div>
                    </div>
                    <img src={TEAM_DETAILS[m.t1]?.logo} alt={m.t1} className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-lg" />
                  </div>
                  
                  {m.fixed ? (
                     <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
                        <span className="font-black text-lg text-emerald-400">{m.s1}</span>
                        <span 
                            className="text-[10px] text-slate-300 font-black bg-white/5 border border-white/10 px-2 py-1 rounded cursor-help transition-all hover:bg-white/10 hover:text-white hover:scale-110 shadow-sm"
                            onMouseEnter={(e) => {
                                clearTimeout(hoverTimeoutRef.current);
                                setHoverDraftId(m.id);
                                setMousePos({ x: e.clientX, y: e.clientY });
                            }}
                            onMouseLeave={() => {
                                hoverTimeoutRef.current = setTimeout(() => setHoverDraftId(null), 300);
                            }}
                        >
                            VS
                        </span>
                        <span className="font-black text-lg text-emerald-400">{m.s2}</span>
                        {isAdmin && !m._original && (
                          <button onClick={() => unlockScore(m.id)} className="ml-2 text-red-400 hover:text-white"><Unlock w={12} h={12}/></button>
                        )}
                     </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <select value={m.s1 === null ? 'null' : m.s1} onChange={(e) => updateLocalScore(m.id, 1, e.target.value)} className="appearance-none bg-[#121826] border border-blue-500/50 text-white font-bold rounded-lg py-1 px-0 w-10 text-center text-sm outline-none cursor-pointer" style={{ textAlignLast: 'center' }}>
                        <option className="bg-[#121826]" value="null">-</option><option className="bg-[#121826]" value="0">0</option><option className="bg-[#121826]" value="1">1</option><option className="bg-[#121826]" value="2">2</option>
                      </select>
                      <span 
                          className="text-[10px] text-slate-300 font-black bg-white/5 border border-white/10 px-2 py-1 rounded cursor-help transition-all hover:bg-white/10 hover:text-white hover:scale-110 shadow-sm"
                          onMouseEnter={(e) => {
                              clearTimeout(hoverTimeoutRef.current);
                              setHoverDraftId(m.id);
                              setMousePos({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseLeave={() => {
                              hoverTimeoutRef.current = setTimeout(() => setHoverDraftId(null), 300);
                          }}
                      >
                          VS
                      </span>
                      <select value={m.s2 === null ? 'null' : m.s2} onChange={(e) => updateLocalScore(m.id, 2, e.target.value)} className="appearance-none bg-[#121826] border border-blue-500/50 text-white font-bold rounded-lg py-1 px-0 w-10 text-center text-sm outline-none cursor-pointer" style={{ textAlignLast: 'center' }}>
                        <option className="bg-[#121826]" value="null">-</option><option className="bg-[#121826]" value="0">0</option><option className="bg-[#121826]" value="1">1</option><option className="bg-[#121826]" value="2">2</option>
                      </select>
                      {isAdmin && m.s1 !== null && m.s2 !== null && (m.s1 === 2 || m.s2 === 2) && (
                         <button onClick={() => lockScore(m.id, m.s1, m.s2)} className="bg-emerald-500 text-white p-1.5 rounded-lg shadow-lg hover:scale-110 transition-transform"><Lock w={12} h={12}/></button>
                      )}
                    </div>
                  )}

                  <div className="w-[40%] flex items-center justify-start gap-3">
                    <img src={TEAM_DETAILS[m.t2]?.logo} alt={m.t2} className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-lg" />
                    <div className="text-left">
                      <div className="font-black text-sm truncate">{m.t2}</div>
                      <div className="text-[8px] text-blue-200/50 uppercase tracking-widest truncate">{TEAM_DETAILS[m.t2]?.full || ''}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* AI TEAM INSIGHTS (Standings Tab) */}
      {activeTab === 'standings' && (
      <div className="max-w-7xl mx-auto mt-8 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-6 md:p-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-white/5 pb-4 gap-4">
          <h2 className="text-2xl font-black tracking-widest uppercase flex items-center gap-3">
            <Lightbulb className="text-amber-400 w-6 h-6" /> AI Team Insights
          </h2>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
             Berdasarkan Probabilitas {isCalculating ? '...' : '50.000'} Iterasi
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentStandings.map((t) => {
             const tip = getTeamTip(t);
             return (
               <div key={t.n} className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${tip.bg} flex flex-col sm:flex-row items-start sm:items-center gap-4 group`}>
                  <div className="w-full sm:w-40 shrink-0 flex items-center gap-3 border-b sm:border-b-0 sm:border-r border-white/10 pb-3 sm:pb-0 pr-0 sm:pr-4">
                     <img src={TEAM_DETAILS[t.n]?.logo} className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-110 transition-transform" alt={t.n} />
                     <div>
                       <h3 className="font-black text-white text-xs sm:text-sm uppercase tracking-widest truncate">{t.n}</h3>
                       <span className="text-[10px] font-bold text-slate-400 tracking-wider">RANK {t.rank}</span>
                     </div>
                  </div>
                  <div className="flex-1">
                     <h4 className="text-[11px] font-black uppercase tracking-widest mb-1.5 opacity-80 flex items-center gap-1.5">
                       {tip.icon} Analisis Prediksi
                     </h4>
                     <p className={`text-xs sm:text-[13px] font-medium leading-relaxed drop-shadow-sm ${tip.color}`}>
                       {tip.text}
                     </p>
                  </div>
               </div>
             );
          })}
        </div>
      </div>
      )}

      {/* ============================================================================ */}
      {/* ANALYTICS TAB (HERO STATISTICS)                                                */}
      {/* ============================================================================ */}
      {activeTab === 'analytics' && (
        <div className="max-w-7xl mx-auto animate-fade-in pb-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                <span className="text-emerald-500">ADVANCED</span> ANALYTICS
              </h2>
              <p className="text-slate-400 text-sm mt-1">Data Meta Hero & Signature Picks MSL THAILAND</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input type="text" placeholder="Cari hero..." value={searchHero} onChange={e => setSearchHero(e.target.value)} 
                        className="bg-white/5 border border-white/10 text-white text-sm rounded-xl py-2 pl-9 pr-4 focus:outline-none focus:border-blue-500 shadow-inner w-48 transition-all" />
              </div>
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-[#121826] border border-white/10 text-white font-bold rounded-xl px-4 py-2 text-sm outline-none cursor-pointer">
                <option className="bg-[#121826]" value="All Roles">All Roles</option>
                {Object.keys(HERO_ROLES).map(r => <option className="bg-[#121826]" key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* Map Filters */}
          <div className="mb-6 flex flex-wrap gap-2">
            <button onClick={() => setMapFilter('ALL MAPS')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all border ${mapFilter === 'ALL MAPS' ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}>
               <MapIcon className="w-4 h-4" /> COMPARE ALL MAPS
            </button>
            {MAP_LIST.map(m => (
              <button key={m} onClick={() => setMapFilter(m)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all border ${mapFilter === m ? 'bg-red-900/50 text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}>
                 📍 {m}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Avg Time */}
            <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[1.5rem] p-5 flex flex-col justify-center shadow-lg">
               <div className="flex justify-between items-start mb-2">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">⏱ AVG TIME</span>
                 <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest text-right">MATCHES<br/><span className="text-lg">{analytics.totalGames}</span></span>
               </div>
               <h3 className="text-3xl font-black text-white">{analytics.avgTime}</h3>
            </div>
            
            {/* WR Sides */}
            <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[1.5rem] p-5 flex flex-col justify-center items-center shadow-lg">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">BLUE SIDE VS RED SIDE WR</span>
               <div className="flex items-center gap-4 w-full justify-center">
                  <span className="text-2xl font-black text-blue-400">{analytics.bWR}%</span>
                  <span className="text-xs text-slate-600 font-bold">VS</span>
                  <span className="text-2xl font-black text-red-400">{analytics.rWR}%</span>
               </div>
            </div>

            {/* Most Picked */}
            <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[1.5rem] p-5 flex justify-between items-center shadow-lg">
               <div>
                 <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Crown className="w-3 h-3"/> MOST PICKED</span>
                 <h3 className="text-xl font-black text-white">{analytics.mostPicked?.name || '-'}</h3>
                 <span className="text-xs text-slate-400 font-bold">{analytics.mostPicked?.picks || 0} Picks</span>
               </div>
               {analytics.mostPicked?.name && <img src={getHeroIcon(analytics.mostPicked.name)} className="w-12 h-12 object-cover rounded-lg border-2 border-amber-500/50 shadow-md transition-transform hover:scale-[1.7] relative z-0 hover:z-20 cursor-pointer" alt="hero" onClick={() => setHeroDetailModal(analytics.mostPicked.name)}/>}
            </div>

            {/* Most Banned */}
            <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[1.5rem] p-5 flex justify-between items-center shadow-lg">
               <div>
                 <span className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Ban className="w-3 h-3"/> MOST BANNED</span>
                 <h3 className="text-xl font-black text-white">{analytics.mostBanned?.name || '-'}</h3>
                 <span className="text-xs text-slate-400 font-bold">{analytics.mostBanned?.bans || 0} Bans</span>
               </div>
               {analytics.mostBanned?.name && <img src={getHeroIcon(analytics.mostBanned.name)} className="w-12 h-12 object-cover rounded-lg border-2 border-red-500/50 shadow-md grayscale transition-transform hover:scale-[1.7] hover:grayscale-0 relative z-0 hover:z-20 cursor-pointer" alt="hero" onClick={() => setHeroDetailModal(analytics.mostBanned.name)}/>}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Meta Analysis */}
            <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-xl overflow-hidden flex flex-col">
               <div className="p-5 border-b border-white/5 bg-white/[0.02]">
                  <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2"><LineChart className="w-5 h-5 text-indigo-400"/> META ANALYSIS</h3>
               </div>
               <div className="p-5 flex-1 flex flex-col gap-6">
                  <div>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">● TOP META (IMPACT)</span>
                    <div className="flex flex-wrap gap-2">
                      {analytics.sTier.length === 0 && <span className="text-xs text-slate-500">Belum ada data</span>}
                      {analytics.sTier.map(h => (
                        <div key={h.name} className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-center gap-3 pr-4 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setHeroDetailModal(h.name)}>
                           <img src={getHeroIcon(h.name)} className="w-8 h-8 rounded border border-amber-500/50 object-cover transition-transform hover:scale-[1.7] relative z-0 hover:z-20 shadow-md" alt={h.name}/>
                           <div>
                             <div className="text-sm font-bold text-white leading-none">{h.name}</div>
                             <div className="text-[10px] text-emerald-400 font-bold mt-1">{h.wr.toFixed(1)}% WR</div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">● HIDDEN GEMS (HIGH WR)</span>
                    <div className="flex flex-col gap-2">
                       {analytics.aTier.length === 0 && <span className="text-xs text-slate-500">Belum ada data</span>}
                       {analytics.aTier.map(h => (
                         <div key={h.name} className="flex justify-between items-center border-b border-white/5 pb-2 cursor-pointer hover:bg-white/5 transition-colors rounded p-1" onClick={() => setHeroDetailModal(h.name)}>
                            <div className="flex items-center gap-3">
                               <img src={getHeroIcon(h.name)} className="w-6 h-6 rounded object-cover transition-transform hover:scale-[1.7] relative z-0 hover:z-20 shadow-md" alt={h.name}/>
                               <span className="text-sm font-bold text-slate-200">{h.name}</span>
                            </div>
                            <span className="text-xs font-black text-emerald-400">{h.wr.toFixed(1)}% WR</span>
                         </div>
                       ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">● PRIORITY BANS</span>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                       {[...analytics.hArr].sort((a,b)=>b.bans - a.bans).slice(0,6).filter(h=>h.bans>0).map(h => (
                         <div key={h.name} className="relative shrink-0 cursor-pointer" onClick={() => setHeroDetailModal(h.name)}>
                           <img src={getHeroIcon(h.name)} className="w-10 h-10 rounded border border-red-500/50 object-cover grayscale opacity-80 transition-all hover:scale-[1.5] hover:grayscale-0 hover:opacity-100 relative z-0 hover:z-20 shadow-lg" alt={h.name} title={`${h.name} - ${h.bans} Bans`}/>
                           <span className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[8px] font-black px-1 rounded z-30 pointer-events-none">{h.bans}</span>
                         </div>
                       ))}
                    </div>
                  </div>
               </div>
            </div>

            {/* Hero Quadrant Scatter Plot */}
            <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-xl overflow-hidden flex flex-col">
               <div className="p-5 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2"><LineChart className="w-5 h-5 text-blue-400"/> HERO QUADRANT</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Y: Win Rate (%) | X: Pick+Ban Presence (%)</p>
                  </div>
                  <div className="flex gap-2 text-[8px] font-black uppercase">
                     <span className="text-amber-500">● META</span>
                     <span className="text-emerald-500">● GEM</span>
                     <span className="text-red-500">● OVER</span>
                  </div>
               </div>
               <div className="p-6 relative min-h-[350px] w-full flex-1">
                  {/* Grid Lines */}
                  <div className="absolute inset-x-6 top-1/2 border-t border-dashed border-white/10 z-0"></div>
                  <div className="absolute inset-y-6 left-1/2 border-l border-dashed border-white/10 z-0"></div>
                  
                  {/* Labels */}
                  <span className="absolute top-4 right-4 text-[10px] font-black text-amber-900/60 uppercase">META DOMINANT</span>
                  <span className="absolute bottom-4 right-4 text-[10px] font-black text-red-900/60 uppercase">OVERRATED</span>
                  <span className="absolute top-4 left-4 text-[10px] font-black text-emerald-900/60 uppercase">HIDDEN GEM</span>
                  <span className="absolute bottom-4 left-4 text-[10px] font-black text-slate-700/60 uppercase">NICHE / WEAK</span>

                  {/* Points */}
                  <div className="absolute inset-6 z-10">
                     {analytics.hArr.filter(h => h.presence > 0).map(h => {
                        let colorBorder = 'border-slate-600';
                        if(h.tier === 'META DOMINANT') colorBorder = 'border-amber-500 z-30';
                        else if(h.tier === 'HIDDEN GEM') colorBorder = 'border-emerald-500 z-20';
                        else if(h.tier === 'OVERRATED') colorBorder = 'border-red-500 z-20';

                        let posX = analytics.maxPresence > 0 ? (h.presence / analytics.maxPresence) * 90 : 0;
                        let posY = h.wr;
                        
                        return (
                          <div key={h.name} className="absolute group transform -translate-x-1/2 translate-y-1/2 hover:z-50" style={{ left: `${posX}%`, bottom: `${posY}%` }}>
                             <img src={getHeroIcon(h.name)} className={`w-6 h-6 rounded-full object-cover border-2 shadow-lg transition-transform hover:scale-150 ${colorBorder} cursor-pointer`} alt={h.name} onClick={() => setHeroDetailModal(h.name)} />
                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex flex-col items-center bg-black/90 border border-white/20 p-2 rounded text-[9px] font-bold text-white whitespace-nowrap z-50 pointer-events-none">
                                <span className="text-[11px] text-blue-400 mb-0.5">{h.name}</span>
                                <span>WR: {h.wr.toFixed(1)}%</span>
                                <span>Presence: {h.presence.toFixed(1)}%</span>
                             </div>
                          </div>
                        );
                     })}
                  </div>
               </div>
            </div>
          </div>

          {/* Popular Synergy Compositions */}
          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-xl overflow-hidden mb-6 flex flex-col">
              <div className="p-5 border-b border-white/5 bg-white/[0.02] flex flex-col justify-center">
                  <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2"><Users className="w-5 h-5 text-emerald-400"/> POPULAR SYNERGY COMPOSITIONS</h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Most successful 3+ hero combinations</span>
              </div>
              <div className="p-5 flex gap-4 overflow-x-auto scrollbar-hide pb-6">
                  {analytics.synergyArr.length === 0 && <span className="text-xs text-slate-500">Belum ada data kombinasi (Minimal 2x Pick).</span>}
                  {analytics.synergyArr.map((syn, idx) => (
                      <div key={idx} className="bg-black/30 border border-white/5 rounded-2xl p-4 min-w-[300px] shrink-0 flex flex-col relative">
                          <span className="absolute top-4 left-4 bg-emerald-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded">{idx + 1}</span>
                          
                          <div className="flex justify-center items-center gap-3 mt-4 mb-6">
                              {syn.heroes.map((h, hIdx) => (
                                  <React.Fragment key={hIdx}>
                                      <div className="flex flex-col items-center gap-1.5 cursor-pointer transition-transform relative z-0 hover:z-20 hover:scale-[1.25]" onClick={() => setHeroDetailModal(h)}>
                                          <img src={getHeroIcon(h)} className="w-12 h-12 rounded-lg border border-white/10 object-cover shadow-md" alt={h}/>
                                          <span className="text-[10px] font-bold text-slate-200 truncate w-14 text-center">{h}</span>
                                      </div>
                                      {hIdx < 2 && <span className="text-slate-600 font-bold mb-4">+</span>}
                                  </React.Fragment>
                              ))}
                          </div>

                          <div className="flex justify-between items-end border-t border-white/5 pt-3">
                              <div className="flex flex-col">
                                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Win Rate</span>
                                  <span className="text-sm font-black text-emerald-400">{syn.wr.toFixed(1)}%</span>
                              </div>
                              <div className="flex flex-col text-center">
                                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Picked</span>
                                  <span className="text-xs font-bold text-white mt-0.5">{syn.picks} times</span>
                              </div>
                              <div className="flex flex-col text-right">
                                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Role Balance</span>
                                  <span className="text-[10px] font-bold text-slate-300 mt-0.5">{syn.roles}</span>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Team Signatures (In-Game Role Based 3x3) */}
          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-xl overflow-hidden mb-6 flex flex-col">
             <div className="p-5 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                 <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2"><Users className="w-5 h-5 text-indigo-400"/> TEAM SIGNATURES</h3>
                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden md:block">Klik nama tim untuk Info Lengkap / Compare</span>
             </div>
             <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                {INITIAL_TEAMS.map(team => {
                   const tData = analytics.tStats[team];
                   if (!tData || !tData.topBySlot) return null;
                   
                   const IN_GAME_ROLES = ['EXP', 'JUNGLER', 'MID LANE', 'GOLDLANE', 'ROAM'];

                   return (
                     <div key={team} className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col w-full">
                        <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-3 cursor-pointer hover:bg-white/5 p-2 rounded transition-colors group" onClick={() => setTeamDetailModal(team)}>
                           <img src={TEAM_DETAILS[team]?.logo} className="w-8 h-8 object-contain transition-transform group-hover:scale-110" alt={team}/>
                           <span className="font-black text-white text-lg tracking-widest group-hover:text-blue-400">{team}</span>
                        </div>
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-3">● CORE LINEUP (IN-GAME)</span>
                        <div className="flex gap-2 justify-between flex-1">
                           {IN_GAME_ROLES.map((roleLabel, idx) => {
                             const slotData = tData.topBySlot[idx];
                             const hName = slotData?.name;
                             const count = slotData?.count || 0;
                             
                             return (
                             <div key={idx} className="flex flex-col items-center gap-1.5 w-10">
                                <div className="relative cursor-pointer" onClick={() => hName && setHeroDetailModal(hName)}>
                                  {hName ? (
                                     <img src={getHeroIcon(hName)} className="w-10 h-10 rounded border border-white/10 object-cover hover:scale-[1.5] relative z-0 hover:z-20 hover:border-blue-400 shadow-md transition-all" title={`${hName} (${count}x as ${roleLabel})`} alt={hName}/>
                                  ) : (
                                     <div className="w-10 h-10 rounded border border-slate-700 bg-slate-800/50"></div>
                                  )}
                                  {count > 0 && <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#0b0f19] z-30 pointer-events-none">{count}</span>}
                                </div>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest bg-white/5 px-1 rounded w-full text-center truncate">{roleLabel.split(' ')[0]}</span>
                             </div>
                             );
                           })}
                        </div>
                     </div>
                   );
                })}
             </div>
          </div>

          {/* Data Matrix Table (Solid Header & Multi Filters) */}
          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/5 bg-white/[0.02] flex flex-col gap-4">
                <div className="flex justify-between items-center w-full">
                    <h3 className="text-lg font-black text-white uppercase tracking-widest">DATA MATRIX</h3>
                    <span className="text-xs text-slate-400">{sortedMatrix.length} Hero Ditampilkan</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-[#0a0a1a] px-3 py-1.5 rounded-xl border border-white/10 shadow-inner">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Min Picks:</span>
                        <input type="number" min="0" value={minPicksFilter} onChange={e => setMinPicksFilter(Number(e.target.value))} className="bg-transparent text-white font-bold w-12 text-center text-xs outline-none" />
                    </div>
                    <div className="flex items-center gap-2 bg-[#0a0a1a] px-3 py-1.5 rounded-xl border border-white/10 shadow-inner">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Min WR %:</span>
                        <input type="number" min="0" max="100" value={minWRFilter} onChange={e => setMinWRFilter(Number(e.target.value))} className="bg-transparent text-emerald-400 font-bold w-12 text-center text-xs outline-none" />
                    </div>
                    <div className="flex items-center gap-2 bg-[#0a0a1a] px-3 py-1.5 rounded-xl border border-white/10 shadow-inner">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tier:</span>
                        <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} className="bg-[#121826] border border-transparent hover:border-white/10 text-blue-400 font-bold text-xs outline-none cursor-pointer p-0.5 rounded">
                            <option className="bg-[#121826]" value="All Tiers">All Tiers</option>
                            <option className="bg-[#121826]" value="META DOMINANT">Meta Dominant</option>
                            <option className="bg-[#121826]" value="HIDDEN GEM">Hidden Gem</option>
                            <option className="bg-[#121826]" value="OVERRATED">Overrated</option>
                            <option className="bg-[#121826]" value="NICHE / WEAK">Niche / Weak</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto bg-[#0a0a1a]">
              <table className="w-full text-left whitespace-nowrap text-sm border-collapse">
                <thead className="sticky top-0 bg-[#121826] z-20 shadow-md outline outline-1 outline-[#1a2333]">
                  <tr className="text-slate-400 text-[10px] tracking-widest uppercase border-b border-white/10">
                    
                    <th className="py-4 text-center px-4 w-12 font-black text-slate-500 bg-[#121826]">#</th>
                    
                    <th className="py-4 px-4 cursor-pointer hover:bg-white/5 transition-colors group bg-[#121826]" onClick={() => handleSort('name')}>
                       <div className="flex items-center gap-2">HERO <span className={matrixSort.key === 'name' ? 'text-blue-400 opacity-100' : 'text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity'}>{matrixSort.key === 'name' && matrixSort.desc ? '▼' : '▲'}</span></div>
                    </th>
                    
                    <th className="py-4 px-4 cursor-pointer hover:bg-white/5 transition-colors group bg-[#121826]" onClick={() => handleSort('role')}>
                       <div className="flex items-center justify-center gap-2">ROLE <span className={matrixSort.key === 'role' ? 'text-blue-400 opacity-100' : 'text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity'}>{matrixSort.key === 'role' && matrixSort.desc ? '▼' : '▲'}</span></div>
                    </th>
                    
                    <th className="py-4 px-4 cursor-pointer hover:bg-white/5 transition-colors group bg-[#121826]" onClick={() => handleSort('picks')}>
                       <div className="flex items-center justify-center gap-2">PICKS <span className={matrixSort.key === 'picks' ? 'text-blue-400 opacity-100' : 'text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity'}>{matrixSort.key === 'picks' && matrixSort.desc ? '▼' : '▲'}</span></div>
                    </th>
                    
                    <th className="py-4 px-4 cursor-pointer hover:bg-white/5 transition-colors group bg-[#121826]" onClick={() => handleSort('bans')}>
                       <div className="flex items-center justify-center gap-2">BANS <span className={matrixSort.key === 'bans' ? 'text-blue-400 opacity-100' : 'text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity'}>{matrixSort.key === 'bans' && matrixSort.desc ? '▼' : '▲'}</span></div>
                    </th>
                    
                    <th className="py-4 px-4 cursor-pointer hover:bg-white/5 transition-colors group bg-[#121826] text-blue-400" onClick={() => handleSort('presence')}>
                       <div className="flex items-center justify-center gap-2">PRESENCE <span className={matrixSort.key === 'presence' ? 'opacity-100' : 'text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity'}>{matrixSort.key === 'presence' && matrixSort.desc ? '▼' : '▲'}</span></div>
                    </th>
                    
                    <th className="py-4 px-4 cursor-pointer hover:bg-white/5 transition-colors group bg-[#121826] text-emerald-400" onClick={() => handleSort('wr')}>
                       <div className="flex items-center justify-center gap-2">WIN RATE <span className={matrixSort.key === 'wr' ? 'opacity-100' : 'text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity'}>{matrixSort.key === 'wr' && matrixSort.desc ? '▼' : '▲'}</span></div>
                    </th>
                    
                    <th className="py-4 px-4 cursor-pointer hover:bg-white/5 transition-colors group bg-[#121826] text-indigo-400" onClick={() => handleSort('impact')}>
                       <div className="flex items-center justify-center gap-2">IMPACT <span className={matrixSort.key === 'impact' ? 'opacity-100' : 'text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity'}>{matrixSort.key === 'impact' && matrixSort.desc ? '▼' : '▲'}</span></div>
                    </th>
                    
                    <th className="py-4 px-4 cursor-pointer hover:bg-white/5 transition-colors group bg-[#121826] text-right" onClick={() => handleSort('tier')}>
                       <div className="flex items-center justify-end gap-2">TIER LABEL <span className={matrixSort.key === 'tier' ? 'text-blue-400 opacity-100' : 'text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity'}>{matrixSort.key === 'tier' && matrixSort.desc ? '▼' : '▲'}</span></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sortedMatrix.map((h, i) => (
                    <tr key={h.name} className="transition-colors hover:bg-white/5 group">
                      <td className="py-3 text-center font-bold text-slate-500">{i+1}</td>
                      
                      <td className="py-3 px-4 cursor-pointer" onClick={() => setHeroDetailModal(h.name)}>
                        <div className="flex items-center gap-3">
                          <img src={getHeroIcon(h.name)} className="w-8 h-8 rounded object-cover shadow-md transition-transform hover:scale-[1.7] relative z-0 hover:z-20 border border-transparent hover:border-blue-400" alt={h.name}/>
                          <span className="font-bold text-white group-hover:text-blue-400 transition-colors">{h.name}</span>
                        </div>
                      </td>
                      
                      <td className="py-3 text-center text-slate-400 text-xs">{h.role}</td>
                      <td className="py-3 text-center font-bold text-white">{h.picks}</td>
                      <td className="py-3 text-center font-bold text-red-400">{h.bans}</td>
                      <td className="py-3 text-center font-bold text-blue-400">{h.presence.toFixed(2)}%</td>
                      <td className={`py-3 text-center font-black ${h.wr >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>{h.wr.toFixed(2)}%</td>
                      <td className="py-3 text-center font-bold text-indigo-300">{h.impact.toFixed(1)}</td>
                      <td className="py-3 text-right pr-4">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded flex items-center gap-1.5 justify-end uppercase tracking-widest border w-max ml-auto ${getTierClass(h.tier)}`}>
                           {h.tier === 'HIDDEN GEM' ? <Gem className="w-3 h-3"/> : <Activity className="w-3 h-3"/>}
                           {h.tier}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================ */}
      {/* HERO DETAILED STATS MODAL POPUP                                              */}
      {/* ============================================================================ */}
      {heroDetailModal && heroDetailData && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#1e1e1e] border border-[#333] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative font-sans">
                
                {/* Header Popup */}
                <div className="bg-[#1e1e1e] px-6 py-4 flex justify-between items-center shrink-0 border-b border-[#333] flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <img src={getHeroIcon(heroDetailModal)} className="w-8 h-8 object-cover rounded border border-[#444] shadow-md" alt="hero" />
                        <h2 className="text-[17px] font-bold text-white tracking-wide">{heroDetailModal} Detailed Statistics</h2>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">MAP:</span>
                            <select value={heroDetailMapFilter} onChange={e => setHeroDetailMapFilter(e.target.value)} className="bg-[#141414] border border-[#333] text-xs text-white px-2 py-1 rounded outline-none cursor-pointer">
                                <option className="bg-[#141414]" value="ALL MAPS">All Maps</option>
                                {MAP_LIST.map(m => <option className="bg-[#141414]" key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <button onClick={() => { setHeroDetailModal(null); setHeroDetailMapFilter('ALL MAPS'); }} className="text-white hover:text-red-400 p-1 rounded transition-all ml-2">
                            <X className="w-5 h-5 font-bold"/>
                        </button>
                    </div>
                </div>
                
                {/* 3 Columns Content */}
                <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-0 bg-[#141414]">
                    
                    {/* Played By Teams */}
                    <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-[#333]">
                        <div className="flex justify-between items-center px-4 py-3 bg-[#1e1e1e] border-b border-[#333]">
                            <div className="w-4"></div>
                            <span className="text-[13px] font-bold text-white">Played By Teams</span>
                            <span className="text-[10px] text-slate-400">▼</span>
                        </div>
                        <table className="w-full text-left whitespace-nowrap text-[13px]">
                            <thead className="bg-[#1e1e1e] border-b border-[#333]">
                                <tr>
                                    <th className="py-2.5 px-2 text-center w-8 font-bold text-white"></th>
                                    <th className="py-2.5 px-2 text-center font-bold text-white">Team</th>
                                    <th className="py-2.5 px-2 text-center font-bold text-white">Σ</th>
                                    <th className="py-2.5 px-2 text-center font-bold text-white">W</th>
                                    <th className="py-2.5 px-2 text-center font-bold text-white">L</th>
                                    <th className="py-2.5 px-3 text-right font-bold text-white">WR</th>
                                </tr>
                            </thead>
                            <tbody className="bg-[#141414]">
                                {heroDetailData.byTeam.map((d, i) => (
                                    <tr key={d.name} className={i%2===0?'bg-[#141414]':'bg-[#1a1a1a]'}>
                                        <td className="py-2 px-2 text-center text-white">{i+1}</td>
                                        <td className="py-2 px-2 text-white">
                                            <div className="flex items-center gap-2 justify-start pl-2 cursor-pointer hover:text-blue-400 transition-colors" onClick={() => { setTeamDetailModal(d.name); setHeroDetailModal(null); }}>
                                                {TEAM_DETAILS[d.name]?.logo && <img src={TEAM_DETAILS[d.name].logo} className="w-5 h-5 object-contain" alt={d.name}/>}
                                                <span className="truncate max-w-[70px]">{d.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-center text-white font-bold">{d.total}</td>
                                        <td className="py-2 px-2 text-center text-white">{d.w}</td>
                                        <td className="py-2 px-2 text-center text-white">{d.l}</td>
                                        <td className="py-2 px-3 text-right text-white">{d.wr}%</td>
                                    </tr>
                                ))}
                                {heroDetailData.byTeam.length === 0 && <tr><td colSpan="6" className="text-center py-4 text-slate-500 text-[12px]">Belum ada data</td></tr>}
                            </tbody>
                        </table>
                    </div>

                    {/* Played With */}
                    <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-[#333]">
                        <div className="flex justify-between items-center px-4 py-3 bg-[#1e1e1e] border-b border-[#333]">
                            <div className="w-4"></div>
                            <span className="text-[13px] font-bold text-white">Played With</span>
                            <span className="text-[10px] text-slate-400">▼</span>
                        </div>
                        <table className="w-full text-left whitespace-nowrap text-[13px]">
                            <thead className="bg-[#1e1e1e] border-b border-[#333]">
                                <tr>
                                    <th className="py-2.5 px-2 text-center w-8 font-bold text-white"></th>
                                    <th className="py-2.5 px-2 text-center font-bold text-white">Hero</th>
                                    <th className="py-2.5 px-2 text-center font-bold text-white">Σ</th>
                                    <th className="py-2.5 px-2 text-center font-bold text-white">W</th>
                                    <th className="py-2.5 px-2 text-center font-bold text-white">L</th>
                                    <th className="py-2.5 px-3 text-right font-bold text-white">WR</th>
                                </tr>
                            </thead>
                            <tbody className="bg-[#141414]">
                                {heroDetailData.withHero.map((d, i) => (
                                    <tr key={d.name} className={i%2===0?'bg-[#141414]':'bg-[#1a1a1a]'}>
                                        <td className="py-2 px-2 text-center text-white">{i+1}</td>
                                        <td className="py-2 px-2 text-white">
                                            <div className="flex items-center gap-2 justify-start pl-2 cursor-pointer hover:text-blue-400 transition-colors" onClick={() => { setHeroDetailModal(d.name); setHeroDetailMapFilter('ALL MAPS'); }}>
                                                <img src={getHeroIcon(d.name)} className="w-5 h-5 rounded object-cover border border-[#333] transition-transform hover:scale-[2.5] relative z-0 hover:z-20 shadow-md" alt={d.name}/>
                                                <span className="truncate max-w-[70px]">{d.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-center text-white font-bold">{d.total}</td>
                                        <td className="py-2 px-2 text-center text-white">{d.w}</td>
                                        <td className="py-2 px-2 text-center text-white">{d.l}</td>
                                        <td className="py-2 px-3 text-right text-white">{d.wr}%</td>
                                    </tr>
                                ))}
                                {heroDetailData.withHero.length === 0 && <tr><td colSpan="6" className="text-center py-4 text-slate-500 text-[12px]">Belum ada data</td></tr>}
                            </tbody>
                        </table>
                    </div>

                    {/* Played Against */}
                    <div className="flex flex-col">
                        <div className="flex justify-between items-center px-4 py-3 bg-[#1e1e1e] border-b border-[#333]">
                            <div className="w-4"></div>
                            <span className="text-[13px] font-bold text-white">Played Against</span>
                            <span className="text-[10px] text-slate-400">▼</span>
                        </div>
                        <table className="w-full text-left whitespace-nowrap text-[13px]">
                            <thead className="bg-[#1e1e1e] border-b border-[#333]">
                                <tr>
                                    <th className="py-2.5 px-2 text-center w-8 font-bold text-white"></th>
                                    <th className="py-2.5 px-2 text-center font-bold text-white">Hero</th>
                                    <th className="py-2.5 px-2 text-center font-bold text-white">Σ</th>
                                    <th className="py-2.5 px-2 text-center font-bold text-white">W</th>
                                    <th className="py-2.5 px-2 text-center font-bold text-white">L</th>
                                    <th className="py-2.5 px-3 text-right font-bold text-white">WR</th>
                                </tr>
                            </thead>
                            <tbody className="bg-[#141414]">
                                {heroDetailData.againstHero.map((d, i) => (
                                    <tr key={d.name} className={i%2===0?'bg-[#141414]':'bg-[#1a1a1a]'}>
                                        <td className="py-2 px-2 text-center text-white">{i+1}</td>
                                        <td className="py-2 px-2 text-white">
                                            <div className="flex items-center gap-2 justify-start pl-2 cursor-pointer hover:text-red-400 transition-colors" onClick={() => { setHeroDetailModal(d.name); setHeroDetailMapFilter('ALL MAPS'); }}>
                                                <img src={getHeroIcon(d.name)} className="w-5 h-5 rounded object-cover border border-[#333] transition-transform hover:scale-[2.5] relative z-0 hover:z-20 shadow-md" alt={d.name}/>
                                                <span className="truncate max-w-[70px]">{d.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-center text-white font-bold">{d.total}</td>
                                        <td className="py-2 px-2 text-center text-white">{d.w}</td>
                                        <td className="py-2 px-2 text-center text-white">{d.l}</td>
                                        <td className="py-2 px-3 text-right text-white">{d.wr}%</td>
                                    </tr>
                                ))}
                                {heroDetailData.againstHero.length === 0 && <tr><td colSpan="6" className="text-center py-4 text-slate-500 text-[12px]">Belum ada data</td></tr>}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div>
      )}

      {/* ============================================================================ */}
      {/* TEAM DETAILED STATS & COMPARE MODAL POPUP                                      */}
      {/* ============================================================================ */}
      {teamDetailModal && teamDetailData && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#1e1e1e] border border-[#333] rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative font-sans">
                
                {/* Header Popup */}
                <div className="bg-[#1e1e1e] px-6 py-4 flex justify-between items-center shrink-0 border-b border-[#333] flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <img src={TEAM_DETAILS[teamDetailModal]?.logo} className="w-8 h-8 object-contain drop-shadow-md" alt="team" />
                        <h2 className="text-[17px] font-bold text-white tracking-wide uppercase">{teamDetailModal} Team Signatures</h2>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {/* Compare Team Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">VS</span>
                            <select value={teamCompareTeam} onChange={e => setTeamCompareTeam(e.target.value)} className="bg-[#141414] border border-[#333] text-xs text-white px-2 py-1.5 rounded outline-none cursor-pointer">
                                <option className="bg-[#141414]" value="ALL TEAMS">- No Compare -</option>
                                {INITIAL_TEAMS.filter(t => t !== teamDetailModal).map(t => <option className="bg-[#141414]" key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        
                        {/* Map Filter Component for Teams */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Map</span>
                            <select value={teamDetailMapFilter} onChange={e => setTeamDetailMapFilter(e.target.value)} className="bg-[#141414] border border-[#333] text-xs text-white px-2 py-1.5 rounded outline-none cursor-pointer">
                                <option className="bg-[#141414]" value="ALL MAPS">All Maps</option>
                                {MAP_LIST.map(m => <option className="bg-[#141414]" key={m} value={m}>{m}</option>)}
                            </select>
                        </div>

                        <button onClick={() => { setTeamDetailModal(null); setTeamCompareTeam('ALL TEAMS'); setTeamDetailMapFilter('ALL MAPS'); }} className="text-white hover:text-red-400 p-1 rounded transition-all ml-2 border border-[#333] bg-[#141414]">
                            <X className="w-5 h-5 font-bold"/>
                        </button>
                    </div>
                </div>
                
                {/* Scrollable Body (Lanes Layout) */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#141414] flex flex-col gap-4">
                    
                    {/* Header Kolom Compare */}
                    {teamCompareTeam !== 'ALL TEAMS' && (
                        <div className="flex justify-between items-center mb-2 px-2 border-b border-[#333] pb-3">
                            <div className="flex items-center gap-3 w-1/2">
                                <img src={TEAM_DETAILS[teamDetailModal]?.logo} className="w-8 h-8 object-contain"/>
                                <span className="font-black text-white text-lg tracking-widest uppercase">{teamDetailModal}</span>
                            </div>
                            <div className="flex items-center justify-end gap-3 w-1/2">
                                <span className="font-black text-white text-lg tracking-widest uppercase">{teamCompareTeam}</span>
                                <img src={TEAM_DETAILS[teamCompareTeam]?.logo} className="w-8 h-8 object-contain"/>
                            </div>
                        </div>
                    )}
                    
                    {/* Render tiap slot (EXP, JUG, MID, GOLD, ROAM) vertikal */}
                    {['EXP', 'JUNGLER', 'MID LANE', 'GOLDLANE', 'ROAM'].map((role, idx) => (
                        <div key={role} className="bg-[#1e1e1e] border border-[#333] rounded-xl p-4 flex flex-col shadow-md">
                            <h4 className="text-[11px] font-black uppercase text-blue-400 mb-3 border-b border-[#333] pb-2 tracking-widest">{role}</h4>
                            <div className="flex gap-4 min-h-[60px] items-center">
                                
                                {/* TEAM 1 HEROES */}
                                <div className={`flex-1 flex gap-3 overflow-x-auto pb-2 scrollbar-hide ${teamCompareTeam !== 'ALL TEAMS' ? 'w-1/2 border-r border-[#333] pr-4' : 'w-full'}`}>
                                    {teamDetailData.t1[idx].length === 0 && <span className="text-xs text-slate-600 font-bold m-auto">Belum ada data</span>}
                                    {teamDetailData.t1[idx].map(h => (
                                        <div key={h.name} className="relative shrink-0 group cursor-pointer" onClick={() => { setHeroDetailModal(h.name); setTeamDetailModal(null); setTeamCompareTeam('ALL TEAMS'); setTeamDetailMapFilter('ALL MAPS'); }}>
                                            <img src={getHeroIcon(h.name)} className="w-12 h-12 rounded-lg object-cover border border-[#444] transition-transform hover:scale-[1.7] relative z-0 hover:z-20 shadow-md"/>
                                            <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-[#1e1e1e] shadow z-30 pointer-events-none">{h.count}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* TEAM 2 (COMPARE) HEROES */}
                                {teamCompareTeam !== 'ALL TEAMS' && (
                                    <div className="flex-1 flex gap-3 overflow-x-auto pb-2 justify-end scrollbar-hide w-1/2 pl-4">
                                        {teamDetailData.t2[idx].length === 0 && <span className="text-xs text-slate-600 font-bold m-auto">Belum ada data</span>}
                                        {teamDetailData.t2[idx].map(h => (
                                            <div key={h.name} className="relative shrink-0 group cursor-pointer" onClick={() => { setHeroDetailModal(h.name); setTeamDetailModal(null); setTeamCompareTeam('ALL TEAMS'); setTeamDetailMapFilter('ALL MAPS'); }}>
                                                <img src={getHeroIcon(h.name)} className="w-12 h-12 rounded-lg object-cover border border-[#444] transition-transform hover:scale-[1.7] relative z-0 hover:z-20 shadow-md"/>
                                                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-[#1e1e1e] shadow z-30 pointer-events-none">{h.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* ============================================================================ */}
      {/* SMART HOVER DRAFT TOOLTIP (VS TEXT)                                          */}
      {/* ============================================================================ */}
      {hoverDraftId && globalDrafts[hoverDraftId] && globalDrafts[hoverDraftId].length > 0 && (
          <div className="fixed z-[9999] pointer-events-auto transition-all duration-150 draft-popup-container" 
               style={{ 
                   left: Math.min(mousePos.x + 15, typeof window !== 'undefined' ? window.innerWidth - 370 : mousePos.x), 
                   top: Math.min(mousePos.y + 15, typeof window !== 'undefined' ? window.innerHeight - 300 : mousePos.y) 
               }}
               onMouseEnter={() => clearTimeout(hoverTimeoutRef.current)}
               onMouseLeave={() => { hoverTimeoutRef.current = setTimeout(() => setHoverDraftId(null), 300); }}
               >
              <div className="bg-[#1c1c1c] border border-[#333] rounded-xl shadow-2xl p-4 w-[350px] text-white flex flex-col gap-3">
                  
                  {/* Header Hover Match */}
                  <div className="flex justify-between items-center bg-[#2a2a2a] p-2.5 rounded-lg border border-[#333]">
                      {(() => {
                          const minfo = mergedMatches.find(m => m.id === hoverDraftId);
                          return (
                              <>
                                  <div className="flex items-center gap-2 w-1/3">
                                      <span className="font-bold text-blue-400 text-[11px] truncate">{minfo?.t1}</span>
                                      <img src={TEAM_DETAILS[minfo?.t1]?.logo} className="w-5 h-5 object-contain" alt="T1" />
                                  </div>
                                  <div className="w-1/3 text-center flex flex-col">
                                      <span className="font-black text-sm tracking-widest">{minfo?.s1 ?? '-'} : {minfo?.s2 ?? '-'}</span>
                                      <span className="text-[8px] text-slate-400 uppercase mt-0.5">(Bo3)</span>
                                  </div>
                                  <div className="flex items-center justify-end gap-2 w-1/3">
                                      <img src={TEAM_DETAILS[minfo?.t2]?.logo} className="w-5 h-5 object-contain" alt="T2" />
                                      <span className="font-bold text-red-400 text-[11px] truncate">{minfo?.t2}</span>
                                  </div>
                              </>
                          )
                      })()}
                  </div>

                  {/* Games Row */}
                  <div className="flex flex-col gap-2">
                      {globalDrafts[hoverDraftId].map((g, idx) => (
                          <div key={idx} className="bg-[#141414] rounded-lg p-2 border border-[#333] flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                  {/* Kiri (Blue) */}
                                  <div className="flex items-center gap-1.5 w-[42%]">
                                      <div className={`w-4 h-4 flex items-center justify-center text-[9px] font-bold rounded ${g.t1Result === 'W' ? 'bg-emerald-600' : (g.t1Result === 'L' ? 'bg-red-600' : 'bg-slate-700')}`}>{g.t1Result || '-'}</div>
                                      <div className="flex gap-0.5">
                                          {g.t1Picks.map((h, i) => h ? <img key={i} src={getHeroIcon(h)} className="w-5 h-5 rounded-[2px] border border-blue-500/50 object-cover cursor-pointer transition-transform hover:scale-[2.5] relative z-0 hover:z-20 shadow-md" alt="hero" onClick={() => setHeroDetailModal(h)}/> : <div key={i} className="w-5 h-5 bg-white/5 rounded-[2px]"></div>)}
                                      </div>
                                  </div>
                                  {/* Tengah */}
                                  <div className="w-[16%] flex flex-col items-center justify-center">
                                      <span className="text-[10px] font-bold">{g.duration || '00:00'}</span>
                                  </div>
                                  {/* Kanan (Red) */}
                                  <div className="flex items-center justify-end gap-1.5 w-[42%]">
                                      <div className="flex gap-0.5">
                                          {g.t2Picks.map((h, i) => h ? <img key={i} src={getHeroIcon(h)} className="w-5 h-5 rounded-[2px] border border-red-500/50 object-cover cursor-pointer transition-transform hover:scale-[2.5] relative z-0 hover:z-20 shadow-md" alt="hero" onClick={() => setHeroDetailModal(h)}/> : <div key={i} className="w-5 h-5 bg-white/5 rounded-[2px]"></div>)}
                                      </div>
                                      <div className={`w-4 h-4 flex items-center justify-center text-[9px] font-bold rounded ${g.t2Result === 'W' ? 'bg-emerald-600' : (g.t2Result === 'L' ? 'bg-red-600' : 'bg-slate-700')}`}>{g.t2Result || '-'}</div>
                                  </div>
                              </div>
                              <div className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-[#333] pb-1.5">
                                  {g.map || 'Unknown Map'}
                              </div>
                          </div>
                      ))}
                  </div>

                  {/* Bans Section */}
                  <div className="bg-[#141414] rounded-lg p-2 border border-[#333] mt-1">
                      <div className="text-center text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2">Bans</div>
                      <div className="flex flex-col gap-1.5">
                          {globalDrafts[hoverDraftId].map((g, idx) => (
                              <div key={idx} className="flex justify-between items-center">
                                  <div className="flex gap-0.5 w-[40%]">
                                      {g.t1Bans.map((h, i) => h ? <img key={i} src={getHeroIcon(h)} className="w-4 h-4 rounded-[2px] grayscale opacity-80 object-cover cursor-pointer transition-all hover:scale-[2.5] hover:grayscale-0 hover:opacity-100 relative z-0 hover:z-20 shadow-md" alt="ban" onClick={() => setHeroDetailModal(h)}/> : <div key={i} className="w-4 h-4 bg-white/5 rounded-[2px]"></div>)}
                                  </div>
                                  <span className="text-[8px] font-bold text-slate-500 w-[20%] text-center">Game {idx+1}</span>
                                  <div className="flex gap-0.5 justify-end w-[40%]">
                                      {g.t2Bans.map((h, i) => h ? <img key={i} src={getHeroIcon(h)} className="w-4 h-4 rounded-[2px] grayscale opacity-80 object-cover cursor-pointer transition-all hover:scale-[2.5] hover:grayscale-0 hover:opacity-100 relative z-0 hover:z-20 shadow-md" alt="ban" onClick={() => setHeroDetailModal(h)}/> : <div key={i} className="w-4 h-4 bg-white/5 rounded-[2px]"></div>)}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
                  
              </div>
          </div>
      )}

    </div>
  );
}
