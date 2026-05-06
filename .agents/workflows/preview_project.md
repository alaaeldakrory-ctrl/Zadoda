# Preview Project Workflow

This workflow details the steps to start the development server and preview the Zadoda Scheduler project.

## Steps

1.  **Ensure Node.js is in Path**:
    ```powershell
    $env:Path = "C:\Program Files\nodejs;" + $env:Path
    ```

2.  **Start Development Server**:
    Run the dev script on port 9002.
    ```powershell
    cmd /c npm run dev
    ```

3.  **Preview in Browser**:
    Navigate to `http://localhost:9002`.
