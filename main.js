document.addEventListener('DOMContentLoaded', () => {
    // ============== DOM Элементы ==============
    const timerDisplay = document.getElementById('timer');
    const roundInfo = document.getElementById('round-info');
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const saveSettingsBtn = document.getElementById('save-settings');

    // ============== Аудио Система ==============
    let audioContext;
    let soundsInitialized = false;

    function initAudio() {
        if (soundsInitialized) return;

        try {
            audioContext = new(window.AudioContext || window.webkitAudioContext)();
            console.log("AudioContext инициализирован");

            // Для Chrome и других браузеров с autoplay policy
            document.body.addEventListener('click', () => {
                if (audioContext.state === 'suspended') {
                    audioContext.resume().then(() => {
                        console.log("AudioContext активирован");
                        soundsInitialized = true;
                    });
                }
            }, {
                once: true
            });

        } catch (e) {
            console.error("Ошибка инициализации аудио:", e);
        }
    }

    function playSound(type) {
        if (!audioContext || audioContext.state !== 'running') return;

        const freq = type === 'start' ? 800 : 400;
        const duration = type === 'start' ? 0.3 : 0.7;

        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(audioContext.destination);

        gain.gain.setValueAtTime(0, audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.01);
        gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);

        osc.start();
        osc.stop(audioContext.currentTime + duration);
    }

    // ============== Логика Таймера ==============
    let timer;
    let currentRound = 0;
    let isRunning = false;
    let isResting = false;

    // Настройки по умолчанию
    let settings = {
        rounds: 3,
        roundTime: 180,
        restTime: 60,
        delayTime: 5
    };

    // Загрузка настроек
    if (localStorage.getItem('timerSettings')) {
        settings = JSON.parse(localStorage.getItem('timerSettings'));
        updateInputs();
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }

    function updateInputs() {
        document.getElementById('rounds').value = settings.rounds;
        document.getElementById('round-time').value = settings.roundTime;
        document.getElementById('rest-time').value = settings.restTime;
        document.getElementById('delay-time').value = settings.delayTime;
    }

    function animateTimer() {
        timerDisplay.classList.add('timer-pulse');
        setTimeout(() => timerDisplay.classList.remove('timer-pulse'), 500);
    }

    // ============== Основные Функции ==============
    function startTimer() {
        if (isRunning) return;
        initAudio(); // Пытаемся инициализировать аудио

        isRunning = true;
        currentRound = 0;
        roundInfo.textContent = "Приготовьтесь...";

        let delay = settings.delayTime;
        timerDisplay.textContent = formatTime(delay);
        animateTimer();

        const countdown = setInterval(() => {
            delay--;
            timerDisplay.textContent = formatTime(delay);

            if (delay <= 0) {
                clearInterval(countdown);
                playSound('start');
                startRound();
            }
        }, 1000);
    }

    function startRound() {
        currentRound++;
        if (currentRound > settings.rounds) {
            endSession();
            return;
        }

        isResting = false;
        roundInfo.textContent = `Раунд ${currentRound} из ${settings.rounds}`;
        animateTimer();
        playSound('start');

        let timeLeft = settings.roundTime;
        timerDisplay.textContent = formatTime(timeLeft);

        timer = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = formatTime(timeLeft);

            if (timeLeft <= 0) {
                clearInterval(timer);
                playSound('end');
                currentRound < settings.rounds ? startRest() : endSession();
            }
        }, 1000);
    }

    function startRest() {
        isResting = true;
        roundInfo.textContent = `Отдых (Раунд ${currentRound})`;
        animateTimer();
        playSound('start');

        let restLeft = settings.restTime;
        timerDisplay.textContent = formatTime(restLeft);

        timer = setInterval(() => {
            restLeft--;
            timerDisplay.textContent = formatTime(restLeft);

            if (restLeft <= 0) {
                clearInterval(timer);
                playSound('end');
                startRound();
            }
        }, 1000);
    }

    function endSession() {
        clearInterval(timer);
        isRunning = false;
        roundInfo.textContent = "Тренировка завершена!";
        timerDisplay.textContent = "00:00";
        animateTimer();
    }

    function stopTimer() {
        clearInterval(timer);
        isRunning = false;
        roundInfo.textContent = "Таймер остановлен";
        timerDisplay.textContent = "00:00";
    }

    // ============== Управление Настройками ==============
    settingsBtn.addEventListener('click', () => {
        // Добавьте console.log для отладки
        console.log('Кнопка настроек нажата');

        // Проверка существования settingsPanel
        if (!settingsPanel) {
            console.error('Панель настроек не найдена');
            return;
        }

        settingsPanel.classList.toggle('active');
        initAudio();
    });

    saveSettingsBtn.addEventListener('click', () => {
        settings = {
            rounds: parseInt(document.getElementById('rounds').value) || 3,
            roundTime: parseInt(document.getElementById('round-time').value) || 180,
            restTime: parseInt(document.getElementById('rest-time').value) || 60,
            delayTime: parseInt(document.getElementById('delay-time').value) || 5
        };

        localStorage.setItem('timerSettings', JSON.stringify(settings));
        settingsPanel.classList.remove('active');
    });

    // ============== Инициализация ==============
    startBtn.addEventListener('click', startTimer);
    stopBtn.addEventListener('click', stopTimer);

    // Для Telegram Mini App
    if (window.Telegram?.WebApp) {
        Telegram.WebApp.expand();
        Telegram.WebApp.enableClosingConfirmation();
        initAudio(); // В Telegram жесты уже были
    }
});