import puppeteer from "puppeteer";
import dayjs from "dayjs";

function getStart(data) {
    const object = data.filter(point =>
        dayjs(point.x).isBefore(dayjs().subtract(1, "month"))
    )[0] ?? {x: undefined, y: 0};

    return object.y;
}

function getEnd(data) {
    const object = data[0] ?? {x: undefined, y: 0};
    return object.y;
}

function getData(data) {
    const start = getStart(data), end = getEnd(data), delta = end - start;
    return [start.toFixed(2), end.toFixed(2), delta.toFixed(2)];
}

function getMax(deltas, key, label) {
    const array = deltas.filter(object => object.key === key);
    array.sort((object, other) => Number.parseFloat(object.delta) - Number.parseFloat(other.delta));
    const max = array[array.length - 1];
    return [label, max.name, max.delta];
}

async function run() {
    const arrays = [["Legacy Guild", new Date().toISOString().slice(0, 10)], [], [
        "Name",
        "Level Start",
        "Level End",
        "Level Delta",
        "Fortune Start",
        "Fortune End",
        "Fortune Delta",
        "Investments Start",
        "Investments End",
        "Investments Delta",
        "Bounties Start",
        "Bounties End",
        "Bounties Delta",
        "Collection Start",
        "Collection End",
        "Collection Delta",
        "Guild Helpers Start",
        "Guild Helpers End",
        "Guild Helpers Delta",
        "Prestige Start",
        "Prestige End",
        "Prestige Delta",
        "Mastered Plans Start",
        "Mastered Plans End",
        "Mastered Plans Delta"
    ]];

    const browser = await puppeteer.launch({headless: false}), page = await browser.newPage();
    await page.goto("https://union-titans.fr/en/guilds/5d1e51bb3a550a105911f49c");
    await page.waitForSelector("#members-list a");

    const
        hrefs = await page.evaluate(() =>
            [...document.querySelectorAll("#members-list a")].map(element => element.href)
        ),
        deltas = [];

    for (const href of hrefs) {
        await page.goto(href);
        await page.waitForSelector("#fortune-chart-canvas");

        const
            name = (await page.evaluate(() =>
                document.querySelector("h3.widget-user-username").textContent.trim()
            )).split("#")[0].replace(/[,\n]+/g, ""),
            array = [name],
            charts = JSON.parse(await page.evaluate(() => JSON.stringify({
                level: levelChart.data.datasets[0].data,
                fortune: fortuneChart.data.datasets[0].data.reverse(),
                invest: investChart.data.datasets[0].data.reverse(),
                primes: primesChart.data.datasets[0].data.reverse(),
                collection: collectionChart.data.datasets[0].data.reverse(),
                help: helpChart.data.datasets[0].data.reverse(),
                prestige: prestigeChart.data.datasets[0].data.reverse(),
                master: masterChart.data.datasets[0].data.reverse()
            })));

        for (const [key, value] of Object.entries(charts)) {
            const [start, end, delta] = getData(value);
            array.push(start, end, delta);
            deltas.push({name, key, delta});
        }

        arrays.push(array);
    }

    arrays.push(
        [],
        getMax(deltas, "level", "Max Level Delta"),
        getMax(deltas, "fortune", "Max Fortune Delta"),
        getMax(deltas, "invest", "Max Investments Delta"),
        getMax(deltas, "primes", "Max Bounties Delta"),
        getMax(deltas, "collection", "Max Collection Delta"),
        getMax(deltas, "help", "Max Guild Helpers Delta"),
        getMax(deltas, "prestige", "Max Prestige Delta"),
        getMax(deltas, "master", "Max Mastered Plans Delta")
    );

    const
        string = arrays.map(array => array.join(",")).join("\n"),
        uri = "data:text/csv;charset=utf-8," + encodeURIComponent(string);

    await page.evaluate(uri => window.open(uri, "data.csv"), uri);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await browser.close();
}

void run();