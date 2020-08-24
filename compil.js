#!/usr/bin/env node
import logSys from './server/msgSystem.js'
import Terser from 'terser'
import fs from 'fs'
import path from 'path'

const dirPath = path.join('public/assets/structures.html')

/**
 * Compiling HTML structures
 * @function
 * @param {string} [pathOrigin] Folder in "assets/views"
 * @returns {Promise<void>}
 */
async function getHTMLFiles(pathOrigin) {
    fs.readdir(pathOrigin, (e, files) => {
        if (e)
            logSys(e, 'error')
        files.forEach(file => {
            path.extname(file) === '.html'
                ? (fs.appendFileSync(dirPath, `<div data-id="${file.replace(path.extname(file), '')}">${fs.readFileSync(pathOrigin + file).toString()}</div>`, err => {
                    logSys(err, 'error')
                }), logSys(`${file} add to ${dirPath}`, 'info'))
                : path.extname(file) === '' ? getHTMLFiles(`${pathOrigin}${file}/`) : null
        })
    })
}

;(async () => {
    fs.writeFileSync(dirPath, '', e => {
        logSys(e, 'error')
    })
    await getHTMLFiles(path.join('assets/views/'))
    logSys(`------ Get all HTML files ------`, 'info')
})()


// Compil JAVASCRIPT
const scripts = [
    'src/js/router.js',
    'src/js/products.js',
    'src/js/pushNotification.js',
    'src/js/modal.js',
    'src/js/cart.js',
    'src/js/account.js',
    'src/js/purchase.js',
]

scripts.push('assets/script.js')

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
    logSys('First Javascript Compilation', 'info')
    compil()
    logSys('JS is now watching for Change...', 'info')

} else {
    compil()
}
