'use strict';

const LevelColors = ['#3d8bfd', '#2fb15b', '#f0c419', '#fd8c28', '#e5383b'];

const LegacyLayouts = [
    [[1, 7], [2, 10], [1, 6], [2, 12], [2, 7], [2, 6], [2, 6], [2, 12], [2, 6], [2, 9], [2, 18], [2, 7], [2, 6], [1, 4], [2, 7], [2, 24]]
];

const SameRoleCategories = [11, 12];

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
    matchPercent: document.getElementById('matchPercent'),
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
    editorError: document.getElementById('editorError'),
    importDialog: document.getElementById('importDialog'),
    importText: document.getElementById('importText'),
    importError: document.getElementById('importError')
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
        updateMainButton(state.shared === null ? strings.shareProfile : strings.fillOwn);
    }
}

function renderList() {
    const sections = [];
    const chips = [];
    state.categories.forEach((category, categoryIndex) => {
        const color = categoryColor(categoryIndex, state.categories.length);
        const section = createElement('section', 'category');
        section.style.setProperty('--cat', color);
        const title = createElement('h2', 'category-title', category.name);
        section.append(title);
        category.kinks.forEach((kink, kinkIndex) => section.append(renderKink(category, kink, categoryIndex, kinkIndex)));
        sections.push(section);
        if (state.shared !== null) {
            const scores = getCategoryScores(categoryIndex);
            if (scores.length > 0) {
                title.append(createElement('span', 'category-match', `${getMatchPercent(scores)}%`));
            }
        }

        const chip = createElement('button', 'chip', category.name);
        chip.type = 'button';
        chip.style.setProperty('--cat', color);
        chip.addEventListener('click', () => scrollToSection(section));
        chips.push(chip);
    });
    elements.list.replaceChildren(...sections);
    elements.categoryNav.replaceChildren(...chips);
    updateProgress();
    if (state.shared !== null) {
        updateMatchPercent();
    }
}

function getMatchPairs(categoryIndex, kinkIndex) {
    const fieldCount = state.categories[categoryIndex].fields.length;
    const isCrossed = fieldCount === 2 && !SameRoleCategories.includes(categoryIndex);
    return Array.from({ length: fieldCount }, (_, fieldIndex) => ({
        theirs: state.shared.ratings[ratingKey(categoryIndex, kinkIndex, fieldIndex)],
        mine: state.ratings[ratingKey(categoryIndex, kinkIndex, isCrossed ? 1 - fieldIndex : fieldIndex)]
    })).filter(pair => pair.theirs !== undefined && pair.mine !== undefined);
}

function getKinkScores(categoryIndex, kinkIndex) {
    const noLevel = LevelColors.length;
    const scores = getMatchPairs(categoryIndex, kinkIndex)
        .filter(pair => pair.theirs < noLevel || pair.mine < noLevel)
        .map(pair => (noLevel - Math.max(pair.theirs, pair.mine)) / (noLevel - 1));
    return scores.length === 0 ? [] : [Math.max(...scores)];
}

function getCategoryScores(categoryIndex) {
    return state.categories[categoryIndex].kinks.flatMap((kink, kinkIndex) => getKinkScores(categoryIndex, kinkIndex));
}

function getMatchPercent(scores) {
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length * 100);
}

function updateMatchPercent() {
    const scores = state.categories.flatMap((category, categoryIndex) => getCategoryScores(categoryIndex));
    const strings = getStrings();
    if (scores.length > 0) {
        elements.matchPercent.textContent = strings.match(getMatchPercent(scores));
    } else {
        elements.matchPercent.textContent = Object.keys(state.ratings).length === 0 ? strings.noMatch : '';
    }
}

function renderKink(category, kink, categoryIndex, kinkIndex) {
    const levelNames = getStrings().levels;
    const row = createElement('div', kink.description === '' ? 'kink' : 'kink has-description');
    const isMutual = state.shared !== null && getMatchPairs(categoryIndex, kinkIndex).some(pair => pair.theirs <= 2 && pair.mine <= 2);
    row.classList.toggle('mutual', isMutual);
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
    saveRatings();
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

function getLayoutKeys(layout) {
    return layout.flatMap(([fieldCount, kinkCount], categoryIndex) =>
        Array.from({ length: kinkCount }, (_, kinkIndex) =>
            Array.from({ length: fieldCount }, (_, fieldIndex) => ratingKey(categoryIndex, kinkIndex, fieldIndex))).flat());
}

function getCodeKeySets() {
    return [getAllKeys(), ...LegacyLayouts.map(getLayoutKeys)];
}

function findCodeKeys(code) {
    return getCodeKeySets().find(keys => code.length === Math.ceil(keys.length / 2));
}

function isValidCode(code) {
    return /^[0-9a-z]*$/.test(code) && findCodeKeys(code) !== undefined;
}

function decodeRatings(code) {
    const ratings = {};
    findCodeKeys(code).forEach((key, index) => {
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
    const code = getCodeKeySets()
        .map(keys => param.slice(0, Math.ceil(keys.length / 2)))
        .find(isValidCode);
    if (code === undefined) {
        TelegramApp.showAlert(getStrings().wrongLink);
        return;
    }
    state.shared = { ratings: decodeRatings(code), name: decodeBase64Url(param.slice(code.length)) };
}

function closeShared() {
    state.shared = null;
    applyTranslations();
    renderList();
    window.scrollTo(0, 0);
}

function handleMainButton() {
    if (state.shared === null) {
        shareProfile();
    } else {
        closeShared();
    }
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

function openImport() {
    elements.importText.value = '';
    elements.importError.textContent = '';
    elements.importDialog.showModal();
}

function importAnswers() {
    const imported = parseTextExport(elements.importText.value);
    if (Object.keys(imported.ratings).length === 0) {
        elements.importError.textContent = getStrings().importFailed;
        return;
    }
    const apply = () => {
        state.ratings = imported.ratings;
        state.name = imported.name;
        saveRatings();
        saveName();
        renderList();
        elements.nameInput.value = state.name;
        elements.preview.hidden = true;
        elements.textPreview.hidden = true;
        elements.importDialog.close();
    };
    if (Object.keys(state.ratings).length === 0) {
        apply();
    } else {
        confirmAction(getStrings().confirmImport, apply);
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
    if (IsTelegram) {
        TelegramApp.MainButton.onClick(handleMainButton);
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
    document.getElementById('openImport').addEventListener('click', openImport);
    document.getElementById('importAnswers').addEventListener('click', importAnswers);
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
