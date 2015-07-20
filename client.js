Beers = new Mongo.Collection('beers');
Breweries = new Mongo.Collection('breweries');
BreweriesGeocode = new Mongo.Collection('breweriesgeocode');
Categories = new Mongo.Collection('categories');
Pubs = new Mongo.Collection('pubs');
Styles = new Mongo.Collection('styles');


// INIT
//***********************************
Meteor.subscribe('breweries');
Meteor.subscribe('beers');
Meteor.subscribe('pubs');

Meteor.startup(function (){
  GoogleMaps.load();
});

Session.setDefault('prefPane', null);
Session.setDefault('breweryId', 0);
Session.setDefault('beerId', 0);

var mmpMarkers = [],
    mmpInfowindowsHandlers = [];

// FUNCTIONS
//***********************************
// remove all set markers from the map and associated infowindows
function removeMarkers () {
  var map = GoogleMaps.maps.mmpMap.instance;
  mmpInfowindowsHandlers.forEach(function (handler) {
    google.maps.event.removeListener(handler);
  });
  
  mmpMarkers.forEach(function (marker) {
    marker.setMap(null);
  });
  mmpMarkers = [];
}

function infoWindowTemplate (pub) {
  var contentString = '<h5 class="infowindow-title text-left">' + pub.name + '</h5>' +
                      '<p class="infowindow-content text-left">' + pub.address.number + ' ' + pub.address.street + '<br/>' +
                      pub.address.zipcode + ' - ' + pub.address.city + '</p>';
  return contentString;
}

// redraw pubs based on current map bounds
function refreshMap () {
  // set the query to find matching pubs
  var query = {};
  if (!Session.equals('beerId', 0)) {
    query.beers = Session.get('beerId');
  }
  
  // retrieve mmpMap and its bounds
  var map = GoogleMaps.maps.mmpMap.instance,
      mapBounds = map.getBounds();

  // clear old markers and infowindows
  if (!!mmpMarkers.length) {
    removeMarkers();
  }

  // Put each pub in bounds on the map
  Pubs.find(query).forEach(function (pub) {

    // retrieve LatLng of the current pub
    var latlng = new google.maps.LatLng(pub.address.geoloc.lat, pub.address.geoloc.lng);
    
    // place on the map if in bounds
    if (mapBounds.contains(latlng)) {
      var marker = new google.maps.Marker({
        map: map,
        position: latlng,
        title: pub.name
      });

      var contentString = infoWindowTemplate(pub),
          infoWindow = new google.maps.InfoWindow({ content: contentString }),
          handler = google.maps.event.addListener(marker, 'click', function () {
            infoWindow.open(map, marker);
          });

      mmpMarkers.push(marker);
      mmpInfowindowsHandlers.push(handler);
    }
  });
}

// geocoding function to store pub location
function geoCode (address) {
  var geocoder = new GeoCoder();
  geocoder.geocode(address, function (result) {
    console.log(result[0]);
    console.log(result[0]);
    console.log(result[0].geometry);
  });
}

/*/ update the user location
function updateUserLocation () {
  if (!!navigator.geolocation) {
    navigator.geolocation.watchPosition(function (position) {
      var LatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      GoogleMaps.maps.mmpMap.instance.setCenter(LatLng);
    }, { enableHighAccuracy: true });
  }
}
*/

// BODY
//***********************************
Template.body.events({
  "click .fa-stack": function (e) {
    var prefPane = e.currentTarget.id;
    Session.set('prefPane', prefPane);
  }
});

Template.body.helpers({
  prefPane: function () {
    return Session.get('prefPane');
  }
});

// MAP
//***********************************
Template.map.helpers({
  mmpMapOptions: function() {
    // Make sure the maps API has loaded
    if (GoogleMaps.loaded()) {
      // Map initialization options
      return {
        center: new google.maps.LatLng(45.7674631, 4.8335123),
        zoom: 17,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
    }
  }
});

Template.map.onCreated(function () {
  GoogleMaps.ready('mmpMap', function (map) {
    setTimeout(function () {
      refreshMap();
    }, 1000);

    // set pubs on map when loaded
    google.maps.event.addListenerOnce(map.instance, 'tilesloaded', refreshMap);

    // add listener to refresh pubs when map is dragged or zoom changed
    google.maps.event.addListener(map.instance, 'zoom_changed', refreshMap);
    google.maps.event.addListener(map.instance, 'dragend', refreshMap);

    // watch user location
    /*
    if (!!navigator.geolocation) {
      navigator.geolocation.watchPosition(function (position) {
        var LatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        GoogleMaps.maps.mmpMap.instance.setCenter(LatLng);
      }, console.error, { enableHighAccuracy: true });
    }
    */
  });
});

// ADDBEER
//***********************************
Template.addBeer.events({
  'click .fa-times': function () {
    Session.set('prefPane', null);
  },
  'submit': function (e) {
      alert('clicked');

      return false;
  }
});

// ADDPLACE
//***********************************
Template.addPlace.events({
  'click .fa-times': function () {
    Session.set('prefPane', null);
  },
  'click .btn-search': function (e) {
      e.preventDefault();
      var address = $('#pubAddress').val();
      
      var result = Meteor.call('geoCode', address, function (err, result) {
        // check if result contains an error
        if (result.error) {
          $('#pref-pane-alert').removeClass('hidden');
          console.log(result.error);
        }

        else {
          // result ok
          console.log(result);
          
          $('#pref-pane-alert').addClass('hidden');
          $('button.btn').text('Submit!').removeClass('btn-search').addClass('btn-confirm');
        }
      });
      
      return false;
  }
});

// BREWERY
//***********************************
Template.breweryOption.helpers({
  isSelectedBrewery: function () {
    return this.id === Session.get('breweryId') ? "selected" : "";
  }
});

// PREFERENCES
//***********************************
Template.preferences.helpers({
  breweries: function () {
    return Breweries.find({});
  },
  beers: function () {
    var breweryId = Session.get('breweryId');

    if (!!breweryId) {
      return Beers.find({ 'brewery_id': breweryId }, { sort: { name: 1 }});
    }
    else {
      return Beers.find({}, { sort: { name: 1 }});  
    }
  }
});

Template.preferences.onRendered(function () {
  $('#brewery').val(Session.get('breweryId'));
  $('#beer').val(Session.get('beerId'));
});

Template.preferences.events({
  'click .fa-times': function () {
    Session.set('prefPane', null);
  },
  'change #brewery': function (e) {
    var breweryId = parseInt($('#' + e.currentTarget.id + ' option:selected').val(), 10);
    //console.log(breweryId);
    Session.set('breweryId', breweryId);
  },
  'change #beer': function (e) {
    var beerId = parseInt($('#' + e.currentTarget.id + ' option:selected').val(), 10);
    Session.set('beerId', beerId);

    // refresh map based on selected beer
    refreshMap();
  }
});