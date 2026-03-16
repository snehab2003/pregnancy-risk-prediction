import os
from django.conf import settings
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate

# Function to get the configured rag chain
def get_rag_chain():
    # Use the DB built in Pregnancy_Chat_Bot
    db_path = os.path.join(settings.BASE_DIR.parent, 'Pregnancy_Chat_Bot', 'db')
    
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001", 
        google_api_key=settings.GOOGLE_API_KEY
    )
    
    vector_db = Chroma(persist_directory=db_path, embedding_function=embeddings)
    retriever = vector_db.as_retriever(search_kwargs={"k": 3})
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-3-flash-preview", 
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=0.2
    )

    system_prompt = (
        "You are an empathetic, professional Pregnancy Assistant and Explainable AI (XAI) guide. "
        "Use the provided medical context to answer the user's questions. "
        "If the user asks about their personal health data or risk prediction, refer to the 'USER PROFILE AND HEALTH DATA' section to explain the context of their risk level. "
        "\n\n"
        "RULES:\n"
        "1. Always include a short medical disclaimer (\"This AI provides guidance based on medical literature but is not a substitute for professional medical advice.\").\n"
        "2. If the answer isn't in the context, say you don't know but offer general support.\n"
        "3. Be warm and empathetic.\n"
        "4. When explaining a 'HIGH RISK' or 'MEDIUM RISK' prediction, be calming, factual, and point out the specific factors (e.g. high blood pressure or blood sugar) contributing to it, advising them to consult a doctor.\n\n"
        "USER PROFILE AND HEALTH DATA:\n"
        "{user_context}\n\n"
        "MEDICAL CONTEXT FROM KNOWLEDGE BASE:\n"
        "{context}"
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}"),
    ])

    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, question_answer_chain)
    
    return rag_chain

def ask_chatbot(user_input, user_context_str):
    rag_chain = get_rag_chain()
    try:
        response = rag_chain.invoke({
            "input": user_input,
            "user_context": user_context_str
        })
        return response['answer']
    except Exception as e:
        return f"I'm sorry, I encountered an error while thinking: {str(e)}"
