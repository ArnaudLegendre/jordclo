import mongodb from 'mongodb'
import argon2 from 'argon2'
import Email from '../server/email.js'
import logSys from '../server/msgSystem.js'
import dateTime from '../server/dateTime.js'

logSys( 'Database..............READY', 'success' )

let client

async function dbConnect ( dbUser, dbPwd, dbName ) {

    const uri = `mongodb://${dbUser}:${dbPwd}@127.0.0.1:27017/?authSource=${dbName}&readPreference=primary&appname=MongoDB%20Compass&ssl=false`

    let MongoClient = mongodb.MongoClient
    client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    await client.connect()

}

async function dbLoad ( dbUser, dbPwd, dbName, dbCollection ) {

    await dbConnect(dbUser, dbPwd, dbName)

    try {
        logSys( `Open connection to Database "${ dbName }" and get "${ dbCollection.name }"` )
        const db = client.db( dbName )
        return await db.collection(dbCollection.name).find().toArray()

    } catch ( e ) {
        logSys( e, 'error' )
    }

}

async function dbLogin ( dbUser, dbPwd, dbName, dbCollection, dbElem ) {

    await dbConnect(dbUser, dbPwd, dbName)

    try {
        const db = client.db( dbName )
        const document = await db.collection( dbCollection ).find( { email: dbElem.email } ).toArray()

        if ( document.length !== 0 ){

            try {
                if ( await argon2.verify( document[0].password, dbElem.password ) ) {

                    logSys( `User login "${ document[0]._id }"` )
                    return {
                        'email': document[0].email,
                        'firstname': document[0].firstname,
                        'lastname': document[0].lastname,
                        'phone': document[0].phone,
                        'address': document[0].address,
                        'postalCode': document[0].postalCode,
                        'town': document[0].town,
                        'shipping_address': document[0].shipping_address,
                        'shipping_postalCode': document[0].shipping_postalCode,
                        'shipping_town': document[0].shipping_town,
                        'token': ''
                    }

                } else {
                    return 'incorrect password'
                }
            } catch ( err ) {
                logSys( err, 'error' )
            }
        } else {
            return 'user not found'
        }

    } catch ( e ) {
        logSys( e, 'error' )
    }

}

async function dbRegister ( dbUser, dbPwd, dbName, dbCollection, dbElem ) {

    await dbConnect(dbUser, dbPwd, dbName)

    try {
        const db = client.db( dbName )
        let document = await db.collection( dbCollection ).find( { email: dbElem.email } ).toArray()

        if ( document.length !== 0 ){

            return 'email already use'

        } else {

            let sendData = {}
            sendData['password'] = await argon2.hash(dbElem.password)
            sendData['email'] = dbElem.email
            sendData['firstname'] = ''
            sendData['lastname'] = ''
            sendData['phone'] = ''
            sendData['address'] = ''
            sendData['postalCode'] = ''
            sendData['town'] = ''
            sendData['shipping_address'] = ''
            sendData['shipping_postalCode'] = ''
            sendData['shipping_town'] = ''

            await db.collection(dbCollection).insertOne(sendData, err => {
                if (err) {
                    logSys(err, "error")
                }
                logSys(`New user register`, 'success')
            })

            let email = new Email
            await email.send( {
                email: dbElem.email,
                subject: 'Votre inscription sur notre site',
                textFile: 'confirmRegister',
            } )

            return 'register ok'

        }

    } catch ( e ) {
        logSys( e, 'error' )
    }

}

async function dbUpdateUser( dbUser, dbPwd, dbName, dbCollection, dbElem ){

    await dbConnect(dbUser, dbPwd, dbName)

    try {
        dbElem = JSON.parse( dbElem )

        const db = client.db( dbName )
        let dataUser = {
            'email': dbElem.email,
            'firstname': dbElem.firstname,
            'lastname': dbElem.lastname,
            'phone': dbElem.phone,
            'address': dbElem.address,
            'postalCode': dbElem.postalCode,
            'town': dbElem.town,
            'shipping_address': dbElem.shipping_address,
            'shipping_postalCode': dbElem.shipping_postalCode,
            'shipping_town': dbElem.shipping_town,
        }
        let document = await db.collection( dbCollection ).findOneAndUpdate(
            { email: dbElem.email },
            { $set: dataUser }
        )
        logSys( `User edit profil "${document.value._id}"` )
        return dataUser
    } catch ( e ) {
        logSys( e, 'error' )
    }

}

async function dbUpdatePassword ( dbUser, dbPwd, dbName, dbCollection, dbElem ) {

    await dbConnect(dbUser, dbPwd, dbName)

    try {
        const db = client.db( dbName )
        const document = await db.collection( dbCollection ).find( { email: dbElem.email } ).toArray()

        if ( document.length !== 0 ){
            try {
                if ( await argon2.verify( document[0].password, dbElem.password ) ) {

                    let passwordHash = await argon2.hash( dbElem.newPassword )
                    let updateDocument = await db.collection( dbCollection ).findOneAndUpdate(
                        { email: dbElem.email },
                        { $set: { 'password': passwordHash } }
                    )
                    logSys( `User edit password "${updateDocument.value._id}"` )
                    return 'password updated'

                } else {
                    return 'incorrect password'
                }
            } catch ( err ) {
                logSys( err, 'error' )
            }
        } else {
            return 'user not found'
        }

    } catch ( e ) {
        logSys( e, 'error' )
    }

}

async function dbCart( dbUser, dbPwd, dbName, dbCollection, action, userEmail, dbElem ){

    await dbConnect(dbUser, dbPwd, dbName)

    try {
        const db = client.db( dbName )
        if( action === 'saveCart' ){

            let data = JSON.parse( dbElem )

            let dataCart = {
                'cart': data,
            }
            let document = await db.collection( dbCollection ).findOneAndUpdate(
                { email: userEmail },
                { $set: dataCart }
            )

        } else if( action === 'getCart' ){

            let document = await db.collection( dbCollection ).find( { email: userEmail } ).toArray( )
            if( document[0].cart !== 'null' ) {
                return JSON.stringify( document[0].cart )
            } else {
                return 'cart empty'
            }
        }

    } catch ( e ) {
        logSys( e, 'error' )
    }

}

async function dbOrders( dbUser, dbPwd, dbName, dbCollection, action, dbElem ) {

    await dbConnect(dbUser, dbPwd, dbName)

    try {
        const db = client.db( dbName )
        if( action === 'createOrders' ){

            let userInfo = await db.collection( 'users' ).find( { email: dbElem } ).toArray( )

            let status = 'inProgress'
            let cart = userInfo[0].cart
            let infos = { }
            for ( let [ k, v ] of Object.entries( userInfo[0] ) )
                k !== 'password' && k !== 'cart' ? infos[k] = v : null

            let dateCreate = await dateTime( )
            let order = {
                'status': status,
                'cart': cart,
                'infos': infos,
                'dateCreate': dateCreate,
                'datePurchase': ''
            }

            let document = await db.collection( dbCollection ).insertOne( order, ( err, res ) => {
                if ( err ) {
                    logSys( err, 'error' )
                }

                logSys( `User (${ userInfo[0]._id }) create an order "${ res.insertedId }"`, 'success' )
            } )

            let email = new Email
            await email.send( {
                email: dbElem,
                subject: 'Votre commande sur notre site',
                textFile: 'orderInProgress',
            } )

            return 'order created'


        } else if( action === 'editOrders' ){


        }

    } catch ( e ) {
        logSys( e, 'error' )
    }

}

export{
    dbLoad,
    dbLogin,
    dbRegister,
    dbUpdateUser,
    dbUpdatePassword,
    dbCart,
    dbOrders,
}