<?php 

/*if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    echo json_encode(array("success" => false, "message" => "Only POST requests are supported"));
    die();
}*/

include("db.php");

// Parse query params
$query_array = array();
parse_str($_SERVER["QUERY_STRING"], $query_array);

$query = "SELECT p.id as property_id, s.id as sale_id, p.lat, p.lon, p.source, p.address, p.postcode, p.original_address, c.name as county, s.price, s.date FROM properties p JOIN sales s on s.property_id = p.id JOIN counties c on c.id = p.county";

$has_start_date = array_key_exists("start_date", $query_array);
$where_clause = "";
if ($has_start_date) {
    $where_clause = "s.date >= '".$query_array["start_date"]."'";
}
if (array_key_exists("end_date", $query_array)) {
    if (strlen($where_clause) != 0) {
        $where_clause .=  " and ";
    }
    $where_clause .= "s.date <= '".$query_array["end_date"]."'";
}

$counties = array();
if (array_key_exists("county", $query_array)) {
    array_push($counties, $query_array["county"]);
    if (strlen($where_clause) != 0) {
        $where_clause .=  " and ";
    }
    $counties_list = explode(",", $query_array["county"]);
    if (count($counties_list) > 0) {
        $counties_query = "(";
        foreach ($counties_list as $index=>$county) {
            if ($index > 0) {
                $counties_query .= " OR ";
            }
            $counties_query .= "c.id = ".$county;
        }
        $counties_query .= ")";
        $where_clause .= $counties_query;
    }
}

if (array_key_exists("min-price", $query_array)) {
    if (strlen($where_clause) != 0) {
        $where_clause .=  " and ";
    }
    $where_clause .= " s.price >= ".$query_array["min-price"];
}

if (array_key_exists("max-price", $query_array)) {
    if (strlen($where_clause) != 0) {
        $where_clause .=  " and ";
    }
    $where_clause .= " s.price <= ".$query_array["max-price"];
}

if (array_key_exists("text", $query_array)) {
    if (strlen($where_clause) != 0) {
        $where_clause .=  " and ";
    }

    // TOOD: Lower
    // This is super slow - find a faster way to do it...
    $where_clause .= "LOWER(p.address) LIKE '%".strtolower($query_array["text"])."%'";
}

//var_dump($where_clause);
//exit(1);

$orderBy = "ORDER BY property_id, date DESC, sale_id";
$query .= " WHERE lat IS NOT NULL";
if (strlen($where_clause) > 0) {
    $query .= " AND ".$where_clause;
}
$query .= " ".$orderBy;

//var_dump($query);
//exit(1);

$property_fetch = $pdo->prepare($query);

$property_fetch->execute();
$properties_w_sales = $property_fetch->fetchAll();
$results = array();
$property_being_processed = null;
$sales = array();
$entries = array();
$last_property_id = "";
if (count($properties_w_sales) > 0) {
    //var_dump($properties_w_sales);
    // We get multiple results per property
    // Aggregate them here so we don't see duplicates
    // Watch what the last property id handled was and only add when we move on
    // PS. PHP only having value types makes this awkward...
    foreach ($properties_w_sales as $prop_sale) {
        if ($last_property_id !== $prop_sale["property_id"] &&
            $property_being_processed != null) {
            $last_property_id = $prop_sale["property_id"];
            array_push($results, $property_being_processed);
            $property_being_processed = array();
            $sales = array();
        }

        $property_being_processed["address"] = $prop_sale["address"];
        $property_being_processed["original_address"] = $prop_sale["original_address"];
        $property_being_processed["geo_source"] = $prop_sale["source"];
        $property_being_processed["lat"] = (float)$prop_sale["lat"];
        $property_being_processed["lon"] = (float)$prop_sale["lon"];
        $property_being_processed["county"] = $prop_sale["county"];
        $date = explode('-', $prop_sale["date"]);
        array_push($sales, array("price" => $prop_sale["price"], "date" => array("day" => $date[2], "month" => $date[1], "year" => $date[0]))); 
        $property_being_processed["sales"] = $sales;
    }

    array_push($results, $property_being_processed);
}

header('Content-Type: application/json');
echo json_encode($results);
?>