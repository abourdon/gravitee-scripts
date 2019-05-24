const util = require('util')
const yargs = require('yargs')
const ManagementApi = require('./management-api')
const Rx = require('rxjs')

/**
 * Base type for any Management API script.
 * 
 * Any inherited Script type will need to override the #definition(ManagementApi) method to specify the Script execution
 * 
 * @author Aurelien Bourdon
 */
class Script {

    /**
     * Create a new Management API script
     * 
     * @param {object} options the specific options to add to the global ones (Script.DEFAULT_SCRIPT_OPTIONS)
     */
    constructor(options) {
        // Add specific script options to the global ones
        this.argv = Script.defaultOptions()
        if (options) {
            Object.keys(options).forEach(optionKey => {
                this.argv = this.argv.option(optionKey, options[optionKey])
            });
        }
        this.argv = this.argv
            .help('h')
            .alias('h', 'help')
            .argv;
    }

    /**
     * Returns default options for any Script
     */
    static defaultOptions() {
        return yargs
            .usage('Usage: $0 [options]')
            .option('url', {
                alias: 'management-api-url',
                describe: 'Management API base URL',
                type: 'string',
                demandOption: true
            })
            .option('u', {
                alias: 'username',
                describe: 'Username to connect to the Management API',
                type: 'string',
                demandOption: true
            })
            .option('p', {
                alias: 'password',
                describe: "Username's password to connect to the Management API",
                type: 'string',
                demandOption: true
            })
            .option('s', {
                alias: 'silent',
                describe: "Only errors will be displayed, but no information message",
                type: 'boolean'
            })
            .version(false)
            .wrap(null);
    }

    /**
     * Get the name of this Script (default unnamed-script)
     */
    get name() {
        return 'unnamed-script';
    }

    /**
     * Display a message as it without any log level
     * 
     * @param {string} message the message to display as it without any log level
     */
    displayRaw(message) {
        console.log(message);
    }

    /**
     * Display an information message
     * 
     * @param {string} message the information message to display
     */
    displayInfo(message) {
        if (!this.argv.silent) {
            console.log(util.format('%s: %s', this.name, message));
        }
    }

    /**
     * Display an error message
     * 
     * @param {string} message the error message to display
     */
    displayError(message) {
        console.error(util.format('%s: Error: %s', this.name, message));
    }

    /**
     * Display an error message and exit process with error
     * 
     * @param {string} message the error message to display
     */
    handleError(error) {
        this.displayError(util.inspect(error));
        process.exit(1);
    }

    /**
     * Create a common Rx.Subscriber that will handle error and complete part
     * 
     * @param {function(x: ?T)} next the function that will be called at any next event
     */
    defaultSubscriber(next) {
        return Rx.Subscriber.create(
            next,
            this.handleError,
            _complete => {
                this.displayInfo('Operation complete.')
            }
        );
    }

    /**
     * Run this Management API Script instance by actually running the script definition specified by #definition(ManagementApi)
     */
    run() {
        const managementApi = ManagementApi.createInstance(new ManagementApi.Settings(this.argv.url));
        this.displayInfo("Starting...")
        this.definition(managementApi);
    }

    /**
     * Definition of this Management API Script instance
     * 
     * @param {object} _managementApi the MagementApi instance associated to this Management API Script instance
     */
    definition(_managementApi) {
        throw new Error('No definition found for this script. ManagementApiScript#definition() needs to be overridden');
    }

}

module.exports = {
    Script: Script
}