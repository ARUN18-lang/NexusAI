# mcp-agents

mcp-agents is a Python project that provides an interactive chat interface using Flask, integrated with LangChain through the MCPAgent and MCPClient libraries. It offers both a web frontend and a command-line interface for chat interactions.

## Project Structure

```
mcp_agents/
├── .env
├── .gitignore
├── .python-version
├── app.py                # Flask application with async endpoints for chat and conversation history.
├── browser_mcp.json      # Configuration file for MCP servers.
├── main.py               # Simple entry point that prints a welcome message.
├── procfile              # Deployment configuration for Hypercorn.
├── pyproject.toml        # Project metadata and dependency definitions.
├── README.md
├── requirements.txt      # Legacy Python dependencies.
├── uv.lock
├── static/
│   ├── script.js         # JavaScript for frontend chat interaction.
│   └── styles.css        # CSS for styling the chat UI.
└── templates/
    └── index.html        # Main HTML file for the chat interface.
```

## Setup & Installation

1. **Clone the Repository**

   ```sh
   git clone <repository-url>
   cd mcp-agents
   ```

2. **Install Dependencies**

   Ensure you have Python 3.11 installed. Then install the dependencies:

   ```sh
   pip install -r requirements.txt
   ```

   Alternatively, if you use [pyproject.toml](pyproject.toml), you may use your preferred build backend.

3. **Set Up Environment Variables**

   Create a `.env` file in the project root (if not already created) and set the `GROQ_API_KEY`. For example:

   ```dotenv
   GROQ_API_KEY = "your_groq_api_key_here"
   ```

## Running the Application

### Start the Flask Server

Run the application with:

```sh
python app.py
```

The app will run on [http://localhost:5000](http://localhost:5000) by default.

### Deployment

For deployment, the project includes a `procfile` to run the application using Hypercorn:

```sh
hypercorn app:app --bind 0.0.0.0:5000 --worker-class asyncio
```

## Chat Interface

- **Web Chat:** Navigate to the root URL to access the chat interface.
- **Command-Line Chat:** You can run `main.py` for a simple prompt-based welcome message, though the primary interface is via the web app.

## Features

- **Interactive Chat:** Engages in interactive chat sessions with asynchronous handling.
- **Conversation History:** Supports persistent conversation history stored in the browser (via localStorage).
- **Clear Memory:** The system can clear conversation history by typing "clear" in the chat.

## License

Add your license information here.

## Acknowledgments

- Uses [Flask](https://flask.palletsprojects.com/) for server routing.
- Chat functionality powered by [langchain-groq](https://github.com/langchain-ai/langchain).
- MCP integration via [mcp](https://github.com/mcp-org/mcp) and [mcp-use](https://github.com/mcp-org/mcp-use).

Enjoy building your chat experience with mcp-agents!