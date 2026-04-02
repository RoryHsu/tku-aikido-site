const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.createAdminUser = functions.https.onCall(
async (data, context) => {

if (!context.auth) {

throw new functions.https.HttpsError(
"unauthenticated",
"必須登入"
);

}

const email = data.email;
const name = data.name;
const role = data.role;

try {

const userRecord =
await admin.auth().createUser({

email: email,

password:
Math.random().toString(36).slice(-10),

});

await admin.auth()
.generatePasswordResetLink(email);

await admin.firestore()
.collection("users")
.add({

name: name,

email: email,

role: role,

createdAt:
admin.firestore.FieldValue.serverTimestamp(),

updatedAt:
admin.firestore.FieldValue.serverTimestamp(),

});

return {

success:true

};

} catch(error){

throw new functions.https.HttpsError(
"unknown",
error.message
);

}

});