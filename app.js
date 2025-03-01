//functions: https://learn.microsoft.com/en-us/azure/bot-service/adaptive-expressions/adaptive-expressions-prebuilt-functions?view=azure-bot-service-4.0
const main = document.getElementById('maincontainer');
const appbar = document.getElementById('appBarContainer');
const locationPathName = window.location.hostname.includes('github.io') ? window.location.href : '';
var fetchHistory = [];
let templateList;
class newData {
    constructor(id) {
        this.i = id,
            mainData.maincontainer[this.i] = this
    }
    dh = [this.render];
    set onDataChanged(callback) {
        this.dh.push(callback);
    };
    dataChanged() { console.log(`data changed on ${this.i}`); this.dh.forEach(async (x) => await x.call(this)); }//this isn't going to work if render needs to be awaited.
    set data(newD) { this.d = newD; this.dataChanged(); }
    get data() { return this.d }
    async getTemplate() {
        console.log('templating')
        if (this.t == undefined) {
            if (templateList == undefined) templateList = await getByPath('/app/templatesList.json');//this should just move to app initialization
            const templatePath = templateList[this.i] || '/templates/unknown.json'//this.d.templatePath || 
            if (templatePath == '/templates/unknown.json') {//if no template then flatten data for basic rendering.
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
    async render() {
        console.log('rendering');
        console.log(this);
        await this.getTemplate();
        const populatedTempalte = this.t.expand({ $root: this.d });
        var adaptiveCard = new AdaptiveCards.AdaptiveCard();
        adaptiveCard.hostConfig = new AdaptiveCards.HostConfig({
            fontFamily: "Segoe UI, Helvetica Neue, sans-serif"
        });
        adaptiveCard.onExecuteAction = navButtonClick;
        await adaptiveCard.parse(populatedTempalte);
        const card = adaptiveCard.render();
        card.id = this.i;
        let node = document.getElementById(this.i);
        node.replaceWith(card);
        return card;//don't need to save the rendered card so just return it for most flexibility.
    }
    async initialize() {
        //if path is blank, then id is blank. if id is blank, then rendered card id is blank. 
        //random guid instead?
        if (this.i == undefined) this.data = {}
        this.i = this.i.startsWith('/') ? locationPathName + this.i : this.i;
        let data = JSON.parse(await window.localStorage.getItem(this.i));
        if (data == undefined) {
            try {
                data = (await fetch(this.i))
                if (!data.ok) {
                    throw new Error(`Response status: ${data.status}`);
                }
                data = await data.json();
            }
            catch (err) {
                alert('oops');
            }
        }
        //handle if data is not json.
        if (data.type == 'AdaptiveCard') {//if given path returned a card instead of data, blank this data and assign to template.
            this.t = new ACData.Template(data);
            data = undefined//make blank. probably not needed as it will just be undefined....
        }
        this.data = data;//this will kick off rendering.
    }
}

const mainData = {
    "maincontainer": {},
    "appBarContainer": [],
    Open: async function (paths, clearFirst = true, targetId) {
        // need to only do most of this if data was actually received and can be processed. should also be able to take a blank data object.
        const target = targetId == undefined ? main : document.getElementById(targetId);
        if (clearFirst) target.replaceChildren();//clears out the container
        paths.forEach(async function (i) {
            i = i.trim();//remove spaces from path.
            let d = new newData(i);
            //create a loading placeholder element. This gets replaced with the rendered card.
            const loadingElement = (document.createElement('div'))
            loadingElement.innerText = 'Loading...';
            target.appendChild(loadingElement);//add loading element as placeholder
            loadingElement.id = i;
            await d.initialize();
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
    path = path.startsWith('/') ? locationPathName + path : path;
    let data = JSON.parse(await window.localStorage.getItem(path));
    if (data == undefined) {
        try {
            data = (await fetch(path))
            if (!data.ok) {
                throw new Error(`Response status: ${data.status}`);
            }
            data = await data.json();
        }
        catch (err) {
            alert('oops');
        }
    }
    //handle if data is not json.
    return await data;
}
function navButtonClick(action) {
    console.log(`action clicked ${action._propertyBag.title}`);

    switch (action._propertyBag.type) {
        case 'Action.Submit':
            //update UI.
            if (action._processedData.gotoPath) mainData.Open(action._processedData.gotoPath.split(','));
            else mainData.post(action._parent._parent._renderedElement.id, action._processedData)
            break;
        case 'Action.Execute':
            console.log('executing');
            switch (action._propertyBag.verb) {
                case 'Back': {
                    console.log('backing up a level');
                    action._propertyBag.url = fetchHistory.pop();
                    action._propertyBag.url = fetchHistory.pop();
                    console.log(`navigating to ${action._propertyBag.url}`);
                    mainData.Open([action._propertyBag.url[0]], 'maincontainer', undefined, true);
                }
                    break;
                case 'add': {
                    if (document.getElementById('/app/addCard.json') == undefined) mainData.Open(['/app/addCard.json'], false);
                }
                    break;
                case 'replace': {
                    mainData.Open([action._processedData.gotoPath], true, '/app/addCard.json');
                }
                    break;
            }
            break;
        case 'Action.OpenUrl':
            console.log(`opening url ${action._propertyBag.url}`);
            //need to save history current page, as navigating away.
            mainData.Open([action._propertyBag.url], 'maincontainer', undefined, true)
    }
}
function applySettings() {
    const settings = JSON.parse(window.localStorage.getItem('/me/profile.json'))
    try {
        document.documentElement.style.setProperty('--themeColor', settings['color']);
        document.documentElement.style.setProperty('--themeBackgroundColor', settings['backgroundcolor']);
    }
    catch {
        console.log('no color')
    }
}
applySettings();
mainData.Open(['/me/profile.json','/me/favorites.json'],true,'maincontainer');
mainData.Open(['/templates/navigation.json'],true,'appBarContainer');
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