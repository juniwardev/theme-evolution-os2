import json, sys, collections
a = json.load(open(sys.argv[1]))
b = json.load(open(sys.argv[2]))
keys = ['lst', 'lsp', 'pis', 'pl', 'td', 'tdt']
tot = collections.Counter()
for page in a:
    ra, rb = a[page], b[page]
    if len(ra) != len(rb):
        print('COUNT', page, len(ra), len(rb))
    for x, y in zip(ra, rb):
        tot[x['w']] += 1
        if x['t'] != y['t'] or x['txt'] != y['txt']:
            print('MISPAIR', page, x['txt'], y['txt'])
            continue
        d = {k: (x[k], y[k]) for k in keys if x[k] != y[k]}
        if d:
            print('DIFF', page, x['w'], x['t'], x['cls'], repr(x['txt']), d)
print('compared by location', dict(tot), 'total', sum(tot.values()))
