<?php

define('DB_SERVER', getenv('IP'));
define('DB_USERNAME', getenv('C9_USER'));
define('DB_PASSWORD', "");
define('DB_NAME', "c9");

function __getDB () {
    try {
        $conn = new PDO("mysql:host=".DB_SERVER.";dbname=".DB_NAME.";charset=utf8", DB_USERNAME, DB_PASSWORD);
        // set the PDO error mode to exception
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $conn;
        
    } catch(PDOException $e) {
        throw new Exception("Connection failed: " . $e->getMessage());
    }
}

?>