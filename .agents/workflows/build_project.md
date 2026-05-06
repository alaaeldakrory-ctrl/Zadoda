# Build Project Workflow

This workflow details the steps to build the Zadoda Scheduler project on a Windows environment where Node.js might not be in the global path.

## Steps

1.  **Ensure Node.js is in Path**:
    Add the Node.js installation directory to the environment path for the session.
    ```powershell
    $env:Path = "C:\Program Files\nodejs;" + $env:Path
    ```

2.  **Install Dependencies**:
    Run `npm install`. Use `cmd /c` to avoid execution policy issues with PowerShell scripts.
    ```powershell
    cmd /c npm install
    ```

3.  **Build the Project**:
    Run the build script.
    ```powershell
    $env:NODE_ENV = "production"; cmd /c npm run build
    ```
