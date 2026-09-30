'use strict';

const FontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';

const ImageLayout = {
    padding: 40,
    columnWidth: 420,
    columnGap: 28,
    blockGap: 18,
    titleHeight: 30,
    fieldHeaderHeight: 20,
    rowHeight: 23,
    circleRadius: 7,
    minFieldWidth: 26,
    maxColumns: 4,
    targetAspect: 1.3,
    maxPixels: 16000000
};

const ImageColors = {
    background: '#ffffff',
    text: '#1d1d24',
    muted: '#6b6b78',
    stripe: '#f3f3f7',
    empty: '#c4c4cf'
};

function getExportCategories(onlyRated) {
    return state.categories
        .map((category, categoryIndex) => ({
            name: category.name,
            fields: category.fields,
            color: categoryColor(categoryIndex, state.categories.length),
            kinks: category.kinks
                .map((kink, kinkIndex) => ({
                    name: kink.name,
                    levels: category.fields.map((field, fieldIndex) =>
                        state.ratings[ratingKey(categoryIndex, kinkIndex, fieldIndex)] ?? 0)
                }))
                .filter(kink => !onlyRated || kink.levels.some(level => level > 0))
        }))
        .filter(category => category.kinks.length > 0);
}

function getExportTitle() {
    return state.name === '' ? getStrings().title : state.name;
}

function getExportSubtitle() {
    const strings = getStrings();
    const date = new Date().toLocaleDateString(strings.dateLocale);
    return state.name === '' ? date : `${strings.title} · ${date}`;
}

function renderImage(onlyRated) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const blocks = getExportCategories(onlyRated).map(category => measureBlock(context, category));
    const layout = chooseLayout(context, blocks);
    const scale = Math.min(2, Math.sqrt(ImageLayout.maxPixels / (layout.width * layout.height)));

    canvas.width = Math.round(layout.width * scale);
    canvas.height = Math.round(layout.height * scale);
    context.scale(scale, scale);
    context.fillStyle = ImageColors.background;
    context.fillRect(0, 0, layout.width, layout.height);

    drawHeader(context, layout.legend);
    layout.columns.forEach((column, index) => {
        const x = ImageLayout.padding + index * (ImageLayout.columnWidth + ImageLayout.columnGap);
        let y = ImageLayout.padding + layout.headerHeight;
        for (const block of column) {
            drawBlock(context, block, x, y);
            y += block.height;
        }
    });

    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

function measureBlock(context, category) {
    const hasFieldHeader = category.fields.length > 1;
    context.font = `11px ${FontFamily}`;
    const fieldWidths = category.fields.map(field => hasFieldHeader
        ? Math.max(ImageLayout.minFieldWidth, context.measureText(field).width + 8)
        : ImageLayout.minFieldWidth);
    const headerHeight = ImageLayout.titleHeight + (hasFieldHeader ? ImageLayout.fieldHeaderHeight : 4);
    return {
        category,
        fieldWidths,
        headerHeight,
        height: headerHeight + category.kinks.length * ImageLayout.rowHeight + ImageLayout.blockGap
    };
}

function measureLegend(context, maxWidth) {
    context.font = `14px ${FontFamily}`;
    const items = [];
    let x = 0;
    let line = 0;
    getStrings().levels.forEach((name, index) => {
        const itemWidth = 20 + context.measureText(name).width;
        if (x > 0 && x + itemWidth > maxWidth) {
            x = 0;
            line++;
        }
        items.push({ name, level: index + 1, x, line });
        x += itemWidth + 18;
    });
    return { items, height: (line + 1) * 24 };
}

function distributeBlocks(blocks, columnCount) {
    const target = blocks.reduce((sum, block) => sum + block.height, 0) / columnCount;
    const columns = [[]];
    let height = 0;
    for (const block of blocks) {
        if (height > 0 && height + block.height / 2 > target && columns.length < columnCount) {
            columns.push([]);
            height = 0;
        }
        columns.at(-1).push(block);
        height += block.height;
    }
    return columns;
}

function chooseLayout(context, blocks) {
    let best;
    for (let count = 1; count <= ImageLayout.maxColumns; count++) {
        const columns = distributeBlocks(blocks, count);
        const contentWidth = count * ImageLayout.columnWidth + (count - 1) * ImageLayout.columnGap;
        const legend = measureLegend(context, contentWidth);
        const headerHeight = 34 + 28 + 18 + legend.height + 16;
        const columnHeight = Math.max(...columns.map(column => column.reduce((sum, block) => sum + block.height, 0)));
        const width = ImageLayout.padding * 2 + contentWidth;
        const height = ImageLayout.padding * 2 + headerHeight + columnHeight;
        const score = Math.abs(height / width - ImageLayout.targetAspect);
        if (best === undefined || score < best.score) {
            best = { columns, legend, headerHeight, width, height, score };
        }
    }
    return best;
}

function drawHeader(context, legend) {
    const x = ImageLayout.padding;
    const y = ImageLayout.padding;
    context.textBaseline = 'alphabetic';
    context.fillStyle = ImageColors.text;
    context.font = `700 34px ${FontFamily}`;
    context.fillText(getExportTitle(), x, y + 30);
    context.fillStyle = ImageColors.muted;
    context.font = `16px ${FontFamily}`;
    context.fillText(getExportSubtitle(), x, y + 58);

    context.textBaseline = 'middle';
    context.font = `14px ${FontFamily}`;
    const legendY = y + 34 + 28 + 18 + 12;
    for (const item of legend.items) {
        const centerY = legendY + item.line * 24;
        drawCircle(context, x + item.x + 7, centerY, item.level);
        context.fillStyle = ImageColors.text;
        context.fillText(item.name, x + item.x + 20, centerY);
    }
}

function drawBlock(context, block, x, y) {
    const { category, fieldWidths } = block;
    const width = ImageLayout.columnWidth;

    context.textBaseline = 'middle';
    context.fillStyle = category.color;
    context.beginPath();
    context.roundRect(x, y, width, ImageLayout.titleHeight, 6);
    context.fill();
    context.fillStyle = '#ffffff';
    context.font = `600 15px ${FontFamily}`;
    context.fillText(category.name, x + 10, y + ImageLayout.titleHeight / 2);

    const circleCenters = [];
    let fieldX = x + 6;
    for (const fieldWidth of fieldWidths) {
        circleCenters.push(fieldX + fieldWidth / 2);
        fieldX += fieldWidth;
    }
    const nameX = fieldX + 6;

    if (category.fields.length > 1) {
        context.fillStyle = ImageColors.muted;
        context.font = `11px ${FontFamily}`;
        context.textAlign = 'center';
        category.fields.forEach((field, index) =>
            context.fillText(field, circleCenters[index], y + ImageLayout.titleHeight + ImageLayout.fieldHeaderHeight / 2));
        context.textAlign = 'left';
    }

    let rowY = y + block.headerHeight;
    category.kinks.forEach((kink, index) => {
        if (index % 2 === 1) {
            context.fillStyle = ImageColors.stripe;
            context.fillRect(x, rowY, width, ImageLayout.rowHeight);
        }
        const centerY = rowY + ImageLayout.rowHeight / 2;
        kink.levels.forEach((level, fieldIndex) => drawCircle(context, circleCenters[fieldIndex], centerY, level));
        context.fillStyle = ImageColors.text;
        context.font = `14px ${FontFamily}`;
        context.fillText(fitText(context, kink.name, x + width - nameX - 6), nameX, centerY);
        rowY += ImageLayout.rowHeight;
    });
}

function drawCircle(context, x, y, level) {
    context.beginPath();
    context.arc(x, y, ImageLayout.circleRadius, 0, Math.PI * 2);
    if (level > 0) {
        context.fillStyle = LevelColors[level - 1];
        context.fill();
    } else {
        context.strokeStyle = ImageColors.empty;
        context.lineWidth = 1.5;
        context.stroke();
    }
}

function fitText(context, text, maxWidth) {
    if (context.measureText(text).width <= maxWidth) {
        return text;
    }
    let fitted = text;
    while (fitted.length > 1 && context.measureText(`${fitted}…`).width > maxWidth) {
        fitted = fitted.slice(0, -1);
    }
    return `${fitted}…`;
}

function renderReport(onlyRated) {
    const header = createElement('header', 'report-header');
    const titles = createElement('div', 'report-titles');
    titles.append(createElement('h1', '', getExportTitle()), createElement('p', 'report-subtitle', getExportSubtitle()));
    const legend = createElement('div', 'report-legend');
    legend.append(...getStrings().levels.map(createLegendItem));
    header.append(titles, legend);

    const columns = createElement('div', 'report-columns');
    for (const category of getExportCategories(onlyRated)) {
        const section = createElement('section', 'report-category');
        section.style.setProperty('--cat', category.color);
        const table = createElement('table', '');
        if (category.fields.length > 1) {
            const headRow = table.createTHead().insertRow();
            for (const field of category.fields) {
                headRow.append(createElement('th', '', field));
            }
            headRow.append(createElement('th', ''));
        }
        const body = table.createTBody();
        for (const kink of category.kinks) {
            const row = body.insertRow();
            for (const level of kink.levels) {
                const cell = row.insertCell();
                cell.className = 'dot-cell';
                const dot = createElement('span', level > 0 ? 'dot' : 'dot empty');
                if (level > 0) {
                    dot.style.setProperty('--color', LevelColors[level - 1]);
                }
                cell.append(dot);
            }
            row.insertCell().textContent = kink.name;
        }
        section.append(createElement('h2', '', category.name), table);
        columns.append(section);
    }

    document.getElementById('report').replaceChildren(header, columns);
}
