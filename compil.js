#!/usr/bin/env node
import logSys from './server/msgSystem.js'
import Terser from 'terser'
import fs from 'fs'

const scripts = [
    'src/js/import.js',
    'src/js/router.js',
    'src/js/products.js',
    'src/js/layoutsParts.js',
    'src/js/pushNotification.js',
    'src/js/modal.js',
    'src/js/cart.js',
    'src/js/account.js',
    'src/js/purchase.js',
]

scripts.push('public/assets/script.js')

let destFile = process.argv.pop();

let compil = () => {

    try {
        let dist = scripts.map(script => fs.readFileSync(script, {encoding: 'utf8'})).join('\n')
        if (process.argv.includes('--compress'))
            dist = Terser.minify(dist).code
        fs.writeFileSync(destFile, dist)
    } catch (e) {
        logSys(e, 'error')
    } finally {
        logSys('Compiling Javascript Done with success !', 'success')
    }

}

if (process.argv.includes('--watch')) {
    logSys(`Ready to watch files : `, 'info')
    logSys(`---------------`, 'info')
    scripts.forEach(e => {
        fs.watchFile(e, compil)
        logSys(e, 'info')
    })
    logSys(`---------------`, 'info')
    logSys(`Toward [${destFile}]`, 'info')
    logSys('First Javascript Compilation')
    compil()
    logSys('JS is now watching for Change...')

} else {
    compil()
}

