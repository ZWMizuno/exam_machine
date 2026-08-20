import io

path = 'js/pages/t4-wrongbook.js'
with io.open(path, 'r', encoding='utf-8') as f:
    c = f.read()

old = '<div class="book-name" style="font-family:\\\'SourceHanSansOLD-Heavy\\\',\\\'Source Han Sans OLD Heavy\\\',\\\'Noto Sans CJK SC\\\',sans-serif;font-weight:900">'
new = '<div class="book-name">'

if old in c:
    c2 = c.replace(old, new)
    with io.open(path, 'w', encoding='utf-8') as f:
        f.write(c2)
    print('OK replaced')
else:
    print('NOT FOUND, snippet:')
    idx = c.find('book-name')
    print(repr(c[idx:idx+250]))
