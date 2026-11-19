# Inlines the traced TCM mark into the template -> tcm.html
import pathlib; d=pathlib.Path(__file__).parent
(d/'tcm.html').write_text((d/'tcm.template.html').read_text().replace('%%PATH%%',(d/'tcm-mark.path.txt').read_text().strip()))
