function handleAPIError (err) {
  var msg;
  
  // API errors
  if (err.msg) {
    msg = err.msg + '\n' +
          'Code: '+err.code + '\n' +
          'Endpoint: '+err.endpoint + '\n' +
          (err.verb ? 'Verb: '+err.verb + '\n' : '') +
          'Arguments: ['+err.args+']';
  }
  // Others
  else {
    msg = err;
  }
            
  alert(msg);
}

var mmp = angular.module('mmpAdmin', ['ngResource']);

/**
 * Application controller
 * */
mmp.controller('AppCtrl', ['$scope', 'Beers', 'BeerPubs', 'selectedBeer', function ($scope, Beers, BeerPubs, selectedBeer) {
  $scope.formsStatus = [true, false];
  
  $scope.toggleForm = function (i) {
    $scope.formsStatus[i] = !$scope.formsStatus[i];
  };
}]);

/**
 * Pubs menu Ctrl
 * */
mmp.controller('PubMenuCtrl', ['$scope', function ($scope) {
  $scope.menuOpen = false;
  
  $scope.toggleMenu = function () {
    $scope.menuOpen = !$scope.menuOpen;
  };
}]);

/**
 * Schedule Ctrl
 * */
mmp.controller('PubScheduleCtrl', ['$scope', 'Pubs', function ($scope, Pubs) {
  $scope.menuOpen = false;
  
  $scope.toggleMenu = function () {
    $scope.menuOpen = !$scope.menuOpen;
  };
  
  // Schedule times generator
  $scope.pubTimes = [];
  
  var t = moment().hour(0).minute(0).second(0);
  
  for (var i = 0; i < 48; i++) {
    $scope.pubTimes.push(t.format('HH:mm'));
    t.add(30, 'minutes');
  }
  
  // On new schedule submit
  $scope.editScheduleSubmit = function () {
    var schedule = {
      m_o: $scope.pub.m_o, m_c: $scope.pub.m_c,
      tu_o: $scope.pub.tu_o, tu_c: $scope.pub.tu_c,
      w_o: $scope.pub.w_o, w_c: $scope.pub.w_c,
      th_o: $scope.pub.th_o, th_c: $scope.pub.th_c,
      f_o: $scope.pub.f_o, f_c: $scope.pub.f_c,
      sa_o: $scope.pub.sa_o, sa_c: $scope.pub.sa_c,
      su_o: $scope.pub.su_o, su_c: $scope.pub.su_c
    };

    Pubs.editSchedule({ id: $scope.pub.id }, schedule)
        .$promise
        .then(function (data) {
          if (data.error)
            handleAPIError(data.error);
          
          else {
            console.log(data);
            alert($scope.pub.name+"'s schedule has been updated!");
          }
        });

  };
}]);

/**
 * Edit pub's beers Ctrl
 * */
mmp.controller('AddPubBeerCtrl', ['$scope', '$timeout', 'Pubs', 'Breweries', 'selectedBeers', function ($scope, $timeout, Pubs, Breweries, selectedBeers) {
  var isLookingForPub = false,
      isLookingForBrewery = false,
      pubDropdownSelected = null,
      pubDropdownIndex = -1,
      breweryDropdownSelected = false,
      breweryDropdownIndex = -1,
      beerDropdownSelected = false,
      beerDropdownIndex = -1;
  
  $scope.forms = {};
  $scope.pub = {};
  $scope.pubBeers = [];
  $scope.brewery = {};
  
  
  /**
   * Pub form
   * 
   * **********************************************/
  
  $scope.browsePubsResults = function (e) {
    var $dropdown = $('#pubs-typeahead').children();
    
    if ($dropdown.length < 1)
      return;
    
    // on down arrow key
    if (e.keyCode === 40) {
      e.preventDefault();
      pubDropdownIndex = (pubDropdownIndex + 1) % $dropdown.length;
      
      if (!!pubDropdownSelected)
        pubDropdownSelected.toggleClass('dropdown-selected');
        
      pubDropdownSelected = $($dropdown[pubDropdownIndex]);
      pubDropdownSelected.toggleClass('dropdown-selected');
      
      return false;
    }
    
    // on up arrow key
    if (e.keyCode === 38) {
      e.preventDefault();
      pubDropdownIndex = (pubDropdownIndex - 1) % $dropdown.length;
      
      if (pubDropdownIndex < 0)
        pubDropdownIndex = $dropdown.length - 1;
        
      if (!!pubDropdownSelected)
        pubDropdownSelected.toggleClass('dropdown-selected');
        
      pubDropdownSelected = $($dropdown[pubDropdownIndex]);
      pubDropdownSelected.toggleClass('dropdown-selected');
      
      return false;
    }
    
    // on enter key
    if (e.keyCode === 13) {
      e.preventDefault();
      var 
          id = pubDropdownSelected.attr('data-id'),
          selectedPub;
      
      $scope.forms.pubs.some(function (pub) {
        if (pub.id === id) {
          selectedPub = pub;
          return true;
        }
        return false;
      });
      $scope.setFormPub(selectedPub);
      $(e.currentTarget).blur();
    }
    
    // on escape key => empty dropdown
    if (e.keyCode === 27) {
      $scope.forms.pubs = [];
    }
  };
  
  $scope.setFormPub = function (pub) {
    $scope.pub = angular.copy(pub);
    $scope.forms.pub = angular.copy(pub);
    $scope.forms.pubs = [];
    $scope.getPubBeers();
  };
  
  $scope.getPubs = function () {
    if (!isLookingForPub) {
      isLookingForPub = true;
      
      setTimeout(function () {
        var term = $scope.forms.pub.name.trim();
        
        $scope.forms.pubs = [];
        
        if (!!term) {
          Pubs.query({ verb: 'find', term: term })
            .$promise
            .then(function (data) {
              $scope.forms.pubs = angular.copy(data);
              isLookingForPub = false;
            });
        }
        else {
          $scope.$apply(function () {
            $scope.pub = {};
            $scope.forms.pub = {};
            $scope.pubBeers = [];
          });
          isLookingForPub = false;
        }
      }, 500);
    }
  };
  
  $scope.getPubBeers = function () {
    Pubs.query({ id: $scope.pub.id, verb: 'beers' })
      .$promise
      .then(function(data) {
        $timeout(function () {
          $scope.pubBeers = angular.copy(data);
        }, 0);
      });
  };
  
  $scope.deletePubBeer = function (beer) {
    var confirmDeletion = confirm('Remove '+beer.brewery_name+' - '+beer.name+' from '+$scope.pub.name+' menu ?');
    
    if (confirmDeletion) {
      Pubs.removeBeer({ id: $scope.pub.id, term: beer.id })
        .$promise
        .then(function (data) {
          console.log('successfully removed '+data.removed+' beer from menu');
          $scope.getPubBeers($scope.getBeers);
        });
    }
  };
  
  
  /**
   * Breweries form
   * 
   * **********************************************/
  
  $scope.getBreweries = function () {
    if (!isLookingForBrewery) {
      isLookingForBrewery = true;
      
      setTimeout(function () {
        var term = $scope.forms.brewery.name.trim();
        
        $scope.forms.breweries = [];
        
        if (!!term) {
          Breweries.query({ verb: 'find', term: term })
            .$promise
            .then(function (data) {
              $scope.forms.breweries = angular.copy(data);
              isLookingForBrewery = false;
            });
        }
        else {
          $timeout(function () {
            $scope.brewery = {};
            $scope.forms.brewery = {};
          }, 0);
          isLookingForBrewery = false;
        }
      }, 500);
    }
  };
  
  $scope.browseBreweriesResults = function (e) {
    var $dropdown = $('#breweries-typeahead').children();
    
    if ($dropdown.length < 1)
      return;
    
    // on down arrow key
    if (e.keyCode === 40) {
      e.preventDefault();
      breweryDropdownIndex = (breweryDropdownIndex + 1) % $dropdown.length;
      
      if (!!breweryDropdownSelected)
        breweryDropdownSelected.toggleClass('dropdown-selected');
        
      breweryDropdownSelected = $($dropdown[breweryDropdownIndex]);
      breweryDropdownSelected.toggleClass('dropdown-selected');
      
      return false;
    }
    
    // on up arrow key
    if (e.keyCode === 38) {
      e.preventDefault();
      breweryDropdownIndex = (breweryDropdownIndex - 1) % $dropdown.length;
      
      if (breweryDropdownIndex < 0)
        breweryDropdownIndex = $dropdown.length - 1;
        
      if (!!breweryDropdownSelected)
        breweryDropdownSelected.toggleClass('dropdown-selected');
        
      breweryDropdownSelected = $($dropdown[breweryDropdownIndex]);
      breweryDropdownSelected.toggleClass('dropdown-selected');
      
      return false;
    }
    
    // on enter key
    if (e.keyCode === 13) {
      e.preventDefault();
      var 
          id = breweryDropdownSelected.attr('data-id'),
          selectedBrewery;
      
      $scope.forms.breweries.some(function (brewery) {
        if (brewery.id === id) {
          selectedBrewery = brewery;
          return true;
        }
        return false;
      });
      $scope.setFormBrewery(selectedBrewery);
      $(e.currentTarget).blur();
    }
    
    // on escape key => empty dropdown
    if (e.keyCode === 27) {
      $scope.forms.breweries = [];
    }
  };
  
  $scope.setFormBrewery = function (brewery) {
    $scope.brewery = angular.copy(brewery);
    $scope.forms.brewery = angular.copy(brewery);
    $scope.forms.breweries = [];
    
    selectedBeers.reset();
    
    if ($scope.brewery.id) {
      $scope.getBeers();
    }
  };
  
  
  /**
   * Beers form
   * 
   * **********************************************/
  $scope.getBeers = function () {
    if (!$scope.brewery.id)
      return;
    
    Breweries.query({ verb: 'beers', id: $scope.brewery.id })
      .$promise
      .then(function (data) {
        var breweryBeers = angular.copy(data);
        
        // Need to filter the results based on what's already available in the pub
        $timeout(function () {
          $scope.forms.beers = breweryBeers.filter(function (breweryBeer) {
            return !$scope.pubBeers.some(function (pubBeer) {
              return pubBeer.id === breweryBeer.id;
            });
          });
        }, 100);
      });
  };
  
  $scope.setFormBeer = function (beer) {
    $scope.beer = angular.copy(beer);
    $scope.forms.beer = angular.copy(beer);
    $scope.forms.beers = [];
  };
  
  $scope.addBeersToPub = function () {
    var newBeers = selectedBeers.get(),
        total = newBeers.length,
        added = 0;
    
    newBeers.forEach(function (beer_id) {
      Pubs.addBeer({
        pub: $scope.pub.id,
        beer: beer_id
      }).$promise
        .then(function (data) {
          added++;
          
          console.log('added '+beer_id);
          
          // Refresh menu when everything's written to DB
          if (added === total) {
            console.log('all beers processed');
            selectedBeers.reset();
            $scope.getPubBeers();
            $scope.getBeers();
          }
        });
    });
  };
}]);

/**
 * Beers menu Ctrl
 * */
mmp.controller('BeersListCtrl', ['$scope', 'selectedBeers', function ($scope, selectedBeers) {
  $scope.selected = false;
  
  $scope.toggleSelection = function (beer_id) {
    if (!$scope.selected) {
      selectedBeers.add(beer_id);
    }
    else {
      selectedBeers.remove(beer_id);
    }
    
    $scope.selected = !$scope.selected;
  };
}]);

/**
 * Adding a new pub Ctrl
 * */
mmp.controller('AddPubCtrl', ['$scope', 'Pubs', function ($scope, Pubs) {
  
  var formSubmited = false;
  
  $scope.buttonText = 'Search';
  
  $scope.pub = {
    name: '',
    address: '',
    lat: null,
    lng: null
  };
  
  $scope.addPubSubmit = function () {
    if (!formSubmited) {
      formSubmited = true;
      $scope.geoCodePub();
    }
    
    else {
      $scope.savePub();
    }
  };
  
  $scope.geoCodePub = function () {
    var 
        geocoder =  new google.maps.Geocoder(),
        address =   { 'address': $scope.pub.address };
    
    if (!$scope.addPub.$valid) {
      return;
    }
    
    geocoder.geocode(address, function (results, status) {
      // check if result contains an error
      if (status !== google.maps.GeocoderStatus.OK || results.length !== 1) {
        $('#pref-pane-alert').removeClass('hidden');
      }

      else {
        // result ok
        var pub = results[0];
        
        $('#pref-pane-alert').addClass('hidden');
        
        $scope.$apply(function () {
          $scope.buttonText = 'Submit!';
          $scope.pub.address = pub.formatted_address;
          $scope.pub.lat = pub.geometry.location.G;
          $scope.pub.lng = pub.geometry.location.K;
        });
      }
    });
  };
  
  $scope.savePub = function () {
    Pubs.save({}, $scope.pub)
        .$promise
        .then(function (res) {
          alert($scope.pub.name + ' has been successfully added!');
          $scope.pub = {};
          $scope.resetForm();
        });
  };
  
  $scope.resetForm = function () {
    $scope.addPub.$setPristine();
    $scope.addPub.$setUntouched();
    formSubmited = false;
    $scope.buttonText = 'Search';
  };
}]);

/**
 * Adding a new beer or brewery Ctrl
 * */
mmp.controller('AddBeerAndBreweryCtrl', ['$scope', function ($scope) {
  
}]);


/**
 * RESOURCES
 * 
 * ********************************************************/

mmp.factory('Beers', function ($resource) {
  return $resource("/api/beers/:id/:verb/:term", {}, {
    retrieve: {
      method: 'POST',
      isArray: true
    }
  });
});

mmp.factory('Breweries', function ($resource) {
  return $resource("/api/breweries/:id/:verb/:term", {}, {
    retrieve: {
      method: 'POST',
      isArray: true
    }
  });
});

mmp.factory('Categories', function ($resource) {
  return $resource("/api/categories/:id/:verb");
});

mmp.factory('BeerPubs', function ($resource) {
  return $resource("/api/pubs/beer/:id");
});

mmp.factory('Pubs', function ($resource) {
  return $resource("/api/pubs/:id/:verb/:term", {}, {
    addBeer: {
      method: 'POST',
      params: { verb: 'beers' }
    },
    removeBeer: {
      method: 'DELETE',
      params: { verb: 'beer' }
    },
    editSchedule: {
      method: 'POST',
      params: { verb: 'schedule' }
    }
  });
});


/**
 * SERVICES
 * ************************************************/
mmp.service('selectedBeers', function () {
  var selected = [];
  
  this.add = function (beer_id) {
    if (selected.indexOf(beer_id) === -1)
      selected.push(beer_id);
  };
  
  this.remove = function (beer_id) {
    var i = selected.indexOf(beer_id);
    
    selected.splice(i, 1);
  };
  
  this.reset = function () {
    selected = [];
  };
  
  this.get = function () {
    return selected;
  };
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


/**
 * FILTERS
 * 
 * ********************************************************/
mmp.filter('shorten', function () {
 return function (str, size) {
   return str.slice(0, size - 3) + '...';
 };
});

mmp.filter('shortenToPoint', function () {
 return function (str) {
   var i = str.indexOf('. ');
   return i === -1 ? str : str.slice(0, i + 1);
 };
});