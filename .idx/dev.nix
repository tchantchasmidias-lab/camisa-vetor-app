{ pkgs, ... }: {
  channel = "stable-24.11";
  packages = [
    pkgs.nodejs_22
  ];
  idx = {
    extensions = [
      "dbaeumer.vscode-eslint"
      "google.gemini-cli-vscode-ide-companion"
    ];
    workspace = {
      onCreate = {
        # Removido o --prefix
        npm-install = "npm install";
      };
    };
    previews = {
      enable = true;
      previews = {
        web = {
          # Removido o --prefix camisa-vetor
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}