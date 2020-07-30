'use strict';

function Wegweiser() {
  var preferences = {start_hub:"Zurich",
					 type:"Mountain"};

  var that = this;
  
  firebase.firestore().enablePersistence()
    .then(function() {
      return firebase.auth().signInAnonymously();
    })
    .then(function() {
	  
	  that.initTemplates();
	  that.initDialog();
	  that.initFooter();
	  that.showVanilla();
    }).catch(function(err) {
      console.log(err);
    });
}


Wegweiser.prototype.getFirebaseConfig = function() {
  return firebase.app().options;
};


window.onload = function() {
  window.app = new Wegweiser();
};


Wegweiser.prototype.data = {
	'defaults':{
				'Home':'Zurich',
				'Type':'Hiking',
				'MaxTravelTime':2.5,
				'Duration':'3 to 6'
				},
	'about': 'Wegweiser is a web application that recommends one-day hikes in Switzerland'+
			 ' based on weather conditions, and your preferences of travel time,'+
			 ' route type, and route duration.',
	'contact':'Gmail: sin.larry.pt',
	'conditions': '&copy; 2019 Larry Sin'
};
/*
Wegweiser.prototype.data = {
	'about': 'Wegweiser is a web application that recommends hiking routes'+
			 ' based on weather conditions, and your preferences of travel time,'+
			 ' route type, and route duration.',
	'contact':'sin.larry.pt at gmail dot com',
	'conditions': 'By using any part of this website,'+
			 ' you agree to the following Terms and Conditions.\n'+
			 ' Disclaimer: We provide the data on an as-is basis.'+
			 ' Although great effort has been expended to ensure the reliability'+
			 ' of the data, we provide no guarantee of its accuracy.'+
			 ' We do not accept responsibility for any action taken'+
			 ' on the basis of the data provided by this website.'+
			 ' Copyright: This website, with the exception of data provided'+
			 ' by third parties, is the sole property of us.'+
			 ' This website may not be copied, reproduced, or distributed,'+
			 ' without permission from the owner.'
};
*/