<?php

require_once 'db.php';
require_once 'class/abstract.api.php';
require_once 'class/mmp.api.php';

// Get requests from the same server
if (!array_key_exists('HTTP_ORIGIN', $_SERVER)) {
    $_SERVER['HTTP_ORIGIN'] = $_SERVER['SERVER_NAME'];
}

try {
    $mmpAPI = new mmpAPI($_REQUEST['request'], $_SERVER['HTTP_ORIGIN']);
    echo $mmpAPI->process_API();
    
} catch (Exception $e) {
    echo json_encode(Array('error' => $e->getMessage()));
}

?>