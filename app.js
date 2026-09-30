'use strict';

const LevelColors = ['#3d8bfd', '#2fb15b', '#f0c419', '#fd8c28', '#e5383b'];

const StorageKeys = {
    ratings: 'kinklist.answers',
    name: 'kinklist.name',
    list: 'kinklist.list',
    language: 'kinklist.language'
};

const state = {
    language: localStorage.getItem(StorageKeys.language) ?? 'en',
    customListText: IsTelegram ? null : localStorage.getItem(StorageKeys.list),
    categories: [],
    ratings: JSON.parse(localStorage.getItem(StorageKeys.ratings) ?? '{}'),
    name: localStorage.getItem(StorageKeys.name) ?? '',
    shared: null
};

const elements = {
    top: document.getElementById('top'),
    progress: document.getElementById('progress'),
    languageToggle: document.getElementById('languageToggle'),
    sharedTitle: document.getElementById('sharedTitle'),
    legend: document.getElementById('legend'),
    categoryNav: document.getElementById('categoryNav'),
    list: document.getElementById('list'),
    exportDialog: document.getElementById('exportDialog'),
    nameInput: document.getElementById('nameInput'),
    onlyRated: document.getElementById('onlyRated'),
    shareLink: document.getElementById('shareLink'),
    textPreview: document.getElementById('textPreview'),
    exportedText: document.getElementById('exportedText'),
    copyText: document.getElementById('copyText'),
    preview: document.getElementById('preview'),
    previewImage: document.getElementById('previewImage'),
    shareImage: document.getElementById('shareImage'),
    downloadImage: document.getElementById('downloadImage'),
    editorDialog: document.getElementById('editorDialog'),
    listText: document.getElementById('listText'),
    editorError: document.getElementById('editorError')
};

let previewFile;

function getStrings() {
    return Translations[state.language];
}

function getVisibleRatings() {
    return state.shared === null ? state.ratings : state.shared.ratings;
}

function getVisibleName() {
    return state.shared === null ? state.name : state.shared.name;
}

function getListText() {
    return state.customListText ?? DefaultKinksTexts[state.language];
}

function parseList(text) {
    const strings = getStrings();
    const categories = [];
    text.split('\n').forEach((rawLine, index) => {
        const line = rawLine.trim();
        if (line === '') {
            return;
        }
        if (line.startsWith('#')) {
            categories.push({ name: line.slice(1).trim(), fields: [], kinks: [] });
            return;
        }
        const category = categories.at(-1);
        if (category === undefined) {
            throw new Error(strings.needCategory(index + 1));
        }
        if (line.startsWith('(') && line.endsWith(')')) {
            category.fields = line.slice(1, -1).split(',').map(field => field.trim()).filter(field => field !== '');
        } else if (line.startsWith('*')) {
            const [name, description = ''] = line.slice(1).split(':::').map(part => part.trim());
            category.kinks.push({ name, description });
        } else {
            throw new Error(strings.badFormat(index + 1, line));
        }
    });
    const invalid = categories.find(category => category.fields.length === 0);
    if (invalid !== undefined) {
        throw new Error(strings.noFields(invalid.name));
    }
    return categories;
}

function ratingKey(categoryIndex, kinkIndex, fieldIndex) {
    return `${categoryIndex}.${kinkIndex}.${fieldIndex}`;
}

function getSlots(categories) {
    return categories.flatMap((category, categoryIndex) =>
        category.kinks.flatMap((kink, kinkIndex) =>
            category.fields.map((field, fieldIndex) => ({
                key: ratingKey(categoryIndex, kinkIndex, fieldIndex),
                name: `${category.name}|${kink.name}|${field}`
            }))));
}

function getAllKeys() {
    return getSlots(state.categories).map(slot => slot.key);
}

function categoryColor(index, count) {
    return `hsl(${Math.round(index * 360 / count)}, 48%, 42%)`;
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    if (text !== undefined) {
        element.textContent = text;
    }
    return element;
}

function createLegendItem(name, index) {
    const item = createElement('span', 'legend-item');
    const dot = createElement('span', 'dot');
    dot.style.setProperty('--color', LevelColors[index]);
    item.append(dot, name);
    return item;
}

function applyTranslations() {
    const strings = getStrings();
    document.documentElement.lang = state.language;
    document.title = strings.title;
    for (const element of document.querySelectorAll('[data-i18n]')) {
        element.textContent = strings[element.dataset.i18n];
    }
    for (const element of document.querySelectorAll('[data-i18n-placeholder]')) {
        element.placeholder = strings[element.dataset.i18nPlaceholder];
    }
    for (const element of document.querySelectorAll('[data-i18n-aria-label]')) {
        element.setAttribute('aria-label', strings[element.dataset.i18nAriaLabel]);
    }
    elements.languageToggle.textContent = strings.switchLabel;
    elements.legend.replaceChildren(...strings.levels.map(createLegendItem));
    document.documentElement.classList.toggle('viewing', state.shared !== null);
    if (state.shared !== null) {
        elements.sharedTitle.textContent = strings.sharedAnswers(state.shared.name);
    }
    if (IsTelegram) {
        updateShareButton(strings.shareProfile, state.shared === null);
    }
}

function renderList() {
    const sections = [];
    const chips = [];
    state.categories.forEach((category, categoryIndex) => {
        const color = categoryColor(categoryIndex, state.categories.length);
        const section = createElement('section', 'category');
        section.style.setProperty('--cat', color);
        section.append(createElement('h2', 'category-title', category.name));
        category.kinks.forEach((kink, kinkIndex) => section.append(renderKink(category, kink, categoryIndex, kinkIndex)));
        sections.push(section);

        const chip = createElement('button', 'chip', category.name);
        chip.type = 'button';
        chip.style.setProperty('--cat', color);
        chip.addEventListener('click', () => scrollToSection(section));
        chips.push(chip);
    });
    elements.list.replaceChildren(...sections);
    elements.categoryNav.replaceChildren(...chips);
    updateProgress();
}

function renderKink(category, kink, categoryIndex, kinkIndex) {
    const levelNames = getStrings().levels;
    const row = createElement('div', kink.description === '' ? 'kink' : 'kink has-description');
    row.append(createElement('div', 'kink-name', kink.name));
    if (kink.description !== '') {
        row.append(createElement('p', 'kink-description', kink.description));
    }
    const fields = createElement('div', 'kink-fields');
    category.fields.forEach((field, fieldIndex) => {
        const group = createElement('div', 'field');
        if (category.fields.length > 1) {
            group.append(createElement('span', 'field-label', field));
        }
        const choices = createElement('div', 'choices');
        choices.dataset.key = ratingKey(categoryIndex, kinkIndex, fieldIndex);
        LevelColors.forEach((color, index) => {
            const choice = createElement('button', 'choice');
            choice.type = 'button';
            choice.dataset.level = index + 1;
            choice.style.setProperty('--color', color);
            choice.setAttribute('aria-label', `${field}: ${levelNames[index]}`);
            choices.append(choice);
        });
        updateChoices(choices);
        group.append(choices);
        fields.append(group);
    });
    row.append(fields);
    return row;
}

function updateChoices(choices) {
    const level = getVisibleRatings()[choices.dataset.key];
    for (const choice of choices.children) {
        choice.classList.toggle('selected', Number(choice.dataset.level) === level);
    }
}

function updateProgress() {
    const keys = getAllKeys();
    const ratings = getVisibleRatings();
    const rated = keys.filter(key => key in ratings).length;
    elements.progress.textContent = `${rated} / ${keys.length}`;
}

function scrollToSection(section) {
    const top = section.getBoundingClientRect().top + window.scrollY - elements.top.offsetHeight - 8;
    window.scrollTo({ top, behavior: 'smooth' });
}

function rate(choice) {
    const choices = choice.parentElement;
    const key = choices.dataset.key;
    const level = Number(choice.dataset.level);
    if (state.ratings[key] === level) {
        delete state.ratings[key];
    } else {
        state.ratings[key] = level;
    }
    saveRatings();
    updateChoices(choices);
    updateProgress();
}

function saveRatings() {
    localStorage.setItem(StorageKeys.ratings, JSON.stringify(state.ratings));
    if (IsTelegram) {
        saveToCloud(CloudKeys.answers, encodeRatings());
    }
}

function saveName() {
    localStorage.setItem(StorageKeys.name, state.name);
    if (IsTelegram) {
        saveToCloud(CloudKeys.name, state.name);
    }
}

function saveLanguage() {
    localStorage.setItem(StorageKeys.language, state.language);
    if (IsTelegram) {
        saveToCloud(CloudKeys.language, state.language);
    }
}

function refresh() {
    state.categories = parseList(getListText());
    applyTranslations();
    renderList();
}

function switchLanguage() {
    state.language = state.language === 'en' ? 'ru' : 'en';
    saveLanguage();
    refresh();
}

function applyCloudData(values) {
    if (!values.answers) {
        saveRatings();
        saveName();
        saveLanguage();
        return;
    }
    state.language = values.language || state.language;
    state.name = values.name ?? '';
    if (isValidCode(values.answers)) {
        state.ratings = decodeRatings(values.answers);
    }
    localStorage.setItem(StorageKeys.ratings, JSON.stringify(state.ratings));
    localStorage.setItem(StorageKeys.name, state.name);
    localStorage.setItem(StorageKeys.language, state.language);
    refresh();
}

function confirmAction(message, onConfirm) {
    if (IsTelegram) {
        TelegramApp.showConfirm(message, confirmed => {
            if (confirmed) {
                onConfirm();
            }
        });
    } else if (confirm(message)) {
        onConfirm();
    }
}

function encodeRatings() {
    const values = getAllKeys().map(key => state.ratings[key] ?? 0);
    let code = '';
    for (let i = 0; i < values.length; i += 2) {
        code += (values[i] * 6 + (values[i + 1] ?? 0)).toString(36);
    }
    return code;
}

function isValidCode(code) {
    return code.length === Math.ceil(getAllKeys().length / 2) && /^[0-9a-z]*$/.test(code);
}

function decodeRatings(code) {
    const ratings = {};
    getAllKeys().forEach((key, index) => {
        const pair = parseInt(code[Math.floor(index / 2)], 36);
        const level = index % 2 === 0 ? Math.floor(pair / 6) : pair % 6;
        if (level > 0) {
            ratings[key] = level;
        }
    });
    return ratings;
}

function encodeBase64Url(text) {
    const binary = String.fromCharCode(...new TextEncoder().encode(text));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64Url(value) {
    const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
    return new TextDecoder().decode(Uint8Array.from(binary, character => character.charCodeAt(0)));
}

function applyStartParam() {
    const param = TelegramApp.initDataUnsafe.start_param;
    if (param === undefined) {
        return;
    }
    const codeLength = Math.ceil(getAllKeys().length / 2);
    const code = param.slice(0, codeLength);
    if (!isValidCode(code)) {
        TelegramApp.showAlert(getStrings().wrongLink);
        return;
    }
    state.shared = { ratings: decodeRatings(code), name: decodeBase64Url(param.slice(codeLength)) };
}

function closeShared() {
    state.shared = null;
    applyTranslations();
    renderList();
}

function shareProfile() {
    const name = (state.name || TelegramApp.initDataUnsafe.user.first_name).slice(0, 32);
    shareToTelegram(`${TelegramAppLink}?startapp=${encodeRatings()}${encodeBase64Url(name)}`, getStrings().shareMessage);
}

function applySharedLink() {
    const params = new URLSearchParams(location.hash.slice(1));
    if (!params.has('r')) {
        return;
    }
    history.replaceState(null, '', location.pathname + location.search);
    const strings = getStrings();
    const code = params.get('r');
    if (!isValidCode(code)) {
        alert(strings.wrongLink);
        return;
    }
    const hasOwnRatings = Object.keys(state.ratings).length > 0;
    if (hasOwnRatings && !confirm(strings.confirmLink)) {
        return;
    }
    state.ratings = decodeRatings(code);
    state.name = params.get('n') ?? '';
    saveRatings();
    saveName();
}

function ignoreAbort(error) {
    if (error.name !== 'AbortError') {
        throw error;
    }
}

async function shareLink() {
    const strings = getStrings();
    const params = new URLSearchParams({ r: encodeRatings() });
    if (state.name !== '') {
        params.set('n', state.name);
    }
    const url = `${location.origin}${location.pathname}#${params}`;
    if (navigator.share) {
        await navigator.share({ title: strings.title, url }).catch(ignoreAbort);
        return;
    }
    await navigator.clipboard.writeText(url);
    elements.shareLink.textContent = strings.linkCopied;
}

async function exportImage() {
    const blob = await renderImage(elements.onlyRated.checked);
    URL.revokeObjectURL(elements.previewImage.src);
    const url = URL.createObjectURL(blob);
    elements.previewImage.src = url;
    elements.downloadImage.href = url;
    previewFile = new File([blob], 'kinklist.png', { type: 'image/png' });
    elements.textPreview.hidden = true;
    elements.shareImage.hidden = !(navigator.canShare && navigator.canShare({ files: [previewFile] }));
    elements.preview.hidden = false;
    elements.preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function exportText() {
    elements.exportedText.value = renderText(elements.onlyRated.checked);
    elements.copyText.textContent = getStrings().copy;
    elements.preview.hidden = true;
    elements.textPreview.hidden = false;
    elements.textPreview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function copyText() {
    elements.exportedText.select();
    const copied = await navigator.clipboard.writeText(elements.exportedText.value)
        .then(() => true, () => document.execCommand('copy'));
    if (copied) {
        elements.copyText.textContent = getStrings().copied;
    }
}

function exportPdf() {
    renderReport(elements.onlyRated.checked);
    elements.exportDialog.close();
    window.print();
}

function openEditor() {
    elements.listText.value = getListText();
    elements.editorError.textContent = '';
    elements.editorDialog.showModal();
}

function remapRatings(oldCategories, newCategories) {
    const levelsByName = new Map();
    for (const slot of getSlots(oldCategories)) {
        if (slot.key in state.ratings) {
            levelsByName.set(slot.name, state.ratings[slot.key]);
        }
    }
    const ratings = {};
    for (const slot of getSlots(newCategories)) {
        if (levelsByName.has(slot.name)) {
            ratings[slot.key] = levelsByName.get(slot.name);
        }
    }
    return ratings;
}

function saveList() {
    const text = elements.listText.value.trim();
    let categories;
    try {
        categories = parseList(text);
    } catch (error) {
        elements.editorError.textContent = error.message;
        return;
    }
    state.ratings = remapRatings(state.categories, categories);
    state.categories = categories;
    saveRatings();
    if (Object.values(DefaultKinksTexts).includes(text)) {
        state.customListText = null;
        localStorage.removeItem(StorageKeys.list);
    } else {
        state.customListText = text;
        localStorage.setItem(StorageKeys.list, text);
    }
    renderList();
    elements.editorDialog.close();
}

function resetRatings() {
    confirmAction(getStrings().confirmReset, () => {
        state.ratings = {};
        saveRatings();
        renderList();
    });
}

function bindEvents() {
    elements.list.addEventListener('click', event => {
        const choice = event.target.closest('.choice');
        if (choice !== null) {
            if (state.shared === null) {
                rate(choice);
            }
            return;
        }
        const name = event.target.closest('.has-description .kink-name');
        if (name !== null) {
            name.parentElement.classList.toggle('expanded');
        }
    });

    elements.languageToggle.addEventListener('click', switchLanguage);
    document.getElementById('closeShared').addEventListener('click', closeShared);
    if (IsTelegram) {
        TelegramApp.MainButton.onClick(shareProfile);
    }
    document.getElementById('openExport').addEventListener('click', () => {
        elements.nameInput.value = state.name;
        elements.shareLink.textContent = getStrings().shareLink;
        elements.exportDialog.showModal();
    });
    elements.nameInput.addEventListener('input', () => {
        state.name = elements.nameInput.value.trim();
        saveName();
    });
    document.getElementById('exportImage').addEventListener('click', exportImage);
    document.getElementById('exportPdf').addEventListener('click', exportPdf);
    document.getElementById('exportText').addEventListener('click', exportText);
    elements.copyText.addEventListener('click', copyText);
    elements.shareLink.addEventListener('click', shareLink);
    elements.shareImage.addEventListener('click', () =>
        navigator.share({ files: [previewFile], title: getStrings().title }).catch(ignoreAbort));

    document.getElementById('openEditor').addEventListener('click', openEditor);
    document.getElementById('restoreList').addEventListener('click', () => {
        elements.listText.value = DefaultKinksTexts[state.language];
    });
    document.getElementById('saveList').addEventListener('click', saveList);
    document.getElementById('resetRatings').addEventListener('click', resetRatings);
}

state.categories = parseList(getListText());
if (IsTelegram) {
    initTelegram();
    applyStartParam();
}
applyTranslations();
applySharedLink();
renderList();
bindEvents();
if (IsTelegram) {
    loadFromCloud(applyCloudData);
}
