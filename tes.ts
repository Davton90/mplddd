import { Component, ChangeDetectionStrategy, signal, computed, effect, OnInit, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

// =========================================================================================
// GANTI BAGIAN DI BAWAH INI DENGAN CONFIG DARI FIREBASE PROJECT ANDA
// (Pastikan isinya sama persis dengan yang ada di file DraftEditor.html)
// =========================================================================================
const CUSTOM_FIREBASE_CONFIG = {
    apiKey: "GANTI_DENGAN_API_KEY_ANDA",
    authDomain: "GANTI_DENGAN_PROJECT_ID_ANDA.firebaseapp.com",
    projectId: "GANTI_DENGAN_PROJECT_ID_ANDA",
    storageBucket: "GANTI_DENGAN_PROJECT_ID_ANDA.appspot.com",
    messagingSenderId: "GANTI_DENGAN_SENDER_ID_ANDA",
    appId: "1:123456789:web:GANTI_DENGAN_APP_ID_ANDA"
};
const CUSTOM_APP_ID = "mpl-draft-app-custom"; // ID harus persis sama dengan HTML Editor
// =========================================================================================

const TM: Record<string, string> = { 'ONIC': 'ONIC', 'BTR': 'Bigetron Vitality', 'EVOS': 'EVOS', 'DEWA': 'Dewa United Esports', 'TLID': 'Team Liquid ID', 'AE': 'Alter Ego', 'GEEK': 'Geek Fam ID', 'NAVI': 'Natus Vincere', 'RRQ': 'RRQ Hoshi' };
const TEAMS = Object.values(TM);
const TEAM_ABBR: Record<string, string> = { 'ONIC': 'ONIC', 'Bigetron Vitality': 'BTR', 'EVOS': 'EVOS', 'Dewa United Esports': 'DEWA', 'Team Liquid ID': 'TLID', 'Alter Ego': 'AE', 'Geek Fam ID': 'GEEK', 'Natus Vincere': 'NAVI', 'RRQ Hoshi': 'RRQ' };
const LOGO_COLORS: Record<string, string> = { 'ONIC': 'bg-yellow-400 text-black', 'Bigetron Vitality': 'bg-red-600 text-white', 'EVOS': 'bg-blue-600 text-white', 'Dewa United Esports': 'bg-black text-amber-400', 'Team Liquid ID': 'bg-blue-900 text-white', 'Alter Ego': 'bg-gray-800 text-white', 'Geek Fam ID': 'bg-red-800 text-white', 'Natus Vincere': 'bg-yellow-500 text-black', 'RRQ Hoshi': 'bg-orange-500 text-black' };

const FALLBACK_LOGOS: Record<string, string> = {
    'ONIC': 'https://i.imgur.com/wdQSIZa.png', 'Bigetron Vitality': 'https://i.imgur.com/E9W0qHf.png',
    'EVOS': 'https://i.imgur.com/lLE2NZA.png', 'Dewa United Esports': 'https://i.imgur.com/PTQ85rP.png',
    'Team Liquid ID': 'https://i.imgur.com/UxD4Qgd.png', 'Alter Ego': 'https://i.imgur.com/XxfnK7G.png',
    'Geek Fam ID': 'https://i.imgur.com/jQvLfiP.png', 'Natus Vincere': 'https://i.imgur.com/Av7GEqT.png',
    'RRQ Hoshi': 'https://i.imgur.com/03ZgNUW.png'
};

const history = [
    { id: 1, w: 1, t1: 'BTR', t2: 'AE', s1: 2, s2: 1 }, { id: 2, w: 1, t1: 'NAVI', t2: 'RRQ', s1: 2, s2: 0 }, { id: 3, w: 1, t1: 'EVOS', t2: 'GEEK', s1: 2, s2: 0 }, { id: 4, w: 1, t1: 'AE', t2: 'ONIC', s1: 0, s2: 2 },
    { id: 5, w: 1, t1: 'TLID', t2: 'NAVI', s1: 2, s2: 1 }, { id: 6, w: 1, t1: 'DEWA', t2: 'BTR', s1: 2, s2: 0 }, { id: 7, w: 1, t1: 'EVOS', t2: 'TLID', s1: 0, s2: 2 }, { id: 8, w: 1, t1: 'RRQ', t2: 'ONIC', s1: 0, s2: 2 },
    { id: 9, w: 2, t1: 'ONIC', t2: 'GEEK', s1: 2, s2: 0 }, { id: 10, w: 2, t1: 'DEWA', t2: 'NAVI', s1: 2, s2: 0 }, { id: 11, w: 2, t1: 'GEEK', t2: 'BTR', s1: 2, s2: 0 }, { id: 12, w: 2, t1: 'AE', t2: 'EVOS', s1: 2, s2: 1 },
    { id: 13, w: 2, t1: 'TLID', t2: 'DEWA', s1: 2, s2: 1 }, { id: 14, w: 2, t1: 'NAVI', t2: 'AE', s1: 1, s2: 2 }, { id: 15, w: 2, t1: 'RRQ', t2: 'TLID', s1: 0, s2: 2 }, { id: 16, w: 2, t1: 'BTR', t2: 'EVOS', s1: 2, s2: 1 },
    { id: 17, w: 3, t1: 'ONIC', t2: 'DEWA', s1: 2, s2: 1 }, { id: 18, w: 3, t1: 'NAVI', t2: 'EVOS', s1: 0, s2: 2 }, { id: 19, w: 3, t1: 'TLID', t2: 'GEEK', s1: 0, s2: 2 }, { id: 20, w: 3, t1: 'ONIC', t2: 'BTR', s1: 1, s2: 2 },
    { id: 21, w: 3, t1: 'RRQ', t2: 'AE', s1: 1, s2: 2 }, { id: 22, w: 3, t1: 'BTR', t2: 'NAVI', s1: 1, s2: 2 }, { id: 23, w: 3, t1: 'GEEK', t2: 'RRQ', s1: 2, s2: 1 }, { id: 24, w: 3, t1: 'AE', t2: 'DEWA', s1: 0, s2: 2 },
    { id: 25, w: 4, t1: 'NAVI', t2: 'ONIC', s1: 0, s2: 2 }, { id: 26, w: 4, t1: 'EVOS', t2: 'DEWA', s1: 2, s2: 0 }, { id: 27, w: 4, t1: 'TLID', t2: 'BTR', s1: 1, s2: 2 }, { id: 28, w: 4, t1: 'RRQ', t2: 'EVOS', s1: 0, s2: 2 },
    { id: 29, w: 4, t1: 'GEEK', t2: 'AE', s1: 1, s2: 2 }, { id: 30, w: 4, t1: 'ONIC', t2: 'TLID', s1: 2, s2: 0 }, { id: 31, w: 4, t1: 'BTR', t2: 'RRQ', s1: 2, s2: 1 }, { id: 32, w: 4, t1: 'DEWA', t2: 'GEEK', s1: 2, s2: 0 }
];

const schedule = [
    { w: 5, m: [['GEEK', 'NAVI'], ['EVOS', 'ONIC'], ['DEWA', 'RRQ'], ['AE', 'TLID'], ['EVOS', 'BTR'], ['AE', 'NAVI'], ['GEEK', 'ONIC'], ['DEWA', 'TLID']] },
    { w: 6, m: [['NAVI', 'DEWA'], ['AE', 'GEEK'], ['EVOS', 'AE'], ['TLID', 'ONIC'], ['RRQ', 'BTR'], ['NAVI', 'TLID'], ['ONIC', 'RRQ'], ['GEEK', 'EVOS']] },
    { w: 7, m: [['GEEK', 'DEWA'], ['BTR', 'TLID'], ['DEWA', 'AE'], ['EVOS', 'RRQ'], ['ONIC', 'NAVI'], ['RRQ', 'GEEK'], ['NAVI', 'BTR'], ['TLID', 'EVOS']] },
    { w: 8, m: [['BTR', 'GEEK'], ['DEWA', 'ONIC'], ['EVOS', 'NAVI'], ['TLID', 'RRQ'], ['ONIC', 'AE'], ['DEWA', 'EVOS'], ['AE', 'BTR'], ['RRQ', 'NAVI']] },
    { w: 9, m: [['BTR', 'DEWA'], ['TLID', 'AE'], ['GEEK', 'TLID'], ['AE', 'RRQ'], ['BTR', 'ONIC'], ['RRQ', 'DEWA'], ['ONIC', 'EVOS'], ['NAVI', 'GEEK']] }
];

const HERO_ROLES = {
    "EXP Lane": ["Aldous", "Alice", "Argus", "Arlott", "Badang", "Benedetta", "Chou", "Cici", "Dyrroth", "Edith", "Esmeralda", "Freya", "Gloo", "Guinevere", "Lapu-Lapu", "Lukas", "Masha", "Minsitthar", "Paquito", "Phoveus", "Ruby", "Silvanna", "Sora", "Sun", "Terizla", "Thamuz", "Uranus", "X.Borg", "Yu Zhong", "Zilong"],
    "Jungle": ["Aamon", "Alpha", "Alucard", "Aulus", "Balmond", "Bane", "Barats", "Baxia", "Fanny", "Fredrinn", "Gusion", "Hanzo", "Harley", "Hayabusa", "Helcurt", "Joy", "Julian", "Karina", "Lancelot", "Leomord", "Ling", "Martis", "Natalia", "Nolan", "Popol and Kupa", "Roger", "Saber", "Suyou", "Yi Sun-shin", "Yin"],
    "Mid Lane": ["Aurora", "Cecilion", "Chang'e", "Cyclops", "Eudora", "Faramis", "Gord", "Kadita", "Kagura", "Kimmy", "Lunox", "Luo Yi", "Lylia", "Nana", "Novaria", "Odette", "Pharsa", "Selena", "Vale", "Valentina", "Valir", "Vexana", "Xavier", "Yve", "Zetian", "Zhask", "Zhuxin"],
    "Gold Lane": ["Beatrix", "Brody", "Bruno", "Claude", "Clint", "Granger", "Hanabi", "Harith", "Irithel", "Ixia", "Karrie", "Layla", "Lesley", "Melissa", "Miya", "Moskov", "Natan", "Obsidia", "Wanwan"],
    "Roam": ["Akai", "Angela", "Atlas", "Belerick", "Carmilla", "Chip", "Diggie", "Estes", "Floryn", "Franco", "Gatotkaca", "Grock", "Hilda", "Hylos", "Jawhead", "Johnson", "Kaja", "Kalea", "Khaleed", "Khufra", "Lolita", "Marcel", "Mathilda", "Minotaur", "Rafaela", "Tigreal"]
};
const MAP_LIST = ["Broken Walls", "Dangerous Grass", "Expanding Rivers", "Flying Cloud"];

declare var __firebase_config: any; declare var __app_id: any; declare var __initial_auth_token: any;

function getStateSeed(state: any[]) { return state.map(m => `${m.id}-${m.s1}-${m.s2}`).join(''); }
function mulberry32(a: string) {
    let seed = 0; for (let i = 0; i < a.length; i++) seed = Math.imul(31, seed) + a.charCodeAt(i) | 0;
    return function() { var t = seed += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }
}
function getHeroImg(name: string) { return `https://cdn.jsdelivr.net/gh/Davton90/Js-Hero@main/Hero%20icon/${encodeURIComponent(name)}.png`; }

@Component({
    selector: 'app-root',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    template: `
    @if(!isAppReady()) {
        <div class="fixed inset-0 z-[9999] bg-[#0b0f1a] flex flex-col items-center justify-center">
            <div class="relative w-24 h-24 flex items-center justify-center">
                <div class="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping"></div>
                <div class="absolute inset-2 rounded-full border-2 border-blue-400/40 animate-ping" style="animation-delay: 0.2s"></div>
                <div class="absolute inset-4 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-[0_0_30px_rgba(59,130,246,0.6)] flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
            </div>
        </div>
    }

    <!-- MATCH CARD TEMPLATE -->
    <ng-template #matchCard let-m="m">
        <div class="p-3.5 rounded-2xl border mb-4 transition-all relative" [ngClass]="m.borderClass">
            <div class="flex justify-between items-center mb-3">
                <div class="flex items-center">
                    <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{{ highlightedTeam() ? 'W' + m.w + ' / Match ' + m.id : 'Match ' + m.id }}</span>
                    @if(m.isCrucial) { <span class="bg-gradient-to-r from-orange-600 to-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded ml-2 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse">🔥 KRUSIAL</span> }
                </div>
                <div class="flex items-center gap-2">
                    @if(m.s1 !== null && !m.fixed) {
                        <button (click)="clearMatch(m.id)" class="text-[10px] text-slate-400 hover:text-red-400 transition hover:bg-red-500/10 rounded-full p-1" title="Clear Prediksi">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                    }
                    <span class="text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1" [ngClass]="m.fixed ? 'bg-slate-800 text-emerald-400 border border-emerald-900/50' : (m.s1 !== null ? 'bg-blue-900/50 text-blue-400' : 'bg-[#1a2333] text-slate-400')">
                        @if(m.fixed) { <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> }
                        {{ m.fixed ? 'LOCKED / FINAL' : (m.s1 !== null ? 'PREDICTED' : 'UPCOMING') }}
                    </span>
                </div>
            </div>
            <div class="flex items-center justify-between gap-4">
                <div class="flex-1 flex justify-end items-center gap-3">
                    <span class="text-sm font-black text-right truncate" [ngClass]="m.t1 === highlightedTeam() ? 'text-yellow-400' : (m.t1 === 'RRQ Hoshi' ? 'text-orange-400' : 'text-slate-200')">{{ TEAM_ABBR[m.t1] || m.t1 }}</span>
                    @if(teamLogos()[m.t1]) { <img [src]="teamLogos()[m.t1]" class="w-6 h-6 object-contain drop-shadow-md shrink-0" alt="logo"> } 
                    @else { <div class="w-6 h-6 rounded flex items-center justify-center text-[10px] font-black shadow-sm shrink-0 bg-slate-800">{{ m.t1.substring(0,2).toUpperCase() }}</div> }
                </div>
                
                <div class="flex-none flex flex-col items-center justify-center min-w-[90px] relative">
                    @if(m.focusResult === 'WIN') { <span class="absolute -top-5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-black tracking-widest shadow-sm">WIN</span> } 
                    @else if(m.focusResult === 'LOSE') { <span class="absolute -top-5 bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-black tracking-widest shadow-sm">LOSE</span> }

                    @if(m.fixed) {
                        <div class="bg-slate-900/80 px-2 py-1 rounded-xl border border-emerald-900/40 shadow-inner flex items-center gap-1.5 cursor-pointer hover:bg-slate-800 transition-all"
                             (click)="openDraftModal(m)" (mouseenter)="showPreview(m, $event)" (mousemove)="updatePreviewPos($event)" (mouseleave)="hidePreview()">
                            <span class="font-black text-sm w-4 text-center" [ngClass]="m.s1 > m.s2 ? 'text-emerald-400' : 'text-slate-500'">{{m.s1}}</span>
                            <span class="bg-slate-700/80 text-[9px] text-white px-2 py-1 rounded-md font-bold shadow border border-slate-600/50">VS</span>
                            <span class="font-black text-sm w-4 text-center" [ngClass]="m.s2 > m.s1 ? 'text-emerald-400' : 'text-slate-500'">{{m.s2}}</span>
                        </div>
                    } @else {
                        <div class="p-1 rounded-xl border flex items-center gap-1.5 transition-all" [ngClass]="m.s1 !== null ? 'border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.15)] bg-[#1a2333]' : 'border-slate-700 bg-slate-900/80 shadow-inner'">
                            <select [value]="m.s1 === null ? 'null' : m.s1" (change)="onDropdownScore({id: m.id, team: 1, val: $any($event.target).value})" class="appearance-none bg-slate-800 text-white text-center font-bold rounded py-1 w-6 text-sm border hover:bg-slate-700 outline-none cursor-pointer" [ngClass]="m.s1 !== null ? 'border-blue-500/50 text-blue-400' : 'border-slate-600'" style="text-align-last: center;">
                                <option value="null">-</option><option value="0">0</option><option value="1">1</option><option value="2">2</option>
                            </select>
                            
                            <span (click)="openDraftModal(m)" (mouseenter)="showPreview(m, $event)" (mousemove)="updatePreviewPos($event)" (mouseleave)="hidePreview()"
                                  class="bg-slate-700/80 hover:bg-blue-600 cursor-pointer text-[9px] text-white px-2 py-1 rounded-md font-bold shadow border border-slate-600/50 transition-all relative z-10">VS</span>
                            
                            <select [value]="m.s2 === null ? 'null' : m.s2" (change)="onDropdownScore({id: m.id, team: 2, val: $any($event.target).value})" class="appearance-none bg-slate-800 text-white text-center font-bold rounded py-1 w-6 text-sm border hover:bg-slate-700 outline-none cursor-pointer" [ngClass]="m.s2 !== null ? 'border-blue-500/50 text-blue-400' : 'border-slate-600'" style="text-align-last: center;">
                                <option value="null">-</option><option value="0">0</option><option value="1">1</option><option value="2">2</option>
                            </select>
                        </div>
                    }
                    <span class="text-slate-400 text-[8.5px] font-bold mt-1.5 tracking-wider text-center leading-tight max-w-[130px] whitespace-normal">{{m.h2hText}}</span>
                </div>
                
                <div class="flex-1 flex justify-start items-center gap-3">
                    @if(teamLogos()[m.t2]) { <img [src]="teamLogos()[m.t2]" class="w-6 h-6 object-contain drop-shadow-md shrink-0" alt="logo"> } 
                    @else { <div class="w-6 h-6 rounded flex items-center justify-center text-[10px] font-black shadow-sm shrink-0 bg-slate-800">{{ m.t2.substring(0,2).toUpperCase() }}</div> }
                    <span class="text-sm font-black text-left truncate" [ngClass]="m.t2 === highlightedTeam() ? 'text-yellow-400' : (m.t2 === 'RRQ Hoshi' ? 'text-orange-400' : 'text-slate-200')">{{ TEAM_ABBR[m.t2] || m.t2 }}</span>
                </div>
            </div>
        </div>
    </ng-template>

    <div class="host-wrapper text-slate-100 min-h-screen pb-12 relative bg-[#0b0f1a] font-sans" [ngClass]="{'opacity-0': !isAppReady(), 'opacity-100 transition-opacity duration-1000': isAppReady()}">
        
        <div class="fixed top-5 left-1/2 text-white px-6 py-3 rounded-full shadow-2xl font-bold z-[10000] pointer-events-none flex items-center gap-2 toast-container" [ngClass]="{'toast-show': showToast(), 'bg-red-600': isToastError(), 'bg-emerald-600': !isToastError()}">
            <span>{{ toastMsg() }}</span>
        </div>

        <div class="bg-[#0c0c0c] border-b border-[#333] sticky top-0 z-[100] shadow-xl">
            <div class="max-w-[1400px] mx-auto px-4 flex justify-between items-center">
                <div class="flex">
                    <button (click)="activeTab.set('standings')" class="px-4 md:px-6 py-4 font-black uppercase tracking-wider text-xs md:text-sm transition-all border-b-2 flex items-center gap-2" [ngClass]="activeTab() === 'standings' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg> Standings
                    </button>
                    <button (click)="activeTab.set('analytics')" class="px-4 md:px-6 py-4 font-black uppercase tracking-wider text-xs md:text-sm transition-all border-b-2 flex items-center gap-2" [ngClass]="activeTab() === 'analytics' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg> Hero Statistics
                    </button>
                </div>
            </div>
        </div>

        <div class="max-w-[1400px] mx-auto px-4 pt-6">
            @if(activeTab() === 'standings') {
                <!-- STANDINGS TAB -->
                <header class="mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div class="text-center md:text-left">
                        <h1 class="text-4xl font-black text-white tracking-tighter uppercase italic flex items-center justify-center md:justify-start gap-3">MPL ID S17 <span class="text-blue-500">PREDICTOR</span></h1>
                        <p class="text-slate-400 font-medium mt-1">Simulasi Skenario & AI Analisis Klasemen</p>
                    </div>
                    <div class="flex flex-wrap items-center justify-center gap-3 bg-slate-800/50 p-2 rounded-2xl border border-slate-700">
                        <div class="px-4 py-2 border-r border-slate-700 flex flex-col justify-center">
                            <span class="block text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Sync</span>
                            <span class="font-bold text-sm" [ngClass]="syncColor()">{{ syncStatus() }}</span>
                        </div>
                        
                        <button (click)="shareStandings()" class="bg-slate-800 border border-slate-600 hover:bg-blue-600 text-slate-200 hover:text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm">Share</button>
                        <div class="relative group z-[60]">
                            <button class="bg-slate-800 border border-slate-600 hover:bg-indigo-600 text-slate-200 hover:text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm">Skenario ▾</button>
                            <div class="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 mt-2 w-[220px] bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all overflow-hidden z-[100]">
                                <div class="p-2.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest border-b border-slate-700 bg-slate-900/80 text-center">Simpan Skenario</div>
                                <div class="p-3 flex flex-wrap justify-center gap-2 border-b border-slate-700 bg-slate-800">
                                    @for(slot of [1,2,3,4,5,6,7,8,9]; track slot) { <button (click)="saveLocalScenario(slot)" class="w-8 h-8 rounded-lg bg-slate-700 hover:bg-emerald-500 hover:text-white font-black text-xs transition-all">{{slot}}</button> }
                                </div>
                                <div class="p-2.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest border-b border-slate-700 bg-slate-900/80 text-center">Muat Skenario</div>
                                <div class="p-3 flex flex-wrap justify-center gap-2 bg-slate-800">
                                    @for(slot of [1,2,3,4,5,6,7,8,9]; track slot) { <button (click)="loadLocalScenario(slot)" class="w-8 h-8 rounded-lg bg-slate-700 hover:bg-blue-500 hover:text-white font-black text-xs transition-all">{{slot}}</button> }
                                </div>
                            </div>
                        </div>
                        <button (click)="randomizeRemaining()" class="bg-slate-800 border border-slate-600 hover:bg-purple-600 text-slate-200 hover:text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm">Auto-Fill Semua</button>
                        <button (click)="resetSim()" class="bg-slate-800 border border-slate-600 hover:bg-red-600 text-slate-200 hover:text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm">Reset</button>
                    </div>
                </header>

                <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:h-[560px]">
                    <div class="lg:col-span-7 border border-[#333] rounded-3xl bg-[#111] shadow-2xl flex flex-col h-full overflow-hidden">
                        <div class="px-5 py-4 border-b border-[#333] bg-[#0c0c0c] shrink-0 flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <h2 class="text-xl font-black text-white tracking-wide uppercase">Regular Season</h2>
                                @if(isCalculating()) {
                                    <div class="flex items-center justify-center p-1" title="Menghitung...">
                                        <svg class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    </div>
                                }
                            </div>
                        </div>
                        <div class="flex-1 flex flex-col justify-between overflow-x-auto overflow-y-hidden bg-[#111]">
                            <div class="w-full">
                                <table class="liqui-table text-left whitespace-nowrap w-full">
                                    <thead>
                                        <tr>
                                            <th class="w-8 text-center cursor-pointer hover:bg-[#333]" (click)="handleSort('default')"># <span class="text-[10px] text-blue-400">{{sortCol()==='default' ? (sortAsc()?'▲':'▼') : ''}}</span></th>
                                            <th>Team</th>
                                            <th class="text-center w-12">M</th><th class="text-center w-12">G</th><th class="text-center w-12">Diff</th>
                                            <th class="text-center w-24">Form</th>
                                            <th class="text-center text-[11px] text-emerald-400 w-14 cursor-pointer" (click)="handleSort('playoff')">Playoff {{sortCol()==='playoff' ? (sortAsc()?'▲':'▼') : ''}}</th>
                                            <th class="text-center text-[11px] text-amber-500 w-14 cursor-pointer" (click)="handleSort('upper')">Upper {{sortCol()==='upper' ? (sortAsc()?'▲':'▼') : ''}}</th>
                                            <th class="text-center text-[11px] text-blue-400 w-14 cursor-pointer" (click)="handleSort('playin')">Play In {{sortCol()==='playin' ? (sortAsc()?'▲':'▼') : ''}}</th>
                                            <th class="text-center text-[11px] text-red-500 w-14 cursor-pointer" (click)="handleSort('elim')">Elim {{sortCol()==='elim' ? (sortAsc()?'▲':'▼') : ''}}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @for(t of sortedList(); track t.n; let i = $index) {
                                            <tr class="border-b border-[#333] transition-colors" [ngClass]="[i % 2 === 0 ? 'liqui-row-even' : 'liqui-row-odd', highlightedTeam() === t.n ? 'ring-2 ring-blue-500 ring-inset bg-blue-900/20' : 'hover:bg-[#2a2a2a]', (highlightedTeam() && highlightedTeam() !== t.n) ? 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100' : '']">
                                                <td class="text-center font-bold text-[14px] py-1.5" [ngClass]="t.trueRank > 6 ? 'rank-eliminated' : 'rank-playoff'">{{t.trueRank}}.</td>
                                                <td class="py-1.5 px-2 flex items-center gap-2 min-w-[130px]">
                                                    @if(teamLogos()[t.n]) { <img [src]="teamLogos()[t.n]" class="w-6 h-6 object-contain shrink-0"> } 
                                                    @else { <div class="w-6 h-6 rounded flex items-center justify-center text-[10px] font-black shrink-0 bg-slate-800">{{t.n.substring(0,2).toUpperCase()}}</div> }
                                                    <div class="flex items-center">
                                                        <span (click)="toggleHighlight(t.n)" class="team-link cursor-pointer" [ngClass]="highlightedTeam() === t.n ? 'text-yellow-400 font-black' : ''">{{t.n}}</span>
                                                        @if(getProb(t.n, 'upper') === 100) { <span class="text-[10px] text-amber-500 font-black ml-1 bg-amber-500/20 px-1 rounded">[U]</span> }
                                                        @else if(getProb(t.n, 'playoff') === 100) { <span class="text-[10px] text-emerald-500 font-black ml-1 bg-emerald-500/20 px-1 rounded">[P]</span> }
                                                        @else if(getProb(t.n, 'playoff') === 0) { <span class="text-[10px] text-red-500 font-black ml-1 bg-red-500/20 px-1 rounded">[E]</span> }
                                                    </div>
                                                </td>
                                                <td class="py-1.5 px-2 text-center font-bold text-white">{{t.mw}} - {{t.ml}}</td>
                                                <td class="py-1.5 px-2 text-center text-gray-300">{{t.gw}} - {{t.gl}}</td>
                                                <td class="py-1.5 px-2 text-center font-bold" [ngClass]="(t.gw - t.gl) > 0 ? 'text-white' : ((t.gw - t.gl) < 0 ? 'text-red-400' : 'text-gray-400')">{{(t.gw - t.gl) > 0 ? '+' : ''}}{{t.gw - t.gl}}</td>
                                                <td class="py-1.5 px-1 text-center whitespace-nowrap">
                                                    <div class="flex gap-1 justify-center items-center min-w-[105px]">
                                                        @for(_ of getEmptyFormArray(t.form.length); track $index) { <div class="w-[18px] h-[18px] rounded-full bg-slate-700/50 flex items-center justify-center text-[9px] text-slate-500 border border-slate-600/50 shrink-0">-</div> }
                                                        @for(fMatch of t.form; track $index) {
                                                            @if(teamLogos()[fMatch.opp]) { <img [src]="teamLogos()[fMatch.opp]" class="w-[18px] h-[18px] rounded-full object-contain bg-slate-800 shrink-0" [ngClass]="fMatch.res === 'W' ? 'ring-1 ring-emerald-500 border border-emerald-900' : 'ring-1 ring-red-500 border border-red-900'" [title]="fMatch.res + ' vs ' + fMatch.opp"> } 
                                                            @else { <div class="w-[18px] h-[18px] rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-black text-white shrink-0" [ngClass]="fMatch.res === 'W' ? 'ring-1 ring-emerald-500 border border-emerald-900' : 'ring-1 ring-red-500 border border-red-900'">{{fMatch.opp.substring(0,2).toUpperCase()}}</div> }
                                                        }
                                                    </div>
                                                </td>
                                                <td class="py-1.5 px-1.5 text-center text-[12px] font-semibold text-emerald-400 border-l border-[#333] bg-prob-cell"><div class="prob-bar bg-emerald-500" [style.width.%]="getProb(t.n, 'playoff')"></div>{{getProb(t.n, 'playoff')}}%</td>
                                                <td class="py-1.5 px-1.5 text-center text-[12px] font-semibold text-amber-500 bg-prob-cell"><div class="prob-bar bg-amber-500" [style.width.%]="getProb(t.n, 'upper')"></div>{{getProb(t.n, 'upper')}}%</td>
                                                <td class="py-1.5 px-1.5 text-center text-[12px] font-semibold text-blue-400 bg-prob-cell"><div class="prob-bar bg-blue-500" [style.width.%]="getProb(t.n, 'playin')"></div>{{getProb(t.n, 'playin')}}%</td>
                                                <td class="py-1.5 px-1.5 text-center text-[12px] font-semibold text-red-500 bg-prob-cell"><div class="prob-bar bg-red-500" [style.width.%]="getProb(t.n, 'elim')"></div>{{getProb(t.n, 'elim')}}%</td>
                                            </tr>
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- PANEL KANAN: JADWAL PREDIKSI -->
                    <div class="lg:col-span-5 bg-slate-800/60 backdrop-blur-md rounded-3xl border border-slate-700 shadow-2xl flex flex-col h-[550px] md:h-[600px] lg:h-full overflow-hidden">
                        <div class="px-5 py-4 border-b border-slate-700 bg-[#121826] shrink-0 flex items-center justify-between gap-4 h-[60px]">
                            <div id="weekNavScroll" class="flex gap-2 overflow-x-auto scrollbar-hide flex-1 scroll-smooth">
                                @if(highlightedTeam()) {
                                    <div class="bg-blue-900/40 text-blue-300 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-blue-500/50 w-full truncate">Fokus: {{ TEAM_ABBR[highlightedTeam()!] || highlightedTeam() }}</div>
                                } @else {
                                    @for(w of [1,2,3,4,5,6,7,8,9]; track w) {
                                        <button [id]="'week-btn-' + w" (click)="changeWeek(w)" class="px-4 py-1.5 rounded-xl border text-xs font-black transition-all shrink-0" [ngClass]="w === curWeek() ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 border-blue-500' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'">W{{w}}</button>
                                    }
                                }
                            </div>
                            @if(!highlightedTeam()) {
                                <div class="flex items-center gap-2 border-l border-slate-700 pl-4">
                                    <button (click)="randomizeCurrentWeek()" class="bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white border border-purple-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap transition-all" title="Acak Semua Match di Minggu Ini">Acak W{{curWeek()}}</button>
                                    <button (click)="clearCurrentWeek()" class="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap transition-all" title="Reset Semua Match di Minggu Ini">Clear W{{curWeek()}}</button>
                                </div>
                            }
                        </div>

                        <div id="matchScrollArea" class="flex-1 overflow-y-auto relative scroll-smooth bg-[#0b0f1a]/30 p-5 flex flex-col">
                            @if(highlightedTeam()) {
                                @if(getMatchesByFixed(true).length > 0) {
                                    <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Riwayat Pertandingan</h3>
                                    @for(m of getMatchesByFixed(true); track m.id) { <ng-container *ngTemplateOutlet="matchCard; context: { m: m }"></ng-container> }
                                }
                                @if(getMatchesByFixed(false).length > 0) {
                                    <h3 id="focus-upcoming-header" class="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-3 mt-4 pt-4 border-t border-slate-700">Sisa Jadwal Pertandingan</h3>
                                    @for(m of getMatchesByFixed(false); track m.id) { <ng-container *ngTemplateOutlet="matchCard; context: { m: m }"></ng-container> }
                                }
                            } @else {
                                @for(m of displayMatches(); track m.id) { <ng-container *ngTemplateOutlet="matchCard; context: { m: m }"></ng-container> }
                            }
                        </div>
                    </div>
                </div>

                <!-- AI INSIGHT CONTAINER -->
                @if(highlightedTeam() && currentAiInsight()) {
                    <div class="mt-6 w-full lg:w-7/12 transition-all duration-500">
                        <div class="bg-gradient-to-br border rounded-2xl shadow-2xl overflow-hidden transition-all duration-500" [ngClass]="currentAiInsight()?.statusColor">
                            <div class="px-6 pt-5 pb-4 border-b border-slate-700/50 flex justify-between items-center">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600/80 shadow-lg"><svg width="18" height="18" fill="none" stroke="white" stroke-width="2.5"><path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg></div>
                                    <div>
                                        <h3 class="text-white font-black text-base flex items-center gap-2">AI Insight <span class="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">✨ GEMINI</span></h3>
                                        <p class="text-slate-400 text-xs mt-0.5">{{currentAiInsight()?.abbr}} · Rank {{currentAiInsight()?.rank}}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="px-6 pb-5 pt-4">
                                @if(isAiLoading()) {
                                    <div class="space-y-2"><div class="h-3 bg-slate-700/60 rounded-full animate-pulse w-full"></div><div class="h-3 bg-slate-700/60 rounded-full animate-pulse w-4/5"></div></div>
                                } @else {
                                    <div class="space-y-3">
                                        @for(text of currentAiInsight()?.texts; track $index) {
                                            <div class="flex gap-2.5 items-start">
                                                <span class="shrink-0">{{ ['📊', '⚔️', '🔥', '🎯'][$index] || '💡' }}</span>
                                                <p class="text-sm text-slate-300 leading-relaxed">{{text}}</p>
                                            </div>
                                        }
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                }
            }

            <!-- TAB 2: HERO META ANALYTICS -->
            @if(activeTab() === 'analytics') {
                <div class="animate-fade-in pb-8">
                    <header class="mb-8">
                        <h1 class="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3"><span class="text-emerald-500">HERO</span> STATISTICS</h1>
                    </header>
                    <div class="bg-[#111] border border-[#333] rounded-3xl shadow-2xl overflow-hidden">
                        <div class="overflow-x-auto overflow-y-auto w-full relative max-h-[600px] lg:max-h-none">
                            <table class="liqui-table text-left whitespace-nowrap w-full min-w-[1000px]">
                                <thead class="bg-[#1a1a1a] sticky top-0 z-10 shadow-md">
                                    <tr class="text-[10px] uppercase tracking-wider text-slate-400 border-b border-[#333]">
                                        <th class="w-8 text-center" (click)="sortHero('name')">#</th>
                                        <th class="w-40 cursor-pointer hover:bg-[#333] border-r border-[#333]" (click)="sortHero('name')">Hero</th>
                                        <th class="text-center cursor-pointer hover:bg-[#333]" (click)="sortHero('picks')">Picks</th>
                                        <th class="text-center cursor-pointer hover:bg-[#333]" (click)="sortHero('bans')">Bans</th>
                                        <th class="text-center cursor-pointer hover:bg-[#333]" (click)="sortHero('pb_count')">P+B</th>
                                        <th class="text-center cursor-pointer hover:bg-[#333]" (click)="sortHero('w_rate')">WR %</th>
                                        <th class="text-center cursor-pointer hover:bg-[#333] border-l border-[#333]">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @for(h of processedHeroData(); track h.name; let i = $index) {
                                        <tr class="border-b border-[#333] hover:bg-[#2a2a2a]" [ngClass]="i % 2 === 0 ? 'liqui-row-even' : 'liqui-row-odd'">
                                            <td class="text-center font-bold text-slate-500 py-1.5">{{i + 1}}</td>
                                            <td class="py-1.5 px-2 flex items-center gap-3 border-r border-[#333]">
                                                <img [src]="getHeroIcon(h.name)" class="w-8 h-8 object-cover rounded shadow-md border border-slate-700">
                                                <span class="font-bold text-blue-400">{{h.name}}</span>
                                            </td>
                                            <td class="text-center font-bold text-white">{{h.picks}}</td>
                                            <td class="text-center font-bold text-white">{{h.bans}}</td>
                                            <td class="text-center font-bold text-orange-400">{{h.pb_count}}</td>
                                            <td class="text-center font-bold" [ngClass]="h.w_rate >= 50 ? 'text-emerald-400' : 'text-red-400'">{{h.w_rate}}%</td>
                                            <td class="text-center border-l border-[#333]">
                                                <button (click)="openHeroDetail(h.name)" class="bg-slate-700 hover:bg-slate-600 text-[10px] text-white px-2 py-1 rounded font-bold">Show</button>
                                            </td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            }
        </div>
    </div>

    <!-- HOVER DRAFT PREVIEW MODAL -->
    @if(hoveredMatchPreview() && draftState()[hoveredMatchPreview()!.id] && draftState()[hoveredMatchPreview()!.id].length > 0) {
        <div class="fixed z-[9999] pointer-events-none w-[380px] sm:w-[420px] bg-[#151a23] border border-slate-700 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-4 animate-fade-in hidden lg:block"
             [style.left.px]="previewX()" [style.top.px]="previewY()">
            <div class="flex justify-between items-center text-white font-black mb-4 border-b border-slate-700/80 pb-3 px-2">
                <div class="flex items-center gap-2 w-1/3">
                    <span class="text-blue-400 text-base truncate">{{ TEAM_ABBR[hoveredMatchPreview()!.t1] || hoveredMatchPreview()!.t1 }}</span>
                    @if(teamLogos()[hoveredMatchPreview()!.t1]) { <img [src]="teamLogos()[hoveredMatchPreview()!.t1]" class="w-6 h-6 object-contain"> }
                </div>
                <div class="text-lg bg-[#0b0f1a] border border-slate-700 px-4 py-0.5 rounded shadow-inner w-1/3 text-center tracking-widest flex flex-col items-center">
                    <span>{{hoveredMatchPreview()!.s1 !== null ? hoveredMatchPreview()!.s1 : '-'}} : {{hoveredMatchPreview()!.s2 !== null ? hoveredMatchPreview()!.s2 : '-'}}</span>
                </div>
                <div class="flex items-center gap-2 w-1/3 justify-end">
                    @if(teamLogos()[hoveredMatchPreview()!.t2]) { <img [src]="teamLogos()[hoveredMatchPreview()!.t2]" class="w-6 h-6 object-contain"> }
                    <span class="text-red-400 text-base truncate">{{ TEAM_ABBR[hoveredMatchPreview()!.t2] || hoveredMatchPreview()!.t2 }}</span>
                </div>
            </div>
            <div class="space-y-4">
                @for(game of draftState()[hoveredMatchPreview()!.id]; track $index) {
                    <div class="flex flex-col border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
                        <div class="flex justify-between items-center w-full mb-1">
                            <div class="flex items-center gap-2 w-[40%]">
                                <div class="w-5 h-5 rounded text-[9px] font-black flex items-center justify-center text-white shadow" [ngClass]="game.t1Result === 'W' ? 'bg-emerald-600 border border-emerald-500' : (game.t1Result === 'L' ? 'bg-red-600 border border-red-500' : 'bg-slate-700')">{{game.t1Result || '-'}}</div>
                                <div class="flex gap-0.5">
                                    @for(p of game.t1Picks; track $index) {
                                        @if(p) { <img [src]="getHeroIcon(p)" class="w-7 h-7 rounded border object-cover" [ngClass]="game.t1Side === 'blue' ? 'border-blue-500' : 'border-red-500'"> }
                                        @else { <div class="w-7 h-7 rounded border border-slate-700 bg-[#0b0f1a]"></div> }
                                    }
                                </div>
                            </div>
                            <div class="flex flex-col items-center justify-center w-[20%] text-center">
                                <span class="text-xs text-slate-200 font-bold">{{game.duration || '00:00'}}</span>
                            </div>
                            <div class="flex items-center gap-2 w-[40%] justify-end">
                                <div class="flex gap-0.5">
                                    @for(p of game.t2Picks; track $index) {
                                        @if(p) { <img [src]="getHeroIcon(p)" class="w-7 h-7 rounded border object-cover" [ngClass]="game.t2Side === 'blue' ? 'border-blue-500' : 'border-red-500'"> }
                                        @else { <div class="w-7 h-7 rounded border border-slate-700 bg-[#0b0f1a]"></div> }
                                    }
                                </div>
                                <div class="w-5 h-5 rounded text-[9px] font-black flex items-center justify-center text-white shadow" [ngClass]="game.t2Result === 'W' ? 'bg-emerald-600 border border-emerald-500' : (game.t2Result === 'L' ? 'bg-red-600 border border-red-500' : 'bg-slate-700')">{{game.t2Result || '-'}}</div>
                            </div>
                        </div>
                    </div>
                }
            </div>
        </div>
    }

    <!-- DRAFT MODAL FOR MATCHES (Hanya Mode Viewer) -->
    @if(draftModalMatch()) {
        <div class="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-[#1a1f2e] border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in relative">
                <div class="bg-[#0f141e] px-6 py-4 border-b border-slate-700 flex justify-between items-center shrink-0">
                    <div>
                        <span class="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded uppercase font-black tracking-widest">W{{draftModalMatch().w}} - MATCH {{draftModalMatch().id}}</span>
                        <h2 class="text-xl font-black text-white mt-1 uppercase">{{ TEAM_ABBR[draftModalMatch().t1] || draftModalMatch().t1 }} vs {{ TEAM_ABBR[draftModalMatch().t2] || draftModalMatch().t2 }}</h2>
                    </div>
                    <button (click)="closeDraftModal()" class="w-8 h-8 rounded-full bg-slate-800 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-all text-slate-400">X</button>
                </div>
                <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    @if(!draftState()[draftModalMatch().id] || draftState()[draftModalMatch().id].length === 0) {
                        <div class="text-center text-slate-500 py-10 font-bold border-2 border-dashed border-slate-700 rounded-2xl bg-slate-800/30">
                            Data draft belum dimasukkan via HTML Master Editor.<br>
                            <span class="text-xs font-normal opacity-70 mt-2 block">Anda masih bisa menebak skor klasemen pertandingan ini secara manual dari Dropdown.</span>
                        </div>
                    }

                    @for(game of draftState()[draftModalMatch().id] || []; track $index; let gIdx = $index) {
                        <div class="bg-[#121620] border border-slate-700 rounded-2xl p-4 shadow-lg relative">
                            <span class="absolute left-4 top-2 text-[9px] font-black uppercase tracking-widest" [ngClass]="game.t1Side === 'blue' ? 'text-blue-500' : 'text-red-500'">{{game.t1Side}} Side</span>
                            <span class="absolute right-4 top-2 text-[9px] font-black uppercase tracking-widest" [ngClass]="game.t2Side === 'blue' ? 'text-blue-500' : 'text-red-500'">{{game.t2Side}} Side</span>

                            <div class="flex items-center justify-between mt-4">
                                <div class="flex items-center gap-1.5 sm:gap-2 w-[40%]">
                                    <div class="w-5 h-5 sm:w-6 sm:h-6 rounded text-[10px] font-black flex items-center justify-center border shadow-sm" 
                                         [ngClass]="game.t1Result === 'W' ? 'bg-emerald-500 text-white border-emerald-400' : (game.t1Result === 'L' ? 'bg-red-500 text-white border-red-400' : 'bg-slate-800 text-slate-500 border-slate-700')">
                                         {{game.t1Result || '-'}}</div>
                                    @for(p of [0,1,2,3,4]; track p) {
                                        <div class="relative w-8 h-8 sm:w-10 sm:h-10 rounded border-2 overflow-hidden"
                                             [ngClass]="game.t1Side === 'blue' ? 'border-blue-500/80 bg-blue-900/30' : 'border-red-500/80 bg-red-900/30'">
                                            <span class="absolute top-0 left-0 bg-black/80 text-[8px] text-white px-1 rounded-br z-10">{{p+1}}</span>
                                            @if(game.t1Picks[p]) { <img [src]="getHeroIcon(game.t1Picks[p])" class="w-full h-full object-cover"> }
                                        </div>
                                    }
                                </div>
                                <div class="flex flex-col items-center justify-center w-[20%] gap-1 text-white font-black text-xs sm:text-sm">
                                    {{game.duration || '00:00'}}
                                </div>
                                <div class="flex items-center justify-end gap-1.5 sm:gap-2 w-[40%]">
                                    @for(p of [0,1,2,3,4]; track p) {
                                        <div class="relative w-8 h-8 sm:w-10 sm:h-10 rounded border-2 overflow-hidden"
                                             [ngClass]="game.t2Side === 'blue' ? 'border-blue-500/80 bg-blue-900/30' : 'border-red-500/80 bg-red-900/30'">
                                            <span class="absolute top-0 left-0 bg-black/80 text-[8px] text-white px-1 rounded-br z-10">{{p+1}}</span>
                                            @if(game.t2Picks[p]) { <img [src]="getHeroIcon(game.t2Picks[p])" class="w-full h-full object-cover"> }
                                        </div>
                                    }
                                    <div class="w-5 h-5 sm:w-6 sm:h-6 rounded text-[10px] font-black flex items-center justify-center border shadow-sm" 
                                         [ngClass]="game.t2Result === 'W' ? 'bg-emerald-500 text-white border-emerald-400' : (game.t2Result === 'L' ? 'bg-red-500 text-white border-red-400' : 'bg-slate-800 text-slate-500 border-slate-700')">
                                         {{game.t2Result || '-'}}</div>
                                </div>
                            </div>
                            <div class="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center">
                                <div class="flex gap-1">
                                    @for(b of [0,1,2,3,4]; track b) {
                                        <div class="relative w-6 h-6 sm:w-7 sm:h-7 rounded border border-slate-600 bg-slate-800 overflow-hidden">
                                            <span class="absolute top-0 left-0 bg-black/80 text-[7px] text-white px-0.5 rounded-br z-10">{{b+1}}</span>
                                            @if(game.t1Bans[b]) { <img [src]="getHeroIcon(game.t1Bans[b])" class="w-full h-full object-cover grayscale"> }
                                        </div>
                                    }
                                </div>
                                <span class="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Game {{gIdx+1}} Bans</span>
                                <div class="flex gap-1">
                                    @for(b of [0,1,2,3,4]; track b) {
                                        <div class="relative w-6 h-6 sm:w-7 sm:h-7 rounded border border-slate-600 bg-slate-800 overflow-hidden">
                                            <span class="absolute top-0 left-0 bg-black/80 text-[7px] text-white px-0.5 rounded-br z-10">{{b+1}}</span>
                                            @if(game.t2Bans[b]) { <img [src]="getHeroIcon(game.t2Bans[b])" class="w-full h-full object-cover grayscale"> }
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                    }
                </div>
            </div>
        </div>
    }

    <!-- HERO DETAILED STATS MODAL -->
    @if(heroDetailModal()) {
        <div class="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-[#1a1f2e] border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in relative">
                <div class="bg-[#0f141e] px-6 py-4 border-b border-slate-700 flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <img [src]="getHeroIcon(heroDetailModal()!)" class="w-8 h-8 object-cover rounded border border-slate-600">
                        <h2 class="text-base font-black text-white uppercase">{{heroDetailModal()}} Stats</h2>
                    </div>
                    <button (click)="closeHeroDetail()" class="text-slate-400 hover:text-white font-bold px-3 py-1 bg-slate-800 rounded text-xs">Tutup (X)</button>
                </div>
                <div class="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-[#111] border border-slate-700 rounded-xl overflow-hidden">
                        <div class="bg-slate-800 py-2 text-center text-xs font-black uppercase text-slate-300 border-b border-slate-700">Played By Teams</div>
                        <table class="liqui-table w-full text-xs">
                            <thead><tr><th>Team</th><th class="text-center">Σ</th><th class="text-center">W</th><th class="text-center">L</th><th class="text-center">WR</th></tr></thead>
                            <tbody>
                                @for(d of heroDetailData().byTeam; track d.name; let i=$index) {
                                    <tr [ngClass]="i%2===0?'liqui-row-even':'liqui-row-odd'">
                                        <td class="font-bold text-slate-100 px-2 py-1.5">{{d.name}}</td>
                                        <td class="text-center font-bold text-white">{{d.total}}</td><td class="text-center text-emerald-400">{{d.w}}</td><td class="text-center text-red-400">{{d.l}}</td><td class="text-center font-bold text-white">{{d.wr}}%</td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                    <div class="bg-[#111] border border-slate-700 rounded-xl overflow-hidden">
                        <div class="bg-slate-800 py-2 text-center text-xs font-black uppercase text-slate-300 border-b border-slate-700">Played With</div>
                        <table class="liqui-table w-full text-xs">
                            <thead><tr><th>Hero</th><th class="text-center">Σ</th><th class="text-center">W</th><th class="text-center">L</th><th class="text-center">WR</th></tr></thead>
                            <tbody>
                                @for(d of heroDetailData().withHero; track d.name; let i=$index) {
                                    <tr [ngClass]="i%2===0?'liqui-row-even':'liqui-row-odd'">
                                        <td class="font-bold px-2 py-1.5 flex items-center gap-2"><img [src]="getHeroIcon(d.name)" class="w-5 h-5 object-cover rounded border border-slate-600"> <span class="text-slate-100 font-bold truncate max-w-[70px]">{{d.name}}</span></td>
                                        <td class="text-center font-bold text-white">{{d.total}}</td><td class="text-center text-emerald-400">{{d.w}}</td><td class="text-center text-red-400">{{d.l}}</td><td class="text-center font-bold text-white">{{d.wr}}%</td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                    <div class="bg-[#111] border border-slate-700 rounded-xl overflow-hidden">
                        <div class="bg-slate-800 py-2 text-center text-xs font-black uppercase text-slate-300 border-b border-slate-700">Played Against</div>
                        <table class="liqui-table w-full text-xs">
                            <thead><tr><th>Hero</th><th class="text-center">Σ</th><th class="text-center">W</th><th class="text-center">L</th><th class="text-center">WR</th></tr></thead>
                            <tbody>
                                @for(d of heroDetailData().againstHero; track d.name; let i=$index) {
                                    <tr [ngClass]="i%2===0?'liqui-row-even':'liqui-row-odd'">
                                        <td class="font-bold px-2 py-1.5 flex items-center gap-2"><img [src]="getHeroIcon(d.name)" class="w-5 h-5 object-cover rounded border border-slate-600"> <span class="text-slate-100 font-bold truncate max-w-[70px]">{{d.name}}</span></td>
                                        <td class="text-center font-bold text-white">{{d.total}}</td><td class="text-center text-emerald-400">{{d.w}}</td><td class="text-center text-red-400">{{d.l}}</td><td class="text-center font-bold text-white">{{d.wr}}%</td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    }
    `,
    styles: [`
        .host-wrapper { font-family: 'Inter', sans-serif; }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
        .liqui-table { border-collapse: collapse; font-size: 12px; }
        .liqui-table th { font-weight: bold; padding: 8px; }
        .liqui-row-even { background-color: #161616; }
        .liqui-row-odd { background-color: #111111; }
        .rank-playoff { background-color: #1e4a2e; color: white; border-right: 1px solid #333; }
        .rank-eliminated { background-color: #5c1c1c; color: white; border-right: 1px solid #333; }
        .team-link { color: #66b2ff; text-decoration: none; font-weight: 500; transition: all 0.2s; cursor: pointer; }
        .team-link:hover { text-decoration: underline; color: #99ccff; }
        .bg-prob-cell { position: relative; z-index: 1; }
        .prob-bar { position: absolute; top: 0; bottom: 0; left: 0; z-index: -1; opacity: 0.2; transition: width 0.3s ease; }
        .toast-container { transition: visibility 0s, opacity 0.3s ease-in-out, transform 0.3s ease-in-out; transform: translate(-50%, -20px); visibility: hidden; opacity: 0; }
        .toast-show { visibility: visible; opacity: 1; transform: translate(-50%, 0); }
        .solid-sticky-header { background-color: #0d121c; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); }
    `]
})
export class App implements OnInit {
    TEAM_ABBR = TEAM_ABBR;
    LOGO_COLORS = LOGO_COLORS;
    HERO_ROLES = HERO_ROLES as Record<string, string[]>;
    MAP_LIST = MAP_LIST;
    heroRoleKeys = computed(() => Object.keys(HERO_ROLES));
    allHeroes = computed(() => Object.values(this.HERO_ROLES).flat().sort());
    
    isAppReady = signal(false);
    activeTab = signal<'standings' | 'analytics'>('standings');
    isAdminMode = signal<boolean>(false);
    
    state = signal<any[]>([]);
    curWeek = signal<number>(1);
    probs = signal<Record<string, any>>({});
    highlightedTeam = signal<string | null>(null);
    focusFilter = signal<string>('all');
    teamLogos = signal<Record<string, string>>(FALLBACK_LOGOS);
    sortCol = signal<string>('default');
    sortAsc = signal<boolean>(true);
    
    draftState = signal<Record<number, any[]>>({}); 
    draftModalMatch = signal<any>(null);
    
    hoveredMatchPreview = signal<any>(null);
    previewX = signal<number>(0);
    previewY = signal<number>(0);
    
    sideView = signal<'all' | 'blue' | 'red'>('all');
    heroSortCol = signal<string>('pb_rate');
    heroSortAsc = signal<boolean>(false);
    heroDetailModal = signal<string | null>(null);

    isCalculating = signal(false);
    syncStatus = signal("Mendengarkan Master DB...");
    syncColor = signal("text-slate-400");
    toastMsg = signal("");
    showToast = signal(false);
    isToastError = signal(false);

    insightCache: Record<string, any> = {};
    currentAiInsight = signal<any>(null);
    isAiLoading = signal(false);
    coachMessage = signal<string | null>(null);
    isCoachLoading = signal(false);

    db: any;
    auth: any;
    currentUser: any;
    appId: any;
    officialMatches: any[] = [];

    baseList = computed(() => this.calculate(this.state()));
    sortedList = computed(() => {
        let temp = [...this.baseList()];
        temp.forEach((t, i) => t.trueRank = i + 1);
        if (this.sortCol() !== 'default') {
            temp.sort((a, b) => {
                let valA = parseFloat(this.probs()[a.n]?.[this.sortCol()] || 0);
                let valB = parseFloat(this.probs()[b.n]?.[this.sortCol()] || 0);
                if (valA === valB) return a.trueRank - b.trueRank; 
                return this.sortAsc() ? valA - valB : valB - valA;
            });
        } else if (!this.sortAsc()) { temp.reverse(); }
        return temp;
    });

    activeTeamData = computed(() => this.highlightedTeam() ? this.sortedList().find(t => t.n === this.highlightedTeam()) : null);
    winRate = computed(() => (this.activeTeamData() && (this.activeTeamData()!.mw + this.activeTeamData()!.ml > 0)) ? Math.round((this.activeTeamData()!.mw / (this.activeTeamData()!.mw + this.activeTeamData()!.ml)) * 100) : 0);
    
    teamMatchesRaw = computed(() => this.state().filter(m => m.t1 === this.highlightedTeam() || m.t2 === this.highlightedTeam()));
    upcomingMatchesAll = computed(() => this.teamMatchesRaw().filter(m => !m.fixed));
    remOpponents = computed(() => this.upcomingMatchesAll().map(m => m.t1 === this.highlightedTeam() ? m.t2 : m.t1));
    
    sosStats = computed(() => {
        let diffScore = 0;
        this.remOpponents().forEach(opp => {
            let oppData = this.sortedList().find(x => x.n === opp);
            if(oppData && (oppData.mw + oppData.ml > 0)) diffScore += oppData.mw / (oppData.mw + oppData.ml);
        });
        let avgDiff = this.remOpponents().length > 0 ? (diffScore / this.remOpponents().length) : 0;
        let label = "Mudah", color = "text-emerald-400";
        if(this.remOpponents().length === 0) { label = "Selesai"; color = "text-slate-500"; }
        else if (avgDiff >= 0.55) { label = "Sangat Sulit"; color = "text-red-500"; }
        else if (avgDiff >= 0.45) { label = "Sulit"; color = "text-orange-400"; }
        else if (avgDiff >= 0.35) { label = "Sedang"; color = "text-yellow-400"; }
        return { label, color };
    });

    displayMatches = computed(() => this.getDisplayMatches(this.state(), this.highlightedTeam(), this.focusFilter(), this.sortedList()));

    getTotalGamesPlayed() {
        let count = 0;
        Object.values(this.draftState()).forEach(games => count += games.length);
        return Math.max(1, count); 
    }

    processedHeroData = computed(() => {
        const stats: Record<string, any> = {};
        Object.values(HERO_ROLES).flat().forEach(h => {
            stats[h] = { name: h, picks: 0, bans: 0, wins: 0, losses: 0, bPicks: 0, bWins: 0, bLosses: 0, rPicks: 0, rWins: 0, rLosses: 0 };
        });

        let totalGames = 0;
        Object.values(this.draftState()).forEach(matchDrafts => {
            matchDrafts.forEach(game => {
                totalGames++;
                
                const processPicks = (picks: any[], side: string, res: string|null) => {
                    picks.forEach(h => {
                        if(!h) return;
                        if(!stats[h]) stats[h] = { name: h, picks: 0, bans: 0, wins: 0, losses: 0, bPicks: 0, bWins: 0, bLosses:0, rPicks: 0, rWins: 0, rLosses:0 };
                        stats[h].picks++;
                        if (res === 'W') stats[h].wins++; else if (res === 'L') stats[h].losses++;
                        if (side === 'blue') { stats[h].bPicks++; if(res === 'W') stats[h].bWins++; else if(res==='L') stats[h].bLosses++; }
                        else { stats[h].rPicks++; if(res === 'W') stats[h].rWins++; else if(res==='L') stats[h].rLosses++; }
                    });
                };
                processPicks(game.t1Picks, game.t1Side, game.t1Result);
                processPicks(game.t2Picks, game.t2Side, game.t2Result);

                const processBans = (bans: any[]) => {
                    bans.forEach(h => {
                        if(h) { if(!stats[h]) stats[h] = { name: h, picks: 0, bans: 0, wins: 0, losses: 0, bPicks: 0, bWins: 0, bLosses:0, rPicks: 0, rWins: 0, rLosses:0 }; stats[h].bans++; }
                    });
                }
                processBans(game.t1Bans);
                processBans(game.t2Bans);
            });
        });

        const tg = Math.max(1, totalGames);

        let arr = Object.values(stats).filter(h => (h.picks + h.bans) > 0).map(h => {
            return {
                ...h,
                p_rate: parseFloat(((h.picks / tg) * 100).toFixed(2)),
                b_rate: parseFloat(((h.bans / tg) * 100).toFixed(2)),
                pb_count: h.picks + h.bans,
                pb_rate: parseFloat((((h.picks + h.bans) / tg) * 100).toFixed(2)),
                w_rate: h.picks > 0 ? parseFloat(((h.wins / h.picks) * 100).toFixed(2)) : 0,
                b_winrate: h.bPicks > 0 ? parseFloat(((h.bWins / h.bPicks) * 100).toFixed(2)) : 0,
                r_winrate: h.rPicks > 0 ? parseFloat(((h.rWins / h.rPicks) * 100).toFixed(2)) : 0,
            }
        });

        const col = this.heroSortCol() as keyof typeof arr[0];
        const asc = this.heroSortAsc();

        arr.sort((a: any, b: any) => {
            if (a[col] === b[col]) return a.name.localeCompare(b.name);
            if (typeof a[col] === 'number') return asc ? a[col] - b[col] : b[col] - a[col];
            return asc ? a[col].localeCompare(b[col]) : b[col].localeCompare(a[col]);
        });

        return arr;
    });

    heroDetailData = computed(() => {
        const hero = this.heroDetailModal();
        if(!hero) return { byTeam: [], withHero: [], againstHero: [] };

        let byTeam: any = {};
        let withHero: any = {};
        let againstHero: any = {};

        Object.entries(this.draftState()).forEach(([mId, games]) => {
            const match = this.state().find(x => x.id == mId);
            if(!match) return;

            games.forEach(g => {
                let t1Has = g.t1Picks.includes(hero);
                let t2Has = g.t2Picks.includes(hero);
                if(!t1Has && !t2Has) return;

                let myTeamStr = t1Has ? match.t1 : match.t2;
                let myRes = t1Has ? g.t1Result : g.t2Result;
                let myPicks = t1Has ? g.t1Picks : g.t2Picks;
                let oppPicks = t1Has ? g.t2Picks : g.t1Picks;

                let tAbbr = TEAM_ABBR[myTeamStr] || myTeamStr;
                if(!byTeam[tAbbr]) byTeam[tAbbr] = { name: tAbbr, total: 0, w: 0, l: 0 };
                byTeam[tAbbr].total++;
                if(myRes==='W') byTeam[tAbbr].w++; else if(myRes==='L') byTeam[tAbbr].l++;

                myPicks.forEach(h => {
                    if(h && h !== hero) {
                        if(!withHero[h]) withHero[h] = { name: h, total: 0, w: 0, l: 0 };
                        withHero[h].total++;
                        if(myRes==='W') withHero[h].w++; else if(myRes==='L') withHero[h].l++;
                    }
                });

                oppPicks.forEach(h => {
                    if(h && h !== hero) {
                        if(!againstHero[h]) againstHero[h] = { name: h, total: 0, w: 0, l: 0 };
                        againstHero[h].total++;
                        if(myRes==='W') againstHero[h].w++; else if(myRes==='L') againstHero[h].l++;
                    }
                });
            });
        });

        const proc = (obj: any) => Object.values(obj).map((x:any) => ({...x, wr: x.total>0 ? ((x.w/x.total)*100).toFixed(2) : 0})).sort((a:any, b:any) => b.total - a.total).slice(0, 5);

        return { byTeam: proc(byTeam), withHero: proc(withHero), againstHero: proc(againstHero) };
    });

    constructor() {
        effect(() => {
            const team = this.highlightedTeam();
            untracked(() => {
                if (team) {
                    this.triggerAiInsight(team);
                    setTimeout(() => {
                        const el = document.getElementById('focus-upcoming-header');
                        const scrollArea = document.getElementById('matchScrollArea');
                        if (el && scrollArea) scrollArea.scrollTo({ top: el.offsetTop - 50, behavior: 'smooth' });
                    }, 150);
                } else {
                    this.currentAiInsight.set(null);
                }
            });
        });
    }

    async ngOnInit() {
        this.teamLogos.set(FALLBACK_LOGOS);
        await this.initBaseState();
        setTimeout(() => {
            this.isAppReady.set(true);
            this.initFirebase();
        }, 500); 
    }

    showPreview(match: any, e: MouseEvent) {
        this.hoveredMatchPreview.set(match);
        this.updatePreviewPos(e);
    }
    updatePreviewPos(e: MouseEvent) {
        let x = e.clientX - 450; 
        if (x < 20) x = e.clientX + 30; 
        let y = e.clientY - 150; 
        if (y < 20) y = 20; 
        this.previewX.set(x);
        this.previewY.set(y);
    }
    hidePreview() { this.hoveredMatchPreview.set(null); }

    toggleAdmin() {
        if (this.isAdminMode()) {
            this.isAdminMode.set(false);
            this.triggerToast("Mode Admin Dinonaktifkan.");
            return;
        }
        const pwd = prompt("Masukkan Kunci Rahasia Admin:");
        if (pwd === "admin123") {
            this.isAdminMode.set(true);
            this.triggerToast("Mode Admin Diaktifkan! Akses Edit Terbuka.");
        } else if (pwd !== null) {
            this.triggerToast("Kunci Rahasia Salah!", true);
        }
    }

    getHeroIcon(name: string) { return getHeroImg(name); }

    async initBaseState() {
        let tempState: any[] = [];
        this.officialMatches = []; 

        let id = 1;
        // Pre-fill state
        history.forEach(m => {
            tempState.push({id: m.id || id++, w: m.w, t1: TM[m.t1] || m.t1, t2: TM[m.t2] || m.t2, s1: m.s1, s2: m.s2, fixed: true, _csvParsed: false});
        });
        schedule.forEach(wf => wf.m.forEach((match: any) => {
            tempState.push({id: id++, w: wf.w, t1: TM[match[0]] || match[0], t2: TM[match[1]] || match[1], s1: null, s2: null, fixed: false, _csvParsed: false});
        }));

        let csvSuccess = false;
        try {
            const response = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vQwzlnkdzl35CJbFKAxHW9EW7Gcqfke2L5wlqLASrgP4saIhukb_1YYg12ERreQOK7nm48SXTCT6E6O/pub?gid=156965032&single=true&output=csv");
            if (response.ok) {
                const csvText = await response.text();
                const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l);
                
                for (let i = 0; i < lines.length; i++) {
                    const tokens = lines[i].split(',');
                    let t1 = null, t2 = null, s1: number | null = null, s2: number | null = null;
                    
                    for (let j = 0; j < tokens.length; j++) {
                        let val = tokens[j].trim();
                        let upVal = val.toUpperCase();
                        
                        let teamMatch = Object.keys(TM).find(k => k.toUpperCase() === upVal || TM[k].toUpperCase() === upVal);
                        if (teamMatch) {
                            if (!t1) t1 = TM[teamMatch];
                            else if (!t2) t2 = TM[teamMatch];
                        } else if ((val === '0' || val === '1' || val === '2' || val === '3') && t1) {
                            if (s1 === null) s1 = parseInt(val);
                            else if (s2 === null) s2 = parseInt(val);
                        }
                    }

                    if (t1 && t2 && s1 !== null && s2 !== null) {
                        let targetMatch = tempState.find(m => 
                            ((m.t1 === t1 && m.t2 === t2) || (m.t1 === t2 && m.t2 === t1)) && !m._csvParsed
                        );

                        if (targetMatch) {
                            if (targetMatch.t1 === t2 && targetMatch.t2 === t1) {
                                targetMatch.s1 = s2;
                                targetMatch.s2 = s1;
                            } else {
                                targetMatch.s1 = s1;
                                targetMatch.s2 = s2;
                            }
                            targetMatch.fixed = true;
                            targetMatch._csvParsed = true;
                            csvSuccess = true;
                        }
                    }
                }
            }
        } catch(e) {
            console.error("Gagal meload CSV dari Spreadsheet", e);
        }

        // Jika CSV gagal atau data kosong, pastikan data history default terkunci
        if (!csvSuccess) {
            history.forEach(m => {
                let targetMatch = tempState.find(x => x.id === m.id);
                if(targetMatch) {
                    targetMatch.s1 = m.s1;
                    targetMatch.s2 = m.s2;
                    targetMatch.fixed = true;
                }
            });
        }

        // Bangun ulang data pertandingan resmi (kunci spreadsheet)
        tempState.forEach(m => {
            if (m.fixed) {
                this.officialMatches.push({ id: m.id, s1: m.s1, s2: m.s2 });
            }
            delete m._csvParsed; 
        });

        this.state.set(tempState);

        let tempProbs: any = {};
        TEAMS.forEach(t => tempProbs[t] = {upper: 0, playin: 0, playoff: 0, elim: 0});
        this.probs.set(tempProbs);
        
        this.determineCurrentWeek();
        this.runSimulation();
    }

    determineCurrentWeek() {
        let unplayedMatch = this.state().find(m => m.s1 === null);
        if (unplayedMatch) {
            this.curWeek.set(unplayedMatch.w);
        } else {
            this.curWeek.set(Math.max(...this.state().map(m => m.w)));
        }
        this.scrollToActiveWeek();
    }

    scrollToActiveWeek() {
        setTimeout(() => {
            const container = document.getElementById('weekNavScroll');
            const activeBtn = document.getElementById('week-btn-' + this.curWeek());
            if (container && activeBtn) {
                const scrollLeft = activeBtn.offsetLeft - (container.clientWidth / 2) + (activeBtn.clientWidth / 2);
                container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            }
        }, 100);
    }

    async initFirebase() {
        try {
            let firebaseConfig = null;
            
            if (typeof __firebase_config !== 'undefined' && __firebase_config) {
                firebaseConfig = JSON.parse(__firebase_config);
                this.appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            } 
            else if (CUSTOM_FIREBASE_CONFIG && CUSTOM_FIREBASE_CONFIG.apiKey && !CUSTOM_FIREBASE_CONFIG.apiKey.includes('GANTI_DENGAN')) {
                firebaseConfig = CUSTOM_FIREBASE_CONFIG;
                this.appId = CUSTOM_APP_ID;
            } else {
                throw new Error("No valid Firebase Config found");
            }
            
            const app = initializeApp(firebaseConfig);
            this.auth = getAuth(app);
            this.db = getFirestore(app);

            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(this.auth, __initial_auth_token);
            } else {
                await signInAnonymously(this.auth);
            }

            onAuthStateChanged(this.auth, async (user: any) => {
                this.currentUser = user;
                if (user) {
                    this.updateSync("Connected", "text-emerald-400");
                    this.listenToGlobalDrafts();
                    await this.loadDataFromCloud();
                }
            });
        } catch(e) {
            this.updateSync("Offline", "text-slate-400");
        }
    }

    listenToGlobalDrafts() {
        if (!this.db || !this.currentUser) return;
        
        const docRef = doc(this.db, 'artifacts', this.appId, 'public', 'data', 'mpl_global', 'drafts_data');
        
        onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const globalDrafts = docSnap.data()['drafts'];
                if (globalDrafts) {
                    this.draftState.set(globalDrafts);
                    this.syncMatchesFromDrafts(globalDrafts);
                    this.triggerToast("Data Update: Diterima dari Master DB!", false);
                }
            }
        }, (error) => {
            console.error("Error listening to global drafts:", error);
            this.updateSync("Error Sync", "text-red-500");
        });
    }

    syncMatchesFromDrafts(drafts: Record<number, any[]>) {
        this.state.update(currentMatches => currentMatches.map(m => {
            const hMatch = this.officialMatches.find(hm => hm.id === m.id);

            if (hMatch) {
                return { ...m, s1: hMatch.s1, s2: hMatch.s2, fixed: true };
            }

            if (drafts[m.id] && drafts[m.id].length > 0) {
                let s1Score = 0;
                let s2Score = 0;
                
                drafts[m.id].forEach(g => {
                    if (g.t1Result === 'W') s1Score++;
                    if (g.t2Result === 'W') s2Score++;
                });

                const isFinished = s1Score > 0 || s2Score > 0;
                return { ...m, s1: s1Score, s2: s2Score, fixed: isFinished };
            }
            
            return { ...m, fixed: false };
        }));
        
        this.determineCurrentWeek();
        this.triggerCalculation();
    }

    async loadDataFromCloud() {
        if (!this.currentUser || !this.db) return;
        try {
            const docRef = doc(this.db, 'artifacts', this.appId, 'users', this.currentUser.uid, 'predictions', 'saved_state');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data()['matches']) {
                const savedData = docSnap.data()['matches'];
                this.state.update(s => s.map(m => {
                    const sm = savedData.find((x:any) => x.id === m.id);
                    if (sm && !m.fixed) { return { ...m, s1: sm.s1, s2: sm.s2 }; }
                    return m;
                }));
                this.determineCurrentWeek();
                this.triggerCalculation();
            }
            this.updateSync("Cloud Synced", "text-emerald-400");
        } catch (e) {
            this.updateSync("Sync Failed", "text-red-400");
        }
    }

    saveToCloud() {
        if (!this.currentUser || !this.db) return;
        try {
            const dataToSave = this.state().filter(m => !m.fixed).map(m => ({ id: m.id, s1: m.s1, s2: m.s2 }));
            const docRef = doc(this.db, 'artifacts', this.appId, 'users', this.currentUser.uid, 'predictions', 'saved_state');
            setDoc(docRef, { matches: dataToSave }, { merge: true });
        } catch (e) {
            console.error("Save failed", e);
        }
    }

    updateSync(msg: string, color: string) {
        this.syncStatus.set(msg);
        this.syncColor.set(color);
    }

    calculate(matches: any[]) {
        let s: any = {};
        TEAMS.forEach(t => s[t] = {n: t, mw: 0, ml: 0, gw: 0, gl: 0, h2h: {}, form: []});
        TEAMS.forEach(t1 => TEAMS.forEach(t2 => s[t1].h2h[t2] = 0));

        matches.forEach(m => {
            if(m.s1 !== null && m.s2 !== null) {
                s[m.t1].gw += m.s1; s[m.t1].gl += m.s2;
                s[m.t2].gw += m.s2; s[m.t2].gl += m.s1;
                
                if(m.s1 > m.s2) { 
                    s[m.t1].mw++; s[m.t2].ml++; 
                    s[m.t1].h2h[m.t2]++; 
                    s[m.t1].form.push({ res: 'W', opp: m.t2 }); 
                    s[m.t2].form.push({ res: 'L', opp: m.t1 });
                } else if (m.s2 > m.s1) { 
                    s[m.t2].mw++; s[m.t1].ml++; 
                    s[m.t2].h2h[m.t1]++; 
                    s[m.t2].form.push({ res: 'W', opp: m.t1 }); 
                    s[m.t1].form.push({ res: 'L', opp: m.t2 });
                }
            }
        });

        TEAMS.forEach(t => { s[t].form = s[t].form.slice(-5); });

        return Object.values(s).sort((a: any, b: any) => {
            if(b.mw !== a.mw) return b.mw - a.mw;
            let gdA = a.gw - a.gl, gdB = b.gw - b.gl;
            if(gdB !== gdA) return gdB - gdA;
            let h2hDiff = b.h2h[a.n] - a.h2h[b.n];
            if(h2hDiff !== 0) return h2hDiff;
            return a.n.localeCompare(b.n);
        });
    }

    runSimulation() {
        const iterations = 20000; 
        let counts: Record<string, any> = {};
        TEAMS.forEach(t => counts[t] = {upper: 0, playin: 0, playoff: 0, elim: 0});

        let seed = getStateSeed(this.state());
        let seededRandom = mulberry32(seed);

        const teamIndices: Record<string, number> = {};
        TEAMS.forEach((t, i) => teamIndices[t] = i);

        const baseMw = new Int32Array(9);
        const baseMl = new Int32Array(9);
        const baseGw = new Int32Array(9);
        const baseGl = new Int32Array(9);
        const baseH2h = Array.from({length: 9}, () => new Int32Array(9));

        const unplayed: {t1: number, t2: number}[] = [];

        for (let i = 0; i < this.state().length; i++) {
            const m = this.state()[i];
            const t1 = teamIndices[m.t1];
            const t2 = teamIndices[m.t2];

            if (m.s1 !== null && m.s2 !== null) {
                baseGw[t1] += m.s1; baseGl[t1] += m.s2;
                baseGw[t2] += m.s2; baseGl[t2] += m.s1;
                if (m.s1 > m.s2) {
                    baseMw[t1]++; baseMl[t2]++;
                    baseH2h[t1][t2]++;
                } else if(m.s2 > m.s1) {
                    baseMw[t2]++; baseMl[t1]++;
                    baseH2h[t2][t1]++;
                }
            } else {
                unplayed.push({t1, t2});
            }
        }

        const unplayedLen = unplayed.length;
        const simMw = new Int32Array(9);
        const simGw = new Int32Array(9);
        const simGl = new Int32Array(9);
        const simH2h = new Int32Array(81);
        const baseH2hFlat = new Int32Array(81);
        for(let i=0; i<9; i++) for(let j=0; j<9; j++) baseH2hFlat[i*9+j] = baseH2h[i][j];
        const standings = [0, 1, 2, 3, 4, 5, 6, 7, 8];

        for (let iter = 0; iter < iterations; iter++) {
            for (let i = 0; i < 9; i++) { simMw[i] = baseMw[i]; simGw[i] = baseGw[i]; simGl[i] = baseGl[i]; }
            for (let i = 0; i < 81; i++) { simH2h[i] = baseH2hFlat[i]; }

            for (let i = 0; i < unplayedLen; i++) {
                const m = unplayed[i];
                const rand = seededRandom();
                const clean = seededRandom() > 0.5;
                const win = rand > 0.5;

                const s1 = win ? 2 : (clean ? 0 : 1);
                const s2 = win ? (clean ? 0 : 1) : 2;

                simGw[m.t1] += s1; simGl[m.t1] += s2;
                simGw[m.t2] += s2; simGl[m.t2] += s1;
                if (s1 > s2) { simMw[m.t1]++; simH2h[m.t1 * 9 + m.t2]++; } else { simMw[m.t2]++; simH2h[m.t2 * 9 + m.t1]++; }
            }

            standings.sort((a, b) => {
                if (simMw[b] !== simMw[a]) return simMw[b] - simMw[a];
                const gdA = simGw[a] - simGl[a];
                const gdB = simGw[b] - simGl[b];
                if (gdB !== gdA) return gdB - gdA;
                const h2hDiff = simH2h[b * 9 + a] - simH2h[a * 9 + b];
                if (h2hDiff !== 0) return h2hDiff;
                return TEAMS[a].localeCompare(TEAMS[b]);
            });

            for (let i = 0; i < 9; i++) {
                const teamName = TEAMS[standings[i]];
                if (i < 2) counts[teamName].upper++;
                if (i >= 2 && i < 6) counts[teamName].playin++;
                if (i < 6) counts[teamName].playoff++;
                if (i >= 6) counts[teamName].elim++;
            }
        }

        let tempProbs: Record<string, any> = {};
        TEAMS.forEach(t => {
            tempProbs[t] = {
                upper: (counts[t].upper / iterations * 100).toFixed(2),
                playin: (counts[t].playin / iterations * 100).toFixed(2),
                playoff: (counts[t].playoff / iterations * 100).toFixed(2),
                elim: (counts[t].elim / iterations * 100).toFixed(2)
            };
        });
        this.probs.set(tempProbs);
    }

    triggerCalculation() {
        this.isCalculating.set(true);
        setTimeout(() => {
            this.runSimulation();
            this.saveToCloud();
            this.isCalculating.set(false);
        }, 20); 
    }

    getProb(team: string, type: string) { return parseFloat(this.probs()[team]?.[type] || 0); }
    min(a: number, b: number) { return Math.min(a, b); }
    getEmptyFormArray(len: number) { return Array(Math.max(0, 5 - len)).fill(0); }
    getMatchesByFixed(fixed: boolean) { return this.displayMatches().filter(m => m.fixed === fixed); }

    handleSort(col: string) {
        if (this.sortCol() === col) this.sortAsc.set(!this.sortAsc());
        else { this.sortCol.set(col); this.sortAsc.set(col === 'default'); }
    }

    sortHero(col: string) {
        if (this.heroSortCol() === col) this.heroSortAsc.set(!this.heroSortAsc());
        else { this.heroSortCol.set(col); this.heroSortAsc.set(false); }
    }

    toggleHighlight(teamName: string | null) {
        this.highlightedTeam.set((this.highlightedTeam() === teamName) ? null : teamName);
        this.focusFilter.set('all');
        this.coachMessage.set(null);
        if (!teamName) this.scrollToActiveWeek();
    }

    setFocusFilter(f: string) { this.focusFilter.set(f); }
    changeWeek(w: number) { 
        this.curWeek.set(w); 
        this.scrollToActiveWeek();
    }

    onDropdownScore(event: {id: number, team: number, val: string}) {
        let val = event.val === 'null' ? null : parseInt(event.val);
        this.state.update(s => s.map(m => {
            if (m.id === event.id && !m.fixed) {
                let newM = {...m};
                if (event.team === 1) {
                    newM.s1 = val;
                    if (val === 2) { if (newM.s2 === 2 || newM.s2 === null) newM.s2 = 0; } 
                    else if (val === 1 || val === 0) newM.s2 = 2;
                } else {
                    newM.s2 = val;
                    if (val === 2) { if (newM.s1 === 2 || newM.s1 === null) newM.s1 = 0; } 
                    else if (val === 1 || val === 0) newM.s1 = 2;
                }
                return newM;
            }
            return m;
        }));
        this.triggerCalculation();
    }

    clearMatch(id: number) {
        this.state.update(s => s.map(m => (m.id === id && !m.fixed) ? { ...m, s1: null, s2: null } : m));
        this.triggerCalculation();
    }
    
    clearCurrentWeek() {
        this.state.update(s => s.map(m => (m.w === this.curWeek() && !m.fixed) ? { ...m, s1: null, s2: null } : m));
        this.triggerCalculation();
    }
    
    randomizeCurrentWeek() {
        this.state.update(s => s.map(m => {
            if(!m.fixed && m.w === this.curWeek() && m.s1 === null) {
                let win = Math.random() > 0.5; let clean = Math.random() > 0.5;
                return { ...m, s1: win ? 2 : (clean ? 0 : 1), s2: win ? (clean ? 0 : 1) : 2 };
            }
            return m;
        }));
        this.triggerCalculation();
    }

    randomizeRemaining() {
        this.state.update(s => s.map(m => {
            if(!m.fixed && m.s1 === null) {
                let win = Math.random() > 0.5; let clean = Math.random() > 0.5;
                return { ...m, s1: win ? 2 : (clean ? 0 : 1), s2: win ? (clean ? 0 : 1) : 2 };
            }
            return m;
        }));
        this.insightCache = {};
        this.triggerCalculation();
    }
    resetSim() {
        this.state.update(s => s.map(m => !m.fixed ? { ...m, s1: null, s2: null } : m));
        this.insightCache = {};
        this.determineCurrentWeek(); 
        this.triggerCalculation();
    }

    saveLocalScenario(slotNum: number) {
        const dataToSave = this.state().filter(m => !m.fixed).map(m => ({ id: m.id, s1: m.s1, s2: m.s2 }));
        localStorage.setItem(`mpl_id_scenario_slot_${slotNum}`, JSON.stringify(dataToSave));
        this.triggerToast(`Prediksi berhasil disimpan ke Slot ${slotNum}`);
    }
    loadLocalScenario(slotNum: number) {
        const savedStr = localStorage.getItem(`mpl_id_scenario_slot_${slotNum}`);
        if(savedStr) {
            const savedData = JSON.parse(savedStr);
            this.state.update(s => s.map(m => {
                const sm = savedData.find((x:any) => x.id === m.id);
                return (sm && !m.fixed) ? { ...m, s1: sm.s1, s2: sm.s2 } : m;
            }));
            this.triggerCalculation();
            this.triggerToast(`Memuat Skenario dari Slot ${slotNum}`);
        } else {
            this.triggerToast(`Slot ${slotNum} masih kosong!`, true);
        }
    }
    triggerToast(msg: string, isError = false) {
        this.toastMsg.set(msg);
        this.isToastError.set(isError);
        this.showToast.set(true);
        setTimeout(() => this.showToast.set(false), 3000);
    }

    shareStandings() {
        let text = "🔮 MPL ID S17 Predictor - Klasemen Saat Ini:\n\n";
        this.sortedList().forEach((t, i) => {
            let pUpper = parseFloat(this.probs()[t.n]?.upper || 0);
            let pPlayoff = parseFloat(this.probs()[t.n]?.playoff || 0);
            let tag = pUpper === 100 ? " [U]" : (pPlayoff === 100 ? " [P]" : (pPlayoff === 0 ? " [E]" : ""));
            text += `${i+1}. ${t.n} (${t.mw}-${t.ml})${tag}\n`;
        });
        
        const predictedMatches = this.state().filter(m => !m.fixed && m.s1 !== null && m.s2 !== null);
        
        if (predictedMatches.length > 0) {
            text += "\n🎯 Hasil Prediksi Skor:\n";
            predictedMatches.forEach(m => {
                text += `- ${this.TEAM_ABBR[m.t1] || m.t1} ${m.s1} - ${m.s2} ${this.TEAM_ABBR[m.t2] || m.t2} (W${m.w})\n`;
            });
        }

        text += "\nBuat prediksimu sendiri!";
        
        const el = document.createElement('textarea'); 
        el.value = text; 
        document.body.appendChild(el); 
        el.select(); 
        document.execCommand('copy'); 
        document.body.removeChild(el);
        
        this.triggerToast("Teks Prediksi Disalin ke Clipboard!");
    }

    getDisplayMatches(currentState: any[], focusTeam: string | null, filter: string, currentList: any[]) {
        let matches = currentState;
        if (focusTeam) {
            matches = matches.filter(m => m.t1 === focusTeam || m.t2 === focusTeam);
            if (filter === 'win') matches = matches.filter(m => m.s1 !== null && m.s2 !== null && ((m.t1 === focusTeam && m.s1 > m.s2) || (m.t2 === focusTeam && m.s2 > m.s1)));
            else if (filter === 'lose') matches = matches.filter(m => m.s1 !== null && m.s2 !== null && ((m.t1 === focusTeam && m.s1 < m.s2) || (m.t2 === focusTeam && m.s2 < m.s1)));
        } else {
            matches = matches.filter(m => m.w === this.curWeek());
        }

        return matches.map(m => {
            let h2hT1 = 0, h2hT2 = 0;
            currentState.forEach(x => {
                if (x.fixed && x.id !== m.id) {
                    if (x.t1 === m.t1 && x.t2 === m.t2) { if (x.s1 > x.s2) h2hT1++; else h2hT2++; }
                    else if (x.t1 === m.t2 && x.t2 === m.t1) { if (x.s2 > x.s1) h2hT1++; else h2hT2++; }
                }
            });

            let encounters = currentState.filter(x => x.fixed && ((x.t1 === m.t1 && x.t2 === m.t2) || (x.t1 === m.t2 && x.t2 === m.t1))).sort((a,b) => a.id - b.id);
            let h2hStrings = encounters.map((enc, idx) => {
                 let winTeam = enc.s1 > enc.s2 ? enc.t1 : enc.t2;
                 let winScore = Math.max(enc.s1, enc.s2);
                 let loseScore = Math.min(enc.s1, enc.s2);
                 return `Leg ${idx+1}: ${TEAM_ABBR[winTeam] || winTeam} ${winScore}-${loseScore}`;
            });
            let h2hText = h2hStrings.length > 0 ? h2hStrings.join(' - ') : 'Belum bertemu';

            let rankT1 = currentList.find(t => t.n === m.t1)?.trueRank || 0;
            let rankT2 = currentList.find(t => t.n === m.t2)?.trueRank || 0;
            let isCrucial = (!m.fixed && (rankT1 >= 3 && rankT1 <= 7) && (rankT2 >= 3 && rankT2 <= 7) && Math.abs(rankT1 - rankT2) <= 3);

            let focusResult = null;
            if (focusTeam && (m.s1 !== null || m.fixed)) {
                let focusScore = m.t1 === focusTeam ? m.s1 : m.s2;
                let oppScore = m.t1 === focusTeam ? m.s2 : m.s1;
                if (focusScore > oppScore) focusResult = 'WIN';
                else if (focusScore < oppScore) focusResult = 'LOSE';
            }

            let borderClass = 'border-slate-700 bg-[#121826] hover:bg-[#1a2333]'; 
            let isFocusCard = focusTeam && (m.t1 === focusTeam || m.t2 === focusTeam);
            let isRRQ = !isFocusCard && (m.t1 === 'RRQ Hoshi' || m.t2 === 'RRQ Hoshi');
            if (isFocusCard) borderClass = 'border-yellow-500/50 bg-yellow-900/10 hover:bg-yellow-900/20 shadow-[0_0_15px_rgba(234,179,8,0.05)]';
            else if (isRRQ) borderClass = 'border-orange-500/40 bg-orange-950/20 hover:bg-orange-950/30';

            return { ...m, h2hT1, h2hT2, h2hText, isCrucial, focusResult, borderClass, isFocusCard };
        });
    }

    // --- DRAFT MODAL VIEW ONLY ---
    openDraftModal(match: any) {
        this.draftModalMatch.set(match);
    }
    closeDraftModal() { 
        this.draftModalMatch.set(null); 
    }

    openHeroDetail(hero: string) { this.heroDetailModal.set(hero); }
    closeHeroDetail() { this.heroDetailModal.set(null); }

    // --- GEMINI AI INSIGHTS ---
    async triggerAiInsight(teamName: string) {
        let teamData = this.sortedList().find(t => t.n === teamName);
        if(!teamData) return;

        let seed = getStateSeed(this.state());
        let cacheKey = `${teamName}-${seed}`;
        
        if (this.insightCache[cacheKey]) {
            this.currentAiInsight.set(this.insightCache[cacheKey]);
            return;
        }

        this.isAiLoading.set(true);
        this.currentAiInsight.set(null);

        const pPlayoff = parseFloat(this.probs()[teamName].playoff);
        let magicNum: number | null = null;
        if (pPlayoff !== 100 && pPlayoff !== 0) {
            let remaining = this.state().filter(m => !m.fixed && (m.t1 === teamName || m.t2 === teamName)).length;
            for (let wins = 0; wins <= remaining; wins++) {
                let simState = this.state().map(m => {
                    if (m.fixed || (m.t1 !== teamName && m.t2 !== teamName)) return m;
                    if (m.s1 !== null) return m;
                    return { ...m };
                });
                let teamMatches = simState.filter(m => !m.fixed && m.s1 === null && (m.t1 === teamName || m.t2 === teamName));
                let filledIds = new Set();
                teamMatches.forEach((m, idx) => {
                    let isHome = m.t1 === teamName;
                    m.s1 = idx < wins ? (isHome ? 2 : 0) : (isHome ? 0 : 2);
                    m.s2 = idx < wins ? (isHome ? 0 : 2) : (isHome ? 2 : 0);
                    filledIds.add(m.id);
                });
                simState = simState.map(m => m.s1 === null ? { ...m, s1: 1, s2: 2 } : m);
                let res = this.calculate(simState);
                if (res.findIndex((t:any) => t.n === teamName) < 6) { magicNum = wins; break; }
            }
            if(magicNum === null) magicNum = remaining;
        }

        let teamPicks: Record<string, {games: number, wins: number}> = {};
        let teamBans: Record<string, number> = {};
        let oppBans: Record<string, number> = {};
        let teamCombos: Record<string, number> = {};

        Object.entries(this.draftState()).forEach(([mId, games]) => {
            const match = this.state().find(x => x.id == mId);
            if (!match) return;

            const isT1 = match.t1 === teamName;
            const isT2 = match.t2 === teamName;
            if (!isT1 && !isT2) return;

            games.forEach(g => {
                let myPicks = isT1 ? g.t1Picks : g.t2Picks;
                let myBans = isT1 ? g.t1Bans : g.t2Bans;
                let opBans = isT1 ? g.t2Bans : g.t1Bans;
                let myRes = isT1 ? g.t1Result : g.t2Result;

                let validPicks = myPicks.filter((h:any) => h);
                validPicks.forEach((h:any) => {
                    if(!teamPicks[h]) teamPicks[h] = {games: 0, wins: 0};
                    teamPicks[h].games++;
                    if(myRes === 'W') teamPicks[h].wins++;
                });

                for(let i=0; i<validPicks.length; i++) {
                    for(let j=i+1; j<validPicks.length; j++) {
                        let combo = [validPicks[i], validPicks[j]].sort().join(' + ');
                        teamCombos[combo] = (teamCombos[combo] || 0) + 1;
                    }
                }

                myBans.filter((h:any)=>h).forEach((h:any) => teamBans[h] = (teamBans[h]||0)+1);
                opBans.filter((h:any)=>h).forEach((h:any) => oppBans[h] = (oppBans[h]||0)+1);
            });
        });

        const topPicks = Object.entries(teamPicks).sort((a,b) => b[1].games - a[1].games).slice(0, 4).map(x => `${x[0]} (${x[1].games}x, WR ${Math.round((x[1].wins/x[1].games)*100)}%)`);
        const topBans = Object.entries(teamBans).sort((a,b) => b[1] - a[1]).slice(0, 3).map(x => `${x[0]} (${x[1]}x)`);
        const topOppBans = Object.entries(oppBans).sort((a,b) => b[1] - a[1]).slice(0, 3).map(x => `${x[0]} (${x[1]}x)`);
        const topCombos = Object.entries(teamCombos).sort((a,b) => b[1] - a[1]).slice(0, 3).map(x => `${x[0]} (${x[1]}x)`);

        const heroDataText = `\n\n[Analisis Draft & Hero Tim]\n- Hero Paling Sering Dipakai & Winrate: ${topPicks.length > 0 ? topPicks.join(', ') : 'Belum ada data'}\n- Kombinasi Duo Hero Sering Dipakai: ${topCombos.length > 0 ? topCombos.join(', ') : 'Belum ada data'}\n- Hero Paling Sering Di-Ban OLEH Tim Ini: ${topBans.length > 0 ? topBans.join(', ') : 'Belum ada data'}\n- Hero Paling Sering Di-Ban MUSUH saat lawan tim ini (Target Banned): ${topOppBans.length > 0 ? topOppBans.join(', ') : 'Belum ada data'}`;

        const played = teamData.mw + teamData.ml;
        const remaining = 16 - played;
        const remOpp = this.state().filter(m => !m.fixed && m.s1 === null && (m.t1 === teamName || m.t2 === teamName)).map(m => m.t1 === teamName ? m.t2 : m.t1);
        const rivals = this.sortedList().filter(t => t.n !== teamName && (Math.abs(t.trueRank - teamData!.trueRank) <= 2 || Math.abs(t.mw - teamData!.mw) <= 1)).map(t => TEAM_ABBR[t.n] || t.n);
        const form5 = teamData.form.map((f:any) => f.res).join('');
        const abbr = TEAM_ABBR[teamName] || teamName;

        let statusColor = 'from-blue-900/60 to-slate-900/80 border-blue-600/40';
        let statusLabel = `Peringkat ${teamData.trueRank}`;
        const pUpper = parseFloat(this.probs()[teamName].upper);
        if (pPlayoff === 100 && pUpper === 100) { statusColor = 'from-amber-900/60 to-slate-900/80 border-amber-500/40'; statusLabel = '🔒 Upper Bracket'; }
        else if (pPlayoff === 100) { statusColor = 'from-emerald-900/60 to-slate-900/80 border-emerald-500/40'; statusLabel = '✅ Playoff Aman'; }
        else if (pPlayoff === 0) { statusColor = 'from-red-900/60 to-slate-900/80 border-red-500/40'; statusLabel = '❌ Tereliminasi'; }
        else if (pPlayoff >= 75) { statusColor = 'from-emerald-900/40 to-slate-900/80 border-emerald-600/30'; statusLabel = '🟢 Posisi Kuat'; }
        else if (pPlayoff >= 40) { statusColor = 'from-yellow-900/40 to-slate-900/80 border-yellow-600/30'; statusLabel = '🟡 Zona Bahaya'; }
        else { statusColor = 'from-red-900/40 to-slate-900/80 border-red-600/30'; statusLabel = '🔴 Butuh Keajaiban'; }

        let fallbackData = {
            abbr, rank: teamData.trueRank, mw: teamData.mw, ml: teamData.ml,
            remOppLength: remOpp.length, magicNum, pPlayoff, pUpper, pPlayin: this.probs()[teamName].playin, pElim: this.probs()[teamName].elim,
            form5, statusColor, statusLabel, teamName
        };

        try {
            const prompt = `Berdasarkan data berikut untuk tim ${teamName} (singkatan: ${abbr}):
- Peringkat: ${teamData.trueRank} dari 9 tim
- Rekor: ${teamData.mw}W - ${teamData.ml}L
- Game Diff: ${teamData.gw - teamData.gl > 0 ? '+' : ''}${teamData.gw - teamData.gl}
- Lawan Sisa: [${remOpp.map(o => TEAM_ABBR[o]||o).join(', ')||'selesai'}]
- Form 5 Laga: ${form5 || 'belum ada data'}
- Prob Playoff: ${pPlayoff}%, Prob Upper Bracket: ${pUpper}%
- Magic Number Playoff: ${magicNum === null ? (pPlayoff===100 ? 'Aman' : 'Tereliminasi') : magicNum}
- Pesaing Terdekat: ${rivals.slice(0,4).join(', ')||'-'}
${heroDataText}

Berikan 5 poin insight analisis yang SANGAT DETAIL, komprehensif, dan tajam dalam Bahasa Indonesia. Bahas peluang mereka, kekuatan/kelemahan form mereka, dan spesifik bedah strategi draft mereka berdasarkan statistik hero pick, ban, winrate hero, dan kombo di atas.`;

            const apiKey = "";
            const payload = {
                contents: [{ parts: [{ text: prompt }] }],
                systemInstruction: { parts: [{ text: "Kamu adalah analis esports profesional MPL ID S17. Jangan batasi responmu, buatlah analisis detail dan panjang." }] },
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            insights: { type: "ARRAY", items: { type: "STRING", description: "Analisis detail dan panjang, sekitar 30-60 kata per insight." } }
                        }
                    }
                }
            };

            const data = await this.fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, payload);
            
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            let parsed = { insights: [] };
            if (rawText) {
                try { parsed = JSON.parse(rawText); } catch(e) {}
            }

            this.insightCache[cacheKey] = { ...fallbackData, texts: parsed.insights || [] };
        } catch (err) {
            let texts = [];
            texts.push(`📊 Berada di peringkat ${teamData.trueRank} dengan rekor ${teamData.mw}W-${teamData.ml}L. Game diff ${teamData.gw - teamData.gl > 0 ? '+' : ''}${teamData.gw - teamData.gl}.`);
            if (pPlayoff === 100 && pUpper === 100) texts.push(`🏆 Upper Bracket TERKUNCI. Tim ini dipastikan finis Top 2.`);
            else if (pPlayoff === 100) texts.push(`✅ Tiket Playoff AMAN. Tidak mungkin terdepak dari Top 6.`);
            else if (pPlayoff === 0) texts.push(`❌ Secara matematis sudah TERELIMINASI dari persaingan Playoff.`);
            else if (magicNum !== null) texts.push(`🎯 Magic Number: butuh minimal ${magicNum} kemenangan lagi dari ${remOpp.length} laga sisa.`);
            
            if (topPicks.length > 0) texts.push(`⚔️ Kunci kekuatan ada di pick andalan: ${topPicks.join(', ')}.`);
            if (topOppBans.length > 0) texts.push(`🛡️ Tim lawan sangat mewaspadai hero: ${topOppBans.join(', ')}.`);
            if (topCombos.length > 0) texts.push(`🔥 Kombo berbahaya yang sering digunakan: ${topCombos.join(', ')}.`);

            this.insightCache[cacheKey] = { ...fallbackData, texts: texts.slice(0, 5) };
        }
        
        this.currentAiInsight.set(this.insightCache[cacheKey]);
        this.isAiLoading.set(false);
    }

    async fetchWithRetry(url: string, payload: any, retries = 5) {
        const delays = [1000, 2000, 4000, 8000, 16000];
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (e) {
                if (i === retries - 1) throw e;
                await new Promise(res => setTimeout(res, delays[i]));
            }
        }
    }

    async askCoachGemini(teamName: string) {
        if (this.isCoachLoading()) return;
        this.isCoachLoading.set(true);
        this.coachMessage.set(null);

        let teamData = this.sortedList().find(t => t.n === teamName);
        if(!teamData) {
            this.isCoachLoading.set(false);
            return;
        }

        try {
            const prompt = `Berikan pep talk/pesan motivasi singkat (maksimal 40 kata) bergaya coach esports profesional yang berapi-api untuk tim ${teamName}.
Kondisi saat ini: rekor ${teamData.mw} Menang, ${teamData.ml} Kalah. Peringkat ${teamData.trueRank} klasemen.`;

            const apiKey = "";
            const payload = {
                contents: [{ parts: [{ text: prompt }] }],
                systemInstruction: { parts: [{ text: "Kamu adalah coach esports yang penuh semangat dan motivasi." }] }
            };

            const data = await this.fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, payload);
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            this.coachMessage.set(text || "Tetap semangat dan fokus pada pertandingan berikutnya!");
        } catch(e) {
            this.coachMessage.set("Maaf, Coach sedang sibuk menyusun strategi. Coba lagi nanti!");
        } finally {
            this.isCoachLoading.set(false);
        }
    }
}
