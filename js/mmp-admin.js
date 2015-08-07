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

mmp.controller('AddPubCtrl', ['$scope', 'Pubs', function ($scope, Pubs) {
  
  var formSubmited = false;
  
  $scope.buttonText = 'Search';
  
  $scope.pub = {
    name: '',
    address: '',
    lat: null,
    lng: null
  };
  
  $scope.resetSubmitState = function () {
    formSubmited = false;
    $scope.$apply(function () {
      $scope.buttonText = 'Search';
    });
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
    var newPub = new Pubs($scope.pub);
    
    newPub.$save({}, function (res) {
      $scope.pub.id = res.id;
      alert($scope.pub.name + ' has been successfully added!');
    });
  };
}]);

/**
 * Beers menu Ctrl
 * */
mmp.controller('PubMenuCtrl', ['$scope', function ($scope) {
  $scope.menuOpen = false;
  
  $scope.toggleMenu = function () {
    $scope.menuOpen = !$scope.menuOpen;
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
        }, 0);
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