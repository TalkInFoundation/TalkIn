var winston = require('winston');
winston.emitErrs = true;

function Logger(module){
    var path = module.filename.split('/').slice(-2).join('/');
    return new winston.Logger({
        transports: [
            new winston.transports.File({
                name: 'error-file',
                label: path,
                level: 'error',
                filename: './logging/errors.log',
                handleExceptions: true,
                json: true,
                maxsize: 5242880, //5MB
                maxFiles: 5,
                colorize: false
            }),
            new winston.transports.File({
                name:'info-file',
                label: path,
                level: 'info',
                filename: './logging/all-info.log',
                handleExceptions: true,
                json: true,
                maxsize: 5242880, //5MB
                maxFiles: 5,
                colorize: false
            }),
            new winston.transports.Console({
                level: 'debug',
                handleExceptions: true,
                json: false,
                colorize: true
            })
        ],
        exitOnError: false
    });
}


module.exports = Logger;

