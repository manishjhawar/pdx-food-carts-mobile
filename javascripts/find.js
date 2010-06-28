Titanium.include('../javascripts/application.js');
Titanium.include('../javascripts/helpers.js');

var win = Ti.UI.currentWindow;
var annotations = [];
var revision;
var mapview;
var currentMapBounds;

function getCarts(location) {
  var one_block = 0.0024;
  var lat = location.latitude;
  var lon = location.longitude;
  var url = "http://data.pdxapi.com/food_carts/_design/names/_spatial/points?bbox="+ (lon - one_block) + "," + (lat - one_block) + "," + (lon + one_block) + "," + (lat + one_block);
  var xhr = Titanium.Network.createHTTPClient();
  xhr.onload = function() {
      var response = JSON.parse(this.responseText).spatial;
      var carts = Enumerable.map(response, function(cart){
        return {latitude: cart.bbox[1], longitude: cart.bbox[0], id:cart.id, name:cart.value.name};
      });
      showCarts(carts);
  };
  xhr.open("GET", url);
  xhr.send();
}

function showCarts(carts) {
  function displayAnnotations() {
    mapview.addAnnotations(annotations);
  }

  function hideAnnotations(){
    for (var a=annotations.length-1;a>=0;a--) {
      mapview.removeAnnotation(annotations[a]);
    }
    annotations = [];
  }
  
  hideAnnotations();
  
  for (var i = 0; i < carts.length; i++) {    
    var a = Ti.Map.createAnnotation({
        latitude: carts[i].latitude,
        longitude: carts[i].longitude,
        pincolor: Ti.Map.ANNOTATION_RED,
        title:carts[i].name,
      	rightButton: Titanium.UI.iPhone.SystemButton.DISCLOSURE,
        animate: false,
        couch_id: carts[i].id
    });
    annotations = annotations.concat(a);
  }  
  displayAnnotations();
}

Titanium.Geolocation.getCurrentPosition(function(e) {
  var location = {latitude:45.5123668,longitude:-122.6536583,animate:true,latitudeDelta:0.001, longitudeDelta:0.001};

  mapview = Titanium.Map.createView({
  	mapType: Titanium.Map.STANDARD_TYPE,
  	region:location,
  	animate:true,
  	regionFit:true,
  	userLocation:true
  });

  win.open(mapview);
  win.add(mapview);
  
  mapview.addEventListener('click',function(evt) {
  	var annotation = evt.annotation;
  	var title = evt.title;
  	var clickSource = evt.clicksource;
  	var couch_id = evt.annotation.couch_id;

  	if (evt.clicksource == 'rightButton') {
  	  var win = Titanium.UI.createWindow({
    		url:'view_details.js',
    		backgroundColor:'#fff',
    		title: title,
    		couch_id: couch_id
    	});
    	Titanium.UI.currentTab.open(win,{animated:true});
  	}
  });

  mapview.addEventListener('regionChanged',function(evt){
    currentMapBounds = GeoHelper.getMapBounds(evt);
    getCarts({ latitude: currentMapBounds.center.lat, longitude: currentMapBounds.center.lng });
  });
  
  win.addEventListener('focus', function(){
    getCarts({ latitude: currentMapBounds.center.lat, longitude: currentMapBounds.center.lng });
  });
  
});