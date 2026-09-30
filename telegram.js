'use strict';

const TelegramApp = window.Telegram?.WebApp;
const IsTelegram = TelegramApp !== undefined && TelegramApp.initData !== '';

const TelegramAppLink = 'https://t.me/KinksForm_bot/kinks_form';

const CloudKeys = {
    answers: 'answers',
    name: 'name',
    language: 'language'
};

function initTelegram() {
    document.documentElement.classList.add('telegram');
    TelegramApp.ready();
    TelegramApp.expand();
    TelegramApp.disableVerticalSwipes();
}

function loadFromCloud(onLoaded) {
    TelegramApp.CloudStorage.getItems(Object.values(CloudKeys), (error, values) => {
        if (error) {
            TelegramApp.showAlert(`${getStrings().cloudError} ${error}`);
            return;
        }
        onLoaded(values);
    });
}

function saveToCloud(key, value) {
    TelegramApp.CloudStorage.setItem(key, value, error => {
        if (error) {
            TelegramApp.showAlert(`${getStrings().cloudError} ${error}`);
        }
    });
}

function updateShareButton(text, isVisible) {
    TelegramApp.MainButton.setParams({ text, is_visible: isVisible });
}

function shareToTelegram(url, text) {
    TelegramApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
}
