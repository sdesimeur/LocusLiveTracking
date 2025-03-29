<?php
// Vérifier si le formulaire a été soumis
if ($_SERVER["REQUEST_METHOD"] == "POST") {
	include('../admin/parameters.php');
	include($_SERVER['DOCUMENT_ROOT'] . $directory_pass . 'database/access.php');
	// Capturer l'pass envoyé par le formulaire
	$pass = $_POST['pass'];
	$datas->pass = $pass;
	// Afficher l'pass
	echo "<h2>Password changé</h2>";
} else {
	// Si le formulaire n'a pas encore été soumis, afficher le formulaire
	?>
	<!DOCTYPE html>
	<html lang="fr">
	<head>
		<meta charset="UTF-8">
		<title>Demande d'Identifiant</title>
	</head>
	<body>
		<h1>Veuillez entrer votre pass</h1>
		<!-- Le formulaire HTML pour entrer l'pass -->
		<form action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>" method="post">
			<label for="pass">Password:</label>
			<input type="text" id="pass" name="pass" required>
			<button type="submit">Envoyer</button>
		</form>
	</body>
	</html>
	<?php
}
?>

