document.addEventListener('DOMContentLoaded', () => {
    const timerDisplay = document.getElementById('timer');
    const roundInfo = document.getElementById('round-info');
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const saveSettingsBtn = document.getElementById('save-settings');

    let timer;
    let currentRound = 0;
    let isRunning = false;
    let isResting = false;
    let audioContext;
    let isTelegramWebApp = false;

    // Проверяем, открыто ли в Telegram WebView
    if (window.Telegram && window.Telegram.WebApp) {
        isTelegramWebApp = true;
        Telegram.WebApp.expand(); // Разворачиваем приложение на весь экран
    }

    // Настройки по умолчанию
    let settings = {
        rounds: 3,
        roundTime: 180,
        restTime: 60,
        delayTime: 5
    };

    // Инициализация аудио
    function initAudio() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn("Web Audio API не поддерживается:", e);
        }
    }

    // Функция воспроизведения звука (работает и в Telegram, и в браузере)
    function playSound(type) {
        if (isTelegramWebApp) {
            // В Telegram используем вибрацию и уведомления
            try {
                if (type === 'start') {
                    // Короткая вибрация для начала
                    navigator.vibrate([100, 50, 100]);
                } else {
                    // Длинная вибрация для окончания
                    navigator.vibrate([300]);
                }
                
                // Можно также использовать Telegram WebApp.HapticFeedback
                if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
                    if (type === 'start') {
                        Telegram.WebApp.HapticFeedback.impactOccurred('light');
                    } else {
                        Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
                    }
                }
            } catch (e) {
                console.log("Ошибка вибрации:", e);
            }
        } else {
            // В браузере используем Web Audio API
            if (!audioContext) initAudio();
            if (!audioContext) return;

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Настройки для разных типов сигналов
            if (type === 'start') {
                oscillator.frequency.value = 800; // Высокий тон для начала
                gainNode.gain.value = 0.3;
                oscillator.type = 'sine';
            } else {
                oscillator.frequency.value = 400; // Низкий тон для окончания
                gainNode.gain.value = 0.3;
                oscillator.type = 'square';
            }

            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.5);
            oscillator.stop(audioContext.currentTime + 0.5);
        }
    }

    // Инициализируем аудио при первом взаимодействии пользователя
    startBtn.addEventListener('click', () => {
        if (!audioContext && !isTelegramWebApp) {
            initAudio();
        }
    });

    // Загрузка настроек из localStorage (если есть)
    if (localStorage.getItem('timerSettings')) {
        settings = JSON.parse(localStorage.getItem('timerSettings'));
        updateInputs();
    }

    // Отображение времени в формате MM:SS
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

    // Старт таймера
    function startTimer() {
        if (isRunning) return;
        isRunning = true;
        currentRound = 0;

        // Задержка перед стартом
        roundInfo.textContent = "Приготовьтесь...";
        let delay = settings.delayTime;
        timerDisplay.textContent = formatTime(delay);

        const countdown = setInterval(() => {
            delay--;
            timerDisplay.textContent = formatTime(delay);

            if (delay <= 0) {
                clearInterval(countdown);
                playSound('start'); // Сигнал начала тренировки
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
        let timeLeft = settings.roundTime;
        timerDisplay.textContent = formatTime(timeLeft);

        playSound('start'); // Сигнал начала раунда

        timer = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = formatTime(timeLeft);

            if (timeLeft <= 0) {
                clearInterval(timer);
                playSound('end'); // Сигнал конца раунда
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
        let restLeft = settings.restTime;
        timerDisplay.textContent = formatTime(restLeft);

        playSound('end'); // Сигнал начала отдыха

        timer = setInterval(() => {
            restLeft--;
            timerDisplay.textContent = formatTime(restLeft);

            if (restLeft <= 0) {
                clearInterval(timer);
                playSound('start'); // Сигнал конца отдыха (начало нового раунда)
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
        playSound('end'); // Финальный сигнал
        
        // В Telegram можно показать уведомление
        if (isTelegramWebApp && window.Telegram && window.Telegram.WebApp.showAlert) {
            Telegram.WebApp.showAlert("Тренировка завершена!");
        }
    }

    // Остановка таймера
    function stopTimer() {
        clearInterval(timer);
        isRunning = false;
        roundInfo.textContent = "Таймер остановлен";
    }

    // Открыть/закрыть настройки
    settingsBtn.addEventListener('click', () => {
        settingsPanel.style.display = settingsPanel.style.display === 'block' ? 'none' : 'block';
    });

    // Сохранить настройки
    saveSettingsBtn.addEventListener('click', () => {
        settings.rounds = parseInt(document.getElementById('rounds').value);
        settings.roundTime = parseInt(document.getElementById('round-time').value);
        settings.restTime = parseInt(document.getElementById('rest-time').value);
        settings.delayTime = parseInt(document.getElementById('delay-time').value);

        localStorage.setItem('timerSettings', JSON.stringify(settings));
        settingsPanel.style.display = 'none';
    });

    // Кнопки управления
    startBtn.addEventListener('click', startTimer);
    stopBtn.addEventListener('click', stopTimer);

    // Закрытие Telegram WebApp (если нужно)
    if (isTelegramWebApp) {
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Закрыть';
        closeBtn.style.position = 'fixed';
        closeBtn.style.bottom = '20px';
        closeBtn.style.right = '20px';
        closeBtn.style.padding = '10px 20px';
        closeBtn.style.backgroundColor = '#0088cc';
        closeBtn.style.color = 'white';
        closeBtn.style.border = 'none';
        closeBtn.style.borderRadius = '5px';
        closeBtn.addEventListener('click', () => {
            Telegram.WebApp.close();
        });
        document.body.appendChild(closeBtn);
    }
});