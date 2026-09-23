<?php
/**
 * PocketMine-MP Phar Helper for AvPocket
 * Safely extracts metadata and files from .phar archives.
 */

if ($argc < 2) {
    echo json_encode(["error" => "Phar path missing"]);
    exit(1);
}

$pharPath = $argv[1];
$action = $argv[2] ?? "inspect";

if (!file_exists($pharPath)) {
    echo json_encode(["error" => "File not found: " . $pharPath]);
    exit(1);
}

try {
    $phar = new Phar($pharPath);
    
    if ($action === "plugin_yml") {
        if (isset($phar['plugin.yml'])) {
            echo $phar['plugin.yml']->getContent();
            exit(0);
        } else {
            echo json_encode(["error" => "plugin.yml not found inside phar"]);
            exit(1);
        }
    }

    if ($action === "extract_all") {
        $destDir = $argv[3] ?? null;
        if (!$destDir) {
            echo json_encode(["error" => "Destination directory required"]);
            exit(1);
        }
        if (!is_dir($destDir)) {
            mkdir($destDir, 0777, true);
        }
        $phar->extractTo($destDir, null, true);
        echo json_encode(["success" => true, "extractedTo" => $destDir]);
        exit(0);
    }

    // Default: Inspect
    $fileList = [];
    foreach (new RecursiveIteratorIterator($phar) as $file) {
        $fileList[] = str_replace("phar://" . $pharPath . "/", "", $file->getPathname());
    }

    $pluginYmlContent = isset($phar['plugin.yml']) ? $phar['plugin.yml']->getContent() : null;

    echo json_encode([
        "success" => true,
        "filesCount" => count($fileList),
        "files" => array_slice($fileList, 0, 100), // First 100 files
        "hasPluginYml" => ($pluginYmlContent !== null),
        "pluginYml" => $pluginYmlContent,
    ]);
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
    exit(1);
}
