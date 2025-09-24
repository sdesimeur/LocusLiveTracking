<?php

class AutoSaver {
	private $data = [];
	private $file = '';
	public function __construct($dir, $name) {
		//$this->file = $_SERVER['DOCUMENT_ROOT'] . $dir . 'database/' . $name;
		$this->file = $dir . $name;
		if (file_exists($this->file)) {
			$this->data = unserialize(file_get_contents($this->file));
		}
	}

	public function __get($name) {
		return $this->data[$name] ?? null;
	}

	public function __set($name, $value) {
		$this->data[$name] = $value;
		file_put_contents($this->file, serialize($this->data));
	}
}

// Utilisation
$uuids = new AutoSaver($directory_pass . 'database/', 'uuids');
$datas = new AutoSaver($directory_pass . 'database/', 'datas');
?>
