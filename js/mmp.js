var mmp = angular.module('mapMyPub', ['ngAnimate', 'ngResource']);

mmp.controller('AppCtrl', ['$scope', '$timeout', 'Beers', 'BeerPubs', 'Breweries', 'Categories', 'selectedBeer', function ($scope, $timeout, Beers, BeerPubs, Breweries, Categories, selectedBeer) {
  
  $scope.selectedBeer = selectedBeer;
  $scope.selectedBeerPubs = [];
  
  $scope.$watch('selectedBeer.get()', function (newVal, oldVal) {
    if (newVal === oldVal)
      return;
    
    var beer_id = newVal.id;
      
    if (!!beer_id && typeof beer_id !== 'undefined') {
      BeerPubs.query({ id: beer_id }, function (data) {
        $scope.selectedBeerPubs = data;
        clearMarkers();
        refreshMap();
      });
    }
  });
  
  
  /**
   * PrefPane manager
   * */
  var animationDelay = 160;
  
  $scope.prefPane = {
    template: null,
    active: false
  };
  
  $scope.setPrefPane = function (e) {
    if ($scope.prefPane.active) {
      $scope.closePrefPane();
      $timeout(function () {
        $scope.openPrefPane(e);
      }, animationDelay);
    }
    else
      $scope.openPrefPane(e);
  }
  
  $scope.openPrefPane = function (e) {
    $scope.prefPane = {
      template: 'templates/' + e.currentTarget.id + '.html',
      active: true
    };
  };
  
  $scope.closePrefPane = function () {
    $scope.prefPane = {
      template: null,
      active: false
    };
  };
  
  /**
   * Google Maps API properties
   * */
  var mapOptions = {
        center: new google.maps.LatLng(45.7674631, 4.8335123),
        zoom: 17,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      },
      openedInfowindow = null,
      mmpMarkers = [],
      mmpInfowindowsHandlers = [];

  $scope.map = new google.maps.Map(document.getElementById('mmpMap'), mapOptions);
  
  // set pubs on map when loaded
  google.maps.event.addListenerOnce($scope.map, 'tilesloaded', refreshMap);

  // add listener to refresh pubs when map is dragged or zoom changed
  google.maps.event.addListener($scope.map, 'zoom_changed', refreshMap);
  google.maps.event.addListener($scope.map, 'dragend', refreshMap);
  
  // redraw pubs based on current map bounds
  function refreshMap () {
    // retrieve mmpMap and its bounds
    var mapBounds = $scope.map.getBounds();
  
    // clear old markers and infowindows
    /*
    if (!!mmpMarkers.length) {
      removeMarkers();
    }
    */
  
    // Put each pub in bounds on the map
    $scope.selectedBeerPubs.forEach(function (pub) {
  
      // retrieve LatLng of the current pub
      var latlng = new google.maps.LatLng(pub.lat, pub.lng),
          alreadySet = mmpMarkers.some(function (marker) {
            return marker.title === pub.name;
          });
      
      // place on the map if in bounds and not already set
      if (mapBounds.contains(latlng) && !alreadySet) {
        var marker = new google.maps.Marker({
          map: $scope.map,
          position: latlng,
          title: pub.name
        });
  
        var contentString = infoWindowTemplate(pub),
            infoWindow = new google.maps.InfoWindow({ content: contentString }),
            handler = google.maps.event.addListener(marker, 'click', function () {
              infoWindow.open($scope.map, marker);
            });
  
        mmpMarkers.push(marker);
        mmpInfowindowsHandlers.push(handler);
        styleInfoWindow(infoWindow);
      }
    });
  }
  
  function styleInfoWindow (infowindow) {
    google.maps.event.addListener(infowindow, 'domready', function() {
       var iwOuter = $('.gm-style-iw'),
           iwBackground = iwOuter.prev(),
           iwCloser = iwOuter.next();
           
       iwBackground.css({'display' : 'none'});
       iwCloser.addClass('iw-closer');
    });
  }
  
  function removeMarkers () {
    // retrieve mmpMap and its bounds
    var mapBounds = $scope.map.getBounds();
    
    mmpMarkers.forEach(function (marker) {
      if (!mapBounds.contains(marker.position)) {
        var index = mmpMarkers.indexOf(marker),
            handler = mmpInfowindowsHandlers[index];
        
        marker.setMap(null);
        mmpMarkers.splice(index, 1);
        google.maps.event.removeListener(handler);
        mmpInfowindowsHandlers.splice(index, 1);
      }
    });
  }
  
  function clearMarkers () {
    mmpMarkers.forEach(function (marker) {
      marker.setMap(null);
    });
    
    mmpInfowindowsHandlers.forEach(function (handler) {
      google.maps.event.removeListener(handler);
    });
    
    mmpInfowindowsHandlers = [];
    mmpMarkers = [];
  }
  
  function infoWindowTemplate (pub) {
    var contentString = '<h5 class="infowindow-title text-left">' + pub.name + '</h5>' +
                        '<p class="infowindow-content text-left">' + pub.address + '</p>' +
                        '<p class="infowindow-status ' + (isOpen(pub) ? 'pub-open' : 'pub-closed') + '">' + (isOpen(pub) ? 'Open!' : 'Closed') + '</p>' +
                        '<dl class="dl-horizontal text-left">' +
                        infoWindowOpenHours('Mon', pub.m_o, pub.m_c) +
                        infoWindowOpenHours('Tue', pub.tu_o, pub.tu_c) +
                        infoWindowOpenHours('Wed', pub.w_o, pub.w_c) +
                        infoWindowOpenHours('Thu', pub.th_o, pub.th_c) +
                        infoWindowOpenHours('Fri', pub.f_o, pub.f_c) +
                        infoWindowOpenHours('Sat', pub.sa_o, pub.sa_c) +
                        infoWindowOpenHours('Sun', pub.su_o, pub.su_c) +
                        '<dl/>';
    return contentString;
  }
  
  function infoWindowOpenHours (day, open, close) {
    return '<dt>' + day + '</dt><dd>' + open + ' - ' + close + '</dd>';
  }
  
  function isOpen (pub) {
    var days = ['su', 'm', 'tu', 'w', 'th', 'f', 'sa'],
        currentMoment = moment(),
        today = currentMoment.day(),
        mysql_day = days[today],
        openMoment = moment(pub[mysql_day + '_o'], 'HH:mm'),
        closeMoment = moment(pub[mysql_day + '_c'], 'HH:mm');
    
    return currentMoment.isBetween(openMoment, closeMoment);
  }
  
}]);


mmp.controller('FindBeerCtrl', ['$scope', 'Beers', 'selectedBeer', function ($scope, Beers, selectedBeer) {

  $scope.beerInput = selectedBeer.get();
  
  $scope.beer = selectedBeer.get();
  
  $scope.beers = [];
  
  $scope.displayInfoPanel = false;
  
  $scope.showInfoPanel = function () {
    if (!!$scope.beer.id) {
      $scope.displayInfoPanel = true;
    }
  };
  
  $scope.hideInfoPanel = function () {
    $scope.displayInfoPanel = false;
  };
  
  $scope.setFormBeer = function (beer) {
    Beers.get({ id: beer.id }, function (data) {
      $scope.beerInput = data;
      $scope.beer = angular.copy(data);
      selectedBeer.set(angular.copy(data));
    });
    
    $scope.beers = [];
  };
  
  $scope.getBeers = function () {
    var term = $scope.beerInput.name.trim();
    
    $scope.hideInfoPanel();
    $scope.beers = [];
    
    if (!!term) {
      Beers.retrieve({}, { 
          filters: ['brewery'], 
          limit: 10, 
          research: term 
          
        }, function (data) {
          $scope.beers = data;
      });
    }
  };
}]);


mmp.controller('AddBeerCtrl', ['$scope', '$timeout', 'Beers', 'Breweries', 'Categories', function ($scope, $timeout, Beers, Breweries, Categories) {
  
  $scope.brewery = { 
    name: ''
  };
  $scope.beer = {
    name: '',
    description: ''
  };
  
  $scope.breweries = [];
  
  $scope.setFormBrewery = function (brewery) {
    $scope.brewery = brewery;
    $scope.breweries = [];
  };
  
  $scope.getBreweries = function () {
    var term = $scope.brewery.name.trim();
    
    $scope.breweries = [];
    
    if (!!term) {
      Breweries.query({ verb: 'find', term: term }, function (data) {
        $scope.breweries = data;
      });
    }
  };
  
  
  Categories.query({ verb: null }, function (data) {
    $scope.categories = data;
  });
}]);


mmp.controller('AddPlaceCtrl', ['$scope', function ($scope) {
  $scope.pub = {
    name: '',
    address: ''
  };
  
  $scope.geoCodePub = function () {
    var 
        geocoder =  new google.maps.Geocoder(),
        address =   { 'address': $scope.pub.address };
    
    if (!$scope.addPlace.$valid) {
      return;
    }
    
    geocoder.geocode(address, function (results, status) {
      // check if result contains an error
      if (status !== google.maps.GeocoderStatus.OK || results.length !== 1) {
        $('#pref-pane-alert').removeClass('hidden');
      }

      else {
        // result ok
        console.log(results);
        $('#pref-pane-alert').addClass('hidden');
        $('button.btn').text('Submit!').removeClass('btn-search').addClass('btn-confirm');
      }
    });
  };
}]);

mmp.factory('Beers', function ($resource) {
  return $resource("/api/beers/:id/:verb/:term", {}, {
    retrieve: {
      method: 'POST',
      isArray: true
    }
  });
});

mmp.factory('Breweries', function ($resource) {
  return $resource("/api/breweries/:id/:verb/:term");
});

mmp.factory('Categories', function ($resource) {
  return $resource("/api/categories/:id/:verb");
});

mmp.factory('BeerPubs', function ($resource) {
  return $resource("/api/pubs/beer/:id");
});

mmp.service('selectedBeer', function () {
  var selected = {};
  this.set = function (beer) {
    selected = beer;
  };
  this.get = function () {
    return selected;
  };
});