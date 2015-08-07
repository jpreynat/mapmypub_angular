<?php

class mmpAPI extends API {
    
    public function __construct ($request, $origin) {
        parent::__construct($request);
    }
    
    
    /**
     * Endpoint: api/beers
     * GET Methods
     *      api/beers
     *          @params none
     *          @return an array of all beers
     * 
     *      api/beers/id
     *          @params id: integer
     *          @return the corresponding beer object
     * 
     *      api/beers/brewery/brewery_id
     *          alias of api/breweries/id/beers
     *          @params brewery_id: integer
     *          @return an array of all beers for this brewery
     * 
     *      api/beers/category/category_id
     *          alias of api/categories/id/beers
     *          @params category_id: integer
     *          @return an array of all beers for this category
     * 
     *      api/beers/find/term
     *          @params term: string
     *          @return an array of all beers whose part of the name or brewery name matches the term parameter
     * 
     *      api/beers/id/pubs
     *          @params id: integer
     *          @return an array of all pubs where one can drink this beer
     * 
     * POST Methods
     *      api/beers
     *          @params none
     *          @payload    [{string}]  filters: additionnal columns to retrieve, one or many of 'brewery', 'category', 'style', 'description', 'abv'
     *                      {integer}   limit: the max number of rows to retrieve. defaults to 50. will never exceeds 300
     *                      {string}    research: lookup for beers (and breweries if 'brewery' included in filters) names
     *          @return     [beers object] corresponding to the payload
     * 
     * Default sort order is beer.name
     * 
     * */
    protected function beers ($args) {
        
        if ($this->method == 'GET') {
            // Endpoint allowed verbs
            $allowedVerbs = array(
                'find' => true,
                'brewery' => true,
                'category' => true
            );
            
            $findById = false;
            $findPubs = false;
            
            $query =    "SELECT " .
                            "beers.id AS id, " .
                            "beers.name AS name, " . 
                            "beers.abv AS abv, " .
                            "beers.descript AS description, " .
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
            
            $pubsQuery =    "SELECT " .
                                "pubs.id AS id, " .
                                "pubs.name AS name, " .
                                "pubs.lat AS lat, " .
                                "pubs.lng AS lng, " .
                                "pubs.address AS address, " .
                                "pubs.descript AS description " .
                            "FROM beers " .
                            "INNER JOIN beers_pubs ON beers.id = beers_pubs.beer_id " .
                            "INNER JOIN pubs ON pubs.id = beers_pubs.pub_id" ;
            
            // Endpoint called with a verb
            if ($this->verb !== '') {
                // Reject unhandled verb methods
                if (!array_key_exists($this->verb, $allowedVerbs)) {
                    return $this->generate_error(1);
                }
                
                // Treat verb methods
                switch ($this->verb) {
                    // Find all beers corresponding to a category_id
                    case 'category':
                        if (count($args) !== 1) {
                            return $this->generate_error(2);
                        }
                        $category_id = $args[0];
                        $query .= " WHERE categories.id = $category_id";
                        break;
                        
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
                // One numeric argument + 'pubs' => search for pubs
                else if (count($args) == 2 && is_numeric($args[0]) && $args[1] == 'pubs') {
                    $id = $args[0];
                    $pubsQuery .=   " WHERE beers.id = $id" .
                                    " ORDER BY pubs.name";
                    $findPubs = true;
                }
                
                // API don't handle more arguments for this endpoint
                else if (count($args) > 1) {
                    return $this->generate_error(2);
                }
            }
            
            // Order by selection
            // Default to beer name
            $query .= " ORDER BY beers.name ";
            
            // Limit
            // Default to 100
            $query .= " LIMIT 100 ";
            
            if ($findPubs) {
                $query = $pubsQuery;
            }
            
            $conn = __getDB();
            $fetch = $conn->query($query);
            
            $results = Array();
            
            while($result = $fetch->fetch(PDO::FETCH_ASSOC)) {
                $results[] = $result;
            }
            
            $fetch->closeCursor();
            return $findById ? $results[0] : $results;
        }
        
        else if ($this->method == 'POST') {
            // Transcodifaction from application/json payload
            if (empty($_POST)) {
                $_POST = json_decode(file_get_contents('php://input'), true);
            }
            
            // Endpoint allowed verbs
            $allowedVerbs = array(
            );
            
            // Endpoint called with a verb
            if ($this->verb !== '') {
                // Reject unhandled verb methods
                if (!array_key_exists($this->verb, $allowedVerbs)) {
                    return $this->generate_error(1);
                }
            
                // Treat verb methods
                switch ($this->verb) {
                    // Find a beer by LIKE on name
                    default:
                        if (count($args) !== 0) {
                            return $this->generate_error(2);
                        }
                        break;
                }
            }
            
            /**
             * TODO: Additionnal controls on payload values
             * */
            $filters =  (array_key_exists('filters', $_POST) ?  $_POST['filters']   : []);
            $research = (array_key_exists('research', $_POST) ? $_POST['research']  : '');
            $limit =    (array_key_exists('limit', $_POST) ?    $_POST['limit']     : 50);
            
            if ($limit > 300)
                $limit = 300;
            /**
             * */
            
            $query =                                            "SELECT" .
                                                                "  beers.id AS id" .
                                                                ", beers.name AS name" . 
                        (in_array('abv', $filters) ?            ", beers.abv AS abv"                                                : "") .
                        (in_array('description', $filters) ?    ", beers.descript AS description"                                   : "") .
                        (in_array('brewery', $filters) ?        ", breweries.id AS brewery_id" .
                                                                ", breweries.name AS brewery_name"                                  : "") .
                        (in_array('category', $filters) ?       ", categories.id AS category_id" .
                                                                ", categories.cat_name AS category_name"                            : "") .
                        (in_array('style', $filters) ?          ", styles.id AS style_id" .
                                                                ", styles.style_name AS style_name"                                 : "") .
                                                                " FROM beers" .
                        (in_array('brewery', $filters) ?        " LEFT OUTER JOIN breweries ON beers.brewery_id = breweries.id "    : "") .
                        (in_array('category', $filters) ?       " LEFT OUTER JOIN categories ON beers.cat_id = categories.id "      : "") .
                        (in_array('style', $filters) ?          " LEFT OUTER JOIN styles ON beers.style_id = styles.id"             : "") .
                        (!!$research ?                          " WHERE beers.name LIKE '%$research%' " .
                        (in_array('brewery', $filters) ?        " OR    breweries.name LIKE '%$research%' "                         : "")
                                                                                                                                    : "");
            
            $query .= " ORDER BY beers.name";
            $query .= " LIMIT $limit";
            
            $conn = __getDB();
            $fetch = $conn->query($query);
            
            $results = Array();
            
            while($result = $fetch->fetch(PDO::FETCH_ASSOC)) {
                $results[] = $result;
            }
            
            $fetch->closeCursor();
            return $results;
        }
        
        else {
            return $this->generate_error(0);
        }
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
                        "breweries.name AS name " . /*, " . 
                        /*"breweries.country AS country, " .
                        "breweries.website AS website, " .
                        "breweries.descript AS description " .*/
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
        
        // Set limit to 10 by default
        $limit = (isset($limit) ? $limit : 10);
        $query .= " LIMIT $limit";
        
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
     * Endpoint: api/categories
     * Methods
     *      api/categories
     *          @params none
     *          @return an array of all categories
     * 
     *      api/categories/id
     *          @params id: integer
     *          @return the corresponding category object
     * 
     *      api/categories/id/beers
     *          @params id: integer
     *          @return an array of all beers for this category
     * 
     * Default sort order is category.name
     * 
     * */
    protected function categories ($args) {
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
                        "categories.id AS id, " .
                        "categories.cat_name AS name " .
                    "FROM categories ";
        
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
                $query .= " WHERE categories.id = $id";
                $findById = true;
            }
            
            // One numeric argument with verb beers => lookup by ID and retrieve beers
            // Calls api/beers/brewery/id
            if (count($args) == 2 && is_numeric($args[0]) && $args[1] == 'beers') {
                $category_id = $args[0];
                $this->endpoint = 'beers';
                $this->verb = 'category';
                return $this->beers([$category_id]);
            }
            
            // API don't handle more than 2 arguments for this endpoint
            if (count($args) > 2) {
                return $this->generate_error(2);
            }
        }
        
        // Order by selection
        // Default to beer name
        $query .= " ORDER BY categories.cat_name ";
        
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
     * Endpoint: api/pubs
     * Methods
     *      api/pubs
     *          @params none
     *          @return an array of all pubs
     * 
     *      api/pubs/id
     *          @params id: integer
     *          @return the corresponding pub object
     * 
     *      api/pubs/beer/id
     *          @params id: integer
     *          @return an array of all pubs where one can find this beer
     * 
     * Default sort order is pub.name
     * 
     * */
    protected function pubs ($args) {
        // Endpoint allowed verbs
        $allowedVerbs = array(
            'beer' => true,
            'find' => true
        );
        
        /* Handle deleting a pub's beer */
        if ($this->method == 'DELETE') {
            
            // Endpoint allowed verbs
            $allowedVerbs = array(
            );
            
            // Get the DB connection
            $conn = __getDB();
            
            // Endpoint called with a verb
            if ($this->verb !== '') {
                // Reject unhandled verb methods
                if (!array_key_exists($this->verb, $allowedVerbs)) {
                    return $this->generate_error(1);
                }
            
                // Treat verb methods
                switch ($this->verb) {
                    default:
                        return $this->generate_error(2);
                        break;
                }
            }
            
            // No verb
            else {
                // Request to pubs/:pub_id/beer/:beer_id
                if (count($args) == 3 && is_numeric($args[0]) && $args[1] == 'beer' && is_numeric($args[2])) {
                    $pub_id = $args[0];
                    $beer_id = $args[2];
                    
                    $query =    "DELETE from beers_pubs" .
                                " WHERE beer_id = $beer_id" .
                                " AND pub_id = $pub_id";
                }
                
                else {
                    return $this->generate_error(2);
                }
            }
            
            $removed = $conn->exec($query);
            
            return array('removed' => $removed);
        }
        
        /* Handle posting a new pub or adding beers to a pub*/
        if ($this->method == 'POST') {
            // Transcodifaction from application/json payload
            if (empty($_POST)) {
                $_POST = json_decode(file_get_contents('php://input'), true);
            }
            
            // Endpoint allowed verbs
            $allowedVerbs = array(
                'beers' => true
            );
            
            // Get the DB connection
            $conn = __getDB();
            
            // Endpoint called with a verb
            if ($this->verb !== '') {
                // Reject unhandled verb methods
                if (!array_key_exists($this->verb, $allowedVerbs)) {
                    return $this->generate_error(1);
                }
            
                // Treat verb methods
                switch ($this->verb) {
                    // Add beers to a pub
                    case 'beers':
                    default:
                        if (count($args) !== 0) {
                            return $this->generate_error(2);
                        }
                        
                        // Checking POST params
                        if (count($_POST) != 2 && (!in_array('beer', $_POST) || !in_array('pub', $_POST))) {
                            return $this->generate_error(3);
                        }
                        
                        $beer_id = $conn->quote($_POST['beer']);
                        $pub_id = $conn->quote($_POST['pub']);
                        
                        $query =    "INSERT INTO beers_pubs (" .
                                    "beer_id, pub_id, last_mod" .
                                    ") VALUES (" .
                                    "$beer_id,$pub_id,NOW()" .
                                    ");";
                        
                        break;
                }
            }
            
            else {
                /**
                 * TODO: Additionnal controls on payload values
                 * */
                if (!array_key_exists('name', $_POST) && !array_key_exists('address', $_POST)) {
                    return $this->generate_error(3);
                }
                
                $pub = $_POST;
                
                // Escaping strings
                foreach ($pub as &$value) {
                    if (is_string($value))
                        $value = $conn->quote($value);
                }
                
                $query =                                            "INSERT INTO pubs (" .
                                                                    "last_mod " .
                                                                    ", name" .
                                                                    ", address" .
                                                                    ", lat" .
                                                                    ", lng" .
                             (in_array('description', $pub) ?       ", descript"        : "") .
                             (in_array('add_user', $pub) ?          ", add_user"        : "") .
                             (in_array('m_o', $pub) ?               ", monday_open"     : "") .
                             (in_array('m_c', $pub) ?               ", monday_close"    : "") .
                             (in_array('tu_o', $pub) ?              ", tuesday_open"    : "") .
                             (in_array('tu_c', $pub) ?              ", tuesday_close"   : "") .
                             (in_array('w_o', $pub) ?               ", wednesday_open"  : "") .
                             (in_array('w_c', $pub) ?               ", wednesday_close" : "") .
                             (in_array('th_o', $pub) ?              ", thursday_open"   : "") .
                             (in_array('th_c', $pub) ?              ", thursday_close"  : "") .
                             (in_array('f_o', $pub) ?               ", friday_open"     : "") .
                             (in_array('f_c', $pub) ?               ", friday_close"    : "") .
                             (in_array('sa_o', $pub) ?              ", saturday_open"   : "") .
                             (in_array('sa_c', $pub) ?              ", saturday_close"  : "") .
                             (in_array('su_o', $pub) ?              ", sunday_open"     : "") .
                             (in_array('su_c', $pub) ?              ", sunday_close"    : "") .
                                                                    ") VALUES (" .
                                                                    "NOW()" .
                                                                    ", " . $pub['name'] .
                                                                    ", " . $pub['address'] .
                                                                    ", " . $pub['lat'] .
                                                                    ", " . $pub['lng'] .
                             (in_array('description', $pub) ?       ", " . $pub['description']     : "") .
                             (in_array('add_user', $pub) ?          ", " . $pub['add_user']        : "") .
                             (in_array('m_o', $pub) ?               ", " . $pub['monday_open']     : "") .
                             (in_array('m_c', $pub) ?               ", " . $pub['monday_close']    : "") .
                             (in_array('tu_o', $pub) ?              ", " . $pub['tuesday_open']    : "") .
                             (in_array('tu_c', $pub) ?              ", " . $pub['tuesday_close']   : "") .
                             (in_array('w_o', $pub) ?               ", " . $pub['wednesday_open']  : "") .
                             (in_array('w_c', $pub) ?               ", " . $pub['wednesday_close'] : "") .
                             (in_array('th_o', $pub) ?              ", " . $pub['thursday_open']   : "") .
                             (in_array('th_c', $pub) ?              ", " . $pub['thursday_close']  : "") .
                             (in_array('f_o', $pub) ?               ", " . $pub['friday_open']     : "") .
                             (in_array('f_c', $pub) ?               ", " . $pub['friday_close']    : "") .
                             (in_array('sa_o', $pub) ?              ", " . $pub['saturday_open']   : "") .
                             (in_array('sa_c', $pub) ?              ", " . $pub['saturday_close']  : "") .
                             (in_array('su_o', $pub) ?              ", " . $pub['sunday_open']     : "") .
                             (in_array('su_c', $pub) ?              ", " . $pub['sunday_close']    : "") .
                                                                    ");";
            }
            
            $conn->exec($query);
            
            return array('id' => $conn->lastInsertId());
        }
        
        /* Handle GET methods */
        else if ($this->method != 'GET') {
            return $this->generate_error(0);
        }
        
        $query =    "SELECT " .
                        "  pubs.id AS id" .
                        ", pubs.name AS name" .
                        ", pubs.lat AS lat" .
                        ", pubs.lng AS lng" .
                        ", pubs.address AS address" .
                        ", pubs.descript AS description" .
                        ", TIME_FORMAT(pubs.monday_open, '%H:%i') AS m_o" .
                        ", TIME_FORMAT(pubs.monday_close, '%H:%i') AS m_c" .
                        ", TIME_FORMAT(pubs.tuesday_open, '%H:%i') AS tu_o" .
                        ", TIME_FORMAT(pubs.tuesday_close, '%H:%i') AS tu_c" .
                        ", TIME_FORMAT(pubs.wednesday_open, '%H:%i') AS w_o" .
                        ", TIME_FORMAT(pubs.wednesday_close, '%H:%i') AS w_c" .
                        ", TIME_FORMAT(pubs.thursday_open, '%H:%i') AS th_o" .
                        ", TIME_FORMAT(pubs.thursday_close, '%H:%i') AS th_c" .
                        ", TIME_FORMAT(pubs.friday_open, '%H:%i') AS f_o" .
                        ", TIME_FORMAT(pubs.friday_close, '%H:%i') AS f_c" .
                        ", TIME_FORMAT(pubs.saturday_open, '%H:%i') AS sa_o" .
                        ", TIME_FORMAT(pubs.saturday_close, '%H:%i') AS sa_c" .
                        ", TIME_FORMAT(pubs.sunday_open, '%H:%i') AS su_o" .
                        ", TIME_FORMAT(pubs.sunday_close, '%H:%i') AS su_c " .
                    "FROM pubs";
        
        // Endpoint called with a verb
        if ($this->verb !== '') {
            // Reject unhandled verb methods
            if (!array_key_exists($this->verb, $allowedVerbs)) {
                return $this->generate_error(1);
            }
            
            // Treat verb methods
            switch ($this->verb) {
                // Research by pub name LIKE...
                case 'find':
                    if (count($args) !== 1) {
                        return $this->generate_error(2);
                    }
                    
                    $research = $this->remove_accents($args[0]);
                    $query .=   " WHERE LOWER(pubs.name) LIKE LOWER('%$research%')" .
                                " OR LOWER(pubs.address) LIKE LOWER('%$research%')";
                    break;
                
                // Find all pubs serving a beer
                case 'beer':
                default:
                    if (count($args) !== 1) {
                        return $this->generate_error(2);
                    }
                    $beer_id = $args[0];
                    $query .=   " INNER JOIN beers_pubs ON pubs.id = beers_pubs.pub_id" .
                                " INNER JOIN beers ON beers.id = beers_pubs.beer_id" ;
                    $query .=   " WHERE beers.id = $beer_id";
                    break;
            }
        }
        
        // No verb passed to endpoint
        else {
            // One numeric argument => lookup by ID
            if (count($args) == 1 && is_numeric($args[0])) {
                $id = $args[0];
                $query .= " WHERE pubs.id = $id";
                $findById = true;
            }
            
            // One numeric argument & beers => find all beers from this pub
            if (count($args) == 2 && is_numeric($args[0]) && $args[1] == 'beers') {
                $pub_id = $args[0];
                $query =    "SELECT" .
                            "  pubs.id AS pub_id" .
                            ", beers.id AS id" .
                            ", beers.name AS name" .
                            ", beers.descript AS description" .
                            ", beers.abv AS abv" .
                            ", breweries.name AS brewery_name" .
                            " FROM pubs" .
                            " INNER JOIN beers_pubs ON pubs.id = beers_pubs.pub_id" .
                            " INNER JOIN beers ON beers.id = beers_pubs.beer_id" .
                            " LEFT OUTER JOIN breweries ON beers.brewery_id = breweries.id" .
                            " WHERE pubs.id = $pub_id";
            }
            
            // API don't handle more than 1 argument for this endpoint
            else if (count($args) > 1) {
                return $this->generate_error(2);
            }
        }
        
        // Order by selection
        // Default to beer name
        $query .= " ORDER BY name ";
        
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
            2 => "Wrong number of arguments",
            3 => "Incorrect payload for POST method"
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