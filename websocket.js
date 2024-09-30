const WebSocket = require('ws');
const crypto = require('crypto');
const services = require('./services');
const commands = require('./commands');

global.CACHE = {
    ws: {},
    inRoom: false,
    roomOpen: false,
    nickname: undefined,
    personal_color: undefined,
    temp_doNotResetUI: false,
    intermediary: "axsc.glitch.me",
    readline: undefined,
    key: undefined,
    iv: undefined
}

exports.connect = (ID, KEY) => {
    return new Promise((res, rej) => {
        global.CACHE.readline.pause();
        global.CACHE.temp_doNotResetUI = true;
        services.set_align(false);
        services.sendWelcome();

        services.logCommand('\x1b[92m[!] \x1b[97mGerando o hash da sala...');
        global.CACHE.key = crypto.pbkdf2Sync(KEY, '', 100000, 32, 'sha256').toString('hex');
        const keyHash = crypto.createHash('sha256').update(KEY).digest('hex')
        services.logCommand(' \x1b[32m└── \x1b[97mHash gerado com sucesso!')

        services.logCommand('\x1b[92m[!] \x1b[97mAtualizando o status local...');
        global.CACHE.inRoom = ID;
        services.logCommand(' \x1b[32m└── \x1b[97mStatus atualizado com sucesso!')

        services.logCommand('\x1b[92m[!] \x1b[97mInicializando a conexão com o intermediário...\n \x1b[92m├── \x1b[97mIsto pode demorar alguns segundos!');
        global.CACHE.ws = new WebSocket(`wss://${global.CACHE.intermediary}/`, { headers: { "user-agent": "Mozilla/5.0 (Linux x86_64) Gecko/20100101 Firefox/63.8" } });
        const WS = global.CACHE.ws;

        WS.onerror = () => { return res(errorOcurred()); };
        WS.onclose = () => { return res(errorOcurred()); };
        WS.onopen = () => {
            services.logCommand(' \x1b[32m└── \x1b[97mConexão com o intermediário estabelecida!');
            services.logCommand('\x1b[92m[!] \x1b[97mRealizando conexão com a sala via intermediário...');

            WS.send(JSON.stringify({
                service: 'join',
                join: {
                    id: ID,
                    hash: keyHash
                }
            }));

            services.logCommand(' \x1b[92m├── \x1b[97mSolicitação de conexão enviada para o intermediário.')
        };

        WS.onmessage = (DataContent) => {
            try {
                const Data = JSON.parse(DataContent.data);

                if (Data.status) {
                    if (Data.status === 400) return res(errorOcurred());

                    if (Data.status === "badCredentials") {
                        global.CACHE.inRoom = false;
                        global.CACHE.roomOpen = false;
                        res(' \x1b[31m└── [X] Credenciais de sala incorretas, não foi possível conectar-se.\n\n\x1b[97mUtilize \x1b[91m"/menu" \x1b[97mpara voltar ao menu inicial.\n')
                    };

                    if (Data.status === "connected") {
                        global.CACHE.nickname = Data.nickname;
                        global.CACHE.personal_color = Data.color;
                        global.CACHE.iv = Data.sec_iv;

                        services.logCommand(" \x1b[32m└── \x1b[97mConexão estabelecida com sucesso!")
                        console.log("");
                        services.logCommand(` \x1b[31m[AXSC] BEM-VINDO(A).`);
                        services.logCommand(` \x1b[31m├── \x1b[97mVocê está conectado na sala \x1b[91m"${global.CACHE.inRoom}"\x1b[97m.`);
                        services.logCommand(` \x1b[31m├── \x1b[97mSeu nickname nesta sessão é \x1b[91m"${Data.nickname}"\x1b[97m.`);
                        services.logCommand(` \x1b[31m├── \x1b[97mA partir de agora você está em uma terra sem lei, você é responsável pela sua própria segurança.`)
                        services.logCommand(` \x1b[31m├── \x1b[97mNão se identifique, não compartilhe seus dados, não confie em ninguém.`)
                        services.logCommand(` \x1b[31m└── \x1b[97mEm caso de dúvidas sobre os comandos, utilize \x1b[91m"/help"\x1b[97m.`);
                        console.log("");
                        res();
                        global.CACHE.roomOpen = true;
                        global.CACHE.readline.resume();
                    }

                    if (Data.status === "log") services.logCommand(Data.message)
                }

                if (Data.message) {
                    if (global.CACHE.roomOpen === true) {
                        const uncryptMessage = services.decrypt(Data.message.content);
                        if ((uncryptMessage.replaceAll(" ", "")).length > 0) {
                            const userInputLength = global.CACHE.readline.line.length;
                            global.CACHE.readline.setPrompt(``)
                            global.CACHE.readline.prompt();
                            services.logCommand(`${Data.message.color}${Data.message.sender}: \x1b[97m${uncryptMessage}`);
                            global.CACHE.readline.setPrompt(`${global.CACHE.personal_color}${global.CACHE.nickname}: \x1b[97m`)
                            global.CACHE.readline.prompt();
                            const promptLength = global.CACHE.readline.getPrompt().length - 10;
                            
                            require('readline').cursorTo(process.stdout, promptLength + userInputLength);
                        }
                    }
                }
            } catch (error) {
                return res(errorOcurred());
            }
        }
    })
}

exports.roomDisconnect = (forceLeave = false, sendMessage = false) => {
    if (global.CACHE.roomOpen) global.CACHE.ws.close();

    global.CACHE.readline.setPrompt(``)
    global.CACHE.readline.prompt();

    if (sendMessage !== false && global.CACHE.inRoom !== false) services.logCommand(sendMessage);

    global.CACHE.roomOpen = false;
    global.CACHE.inRoom = false;
    global.CACHE.ws = {};
    global.CACHE.nickname = undefined;
    global.CACHE.personal_color = undefined;

    if (forceLeave) {
        services.set_align(true);
        services.sendWelcome(true);
        console.log("")
        commands.showCommands();
        console.log("")
    }

    const QuestionText = services.resetUserInput();
    global.CACHE.readline.setPrompt(QuestionText)
    global.CACHE.readline.prompt();
}

exports.axscMessage = (Messages) => {
    if (global.CACHE.roomOpen === true) {
        global.CACHE.readline.setPrompt(``)
        global.CACHE.readline.prompt();

        Messages.forEach(Message => services.logCommand(Message));

        global.CACHE.readline.setPrompt(`${global.CACHE.personal_color}${global.CACHE.nickname}: \x1b[97m`)
        global.CACHE.readline.prompt();

        const promptLength = global.CACHE.readline.getPrompt().length - 10;
        const userInputLength = global.CACHE.readline.line.length;
        require('readline').cursorTo(process.stdout, promptLength + userInputLength);
    }
}

function errorOcurred() {
    global.CACHE.readline.resume();
    require('./websocket').roomDisconnect(false, '\x1b[31m[!] \x1b[91mOcorreu um erro, não foi possível manter uma conexão\ncom o intermediário, use "/menu" para voltar ao menu inicial.\n')
};