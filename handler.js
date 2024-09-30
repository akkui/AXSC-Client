const services = require('./services');
const commands = require('./commands')

const package = require('./package.json');
const fetch = require('node-fetch');
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
global.CACHE.readline = rl;

function parseCommand(Input) {
    let parseInput = (Input.substring(1, Input.length)).split(' ');

    const head = parseInput[0];
    parseInput.shift();

    const body = parseInput;
    return { head: head, body: body };
}

exports.startUI = (Callback) => {
    if (global.CACHE.temp_doNotResetUI) {
        global.CACHE.temp_doNotResetUI = false;
    } else {
        services.set_align(true);
        services.sendWelcome(true);
        console.log("")
        commands.showCommands();
        console.log("")
    };

    if (Callback) services.logCommand(Callback);

    const QuestionText = services.resetUserInput();
    rl.question(QuestionText, async (Input) => {
        if (Input.startsWith('/')) {
            const { head, body } = parseCommand(Input);
            const callback = await commands.execute(head, body);
            this.startUI(callback);
        } else {
            const callback = commands.sendMessage(Input);
            this.startUI(callback);
        };
    });
}

async function load() {
    const response = await fetch("https://raw.githubusercontent.com/AxonDevelopmentLab/AppsDetails/main/axsc.json");
    const data = await response.json();
    const version = data['client-version'];
    if (version === package.version) {
        require('./handler').startUI();
    } else {
        services.readlineTimer(30, ' \x1b[31m[!] Você está executando uma versão ultrapassada do AXSC.\n Isso não irá impedir de você rodar o AXSC, porém, tenha em mente que uma versão desatualizada\n pode não conter atualizações de seguranças importantes, logo, riscos de vazamento de dados sensíveis são altos.\n\n O APP irá ser executado em [TIME] segundos.\n Instale a nova versão em "https://axonlab.glitch.me/services/axsc".\n', () => require('./handler').startUI())
    }
};

load();