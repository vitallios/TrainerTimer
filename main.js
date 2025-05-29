document.addEventListener('DOMContentLoaded', () => {
    // Элементы интерфейса
    const timerDisplay = document.getElementById('timer');
    const roundInfo = document.getElementById('round-info');
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const saveSettingsBtn = document.getElementById('save-settings');

    // Аудио-контекст и звуки
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let startSound, endSound;

    // Создаем простые звуковые сигналы
    function createBeepSound(frequency, duration) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        oscillator.connect(gainNode);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
        
        return gainNode;
    }

    // Инициализация звуков
    function initSounds() {
        startSound = createBeepSound(800, 0.3);
        endSound = createBeepSound(400, 0.7);
        startSound.connect(audioContext.destination);
        endSound.connect(audioContext.destination);
    }

    // Переменные таймера
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

    // Загрузка настроек из localStorage
    if (localStorage.getItem('timerSettings')) {
        settings = JSON.parse(localStorage.getItem('timerSettings'));
        updateInputs();
    }

    // Форматирование времени (MM:SS)
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }

    // Обновление полей ввода
    function updateInputs() {
        document.getElementById('rounds').value = settings.rounds;
        document.getElementById('round-time').value = settings.roundTime;
        document.getElementById('rest-time').value = settings.restTime;
        document.getElementById('delay-time').value = settings.delayTime;
    }

    // Воспроизведение звука
    function playSound(type) {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        const now = audioContext.currentTime;
        const sound = type === 'start' ? startSound : endSound;
        
        // Пересоздаем звук для каждого воспроизведения
        const newSound = createBeepSound(
            type === 'start' ? 800 : 400,
            type === 'start' ? 0.3 : 0.7
        );
        newSound.connect(audioContext.destination);
    }

    // Анимация таймера
    function animateTimer() {
        timerDisplay.classList.add('timer-pulse');
        setTimeout(() => {
            timerDisplay.classList.remove('timer-pulse');
        }, 500);
    }

    // Старт таймера
    function startTimer() {
        if (isRunning) return;
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

    // Остальные функции (startRound, startRest, endSession, stopTimer) 
    // остаются такими же, как в предыдущем коде, но с заменой:
    // playSound(startSound) → playSound('start')
    // playSound(endSound) → playSound('end')

    // Инициализация при загрузке
    initSounds();
    
    // Остальной код (управление настройками, кнопки) без изменений
});