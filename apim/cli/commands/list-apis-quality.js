const {CliCommand} = require('./lib/cli-command');
const { convertQualityCriteria } = require('./lib/quality-criteria-converter');
const { mergeMap, map } = require('rxjs/operators');
const util = require('util');

/**
 * List all registered APIs quality by displaying their score and successful metrics.
 *
 * @author Alexandre Carbenay
 */
class ListApisQuality extends CliCommand {

    constructor() {
        super(
            'list-apis-quality',
            'List all registered APIs quality by displaying their score and successful metrics',
            {
                'filter-by-name': {
                    describe: "Filter APIs against their name (insensitive regex)"
                },
                'filter-by-context-path': {
                    describe: "Filter APIs against context-path (insensitive regex)",
                    type: 'string'
                },
            }
        );
    }

    definition(managementApi) {
        managementApi
            .login(this.argv['username'], this.argv['password'])
            .pipe(
                mergeMap(_token => managementApi.listApisBasics({
                    byName: this.argv['filter-by-name'],
                    byContextPath: this.argv['filter-by-context-path'],
                })),
                mergeMap(api => managementApi.getQuality(api.id).pipe(
                    map(quality => Object.assign({api: api, quality: quality}))
                ))
            )
            .subscribe(this.defaultSubscriber(
                apiQuality => {
                    const reachedCriteria = Array.from(convertQualityCriteria(apiQuality.quality))
                        .filter(criteria => criteria.complied)
                        .reduce((acc, criteria) => acc + criteria.name + ", ", "\t");

                    this.console.raw(util.format('%s (%s) - %d', apiQuality.api.name, apiQuality.api.context_path, apiQuality.quality.score))
                    if (reachedCriteria.trim().length > 0) {
                        this.console.raw(reachedCriteria);
                    }
                }
            ));
    }
}
new ListApisQuality().run();