<?php
/**
 * AvPocket PocketMine-MP Phar Compiler
 * Takes a directory and compiles it into a valid, optimized .phar package.
 */

if ($argc < 3) {
    echo json_encode(["error" => "Usage: php phar-builder.php <sourceDir> <outputPharPath> [mainEntry]"]);
    exit(1);
}

$sourceDir = rtrim($argv[1], '/\\');
$outputPharPath = $argv[2];
$mainEntry = $argv[3] ?? null;

if (!is_dir($sourceDir)) {
    echo json_encode(["error" => "Source directory does not exist: $sourceDir"]);
    exit(1);
}

// Remove existing phar if present
if (file_exists($outputPharPath)) {
    unlink($outputPharPath);
}

// Make sure output dir exists
$outDir = dirname($outputPharPath);
if (!is_dir($outDir)) {
    mkdir($outDir, 0777, true);
}

try {
    $phar = new Phar($outputPharPath, 0, basename($outputPharPath));
    $phar->startBuffering();

    // Iterate directory and add files
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($sourceDir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    $fileCount = 0;
    foreach ($iterator as $item) {
        $filePath = $item->getPathname();
        $relPath = str_replace('\\', '/', substr($filePath, strlen($sourceDir) + 1));

        // Skip git and hidden files
        if (str_starts_with($relPath, '.git') || str_starts_with($relPath, '.github')) {
            continue;
        }

        if ($item->isFile()) {
            $phar->addFile($filePath, $relPath);
            $fileCount++;
        }
    }

    // Default PocketMine Phar Stub
    $stub = "<?php __HALT_COMPILER(); ?>";
    $phar->setStub($stub);

    // Set SHA1 or SHA256 signature
    $phar->setSignatureAlgorithm(Phar::SHA1);
    $phar->stopBuffering();

    echo json_encode([
        "success" => true,
        "filesPackaged" => $fileCount,
        "pharPath" => $outputPharPath,
        "pharSize" => filesize($outputPharPath),
    ]);
    exit(0);
} catch (Exception $e) {
    echo json_encode([
        "error" => "Phar compilation failed: " . $e->getMessage()
    ]);
    exit(1);
}
