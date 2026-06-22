import pdfplumber
import chromadb
from sentence_transformers import SentenceTransformer
import os

# Initialize
model = SentenceTransformer('all-MiniLM-L6-v2')
client = chromadb.Client()

# Create collection
collection_name = "debate_docs"
try:
    collection = client.get_collection(collection_name)
except:
    collection = client.create_collection(collection_name)

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF"""
    text_chunks = []
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                # Split into chunks of ~200 words
                words = text.split()
                for i in range(0, len(words), 200):
                    chunk = " ".join(words[i:i+200])
                    text_chunks.append({
                        "text": chunk,
                        "page": page_num + 1
                    })
    return text_chunks

def store_in_chromadb(chunks, doc_id="uploaded_doc"):
    """Store chunks in ChromaDB"""
    # Clear existing data
    try:
        collection.delete(where={"doc_id": doc_id})
    except:
        pass

    texts = [c["text"] for c in chunks]
    embeddings = model.encode(texts).tolist()
    ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"page": c["page"], "doc_id": doc_id} for c in chunks]

    collection.add(
        embeddings=embeddings,
        documents=texts,
        metadatas=metadatas,
        ids=ids
    )
    return len(chunks)

def retrieve_evidence(query, n_results=3):
    """Retrieve relevant evidence for a query"""
    query_embedding = model.encode([query]).tolist()
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=n_results
    )
    
    evidence = []
    for i, doc in enumerate(results['documents'][0]):
        page = results['metadatas'][0][i]['page']
        evidence.append(f"[Page {page}]: {doc}")
    
    return "\n\n".join(evidence)

def process_pdf(pdf_path):
    chunks = extract_text_from_pdf(pdf_path)
    return len(chunks)

# Test
if __name__ == "__main__":
    print("RAG Engine ready!")
    print("Collection:", collection_name)