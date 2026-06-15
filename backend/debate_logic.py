from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_argument(side, topic, previous_argument=None):
    if side == "for":
        system_msg = f"You are a confident debater arguing strongly FOR: '{topic}'. Be sharp and convincing. Max 4 lines."
    else:
        system_msg = f"You are a confident debater arguing strongly AGAINST: '{topic}'. Be sharp and convincing. Max 4 lines."

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

def get_judge_verdict(topic, rounds):
    history = ""
    for i, r in enumerate(rounds):
        history += f"Round {i+1}:\nFOR: {r['for']}\nAGAINST: {r['against']}\n\n"

    prompt = f"""You are a neutral judge for a debate on: '{topic}'
Here are all the arguments:
{history}
Give your verdict — who argued better and why? 
Give scores out of 10 for each side. Keep it under 5 lines."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are a neutral, fair debate judge."},
            {"role": "user", "content": prompt}
        ]
    )
    return response.choices[0].message.content

def run_debate(topic, num_rounds=3):
    rounds = []
    for i in range(num_rounds):
        prev = rounds[-1]["against"] if rounds else None
        for_arg = get_argument("for", topic, prev)
        against_arg = get_argument("against", topic, for_arg)
        rounds.append({"for": for_arg, "against": against_arg})

    verdict = get_judge_verdict(topic, rounds)
    return {"topic": topic, "rounds": rounds, "verdict": verdict}

if __name__ == "__main__":
    result = run_debate("Python is better than Java")
    for i, r in enumerate(result["rounds"]):
        print(f"\n--- Round {i+1} ---")
        print(f"FOR: {r['for']}")
        print(f"AGAINST: {r['against']}")
    print(f"\n--- JUDGE VERDICT ---\n{result['verdict']}")