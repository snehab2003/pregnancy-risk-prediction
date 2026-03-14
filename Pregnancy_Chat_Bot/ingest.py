import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

# Use the folder we confirmed earlier
pdf_folder = "C:/Users/athul/OneDrive/Documents/Spyder/Pregnancy_Chat_Bot/data_pdfs"

print("--- Step 1: Loading Documents ---")
# Using recursive=True to make sure we find all 113 pages
loader = DirectoryLoader(pdf_folder, glob="**/*.pdf", loader_cls=PyPDFLoader)
documents = loader.load()

if len(documents) == 0:
    print("❌ ERROR: No PDFs found. Double check the folder!")
else:
    print(f"✅ Successfully loaded {len(documents)} pages.")
    
    # Split text into chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
    chunks = text_splitter.split_documents(documents)
    print(f"Created {len(chunks)} text chunks.")

    # 2. Use the EXACT string from your successful test
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001", 
        google_api_key=api_key,
        task_type="retrieval_document"
    )

    print("--- Step 2: Creating Vector Database ---")
    # Delete the old 'db' folder if it exists to avoid conflicts
    vector_db = Chroma.from_documents(
        documents=chunks, 
        embedding=embeddings, 
        persist_directory="./db"
    )
    print("✅ SUCCESS: Knowledge Base Created! You now have a './db' folder.")