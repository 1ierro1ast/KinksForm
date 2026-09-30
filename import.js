'use strict';

function createImportLookup() {
    const sources = state.customListText === null
        ? Object.values(DefaultKinksTexts).map(parseList)
        : [state.categories];
    const kinks = new Map();
    const categoryNames = new Set();
    for (const categories of sources) {
        categories.forEach((category, categoryIndex) => {
            categoryNames.add(category.name);
            category.kinks.forEach((kink, kinkIndex) => kinks.set(`${category.name}|${kink.name}`, {
                categoryIndex,
                kinkIndex,
                fieldCount: category.fields.length
            }));
        });
    }
    return { kinks, categoryNames };
}

function parseTextExport(text) {
    const { kinks, categoryNames } = createImportLookup();
    const lines = text.split('\n').map(line => line.replace(/️/g, '').trim());
    const ratings = {};
    let categoryName = '';
    for (const line of lines) {
        const characters = Array.from(line);
        const markCount = characters.findIndex(character => !TextMarks.includes(character));
        if (markCount === -1) {
            continue;
        }
        if (markCount === 0) {
            const nameWithoutFields = line.replace(/\s*\([^()]*\)$/, '');
            if (categoryNames.has(line) || categoryNames.has(nameWithoutFields)) {
                categoryName = categoryNames.has(line) ? line : nameWithoutFields;
            }
            continue;
        }
        const kink = kinks.get(`${categoryName}|${characters.slice(markCount).join('').trim()}`);
        if (kink === undefined || kink.fieldCount !== markCount) {
            continue;
        }
        characters.slice(0, markCount).forEach((mark, fieldIndex) => {
            const level = TextMarks.indexOf(mark);
            if (level > 0) {
                ratings[ratingKey(kink.categoryIndex, kink.kinkIndex, fieldIndex)] = level;
            }
        });
    }
    const titleParts = lines[0].split(' · ');
    return { ratings, name: titleParts.length === 3 ? titleParts[0] : '' };
}
