var admin = require("firebase-admin");

var serviceAccount = require("../config/fbServiceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // databaseURL: "https://gqlreactnode45.firebaseio.com"
});


// here the callback default value is a function, the callback can also be named next, because
// when the authCheck is true/passed, the next function in the flow is executed
exports.authCheck = async (req) => {
    try {
        const currentUser = await admin.auth().verifyIdToken(req.headers.authtoken);
        console.log('CURRENT USER', currentUser);
        return currentUser;
    } catch (error) {
        console.log('AUTH CHECK ERROR', error);
        throw new Error('Invalid or expired token');
    }
}

exports.authCheckMiddleware = (req, res, next) => {
    if(req.headers.authtoken) {
        admin.auth().verifyIdToken(req.headers.authtoken)
            .then(result => {
                next()
            })
            .catch(error => console.log(error));
    } else {
        res.json({error: 'Unauthorized'});
    }
}