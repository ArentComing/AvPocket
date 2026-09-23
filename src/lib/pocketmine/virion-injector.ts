import fs from "fs";
import path from "path";

export interface VirionDefinition {
  name: string;
  namespace: string;
  version: string;
  description: string;
  files: Record<string, string>; // relativePath -> PHP code
}

// Built-in Virion Library Templates
export const BUILTIN_VIRIONS: Record<string, VirionDefinition> = {
  "poggit/libasynql": {
    name: "poggit/libasynql",
    namespace: "poggit\\libasynql",
    version: "0.4.0",
    description: "Asynchronous SQL database provider for PocketMine-MP supporting SQLite and MySQL.",
    files: {
      "poggit/libasynql/libasynql.php": `<?php
declare(strict_types=1);

namespace poggit\\libasynql;

use pocketmine\\plugin\\PluginBase;

class libasynql {
    public static function create(PluginBase $plugin, array $config, array $initQueries = []): DataConnector {
        return new DataConnector($plugin, $config);
    }
}

class DataConnector {
    private PluginBase $plugin;
    private array $config;

    public function __construct(PluginBase $plugin, array $config) {
        $this->plugin = $plugin;
        $this->config = $config;
    }

    public function executeSelect(string $query, array $args = [], ?callable $onSuccess = null): void {
        if ($onSuccess !== null) {
            $onSuccess([]);
        }
    }

    public function close(): void {}
}
`,
    },
  },

  "jojoe77777/FormAPI": {
    name: "jojoe77777/FormAPI",
    namespace: "jojoe77777\\FormAPI",
    version: "2.1.0",
    description: "Simple, fluid Bedrock UI modal, simple, and custom form creator for PocketMine-MP.",
    files: {
      "jojoe77777/FormAPI/FormAPI.php": `<?php
declare(strict_types=1);

namespace jojoe77777\\FormAPI;

use pocketmine\\form\\Form;
use pocketmine\\player\\Player;

class SimpleForm implements Form {
    private array $data = [];
    private ?\\Closure $callable;

    public function __construct(?callable $callable = null) {
        $this->callable = $callable;
        $this->data["type"] = "form";
        $this->data["title"] = "";
        $this->data["content"] = "";
        $this->data["buttons"] = [];
    }

    public function setTitle(string $title): self {
        $this->data["title"] = $title;
        return $this;
    }

    public function setContent(string $content): self {
        $this->data["content"] = $content;
        return $this;
    }

    public function addButton(string $text, int $imageType = -1, string $imagePath = "", ?string $label = null): self {
        $this->data["buttons"][] = ["text" => $text];
        return $this;
    }

    public function jsonSerialize(): array {
        return $this->data;
    }

    public function handleResponse(Player $player, $data): void {
        if ($this->callable !== null) {
            ($this->callable)($player, $data);
        }
    }
}
`,
    },
  },

  "muqsit/invmenu": {
    name: "muqsit/invmenu",
    namespace: "muqsit\\invmenu",
    version: "4.0.0",
    description: "A PocketMine-MP virion to create virtual inventory menus (chests, hoppers, dispensers).",
    files: {
      "muqsit/invmenu/InvMenu.php": `<?php
declare(strict_types=1);

namespace muqsit\\invmenu;

use pocketmine\\player\\Player;
use pocketmine\\inventory\\Inventory;

class InvMenu {
    public const TYPE_CHEST = "minecraft:chest";
    public const TYPE_DOUBLE_CHEST = "minecraft:double_chest";

    public static function create(string $identifier): self {
        return new self($identifier);
    }

    private string $identifier;
    private string $name = "Menu";

    public function __construct(string $identifier) {
        $this->identifier = $identifier;
    }

    public function setName(string $name): self {
        $this->name = $name;
        return $this;
    }

    public function send(Player $player): void {}
}
`,
    },
  },
};

export interface InjectionResult {
  injectedCount: number;
  injectedVirions: string[];
  filesCreated: string[];
  log: string[];
}

/**
 * Injects virions into a plugin's source directory (src/)
 */
export function injectVirions(
  projectDir: string,
  requestedVirions: string[]
): InjectionResult {
  const logs: string[] = [];
  const filesCreated: string[] = [];
  const injectedVirions: string[] = [];

  const srcDir = path.join(projectDir, "src");
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
  }

  logs.push(`[Virion] Initializing injection for ${requestedVirions.length} virion(s)...`);

  for (const virionName of requestedVirions) {
    const trimmed = virionName.trim();
    const virion = BUILTIN_VIRIONS[trimmed];

    if (!virion) {
      logs.push(`[Virion] Warning: Virion "${trimmed}" not found in local registry. Skipping.`);
      continue;
    }

    logs.push(`[Virion] Injecting "${virion.name}" (v${virion.version}) - Namespace: ${virion.namespace}`);

    for (const [relPath, code] of Object.entries(virion.files)) {
      const targetFilePath = path.join(srcDir, relPath);
      const targetDir = path.dirname(targetFilePath);

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      fs.writeFileSync(targetFilePath, code, "utf8");
      filesCreated.push(relPath);
      logs.push(`  -> Bundled: src/${relPath}`);
    }

    injectedVirions.push(virion.name);
  }

  logs.push(`[Virion] Successfully injected ${injectedVirions.length} virion(s) (${filesCreated.length} files).`);

  return {
    injectedCount: injectedVirions.length,
    injectedVirions,
    filesCreated,
    log: logs,
  };
}
