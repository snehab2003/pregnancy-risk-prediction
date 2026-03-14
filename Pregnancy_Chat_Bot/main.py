import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate

# 1. Setup
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

# 2. Load the Knowledge Base (The 'db' folder you just created)
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001", 
    google_api_key=api_key
)
vector_db = Chroma(persist_directory="./db", embedding_function=embeddings)
retriever = vector_db.as_retriever(search_kwargs={"k": 3})

# 3. Initialize the Powerhouse: Gemini 3
llm = ChatGoogleGenerativeAI(
    model="gemini-3-flash-preview", 
    google_api_key=api_key,
    temperature=0.2
)

# 4. Create the System Prompt (The "Rules")
system_prompt = (
    "You are a professional Pregnancy Assistant. Use the provided medical context "
    "to answer the user's question. \n\n"
    "RULES:\n"
    "1. Always include a medical disclaimer.\n"
    "2. If the answer isn't in the context, say you don't know but offer general support.\n"
    "3. Be warm and empathetic.\n\n"
    "CONTEXT:\n{context}"
)

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{input}"),
])

# 5. Build the RAG Chain
question_answer_chain = create_stuff_documents_chain(llm, prompt)
rag_chain = create_retrieval_chain(retriever, question_answer_chain)

# 6. Chat Loop
print("--- 2026 Pregnancy Expert is ONLINE ---")
while True:
    user_input = input("You: ")
    if user_input.lower() in ["exit", "quit"]: break
    
    try:
        # The bot searches the DB, finds the PDF text, and then answers
        response = rag_chain.invoke({"input": user_input})
        print(f"\nAssistant: {response['answer']}\n")
    except Exception as e:
        print(f"Error: {e}")