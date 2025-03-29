<?php

include('./admin/parameters.php');
include($_SERVER['DOCUMENT_ROOT'] . $directory_pass . 'database/access.php');

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
	$uuid = $uuids->$name;
}

if (isset($uuid)) {
	if (preg_match('/[0-9a-fA-F\-]{36}/', $uuid, $matches)) {
		$uuid = $matches[0];
		$url = "https://livetrack.garmin.com/services/session/" . $uuid . "/trackpoints";
		// Utiliser file_get_contents pour récupérer le contenu de l'URL
		$json = file_get_contents($url);
		
		//$gpx = file_get_contents("test.gpx");
	
		if ($json == false) {
				echo "No download";
		} else {
			$data = json_decode($json, true);
			$gpx = new SimpleXMLElement('<gpx version="1.1" xmlns:locus="http://www.locusmap.eu"></gpx>');
			// Ajouter une trace (trk)
			$namespace = 'http://www.locusmap.eu';
			
			$lastLoc = end($data['trackPoints']);
			$wpt = $gpx->addChild('wpt');
			$wpt->addAttribute('lat', $lastLoc['position']['lat']);
			$wpt->addAttribute('lon', $lastLoc['position']['lon']);
			$wpt->addChild('name', $name);
			$wpt->addChild('sym', 'Bike Trail');

			$trk = $gpx->addChild('trk');
			$trk->addChild('name', $name);
			$trkext = $trk->addChild('extensions');
			$trkextline = $trkext->addChild('line');
			$trkextline->addAttribute('xmlns', "http://www.topografix.com/GPX/gpx_style/0/2");
			$trkextline->addChild('color', 'FF0000');
			$trkextline->addChild('opacity', '0.78');
			$trkextline->addChild('width', '3.0');
			$trkextlineext = $trkextline->addChild('extensions');
			$trkextlineext->addChild('locus:lsColorBase', '#C8FF0000', $namespace);
			$trkextlineext->addChild('locus:lsWidth', '3.0', $namespace);
			$trkextlineext->addChild('locus:lsUnits', 'PIXELS', $namespace);
			$trkext->addChild('locus:activity', 'cycling', $namespace);
			$trkseg = $trk->addChild('trkseg');
		
			// Parcourir les données JSON et ajouter les points de trace
			foreach ($data['trackPoints'] as $loc) {
				$trkpt = $trkseg->addChild('trkpt');
				$pos = $loc['position'];
				$trkpt->addAttribute('lat', $pos['lat']);
				$trkpt->addAttribute('lon', $pos['lon']);
			}
			
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
