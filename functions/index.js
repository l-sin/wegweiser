const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();


exports.selectRoutes = functions.region('europe-west1')
								.https
								.onRequest((request, response) => {
  //response.send("Hello from Firebase!");
  var query = admin.firestore().collection('routes');
  
  var routes = {};

  query.get()
       .then(function(querySnapshot) {
			querySnapshot.forEach(function(doc) {

			routes[doc.id] = doc.data();
								});
			console.log("Got routes!");
			response.send(routes);
			})
	   .catch(function(error) {
			console.log("Error getting documents");
				});
});