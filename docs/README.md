> documentation for JORD v0.1.1 (last update : 20/07/2020)

## Introduction
Minimal eShop Single Page Application system without framework or useless dependencies. 
It's a personnal project, but if you want you can use it ;)

### Dependencies
* NodeJS ( ^12.16.2 ) [ latest version check : 14.5.0 ]
* MongoDB server ( ^4.2.5 )  [ latest version check : 4.2.6 ]

#### NodeJS dependencies
![GitHub package.json dependency version (dev dep on branch)](https://img.shields.io/github/package-json/dependency-version/andreleclercq/jord/dev/argon2)
![GitHub package.json dependency version (dev dep on branch)](https://img.shields.io/github/package-json/dependency-version/andreleclercq/jord/dev/mongodb)
![GitHub package.json dependency version (dev dep on branch)](https://img.shields.io/github/package-json/dependency-version/andreleclercq/jord/dev/nodemailer)
![GitHub package.json dependency version (dev dep on branch)](https://img.shields.io/github/package-json/dependency-version/andreleclercq/jord/dev/sass)
![GitHub package.json dependency version (dev dep on branch)](https://img.shields.io/github/package-json/dependency-version/andreleclercq/jord/dev/terser)

* Argon2 - password-hashing function ( ^0.26.2 )
* MongoDB - MongoDB driver for Node.js ( ^3.5.9 )
* Nodemailer - Allow easy as cake email sending ( ^6.4.10 )
* SASS - CSS extension and preprocessor ( ^1.26.10 )
* Terser - JavaScript parser and mangler/compressor ( ^4.8.0 )

Optionnals deps ( need manual install ) :
* Cloc : `npm i cloc -g`
* Docs : `npm i docsify-cli -g`
* Argon2-cli : `npm i argon2-cli -g`

### NPM Commands
Default :
* Launch server HTTP2 ( watch mode ) : `npm run server`
* Launch server HTTP1 ( watch mode ) : `npm run serverHttp`
* Launch watch ( CSS & JS ) : `npm run watch`
* Launch prod ( CSS & JS ) : `npm run prod`

Optionnal :
* Docs ( Jord's local docs ) : `npm run docs`
* Cloc ( Count Lines of Code ) : `npm run cloc`


### Others
* Spectre minimal, responsive, CSS framework [Docs](https://picturepan2.github.io/spectre/getting-started.html)
* Feather Icons set v.4.24.1 [Docs](https://feathericons.com/)

---
## Install
### Get Files
* Core repo : `git clone https://github.com/AndreLeclercq/JORD.git`

#### Prepare Files
Duplicate and rename folder `assets_sample` to `assets` and move to `/public`

### Database

#### Users
Create mongoDB database with 2 users, one for read and one for readWrite.

```json
use databaseName
db.createUser(
  {
    user: "dbNameRead",
    pwd: useVeryStrongPassword,
    roles: [
       { role: "read", db: "databaseName" }
    ]
  }
)
```

```json
use databaseName
db.createUser(
  {
    user: "dbNameReadWrite",
    pwd: useVeryStrongPassword,
    roles: [
       { role: "readWrite", db: "databaseName" }
    ]
  }
)
```

#### Collections
Create 4 collections :
* users
* products
* pages
* orders

```json
use databaseName
db.createCollection('users')
db.createCollection('products')
db.createCollection('pages')
db.createCollection('orders')
```

### ConfigFile
Edit the Config File into `public/assets/config.js`
#### general
```json
"general" : {
    "siteName" : "YourWebsite",
    "domain" : "mydomain.com",
    "email_admin" : "admin@mydomaine.com"
  },
...
```

#### db

```json
...
"db" : {
    "name" : "databaseName",
    "userR" : "userRead",
    "pwdR" : "passwordUserRead",
    "userRW" : "userReadWrite",
    "pwdRW" : "passwordReadWrite"
  },
...
```

#### mail
```json
...
"mail" : {
    "host" : "smtp.host.com",
    "port" : 2525,
    "user" : "username",
    "pass" : "password"
  }`
```

---

## Getting Started
### Intro concept
Jord was split in two "parts", the *core* and the *assets*.

#### The Core
All files ( except *public/assets* folder ), these are all the features of JORD.
* Server
* Router
* Bundler

We recommend don't make any changes, to avoid conflict with updates. You can update the core with *git pull*

#### Assets
> **_IMPORTANT :_** All files and folders in the initial /assets_sample folder are REQUIRED

You can find all assets editable as you need. 
* HTML Views
* CSS
* Javascript
* SVG


You can add folder and other files (fonts, images...), but be careful, some elements need to be specific. Read the next chapter.

### Edit HTML Views

There is 4 type of views :
* Email
* Pages
* Parts
* Templates

#### Email
Emails structures, HTML and Plain text. For the html it's simple you just need create *.html* file and for the plain text, create *.txt* file.

> **_NOTE :_** Both files need to named same.

#### Pages
Pages content, you can create new page and add it to database with the file name to be available on router. ( Check "Add Content" chapter )

#### Parts
Parts who can called on website, like "cart, notification...". Be careful to note touch required "variables".

#### Templates
Templates for specific content like "product, blog posts...".

---

## Create account
### Create account user from db
> **_NOTE :_** Password & email should not be empty and email should be unique in database.
```json
use databaseName
db.users.insertOne(
   { 
   "password": "",
   "email": "",
   "firstname": "",
   "lastname": "",
   "address": "",
   "postalCode": "",
   "town": "",
   "shipping_address": "",
   "shipping_postalCode": "",
   "shipping_town": ""
   }
)
```

### Hash password
The password need to be hashed with *argon2i*, you can use npm package *argon2-cli*

`echo -n "mypassword" | argon2-cli -i`

---

## Create Content
### New page
1. Go into folder `/public/assets/views/pages`
2. Create HTML file
3. Add new document in "pages" collection

```json
use databaseName
db.pages.insertOne(
   { 
   slug: "my-page-slug", 
   fileName: "myFileName", 
   title: "My page Title",
   access: "0" 
   }
)
```
* Slug : Link use to show page
* File Name : File Name in `/public/assets/views/pages` (without .html)
* Title : Use for title tag
* Access : Access level (0: all | 1 : user login | 2 : for no one)

### New Product
Add document in collection "products", the field "slug" is required.
```json
use databaseName
db.orders.insertOne(
{
    "name": "My Product Name",
    "slug": "my-product-slug",
    "access": "0",
    "ref": "prodref",
    "price": "19.78",
    "priceRules": ["$p+30","$p*1.2"],
    "category": "category-1",
    "filters": {
        "firstFilter": "value",
        "secondFilter": "10"
    },
    "variables": {
        "REFVAR1": "2",
        "REFVAR2": "4",
        "REFVAR3": "1",
    },
    "options": {
        "optionsGrp1": {
            "name": "First group",
            "ref": "firstGroup",
            "type": "checkboxORselect",
            "values": [
                {
                    "ref": "opt-1",
                    "price": "5.15",
                    "name": "First"
                }
            ]
        }
    },
    "images": ["assets/images/myImage1.png", "assets/images/myImage2.png"],
    "desc": "Description of the product",
    "tech": "Technical description of the product"
}
```
* Slug : Link use to show product page
* Access : Access level (0: all | 1 : user login)
* Name : Use for H1 and Title tag
* Price : The product price
* PriceRules : Calcul rules to applied
    * $p was replace by the price (ex : $p * 1.2 => 100 * 1.2 for 20% of tax)
    * Always calculate by order of the array (ex: ["$p+30","$p*1.2"] => 70+30 = 100 => 100*1.2 = 120)
* Category: Main category slug (only on)
* Filters : Filters for classifications
    * Filter Name : Value of filter
* Variables : Mandatory options composed of other products
    * Ref ( Reference of the product ) : Quantity
* Options (1) : Product options ( can change price )
    * Option Group
        * Name : Name of group
        * Ref : Reference of group
        * Type : "checkbox" ( multiple choices ) or "select" ( only one choice )
        * Values : One value by object
            * Ref : Reference of option
            * Price : Price of option
            * Name : Name of option
* Images : Array with url of the product's images
* Desc : Simple description of the product
* Tech : Technical description of the product

> **_(1)_** Every combinaison of product + options create a new product in cart.

### New Order
Add document in collection "orders".

```json
use databaseName
db.orders.insertOne(
   { 
   status: "inprogress",
   cart: Array[], 
   infos: Array[],
   dateCreate: "01-01-2020-10:30",
   datePurchase: "01-01-2020-10:35",
   }
)
```
* Status : The status of the order
* Cart : An array with the cart
* Infos : An array with user informations (address, firstname, lastname, email, id)
* dateCreate : Date when the document was create
* datePurchase : Date when payment was proceed

---

## Misc
### Feather Icon set
List of icons (v4.24.1) : https://feathericons.com/
Github docs : https://github.com/feathericons/feather#feather
#### How to add icon
```html
<svg class="feather"><use xlink:href="assets/svg/feather-sprite.svg#iconName"/></svg>
```
