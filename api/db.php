<?php 

ini_set('memory_limit', '2048M');

$ini = parse_ini_file(getcwd().'/../config.ini');

header('Access-Control-Allow-Origin: *'); 

$pdo = null;
try {
    $pdo = new PDO('mysql:host=localhost;dbname='.$ini['db_name'], $ini['db_user'], $ini['db_pass']);
} catch (PDOException $e) {
    print "Error!: " . $e->getMessage() . "<br/>";
    die();
}

$pdo->exec("SET CHARACTER SET utf8");

?>