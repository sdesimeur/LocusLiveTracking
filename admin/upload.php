<?php

include('../admin/parameters.php');
include($_SERVER['DOCUMENT_ROOT'] . $directory_pass . 'database/access.php');

if (isset($_FILES['fichier']) && $_FILES['fichier']['error'] === UPLOAD_ERR_OK) {
	$tmpName = $_FILES['fichier']['tmp_name'];
	$dest = $_SERVER["DOCUMENT_ROOT"] . '/tmp/mail.txt';
		echo "Fichier uploadé vers : $dest\r\n";

	if (move_uploaded_file($tmpName, $dest)) {
		echo "Fichier uploadé avec succès : $dest\r\n";
	} else {
		echo "Erreur lors du déplacement du fichier";
		exit(1);
	}
} else {
	echo "Erreur d'upload";
	exit(1);
}

$path = $dest;
if (file_exists($path)) {
	$content = file_get_contents($path);
	$content=nl2br(htmlspecialchars($content));
}

$pattern = '#https://livetrack\.garmin\.com/session/([a-f0-9\-]{36})/#i';

if (preg_match($pattern, $content, $matches)) {
	$uuid = $matches[1];
	echo "UUID trouvé : $uuid\r\n";
} else {
	echo "Aucun UUID Garmin LiveTrack trouvée.";
	exit(1);
}

$pattern0 = '#des mises =C3=A0 jour Livetrack de ([0-9a-zA-Z]*) \.#i';
//$pattern1 = '#>Invitation de ([0-9a-zA-Z]*)</div>#i';
if (preg_match($pattern0, $content, $matches)) {
//} else if (preg_match($pattern1, $content, $matches)) {	i
} else {
	echo "Aucun user Garmin LiveTrack trouvée.";
	exit(1);
}
$user = strtolower($matches[1]);
echo "User trouvé : $user\r\n";

#if (!isset($store->uuids)) $store->uuids = [];
$uuids->$user = $uuid;

?>
