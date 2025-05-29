document.addEventListener('DOMContentLoaded', () => {
    // Элементы интерфейса
    const timerDisplay = document.getElementById('timer');
    const roundInfo = document.getElementById('round-info');
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const saveSettingsBtn = document.getElementById('save-settings');

    // Аудио элементы
const startSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...');
const endSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...');

    const startSound = new Audio('start.mp3');
    const endSound = new Audio('end.mp3');

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
    function playSound(sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Ошибка воспроизведения звука:", e));
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
                playSound(startSound);
                startRound();
            }
        }, 1000);
    }

    // Старт раунда
    function startRound() {
        currentRound++;
        if (currentRound > settings.rounds) {
            endSession();
            return;
        }

        isResting = false;
        roundInfo.textContent = `Раунд ${currentRound} из ${settings.rounds}`;
        animateTimer();
        playSound(startSound);

        let timeLeft = settings.roundTime;
        timerDisplay.textContent = formatTime(timeLeft);

        timer = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = formatTime(timeLeft);

            if (timeLeft <= 0) {
                clearInterval(timer);
                playSound(endSound);
                if (currentRound < settings.rounds) {
                    startRest();
                } else {
                    endSession();
                }
            }
        }, 1000);
    }

    // Отдых между раундами
    function startRest() {
        isResting = true;
        roundInfo.textContent = `Отдых (Раунд ${currentRound})`;
        animateTimer();
        playSound(startSound);

        let restLeft = settings.restTime;
        timerDisplay.textContent = formatTime(restLeft);

        timer = setInterval(() => {
            restLeft--;
            timerDisplay.textContent = formatTime(restLeft);

            if (restLeft <= 0) {
                clearInterval(timer);
                playSound(endSound);
                startRound();
            }
        }, 1000);
    }

    // Завершение тренировки
    function endSession() {
        clearInterval(timer);
        isRunning = false;
        roundInfo.textContent = "Тренировка завершена!";
        timerDisplay.textContent = "00:00";
        animateTimer();
    }

    // Остановка таймера
    function stopTimer() {
        clearInterval(timer);
        isRunning = false;
        roundInfo.textContent = "Таймер остановлен";
        timerDisplay.textContent = "00:00";
    }

    // Управление настройками
    settingsBtn.addEventListener('click', () => {
        settingsPanel.classList.toggle('active');
    });

    saveSettingsBtn.addEventListener('click', () => {
        settings.rounds = parseInt(document.getElementById('rounds').value);
        settings.roundTime = parseInt(document.getElementById('round-time').value);
        settings.restTime = parseInt(document.getElementById('rest-time').value);
        settings.delayTime = parseInt(document.getElementById('delay-time').value);

        localStorage.setItem('timerSettings', JSON.stringify(settings));
        settingsPanel.classList.remove('active');
    });

    // Кнопки управления
    startBtn.addEventListener('click', startTimer);
    stopBtn.addEventListener('click', stopTimer);

    // Предзагрузка звуков
    startSound.load();
    endSound.load();
});