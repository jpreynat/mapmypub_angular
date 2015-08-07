var mmp = angular.module('mapMyPub', ['ngAnimate', 'ngResource']);

/**
 * Application controller
 * */
mmp.controller('AppCtrl', ['$scope', 'Beers', 'BeerPubs', 'selectedBeer', function ($scope, Beers, BeerPubs, selectedBeer) {
  
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
    else {
      clearMarkers();
    }
  });
  
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
  
  // add specific classes to info window elements for CSS styling using jQuery
  function styleInfoWindow (infowindow) {
    google.maps.event.addListener(infowindow, 'domready', function() {
       var iwOuter = $('.gm-style-iw'),
           iwBackground = iwOuter.prev(),
           iwCloser = iwOuter.next();
           
       iwBackground.css({'display' : 'none'});
       iwCloser.addClass('iw-closer');
    });
  }
  
  // remove unuseful markers from the map
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
  
  // clear all set markers on the map
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
  
  // Google Map info window generator
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
  
  // schedule formatter
  function infoWindowOpenHours (day, open, close) {
    return  '<dt>' + day + '</dt><dd>' + open + ' - ' + close + '</dd>';
  }
  
  // is a pub open at this exact moment
  function isOpen (pub) {
    var 
        days =                  ['su', 'm', 'tu', 'w', 'th', 'f', 'sa'],
        currentTime =           moment(),
        
        mysql_yesterday =       moment().subtract(1, 'd').day(),
        yesterday =             days[mysql_yesterday],
        yesterday_open_sched =  moment.duration(pub[yesterday + '_o'], 'HH:mm'),
        yesterday_close_sched = moment.duration(pub[yesterday + '_c'], 'HH:mm'),
        yesterday_open =        moment().hour(0).minute(0).second(0),
        yesterday_close =       moment().hour(0).minute(0).second(0),
        
        mysql_today =           moment().day(),
        today =                 days[mysql_today],
        today_open_sched =      moment.duration(pub[today + '_o'], 'HH:mm'),
        today_close_sched =     moment.duration(pub[today + '_c'], 'HH:mm'),
        today_open =            moment().hour(0).minute(0).second(0),
        today_close =           moment().hour(0).minute(0).second(0);
    
    yesterday_open.add(yesterday_open_sched);
    yesterday_close.add(yesterday_close_sched);
    
    today_open.add(today_open_sched);
    today_close.add(today_close_sched);
    
    // Fix closing times based on schedule
    if (yesterday_close_sched.hours() < yesterday_open_sched.hours()) {
      yesterday_close.add(1, 'd');
    }
    
    if (today_close_sched.hours() < today_open_sched.hours()) {
      today_close.add(1, 'd');
    }
    
    return currentTime.isBetween(yesterday_open, yesterday_close) || currentTime.isBetween(today_open, today_close);
  }
  
}]);

/**
 * Main input controller
 * */
mmp.controller('FindBeerCtrl', ['$scope', 'Beers', 'selectedBeer', function ($scope, Beers, selectedBeer) {
  var isLookingForBeer = false,
      dropdownSelected = null,
      dropdownIndex = -1;
  
  $scope.beerInput = selectedBeer.get();
  
  $scope.beer = selectedBeer.get();
  
  $scope.beers = [];
  
  $scope.displayInfoPanel = false;
  
  $scope.browseResults = function (e) {
    var $dropdown = $('#beers-typeahead').children();
    
    if ($dropdown.length < 1)
      return;
    
    // on down arrow key
    if (e.keyCode === 40) {
      e.preventDefault();
      dropdownIndex = (dropdownIndex + 1) % $dropdown.length;
      
      if (!!dropdownSelected)
        dropdownSelected.toggleClass('dropdown-selected');
        
      dropdownSelected = $($dropdown[dropdownIndex]);
      dropdownSelected.toggleClass('dropdown-selected');
      
      return false;
    }
    
    // on up arrow key
    if (e.keyCode === 38) {
      e.preventDefault();
      dropdownIndex = (dropdownIndex - 1) % $dropdown.length;
      
      if (dropdownIndex < 0)
        dropdownIndex = $dropdown.length - 1;
        
      if (!!dropdownSelected)
        dropdownSelected.toggleClass('dropdown-selected');
        
      dropdownSelected = $($dropdown[dropdownIndex]);
      dropdownSelected.toggleClass('dropdown-selected');
      
      return false;
    }
    
    // on enter key
    if (e.keyCode === 13) {
      e.preventDefault();
      var beer = {
            id: dropdownSelected.attr('data-id')
          };
      
      $scope.setFormBeer(beer);
      $(e.currentTarget).blur();
    }
  };
  
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
    if (!isLookingForBeer) {
      setTimeout(function () {
        isLookingForBeer = true;
        
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
              isLookingForBeer = false;
          });
        }
        else {
          selectedBeer.set({});
          $scope.beer = {};
          isLookingForBeer = false;
        }
      }, 500);
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