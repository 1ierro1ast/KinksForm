'use strict';

const Levels = [
    { name: 'Обожаю', color: '#3d8bfd' },
    { name: 'Нравится', color: '#2fb15b' },
    { name: 'Нормально', color: '#f0c419' },
    { name: 'Возможно', color: '#fd8c28' },
    { name: 'Нет', color: '#e5383b' }
];

const StorageKeys = {
    ratings: 'kinklist.ratings',
    name: 'kinklist.name',
    list: 'kinklist.list'
};

const state = {
    listText: localStorage.getItem(StorageKeys.list) ?? DefaultKinksText,
    categories: [],
    ratings: JSON.parse(localStorage.getItem(StorageKeys.ratings) ?? '{}'),
    name: localStorage.getItem(StorageKeys.name) ?? ''
};

const elements = {
    top: document.getElementById('top'),
    progress: document.getElementById('progress'),
    legend: document.getElementById('legend'),
    categoryNav: document.getElementById('categoryNav'),
    list: document.getElementById('list'),
    exportDialog: document.getElementById('exportDialog'),
    nameInput: document.getElementById('nameInput'),
    onlyRated: document.getElementById('onlyRated'),
    shareLink: document.getElementById('shareLink'),
    preview: document.getElementById('preview'),
    previewImage: document.getElementById('previewImage'),
    shareImage: document.getElementById('shareImage'),
    downloadImage: document.getElementById('downloadImage'),
    editorDialog: document.getElementById('editorDialog'),
    listText: document.getElementById('listText'),
    editorError: document.getElementById('editorError')
};

let previewFile;

function parseList(text) {
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
            throw new Error(`Строка ${index + 1}: сначала нужна категория (#Название)`);
        }
        if (line.startsWith('(') && line.endsWith(')')) {
            category.fields = line.slice(1, -1).split(',').map(field => field.trim()).filter(field => field !== '');
        } else if (line.startsWith('*')) {
            const [name, description = ''] = line.slice(1).split(':::').map(part => part.trim());
            category.kinks.push({ name, description });
        } else {
            throw new Error(`Строка ${index + 1}: непонятный формат «${line}»`);
        }
    });
    const invalid = categories.find(category => category.fields.length === 0);
    if (invalid !== undefined) {
        throw new Error(`Категория «${invalid.name}»: укажите колонки, например (Делаю, Получаю)`);
    }
    return categories;
}

function ratingKey(category, kink, field) {
    return `${category.name}|${kink.name}|${field}`;
}

function getAllKeys() {
    return state.categories.flatMap(category =>
        category.kinks.flatMap(kink => category.fields.map(field => ratingKey(category, kink, field))));
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

function createLegendItem(level) {
    const item = createElement('span', 'legend-item');
    const dot = createElement('span', 'dot');
    dot.style.setProperty('--color', level.color);
    item.append(dot, level.name);
    return item;
}

function renderList() {
    const sections = [];
    const chips = [];
    state.categories.forEach((category, index) => {
        const section = createElement('section', 'category');
        section.style.setProperty('--cat', categoryColor(index, state.categories.length));
        section.append(createElement('h2', 'category-title', category.name));
        for (const kink of category.kinks) {
            section.append(renderKink(category, kink));
        }
        sections.push(section);

        const chip = createElement('button', 'chip', category.name);
        chip.type = 'button';
        chip.style.setProperty('--cat', categoryColor(index, state.categories.length));
        chip.addEventListener('click', () => scrollToSection(section));
        chips.push(chip);
    });
    elements.list.replaceChildren(...sections);
    elements.categoryNav.replaceChildren(...chips);
    updateProgress();
}

function renderKink(category, kink) {
    const row = createElement('div', kink.description === '' ? 'kink' : 'kink has-description');
    row.append(createElement('div', 'kink-name', kink.name));
    if (kink.description !== '') {
        row.append(createElement('p', 'kink-description', kink.description));
    }
    const fields = createElement('div', 'kink-fields');
    for (const field of category.fields) {
        const group = createElement('div', 'field');
        if (category.fields.length > 1) {
            group.append(createElement('span', 'field-label', field));
        }
        const choices = createElement('div', 'choices');
        choices.dataset.key = ratingKey(category, kink, field);
        Levels.forEach((level, index) => {
            const choice = createElement('button', 'choice');
            choice.type = 'button';
            choice.dataset.level = index + 1;
            choice.style.setProperty('--color', level.color);
            choice.setAttribute('aria-label', `${field}: ${level.name}`);
            choices.append(choice);
        });
        updateChoices(choices);
        group.append(choices);
        fields.append(group);
    }
    row.append(fields);
    return row;
}

function updateChoices(choices) {
    const level = state.ratings[choices.dataset.key];
    for (const choice of choices.children) {
        choice.classList.toggle('selected', Number(choice.dataset.level) === level);
    }
}

function updateProgress() {
    const keys = getAllKeys();
    const rated = keys.filter(key => key in state.ratings).length;
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
}

function saveName() {
    localStorage.setItem(StorageKeys.name, state.name);
}

function encodeRatings() {
    const values = getAllKeys().map(key => state.ratings[key] ?? 0);
    let code = '';
    for (let i = 0; i < values.length; i += 2) {
        code += (values[i] * 6 + (values[i + 1] ?? 0)).toString(36);
    }
    return code;
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

function applySharedLink() {
    const params = new URLSearchParams(location.hash.slice(1));
    if (!params.has('r')) {
        return;
    }
    history.replaceState(null, '', location.pathname + location.search);
    const code = params.get('r');
    if (code.length !== Math.ceil(getAllKeys().length / 2) || !/^[0-9a-z]*$/.test(code)) {
        alert('Ссылка создана для другого списка.');
        return;
    }
    const hasOwnRatings = Object.keys(state.ratings).length > 0;
    if (hasOwnRatings && !confirm('Открыть ответы из ссылки? Ваши текущие ответы будут заменены.')) {
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
    const params = new URLSearchParams({ r: encodeRatings() });
    if (state.name !== '') {
        params.set('n', state.name);
    }
    const url = `${location.origin}${location.pathname}#${params}`;
    if (navigator.share) {
        await navigator.share({ title: 'Кинклист', url }).catch(ignoreAbort);
        return;
    }
    await navigator.clipboard.writeText(url);
    elements.shareLink.textContent = 'Ссылка скопирована';
}

async function exportImage() {
    const blob = await renderImage(elements.onlyRated.checked);
    URL.revokeObjectURL(elements.previewImage.src);
    const url = URL.createObjectURL(blob);
    elements.previewImage.src = url;
    elements.downloadImage.href = url;
    previewFile = new File([blob], 'kinklist.png', { type: 'image/png' });
    elements.shareImage.hidden = !(navigator.canShare && navigator.canShare({ files: [previewFile] }));
    elements.preview.hidden = false;
    elements.preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function exportPdf() {
    renderReport(elements.onlyRated.checked);
    elements.exportDialog.close();
    window.print();
}

function openEditor() {
    elements.listText.value = state.listText;
    elements.editorError.textContent = '';
    elements.editorDialog.showModal();
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
    state.listText = text;
    state.categories = categories;
    if (text === DefaultKinksText) {
        localStorage.removeItem(StorageKeys.list);
    } else {
        localStorage.setItem(StorageKeys.list, text);
    }
    renderList();
    elements.editorDialog.close();
}

function resetRatings() {
    if (!confirm('Удалить все ответы?')) {
        return;
    }
    state.ratings = {};
    saveRatings();
    renderList();
}

function bindEvents() {
    elements.list.addEventListener('click', event => {
        const choice = event.target.closest('.choice');
        if (choice !== null) {
            rate(choice);
            return;
        }
        const name = event.target.closest('.has-description .kink-name');
        if (name !== null) {
            name.parentElement.classList.toggle('expanded');
        }
    });

    document.getElementById('openExport').addEventListener('click', () => {
        elements.nameInput.value = state.name;
        elements.shareLink.textContent = 'Ссылка на ответы';
        elements.exportDialog.showModal();
    });
    elements.nameInput.addEventListener('input', () => {
        state.name = elements.nameInput.value.trim();
        saveName();
    });
    document.getElementById('exportImage').addEventListener('click', exportImage);
    document.getElementById('exportPdf').addEventListener('click', exportPdf);
    elements.shareLink.addEventListener('click', shareLink);
    elements.shareImage.addEventListener('click', () =>
        navigator.share({ files: [previewFile], title: 'Кинклист' }).catch(ignoreAbort));

    document.getElementById('openEditor').addEventListener('click', openEditor);
    document.getElementById('restoreList').addEventListener('click', () => {
        elements.listText.value = DefaultKinksText;
    });
    document.getElementById('saveList').addEventListener('click', saveList);
    document.getElementById('resetRatings').addEventListener('click', resetRatings);
}

state.categories = parseList(state.listText);
elements.legend.append(...Levels.map(createLegendItem));
applySharedLink();
renderList();
bindEvents();
