<?php
include('./admin/parameters.php');
//include($_SERVER['DOCUMENT_ROOT'] . $directory_pass . 'database/access.php');
include($directory_pass . 'database/access.php');
//include('./database/access.php');

if (!isset($_SERVER["HTTP_HOST"])) {
  parse_str($argv[1], $_GET);
  parse_str($argv[1], $_POST);
  $_SERVER['DOCUMENT_ROOT'] = "$HOME";
  $url = "$HOME/tmp/garmin_test.html";
}

if (isset($_GET['pass'])) {
	// Extraire et nettoyer le contenu de la variable
	$pass = $_GET['pass'];
}
if (isset($_POST['pass'])) {
	// Extraire et nettoyer le contenu de la variable
	$pass = $_POST['pass'];
}

if (isset($_GET['uuid'])) {
	// Extraire et nettoyer le contenu de la variable
	$uuid = $_GET['uuid'];
}
if (isset($_POST['uuid'])) {
	// Extraire et nettoyer le contenu de la variable
	$uuid = $_POST['uuid'];
}

if (isset($_GET['name'])) {
	// Extraire et nettoyer le contenu de la variable
	$name = strtolower($_GET['name']);
}
if (isset($_POST['name'])) {
	// Extraire et nettoyer le contenu de la variable
	$name = strtolower($_POST['name']);
}

if (isset($name)) {
	if ($pass != $datas->pass) {
		echo "Access denied!";
		exit(0);
	}
	$uuid = $uuids->$name['uuid'];
	$token = $uuids->$name['token'];
}

function prettyPrint( $json )
{
    $result = '';
    $level = 0;
    $in_quotes = false;
    $in_escape = false;
    $ends_line_level = NULL;
    $json_length = strlen( $json );

    for( $i = 0; $i < $json_length; $i++ ) {
        $char = $json[$i];
        $new_line_level = NULL;
        $post = "";
        if( $ends_line_level !== NULL ) {
            $new_line_level = $ends_line_level;
            $ends_line_level = NULL;
        }
        if ( $in_escape ) {
            $in_escape = false;
        } else if( $char === '"' ) {
            $in_quotes = !$in_quotes;
        } else if( ! $in_quotes ) {
            switch( $char ) {
                case '}': case ']':
                    $level--;
                    $ends_line_level = NULL;
                    $new_line_level = $level;
                    break;

                case '{': case '[':
                    $level++;
                case ',':
                    $ends_line_level = $level;
                    break;

                case ':':
                    $post = " ";
                    break;

                case " ": case "\t": case "\n": case "\r":
                    $char = "";
                    $ends_line_level = $new_line_level;
                    $new_line_level = NULL;
                    break;
            }
        } else if ( $char === '\\' ) {
            $in_escape = true;
        }
        if( $new_line_level !== NULL ) {
            $result .= "\n".str_repeat( "\t", $new_line_level );
        }
        $result .= $char.$post;
    }

    return $result;
}

if (isset($uuid)) {
	if (preg_match('/[0-9a-fA-F\-]{36}/', $uuid, $matches)) {
		$uuid = $matches[0];
		if (! isset($url))
		{
			$url = "https://livetrack.garmin.com/session/" . $uuid . "/token/" . $token;
			#$url = "https://livetrack.garmin.com/services/session/" . $uuid . "/trackpoints";
			// Utiliser file_get_contents pour récupérer le contenu de l'URL
			//$json = file_get_contents($url);
		}
		$html = file_get_contents($url);
		file_put_contents($_SERVER['DOCUMENT_ROOT'] . '/tmp/garmin.txt', $html);
	
		if ($html == false || $html == NULL) {
				echo "No download";
		} else {
			$html = str_replace('\\', '', $html);
			$pattern = '#^.*<script\s*>[^{]*({[^<]*trackPoints[^<]*})[^}]*</script\s*>.*$#';
			preg_match($pattern, $html, $matches);
			$json = str_replace('$', '', $matches[1]);
			$json = str_replace('null', '', $json);
			//$objstr = $matches[1];
			//echo prettyPrint($objstr) . "\n";
			$json = preg_replace('/[[:^print:]]/', '', $json);
			//$objstr = mb_convert_encoding($objstr, "UTF-8");
			$data = json_decode($json, $associative = true);
			echo 'Last error: ' . json_last_error_msg() . "\n";
			var_dump($data);
			$words = $datas->words;
			$gpx = new SimpleXMLElement('<gpx version="1.1"  xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3" xmlns:gpxtrkx="http://www.garmin.com/xmlschemas/TrackStatsExtension/v1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v2" xmlns:locus="http://www.locusmap.eu"></gpx>');
			// Ajouter une trace (trk)
			$namespace_locus = 'http://www.locusmap.eu';
			$namespace_gpxtpx = 'http://www.garmin.com/xmlschemas/TrackPointExtension/v2';
			
			//$lastLoc = end($data['trackPoints']);
			$wpt = $gpx->addChild('wpt');
			//$wpt->addAttribute('lat', $lastLoc['position']['lat']);
			//$wpt->addAttribute('lon', $lastLoc['position']['lon']);
			$wpt->addChild('name', $name);

			$trk = $gpx->addChild('trk');
			$trk->addChild('name', $name);
			$trkext = $trk->addChild('extensions');
			$trkextline = $trkext->addChild('line');
			$trkextline->addAttribute('xmlns', "http://www.topografix.com/GPX/gpx_style/0/2");
			$trkextline->addChild('color', 'FF0000');
			$trkextline->addChild('opacity', '0.78');
			$trkextline->addChild('width', '3.0');
			$trkextlineext = $trkextline->addChild('extensions');
			$trkextlineext->addChild('locus:lsColorBase', '#C8FF0000', $namespace_locus);
			$trkextlineext->addChild('locus:lsWidth', '3.0', $namespace_locus);
			$trkextlineext->addChild('locus:lsUnits', 'PIXELS', $namespace_locus);
			$trkextactivity = $trkext->addChild('locus:activity', '', $namespace_locus);
			$trkseg = $trk->addChild('trkseg');
			//$previous_dist = 0;
			// Parcourir les données JSON et ajouter les points de trace
			foreach ($data['trackPoints'] as $loc) {
				$words[] = $loc['fitnessPointData']['activityType'];
				$pos = $loc['position'];
				if ($pos['lat'] != 0 && $pos['lon']!=0) {
					$lastLoc = $loc;
					$trkpt = $trkseg->addChild('trkpt');
					$trkpt->addAttribute('lat', $pos['lat']);
					$trkpt->addAttribute('lon', $pos['lon']);
					$trkpt->addChild('ele', $loc['altitude']);
					$trkpt->addChild('time', $loc['dateTime']);
					$trkptext = $trkpt->addChild('extensions');
					$trkptext = $trkptext->addChild('gpxtpx:TrackPointExtension', '', $namespace_gpxtpx);
					//$trkptext->addChild('gpxtpx:course', $loc['distanceMeters'] - $previous_dist, $namespace_gpxtpx);
					$trkptext->addChild('gpxtpx:cad', $loc['fitnessPointData']['cadenceCyclesPerMin'], $namespace_gpxtpx);
					$trkptext->addChild('gpxtpx:hr', $loc['fitnessPointData']['heartRateBeatsPerMin'], $namespace_gpxtpx);
					//$previous_dist = $loc['fitnessPointData']['distanceMeters'];
					//$trkpt = $trkseg->addChild('trkpt');
				}
			}
			$trkextactivity = $trkext->addChild('locus:activity', strtolower($lastLoc['fitnessPointData']['activityType']), $namespace_locus);
			$datas->words = array_unique($words);
			
			$wpt->addAttribute('lat', $lastLoc['position']['lat']);
			$wpt->addAttribute('lon', $lastLoc['position']['lon']);
			$wpt->addChild('time', $lastLoc['dateTime']);
			$wpt->addChild('ele', $lastLoc['altitude']);
			switch (strtolower($lastLoc['fitnessPointData']['activityType'])) {
			case 'swimming':
				$sym = 'sport-swim-outdoor';
				break;
			case 'running':
				$sym = 'sport-hiking';
				break;
			case 'cycling':
				$sym = 'sport-cyclngsport';
				break;
			default:
				$sym = 'z-ico02';
				break;
			}
			$wpt->addChild('sym', $sym);
			
			
			// Ajouter un waypoint pour la dernière localisation
			// Format le XML pour afficher
			$dom = new DOMDocument('1.0');
			$dom->preserveWhiteSpace = false;
			$dom->formatOutput = true;
			$dom->loadXML($gpx->asXML());
			
			// Sauvegarder le résultat dans un fichier ou l'afficher
			header('Content-Type: application/gpx+xml');
			//header('Content-Type: application/json');
			echo $dom->saveXML();

		}
	} else {
		echo "Le format de l'UUID est invalide.";
	}
} else {
	echo "La variable 'uuid' n'est pas définie.";
}

?>
