// Глобальные переменные
let surveyData = [];

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeForm();
    loadResults();
    setupOtherInputs();
});

// Управление табами
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Убираем активные классы
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Добавляем активные классы
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            // Если переключились на результаты, обновляем их
            if (targetTab === 'results') {
                displayResults();
            }
        });
    });
}

// Инициализация формы
function initializeForm() {
    const form = document.getElementById('surveyForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            const formData = collectFormData();
            saveResponse(formData);
            sendToWhatsApp(formData);
        }
    });
}

// Настройка полей "Другое"
function setupOtherInputs() {
    const businessTypeRadios = document.querySelectorAll('input[name="business_type"]');
    const otherInput = document.querySelector('input[name="business_type_other"]');
    
    businessTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'other') {
                otherInput.style.display = 'block';
                otherInput.required = true;
            } else {
                otherInput.style.display = 'none';
                otherInput.required = false;
                otherInput.value = '';
            }
        });
    });
}

// Валидация формы
function validateForm() {
    const requiredFields = [
        'business_type',
        'revenue', 
        'main_problems',
        'decision_making',
        'payment_readiness',
        'ai_usage',
        'ai_trust',
        'hypothesis_interest',
        'main_concern',
        'testing_interest'
    ];
    
    let isValid = true;
    let firstError = null;
    
    requiredFields.forEach(fieldName => {
        const field = document.querySelector(`input[name="${fieldName}"], textarea[name="${fieldName}"]`);
        
        if (fieldName === 'main_problems') {
            // Для чекбоксов проверяем что выбран хотя бы один
            const checkboxes = document.querySelectorAll(`input[name="${fieldName}"]:checked`);
            if (checkboxes.length === 0) {
                isValid = false;
                if (!firstError) firstError = document.querySelector(`input[name="${fieldName}"]`);
            } else if (checkboxes.length > 2) {
                alert('Выберите не более 2 главных проблем');
                isValid = false;
                if (!firstError) firstError = document.querySelector(`input[name="${fieldName}"]`);
            }
        } else {
            // Для радио кнопок
            const checked = document.querySelector(`input[name="${fieldName}"]:checked`);
            if (!checked) {
                isValid = false;
                if (!firstError) firstError = document.querySelector(`input[name="${fieldName}"]`);
            }
        }
    });
    
    if (!isValid) {
        alert('Пожалуйста, ответьте на все обязательные вопросы');
                if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return false;
    }
    
    return true;
}

// Сбор данных формы
function collectFormData() {
    const formData = {
        timestamp: new Date().toISOString(),
        business_type: getRadioValue('business_type'),
        business_type_other: document.querySelector('input[name="business_type_other"]').value,
        revenue: getRadioValue('revenue'),
        main_problems: getCheckboxValues('main_problems'),
        decision_making: getRadioValue('decision_making'),
        biggest_pain: document.querySelector('textarea[name="biggest_pain"]').value,
        payment_readiness: getRadioValue('payment_readiness'),
        ai_usage: getRadioValue('ai_usage'),
        ai_trust: getRadioValue('ai_trust'),
        hypothesis_interest: getRadioValue('hypothesis_interest'),
        main_concern: getRadioValue('main_concern'),
        testing_interest: getRadioValue('testing_interest'),
        contact: document.querySelector('input[name="contact"]').value
    };
    
    return formData;
}

// Получение значения радио кнопки
function getRadioValue(name) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : '';
}

// Получение значений чекбоксов
function getCheckboxValues(name) {
    const checked = document.querySelectorAll(`input[name="${name}"]:checked`);
    return Array.from(checked).map(cb => cb.value);
}

// Сохранение ответа в localStorage
function saveResponse(formData) {
    try {
        // Загружаем существующие данные
        const existingData = localStorage.getItem('surveyResponses');
        let responses = existingData ? JSON.parse(existingData) : [];
        
        // Добавляем новый ответ
        responses.push(formData);
        
        // Сохраняем обратно
        localStorage.setItem('surveyResponses', JSON.stringify(responses));
        
        // Обновляем глобальную переменную
        surveyData = responses;
        
        console.log('Ответ сохранен:', formData);
    } catch (error) {
        console.error('Ошибка сохранения:', error);
    }
}

// Загрузка результатов из localStorage
function loadResults() {
    try {
        const existingData = localStorage.getItem('surveyResponses');
        surveyData = existingData ? JSON.parse(existingData) : [];
    } catch (error) {
        console.error('Ошибка загрузки результатов:', error);
        surveyData = [];
    }
}

// Отправка в WhatsApp
function sendToWhatsApp(formData) {
    const phoneNumber = '79280187060';
    
    // Формируем сообщение
    let message = '🎯 НОВЫЙ ОТВЕТ НА ОПРОС\n\n';
    
    // Основная информация
    message += `📊 БИЗНЕС:\n`;
    message += `• Сфера: ${getBusinessTypeText(formData.business_type, formData.business_type_other)}\n`;
    message += `• Выручка: ${getRevenueText(formData.revenue)}\n\n`;
    
    // Проблемы
    message += `🔥 ПРОБЛЕМЫ:\n`;
    message += `• Главные: ${formData.main_problems.map(p => getProblemText(p)).join(', ')}\n`;
    message += `• Решения: ${getDecisionMakingText(formData.decision_making)}\n`;
    if (formData.biggest_pain) {
        message += `• Больше всего бесит: "${formData.biggest_pain}"\n`;
    }
    message += '\n';
    
    // Готовность платить
    message += `💰 ГОТОВНОСТЬ ПЛАТИТЬ:\n`;
    message += `• ${getPaymentText(formData.payment_readiness)}\n\n`;
    
    // ИИ
    message += `🤖 ОТНОШЕНИЕ К ИИ:\n`;
    message += `• Использование: ${getAIUsageText(formData.ai_usage)}\n`;
    message += `• Доверие: ${getAITrustText(formData.ai_trust)}\n\n`;
    
    // Гипотеза
    message += `🎯 НАША ГИПОТЕЗА:\n`;
    message += `• Интерес: ${getHypothesisText(formData.hypothesis_interest)}\n`;
    message += `• Опасения: ${getConcernText(formData.main_concern)}\n`;
    message += `• Тестирование: ${getTestingText(formData.testing_interest)}\n\n`;
    
    // Контакт
    if (formData.contact) {
        message += `📞 КОНТАКТ: ${formData.contact}\n\n`;
    }
    
    message += `⏰ Время: ${new Date(formData.timestamp).toLocaleString('ru-RU')}`;
    
    // Создаем ссылку WhatsApp
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    // Открываем WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Показываем сообщение об успехе
    showSuccessMessage();
}

// Показать сообщение об успехе
function showSuccessMessage() {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #00b894, #00cec9);
        color: white;
        padding: 30px;
        border-radius: 15px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 1000;
        font-size: 18px;
        font-weight: bold;
    `;
    
    successDiv.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
        <div>Спасибо за участие!</div>
        <div style="font-size: 14px; margin-top: 10px; opacity: 0.9;">
            Ответы отправлены в WhatsApp
        </div>
    `;
    
    document.body.appendChild(successDiv);
    
    // Убираем сообщение через 3 секунды
    setTimeout(() => {
        document.body.removeChild(successDiv);
        
        // Переключаемся на вкладку результатов
        document.querySelector('.nav-tab[data-tab="results"]').click();
    }, 3000);
}

// Отображение результатов
function displayResults() {
    const resultsContent = document.getElementById('resultsContent');
    const totalResponses = document.getElementById('totalResponses');
    
    if (surveyData.length === 0) {
        resultsContent.innerHTML = `
            <div class="no-results">
                <p>Пока нет ответов. Будьте первым! 🚀</p>
            </div>
        `;
        totalResponses.textContent = '0';
        return;
    }
    
    totalResponses.textContent = surveyData.length;
    
    let html = '';
    
    // Анализ по сферам деятельности
    html += createResultBlock('Сферы деятельности', analyzeBusinessTypes());
    
    // Анализ по выручке
    html += createResultBlock('Размер бизнеса (выручка)', analyzeRevenue());
    
    // Анализ главных проблем
    html += createResultBlock('Главные проблемы', analyzeMainProblems());
    
    // Анализ принятия решений
    html += createResultBlock('Как принимают решения', analyzeDecisionMaking());
    
    // Анализ готовности платить
    html += createResultBlock('Готовность платить', analyzePaymentReadiness());
    
    // Анализ использования ИИ
    html += createResultBlock('Использование ИИ', analyzeAIUsage());
    
    // Анализ доверия к ИИ
    html += createResultBlock('Доверие к ИИ в бизнесе', analyzeAITrust());
    
    // Анализ интереса к гипотезе
    html += createResultBlock('Интерес к нашему продукту', analyzeHypothesis());
    
    // Анализ опасений
    html += createResultBlock('Главные опасения', analyzeConcerns());
    
    // Анализ готовности к тестированию
    html += createResultBlock('Готовность к тестированию', analyzeTesting());
    
    // Топ болей (свободные ответы)
    if (surveyData.some(r => r.biggest_pain)) {
        html += createTextResultBlock('Что больше всего бесит в бизнесе', analyzeTextResponses());
    }
    
    resultsContent.innerHTML = html;
}

// Создание блока результатов
function createResultBlock(title, data) {
    const total = surveyData.length;
    
    let html = `
        <div class="result-block">
            <h4>${title}</h4>
    `;
    
    data.forEach(item => {
        const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
        html += `
            <div class="result-item">
                <div class="result-label">${item.label}</div>
                <div class="result-count">${item.count}</div>
            </div>
            <div class="result-bar">
                <div class="result-fill" style="width: ${percentage}%"></div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// Создание блока текстовых ответов
function createTextResultBlock(title, responses) {
    let html = `
        <div class="result-block">
            <h4>${title}</h4>
    `;
    
    responses.forEach((response, index) => {
        if (response.trim()) {
            html += `
                <div class="result-item" style="flex-direction: column; align-items: flex-start;">
                    <div style="font-size: 12px; color: #6c757d; margin-bottom: 5px;">
                        Ответ #${index + 1}
                    </div>
                    <div style="font-style: italic; color: #2d3436;">
                        "${response}"
                    </div>
                </div>
            `;
        }
    });
    
    html += '</div>';
    return html;
}

// Анализ данных
function analyzeBusinessTypes() {
    const counts = {};
    surveyData.forEach(response => {
        const type = response.business_type === 'other' && response.business_type_other 
            ? response.business_type_other 
            : getBusinessTypeText(response.business_type);
        counts[type] = (counts[type] || 0) + 1;
    });
    
    return Object.entries(counts)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);
}

function analyzeRevenue() {
    const counts = {};
    surveyData.forEach(response => {
        const revenue = getRevenueText(response.revenue);
        counts[revenue] = (counts[revenue] || 0) + 1;
    });
    
    return Object.entries(counts)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);
}

function analyzeMainProblems() {
    const counts = {};
    surveyData.forEach(response => {
        response.main_problems.forEach(problem => {
            const problemText = getProblemText(problem);
            counts[problemText] = (counts[problemText] || 0) + 1;
        });
    });
    
    return Object.entries(counts)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);
}

function analyzeDecisionMaking() {
    const counts = {};
    surveyData.forEach(response => {
        const decision = getDecisionMakingText(response.decision_making);
        counts[decision] = (counts[decision] || 0) + 1;
    });
    
    return Object.entries(counts)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);
}

function analyzePaymentReadiness() {
    const counts = {};
    surveyData.forEach(response => {
        const payment = getPaymentText(response.payment_readiness);
        counts[payment] = (counts[payment] || 0) + 1;
    });
    
    return Object.entries(counts)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);
}

function analyzeAIUsage() {
    const counts = {};
    surveyData.forEach(response => {
        const usage = getAIUsageText(response.ai_usage);
        counts[usage] = (counts[usage] || 0) + 1;
    });
    
    return Object.entries(counts)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);
}

function analyzeAITrust() {
    const counts = {};
    surveyData.forEach(response => {
        const trust = getAITrustText(response.ai_trust);
        counts[trust] = (counts[trust] || 0) + 1;
    });
    
    return Object.entries(counts)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);
}

function analyzeHypothesis() {
    const counts = {};
    surveyData.forEach(response => {
        const hypothesis = getHypothesisText(response.hypothesis_interest);
        counts[hypothesis] = (counts[hypothesis] || 0) + 1;
    });
    
    return Object.entries(counts)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);
}

function analyzeConcerns() {
    const counts = {};
    surveyData.forEach(response => {
        const concern = getConcernText(response.main_concern);
        counts[concern] = (counts[concern] || 0) + 1;
    });
    
    return Object.entries(counts)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);
}

function analyzeTesting() {
    const counts = {};
    surveyData.forEach(response => {
        const testing = getTestingText(response.testing_interest);
        counts[testing] = (counts[testing] || 0) + 1;
    });
    
    return Object.entries(counts)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);
}

function analyzeTextResponses() {
    return surveyData
        .map(response => response.biggest_pain)
        .filter(pain => pain && pain.trim());
}

// Функции для преобразования значений в текст
function getBusinessTypeText(type, other = '') {
    const types = {
        'retail': 'Розничная торговля',
        'services': 'Услуги',
        'food': 'Общепит',
        'production': 'Производство/мастерская',
        'other': other || 'Другое'
    };
    return types[type] || type;
}

function getRevenueText(revenue) {
    const revenues = {
        '0-100k': 'До 100 тыс. руб',
        '100-300k': '100-300 тыс. руб',
        '300-500k': '300-500 тыс. руб',
        '500k-1m': '500 тыс - 1 млн руб',
        '1m+': 'Больше 1 млн руб'
    };
    return revenues[revenue] || revenue;
}

function getProblemText(problem) {
    const problems = {
        'few_clients': 'Мало клиентов/заказов',
        'competition': 'Высокая конкуренция',
        'dont_know_what_to_buy': 'Не знаю что заказывать/закупать',
        'dead_stock': 'Товар лежит мертвым грузом',
        'no_money': 'Не хватает денег на развитие',
        'staff': 'Сложно найти хороших сотрудников',
        'routine': 'Много времени на рутину',
        'no_analytics': 'Не понимаю финансовые показатели'
    };
    return problems[problem] || problem;
}

function getDecisionMakingText(decision) {
    const decisions = {
        'intuition': 'Интуитивно, по опыту',
        'advice': 'Советуюсь с коллегами/друзьями',
        'competitors': 'Изучаю конкурентов',
        'analytics': 'Анализирую цифры и отчеты',
        'consultants': 'Нанимаю консультантов'
    };
    return decisions[decision] || decision;
}

function getPaymentText(payment) {
    const payments = {
        'free': 'Бесплатно или никак',
        '1k': 'До 1000 руб/месяц',
        '1-3k': '1000-3000 руб/месяц',
        '3-5k': '3000-5000 руб/месяц',
        '5k+': 'Больше 5000 руб/месяц',
        'percentage': 'Готов платить % с результата'
    };
    return payments[payment] || payment;
}

function getAIUsageText(usage) {
    const usages = {
        'constantly': 'Да, постоянно',
        'sometimes': 'Иногда пробую',
        'heard': 'Слышал, но не пользуюсь',
        'distrust': 'Не доверяю этому',
        'unknown': 'Что это такое?'
    };
    return usages[usage] || usage;
}

function getAITrustText(trust) {
    const trusts = {
        'yes_if_works': 'Да, если советы работают',
        'additional': 'Только как дополнение к человеку',
        'no': 'Нет, не доверяю',
        'depends_price': 'Зависит от цены',
        'dont_know': 'Не знаю'
    };
    return trusts[trust] || trust;
}

function getHypothesisText(hypothesis) {
    const hypotheses = {
        'very': 'Очень! Где взять?',
        'interesting': 'Интересно, но есть сомнения',
        'not_really': 'Не очень, предпочитаю людей',
        'not_at_all': 'Совсем не интересно'
    };
    return hypotheses[hypothesis] || hypothesis;
}

function getConcernText(concern) {
    const concerns = {
        'bad_advice': 'Даст плохой совет',
        'data_security': 'Украдет/сольет данные',
        'complexity': 'Слишком сложно разобраться',
        'expensive': 'Дорого выйдет',
        'no_understanding': 'Не понимает специфику моего бизнеса'
    };
    return concerns[concern] || concern;
}

function getTestingText(testing) {
    const testings = {
        'yes': 'Да! Готов к тестированию',
        'maybe': 'Возможно, напишите мне',
        'no': 'Пока не готов'
    };
    return testings[testing] || testing;
}

// Дополнительные функции для улучшения UX
document.addEventListener('DOMContentLoaded', function() {
    // Автосохранение при заполнении
    const formInputs = document.querySelectorAll('input, textarea');
    formInputs.forEach(input => {
        input.addEventListener('change', function() {
            // Можно добавить автосохранение черновика
            console.log('Поле изменено:', this.name, this.value);
        });
    });
    
    // Прогресс заполнения
    updateProgress();
});

function updateProgress() {
    const totalQuestions = 11; // Общее количество обязательных вопросов
    let answeredQuestions = 0;
    
    const requiredFields = [
        'business_type', 'revenue', 'main_problems', 'decision_making',
        'payment_readiness', 'ai_usage', 'ai_trust', 'hypothesis_interest',
        'main_concern', 'testing_interest'
    ];
    
    requiredFields.forEach(fieldName => {
        if (fieldName === 'main_problems') {
            const checkboxes = document.querySelectorAll(`input[name="${fieldName}"]:checked`);
            if (checkboxes.length > 0) answeredQuestions++;
        } else {
            const checked = document.querySelector(`input[name="${fieldName}"]:checked`);
            if (checked) answeredQuestions++;
        }
    });
    
    const progress = Math.round((answeredQuestions / totalQuestions) * 100);
    
    // Можно добавить индикатор прогресса в интерфейс
    console.log(`Прогресс заполнения: ${progress}%`);
}

// Обновление прогресса при изменении полей
document.addEventListener('change', updateProgress);

        