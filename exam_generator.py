import json, random, argparse, sys

def load_bank(path):
    with open(path) as f:
        return json.load(f)["questions"]

def pick_questions(bank, counts):
    selected = []
    for diff, n in counts.items():
        pool = [q for q in bank if q["difficulty"] == diff]
        if len(pool) < n:
            raise RuntimeError(f"Not enough {diff} questions in bank")
        selected += random.sample(pool, n)
    return selected

def fill_params(q):
    today = __import__('datetime').date.today()
    delta = random.randint(1, 20)
    td = __import__('datetime').timedelta
    p = {
        'start_date': (today - delta * td(days=1)).isoformat(),
        'monthly_rate': random.choice([50, 90, 120]),
        'prev_balance': round(random.uniform(30, 200), 2),
        'payment_made': round(random.uniform(10, 100), 2),
        'new_charges': round(random.uniform(10, 90), 2),
        'cancel_date': (today - td(days=10)).isoformat(),
        'reactivate_date': (today - td(days=5)).isoformat(),
        'reversal_amount': random.choice([35.0, 70.0]),
        'reversal_date': (today - td(days=7)).isoformat()
    }
    text = q['prompt'].format(**p)
    return {
        'id': q['id'],
        'type': q['type'],
        'difficulty': q['difficulty'],
        'text': text,
        'answer_key': p,
        'explanation': q['explanation']
    }

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-b', '--bank', required=True)
    parser.add_argument('-n', '--number', type=int, default=10)
    parser.add_argument('-d', '--dist', nargs=3, type=int, metavar=('MOD','HARD','BRU'), default=[4,3,3])
    parser.add_argument('-o', '--out', default='exam.json')
    args = parser.parse_args()

    bank = load_bank(args.bank)
    dist = dict(zip(['moderate','hard','brutal'], args.dist))
    if sum(dist.values()) != args.number:
        sys.exit('Error: sum of distribution does not equal number of questions')
    questions = pick_questions(bank, dist)
    exam = [fill_params(q) for q in questions]

    with open(args.out, 'w') as f:
        json.dump({'exam': exam}, f, indent=2)