# Inlines the Outside in the City logo (PNG, base64) into the template -> tcm.html
import pathlib,base64; d=pathlib.Path(__file__).parent
uri='data:image/png;base64,'+base64.b64encode((d/'outside-logo.png').read_bytes()).decode()
(d/'tcm.html').write_text((d/'tcm.template.html').read_text().replace('%%LOGO%%',uri))
