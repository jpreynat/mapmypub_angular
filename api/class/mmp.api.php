<?php

class mmpAPI extends API {
    
    public function __construct ($request, $origin) {
        parent::__construct($request);
    }
    
    
    /**
     * Endpoint: api/beers
     * Methods
     *      api/beers
     *          @params none
     *          @return an array of all beers
     * 
     *      api/beers/id
     *          @params id: integer
     *          @return the corresponding beer object
     * 
     *      api/beers/brewery/brewery_id
     *          @params brewery_id: integer
     *          @return an array of all beers for this brewery
     * 
     *      api/beers/find/term
     *          @params term: string
     *          @return an array of all beers whose part of the name or brewery name matches the term parameter
     * 
     * Default sort order is beer.name
     * 
     * */
    protected function beers ($args) {
        // Endpoint allowed verbs
        $allowedVerbs = array(
            'find' => true,
            'brewery' => true
        );
        
        $findById = false;
        
        if ($this->method != 'GET') {
            return $this->generate_error(0);
        }
        
        $query =    "SELECT " .
                        "beers.id AS id, " .
                        "beers.name AS name, " . 
                        "breweries.id AS brewery_id, " .
                        "breweries.name AS brewery_name, " .
                        "categories.id AS category_id, " .
                        "categories.cat_name AS category_name, " .
                        "styles.id AS style_id, " .
                        "styles.style_name AS style_name " .
                    "FROM beers " .
                    "LEFT OUTER JOIN breweries ON beers.brewery_id = breweries.id " .
                    "LEFT OUTER JOIN categories ON beers.cat_id = categories.id " .
                    "LEFT OUTER JOIN styles ON beers.style_id = styles.id" ;
        
        // Endpoint called with a verb
        if ($this->verb !== '') {
            // Reject unhandled verb methods
            if (!array_key_exists($this->verb, $allowedVerbs)) {
                return $this->generate_error(1);
            }
            
            // Treat verb methods
            switch ($this->verb) {
                // Find all beers corresponding to a brewery_id
                case 'brewery':
                    if (count($args) !== 1) {
                        return $this->generate_error(2);
                    }
                    $brewery_id = $args[0];
                    $query .= " WHERE breweries.id = $brewery_id";
                    break;
                
                // Find a beer by LIKE on name
                case 'find':
                default:
                    if (count($args) !== 1) {
                        return $this->generate_error(2);
                    }
                    $research = $this->remove_accents($args[0]);
                    $query .=   " WHERE LOWER(beers.name) LIKE LOWER('%$research%')" .
                                " OR LOWER(breweries.name) LIKE LOWER('%$research%')";
                    break;
            }
        }
        
        // No verb passed to endpoint
        else {
            // One numeric argument => lookup by ID
            if (count($args) == 1 && is_numeric($args[0])) {
                $id = $args[0];
                $query .= " WHERE beers.id = $id";
                $findById = true;
            }
            // API don't handle more arguments for this endpoint
            if (count($args) > 1) {
                return $this->generate_error(2);
            }
        }
        
        // Order by selection
        // Default to beer name
        $query .= " ORDER BY beers.name ";
        
        $conn = __getDB();
        $fetch = $conn->query($query);
        
        $results = Array();
        
        while($result = $fetch->fetch(PDO::FETCH_ASSOC)) {
            $results[] = $result;
        }
        
        $fetch->closeCursor();
        return $findById ? $results[0] : $results;
    }
    
    /**
     * Endpoint: api/breweries
     * Methods
     *      api/breweries
     *          @params none
     *          @return an array of all breweries
     * 
     *      api/breweries/id
     *          @params id: integer
     *          @return the corresponding beer object
     * 
     *      api/breweries/id/beers
     *          alias of api/beers/brewery/brewery_id
     *          @params id: integer
     *          @return an array of all beers for this brewery
     * 
     *      api/breweries/find/term
     *          @params term: string
     *          @return an array of all breweries whose part of the name matches the term parameter
     * 
     * Default sort order is brewery.name
     * 
     * */
    protected function breweries ($args) {
        // Endpoint allowed verbs
        $allowedVerbs = array(
            'find' => true
        );
        
        $findById = false;
        
        if ($this->method != 'GET') {
            return $this->generate_error(0);
        }
        
        $query =    "SELECT " .
                        "breweries.id AS id, " .
                        "breweries.name AS name, " . 
                        "breweries.country AS country, " .
                        "breweries.website AS website, " .
                        "breweries.descript AS description " .
                    "FROM breweries ";
        
        // Endpoint called with a verb
        if ($this->verb !== '') {
            // Reject unhandled verb methods
            if (!array_key_exists($this->verb, $allowedVerbs)) {
                return $this->generate_error(1);
            }
            
            // Treat verb methods
            switch ($this->verb) {
                // Find a brewery by LIKE on name
                case 'find':
                default:
                    if (count($args) !== 1) {
                        return $this->generate_error(2);
                    }
                    $research = $this->remove_accents($args[0]);
                    $query .=   " WHERE LOWER(breweries.name) LIKE LOWER('%$research%')";
                    break;
            }
        }
        
        // No verb passed to endpoint
        else {
            // One numeric argument => lookup by ID
            if (count($args) == 1 && is_numeric($args[0])) {
                $id = $args[0];
                $query .= " WHERE breweries.id = $id";
                $findById = true;
            }
            
            // One numeric argument with verb beers => lookup by ID and retrieve beers
            // Calls api/beers/brewery/id
            if (count($args) == 2 && is_numeric($args[0]) && $args[1] == 'beers') {
                $brewery_id = $args[0];
                $this->endpoint = 'beers';
                $this->verb = 'brewery';
                return $this->beers([$brewery_id]);
            }
            
            // API don't handle more than 2 arguments for this endpoint
            if (count($args) > 2) {
                return $this->generate_error(2);
            }
        }
        
        // Order by selection
        // Default to brewery name
        $query .= " ORDER BY breweries.name ";
        
        $conn = __getDB();
        $fetch = $conn->query($query);
        
        $results = Array();
        
        while($result = $fetch->fetch(PDO::FETCH_ASSOC)) {
            $results[] = $result;
        }
        
        $fetch->closeCursor();
        return $findById ? $results[0] : $results;
    }
    
    
    /**
     * Helper functions
     * */
    private function generate_error ($code) {
        $errors = array(
            0 => "Only GET requests are allowed",
            1 => "Verb not allowed",
            2 => "Wrong number of arguments"
        );
        
        return array(
            "error" => array(
                "msg" => $errors[$code], 
                "code" => $code,
                "endpoint" => $this->endpoint,
                "verb" => $this->verb,
                "args" => $this->args
            )
        );
    }
    
    private function remove_accents ($str, $charset='utf-8') {
        $str = htmlentities($str, ENT_NOQUOTES, $charset);
        
        $str = preg_replace('#&([A-za-z])(?:acute|cedil|caron|circ|grave|orn|ring|slash|th|tilde|uml);#', '\1', $str);
        $str = preg_replace('#&([A-za-z]{2})(?:lig);#', '\1', $str); // pour les ligatures e.g. '&oelig;'
        $str = preg_replace('#&[^;]+;#', '', $str); // supprime les autres caractères
        
        return $str;
    }
}

?>