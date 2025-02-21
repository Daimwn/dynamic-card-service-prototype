//functions: https://learn.microsoft.com/en-us/azure/bot-service/adaptive-expressions/adaptive-expressions-prebuilt-functions?view=azure-bot-service-4.0
const main = document.getElementById('maincontainer');
const appbar = document.getElementById('appBarContainer');
var fetchHistory = [];
class newData {
    constructor(id, data, target) {
        this.id = id,
            this.data = data,
            this.target = target
    }
    // constructor(id, data, template, card, target) {
    //     this.id = id,
    //     this.data = data,
    //     this.template = template,
    //     this.card = card,
    //     this.target = target
    // }
    dh = [];
    set onDataChanged(callback) {
        this.dh.push(callback);
    };
    ch = [];
    set onCardChanged(callback) {
        this.ch.push(callback);
    };
    dataChanged = function () { this.dh.forEach(x => x(this.data)); }
    cardChanged = function () { this.ch.forEach(x => x(this.card)); }
    set da(d) { this.data = d; this.dataChanged(); }
    set ca(c) { this.card = c; this.cardChanged(); }
}

const mainData = {
    "maincontainer": [],
    "appBarContainer": [],
    addToMain: function (id, data, template, card) {
        let temp = new newData(id, data, main);
        this.maincontainer.push(new newData(id, data, template, card));
    },
    Open: async function (paths) {
        const replace = paths.length==1;
        paths.forEach(i => async function(i){
            const data = await getByPath(path);
            let template1 = await getByPath(data.templatePath);

        });
    }
};
mainData.addToMain(69, { "test": "hello" }, {}, {});

async function navigateTo(path, target, replace = false) {
    const data = await getByPath(path);
    console.log(data);
    const template = await getTemplate(data);
    //need error handling if no template prop
    template.id = data.templatePath;
    renderCardTo(template, target, replace);
}
async function getTemplate(data) {
    let template1 = await getByPath(data.templatePath);
    template = new ACData.Template(template1);
    template = template.expand({ $root: data });
    return template;
}

async function renderCardTo(card, target, replace) {
    var adaptiveCard = new AdaptiveCards.AdaptiveCard();
    adaptiveCard.hostConfig = new AdaptiveCards.HostConfig({
        fontFamily: "Segoe UI, Helvetica Neue, sans-serif"
    });
    adaptiveCard.onExecuteAction = navButtonClick;
    await adaptiveCard.parse(card);
    let renderedCard = adaptiveCard.render();
    renderedCard.id = card.id;
    replace ? target.replaceChildren(renderedCard) : target.appendChild(renderedCard);
}
async function getByPath(path) {
    const data = await fetch(path);
    return await data.json();
}
function navButtonClick(action) {
    console.log(`action clicked ${action._propertyBag.title}`);

    switch (action._propertyBag.type) {
        case 'Action.Submit':
            console.log('submitting');
            // let gotoPath = document.getElementById('gotopath').value;
            console.log(action);
            navigateTo(action._processedData.gotoPath, main);
            break;
        case 'Action.Execute':
            console.log('executing');
            if (action._propertyBag.title == 'Back') {
                console.log('backing up a level');
                action._propertyBag.url = fetchHistory.pop();
                // action._propertyBag.url = fetchHistory.pop();
                console.log(`navigating to ${action._propertyBag.url}`);
                navigateTo(action._propertyBag.url, main);
            }
            break;
        case 'Action.OpenUrl':
            console.log(`opening url ${action._propertyBag.url}`);
            fetchHistory.push(action._propertyBag.url);
            //need to save history current page, as navigating away.
            navigateTo(action._propertyBag.url, main)
    }
}

// function getObjectKeys(obj) {
//     return Object.getOwnPropertyNames(obj);
// }

navigateTo('/app/settings.json', main);
navigateTo('/app/navigation.json', appbar, true);

// let feed = fetch('https://feeds.npr.org/510318/podcast.xml');
// console.log(feed);