"""
import asyncio
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from mcp import ClientSession
from mcp_use import MCPAgent, MCPClient
import os

async def run_memory_chat():
    load_dotenv()
    os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")

    config_file = "browser_mcp.json"

    print("Initializing chat...")

    client = MCPClient.from_config_file(config_file)
    llm = ChatGroq(
        model="qwen-qwq-32b"
    )

    agent = MCPAgent(
        llm = llm,
        client=client,
        max_steps=15,
        memory_enabled=True,
    )

    print("\n==== Interactive MCP chat ====")
    print("Type 'exit' to quit the chat.")
    print("Type 'clear' to clear the memory.")
    print("=================================\n")

    try:
        while True:
            user_input = input("You: ")
            if user_input.lower() in ["exit", "quit"]:
                break

            elif user_input.lower() == "clear":
                agent.clear_conversation_history()
                print("Memory cleared.")
                continue
            print("\nAssistant: ", end="", flush=True)

            try:
                response = await agent.run(user_input)
                print(f"Agent: {response}")
            
            except Exception as e:
                print(f"\nError: {e}")

    finally:

        if client and client.sessions:
            await client.close_all_sessions()

if __name__ == "__main__":
    asyncio.run(run_memory_chat())

"""

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import asyncio
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from mcp import ClientSession
from mcp_use import MCPAgent, MCPClient
import os
from langchain.schema import SystemMessage, HumanMessage, AIMessage

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

def message_to_dict(message):
    """Convert LangChain message objects to serializable dictionaries"""
    if isinstance(message, SystemMessage):
        return {"type": "system", "content": message.content}
    elif isinstance(message, HumanMessage):
        return {"type": "user", "content": message.content}
    elif isinstance(message, AIMessage):
        return {"type": "assistant", "content": message.content}
    return str(message)  # fallback for other types

async def initialize_agent():
    global agent, client
    load_dotenv()
    os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")

    config_file = "browser_mcp.json"
    client = MCPClient.from_config_file(config_file)
    llm = ChatGroq(model="qwen-qwq-32b")

    agent = MCPAgent(
        llm=llm,
        client=client,
        max_steps=15,
        memory_enabled=True,
    )

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
async def chat():
    data = request.json
    user_input = data.get('message')
    
    if user_input.lower() == "clear":
        agent.clear_conversation_history()
        return jsonify({"response": "Memory cleared.", "history": []})
    
    try:
        response = await agent.run(user_input)
        
        # Get and serialize conversation history
        history = []
        if hasattr(agent, 'memory') and hasattr(agent.memory, 'chat_memory'):
            history = [message_to_dict(msg) for msg in agent.memory.chat_memory.messages]
        
        return jsonify({
            "response": response,
            "history": history
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/history', methods=['GET'])
async def get_history():
    try:
        history = []
        if agent and hasattr(agent, 'memory') and hasattr(agent.memory, 'chat_memory'):
            history = [message_to_dict(msg) for msg in agent.memory.chat_memory.messages]
        
        return jsonify({"history": history})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.teardown_appcontext
async def shutdown(exception=None):
    global client
    try:
        if client and hasattr(client, "sessions"):
            await client.close_all_sessions()
    except NameError:
        pass  


async def create_app():
    await initialize_agent()
    return app

if __name__ == '__main__':
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    app = loop.run_until_complete(create_app())
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))
