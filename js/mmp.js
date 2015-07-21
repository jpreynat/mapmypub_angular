var mmp = angular.module('mapMyPub', ['ngAnimate', 'ngResource']);

mmp.controller('AppCtrl', ['$scope', '$timeout', 'Beers', 'Breweries', function ($scope, $timeout, Beers, Breweries) {
  /**
   * Beers properties
   * *
  Beers.query(function (data) {
    $scope.beers = data;
  });
  */
  
  Breweries.query(function (data) {
    $scope.breweries = data;
    $scope.brewery = {
      id: 1
    };
  });
  
  $scope.getBreweryBeers = function () {
    Breweries.get({ id: $scope.brewery.id }, function (data) {
      $scope.brewery = data;
      console.log($scope.brewery);
    });
  };
  
  
  
  /**
   * PrefPane properties
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
  };

  $scope.map = new google.maps.Map(document.getElementById('mmpMap'), mapOptions);
}]);

mmp.factory('Beers', function($resource) {
  return $resource("/api/beers/:id");
});

mmp.factory('Breweries', function($resource) {
  return $resource("/api/breweries/:id");
});