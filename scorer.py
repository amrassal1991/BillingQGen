import json, argparse, datetime, sys

def score_answer(q, user):
    t = q['type']
    p = q['answer_key']
    if t == 'ledger':
        correct = p['prev_balance'] - p['payment_made'] + p['new_charges']
    elif t == 'proration':
        sd = datetime.datetime.strptime(p['start_date'], '%Y-%m-%d')
        ym = (sd.year, sd.month % 12 + 1)
        days = (datetime.date(ym[0], ym[1], 1) - datetime.date(sd.year, sd.month, 1)).days
        correct = round((days - sd.day + 1) * (p['monthly_rate'] / days), 2)
    else:
        return None, None
    try:
        is_correct = abs(float(user) - correct) < 0.01
    except:
        return False, correct
    return is_correct, correct

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('exam_file')
    parser.add_argument('answers_file')
    args = parser.parse_args()

    data = json.load(open(args.exam_file))
    answers = json.load(open(args.answers_file))
    report = []
    score = 0

    for q in data['exam']:
        user_ans = answers.get(q['id'], '')
        ok, exp = score_answer(q, user_ans)
        report.append({
            'id': q['id'],
            'text': q['text'],
            'your_answer': user_ans,
            'correct_answer': exp,
            'correct': ok,
            'explanation': q['explanation']
        })
        if ok:
            score += 1

    print(f"Score: {score}/{len(report)}")
    for r in report:
        mark = '✔' if r['correct'] else '✖'
        print(f"\n[{mark}] {r['id']} - {r['text']}")
        print(f"Your: {r['your_answer']}, Expected: {r['correct_answer']}")
        print(f"Note: {r['explanation']}")