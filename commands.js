const services = require('./services');
const websocket = require('./websocket');

let commands = {
    descriptions: {
        "menu": [
            "\x1b[31m/exit | \x1b[97mEncerra o AXSC.",
            "\x1b[31m/settings | \x1b[97mVeja as configurações.",
            "\x1b[31m/connect [ID] [KEY] | \x1b[97mConecte-se a uma sala.",
            "\x1b[31m/disconnect | \x1b[97mDesconecte-se de uma sala.",
            "\x1b[31m/menu | \x1b[97mVoltar para o menu inicial."
        ],
        "settings": [
            '\x1b[31m[AVISO] \x1b[97mO intermediário \x1b[91m"axsc.glitch.me"\x1b[97m é oficial da AXSC.',
            'Alterar-lo trás risco iminente a sua segurança e criptografia.',
            "",
            "LISTA DE COMANDOS",
            "\x1b[31m/settings new-int-ip [NEW IP] | \x1b[97mMuda o IP do intermediário.",
            "\x1b[31m/settings reset | \x1b[97mReseta as configurações",
            "\x1b[31m/menu | \x1b[97mVolta ao menu inicial",
            ""
        ]
    },
    exe: {
        "settings": (args) => {
            if (global.CACHE.inRoom !== false) {
                global.CACHE.temp_doNotResetUI = true;
                return websocket.axscMessage(['\x1b[31m[!] \x1b[97mEsse comando só pode ser utilizado no menu inicial.'])
            };

            if (args.length > 0) {
                if (!args[0]) return '\x1b[31m[!] \x1b[97mVocê não especificou nenhum subcomando.';
                if (args[0] === "new-int-ip") {
                    if (!args[1]) return '\x1b[31m[!] \x1b[97mVocê não especificou o novo valor.'
                    global.CACHE.intermediary = args[1];
                    return '\x1b[92m[!] \x1b[97mO intermediário foi alterado com sucesso!'
                };

                if (args[0] === "reset") {
                    global.CACHE.intermediary = "axsc.glitch.me";
                    return '\x1b[92m[!] \x1b[97mAs configurações foram resetadas com sucesso!'
                };
            } else {
                global.CACHE.temp_doNotResetUI = true;
                services.sendWelcome();
                services.logCommand("\x1b[97mCONFIGURAÇÕES");
                services.logCommand(`\x1b[97mINTERMEDIARY: \x1b[91m${global.CACHE.intermediary}`);
                console.log("");
                this.showCommands("settings");
            }
        },
        "menu": () => {
            if (global.CACHE.inRoom !== false) {
                global.CACHE.temp_doNotResetUI = true;
                return websocket.axscMessage(['\x1b[31m[!] \x1b[97mUtilize \x1b[91m"/disconnect"\x1b[97m.'])
            };

            return;
        },
        "exit": () => {
            console.clear();
            process.kill(process.pid, 'SIGKILL');
        },
        "connect": async (args) => {
            if (global.CACHE.inRoom !== false) {
                global.CACHE.temp_doNotResetUI = true;
                return websocket.axscMessage(['\x1b[31m[!] \x1b[97mVocê já está conectado em uma sala.', '\x1b[97mPara trocar de sala, primeiramente desconecte-se dessa utilizando \x1b[91m"/disconnect"\x1b[97m.'])
            };

            if (!args[0]) return '\x1b[31m[!] \x1b[97mVocê necessita especificar o \x1b[91mID\x1b[97m da Sala.';
            if (!args[1]) return '\x1b[31m[!] \x1b[97mVocê necessita especificar a \x1b[91mKEY\x1b[97m da Sala.';
            return await websocket.connect(args[0], args[1]);
        },
        "disconnect": () => {
            if (global.CACHE.inRoom === false) return '\x1b[31m[!] \x1b[97mVocê não está conectado em nenhuma sala.'
            websocket.roomDisconnect(true);
        },
        "help": () => {
            if (global.CACHE.inRoom === false) return '\x1b[31m[!] \x1b[97mEsse comando só pode ser utilizado de dentro de uma sala.';
            global.CACHE.temp_doNotResetUI = true;
            return websocket.axscMessage(commands.descriptions.menu);
        }
    }
}

exports.showCommands = (SubCommand) => {
    const CmdDesc = commands.descriptions;
    if (Object.keys(CmdDesc).includes(SubCommand)) {
        CmdDesc[`${SubCommand}`].forEach(Item => services.logCommand(Item));
    } else {
        services.logCommand("Veja a lista de comandos:")
        CmdDesc["menu"].forEach(Item => services.logCommand(Item));
    }
};

exports.execute = async (Head, Body) => {
    const CmdExe = commands.exe;
    const getCurrentCommands = Object.keys(CmdExe);
    if (!getCurrentCommands.includes(Head)) {
        if (global.CACHE.inRoom === false) return '\x1b[31m[!] \x1b[97mEsse comando não existe.';
        global.CACHE.temp_doNotResetUI = true;
        return websocket.axscMessage(['\x1b[31m[!] \x1b[97mEsse comando não existe.']);
    };
    
    return await commands.exe[Head](Body);
}

exports.sendMessage = (Content) => {
    if (global.CACHE.inRoom === false) return '\x1b[31m[!] \x1b[97mVocê não está conectado em nenhuma sala.'
    global.CACHE.temp_doNotResetUI = true;

    if ((Content.replaceAll(" ", "")).length > 0) {
        const cryptographyMessage = services.encrypt(Content);
        global.CACHE.ws.send(JSON.stringify({ service: 'message', message: { channel: global.CACHE.inRoom, content: cryptographyMessage } }));
    };
}