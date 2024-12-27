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

async function run() {
    const arrays = [["Legacy Guild"], [new Date()], [
        "name",
        "level start",
        "level end",
        "level delta",
        "fortune start",
        "fortune end",
        "fortune delta",
        "invest start",
        "invest end",
        "invest delta",
        "bounties start",
        "bounties end",
        "bounties delta",
        "collection start",
        "collection end",
        "collection delta",
        "help start",
        "help end",
        "help delta",
        "prestige start",
        "prestige end",
        "prestige delta",
        "master start",
        "master end",
        "master delta"
    ]];

    const browser = await puppeteer.launch({headless: false}), page = await browser.newPage();
    await page.goto("https://union-titans.fr/en/guilds/5d1e51bb3a550a105911f49c");
    await page.waitForSelector("#members-list a");

    const hrefs = await page.evaluate(() =>
        [...document.querySelectorAll("#members-list a")].map(element => element.href)
    );

    for (const href of hrefs) {
        await page.goto(href);
        await page.waitForSelector("#fortune-chart-canvas");

        const
            name = await page.evaluate(() =>
                document.querySelector("h3.widget-user-username").textContent.trim()
            ),
            array = [name.replace(/[,\n]+/g, "")],
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

        for (const [key, value] of Object.entries(charts)) array.push(...getData(value));
        arrays.push(array);
    }

    const
        string = arrays.map(array => array.join(",")).join("\n"),
        uri = "data:text/csv;charset=utf-8," + encodeURIComponent(string);

    await page.evaluate(uri => window.open(uri, "data.csv"), uri);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await browser.close();
}

void run();