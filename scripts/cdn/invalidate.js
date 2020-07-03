/**
 * Purge CDN fastly cache
 */

const secrets = require('../../secrets.json');

function invalidate () {
    if (!secrets ||
        !secrets.FASTLY_API_KEY ||
        !secrets.FASTLY_CARTODB_SERVICE) {
        throw Error('secrets.json content is not valid');
    }
    
    // Purge all cache
    let fastly = require('fastly')(secrets.FASTLY_API_KEY);
    
    if (DRY_RUN) { // no effective invalidation
        console.log(`\t[DRY_RUN] fastly fake purgeAll invalidation`);
    } else { // real CDN invalidation!
        console.log('\tInvalidating CDN cache...');
        fastly.purgeAll(secrets.FASTLY_CARTODB_SERVICE, function (err) {
            if (err) return console.error(err);
            console.log('\t\033[1m[OK] Invalidation Done!\033[0m');
        });
    }
}

// main -----------------------------------------------
const args = process.argv;
const DRY_RUN = args.some(arg => arg === '--dry-run');

invalidate();


