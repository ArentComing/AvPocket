<?php

declare(strict_types=1);

namespace AvPocket\Licensing;

/**
 * PocketMine-MP License Verification Trait for AvPocket
 * 
 * Usage in your PluginBase:
 * 
 * class Main extends PluginBase {
 *     use PocketMineLicenseCheckTrait;
 * 
 *     public function onEnable(): void {
 *         if (!$this->verifyAvPocketLicense("AVP-XXXX-XXXX-XXXX-XXXX")) {
 *             $this->getLogger()->critical("License invalid or expired! Disabling plugin.");
 *             $this->getServer()->getPluginManager()->disablePlugin($this);
 *             return;
 *         }
 *         $this->getLogger()->info("License active and verified via av-api.ir!");
 *     }
 * }
 */
trait PocketMineLicenseCheckTrait {

    /**
     * Verifies the license key with AvPocket DRM API.
     *
     * @param string $licenseKey The customer's AVP license key
     * @param string $apiUrl Endpoint URL (defaults to av-api.ir)
     * @return bool True if valid, false otherwise
     */
    protected function verifyAvPocketLicense(string $licenseKey, string $apiUrl = "https://av-api.ir/api/v1/license/verify"): bool {
        $server = $this->getServer();
        $payload = json_encode([
            "licenseKey" => $licenseKey,
            "serverIp" => $server->getIp() ?: "127.0.0.1",
            "serverPort" => $server->getPort(),
            "pmmpVersion" => $server->getPocketMineVersion(),
        ]);

        $opts = [
            "http" => [
                "method" => "POST",
                "header" => "Content-Type: application/json\r\n" .
                            "User-Agent: AvPocket-PMMP-DRM/1.0\r\n",
                "content" => $payload,
                "timeout" => 5.0,
                "ignore_errors" => true,
            ]
        ];

        try {
            $context = stream_context_create($opts);
            $result = @file_get_contents($apiUrl, false, $context);
            if ($result === false) {
                // If offline or network error, log warning
                $this->getLogger()->warning("Could not reach AvPocket license server. Retrying next restart.");
                return false;
            }

            $response = json_decode($result, true);
            return isset($response["valid"]) && $response["valid"] === true;
        } catch (\Throwable $e) {
            $this->getLogger()->error("License check error: " . $e->getMessage());
            return false;
        }
    }
}
