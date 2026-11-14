// Native DOM renderer: this game has no runtime dependencies.
function h(tag, props, ...children) {
    if (typeof tag === 'function')
        return tag({ ...props, children });
    const svgTags = new Set(['svg', 'g', 'path', 'ellipse', 'circle', 'rect', 'line', 'polygon', 'polyline']);
    const el = svgTags.has(tag) ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
    for (const [key, value] of Object.entries(props || {})) {
        if (key === 'key' || value == null || value === false)
            continue;
        if (key === 'className')
            el.setAttribute('class', value);
        else if (key === 'style')
            Object.assign(el.style, value);
        else if (key.startsWith('on'))
            el.addEventListener(key.slice(2).toLowerCase(), value);
        else if (['checked', 'disabled', 'autoFocus'].includes(key))
            el[key === 'autoFocus' ? 'autofocus' : key] = value;
        else
            el.setAttribute(key === 'viewBox' ? key : key.replace(/[A-Z]/g, c => '-' + c.toLowerCase()), value === true ? '' : value);
    }
    for (const child of children.flat(Infinity)) {
        if (child != null && child !== false)
            el.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return el;
}
const initial = readSettings();
let screen = 'home', mode = 'fruit', round = 0, won = false, wrong = null, hint = false, settings = false, chinese = initial.chinese ?? true, sound = initial.sound ?? true, music = false, holding = false;
const timers = { current: [] }, hold = { current: null }, player = { current: null };
let renderPending = false, hintTimer = null, musicContext = null, musicTimer = null;
function update() { if (!renderPending) {
    renderPending = true;
    queueMicrotask(() => { renderPending = false; render(); });
} }
function render() { const wasSettings = !!document.querySelector('.settings'); const focused = document.activeElement?.getAttribute('aria-label'); document.getElementById('root').replaceChildren(App()); if (focused) {
    [...document.querySelectorAll('[aria-label]')].find(el => el.getAttribute('aria-label') === focused)?.focus();
} if (settings && !wasSettings)
    document.querySelector('.close')?.focus(); }
function save() { try {
    localStorage.setItem('lily-settings', JSON.stringify({ chinese, sound }));
}
catch { } }
function setScreen(v) { screen = v; if (v !== 'play')
    clearTimeout(hintTimer); update(); }
function setMode(v) { mode = v; update(); }
function setRound(v) { round = v; update(); }
function setWon(v) { won = v; update(); }
function setWrong(v) { wrong = v; update(); }
function setHint(v) { hint = v; update(); }
function setSettings(v) { settings = v; if (v)
    clearTimeout(hintTimer);
else if (screen === 'play' && !won)
    scheduleHint(); update(); }
function setChinese(v) { chinese = v; save(); update(); }
function setSound(v) { sound = v; save(); if (!v)
    window.speechSynthesis?.cancel(); update(); }
function setHolding(v) { holding = v; const btn = document.querySelector('.parents'); btn?.classList.toggle('holding', v); }
function setMusic(v) { music = v; if (musicTimer)
    clearInterval(musicTimer); if (musicContext) {
    musicContext.close();
    musicContext = null;
} if (v) {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (Context) {
        const ctx = musicContext = new Context(), notes = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];
        let i = 0;
        const note = () => { if (ctx.state === 'closed')
            return; const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = notes[i++ % notes.length]; g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(.025, ctx.currentTime + .15); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + 1.7); o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 1.8); };
        note();
        musicTimer = setInterval(note, 2200);
    }
} update(); }
function scheduleHint() { clearTimeout(hintTimer); hintTimer = setTimeout(() => { if (screen === 'play' && !won && !settings)
    setHint(true); }, 8000); }
function speak(key) { window.speechSynthesis?.cancel(); if (!sound || !('speechSynthesis' in window))
    return; const u = new SpeechSynthesisUtterance(audioText[key] || key); u.lang = 'en-US'; u.rate = .8; const voices = window.speechSynthesis.getVoices(); u.voice = voices.find(v => v.lang === 'en-US' && /Samantha/i.test(v.name)) || voices.find(v => v.lang === 'en-US') || null; window.speechSynthesis.speak(u); }
const learnedWords = new Set();
const groups = { fruit: ['apple', 'banana', 'orange'], animals: ['bunny', 'cat', 'dog'], colors: ['red', 'yellow', 'blue'] };
const names = { apple: '苹果', banana: '香蕉', orange: '橙子', bunny: '小兔', cat: '小猫', dog: '小狗', red: '红色', yellow: '黄色', blue: '蓝色' };
const labels = { fruit: 'A little picnic', animals: 'Hello, little friends', colors: 'Let’s grow some flowers' };
const modeCN = { fruit: '给小兔送水果', animals: '和动物打招呼', colors: '找颜色，种小花' };
const audioText = { hello: 'Hello! Welcome to my garden. Let’s play!', apple: 'Apple, please!', banana: 'Banana, please!', orange: 'Orange, please!', bunny: 'Find the bunny!', cat: 'Find the cat!', dog: 'Find the dog!', red: 'Find red!', yellow: 'Find yellow!', blue: 'Find blue!', again: 'Let’s listen again.', finish: 'Well done! Our garden is growing. Bye bye!', ...Object.fromEntries(Object.keys(names).map(k => ['yes-' + k, k + '. Wonderful!'])), gentle: 'Let’s try again!' };
function Art({ kind, className = '' }) {
    const fill = kind === 'red' ? '#e77d80' : kind === 'yellow' ? '#f5cb64' : '#8bafd6';
    return h("svg", { className: className, viewBox: "0 0 200 190", "aria-hidden": "true" }, kind === 'bunny' ? h("g", { stroke: "#9f8573", strokeWidth: "3", strokeLinecap: "round" },
        h("ellipse", { cx: "72", cy: "49", rx: "18", ry: "43", fill: "#fff9ee", transform: "rotate(-13 72 49)" }),
        h("ellipse", { cx: "125", cy: "48", rx: "18", ry: "43", fill: "#fff9ee", transform: "rotate(10 125 48)" }),
        h("ellipse", { cx: "72", cy: "47", rx: "7", ry: "28", fill: "#efb7b2", stroke: "none", transform: "rotate(-13 72 47)" }),
        h("ellipse", { cx: "125", cy: "47", rx: "7", ry: "28", fill: "#efb7b2", stroke: "none", transform: "rotate(10 125 47)" }),
        h("ellipse", { cx: "100", cy: "149", rx: "49", ry: "37", fill: "#b3c7a1" }),
        h("ellipse", { cx: "100", cy: "101", rx: "60", ry: "49", fill: "#fff9ee" }),
        h("ellipse", { cx: "76", cy: "103", rx: "4", ry: "6", fill: "#5d514b", stroke: "none" }),
        h("ellipse", { cx: "124", cy: "103", rx: "4", ry: "6", fill: "#5d514b", stroke: "none" }),
        h("ellipse", { cx: "60", cy: "118", rx: "11", ry: "7", fill: "#efb7b2", stroke: "none" }),
        h("ellipse", { cx: "140", cy: "118", rx: "11", ry: "7", fill: "#efb7b2", stroke: "none" }),
        h("path", { d: "M95 115 Q100 122 105 115 M100 121 Q92 131 87 124 M100 121 Q108 131 113 124", fill: "none" }),
        h("path", { d: "M71 153l-18 17 M129 153l18 17" }),
        h("circle", { cx: "100", cy: "155", r: "5", fill: "#fff6dc", stroke: "none" })) :
        kind === 'apple' ? h("g", null,
            h("path", { d: "M103 59 Q107 37 122 30", stroke: "#86694f", strokeWidth: "8", fill: "none", strokeLinecap: "round" }),
            h("path", { d: "M106 49 Q72 13 63 40 Q73 64 106 49", fill: "#85aa73" }),
            h("path", { d: "M100 66 C28 26 20 113 52 150 Q77 180 100 162 Q130 180 152 149 C184 102 160 31 100 66", fill: "#e98480" }),
            h("path", { d: "M58 89 Q48 106 53 119", fill: "none", stroke: "#ffd1bb", strokeWidth: "9", strokeLinecap: "round" })) :
            kind === 'banana' ? h("g", null,
                h("path", { d: "M43 64 Q63 152 156 65 Q169 61 166 83 C130 183 52 185 31 96 Q27 75 43 64", fill: "#f5ce66", stroke: "#dcb45a", strokeWidth: "3" }),
                h("path", { d: "M45 77 Q71 150 151 84", fill: "none", stroke: "#ffe7a0", strokeWidth: "7" }),
                h("path", { d: "M151 68l6-17 12 7-5 20 M32 86l-7-10", stroke: "#947758", strokeWidth: "7", fill: "none" })) :
                kind === 'orange' ? h("g", null,
                    h("circle", { cx: "100", cy: "115", r: "60", fill: "#efa665" }),
                    h("path", { d: "M101 59q27-47 55-18-11 28-55 18", fill: "#89aa78" }),
                    h("path", { d: "M100 60l-4-15", stroke: "#86694f", strokeWidth: "6", strokeLinecap: "round" }),
                    h("path", { d: "M60 95q-8 14-6 26", stroke: "#ffd1a0", strokeWidth: "8", fill: "none", strokeLinecap: "round" }),
                    h("g", { fill: "#d98e50" },
                        h("circle", { cx: "126", cy: "141", r: "2" }),
                        h("circle", { cx: "139", cy: "125", r: "2" }),
                        h("circle", { cx: "112", cy: "152", r: "2" }))) :
                    kind === 'cat' || kind === 'dog' ? h("g", null,
                        h("path", { d: kind === 'cat' ? 'M43 91L37 28 85 57M116 57L165 28 157 95' : 'M50 60Q5 50 24 125Q45 144 59 98M143 60Q190 50 177 124Q156 143 140 98', fill: kind === 'cat' ? '#d9ae83' : '#b78b6b', stroke: "#a27e61", strokeWidth: "3" }),
                        h("ellipse", { cx: "100", cy: "111", rx: "62", ry: "57", fill: kind === 'cat' ? '#e9c39c' : '#e6c9a6' }),
                        h("ellipse", { cx: "76", cy: "108", rx: "4", ry: "6", fill: "#61544b" }),
                        h("ellipse", { cx: "124", cy: "108", rx: "4", ry: "6", fill: "#61544b" }),
                        h("path", { d: "M94 125q6 9 12 0 M100 132q-8 11-16 3 M100 132q8 11 16 3", fill: "none", stroke: "#715b4e", strokeWidth: "3", strokeLinecap: "round" }),
                        kind === 'cat' && h("path", { d: "M62 126l-31-5m31 14l-31 7m107-16l31-5m-31 14l31 7", stroke: "#a27e61", strokeWidth: "3" })) :
                        kind === 'basket' ? h("g", { stroke: "#b39367", strokeWidth: "4" },
                            h("path", { d: "M59 88q0-81 82 0", fill: "none", strokeWidth: "10" }),
                            h("path", { d: "M36 89h128l-18 76H54z", fill: "#dbb985" }),
                            h("path", { d: "M45 112h110M50 136h100M72 90l6 75m23-75v75m27-75l-6 75", fill: "none" }),
                            h("path", { d: "M34 88h132", strokeWidth: "12", strokeLinecap: "round" })) :
                            h("g", null,
                                h("path", { d: "M100 106v76M100 157q-38-36-44-13 17 24 44 13 M100 142q38-36 44-13-17 24-44 13", fill: "#91af7d", stroke: "#91af7d", strokeWidth: "7", strokeLinecap: "round" }),
                                [0, 60, 120, 180, 240, 300].map(a => h("ellipse", { key: a, cx: "100", cy: "58", rx: "21", ry: "34", fill: fill, transform: `rotate(${a} 100 88)` })),
                                h("circle", { cx: "100", cy: "88", r: "22", fill: "#fff3c5" }),
                                h("circle", { cx: "93", cy: "86", r: "2", fill: "#9c855c" }),
                                h("circle", { cx: "107", cy: "86", r: "2", fill: "#9c855c" }),
                                h("path", { d: "M95 95q5 5 10 0", fill: "none", stroke: "#9c855c", strokeWidth: "2" })));
}
function readSettings() { try {
    return JSON.parse(localStorage.getItem('lily-settings') || '{}');
}
catch {
    return {};
} }
function App() {
    const target = groups[mode][round];
    const modes = ['fruit', 'animals', 'colors'];
    const stage = modes.indexOf(mode);
    function clearTimers() { timers.current.forEach(clearTimeout); timers.current = []; }
    function start(m = 'fruit') { learnedWords.clear(); clearTimers(); setMode(m); setRound(0); setWon(false); setWrong(null); setHint(false); setScreen('play'); speak(groups[m][0]); scheduleHint(); }
    function choose(item) { if (won || settings || wrong)
        return; if (item !== target) {
        setWrong(item);
        speak('gentle');
        timers.current.push(setTimeout(() => { setWrong(null); setHint(true); speak(target); }, 1300));
        return;
    } learnedWords.add(target); clearTimers(); setWrong(null); setWon(true); clearTimeout(hintTimer); speak('yes-' + target); }
    function next() { clearTimers(); setWon(false); setHint(false); setWrong(null); if (round < 2) {
        setRound(round + 1);
        speak(groups[mode][round]);
    }
    else if (stage < 2) {
        setMode(modes[stage + 1]);
        setRound(0);
        speak(groups[modes[stage + 1]][0]);
    }
    else {
        setScreen('done');
        speak('finish');
    } if (screen === 'play')
        scheduleHint(); }
    function home() { clearTimers(); player.current?.pause(); window.speechSynthesis?.cancel(); setScreen('home'); setWon(false); setWrong(null); setHint(false); }
    function stopHold() { if (hold.current)
        clearTimeout(hold.current); setHolding(false); }
    function beginHold() { setHolding(true); hold.current = setTimeout(() => { setHolding(false); setSettings(true); clearTimers(); player.current?.pause(); window.speechSynthesis?.cancel(); }, 1400); }
    return h("div", { className: "app" },
        h("header", null,
            h("button", { className: "brand", onClick: home, "aria-label": "Back to garden home" },
                h("span", { className: "brand-flower" }, "\u273F"),
                h("span", null,
                    "Iris\u2019s ",
                    h("b", null, "magic garden"))),
            h("div", { className: "tools" },
                h("button", { className: "round-button", onClick: () => setSound(!sound), "aria-label": sound ? 'Mute voice' : 'Enable voice', title: "\u82F1\u6587\u8BED\u97F3" },
                    sound ? '♫' : '♩',
                    !sound && h("span", { className: "slash" })),
                h("button", { className: `parents ${holding ? 'holding' : ''}`, onPointerDown: beginHold, onPointerUp: stopHold, onPointerLeave: stopHold, onPointerCancel: stopHold, onKeyDown: e => { if (e.key === 'Enter' && !e.repeat)
                        beginHold(); }, onKeyUp: stopHold, onBlur: stopHold, title: "\u957F\u6309 1.4 \u79D2\u8FDB\u5165\u5BB6\u957F\u8BBE\u7F6E" },
                    "\u2699 ",
                    h("span", null, "For grown-ups")))),
        h("main", null,
            h("div", { className: "sky" },
                h("span", { className: "cloud cloud-one" }),
                h("span", { className: "cloud cloud-two" }),
                h("span", { className: "sun" }, "\u2600"),
                h("span", { className: "butterfly" }, "\u029A\u025E")),
            screen === 'home' ? h("section", { className: "home" },
                h("div", { className: "intro" },
                    h("div", { className: "eyebrow" },
                        h("span", null),
                        " A LITTLE ENGLISH ADVENTURE"),
                    h("h1", null,
                        "Little words.",
                        h("br", null),
                        "Big ",
                        h("em", null, "wonder."),
                        h("span", { className: "title-spark" }, "\u2727")),
                    h("p", null,
                        "A magical little garden to listen,",
                        h("br", null),
                        "play, and grow together."),
                    chinese && h("p", { className: "translation" }, "\u542C\u4E00\u542C\uFF0C\u70B9\u4E00\u70B9\uFF0C\u548C\u5C0F\u5154\u4E00\u8D77\u5B66\u82F1\u8BED"),
                    h("button", { className: "primary start", onClick: () => { start(); speak('hello'); timers.current.push(setTimeout(() => speak('apple'), 4200)); } },
                        "Let\u2019s play ",
                        h("span", null, "\u2197")),
                    h("div", { className: "play-note" },
                        "\u266A Sound on for a little magic ",
                        h("span", null, "\u00B7"),
                        " Ages 2\u20134")),
                h("div", { className: "hero-art" },
                    h("div", { className: "hero-disc" }),
                    h("div", { className: "speech hello" },
                        "Hello, little friend! ",
                        h("span", null, "\u2661")),
                    h(Art, { kind: "bunny", className: "hero-bunny" }),
                    h(Art, { kind: "yellow", className: "hero-flower yellow" }),
                    h(Art, { kind: "red", className: "hero-flower pink" }),
                    h(Art, { kind: "blue", className: "hero-flower blue" }),
                    h("div", { className: "ground-shadow" }),
                    h("span", { className: "little-star one" }, "\u2726"),
                    h("span", { className: "little-star two" }, "\u2727"),
                    h("div", { className: "name-tag" },
                        "Meet Iris ",
                        h("span", null, "\u219F"))),
                h("div", { className: "activities" }, modes.map((m, i) => h("button", { className: `activity activity-${m}`, key: m, onClick: () => start(m) },
                    h("span", { className: "activity-art" },
                        h(Art, { kind: groups[m][i === 2 ? 1 : 0] })),
                    h("span", null,
                        h("small", null,
                            "0",
                            i + 1,
                            " \u00B7 ",
                            ['LISTEN & PICK', 'MEET & GREET', 'FIND & GROW'][i]),
                        h("strong", null, ['A little picnic', 'Animal friends', 'Rainbow blooms'][i]),
                        chinese && h("span", { className: "activity-cn" }, modeCN[m])),
                    h("span", { className: "activity-arrow" }, "\u2197"))))) :
                screen === 'play' ? h("section", { className: "play" },
                    h("div", { className: "play-top" },
                        h("button", { className: "back", onClick: home },
                            "\u2190 ",
                            h("span", null, "Garden")),
                        h("div", { className: "progress", "aria-label": `Activity ${stage + 1} of 3, question ${round + 1} of 3` }, modes.map((m, i) => h("div", { key: m, className: i <= stage ? 'active' : '' },
                            h("span", null, ['♧', '♡', '✿'][i]),
                            h("div", null, [0, 1, 2].map(n => h("i", { key: n, className: i < stage || (i === stage && (n < round || (n === round && won))) ? 'filled' : '' })))))),
                        h("span", { className: "session-label" },
                            "LITTLE ADVENTURE ",
                            stage + 1,
                            " / 3")),
                    h("div", { className: "game-heading" },
                        h("span", { className: "eyebrow" }, labels[mode]),
                        h("h1", null, won ? 'Wonderful!' : mode === 'fruit' ? `${target[0].toUpperCase() + target.slice(1)}, please!` : `Find ${mode === 'animals' ? 'the ' : ''}${target}!`),
                        chinese && h("p", null, won ? '太棒了！送你一朵小花' : mode === 'fruit' ? `请给小兔${names[target]}` : `找一找${names[target]}`),
                        h("button", { className: "listen", onClick: () => speak(won ? 'yes-' + target : target), "aria-label": "Hear the instruction again" },
                            "\u266B ",
                            h("span", null, "Listen again"))),
                    h("div", { className: "play-world" },
                        h("div", { className: `lily-companion ${won ? 'happy' : ''}` },
                            h(Art, { kind: "bunny" }),
                            h("div", { className: "companion-bubble" },
                                won ? 'Thank you! ♡' : 'Let’s play!',
                                " "),
                            mode === 'fruit' && h(Art, { kind: "basket", className: "basket" })),
                        h("div", { className: "choices" }, groups[mode].map(item => h("button", { key: item, "aria-label": item, disabled: won, onClick: () => choose(item), className: `choice ${wrong === item ? 'wiggle' : ''} ${hint && target === item && !won ? 'hint' : ''} ${won && target === item ? 'correct' : ''} ${won && target !== item ? 'faded' : ''}` },
                            h(Art, { kind: item }),
                            h("span", null, item),
                            chinese && h("small", null, names[item]),
                            won && target === item && h("b", { className: "check" }, "\u2713"))))),
                    h("div", { className: "game-bottom" }, won ? h("button", { className: "primary", onClick: next },
                        stage === 2 && round === 2 ? 'See our garden' : 'Let’s keep playing',
                        " ",
                        h("span", null, "\u2192")) : h("p", null,
                        "Take your time. A little wonder is waiting. ",
                        h("span", null, "\u2727"))),
                    won && h("div", { className: "celebration", "aria-hidden": "true" }, ['✿', '✦', '♡', '✿', '✧', '♡'].map((s, i) => h("span", { key: i, style: { left: `${12 + i * 15}%`, animationDelay: `${i * .13}s`, color: ['#d98a90', '#dab958', '#91ab7e'][i % 3] } }, s)))) :
                    h("section", { className: "done" },
                        h("div", { className: "eyebrow" }, "A LITTLE MAGIC, EVERY DAY"),
                        h("h1", null,
                            "Look how we\u2019ve ",
                            h("em", null, "grown!")),
                        h("p", null, chinese ? '每一个小小的尝试，都开成了一朵花。' : 'Every little try becomes a little flower.'),
                        h("div", { className: "finished-garden" },
                            h(Art, { kind: "red" }),
                            h(Art, { kind: "yellow" }),
                            h(Art, { kind: "bunny" }),
                            h(Art, { kind: "blue" }),
                            h(Art, { kind: "yellow" })),
                        h("h2", null, "Well done, little explorer. \u2661"),
                        h("p", null, chinese ? '今天的花园冒险完成啦，和小兔说再见吧！' : 'Our little adventure is complete. See you next time!'),
                        h("button", { className: "primary", onClick: home },
                            "Bye-bye, Iris ",
                            h("span", null, "\u2661")),
                        h("div", { className: "keepsake-card" },
                            h("span", { className: "eyebrow" }, "A LITTLE MEMORY TO KEEP"),
                            h("h3", null, "把今天的花园变成动画"),
                            h("p", null, "26 秒的小故事，留住今天学会的小小单词。"),
                            h("button", { className: "primary", onClick: () => {
                                window.speechSynthesis?.cancel();
                                if (music) setMusic(false);
                                queueMicrotask(() => window.GardenFilm.open({items: [...learnedWords], art: Art}));
                            } }, "生成我的花园动画 ♡")),
                        h("button", { className: "text-button", onClick: () => start() }, "Play again"))),
        h("footer", null,
            h("span", null, "MADE FOR LITTLE MOMENTS OF WONDER"),
            h("span", null,
                "A gentle place to learn & grow ",
                h("i", null, "\u273F"))),
        settings && h("div", { className: "modal-backdrop", onClick: () => setSettings(false) },
            h("section", { className: "settings", role: "dialog", "aria-modal": "true", "aria-label": "\u5BB6\u957F\u8BBE\u7F6E", onClick: e => e.stopPropagation() },
                h("button", { className: "close", onClick: () => setSettings(false), "aria-label": "Close settings", autoFocus: true }, "\u00D7"),
                h("span", { className: "eyebrow" }, "FOR GROWN-UPS"),
                h("h2", null, "\u966A\u5979\u6162\u6162\u63A2\u7D22"),
                h("p", null, "\u6BCF\u6B21\u7EA6 3\u20135 \u5206\u949F\u3002\u966A\u5B69\u5B50\u542C\u4E00\u542C\u3001\u6307\u4E00\u6307\uFF0C\u4E5F\u53EF\u4EE5\u4E00\u8D77\u6A21\u4EFF\u53D1\u97F3\u3002"),
                h("label", null,
                    "\u4E2D\u6587\u8F85\u52A9\u63D0\u793A",
                    h("input", { 'aria-label': '中文辅助提示', type: "checkbox", checked: chinese, onChange: e => setChinese(e.target.checked) })),
                h("label", null,
                    "\u82F1\u6587\u8BED\u97F3",
                    h("input", { 'aria-label': '英文语音', type: "checkbox", checked: sound, onChange: e => setSound(e.target.checked) })),
                h("label", null,
                    "\u8F7B\u67D4\u80CC\u666F\u97F3\u4E50",
                    h("input", { 'aria-label': '轻柔背景音乐', type: "checkbox", checked: music, onChange: e => setMusic(e.target.checked) })),
                h("p", { className: "privacy" }, "\u65E0\u9700\u8D26\u53F7\uFF0C\u4E0D\u4F7F\u7528\u9EA6\u514B\u98CE\u3002\u63D2\u753B\u5728\u672C\u5730\u52A0\u8F7D\uFF0C\u82F1\u6587\u53D1\u97F3\u7531\u6D4F\u89C8\u5668\u63D0\u4F9B\uFF1B\u8BBE\u7F6E\u4EC5\u4FDD\u5B58\u5728\u6B64\u6D4F\u89C8\u5668\u3002"),
                h("button", { className: "primary", onClick: () => { setSettings(false); if (screen === 'play')
                        speak(won ? 'yes-' + target : target); } },
                    "\u56DE\u5230\u82B1\u56ED ",
                    h("span", null, "\u2192")))));
}
render();

window.addEventListener('keydown', event => { if(event.key === 'Escape' && settings) setSettings(false); });
