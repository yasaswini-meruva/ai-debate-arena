from groq import Groq
import os
from dotenv import load_dotenv
from rag_engine import retrieve_evidence

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_argument(side, topic, previous_argument=None, use_rag=False):
    # Get evidence from RAG if PDF uploaded
    evidence = ""
    if use_rag:
        query = f"{topic} {'supporting' if side == 'for' else 'opposing'} arguments"
        evidence = retrieve_evidence(query)
        evidence_prompt = f"\n\nUse this evidence from the document:\n{evidence}\n\nCite page numbers in your argument."
    else:
        evidence_prompt = ""

    if side == "for":
        system_msg = f"You are a confident debater arguing strongly FOR: '{topic}'. Be sharp and convincing. Max 5 lines.{evidence_prompt}"
    else:
        system_msg = f"You are a confident debater arguing strongly AGAINST: '{topic}'. Be sharp and convincing. Max 5 lines.{evidence_prompt}"

    user_msg = f"Give your argument for this debate topic: '{topic}'"
    if previous_argument:
        user_msg += f"\n\nCounter this opponent argument directly: '{previous_argument}'"

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_msg}
        ]
    )
    return response.choices[0].message.content

def fact_check(claim, topic):
    """Fact checker agent verifies claims against document"""
    evidence = retrieve_evidence(claim)
    
    prompt = f"""You are a strict fact checker. 
Topic: {claim}
Evidence from document:
{evidence}

Is this claim supported by the document? 
Reply in this exact format:
VERDICT: [SUPPORTED/UNSUPPORTED/PARTIALLY SUPPORTED]
REASON: [one line explanation]"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are a strict, neutral fact checker."},
            {"role": "user", "content": prompt}
        ]
    )
    return response.choices[0].message.content

def get_judge_verdict(topic, rounds, use_rag=False):
    history = ""
    for i, r in enumerate(rounds):
        history += f"Round {i+1}:\nFOR: {r['for']}\nAGAINST: {r['against']}\n\n"

    rag_note = "Also evaluate how well each side used the document evidence." if use_rag else ""

    prompt = f"""You are a neutral judge for a debate on: '{topic}'
{rag_note}
Here are all the arguments:
{history}

Score each side on:
- Logic (1-10)
- Evidence Quality (1-10)  
- Rebuttal Strength (1-10)

Give total scores and declare winner. Keep it under 8 lines."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are a neutral, fair debate judge."},
            {"role": "user", "content": prompt}
        ]
    )
    return response.choices[0].message.content

def run_debate(topic, num_rounds=3, use_rag=False):
    rounds = []
    fact_checks = []

    for i in range(num_rounds):
        prev = rounds[-1]["against"] if rounds else None
        for_arg = get_argument("for", topic, prev, use_rag)
        against_arg = get_argument("against", topic, for_arg, use_rag)
        rounds.append({"for": for_arg, "against": against_arg})

        # Fact check if RAG enabled
        if False:
            for_check = fact_check(for_arg, topic)
            against_check = fact_check(against_arg, topic)
            fact_checks.append({
                "for": for_check,
                "against": against_check
            })

    verdict = get_judge_verdict(topic, rounds, use_rag)
    
    return {
        "topic": topic,
        "rounds": rounds,
        "fact_checks": fact_checks if use_rag else [],
        "verdict": verdict,
        "used_rag": use_rag
    }

if __name__ == "__main__":
    result = run_debate("Python is better than Java", use_rag=False)
    for i, r in enumerate(result["rounds"]):
        print(f"\n--- Round {i+1} ---")
        print(f"FOR: {r['for']}")
        print(f"AGAINST: {r['against']}")
    print(f"\n--- JUDGE VERDICT ---\n{result['verdict']}")