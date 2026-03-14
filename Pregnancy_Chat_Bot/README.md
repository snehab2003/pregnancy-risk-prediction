# 🤰 Pregnancy Support Chatbot Module

This module provides an AI-powered chatbot designed to assist with pregnancy-related queries and risk assessments. It uses a Retrieval-Augmented Generation (RAG) approach to pull information from clinical PDFs.

## 📂 Project Structure
* `main.py`: The primary entry point for the chatbot interface.
* `ingest.py`: Script to process PDFs in `/data_pdfs` and store them in the `/db` vector store.
* `data_pdfs/`: (Local only) Folder containing the source medical documents.
* `db/`: (Local only) Directory where processed vector embeddings are stored.
* `.env`: (Local only) Contains sensitive API keys.
* `.venv/`: (Local only) Python virtual environment.

## 🚀 Getting Started

1. Setup the Virtual Environment
To keep dependencies organized and avoid conflicts, create and activate a virtual environment:

# Create the environment
python -m venv .venv

# Activate it (Windows)
.venv\Scripts\activate

2. Install Dependencies
Install the required libraries listed in the requirements file:

pip install -r requirements.txt

3. Configuration
Create a .env file in this directory and add your API credentials:

GOOGLE_API_KEY=your_api_key_here

4. Data Ingestion
Before running the bot for the first time, you must index your documents. Place your PDFs in the data_pdfs/ folder and run:

python ingest.py

5. Launch the Chatbot
Once the db/ folder has been generated, you can start the conversation:

python main.py