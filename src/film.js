/* A local keepsake film. Canvas + browser MediaRecorder; no camera or microphone. */
window.GardenFilm = (() => {
    const DURATION = 26;
    const candidates = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    function supportedType() {
        if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return '';
        return candidates.find(type => MediaRecorder.isTypeSupported(type)) || '';
    }
    function scenesFor(items) {
        const known = new Set(items);
        return [
            { title: 'Hello, little explorer!', subtitle: 'A little adventure with Iris', items: ['bunny'] },
            ...[
                ['A lovely little picnic', ['apple', 'banana', 'orange']],
                ['Hello, little friends!', ['bunny', 'cat', 'dog']],
                ['Our rainbow is growing', ['red', 'yellow', 'blue']],
            ].map(([title, words]) => ({ title, subtitle: 'Look what we learned together', items: words.filter(word => known.has(word)) })).filter(scene => scene.items.length),
            { title: 'Well done!', subtitle: `${items.length} little words. A garden full of wonder.`, items: ['red', 'yellow', 'bunny', 'blue', 'yellow'] },
        ];
    }
    function open({ items, art }) {
        if (document.querySelector('.film-overlay')) return;
        const scenes = scenesFor(items), mime = supportedType(), images = new Map();
        const overlay = document.createElement('div');
        overlay.className = 'film-overlay';
        overlay.innerHTML = `<section class="film-dialog" role="dialog" aria-modal="true" aria-labelledby="film-title"><button class="close film-close" aria-label="关闭纪念动画">×</button><span class="eyebrow">MY LITTLE GARDEN STORY</span><h2 id="film-title">我的花园纪念动画</h2><p class="film-description">今天学过的 ${items.length} 个单词，变成一段 26 秒的小故事。</p><canvas width="960" height="540" aria-label="花园纪念动画画面"></canvas><video controls playsinline hidden aria-label="生成的花园纪念视频"></video><p class="film-status" role="status" aria-live="polite">正在准备花园…</p><div class="film-actions"><button class="film-replay secondary" disabled>▶ 播放动画</button><button class="film-generate primary" disabled>生成可下载视频 ↓</button><a class="film-download primary" hidden>下载纪念视频 ↓</a></div><label class="film-audio"><input type="checkbox" checked> 视频加入轻柔音乐</label><p class="film-note">视频包含动画、英文字幕与可选音乐，不含英文人声。全程在本机生成，无需摄像头或麦克风；生成时请保持此页面可见。</p></section>`;
        const app = document.querySelector('.app'), previousFocus = document.activeElement;
        if (app) app.inert = true;
        document.body.append(overlay);
        const canvas = overlay.querySelector('canvas'), ctx = canvas.getContext('2d');
        const video = overlay.querySelector('video'), status = overlay.querySelector('.film-status');
        const replay = overlay.querySelector('.film-replay'), generate = overlay.querySelector('.film-generate');
        const download = overlay.querySelector('.film-download'), music = overlay.querySelector('input');
        let closed = false, raf = 0, recorder = null, stream = null, audio = null, videoUrl = '', recording = false, watchdog = 0, ready = false;
        function cleanupMedia() {
            clearTimeout(watchdog);watchdog = 0;
            if (stream) stream.getTracks().forEach(track => track.stop());
            stream = null;
            if (audio) { void audio.close().catch(() => {}); audio = null; }
        }
        function stopRecording() {
            recording = false;
            if (recorder && recorder.state !== 'inactive') { try { recorder.stop(); } catch {} }
            recorder = null;cleanupMedia();
        }
        function close() {
            if (closed) return;closed = true;cancelAnimationFrame(raf);stopRecording();
            video.pause();video.removeAttribute('src');video.load();
            if (videoUrl) URL.revokeObjectURL(videoUrl);
            document.removeEventListener('keydown', onKey);document.removeEventListener('visibilitychange', onVisibility);
            overlay.remove();if (app) app.inert = false;previousFocus?.focus();
        }
        function onKey(event) {
            if (event.key === 'Escape') { close();return; }
            if (event.key === 'Tab') {
                const buttons = [...overlay.querySelectorAll('button:not(:disabled), a[href], input, video:not([hidden])')].filter(el => !el.hidden);
                const first = buttons[0], last = buttons.at(-1);
                if (event.shiftKey && document.activeElement === first) { event.preventDefault();last?.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault();first?.focus(); }
            }
        }
        function onVisibility() { if (document.hidden && recording) fail('生成已暂停：请保持页面可见，然后重新生成。'); }
        overlay.querySelector('.film-close').onclick = close;
        overlay.onclick = event => { if (event.target === overlay) close(); };
        document.addEventListener('keydown', onKey);document.addEventListener('visibilitychange', onVisibility);
        overlay.querySelector('.film-close').focus();
        function sprite(kind, x, y, size, t, index) {
            const img = images.get(kind);if (!img) return;
            ctx.save();ctx.translate(x, y + Math.sin(t * 2.3 + index) * 6);
            ctx.rotate(Math.sin(t * 1.7 + index) * .035);
            ctx.drawImage(img, -size / 2, -size / 2, size, size * .95);ctx.restore();
        }
        function draw(t) {
            const index = Math.min(scenes.length - 1, Math.floor(t / DURATION * scenes.length));
            const scene = scenes[index], local = (t / DURATION * scenes.length) % 1;
            ctx.fillStyle = '#f8f7ef';ctx.fillRect(0, 0, 960, 540);
            ctx.fillStyle = '#ecefdf';ctx.beginPath();ctx.ellipse(480, 450, 650, 160, 0, 0, Math.PI * 2);ctx.fill();
            ctx.fillStyle = '#edd699';ctx.beginPath();ctx.arc(858, 86, 34, 0, Math.PI * 2);ctx.fill();
            ctx.fillStyle = '#fffdf6';
            for (const [x, y] of [[108 + Math.sin(t / 4) * 15, 85], [750 + Math.sin(t / 5) * 18, 150]]) {
                ctx.beginPath();ctx.ellipse(x, y, 54, 16, 0, 0, Math.PI * 2);ctx.ellipse(x - 8, y - 12, 26, 22, 0, 0, Math.PI * 2);ctx.fill();
            }
            ctx.textAlign = 'center';ctx.fillStyle = '#86977b';ctx.font = '14px sans-serif';ctx.fillText('IRIS’S MAGIC GARDEN', 480, 52);
            ctx.fillStyle = '#425447';ctx.font = '42px Georgia, serif';ctx.fillText(scene.title, 480, 125);
            ctx.fillStyle = '#87917f';ctx.font = '18px sans-serif';ctx.fillText(scene.subtitle, 480, 162);
            const n = scene.items.length, spacing = n === 1 ? 0 : Math.min(230, 780 / n);
            scene.items.forEach((kind, i) => {
                const x = 480 + (i - (n - 1) / 2) * spacing;
                const isFinal = index === scenes.length - 1;
                const growth = isFinal ? Math.min(1, .5 + local * 1.5) : Math.min(1, .8 + local);
                sprite(kind, x, 320, (n === 1 ? 235 : n > 3 ? 150 : 185) * growth, t, i);
                if (index > 0 && !isFinal) {
                    ctx.fillStyle = '#52664b';ctx.font = '25px Georgia, serif';ctx.fillText(kind, x, 446);
                }
            });
            ctx.fillStyle = '#b7c4a2';ctx.fillRect(0, 535, 960 * Math.min(t / DURATION, 1), 5);
            ctx.font = '15px Georgia, serif';ctx.fillStyle = '#9a9f8b';
            ctx.fillText(index === scenes.length - 1 ? 'Every little try becomes a little flower.' : 'Little words. Big wonder.', 480, 510);
            if (index === scenes.length - 1) {
                for (let i = 0; i < 14; i++) {
                    ctx.fillStyle = ['#d9a09c', '#d7bb74', '#9eb68c'][i % 3];
                    ctx.beginPath();ctx.arc(45 + i * 65, 195 + Math.sin(t * 1.5 + i) * 48, 3 + i % 3, 0, Math.PI * 2);ctx.fill();
                }
            }
        }
        function fail(message) {
            cancelAnimationFrame(raf);stopRecording();
            if (closed) return;
            status.textContent = message;generate.disabled = !ready || !mime;replay.disabled = !ready;music.disabled = false;
        }
        function animate(record = false) {
            cancelAnimationFrame(raf);video.pause();video.hidden = true;canvas.hidden = false;
            const begin = performance.now();
            function frame(now) {
                if (closed) return;
                const elapsed = Math.min((now - begin) / 1000, DURATION);
                draw(elapsed);
                status.textContent = record ? `正在生成 ${Math.floor(elapsed)} / ${DURATION} 秒，请保持页面可见…` : `正在播放 ${Math.floor(elapsed)} / ${DURATION} 秒`;
                if (elapsed < DURATION) raf = requestAnimationFrame(frame);
                else if (record) {
                    status.textContent = '正在整理视频…';
                    if (recorder?.state === 'recording') recorder.stop();
                } else status.textContent = mime ? '动画播放完毕，可以生成并下载纪念视频。' : '此浏览器支持动画预览，但暂不支持视频导出。请换用支持录制的浏览器。';
            }
            raf = requestAnimationFrame(frame);
        }
        async function recordFilm() {
            if (recording || !ready || !mime) return;
            recording = true;generate.disabled = true;replay.disabled = true;music.disabled = true;download.hidden = true;
            try {
                draw(0);stream = canvas.captureStream(30);
                if (music.checked) {
                    const Audio = window.AudioContext || window.webkitAudioContext;
                    if (!Audio) throw new Error('音乐录制不可用，请关闭音乐后重试。');
                    audio = new Audio();await audio.resume();
                    if (closed || !recording) return;
                    const destination = audio.createMediaStreamDestination();
                    const notes = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];
                    for (let i = 0; i < 26; i++) {
                        const o = audio.createOscillator(), gain = audio.createGain(), at = audio.currentTime + .05 + i;
                        o.type = 'sine';o.frequency.value = notes[i % notes.length];
                        gain.gain.setValueAtTime(0, at);gain.gain.linearRampToValueAtTime(.07, at + .08);gain.gain.exponentialRampToValueAtTime(.001, at + .85);
                        o.connect(gain);gain.connect(destination);o.start(at);o.stop(at + .9);
                    }
                    destination.stream.getAudioTracks().forEach(track => stream.addTrack(track));
                }
                const chunks = [], current = recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2500000 });
                current.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
                current.onerror = () => fail('视频生成失败，请重试，或关闭音乐后重试。');
                current.onstop = () => {
                    if (!recording || closed) return;
                    const blob = new Blob(chunks, { type: current.mimeType || mime });
                    recording = false;recorder = null;cleanupMedia();
                    if (!blob.size) { fail('未能生成有效视频，请重新生成。');return; }
                    if (videoUrl) URL.revokeObjectURL(videoUrl);
                    videoUrl = URL.createObjectURL(blob);video.src = videoUrl;video.hidden = false;canvas.hidden = true;
                    download.href = videoUrl;download.download = `iris_magic_garden-${new Date().toISOString().slice(0, 10)}.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`;download.hidden = false;
                    generate.disabled = false;generate.textContent = '重新生成视频';replay.disabled = false;music.disabled = false;
                    status.textContent = `纪念视频已准备好！可播放或下载（${blob.type.includes('mp4') ? 'MP4' : 'WebM'}）。`;
                    download.focus();
                };
                current.start(250);
                watchdog = setTimeout(() => { if (recording) fail('生成时间过长，请保持页面可见后重试。'); }, 45000);
                animate(true);
            } catch (error) { fail(error.message || '此浏览器无法生成视频，请换一个浏览器重试。'); }
        }
        replay.onclick = () => { if (ready && !recording) animate(); };
        generate.onclick = recordFilm;
        const kinds = [...new Set([...items, 'bunny', 'red', 'yellow', 'blue'])];
        Promise.all(kinds.map(kind => new Promise((resolve, reject) => {
            const svg = art({ kind });svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');svg.setAttribute('width', '200');svg.setAttribute('height', '190');
            const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' }));
            const img = new Image();img.onload = () => { URL.revokeObjectURL(url);images.set(kind, img);resolve(); };img.onerror = () => { URL.revokeObjectURL(url);reject(new Error('插画加载失败，请关闭后重试。')); };img.src = url;
        }))).then(() => {
            if (closed) return;
            if (!ctx) throw new Error('此浏览器无法显示动画画布。');
            ready = true;replay.disabled = false;generate.disabled = !mime;draw(0);
            status.textContent = mime ? '准备好了！先播放看看，或生成可下载视频。' : '此浏览器暂不支持视频导出，仍可点击播放动画。';
        }).catch(error => fail(error.message));
    }
    return { open, scenesFor, supportedType };
})();
