'use strict';

Wegweiser.ID_CONSTANT = 'fir-';



Wegweiser.prototype.initTemplates = function() {
  this.templates = {};

  var that = this;
  document.querySelectorAll('.template').forEach(function(el) {
    that.templates[el.getAttribute('id')] = el;
  });
};


Wegweiser.prototype.showVanilla = function() {
  // 
  var cardContainer = document.querySelector('#results');
  cardContainer.innerHTML="";

  var vanilla = {'Type':'Hiking','Duration':'3 to 6'};
  
  var that = this;
  var query = this.queryRoutes(vanilla);
	
  query.get()
       .then(function(doc) {
			var results = that.formatVanilla(doc,vanilla);
			return results
			})
	   .then(function(results){
		   Object.values(results['routes']).forEach( function(route){
			    var el = that.renderTemplate('vanilla-card',route);
				cardContainer.append(el);
				el.addEventListener("click", 
									function(){that.viewDetails(el)}
									);
				});
			var el = that.renderTemplate('final-message');
			el.querySelector('#message').innerHTML=results['badWeather']+" routes not shown due to bad weather.";
			cardContainer.append(el);
		   })
	   .catch(function(error) {
			console.log("Error getting documents: ", error);
		   });

};





Wegweiser.prototype.initDialog = function() {
	var filter_display = document.querySelector('#filter-display');
	const dialog = new mdc.dialog.MDCDialog(document.querySelector("#filter-dialog"));
	var cancel_button = document.querySelector('#cancel-button');
	var filter_button = document.querySelector('#filter-button');
	var that = this;
	document.querySelectorAll(".preference").forEach( function(el) {
		that.applyDefaults(el);
	});
	
	var HikeDate = document.querySelector('#HikeDate');

	 for(var day = 0; day < 5; day++) {
		var date = new Date();
		date.setDate(date.getDate() + day);
		var dateOption = new Option(date.toISOString().slice(0,10),	
									date.toISOString().slice(0,10)); //this is off by 1 hour because timezones
		HikeDate.append(dateOption);
	 }

	cancel_button.addEventListener("click", function(){
		dialog.close();
	});
	
	filter_button.addEventListener("click", function(){
		var preferences = {};
		document.querySelectorAll('.preference').forEach(function(el){
			preferences[el.id] = el.value;
		});
		that.viewResults(preferences);
		dialog.close();
	});
	
	
	filter_display.addEventListener("click", function(){
		dialog.show();
	});

};



Wegweiser.prototype.applyDefaults = function(el) {
	var id = el.getAttribute('id');
	el.value=this.data['defaults'][id];	
};


Wegweiser.prototype.initFooter = function() {
	
  var footerEl = document.querySelector('.footer');
  var that = this;
  
  const dialog = new mdc.dialog.MDCDialog(document.querySelector("#footer-dialog"));
  var close_button = document.querySelector('#close-button');
  close_button.addEventListener("click", function(){
	//document.querySelector("#footer-dialog-content").innerHTML="";
	dialog.close();
  });
  var about = document.querySelector('#about');
  about.addEventListener("click", function() {
	  document.querySelector("#footer-dialog-title").innerHTML = 'About';
	  document.querySelector("#footer-dialog-content").innerHTML = that.data['about'];
	  dialog.show();
  } );
  var blog = document.querySelector('#blog');
  about.addEventListener("click", function() {
	  document.querySelector("#footer-dialog-title").innerHTML = 'About';
	  document.querySelector("#footer-dialog-content").innerHTML = that.data['about'];
	  dialog.show();
  } );
  var contact = document.querySelector('#contact');
  contact.addEventListener("click", function() {
	  document.querySelector("#footer-dialog-title").innerHTML = 'Contact';
	  document.querySelector("#footer-dialog-content").innerHTML = that.data['contact'];
	  dialog.show();
  } );
  var conditions = document.querySelector('#conditions');
  conditions.addEventListener("click", function() {
	  document.querySelector("#footer-dialog-title").innerHTML = 'Terms & Conditions';
	  document.querySelector("#footer-dialog-content").innerHTML = that.data['conditions'];
	  dialog.show();
  } );
  /*
  Object.values(footerEl.children).forEach( function(child){
	  child.addEventListener("click", function() {dialog.show();} );
	  
	  footerEl.querySelector('#'+child.id)
			  .addEventListener("click", function() {
			  	//document.querySelector("#footer-dialog-content").innerHTML = that.data[el.id];
				dialog.show();
			  } );
	  
  });
  */
  
};


Wegweiser.prototype.initMap = function() {
	
	var src = 'https://map.geo.admin.ch/embed.html?'+
				 'zoom=0&lang=en&topic=ech&'+
				 'bgLayer=ch.swisstopo.pixelkarte-farbe&'+
				 'layers=ch.bav.haltestellen-oev,'+
				 'ch.astra.wanderland&'+
				 'E=2661277.95&N=1181329.41&layers_opacity=0.7,1';
	
	document.getElementById('map-iframe').src = src;
};


Wegweiser.prototype.viewResults = function(preferences) {

  var resultsContainer = document.querySelector('#results');
  
  resultsContainer.innerHTML="";
  
  var that = this;
  var query = this.queryRoutes(preferences);
	
  query.get()
       .then(function(doc) {
			var results = that.selectRoutes(doc,preferences);
			return results
			})
	   .then(function(results){
		   //console.log(results);
		   Object.values(results['routes']).forEach( function(route){
			    var el = that.renderTemplate('route-card',route);
				resultsContainer.append(el);
				el.addEventListener("click", 
									function(){that.viewDetails(el)}
									);
				});
		   	var el = that.renderTemplate('final-message');
			el.querySelector('#message').innerHTML=results['badWeather']+" routes not shown due to bad weather.";
			resultsContainer.append(el);
		   })
	   .catch(function(error) {
			console.log("Error getting documents: ", error);
		   });

  document.querySelector('#filter-description').innerHTML = 
	'Showing '+preferences.Type.toLowerCase()+' routes lasting '+
	preferences.Duration+' hours within '+
	preferences.MaxTravelTime+' hours of '+preferences.Home+'.';

};


Wegweiser.prototype.viewDetails = function(card) {
	
	//console.log(card.querySelector('#coordE').innerHTML,
	//			card.querySelector('#coordN').innerHTML	);

	//refresh map iframe with new coords
	var newsrc = 'https://map.geo.admin.ch/embed.html?'+
				 'zoom=4&lang=en&topic=ech&'+
				 'bgLayer=ch.swisstopo.pixelkarte-farbe&'+
				 'layers=ch.bav.haltestellen-oev,'+
				 'ch.astra.wanderland&'+
				 'E='+card.querySelector('#coordE').innerHTML+
				 '&N='+card.querySelector('#coordN').innerHTML;
	document.getElementById('map-iframe').src = newsrc
};


Wegweiser.prototype.queryRoutes = function(preferences) {
  var query = firebase.firestore().collection("beta_"+preferences.Type).doc(preferences.Duration);
  return query
};


Wegweiser.prototype.formatVanilla = function(doc,preferences) {
  var routes = doc.data();
  var results = {'badWeather':0,'routes':{}};
  var that = this;
  Object.entries(routes).forEach( function([name,route]){
	var key = Object.keys(route.start_weather)[0];
	route.start_weather = route.start_weather[ key ];
	route.end_weather = route.end_weather[ key ];
	if (that.filterRoutesByWeather(route)) {	
		route['duration'] = that.formatTimeToHM(route['duration']);		
		results['routes'][name]=route; }
	else { results['badWeather']++ };
	});
  
  return results
};



Wegweiser.prototype.selectRoutes = function(doc,preferences) {
  var routes = doc.data();
  var results = {'badWeather':0,'routes':{}};
  var that = this;
  Object.entries(routes).forEach( function([name,route]){
	//console.log(name);
	//console.log(route);
	route.start_weather = route.start_weather[ preferences.HikeDate +' 12:00:00' ];
	route.end_weather = route.end_weather[ preferences.HikeDate +' 12:00:00'];
	route['time_to_start'] = route['time_to_start_from_'+preferences.Home];
	route['time_from_end'] = route['time_to_'+preferences.Home+'_from_end'];
	
	if (that.filterRoutesByPref(route,preferences)) {
		if (that.filterRoutesByWeather(route)) {
			
			route['duration'] = that.formatTimeToHM(route['duration']);
			route['time_to_start'] = that.formatTimeToHM(route['time_to_start']);
			route['time_from_end'] = that.formatTimeToHM(route['time_from_end']);
			
			results['routes'][name]=route; }
		else { results['badWeather']++ };
		};
	});
  
  return results
  /*
  var selectRoutes = firebase.functions().httpsCallable('selectRoutes');
  selectRoutes(preferences).then(function(result) {
    // Read result of the Cloud Function.
    var routes = result.data;
    // ...
  });
  */
};


Wegweiser.prototype.filterRoutesByPref = function(route,preferences) {
	var goodRoute = route.type==preferences.Type &&
					route.time_to_start<=preferences.MaxTravelTime &&
					route.time_from_end<=preferences.MaxTravelTime;
					  
	return goodRoute
}


Wegweiser.prototype.filterRoutesByWeather = function(route) {
	var goodWeather = (route.start_weather['status']=='Clear' || route.start_weather['status']=='Clouds')&&
					  (route.end_weather['status']=='Clear' || route.end_weather['status']=='Clouds');
					  
	return goodWeather
}


Wegweiser.prototype.formatTimeToHM = function(timeNum) {
	var mins = timeNum%1;
	var timeString = {'hours': Math.floor(timeNum), 'minutes': Math.round(mins*60)};
					  
	return timeString
}


Wegweiser.prototype.renderTemplate = function(id, data) {
  var template = this.templates[id];
  var el = template.cloneNode(true);
  el.removeAttribute('hidden');
  this.render(el, data);
  
  // set an id in case we need to access the element later
  if (data && data['.id']) {
    // for `querySelector` to work, ids must start with a string
    el.id = this.ID_CONSTANT + data['.id'];
  }

  return el;
};

Wegweiser.prototype.render = function(el, data) {
  if (!data) {
    return;
  }

  var that = this;
  var modifiers = {
    'data-fir-foreach': function(tel) {
      var field = tel.getAttribute('data-fir-foreach');
      var values = that.getDeepItem(data, field);

      values.forEach(function (value, index) {
        var cloneTel = tel.cloneNode(true);
        tel.parentNode.append(cloneTel);

        Object.keys(modifiers).forEach(function(selector) {
          var children = Array.prototype.slice.call(
            cloneTel.querySelectorAll('[' + selector + ']')
          );
          children.push(cloneTel);
          children.forEach(function(childEl) {
            var currentVal = childEl.getAttribute(selector);

            if (!currentVal) {
              return;
            }

            childEl.setAttribute(
              selector,
              currentVal.replace('~', field + '/' + index)
            );
          });
        });
      });

      tel.parentNode.removeChild(tel);
    },
    'data-fir-content': function(tel) {
      var field = tel.getAttribute('data-fir-content');
      tel.innerText = that.getDeepItem(data, field);
    },
	'data-fir-link': function(tel) {
	  var field = tel.getAttribute('data-fir-link');
      tel.href='https://schweizmobil.ch'+that.getDeepItem(data, field);
    },
    'data-fir-click': function(tel) {
      tel.addEventListener('click', function() {
        var field = tel.getAttribute('data-fir-click');
        that.getDeepItem(data, field)();
      });
    },
    'data-fir-if': function(tel) {
      var field = tel.getAttribute('data-fir-if');
      if (!that.getDeepItem(data, field)) {
        tel.style.display = 'none';
      }
    },
    'data-fir-if-not': function(tel) {
      var field = tel.getAttribute('data-fir-if-not');
      if (that.getDeepItem(data, field)) {
        tel.style.display = 'none';
      }
    },
    'data-fir-attr': function(tel) {
      var chunks = tel.getAttribute('data-fir-attr').split(':');
      var attr = chunks[0];
      var field = chunks[1];
      tel.setAttribute(attr, that.getDeepItem(data, field));
    },
    'data-fir-style': function(tel) {
      var chunks = tel.getAttribute('data-fir-style').split(':');
      var attr = chunks[0];
      var field = chunks[1];
      var value = that.getDeepItem(data, field);

      if (attr.toLowerCase() === 'backgroundimage') {
        value = 'url(' + value + ')';
      }
      tel.style[attr] = value;
    }
  };

  var preModifiers = ['data-fir-foreach'];

  preModifiers.forEach(function(selector) {
    var modifier = modifiers[selector];
    that.useModifier(el, selector, modifier);
  });

  Object.keys(modifiers).forEach(function(selector) {
    if (preModifiers.indexOf(selector) !== -1) {
      return;
    }

    var modifier = modifiers[selector];
    that.useModifier(el, selector, modifier);
  });
};

Wegweiser.prototype.useModifier = function(el, selector, modifier) {
  el.querySelectorAll('[' + selector + ']').forEach(modifier);
};

Wegweiser.prototype.getDeepItem = function(obj, path) {
  path.split('/').forEach(function(chunk) {
    obj = obj[chunk];
  });
  return obj;
};

Wegweiser.prototype.replaceElement = function(parent, content) {
  parent.innerHTML = '';
  parent.append(content);
};

Wegweiser.prototype.rerender = function() {
  this.router.navigate(document.location.pathname + '?' + new Date().getTime());
};
