//functions: https://learn.microsoft.com/en-us/azure/bot-service/adaptive-expressions/adaptive-expressions-prebuilt-functions?view=azure-bot-service-4.0
const main = document.getElementById('maincontainer');
const appbar = document.getElementById('appBarContainer');
var fetchHistory = [];
let templateList;
class newData {
    constructor(id, data, template, card) {
        this.i = id,
            this.t = template,
            this.cc = card,
            this.data = data,
            this.onDataChanged = this.renderCard,
            mainData.maincontainer[this.i] = this
    }
    dh = [];
    set onDataChanged(callback) {
        this.dh.push(callback);
    };
    dataChanged() { console.log(`data changed on ${this.i}`); this.dh.forEach((x) => x.call(this)); }
    set data(newD) { this.d = newD; this.dataChanged(); }
    get data() { return this.d }
    async getTemplate() {
        console.log('templating')
        if (this.t == undefined) {
            if (templateList == undefined) templateList = await getByPath('/app/templatesList.json');
            const templatePath = this.d.templatePath || templateList[this.i] || '/templates/unknown.json'
            if (templatePath == '/templates/unknown.json') {
                //flat data
                let keys = Object.keys(this.d);
                let values = Object.values(this.d);
                let array = [];
                for (let i = 0; i < keys.length; i++) {
                    array.push({ "key": keys[i], "value": JSON.stringify(values[i]) });
                }
                this.d = { "fields": array };
            }
            let template = await getByPath(templatePath);
            this.t = new ACData.Template(template);
        }
    }
    async renderCard() {
        console.log('rendering');
        console.log(this);
        const populatedTempalte = this.t.expand({ $root: this.d });//this should be in render card
        var adaptiveCard = new AdaptiveCards.AdaptiveCard();
        adaptiveCard.hostConfig = new AdaptiveCards.HostConfig({
            fontFamily: "Segoe UI, Helvetica Neue, sans-serif"
        });
        adaptiveCard.onExecuteAction = navButtonClick;
        await adaptiveCard.parse(populatedTempalte);
        const card = adaptiveCard.render();
        card.id = this.i;
        return card;
    }
}

const mainData = {
    "maincontainer": {},
    "appBarContainer": [],
    Open: async function (paths, parent = "maincontainer", target, replace) {
        // if(target !=target = document.getElementById(target);
        // target = document.getElementById(target);
        parent = document.getElementById(parent);
        if(replace)parent.replaceChildren();//clears out the container
        paths.forEach(async function (i) {
            console.log(`opening path : ${i}`);
            let data = await getByPath(i);
            let card = new newData(i, data);
            await card.getTemplate();
            card = await card.renderCard();
            parent.appendChild(card);
        });
        fetchHistory.push(paths);
    },
    post: async function (path, body) {
        if (path.startsWith('/')) {
            mainData.maincontainer[path].data = Object.assign(mainData.maincontainer[path].data, body);
            window.localStorage.setItem(path, JSON.stringify(mainData.maincontainer[path].data))
            applySettings();
        }
        else {
            console.log('posting external')
        }
    }
};
async function getByPath(path) {
    let data = JSON.parse(await window.localStorage.getItem(path));
    if (data == undefined) {
        data = (await fetch(path)).json()
    }
    return await data;
}
function navButtonClick(action) {
    console.log(`action clicked ${action._propertyBag.title}`);

    switch (action._propertyBag.type) {
        case 'Action.Submit':
            mainData.post(action._parent._parent._renderedElement.id, action._processedData)
            //update UI.
            if (action._processedData.gotoPath) mainData.Open(action._processedData.gotoPath.split(','),'maincontainer',undefined,true);
            break;
        case 'Action.Execute':
            console.log('executing');
            switch(action._propertyBag.verb){
                case 'Back': {
                    console.log('backing up a level');
                    action._propertyBag.url = fetchHistory.pop();
                    action._propertyBag.url = fetchHistory.pop();
                    console.log(`navigating to ${action._propertyBag.url}`);
                    mainData.Open([action._propertyBag.url],'maincontainer',undefined,true);
                }
                break;
                case 'add':{
                    if(document.getElementById('/app/addCard.json')==undefined)mainData.Open(['/app/addCard.json'],undefined,false);
                }
                break;
                case 'replace':{
                    console.log('but why?')
                    mainData.Open([action._processedData.gotoPath],'maincontainer','/app/addCard.json',true);
                }
                break;
            }
            break;
        case 'Action.OpenUrl':
            console.log(`opening url ${action._propertyBag.url}`);
            //need to save history current page, as navigating away.
            mainData.Open([action._propertyBag.url],'maincontainer',undefined,true)
    }
}
function applySettings() {
    const settings = JSON.parse(window.localStorage.getItem('/me/profile.json'))
    if (settings['color']) {
        document.documentElement.style.setProperty('--themeColor', settings['color']);
        document.documentElement.style.setProperty('--themeBackgroundColor', settings['backgroundcolor']);
    }
    else {
        console.log('no color')
    }
}
applySettings();
mainData.Open(['/me/favorites.json'],'maincontainer',undefined,true);
mainData.Open(['/app/navigation.json'], "appBarContainer");
// let feed = fetch('https://feeds.npr.org/510318/podcast.xml');
// console.log(feed);
window.addEventListener("storage", (e) => { console.log('storage changed') });
//try get setting from localstorage
let settings = JSON.parse(window.localStorage.getItem('/app/settings.json')) || {
    "name": "my favorites",
    "favorites": [
        {
            "name": "settings cool",
            "path": "/app/settings.json"
        },
        {
            "name": "profile",
            "path": "/me/profile.json"
        },
        {
            "name": "favorites",
            "path": "/me/favorites.json"
        }
    ]
};

function saveSettings() {
    window.localStorage.setItem('/app/settings.json', JSON.stringify(settings));
}