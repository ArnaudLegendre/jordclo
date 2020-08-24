## **THIS VERSION IS NOT YET READY FOR USE**

![GitHub package.json version](https://img.shields.io/github/package-json/v/andreleclercq/jord?style=for-the-badge)
![CodeFactor Grade](https://img.shields.io/codefactor/grade/github/andreleclercq/jord/master?style=for-the-badge)
![Snyk Vulnerabilities for GitHub Repo](https://img.shields.io/snyk/vulnerabilities/github/andreleclercq/jord?style=for-the-badge)
![GitHub issues](https://img.shields.io/github/issues-raw/andreleclercq/jord?style=for-the-badge)
![](https://img.shields.io/github/languages/count/AndreLeclercq/JORD?style=for-the-badge)
![](https://img.shields.io/github/repo-size/andreleclercq/jord?style=for-the-badge)
![GitHub](https://img.shields.io/github/license/andreleclercq/jord?style=for-the-badge)

# JORD 🌱
JORD is a Single Page Application for eShop, with a minimal of dependencies. Better, Faster, Stronger with Javascript Vanilla.
This is a personnal project, but if you want you can use it with love and respect. JORD is NOT a CMS.

## Prerequisites
* Javascript Vanilla
* NodeJS
* MongoDB
* WebP (if you want use `npm run cwebp`)

### NodeJS Dependencies
![GitHub package.json dependency version (dev dep on branch)](https://img.shields.io/github/package-json/dependency-version/andreleclercq/jord/dev/argon2?style=for-the-badge)

![GitHub package.json dependency version (dev dep on branch)](https://img.shields.io/github/package-json/dependency-version/andreleclercq/jord/dev/mongodb?style=for-the-badge)

![GitHub package.json dependency version (dev dep on branch)](https://img.shields.io/github/package-json/dependency-version/andreleclercq/jord/dev/nodemailer?style=for-the-badge)

![GitHub package.json dependency version (dev dep on branch)](https://img.shields.io/github/package-json/dependency-version/andreleclercq/jord/dev/sass?style=for-the-badge)

![GitHub package.json dependency version (dev dep on branch)](https://img.shields.io/github/package-json/dependency-version/andreleclercq/jord/dev/terser?style=for-the-badge)



## Versions
* **Alpha (current)**
* ~~Prototype (done)~~

## Change log and Todo List
Todo list and progress of project [here](https://github.com/AndreLeclercq/JORD/projects/2).

#### Log 0.4.0 (06/08/2020)
* Re Organize project Directories
    * The `assets` directory into `public` move to root folder
    * The SVG files move to `images` folder and remove `svg` folder
    * You don't need edit files into `public` folder for html, css and js, but for custom files and folder (like `fonts` and `upload`) you need to add them into `public/assets` and call them like this `assets/fonts/myfont.ttf`
* Refacto Compiler 
    * Compil all html files in one into `public/assets/structures.html` to fetch only once time all html structure. You can call this one in javascript with global variable `htmlData`. She's an HTML element, you can pick your html file like this : For the file `assets/views/pages/home.html` => `htmlData.querySelector('[data-id=home]')`. The `data-id` = the file name. If you edit HTML files you need to restart `npm run watch` (need to be fix). You have to update `index.html` to works.
    * All SASS and JS file are outside of `public` folder and compil into `public` `app.css` and `app.js`.
    * Add compiler for images `npm run cwebp` if you have WebP install and `npm run img` if you not.
* Refacto Router (The new router fetch only one)
    * The localStorage items `products` and `user` are now available into global variables `productsData` & `userData`.
    * Now the router fetch only one html file for all the html structure.
* Fix all bugs after refacto router
* Add sample database into `assets_sample/db_sample`
* Change config.json into config.js (you need to update this file)
* Remove MongoDB auth, you don't need account to manage MongoDB (don't forget to enable MongoDB only for local usage)
* Minor Fix on assets files

#### Log 0.3.0 ( 30/07/2020 )
* Update new server.js for better perf.
* Refacto serverHTTP.js
* Add price Rules (tax...)
* Add update price when change quantity
* Update README for price rules in Product Database
* Update better `assets_sample` base


## How to use JORD ?
I try to maintain docs [here](https://andreleclercq.github.io/JORD/).
If you clone repo you can launch local docs with `npm run docs`

## License
JORD is licensed under the GNU Public License, Version 3.
[About GNU GPLv3](https://www.gnu.org/licenses/gpl-3.0.en.html)

