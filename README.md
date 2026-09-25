# ✈️ TriPlanner

### Multi-Agent AI Travel Planner powered by LangGraph

<p align="center">
  <strong>Research flights • Discover hotels • Build itineraries • Maintain conversation context</strong>
</p>

<p align="center">

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.136+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-1.2+-1C3C3C?style=for-the-badge)](https://www.langchain.com/langgraph)
[![LangChain](https://img.shields.io/badge/LangChain-1.3+-1C3C3C?style=for-the-badge)](https://www.langchain.com/)
[![Groq](https://img.shields.io/badge/Groq-LLM-F55036?style=for-the-badge)](https://groq.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Checkpointing-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

</p>

---

## 📖 Table of Contents

- [What is TriPlanner?](#-what-is-triplanner)
- [Why Multi-Agent?](#-why-multi-agent)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Agent Workflow](#-agent-workflow)
- [How Data Moves Through the System](#-how-data-moves-through-the-system)
- [Agents](#-agents)
- [Shared TravelState](#-shared-travelstate)
- [Conversation Persistence](#-conversation-persistence)
- [Tools and External APIs](#-tools-and-external-apis)
- [Frontend Architecture](#-frontend-architecture)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [API](#-api)
- [Environment Variables](#-environment-variables)
- [Local Setup](#-local-setup)
- [Docker](#-docker)
- [Example Prompts](#-example-prompts)
- [Design Decisions](#-design-decisions)
- [Failure Handling](#-failure-handling)
- [Roadmap](#-roadmap)
- [Limitations](#-limitations)
- [Contributing](#-contributing)
- [License](#-license)
- [Author](#-author)

---

# 🌍 What is TriPlanner?

**TriPlanner** is a multi-agent AI travel planning application built with **Python, FastAPI, LangGraph, LangChain, Groq, Tavily, AviationStack, and PostgreSQL**.

Instead of asking one LLM to perform every travel-planning task, TriPlanner divides the problem into specialized stages.

A user can provide a request such as:

> **"Plan a 5-day trip to Japan with a budget of $1500. Find flights, suggest hotels, and create a practical itinerary."**

TriPlanner processes the request through a coordinated workflow:

```text
                         USER
                          │
                          ▼
                 ┌─────────────────┐
                 │   Flight Agent  │
                 │  Flight research│
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │   Hotel Agent   │
                 │  Hotel research │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Itinerary Agent │
                 │  Trip planning  │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Final Response  │
                 │     Agent       │
                 └────────┬────────┘
                          │
                          ▼
                   FINAL TRAVEL PLAN
```

The important engineering idea is that **each agent has a focused responsibility and contributes its output to a shared state**.

---

# 🎯 Why Multi-Agent?

A single LLM can generate a travel itinerary, but a real travel-planning system has multiple independent concerns:

- Flight information
- Hotel research
- Destination activities
- Budget considerations
- Itinerary construction
- Final response formatting

TriPlanner separates these concerns.

### Traditional single-agent approach

```text
User
 │
 ▼
┌───────────────────────────────┐
│           One LLM             │
│                               │
│ Research + Planning + Output  │
└───────────────────────────────┘
 │
 ▼
Answer
```

### TriPlanner approach

```text
User
 │
 ▼
┌─────────────────┐
│ Flight Agent    │──────► AviationStack
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Hotel Agent     │──────► Tavily
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Itinerary Agent │──────► Groq
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Final Agent     │──────► Groq
└────────┬────────┘
         │
         ▼
     Final Plan
```

This structure makes the system easier to understand, extend, test, and debug.

---

# ✨ Key Features

| Feature                   | Description                                  |
| ------------------------- | -------------------------------------------- |
| 🤖 Multi-Agent Workflow   | Four specialized LangGraph agents            |
| ✈️ Flight Research        | Flight lookup through AviationStack          |
| 🏨 Hotel Research         | Web research through Tavily                  |
| 🗓️ AI Itinerary           | Day-by-day itinerary generation              |
| ⚡ Groq LLM               | Fast LLM inference                           |
| 🧠 Shared State           | Agents communicate through `TravelState`     |
| 💾 PostgreSQL Persistence | LangGraph checkpoint persistence             |
| 🧵 Conversation Threads   | Continue planning using `thread_id`          |
| 🌐 FastAPI                | REST API backend                             |
| 🎨 Web UI                 | Custom HTML/CSS/JavaScript interface         |
| 📋 Copy Results           | Copy generated travel plans                  |
| 📄 PDF Export             | Export the generated plan from the browser   |
| 🐳 Docker                 | Container-ready application                  |
| 🔎 External Tools         | Dedicated flight and web-search integrations |

---

# 🏗️ Architecture

The following architecture represents the current TriPlanner design.

```mermaid
flowchart TD

    U["👤 User"]

    UI["🌐 TriPlanner Web UI<br/>HTML + CSS + JavaScript"]

    API["⚡ FastAPI<br/>POST /api/travel"]

    GRAPH["🧠 LangGraph<br/>Travel Planning Workflow"]

    F["✈️ Flight Agent"]
    H["🏨 Hotel Agent"]
    I["🗓️ Itinerary Agent"]
    R["📝 Final Response Agent"]

    A["🛫 AviationStack API"]
    T["🔎 Tavily Search"]

    G1["⚡ Groq LLM"]
    G2["⚡ Groq LLM"]

    STATE["📦 Shared TravelState<br/>user_query<br/>flight_results<br/>hotel_results<br/>itinerary<br/>messages"]

    DB[("🐘 PostgreSQL<br/>LangGraph Checkpoints")]

    U --> UI
    UI --> API
    API --> GRAPH

    GRAPH --> F
    F --> A
    F --> STATE

    STATE --> H
    H --> T
    H --> STATE

    STATE --> I
    I --> G1
    I --> STATE

    STATE --> R
    R --> G2
    R --> STATE

    STATE --> DB
    DB -. persisted state .-> GRAPH

    R --> API
    API --> UI
```

---

# 🔄 Agent Workflow

TriPlanner currently uses a sequential LangGraph workflow.

```mermaid
flowchart LR

    START(["👤 User Request"])

    F["1️⃣ Flight Agent<br/>AviationStack"]
    H["2️⃣ Hotel Agent<br/>Tavily"]
    I["3️⃣ Itinerary Agent<br/>Groq"]
    R["4️⃣ Final Response Agent<br/>Groq"]

    END(["📋 Final Travel Plan"])

    START --> F
    F --> H
    H --> I
    I --> R
    R --> END

    style START fill:#6d28d9,color:#fff
    style F fill:#0284c7,color:#fff
    style H fill:#059669,color:#fff
    style I fill:#d97706,color:#fff
    style R fill:#7c3aed,color:#fff
    style END fill:#16a34a,color:#fff
```

### Why sequential?

The current graph is intentionally sequential:

```text
Flight
  ↓
Hotel
  ↓
Itinerary
  ↓
Final
```

This makes the data dependencies easy to understand.

The itinerary agent receives the flight and hotel outputs, while the final agent receives the complete accumulated state.

---

# 🧩 Agent Architecture

```mermaid
flowchart TB

    subgraph AGENTS["TriPlanner Multi-Agent System"]

        F["✈️ FLIGHT AGENT<br/><br/>Researches flight information"]

        H["🏨 HOTEL AGENT<br/><br/>Researches hotel options"]

        I["🗓️ ITINERARY AGENT<br/><br/>Creates day-by-day itinerary"]

        R["📝 FINAL RESPONSE AGENT<br/><br/>Combines everything"]

    end

    subgraph TOOLS["External Tools / APIs"]

        A["AviationStack"]
        T["Tavily Search"]
        G["Groq LLM"]
    end

    F --> A
    H --> T
    I --> G
    R --> G

    F --> S["📦 TravelState"]
    H --> S
    I --> S
    R --> S
```

---

# 📦 How Data Moves Through the System

The core concept is a shared state.

```text
                  ┌───────────────────────────┐
                  │       TravelState         │
                  │                           │
                  │ user_query                │
                  │ flight_results            │
                  │ hotel_results             │
                  │ itinerary                 │
                  │ messages                  │
                  │ ...                       │
                  └─────────────┬─────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
 Flight Agent              Hotel Agent           Itinerary Agent
        │                       │                       │
        │                       │                       │
        └──────────────► state updates ◄───────────────┘
                                │
                                ▼
                         Final Agent
                                │
                                ▼
                         Final Response
```

Conceptually, the state grows as the workflow executes:

```text
Initial State
     │
     ▼
+ flight_results
     │
     ▼
+ hotel_results
     │
     ▼
+ itinerary
     │
     ▼
+ final response
```

---

# 🧠 Agents

## 1. ✈️ Flight Agent

### Responsibility

The Flight Agent handles flight-related research.

It receives the user's natural-language request and uses the flight tool to obtain flight information.

### Tool

```text
AviationStack API
```

The project also uses airport/country data to help resolve travel locations and IATA codes.

### Flow

```text
User Query
    │
    ▼
Flight Agent
    │
    ▼
Flight Tool
    │
    ▼
AviationStack
    │
    ▼
Flight Results
    │
    ▼
TravelState
```

---

## 2. 🏨 Hotel Agent

### Responsibility

The Hotel Agent researches accommodation options for the requested destination.

### Tool

```text
Tavily Search
```

### Flow

```text
User Query
    │
    ▼
Hotel Agent
    │
    ▼
Tavily Search
    │
    ▼
Web Results
    │
    ▼
Hotel Results
    │
    ▼
TravelState
```

---

## 3. 🗓️ Itinerary Agent

### Responsibility

The Itinerary Agent creates the actual trip plan.

It receives the information accumulated by the previous agents.

Conceptually:

```text
User Requirements
        +
Flight Research
        +
Hotel Research
        │
        ▼
Itinerary Agent
        │
        ▼
Groq LLM
        │
        ▼
Day-by-Day Itinerary
```

The itinerary can include:

- Day-by-day activities
- Places to visit
- Travel suggestions
- Budget considerations
- Practical planning

---

## 4. 📝 Final Response Agent

The Final Response Agent combines the available information into the final response shown to the user.

```text
User Request
     +
Flight Results
     +
Hotel Results
     +
Itinerary
     │
     ▼
Final Response Agent
     │
     ▼
Groq LLM
     │
     ▼
Formatted Travel Plan
```

---

# 📦 Shared `TravelState`

LangGraph allows the agents to work with a shared graph state.

The state conceptually contains information such as:

```python
TravelState = {
    "user_query": "...",
    "flight_results": "...",
    "hotel_results": "...",
    "itinerary": "...",
    "messages": [...]
}
```

The exact state definition is implemented in `backend.py`.

### Why shared state?

Without shared state:

```text
Flight Agent → output
                 ↓
             manually pass
                 ↓
Hotel Agent → output
                 ↓
             manually pass
                 ↓
Itinerary Agent
```

With LangGraph state:

```text
             TravelState
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
    Flight      Hotel     Itinerary
     Agent      Agent       Agent
       │          │          │
       └──────────┴──────────┘
                  │
                  ▼
              Final Agent
```

The graph manages how state moves between nodes.

---

# 💾 Conversation Persistence

TriPlanner uses **PostgreSQL as the persistent checkpoint store for LangGraph**.

The purpose is to preserve conversation state instead of keeping everything only in process memory.

```mermaid
flowchart LR

    B["🌐 Browser"]

    API["⚡ FastAPI"]

    LG["🧠 LangGraph"]

    PS["💾 PostgresSaver"]

    DB[("🐘 PostgreSQL")]

    B -->|"message + thread_id"| API
    API --> LG
    LG --> PS
    PS --> DB

    DB -. checkpoint .-> PS
    PS -. restore state .-> LG
```

### Thread-based conversations

The frontend keeps the current thread ID.

First request:

```json
{
  "message": "Plan a trip to Japan",
  "thread_id": null
}
```

The backend returns a thread ID.

A later request can use the same thread:

```json
{
  "message": "Make it cheaper",
  "thread_id": "existing-thread-id"
}
```

This is the foundation for multi-turn travel planning.

---

# 🔌 Tools and External APIs

## ✈️ AviationStack

Used for flight-related data.

```text
Flight Agent
     │
     ▼
Flight Tool
     │
     ▼
AviationStack
```

---

## 🔎 Tavily

Used for web-based hotel research.

```text
Hotel Agent
     │
     ▼
Tavily Tool
     │
     ▼
Web Search
```

---

## ⚡ Groq

Used by the LLM-powered stages.

```text
Itinerary Agent ──► Groq
Final Agent ──────► Groq
```

---

## 🗺️ Airport / Country Data

The project includes:

- `airportsdata`
- `pycountry`

These support location and airport resolution for flight research.

---

# 🖥️ Frontend Architecture

TriPlanner uses a lightweight browser frontend.

```mermaid
flowchart LR

    HTML["index.html<br/>UI Structure"]
    CSS["style.css<br/>Visual Design"]
    JS["script.js<br/>Frontend Logic"]

    HTML --> JS
    CSS --> HTML
    JS --> API["FastAPI<br/>/api/travel"]
```

### `index.html`

Defines the application interface.

### `style.css`

Controls:

- Dark theme
- Layout
- Cards
- Buttons
- Responsive design
- Agent workflow visuals
- Result presentation

### `script.js`

Acts as the communication layer between the browser and FastAPI.

It handles:

- Reading user input
- Quick prompts
- Sending API requests
- Loading states
- Error messages
- Thread IDs
- Rendering Markdown
- Copying results
- PDF generation

---

# 📁 Project Structure

```text
TriPlanner/
│
├── app.py
│   └── FastAPI application and API endpoints
│
├── backend.py
│   └── LangGraph workflow, agents and state
│
├── requirements.txt
│   └── Python dependencies
│
├── test.py
│   └── Development/testing script
│
├── DockerFile
│   └── Docker image configuration
│
├── .dockerignore
│   └── Files excluded from Docker build context
│
├── .gitignore
│
├── .env
│   └── Local secrets and configuration
│
├── LICENSE
│
├── README.md
│
├── static/
│   ├── script.js
│   │   └── Frontend behavior and API communication
│   │
│   └── style.css
│       └── Frontend styling
│
├── templates/
│   └── index.html
│       └── Main web interface
│
└── tools/
    ├── __init__.py
    ├── flight_tool.py
    │   └── AviationStack / airport resolution
    │
    └── tavily_tool.py
        └── Tavily web-search integration
```

---

# 🛠️ Tech Stack

| Layer              | Technology                    |
| ------------------ | ----------------------------- |
| Language           | Python 3.11+                  |
| API Framework      | FastAPI                       |
| ASGI Server        | Uvicorn                       |
| Agent Framework    | LangGraph                     |
| LLM Framework      | LangChain                     |
| LLM Provider       | Groq                          |
| Flight Data        | AviationStack                 |
| Web Search         | Tavily                        |
| Airport Data       | airportsdata                  |
| Country Data       | pycountry                     |
| Database           | PostgreSQL                    |
| Graph Persistence  | langgraph-checkpoint-postgres |
| Database Driver    | psycopg                       |
| Templates          | Jinja2                        |
| Frontend           | HTML + CSS + JavaScript       |
| Markdown Rendering | Marked.js                     |
| PDF Export         | html2pdf.js                   |
| Containerization   | Docker                        |
| Version Control    | Git / GitHub                  |

---

# 📡 API

TriPlanner exposes a small REST API.

| Method | Endpoint      | Purpose                 |
| ------ | ------------- | ----------------------- |
| `GET`  | `/`           | Serve the web interface |
| `GET`  | `/health`     | Check API health        |
| `POST` | `/api/travel` | Generate a travel plan  |

---

## `GET /`

Returns the TriPlanner web application.

```text
http://127.0.0.1:8000/
```

---

## `GET /health`

Health-check endpoint.

Example:

```json
{
  "status": "ok"
}
```

---

## `POST /api/travel`

Main travel-planning endpoint.

### Request

```json
{
  "message": "Plan a 5-day trip to Tokyo with a budget of $1200",
  "thread_id": null
}
```

### Request with existing conversation

```json
{
  "message": "Make the hotel cheaper",
  "thread_id": "existing-thread-id"
}
```

### Response

```json
{
  "success": true,
  "answer": "## Your Tokyo Travel Plan...",
  "thread_id": "existing-thread-id"
}
```

The exact response fields are defined by the current FastAPI implementation in `app.py`.

---

# 🔐 Environment Variables

Create a `.env` file in the project root.

```env
DATABASE_URL=postgresql://username:password@localhost:5432/travel_db

GROQ_API_KEY=your_groq_api_key

TAVILY_API_KEY=your_tavily_api_key

AVIATIONSTACK_API_KEY=your_aviationstack_api_key

DEFAULT_ORIGIN_IATA=DAC
```

### Environment variable purpose

| Variable                | Purpose                                           |
| ----------------------- | ------------------------------------------------- |
| `DATABASE_URL`          | PostgreSQL connection for LangGraph checkpointing |
| `GROQ_API_KEY`          | Authenticate with Groq                            |
| `TAVILY_API_KEY`        | Authenticate with Tavily                          |
| `AVIATIONSTACK_API_KEY` | Authenticate with AviationStack                   |
| `DEFAULT_ORIGIN_IATA`   | Default origin airport configuration              |

### ⚠️ Security

Never commit `.env`.

Make sure it is included in `.gitignore`.

---

# 🚀 Local Setup

## Prerequisites

Install:

- Python 3.11+
- PostgreSQL
- Git

Docker is optional for local development.

You also need API keys for:

- Groq
- Tavily
- AviationStack

---

## 1. Clone the repository

```bash
git clone https://github.com/itsapexdanav/TripPlaner-AI--A-multi-Agent-Travel-Planner-With-LangGraph.git
cd TripPlaner-AI--A-multi-Agent-Travel-Planner-With-LangGraph
```

---

## 2. Create a virtual environment

### Windows

```powershell
python -m venv .venv
```

Activate:

```powershell
.\.venv\Scripts\Activate.ps1
```

### Linux / macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
```

---

## 3. Install dependencies

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

---

## 4. Configure PostgreSQL

Create a PostgreSQL database.

Example:

```sql
CREATE DATABASE travel_db;
```

Then configure:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/travel_db
```

---

## 5. Configure `.env`

Create `.env`:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/travel_db
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key
AVIATIONSTACK_API_KEY=your_aviationstack_api_key
DEFAULT_ORIGIN_IATA=DAC
```

---

## 6. Start the application

```bash
python app.py
```

Or:

```bash
uvicorn app:app --reload
```

Open:

```text
http://127.0.0.1:8000/
```

---

# 🐳 Docker

TriPlanner includes a Docker configuration.

## Build

```bash
docker build -t triplanner .
```

## Run

```bash
docker run -p 8000:8000 --env-file .env triplanner
```

Then open:

```text
http://127.0.0.1:8000/
```

### Important

PostgreSQL and external APIs still need to be reachable from the running container.

---

# 💡 Example Prompts

Try:

### 🇯🇵 Japan

```text
Plan a 7-day trip to Japan with a budget of $2000.
Include flights, hotels and major attractions.
```

### 🇦🇪 Dubai

```text
Plan a 4-day trip to Dubai for two people.
My budget is $1200.
```

### 🇹🇭 Thailand

```text
Create a 6-day Thailand itinerary with affordable hotels
and interesting places to visit.
```

### ✈️ Flight-focused

```text
Plan a trip from Delhi to Tokyo and include flight
information and a practical itinerary.
```

### 💰 Budget-focused

```text
Plan a 5-day international trip under $1000.
Prioritize affordable hotels and activities.
```

### 🔄 Follow-up

After generating a plan:

```text
Make the itinerary cheaper.
```

or:

```text
Add more sightseeing activities.
```

or:

```text
Reduce the number of hotel changes.
```

---

# 🔁 Complete Request Lifecycle

The complete request path looks like this:

```mermaid
sequenceDiagram

    actor User
    participant UI as TriPlanner UI
    participant API as FastAPI
    participant LG as LangGraph
    participant F as Flight Agent
    participant H as Hotel Agent
    participant I as Itinerary Agent
    participant R as Final Agent
    participant DB as PostgreSQL
    participant EXT as External APIs
    participant LLM as Groq

    User->>UI: Enter travel request
    UI->>API: POST /api/travel
    API->>LG: Invoke graph + thread_id

    LG->>DB: Load checkpoint
    DB-->>LG: Previous state

    LG->>F: Execute flight agent
    F->>EXT: AviationStack request
    EXT-->>F: Flight data
    F-->>LG: Update TravelState

    LG->>H: Execute hotel agent
    H->>EXT: Tavily search
    EXT-->>H: Search results
    H-->>LG: Update TravelState

    LG->>I: Execute itinerary agent
    I->>LLM: Generate itinerary
    LLM-->>I: Itinerary
    I-->>LG: Update TravelState

    LG->>R: Execute final agent
    R->>LLM: Generate final response
    LLM-->>R: Final answer
    R-->>LG: Update TravelState

    LG->>DB: Save checkpoint
    LG-->>API: Final state
    API-->>UI: JSON response
    UI-->>User: Render travel plan
```

---

# 🧠 Design Decisions

## 1. LangGraph for orchestration

LangGraph is used to represent the travel workflow as a graph of nodes.

Each agent is represented as a graph node.

```text
START
  ↓
Flight Agent
  ↓
Hotel Agent
  ↓
Itinerary Agent
  ↓
Final Agent
  ↓
END
```

This gives the application explicit workflow control instead of relying on an unconstrained single LLM call.

---

## 2. Shared state instead of manual data passing

Agent outputs are stored in the graph state.

This allows downstream agents to consume information produced earlier in the workflow.

---

## 3. PostgreSQL instead of process-only memory

A process-local memory mechanism would lose state when the application restarts.

PostgreSQL checkpointing provides persistent storage for LangGraph state.

---

## 4. Dedicated tools

External integrations are separated into the `tools/` directory.

```text
tools/
├── flight_tool.py
└── tavily_tool.py
```

This keeps API-specific logic away from the core graph orchestration.

---

## 5. FastAPI as the backend boundary

The frontend does not directly communicate with AviationStack, Tavily, PostgreSQL, or Groq.

Instead:

```text
Browser
   │
   ▼
FastAPI
   │
   ▼
LangGraph
   │
   ├── Tools
   ├── Groq
   └── PostgreSQL
```

This provides a clean backend boundary and keeps API credentials server-side.

---

# 🛡️ Failure Handling

External systems can fail.

Examples:

```text
AviationStack unavailable
        ↓
Flight research fails

Tavily unavailable
        ↓
Hotel research fails

Groq unavailable
        ↓
LLM generation fails

PostgreSQL unavailable
        ↓
Checkpointing fails
```

The application should therefore be treated as a distributed system with multiple failure points.

Potential production improvements include:

- Retries
- Timeouts
- Rate limiting
- Circuit breakers
- Fallback responses
- Structured error messages
- API observability
- Tool-level health checks

---

# 🔍 Engineering Concepts Demonstrated

TriPlanner is not only an AI demo. It demonstrates several software-engineering concepts.

### AI Engineering

- Multi-agent systems
- LLM orchestration
- Tool calling
- Prompt-driven workflows
- Shared agent state

### Backend Engineering

- REST APIs
- FastAPI
- Request/response models
- Environment configuration
- External API integration

### Distributed-System Concepts

- External service failures
- Persistent state
- Checkpointing
- Request context
- Service boundaries

### Database Concepts

- PostgreSQL
- Persistent conversation state
- Thread-based sessions

### DevOps

- Docker
- Environment-based configuration
- Git/GitHub

---

# 🧪 Testing

The repository includes:

```text
test.py
```

which can be used for development and workflow testing.

For a production-grade version, the testing strategy can be expanded into:

```text
tests/
├── unit/
│   ├── test_flight_tool.py
│   ├── test_tavily_tool.py
│   └── test_agents.py
│
├── integration/
│   └── test_travel_workflow.py
│
└── api/
    └── test_api.py
```

---

# 📊 Future Improvements

## Agent Improvements

- [ ] Parallel flight + hotel research
- [ ] Dedicated budget agent
- [ ] Weather agent
- [ ] Activity research agent
- [ ] Follow-up/refinement agent
- [ ] Better agent routing

## Data & Tools

- [ ] More flight providers
- [ ] Hotel APIs
- [ ] Maps integration
- [ ] Weather API
- [ ] Currency conversion
- [ ] Better destination data

## Reliability

- [ ] Retry mechanisms
- [ ] Timeouts
- [ ] Circuit breakers
- [ ] API rate limiting
- [ ] Caching
- [ ] Graceful degradation

## AI Observability

- [ ] Agent tracing
- [ ] LLM token tracking
- [ ] Latency metrics
- [ ] Cost tracking
- [ ] Agent evaluation
- [ ] RAG/grounding evaluation

## Production

- [ ] Authentication
- [ ] User accounts
- [ ] CI/CD
- [ ] Cloud deployment
- [ ] Monitoring
- [ ] Structured logging
- [ ] Redis caching
- [ ] Background workers

---

# ⚠️ Limitations

TriPlanner depends on external APIs and LLM-generated information.

Therefore:

- Flight information may change.
- Flight availability may change.
- Web search results may change.
- Hotel information may become outdated.
- API services may experience downtime or rate limits.
- LLM-generated itineraries may contain inaccurate information.

TriPlanner should be treated as a planning assistant, not as the final authority for bookings or travel requirements.

Always verify important information with official airlines, hotels, government authorities, and other relevant sources before making bookings.

---

# 🔐 Security

Never place API keys directly inside Python source code.

Use:

```env
GROQ_API_KEY=...
TAVILY_API_KEY=...
AVIATIONSTACK_API_KEY=...
DATABASE_URL=...
```

Keep:

```text
.env
```

out of Git.

The Docker image should also receive secrets through environment configuration rather than baking them into the image.

---

# 🤝 Contributing

Contributions are welcome.

## 1. Fork the repository

Create your own fork on GitHub.

## 2. Clone it

```bash
git clone <your-fork-url>
cd TripPlaner-AI--A-multi-Agent-Travel-Planner-With-LangGraph
```

## 3. Create a branch

```bash
git checkout -b feature/my-feature
```

## 4. Make your changes

Keep changes focused and test the application.

## 5. Commit

```bash
git add .
git commit -m "Add my feature"
```

## 6. Push

```bash
git push origin feature/my-feature
```

## 7. Open a Pull Request

Describe:

- What changed
- Why it changed
- How it was tested

---

# 📜 License

This project is licensed under the **Apache License 2.0**.

See the [`LICENSE`](./LICENSE) file for details.

---

# 👨‍💻 Author

## Nirmal Singh

AI/ML and Backend Engineering enthusiast focused on:

- AI Agents
- RAG systems
- Backend engineering
- Distributed systems
- LLM applications

# ⭐ TriPlanner

If you find the project useful:

- ⭐ Star the repository
- 🍴 Fork it
- 🐛 Open an issue
- 💡 Suggest improvements
- 🤝 Contribute

---

<p align="center">

### ✈️ TriPlanner

**From a simple travel request to an AI-generated travel plan.**

Built with **Python · FastAPI · LangGraph · LangChain · Groq · PostgreSQL · Tavily · AviationStack**

</p>
