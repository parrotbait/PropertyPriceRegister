<?php 

function removePrefix($str, $prefix) {

    if (substr($str, 0, strlen($prefix)) == $prefix) {
        return substr($str, strlen($prefix));
    }
    return $str;
}

ini_set('memory_limit', '2048M');
set_time_limit(18000);
$ini = parse_ini_file(getcwd().'/../config.ini');

$string = file_get_contents(getcwd().'/../bing_accepted.json');
$properties = json_decode($string, true);

$main_properties_csv = file_get_contents(getcwd().'/../csv_processed.json');
$main_properties_json = json_decode($main_properties_csv, true);

$pdo = null;
try {
    $pdo = new PDO('mysql:host=localhost;dbname='.$ini['db_name'], $ini['db_user'], $ini['db_pass']);
} catch (PDOException $e) {
    print "Error!: " . $e->getMessage() . "<br/>";
    die();
}

$property_insert = $pdo->prepare(
    "INSERT INTO properties (lat, lon, source, address, original_address, county, postcode, place_id) VALUES (:lat,:lon,:source,:address,:original_address,:county,:postcode,:place_id)");

$property_check = $pdo->prepare(
        "SELECT id FROM properties WHERE address = :address");
    
$sales_insert = $pdo->prepare(
        "INSERT INTO sales (property_id, price, date) VALUES (:property_id,:price,:date)");

$sales_check = $pdo->prepare(
            "SELECT * FROM sales WHERE property_id = :property_id");
            
$counties_db = $pdo->query("SELECT * from counties")->fetchAll();

$original_addresses = array();
// Find a match with a place_id
foreach ($main_properties_json as $original_address => $original_data) {
    if (array_key_exists("placeId", $original_data)) {
        $original_addresses[$original_data["placeId"]] = $original_address;
    }
}

$counties = array();
foreach ($counties_db as $row) {
    $counties[strtolower($row["name"])] = $row["id"];
}
try {
    $pdo->beginTransaction();
    $count = 0;
    foreach($properties as $property) {
        $address = $property["address"];
        
        $property_check->execute([":address" => $address]);
        $existing_result = $property_check->fetch();
        $property_id = 0;
        if (gettype($existing_result) !== 'boolean' && array_key_exists("id", $existing_result)) {
            $property_id = (int)$existing_result["id"];
        } else {
            $address_components = $property["address_components"];
            $lat = $property["lat"];
            $lon = $property["lon"];
            $place_id = $property["place_id"];
            $original_address = "";
            if ($place_id && strlen($place_id) > 0) {
                if (array_key_exists($place_id, $original_addresses)) {
                    $original_address = $original_addresses[$place_id];
                }
            }
                
            $source = 'bing';
    
            $county = strtolower(removePrefix($address_components["AdminDistrict"], "County "));
            $countyToInsert = (int)$counties[$county];
            $postcode = null;
            if (array_key_exists("PostalCode", $address_components)) {
                $postcode = $address_components["PostalCode"];
            }
            $params = [
                ":lat" => $lat,
                ":lon" => $lon,
                ":source" => $source,
                ":address" => $address, 
                ":county" => $countyToInsert,
                ":postcode" => $postcode,
                ":place_id" => $place_id,
                ":original_address" => $original_address
            ];
            if ($property_insert->execute($params)) {
                $count++;
                if ($count % 1000 == 0) {
                    echo "Inserted address ".$count++."</br>";
                }
                $property_id = $pdo->lastInsertId();
            } else {
                echo "Failed to insert address ".$address."</br>";
                //$property_insert->debugDumpParams();
                //var_dump($params);
                //var_dump($county."----".$counties[$county]);
            }
        }
        
        if ($property_id != 0) {
            $sales_check->execute([":property_id" => $property_id]);
            $existing_sales = $sales_check->fetchAll();
            foreach($property["sales"] as $sale) {
                $date = date($sale["date"]["year"]."-".$sale["date"]["month"]."-".$sale["date"]["day"]);
                $sale_exists = false;
                $this_one = false;
                foreach ($existing_sales as $existing_sale) {
                    $existing_price = (int)$existing_sale["price"];
                    if ($existing_sale["date"] === $date && $existing_price === $sale["price"]) {
                        $sale_exists = true;
                        break;
                    }
                }
                if ($sale_exists) continue;

                if (!$sales_insert->execute([
                    ":property_id" => $property_id,
                    ":date" => $date,
                    ":price" => $sale["price"]
                ])) {
                    echo "Failed to insert sale ".$address."</br>";
                }
            }
        }

        flush();
    }

    $pdo->commit();
} catch (PDOException $e) {
    print "Error!: " . $e->getMessage() . "<br/>";
    $pdo->rollback();
    throw $e;
}

echo "All done!";
//var_dump($json);
?>