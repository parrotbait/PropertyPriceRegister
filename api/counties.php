<?php
include("db.php");

$query = "SELECT * from counties";
$counties_query = $pdo->prepare($query);

$counties_query->execute();
$counties_res = $counties_query->fetchAll();

$counties = array();
foreach ($counties_res as $county) {
    array_push($counties, array("id" => $county["id"], "name" => $county["name"]));
}

header('Content-Type: application/json');
echo json_encode($counties);

?>