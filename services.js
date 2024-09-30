const crypto = require('crypto');
global.align_to_center = false;

const AXSC_Logo = [
    "\n\n\x1b[31m",
    "    ▄████████ ▀████    ▐████▀    ▄████████  ▄████████",
    "   ███    ███   ███▌   ████▀    ███    ███ ███    ███",
    "   ███    ███    ███  ▐███      ███    █▀  ███    █▀ ",
    "   ███    ███    ▀███▄███▀      ███        ███       ",
    " ▀███████████    ████▀██▄     ▀███████████ ███       ",
    "   ███    ███   ▐███  ▀███             ███ ███    █▄ ",
    "   ███    ███  ▄███     ███▄     ▄█    ███ ███    ███",
    "   ███    █▀  ████       ███▄  ▄████████▀  ████████▀ ",
    "\x1b[0m"
];

exports.centerLog = (Content, sendToConsole = true) => {
    const colors = ["\x1b[0m", "\x1b[30m", "\x1b[31m", "\x1b[32m", "\x1b[33m", "\x1b[34m", "\x1b[35m", "\x1b[36m", "\x1b[97m", "\x1b[90m", "\x1b[91m", "\x1b[92m", "\x1b[93m", "\x1b[94m", "\x1b[95m", "\x1b[96m", "\x1b[97m"];
    let newContent = Content;
    colors.forEach(item => {
        const regex = new RegExp(item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        newContent = newContent.replace(regex, '');
    });

    const Spaces = Math.max(0, Math.floor((process.stdout.columns - newContent.length) / 2));
    const CenterText = ' '.repeat(Spaces) + Content;
    if (sendToConsole === false) return CenterText;
    console.log(CenterText);
}

exports.sendWelcome = (sendSubmessage = false) => {
    console.clear();
    AXSC_Logo.forEach(Content => this.logCommand(Content));
    if (sendSubmessage) ['\x1b[31mAxon Security Chat\x1b[0m', '', '\x1b[91mSeja bem-vindo(a)!', 'Está é uma verdadeira terra sem lei.\x1b[0m'].forEach(Text => this.logCommand(Text));
}

exports.logCommand = (Content) => {
    let logCommand = console.log;
    if (global.align_to_center) logCommand = this.centerLog;
    return logCommand(Content);
};

exports.set_align = (NewStatus) => {
    global.align_to_center = NewStatus;
};

exports.resetUserInput = () => {
    let QuestionText;
    if (!global.CACHE.inRoom) { QuestionText = '\x1b[91mSeu Comando => ' } else { QuestionText = `${global.CACHE.personal_color}${global.CACHE.nickname}: \x1b[97m`; }
    if (global.align_to_center === true) QuestionText = this.centerLog(QuestionText, false);
    return QuestionText;
}

exports.encrypt = (text) => {
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(global.CACHE.key, 'hex'), Buffer.from(global.CACHE.iv, 'hex'));
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

exports.decrypt = (encryptedText) => {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(global.CACHE.key, 'hex'), Buffer.from(global.CACHE.iv, 'hex'));
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

exports.readlineTimer = (TimeInSeconds, Message, Callback) => {
    global.CACHE.readline.pause();
    let i = TimeInSeconds;
    const externalFunction = this.sendWelcome;
    function timerFunction() {
        if (i === 0) { clearInterval(timer); global.CACHE.readline.resume(); return Callback(); };
        externalFunction();
        console.log(Message.replaceAll('[TIME]', i));
        i = i - 1;
    }

    timerFunction();
    const timer = setInterval(() => timerFunction(), 1000);
}