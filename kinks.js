'use strict';

const DefaultKinksTexts = {
    en: `
#Intimacy
(General)
* Romance / Affection
* Hugging
* Kissing (body) ::: Planting kisses on various body parts. Hickies are listed under the pain category.
* Kissing (mouth)
* Spooning ::: Holding the partner close, often back to chest, and embracing them from behind.
* Using real names ::: Referring to the partner by their real name instead of pet names or nicknames.
* Sleepover ::: Staying with your partner overnight.

#Clothing
(Self, Partner)
* Clothed sex
* Lingerie
* Stockings
* Heels
* Leather
* Latex
* Uniform
* Cosplay
* Cross-dressing
* Formal clothing

#Groupings
(General)
* You and 1 male
* You and 1 female
* You and 1 male, 1 female
* You and 2 males
* You and 2 females
* Orgy

#General
(Giving, Receiving)
* Handjobs / fingering ::: Stimulating the partner's genitals mainly with hands.
* Blowjobs
* Deep throating
* Swallowing
* Facials ::: Ejaculating directly onto the partner's face.
* Cunnilingus
* Face-sitting
* Edging ::: Bringing the partner close to orgasm, letting them cool down, and repeating.
* Teasing
* Stripping / Disrobing
* Mutual masturbation
* Self-humiliation / self-harm

#Penetration
(Giving, Receiving)
* Penetration
* Strap-on penetration
* Barebacking
* Tantric / yoni massage
* Fingering
* Object insertion
* Fisting

#Special Positions
(Giving, Receiving)
* Free-hanging / love swings
* Up against walls
* 69
* Rope / chain suspension
* Unseen actor
* Stealth penetration

#Butt Stuff
(Giving, Receiving)
* Anal teasing / threats
* Anal toys / plugging
* Anal sex, pegging
* Rimming
* Double penetration
* Anal fisting

#Restrictive
(Self, Partner)
* Gag ::: A rubber or plastic object placed in the mouth, making the wearer unable to speak.
* Collar
* Leash ::: A rope or chain between the wearer's collar and the partner's hand.
* Rope bondage
* Mitts ::: Mittens, usually holding the hand in a fist, so the wearer can't grab anything with their fingers. Includes paws.
* Cuffs ::: Worn on wrists and ankles. Barely restrictive on their own, but with hooks and rope they make it easy to restrain the wearer on the spot.
* Wall / cross mounting
* Stockades ::: A freestanding rig that restrains the head, and often the arms or legs too.
* Chastity gear
* Encasement ::: Cage, full rope harness, duct tape — movement restricted to the absolute minimum.
* Blindfolds
* Sensory deprivation ::: Fully covering eyes and ears, often with noise cancelling to emphasize isolation.

#Toys
(On self, On partner)
* Dildos
* Plugs
* Vibrators ::: Phallic toys with internal vibration.
* Magic wands ::: Like a vibrator, but stronger and over a larger area.
* Sybians
* Sex machines

#Domination
(As Dom, As Sub)
* Dominant / Submissive
* Domestic servitude
* Slavery
* DD/lg, MD/lb
* Discipline
* Begging
* Forced orgasm
* Orgasm control
* Orgasm denial

#Scenarios
(Being center, Participating)
* Glory hole ::: Partners separated by a wall, connected only through a hole in it.
* Humiliation
* Exhibitionism
* Voyeurism
* Medical play
* Pet play (soft)
* Pet play (hard)
* Human furniture
* Auction / appraisal
* Slave training
* Interrogation
* Gangbang
* Kidnapping
* Sleep play
* Hypnotism
* Free use ::: The partner is available at any moment and "doesn't notice" what is happening.
* Fake public use
* Practical sex ed

#Taboo Scenarios
(Participating, Observing)
* Roleplay incest ::: Fantasy of relations between relatives.
* Ageplay ::: Roleplaying as much younger or older than your actual age.
* Non-con / rape play
* Roleplay necrophilia ::: Simulating a motionless "dead" partner.
* War symbolism
* Cheating
* Real public use

#Surrealism
(Self, Observing)
* Futanari ::: Female characters with male genitalia.
* Furry
* Transformation ::: A character turns into someone else. Includes body swapping.
* Tentacles
* Monsters / beasts
* Aliens

#Fluids
(General)
* Blood
* Watersports
* Scat
* Cum play

#Touch & Stimulation
(Giving, Receiving)
* Genital worship
* Ass worship
* Foot play
* Tickling
* Sensation play
* Electro stimulation
* Breath play ::: Games involving restricted breathing.

#Pain
(Giving, Receiving)
* Light pain
* Heavy pain
* Hickies
* Nipple clamps
* Clothespins / zip strips
* Body slapping
* Face slapping
* Spanking
* Caning
* Flogging
* Beatings
* Whips
* Paddles
* Genital slapping
* Genital torture
* Breast torture
* Hot wax
* Scratching
* Biting
* Burning
* Cutting
* Sounding ::: Inserting objects into the urethra.
* Bruising (short-lasting)
* Markings (long-lasting)
`.trim(),
    ru: `
#Близость
(Общее)
* Романтика / нежность
* Объятия
* Поцелуи (тело) ::: Поцелуи в разные части тела. Засосы — в категории «Боль».
* Поцелуи (в губы)
* Ложечка ::: Обнимать партнёра сзади, прижавшись грудью к спине.
* Обращение по имени ::: Называть партнёра настоящим именем, а не прозвищами или ласковыми словами.
* Ночёвка вместе ::: Остаться у партнёра на ночь.

#Одежда
(Я, Партнёр)
* Секс в одежде
* Бельё
* Чулки
* Каблуки
* Кожа
* Латекс
* Униформа
* Косплей
* Кроссдрессинг
* Деловая / вечерняя одежда

#Составы
(Общее)
* Ты и 1 мужчина
* Ты и 1 женщина
* Ты, мужчина и женщина
* Ты и 2 мужчины
* Ты и 2 женщины
* Оргия

#Основное
(Делаю, Получаю)
* Ласки руками ::: Стимуляция гениталий партнёра в основном руками.
* Минет
* Глубокий минет
* Проглатывание
* Камшот на лицо ::: Семяизвержение прямо на лицо партнёра.
* Куннилингус
* Фейсситтинг
* Эджинг ::: Довести партнёра почти до оргазма, дать остыть и повторить.
* Дразнение
* Раздевание / стриптиз
* Взаимная мастурбация
* Самоунижение / самоповреждение

#Проникновение
(Делаю, Получаю)
* Проникновение
* Страпон
* Без презерватива
* Тантрический / йони-массаж
* Фингеринг
* Введение предметов
* Фистинг

#Особые позы
(Делаю, Получаю)
* Качели / подвес
* У стены
* 69
* Подвес на верёвках / цепях
* Невидимый партнёр
* Незаметное проникновение

#Анал
(Делаю, Получаю)
* Анальное дразнение / угрозы
* Анальные игрушки / пробки
* Анальный секс, пеггинг
* Римминг
* Двойное проникновение
* Анальный фистинг

#Ограничения
(Я, Партнёр)
* Кляп ::: Резиновый или пластиковый предмет во рту, не дающий говорить.
* Ошейник
* Поводок ::: Верёвка или цепь от ошейника к руке ведущего.
* Верёвочный бондаж
* Варежки ::: Рукавицы, обычно со сжатым кулаком, — нельзя ничего взять пальцами. Сюда же лапки.
* Манжеты ::: Манжеты на запястьях и лодыжках. Сами почти не сковывают, но с крючками и верёвкой позволяют быстро зафиксировать партнёра.
* Фиксация к стене / кресту
* Колодки ::: Стойка, фиксирующая голову, а часто и руки или ноги.
* Пояс верности
* Полная обездвиженность ::: Клетка, полная обвязка, скотч — движения ограничены до минимума.
* Повязка на глаза
* Сенсорная депривация ::: Полностью закрыты глаза и уши, часто с шумоподавлением для ощущения изоляции.

#Игрушки
(На себе, На партнёре)
* Дилдо
* Пробки
* Вибраторы ::: Вибрирующие игрушки фаллической формы.
* Вибромассажёры ::: Как вибратор, но сильнее и на большую площадь.
* Сибиан
* Секс-машины

#Доминирование
(Как дом, Как саб)
* Доминирование / подчинение
* Домашнее служение
* Рабство
* DD/lg, MD/lb
* Дисциплина
* Мольбы
* Принудительный оргазм
* Контроль оргазма
* Запрет оргазма

#Сценарии
(В центре, Участвую)
* Глори-хол ::: Партнёры разделены стеной, единственная связь — отверстие в ней.
* Унижение
* Эксгибиционизм
* Вуайеризм
* Медицинские игры
* Пет-плей (мягкий)
* Пет-плей (жёсткий)
* Человек-мебель
* Аукцион / оценка
* Дрессировка
* Допрос
* Гэнгбэнг
* Похищение
* Секс во сне
* Гипноз
* Фриюз ::: Партнёр доступен в любой момент и «не замечает» происходящего.
* Имитация публичного секса
* Практическое секс-просвещение

#Табу-сценарии
(Участвую, Наблюдаю)
* Ролевой инцест ::: Фантазия об отношениях между родственниками.
* Эйджплей ::: Ролевая игра, где изображаешь возраст намного младше или старше своего.
* Нон-кон / ролевое принуждение
* Ролевая некрофилия ::: Имитация неподвижного «мёртвого» партнёра.
* Военная символика
* Измена
* Настоящий публичный секс

#Фантастика
(Я, Наблюдаю)
* Футанари ::: Женские персонажи с мужскими гениталиями.
* Фурри
* Трансформация ::: Персонаж превращается в кого-то другого. Включая обмен телами.
* Тентакли
* Монстры / звери
* Пришельцы

#Жидкости
(Общее)
* Кровь
* Золотой дождь
* Скат
* Игры со спермой

#Прикосновения
(Делаю, Получаю)
* Поклонение гениталиям
* Поклонение попе
* Фут-фетиш
* Щекотка
* Игры с ощущениями
* Электростимуляция
* Брисплей ::: Игры с ограничением дыхания.

#Боль
(Делаю, Получаю)
* Лёгкая боль
* Сильная боль
* Засосы
* Зажимы на соски
* Прищепки / стяжки
* Шлепки по телу
* Пощёчины
* Спанкинг
* Трость
* Флоггер
* Избиение
* Кнуты
* Паддлы
* Шлепки по гениталиям
* Пытки гениталий
* Пытки груди
* Горячий воск
* Царапины
* Укусы
* Ожоги
* Порезы
* Саундинг ::: Введение предметов в уретру.
* Синяки (ненадолго)
* Следы (надолго)
`.trim()
};
