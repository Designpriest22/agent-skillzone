import json, base64, sys
src = open('src.html').read()
g = open('glyphs.json').read()
logo = base64.b64encode(open('logo-4x.png','rb').read()).decode()
out = src.replace('__GLYPHS__', g).replace('__LOGO__', 'data:image/png;base64,' + logo)
dst = sys.argv[1] if len(sys.argv) > 1 else 'flatline.html'
open(dst, 'w').write(out)
print(dst, len(out)//1024, 'KB')
